import { promises as fs } from "fs";
import path from "path";

import {
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { signToken, verifyToken } from "@/lib/server/auth";
import { env } from "@/lib/server/env";
import { ApiError } from "@/lib/server/http";

export type ObjectMetadata = { contentLength: number; contentType: string };

export interface ObjectStorage {
  readonly kind: "local" | "r2";
  createUploadUrl(storageKey: string, contentType: string, expiresIn: number): Promise<string>;
  putObject(storageKey: string, contentType: string, content: Buffer): Promise<void>;
  objectMetadata(storageKey: string): Promise<ObjectMetadata>;
  createDownloadUrl(storageKey: string, expiresIn: number): Promise<string>;
}

/** Disk-backed object storage for local development only. */
export class LocalObjectStorage implements ObjectStorage {
  readonly kind = "local" as const;
  private readonly root: string;

  constructor() {
    this.root = path.resolve(env.localStoragePath);
  }

  private objectPath(storageKey: string): string {
    const resolved = path.resolve(this.root, storageKey);
    if (!resolved.startsWith(this.root + path.sep)) {
      throw new Error("Invalid storage key");
    }
    return resolved;
  }

  async createUploadUrl(storageKey: string, contentType: string, expiresIn: number): Promise<string> {
    const token = await signToken(
      { storage_key: storageKey, content_type: contentType, purpose: "local_object_upload" },
      expiresIn,
    );
    return `${env.localStorageBaseUrl.replace(/\/+$/, "")}/api/v1/uploads/local/${token}`;
  }

  async putObject(storageKey: string, contentType: string, content: Buffer): Promise<void> {
    const filePath = this.objectPath(storageKey);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, content);
    await fs.writeFile(
      `${filePath}.metadata.json`,
      JSON.stringify({ ContentLength: content.length, ContentType: contentType }),
      "utf-8",
    );
  }

  async objectMetadata(storageKey: string): Promise<ObjectMetadata> {
    const filePath = this.objectPath(storageKey);
    const metadataRaw = await fs.readFile(`${filePath}.metadata.json`, "utf-8");
    await fs.stat(filePath);
    const metadata = JSON.parse(metadataRaw) as { ContentLength: number; ContentType: string };
    return { contentLength: metadata.ContentLength, contentType: metadata.ContentType };
  }

  async createDownloadUrl(storageKey: string, expiresIn: number): Promise<string> {
    const token = await signToken(
      { storage_key: storageKey, purpose: "local_object_download" },
      expiresIn,
    );
    return `${env.localStorageBaseUrl.replace(/\/+$/, "")}/api/v1/uploads/local-download/${token}`;
  }

  async readObject(storageKey: string): Promise<{ content: Buffer; contentType: string }> {
    const metadata = await this.objectMetadata(storageKey);
    const content = await fs.readFile(this.objectPath(storageKey));
    return { content, contentType: metadata.contentType };
  }
}

export class R2Storage implements ObjectStorage {
  readonly kind = "r2" as const;
  private readonly bucket: string;
  private readonly client: S3Client;

  constructor() {
    const missing = Object.entries({
      R2_ENDPOINT_URL: env.r2EndpointUrl,
      R2_ACCESS_KEY_ID: env.r2AccessKeyId,
      R2_SECRET_ACCESS_KEY: env.r2SecretAccessKey,
      R2_BUCKET_NAME: env.r2BucketName,
    })
      .filter(([, value]) => !value)
      .map(([name]) => name);
    if (missing.length > 0) {
      throw new Error(`Object storage is not configured: ${missing.join(", ")}`);
    }
    this.bucket = env.r2BucketName as string;
    this.client = new S3Client({
      endpoint: env.r2EndpointUrl as string,
      region: "auto",
      credentials: {
        accessKeyId: env.r2AccessKeyId as string,
        secretAccessKey: env.r2SecretAccessKey as string,
      },
    });
  }

  async createUploadUrl(storageKey: string, contentType: string, expiresIn: number): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: storageKey,
      ContentType: contentType,
    });
    return getSignedUrl(this.client, command, { expiresIn });
  }

  async objectMetadata(storageKey: string): Promise<ObjectMetadata> {
    const head = await this.client.send(
      new HeadObjectCommand({ Bucket: this.bucket, Key: storageKey }),
    );
    return {
      contentLength: head.ContentLength ?? -1,
      contentType: head.ContentType ?? "",
    };
  }

  async putObject(storageKey: string, contentType: string, content: Buffer): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: storageKey,
        Body: content,
        ContentLength: content.length,
        ContentType: contentType,
      }),
    );
  }

  async createDownloadUrl(storageKey: string, expiresIn: number): Promise<string> {
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: storageKey });
    return getSignedUrl(this.client, command, { expiresIn });
  }
}

let cachedStorage: ObjectStorage | null = null;

export function getStorage(): ObjectStorage {
  if (cachedStorage) return cachedStorage;
  if (env.storageBackend === "local") {
    if (env.environment !== "development") {
      throw new Error("Local object storage is restricted to development");
    }
    cachedStorage = new LocalObjectStorage();
  } else if (env.storageBackend === "r2") {
    cachedStorage = new R2Storage();
  } else {
    throw new Error(`Unknown storage backend: ${env.storageBackend}`);
  }
  return cachedStorage;
}

export function storageOr503(): ObjectStorage {
  try {
    return getStorage();
  } catch (error) {
    throw new ApiError(503, error instanceof Error ? error.message : "Object storage unavailable");
  }
}

export async function verifyPurposeToken(
  token: string,
  purpose: string,
): Promise<Record<string, unknown>> {
  const claims = await verifyToken(token);
  if (claims.purpose !== purpose) {
    throw new Error("wrong token purpose");
  }
  return claims;
}
