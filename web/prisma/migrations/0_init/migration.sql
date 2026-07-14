-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "full_name" VARCHAR(160) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "is_active" BOOLEAN NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL,
    "name" VARCHAR(40) NOT NULL,
    "description" VARCHAR(255),

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "user_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_id","role_id")
);

-- CreateTable
CREATE TABLE "language_groups" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "language_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "languages" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "local_name" VARCHAR(120),
    "iso_code" VARCHAR(12),
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL,
    "group_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "languages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dialects" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "local_name" VARCHAR(120),
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL,
    "language_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dialects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "speech_communities" (
    "id" UUID NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "district" VARCHAR(120),
    "village" VARCHAR(120),
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL,
    "language_id" UUID,
    "dialect_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "speech_communities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contributions" (
    "id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "contribution_type" VARCHAR(40) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT NOT NULL,
    "language_id" UUID NOT NULL,
    "dialect_id" UUID,
    "target_language_id" UUID,
    "target_dialect_id" UUID,
    "speech_community_id" UUID,
    "category_id" UUID NOT NULL,
    "domain" VARCHAR(120) NOT NULL,
    "tags" JSON NOT NULL,
    "source" VARCHAR(200) NOT NULL,
    "license_type" VARCHAR(80) NOT NULL,
    "status" VARCHAR(30) NOT NULL,
    "quality_score" DOUBLE PRECISION,
    "version" INTEGER NOT NULL,
    "is_synthetic" BOOLEAN NOT NULL,
    "human_verified" BOOLEAN NOT NULL,
    "submitted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contributions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "translation_pairs" (
    "id" UUID NOT NULL,
    "contribution_id" UUID NOT NULL,
    "source_text" TEXT NOT NULL,
    "target_text" TEXT NOT NULL,
    "context" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "translation_pairs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consents" (
    "id" UUID NOT NULL,
    "contributor_id" UUID NOT NULL,
    "contribution_id" UUID NOT NULL,
    "consent_version" VARCHAR(30) NOT NULL,
    "accepted_at" TIMESTAMPTZ(6) NOT NULL,
    "use_for_ai_training" BOOLEAN NOT NULL,
    "use_for_research" BOOLEAN NOT NULL,
    "use_for_commercial" BOOLEAN NOT NULL,
    "allow_open_release" BOOLEAN NOT NULL,
    "allow_attribution" BOOLEAN NOT NULL,

    CONSTRAINT "consents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_threads" (
    "id" UUID NOT NULL,
    "contribution_id" UUID NOT NULL,
    "speaker_count" INTEGER NOT NULL,
    "context" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversation_threads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_turns" (
    "id" UUID NOT NULL,
    "conversation_id" UUID NOT NULL,
    "turn_order" INTEGER NOT NULL,
    "speaker_label" VARCHAR(80) NOT NULL,
    "speaker_role" VARCHAR(80),
    "source_text" TEXT NOT NULL,
    "target_text" TEXT,
    "notes" TEXT,
    "review_status" VARCHAR(30) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversation_turns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contribution_assets" (
    "id" UUID NOT NULL,
    "contribution_id" UUID NOT NULL,
    "uploaded_by" UUID NOT NULL,
    "storage_key" VARCHAR(500) NOT NULL,
    "original_filename" VARCHAR(255) NOT NULL,
    "media_type" VARCHAR(30) NOT NULL,
    "content_type" VARCHAR(120) NOT NULL,
    "file_size" INTEGER NOT NULL,
    "checksum" VARCHAR(128),
    "duration" DOUBLE PRECISION,
    "file_format" VARCHAR(20) NOT NULL,
    "status" VARCHAR(30) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contribution_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "image_annotations" (
    "id" UUID NOT NULL,
    "asset_id" UUID NOT NULL,
    "created_by" UUID NOT NULL,
    "label_name" VARCHAR(160) NOT NULL,
    "label_language_id" UUID,
    "label_translation" VARCHAR(160),
    "annotation_type" VARCHAR(30) NOT NULL,
    "x_min" DOUBLE PRECISION,
    "y_min" DOUBLE PRECISION,
    "x_max" DOUBLE PRECISION,
    "y_max" DOUBLE PRECISION,
    "confidence" DOUBLE PRECISION,
    "review_status" VARCHAR(30) NOT NULL,
    "is_synthetic" BOOLEAN NOT NULL,
    "human_verified" BOOLEAN NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "image_annotations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "synthetic_examples" (
    "id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "example_type" VARCHAR(40) NOT NULL,
    "content" JSON NOT NULL,
    "language_id" UUID,
    "synthetic_source_model" VARCHAR(160) NOT NULL,
    "prompt_used" TEXT,
    "generated_at" TIMESTAMPTZ(6) NOT NULL,
    "human_verified" BOOLEAN NOT NULL,
    "review_status" VARCHAR(30) NOT NULL,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "synthetic_examples_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "datasets" (
    "id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "filters" JSON NOT NULL,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "datasets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dataset_items" (
    "id" UUID NOT NULL,
    "dataset_id" UUID NOT NULL,
    "contribution_id" UUID NOT NULL,

    CONSTRAINT "dataset_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dataset_exports" (
    "id" UUID NOT NULL,
    "dataset_id" UUID NOT NULL,
    "export_format" VARCHAR(20) NOT NULL,
    "status" VARCHAR(30) NOT NULL,
    "item_count" INTEGER NOT NULL,
    "manifest" JSON NOT NULL,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dataset_exports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" UUID NOT NULL,
    "contribution_id" UUID NOT NULL,
    "reviewer_id" UUID NOT NULL,
    "action" VARCHAR(30) NOT NULL,
    "notes" TEXT,
    "quality_score" DOUBLE PRECISION,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallets" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "pending_coins" INTEGER NOT NULL,
    "earned_coins" INTEGER NOT NULL,
    "redeemed_coins" INTEGER NOT NULL,
    "expired_coins" INTEGER NOT NULL,
    "total_lifetime_coins" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coin_transactions" (
    "id" UUID NOT NULL,
    "wallet_id" UUID NOT NULL,
    "contribution_id" UUID,
    "amount" INTEGER NOT NULL,
    "transaction_type" VARCHAR(30) NOT NULL,
    "status" VARCHAR(30) NOT NULL,
    "reason" VARCHAR(255) NOT NULL,
    "approved_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "coin_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "language_groups_name_key" ON "language_groups"("name");

-- CreateIndex
CREATE INDEX "languages_name_idx" ON "languages"("name");

-- CreateIndex
CREATE INDEX "languages_iso_code_idx" ON "languages"("iso_code");

-- CreateIndex
CREATE UNIQUE INDEX "languages_name_group_id_key" ON "languages"("name", "group_id");

-- CreateIndex
CREATE INDEX "dialects_language_id_idx" ON "dialects"("language_id");

-- CreateIndex
CREATE UNIQUE INDEX "dialects_name_language_id_key" ON "dialects"("name", "language_id");

-- CreateIndex
CREATE INDEX "speech_communities_name_idx" ON "speech_communities"("name");

-- CreateIndex
CREATE INDEX "speech_communities_district_idx" ON "speech_communities"("district");

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE INDEX "contributions_author_id_idx" ON "contributions"("author_id");

-- CreateIndex
CREATE INDEX "contributions_contribution_type_idx" ON "contributions"("contribution_type");

-- CreateIndex
CREATE INDEX "contributions_language_id_idx" ON "contributions"("language_id");

-- CreateIndex
CREATE INDEX "contributions_target_language_id_idx" ON "contributions"("target_language_id");

-- CreateIndex
CREATE INDEX "contributions_category_id_idx" ON "contributions"("category_id");

-- CreateIndex
CREATE INDEX "contributions_status_idx" ON "contributions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "translation_pairs_contribution_id_key" ON "translation_pairs"("contribution_id");

-- CreateIndex
CREATE UNIQUE INDEX "consents_contribution_id_key" ON "consents"("contribution_id");

-- CreateIndex
CREATE INDEX "consents_contributor_id_idx" ON "consents"("contributor_id");

-- CreateIndex
CREATE UNIQUE INDEX "conversation_threads_contribution_id_key" ON "conversation_threads"("contribution_id");

-- CreateIndex
CREATE INDEX "conversation_turns_conversation_id_idx" ON "conversation_turns"("conversation_id");

-- CreateIndex
CREATE UNIQUE INDEX "conversation_turns_conversation_id_turn_order_key" ON "conversation_turns"("conversation_id", "turn_order");

-- CreateIndex
CREATE UNIQUE INDEX "contribution_assets_storage_key_key" ON "contribution_assets"("storage_key");

-- CreateIndex
CREATE INDEX "contribution_assets_contribution_id_idx" ON "contribution_assets"("contribution_id");

-- CreateIndex
CREATE INDEX "contribution_assets_uploaded_by_idx" ON "contribution_assets"("uploaded_by");

-- CreateIndex
CREATE INDEX "contribution_assets_media_type_idx" ON "contribution_assets"("media_type");

-- CreateIndex
CREATE INDEX "contribution_assets_status_idx" ON "contribution_assets"("status");

-- CreateIndex
CREATE INDEX "image_annotations_asset_id_idx" ON "image_annotations"("asset_id");

-- CreateIndex
CREATE INDEX "image_annotations_created_by_idx" ON "image_annotations"("created_by");

-- CreateIndex
CREATE INDEX "synthetic_examples_example_type_idx" ON "synthetic_examples"("example_type");

-- CreateIndex
CREATE INDEX "synthetic_examples_language_id_idx" ON "synthetic_examples"("language_id");

-- CreateIndex
CREATE UNIQUE INDEX "datasets_name_key" ON "datasets"("name");

-- CreateIndex
CREATE INDEX "dataset_items_dataset_id_idx" ON "dataset_items"("dataset_id");

-- CreateIndex
CREATE INDEX "dataset_items_contribution_id_idx" ON "dataset_items"("contribution_id");

-- CreateIndex
CREATE INDEX "dataset_exports_dataset_id_idx" ON "dataset_exports"("dataset_id");

-- CreateIndex
CREATE INDEX "reviews_contribution_id_idx" ON "reviews"("contribution_id");

-- CreateIndex
CREATE INDEX "reviews_reviewer_id_idx" ON "reviews"("reviewer_id");

-- CreateIndex
CREATE INDEX "reviews_action_idx" ON "reviews"("action");

-- CreateIndex
CREATE UNIQUE INDEX "wallets_user_id_key" ON "wallets"("user_id");

-- CreateIndex
CREATE INDEX "coin_transactions_wallet_id_idx" ON "coin_transactions"("wallet_id");

-- CreateIndex
CREATE INDEX "coin_transactions_contribution_id_idx" ON "coin_transactions"("contribution_id");

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "languages" ADD CONSTRAINT "languages_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "language_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dialects" ADD CONSTRAINT "dialects_language_id_fkey" FOREIGN KEY ("language_id") REFERENCES "languages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "speech_communities" ADD CONSTRAINT "speech_communities_language_id_fkey" FOREIGN KEY ("language_id") REFERENCES "languages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "speech_communities" ADD CONSTRAINT "speech_communities_dialect_id_fkey" FOREIGN KEY ("dialect_id") REFERENCES "dialects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contributions" ADD CONSTRAINT "contributions_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contributions" ADD CONSTRAINT "contributions_language_id_fkey" FOREIGN KEY ("language_id") REFERENCES "languages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contributions" ADD CONSTRAINT "contributions_dialect_id_fkey" FOREIGN KEY ("dialect_id") REFERENCES "dialects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contributions" ADD CONSTRAINT "contributions_target_language_id_fkey" FOREIGN KEY ("target_language_id") REFERENCES "languages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contributions" ADD CONSTRAINT "contributions_target_dialect_id_fkey" FOREIGN KEY ("target_dialect_id") REFERENCES "dialects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contributions" ADD CONSTRAINT "contributions_speech_community_id_fkey" FOREIGN KEY ("speech_community_id") REFERENCES "speech_communities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contributions" ADD CONSTRAINT "contributions_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "translation_pairs" ADD CONSTRAINT "translation_pairs_contribution_id_fkey" FOREIGN KEY ("contribution_id") REFERENCES "contributions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consents" ADD CONSTRAINT "consents_contributor_id_fkey" FOREIGN KEY ("contributor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consents" ADD CONSTRAINT "consents_contribution_id_fkey" FOREIGN KEY ("contribution_id") REFERENCES "contributions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_threads" ADD CONSTRAINT "conversation_threads_contribution_id_fkey" FOREIGN KEY ("contribution_id") REFERENCES "contributions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_turns" ADD CONSTRAINT "conversation_turns_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversation_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contribution_assets" ADD CONSTRAINT "contribution_assets_contribution_id_fkey" FOREIGN KEY ("contribution_id") REFERENCES "contributions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contribution_assets" ADD CONSTRAINT "contribution_assets_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "image_annotations" ADD CONSTRAINT "image_annotations_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "contribution_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "image_annotations" ADD CONSTRAINT "image_annotations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "image_annotations" ADD CONSTRAINT "image_annotations_label_language_id_fkey" FOREIGN KEY ("label_language_id") REFERENCES "languages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "synthetic_examples" ADD CONSTRAINT "synthetic_examples_language_id_fkey" FOREIGN KEY ("language_id") REFERENCES "languages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "synthetic_examples" ADD CONSTRAINT "synthetic_examples_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "datasets" ADD CONSTRAINT "datasets_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dataset_items" ADD CONSTRAINT "dataset_items_dataset_id_fkey" FOREIGN KEY ("dataset_id") REFERENCES "datasets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dataset_items" ADD CONSTRAINT "dataset_items_contribution_id_fkey" FOREIGN KEY ("contribution_id") REFERENCES "contributions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dataset_exports" ADD CONSTRAINT "dataset_exports_dataset_id_fkey" FOREIGN KEY ("dataset_id") REFERENCES "datasets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dataset_exports" ADD CONSTRAINT "dataset_exports_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_contribution_id_fkey" FOREIGN KEY ("contribution_id") REFERENCES "contributions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coin_transactions" ADD CONSTRAINT "coin_transactions_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coin_transactions" ADD CONSTRAINT "coin_transactions_contribution_id_fkey" FOREIGN KEY ("contribution_id") REFERENCES "contributions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coin_transactions" ADD CONSTRAINT "coin_transactions_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

