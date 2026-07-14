function intFromEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  const value = raw ? Number(raw) : NaN;
  return Number.isFinite(value) ? value : fallback;
}

export const env = {
  appName: process.env.APP_NAME ?? "BIIDP API",
  environment: process.env.ENVIRONMENT ?? "development",
  jwtSecret: process.env.JWT_SECRET ?? "development-only-change-me-at-least-32-bytes",
  accessTokenMinutes: intFromEnv("ACCESS_TOKEN_MINUTES", 60),
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID || null,
  storageBackend: process.env.STORAGE_BACKEND ?? "r2",
  localStoragePath: process.env.LOCAL_STORAGE_PATH ?? "./local-storage",
  localStorageBaseUrl: process.env.LOCAL_STORAGE_BASE_URL ?? "http://localhost:3000",
  maxUploadBytes: intFromEnv("MAX_UPLOAD_BYTES", 524_288_000),
  r2EndpointUrl: process.env.R2_ENDPOINT_URL || null,
  r2AccessKeyId: process.env.R2_ACCESS_KEY_ID || null,
  r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY || null,
  r2BucketName: process.env.R2_BUCKET_NAME || null,
};
