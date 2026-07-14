import { z } from "zod";

// Request schemas mirror api/app/schemas (Pydantic). Optional nullable fields
// accept both missing and null, like `str | None = None`.

const uuid = z.string().uuid();
const optionalText = z.string().nullish().transform((value) => value ?? null);

const optionalString = (max: number) =>
  z.string().max(max).nullish().transform((value) => value ?? null);

const optionalUuid = uuid.nullish().transform((value) => value ?? null);

export const registerRequest = z.object({
  email: z.string().email(),
  full_name: z.string().min(2).max(160),
  password: z.string().min(10).max(128),
});

export const loginRequest = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const firebaseLoginRequest = z.object({
  id_token: z.string().min(20),
  full_name: optionalString(160),
});

const taxonomyBase = {
  name: z.string().min(1).max(160),
  description: optionalText,
  is_active: z.boolean().default(true),
};

export const languageGroupCreate = z.object(taxonomyBase);

export const languageCreate = z.object({
  ...taxonomyBase,
  local_name: optionalString(120),
  iso_code: optionalString(12),
  group_id: optionalUuid,
});

export const languageUpdate = z.object({
  name: z.string().min(1).max(120).optional(),
  local_name: z.string().max(120).nullish(),
  iso_code: z.string().max(12).nullish(),
  description: z.string().nullish(),
  group_id: uuid.nullish(),
  is_active: z.boolean().nullish(),
});

export const dialectCreate = z.object({
  ...taxonomyBase,
  language_id: uuid,
  local_name: optionalString(120),
});

export const speechCommunityCreate = z
  .object({
    ...taxonomyBase,
    district: optionalString(120),
    village: optionalString(120),
    language_id: optionalUuid,
    dialect_id: optionalUuid,
  })
  .refine((value) => !(value.dialect_id && !value.language_id), {
    message: "language_id is required when dialect_id is provided",
  });

export const categoryCreate = z.object({
  name: z.string().min(1).max(120),
  description: optionalText,
});

export const CONTRIBUTION_TYPES = [
  "word",
  "sentence",
  "translation",
  "conversation",
  "dialogue",
  "story",
  "proverb",
  "pronunciation",
  "dictionary_entry",
  "audio_recording",
  "image",
  "labeled_image",
  "video",
  "document",
  "object_label",
  "cultural_knowledge",
  "synthetic_example",
  "synthetic_prompt",
] as const;

export const contributionCreate = z
  .object({
    contribution_type: z.enum(CONTRIBUTION_TYPES),
    title: z.string().min(1).max(200),
    description: z.string().min(1),
    language_id: uuid,
    dialect_id: optionalUuid,
    target_language_id: optionalUuid,
    target_dialect_id: optionalUuid,
    speech_community_id: optionalUuid,
    category_id: uuid,
    source_prompt_id: optionalUuid,
    domain: z.string().min(1).max(120),
    tags: z.array(z.string()).max(30).default([]),
    source: z.string().min(1).max(200),
    license_type: z.string().min(1).max(80),
    is_synthetic: z.boolean().default(false),
  })
  .refine(
    (value) => !(value.contribution_type === "translation" && !value.target_language_id),
    { message: "target_language_id is required for translations" },
  );

export const translationCreate = z.object({
  contribution_id: uuid,
  source_text: z.string().min(1),
  target_text: z.string().min(1),
  context: optionalText,
  notes: optionalText,
});

export const consentCreate = z.object({
  consent_version: z.string().min(1).max(30).default("1.0"),
  use_for_ai_training: z.boolean(),
  use_for_research: z.boolean(),
  use_for_commercial: z.boolean(),
  allow_open_release: z.boolean(),
  allow_attribution: z.boolean(),
});

export const conversationCreate = z.object({
  contribution_id: uuid,
  speaker_count: z.number().int().min(1).max(20),
  context: optionalText,
});

export const turnCreate = z.object({
  turn_order: z.number().int().min(1),
  speaker_label: z.string().min(1).max(80),
  speaker_role: optionalString(80),
  source_text: z.string().min(1),
  target_text: optionalText,
  notes: optionalText,
});

export const turnUpdate = z.object({
  turn_order: z.number().int().min(1).optional(),
  speaker_label: z.string().min(1).max(80).optional(),
  speaker_role: z.string().max(80).nullish(),
  source_text: z.string().min(1).optional(),
  target_text: z.string().nullish(),
  notes: z.string().nullish(),
});

export const signedUploadRequest = z.object({
  contribution_id: uuid,
  filename: z.string().min(1).max(255),
  content_type: z.string().min(1).max(120),
  file_size: z.number().int().positive(),
});

export const confirmUploadRequest = z.object({
  upload_token: z.string(),
  checksum: optionalString(128),
  duration: z.number().min(0).nullish().transform((value) => value ?? null),
});

export const reviewRequest = z.object({
  action: z.enum(["approve", "reject", "request_changes"]),
  notes: optionalText,
  quality_score: z.number().min(0).max(100).nullish().transform((value) => value ?? null),
});

export const annotationCreate = z
  .object({
    asset_id: uuid,
    label_name: z.string().min(1).max(160),
    label_language_id: optionalUuid,
    label_translation: optionalString(160),
    annotation_type: z.enum(["classification", "bounding_box", "caption", "ocr"]),
    x_min: z.number().min(0).max(100).nullish().transform((value) => value ?? null),
    y_min: z.number().min(0).max(100).nullish().transform((value) => value ?? null),
    x_max: z.number().min(0).max(100).nullish().transform((value) => value ?? null),
    y_max: z.number().min(0).max(100).nullish().transform((value) => value ?? null),
    confidence: z.number().min(0).max(1).nullish().transform((value) => value ?? null),
    is_synthetic: z.boolean().default(false),
  })
  .superRefine((value, context) => {
    if (value.annotation_type !== "bounding_box") return;
    const coordinates = [value.x_min, value.y_min, value.x_max, value.y_max];
    if (coordinates.some((coordinate) => coordinate === null)) {
      context.addIssue({
        code: "custom",
        message: "All bounding-box coordinates are required",
      });
      return;
    }
    if ((value.x_max as number) <= (value.x_min as number) || (value.y_max as number) <= (value.y_min as number)) {
      context.addIssue({
        code: "custom",
        message: "Bounding-box maximums must exceed minimums",
      });
    }
  });

export const syntheticExampleCreate = z.object({
  title: z.string().min(1).max(200),
  example_type: z.string().min(1).max(40),
  content: z.record(z.string(), z.unknown()),
  language_id: optionalUuid,
  synthetic_source_model: z.string().min(1).max(160),
  prompt_used: optionalText,
});

export const datasetCreate = z.object({
  name: z.string().min(1).max(200),
  description: optionalText,
  language_id: optionalUuid,
  contribution_type: z.string().nullish().transform((value) => value ?? null),
  minimum_quality_score: z.number().min(0).max(100).nullish().transform((value) => value ?? null),
  include_synthetic: z.boolean().default(false),
});
