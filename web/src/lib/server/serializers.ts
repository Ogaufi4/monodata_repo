import type {
  Category,
  CoinTransaction,
  Consent,
  Contribution,
  ContributionAsset,
  ConversationThread,
  ConversationTurn,
  Dataset,
  DatasetExport,
  Dialect,
  ImageAnnotation,
  Language,
  LanguageGroup,
  PromptCompletion,
  PromptItem,
  Review,
  SpeechCommunity,
  SyntheticExample,
  TranslationPair,
  Wallet,
} from "@prisma/client";

import type { AuthenticatedUser } from "@/lib/server/auth";

// Response shapes mirror the Pydantic *Read models in api/app/schemas:
// snake_case keys, ISO-8601 datetimes, explicit nulls.

const iso = (value: Date): string => value.toISOString();
const isoOrNull = (value: Date | null): string | null => (value ? value.toISOString() : null);

export function userResponse(user: AuthenticatedUser) {
  return {
    id: user.id,
    email: user.email,
    full_name: user.fullName,
    is_active: user.isActive,
    roles: user.roles,
  };
}

export function tokenResponse(accessToken: string, user: AuthenticatedUser) {
  return { access_token: accessToken, token_type: "bearer", user: userResponse(user) };
}

export function languageGroupRead(group: LanguageGroup) {
  return {
    name: group.name,
    description: group.description,
    is_active: group.isActive,
    id: group.id,
    created_at: iso(group.createdAt),
    updated_at: iso(group.updatedAt),
  };
}

export function languageRead(language: Language) {
  return {
    name: language.name,
    description: language.description,
    is_active: language.isActive,
    local_name: language.localName,
    iso_code: language.isoCode,
    group_id: language.groupId,
    id: language.id,
    created_at: iso(language.createdAt),
    updated_at: iso(language.updatedAt),
  };
}

export function dialectRead(dialect: Dialect) {
  return {
    name: dialect.name,
    description: dialect.description,
    is_active: dialect.isActive,
    language_id: dialect.languageId,
    local_name: dialect.localName,
    id: dialect.id,
    created_at: iso(dialect.createdAt),
    updated_at: iso(dialect.updatedAt),
  };
}

export function speechCommunityRead(community: SpeechCommunity) {
  return {
    name: community.name,
    description: community.description,
    is_active: community.isActive,
    district: community.district,
    village: community.village,
    language_id: community.languageId,
    dialect_id: community.dialectId,
    id: community.id,
    created_at: iso(community.createdAt),
    updated_at: iso(community.updatedAt),
  };
}

export function categoryRead(category: Category) {
  return {
    name: category.name,
    description: category.description,
    id: category.id,
    is_active: category.isActive,
  };
}

export function contributionRead(contribution: Contribution) {
  return {
    contribution_type: contribution.contributionType,
    title: contribution.title,
    description: contribution.description,
    language_id: contribution.languageId,
    dialect_id: contribution.dialectId,
    target_language_id: contribution.targetLanguageId,
    target_dialect_id: contribution.targetDialectId,
    speech_community_id: contribution.speechCommunityId,
    category_id: contribution.categoryId,
    source_prompt_id: contribution.promptItemId,
    domain: contribution.domain,
    tags: contribution.tags,
    source: contribution.source,
    license_type: contribution.licenseType,
    is_synthetic: contribution.isSynthetic,
    id: contribution.id,
    author_id: contribution.authorId,
    status: contribution.status,
    quality_score: contribution.qualityScore,
    human_verified: contribution.humanVerified,
    version: contribution.version,
    created_at: iso(contribution.createdAt),
    updated_at: iso(contribution.updatedAt),
    submitted_at: isoOrNull(contribution.submittedAt),
  };
}

export function promptItemRead(
  prompt: PromptItem,
  counts?: { completed: number; remaining: number },
) {
  return {
    id: prompt.id,
    source_language: prompt.sourceLanguage,
    source_text: prompt.sourceText,
    prompt_type: prompt.promptType,
    domain: prompt.domain,
    difficulty: prompt.difficulty,
    part_of_speech: prompt.partOfSpeech,
    context: prompt.context,
    example_sentence: prompt.exampleSentence,
    tags: prompt.tags,
    max_repeats: prompt.maxRepeats,
    is_active: prompt.isActive,
    completed_count: counts?.completed,
    remaining_count: counts?.remaining,
    created_at: iso(prompt.createdAt),
    updated_at: iso(prompt.updatedAt),
  };
}

export function promptCompletionRead(completion: PromptCompletion) {
  return {
    id: completion.id,
    prompt_item_id: completion.promptItemId,
    language_id: completion.languageId,
    user_id: completion.userId,
    contribution_id: completion.contributionId,
    task_type: completion.taskType,
    status: completion.status,
    created_at: iso(completion.createdAt),
    updated_at: iso(completion.updatedAt),
  };
}

export function translationRead(translation: TranslationPair) {
  return {
    contribution_id: translation.contributionId,
    source_text: translation.sourceText,
    target_text: translation.targetText,
    context: translation.context,
    notes: translation.notes,
    id: translation.id,
    created_at: iso(translation.createdAt),
    updated_at: iso(translation.updatedAt),
  };
}

export function consentRead(consent: Consent) {
  return {
    consent_version: consent.consentVersion,
    use_for_ai_training: consent.useForAiTraining,
    use_for_research: consent.useForResearch,
    use_for_commercial: consent.useForCommercial,
    allow_open_release: consent.allowOpenRelease,
    allow_attribution: consent.allowAttribution,
    id: consent.id,
    contributor_id: consent.contributorId,
    contribution_id: consent.contributionId,
    accepted_at: iso(consent.acceptedAt),
  };
}

export function conversationRead(conversation: ConversationThread) {
  return {
    contribution_id: conversation.contributionId,
    speaker_count: conversation.speakerCount,
    context: conversation.context,
    id: conversation.id,
    created_at: iso(conversation.createdAt),
    updated_at: iso(conversation.updatedAt),
  };
}

export function turnRead(turn: ConversationTurn) {
  return {
    turn_order: turn.turnOrder,
    speaker_label: turn.speakerLabel,
    speaker_role: turn.speakerRole,
    source_text: turn.sourceText,
    target_text: turn.targetText,
    notes: turn.notes,
    id: turn.id,
    conversation_id: turn.conversationId,
    review_status: turn.reviewStatus,
    created_at: iso(turn.createdAt),
    updated_at: iso(turn.updatedAt),
  };
}

export function conversationDetail(conversation: ConversationThread & { turns: ConversationTurn[] }) {
  return { ...conversationRead(conversation), turns: conversation.turns.map(turnRead) };
}

export function assetRead(asset: ContributionAsset) {
  return {
    id: asset.id,
    contribution_id: asset.contributionId,
    uploaded_by: asset.uploadedBy,
    storage_key: asset.storageKey,
    original_filename: asset.originalFilename,
    media_type: asset.mediaType,
    content_type: asset.contentType,
    file_size: asset.fileSize,
    checksum: asset.checksum,
    duration: asset.duration,
    file_format: asset.fileFormat,
    status: asset.status,
    created_at: iso(asset.createdAt),
  };
}

export function reviewRead(review: Review) {
  return {
    action: review.action,
    notes: review.notes,
    quality_score: review.qualityScore,
    id: review.id,
    contribution_id: review.contributionId,
    reviewer_id: review.reviewerId,
    created_at: iso(review.createdAt),
  };
}

export function walletRead(wallet: Wallet) {
  return {
    id: wallet.id,
    user_id: wallet.userId,
    pending_coins: wallet.pendingCoins,
    earned_coins: wallet.earnedCoins,
    redeemed_coins: wallet.redeemedCoins,
    expired_coins: wallet.expiredCoins,
    total_lifetime_coins: wallet.totalLifetimeCoins,
  };
}

export function coinTransactionRead(transaction: CoinTransaction) {
  return {
    id: transaction.id,
    wallet_id: transaction.walletId,
    contribution_id: transaction.contributionId,
    amount: transaction.amount,
    transaction_type: transaction.transactionType,
    status: transaction.status,
    reason: transaction.reason,
    created_at: iso(transaction.createdAt),
  };
}

export function annotationRead(annotation: ImageAnnotation) {
  return {
    asset_id: annotation.assetId,
    label_name: annotation.labelName,
    label_language_id: annotation.labelLanguageId,
    label_translation: annotation.labelTranslation,
    annotation_type: annotation.annotationType,
    x_min: annotation.xMin,
    y_min: annotation.yMin,
    x_max: annotation.xMax,
    y_max: annotation.yMax,
    confidence: annotation.confidence,
    is_synthetic: annotation.isSynthetic,
    id: annotation.id,
    created_by: annotation.createdBy,
    review_status: annotation.reviewStatus,
    human_verified: annotation.humanVerified,
    created_at: iso(annotation.createdAt),
  };
}

export function syntheticExampleRead(example: SyntheticExample) {
  return {
    title: example.title,
    example_type: example.exampleType,
    content: example.content,
    language_id: example.languageId,
    synthetic_source_model: example.syntheticSourceModel,
    prompt_used: example.promptUsed,
    id: example.id,
    generated_at: iso(example.generatedAt),
    human_verified: example.humanVerified,
    review_status: example.reviewStatus,
    created_by: example.createdBy,
  };
}

export function datasetRead(dataset: Dataset) {
  return {
    id: dataset.id,
    name: dataset.name,
    description: dataset.description,
    filters: dataset.filters,
    created_by: dataset.createdBy,
    created_at: iso(dataset.createdAt),
  };
}

export function datasetExportRead(datasetExport: DatasetExport) {
  return {
    id: datasetExport.id,
    dataset_id: datasetExport.datasetId,
    export_format: datasetExport.exportFormat,
    status: datasetExport.status,
    item_count: datasetExport.itemCount,
    manifest: datasetExport.manifest,
    created_at: iso(datasetExport.createdAt),
  };
}
