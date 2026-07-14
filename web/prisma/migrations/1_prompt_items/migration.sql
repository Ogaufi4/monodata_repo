-- English prompt pool for guided translation and pronunciation tasks.
-- A prompt can be completed a limited number of times per target language.

CREATE TABLE "prompt_items" (
    "id" UUID NOT NULL,
    "source_language" VARCHAR(40) NOT NULL,
    "source_text" VARCHAR(240) NOT NULL,
    "normalized_text" VARCHAR(240) NOT NULL,
    "prompt_type" VARCHAR(30) NOT NULL,
    "domain" VARCHAR(120) NOT NULL,
    "difficulty" VARCHAR(30) NOT NULL,
    "part_of_speech" VARCHAR(40),
    "context" TEXT,
    "example_sentence" TEXT,
    "tags" JSON NOT NULL,
    "max_repeats" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prompt_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "prompt_completions" (
    "id" UUID NOT NULL,
    "prompt_item_id" UUID NOT NULL,
    "language_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "contribution_id" UUID,
    "task_type" VARCHAR(30) NOT NULL,
    "status" VARCHAR(30) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prompt_completions_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "contributions" ADD COLUMN "prompt_item_id" UUID;

CREATE UNIQUE INDEX "prompt_items_source_language_normalized_text_prompt_type_key"
    ON "prompt_items"("source_language", "normalized_text", "prompt_type");
CREATE INDEX "prompt_items_prompt_type_idx" ON "prompt_items"("prompt_type");
CREATE INDEX "prompt_items_domain_idx" ON "prompt_items"("domain");
CREATE INDEX "prompt_items_difficulty_idx" ON "prompt_items"("difficulty");
CREATE INDEX "prompt_items_is_active_idx" ON "prompt_items"("is_active");

CREATE UNIQUE INDEX "prompt_completions_prompt_item_id_language_id_user_id_task_type_key"
    ON "prompt_completions"("prompt_item_id", "language_id", "user_id", "task_type");
CREATE INDEX "prompt_completions_prompt_item_id_language_id_task_type_status_idx"
    ON "prompt_completions"("prompt_item_id", "language_id", "task_type", "status");
CREATE INDEX "prompt_completions_language_id_idx" ON "prompt_completions"("language_id");
CREATE INDEX "prompt_completions_contribution_id_idx" ON "prompt_completions"("contribution_id");
CREATE INDEX "contributions_prompt_item_id_idx" ON "contributions"("prompt_item_id");

ALTER TABLE "contributions"
    ADD CONSTRAINT "contributions_prompt_item_id_fkey"
    FOREIGN KEY ("prompt_item_id") REFERENCES "prompt_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "prompt_completions"
    ADD CONSTRAINT "prompt_completions_prompt_item_id_fkey"
    FOREIGN KEY ("prompt_item_id") REFERENCES "prompt_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "prompt_completions"
    ADD CONSTRAINT "prompt_completions_language_id_fkey"
    FOREIGN KEY ("language_id") REFERENCES "languages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "prompt_completions"
    ADD CONSTRAINT "prompt_completions_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "prompt_completions"
    ADD CONSTRAINT "prompt_completions_contribution_id_fkey"
    FOREIGN KEY ("contribution_id") REFERENCES "contributions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
