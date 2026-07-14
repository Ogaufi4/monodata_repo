Below is the **updated Codex-ready SRS + implementation plan**, including:

**multimodal data, all Botswana languages/dialects, translations, conversations/dialogues, labeled images, video, coins/rewards, synthetic data guidance, R2 storage, PostgreSQL, FastAPI + Next.js on Vercel.**

Copy this into Codex.

---

# Software Requirements Specification

## Botswana Indigenous Intelligence Data Platform

### Version 1.1

### Prepared for Indigenous Intelligence Solutions

## 1. Product Overview

Build a multimodal indigenous data platform for Botswana.

The system must collect, manage, review, clean, label, reward, and export structured datasets for AI training and cultural preservation.

The platform must support:

```txt
Text
Translations
Conversations/dialogues
Audio/voice recordings
Images
Labeled image data
Videos
Documents
Synthetic guidance data
Object labels
Cultural knowledge data
```

---

# 2. Core Stack

Use:

```txt
Frontend: Next.js + TypeScript + TailwindCSS
Backend: FastAPI
Hosting: Vercel for Next.js and FastAPI
Database: PostgreSQL
Storage: Cloudflare R2
Uploads: Signed URLs
Auth: NextAuth/Auth.js or JWT
Future hosting: BOFINET
Future repository: DSpace/custom repository
```

---

# 3. Architecture

```txt
Contributor / Reviewer / Admin
        ↓
Next.js Web App on Vercel
        ↓
FastAPI Backend on Vercel
        ↓
PostgreSQL Metadata Database
        ↓
Cloudflare R2 Media Storage
        ↓
Review + Cleaning Workflow
        ↓
Coins / Points Engine
        ↓
Dataset Export
        ↓
Future BOFINET Repository
        ↓
PuoAI Training / APIs
```

---

# 4. Core Principle

The system must be **contribution-centric**.

A contribution can contain one or more assets.

```txt
Contribution
  ├── Metadata
  ├── Text asset
  ├── Audio asset
  ├── Image asset
  ├── Video asset
  ├── Document asset
  ├── Labels / annotations
  ├── Synthetic data flag
  ├── Consent
  ├── Review
  ├── Coins
  └── Export status
```

---

# 5. Language Taxonomy

The platform shall support Botswana’s indigenous languages, dialects, variants, and speech communities through a flexible, expandable language taxonomy rather than a fixed list.

Taxonomy:

```txt
Language Group
   ↓
Language
   ↓
Dialect / Variant
   ↓
Speech Community / District / Village
```

Admins must be able to:

```txt
Add language groups
Add languages
Add dialects
Add variants
Add speech communities
Merge duplicates
Archive entries
Edit language metadata
```

Every contribution must support:

```txt
Source language
Source dialect/variant
Target language, where applicable
Target dialect/variant, where applicable
Speech community
District/village
```

---

# 6. User Roles

## Contributor

Can:

```txt
Register/login
Create profile
Select language/dialect
Submit text
Submit translations
Submit conversations/dialogues
Record audio
Upload audio
Upload images
Label images
Upload videos
Upload documents
Use synthetic examples for guidance
Give consent
View submission status
Earn coins
View wallet
```

## Reviewer

Can:

```txt
Review submitted data
Validate translations
Validate conversations
Listen to audio
View images/videos/documents
Review image labels
Review metadata
Approve/reject/request changes
Assign quality score
Flag synthetic data
```

## Admin

Can:

```txt
Manage users
Manage languages/dialects
Manage categories
Manage campaigns
Manage coin rules
Manage datasets
Generate synthetic guidance prompts
Export datasets
View analytics
```

## Super Admin

Can:

```txt
Manage system settings
Manage storage settings
Manage API keys
Manage integrations
Manage roles
Manage future BOFINET/repository settings
```

---

# 7. Contribution Types

Support:

```txt
word
sentence
translation
conversation
dialogue
story
proverb
pronunciation
dictionary_entry
audio_recording
image
labeled_image
video
document
object_label
cultural_knowledge
synthetic_example
synthetic_prompt
```

---

# 8. Translation Module

Users must be able to select:

```txt
Translate from: [Language]
Translate to: [Language]
```

Fields:

```txt
source_language_id
source_dialect_id_optional
target_language_id
target_dialect_id_optional
source_text
target_text
category
domain
context
notes
audio_source_optional
audio_target_optional
is_synthetic
human_verified
review_status
quality_score
```

Translations can be:

```txt
Human-contributed
Synthetic guidance
Human-reviewed synthetic
```

---

# 9. Conversation / Dialogue Module

The platform must collect conversational data.

A conversation contains multiple turns.

Conversation fields:

```txt
title
source_language_id
target_language_id
source_dialect_id_optional
target_dialect_id_optional
category
domain
context
speaker_count
is_synthetic
human_verified
```

Each turn stores:

```txt
turn_order
speaker_label
speaker_role
source_text
target_text
source_audio_optional
target_audio_optional
notes
review_status
```

Users must be able to:

```txt
Add speaker
Add turn
Reorder turns
Translate each turn
Attach audio to each turn
Use synthetic example conversations as guidance
Submit for review
```

Export conversations as:

```txt
JSONL
CSV
TXT
```

---

# 10. Audio Module

Support:

```txt
Browser recording
Audio upload
Playback
Preview
Re-record
Audio linked to text
Audio linked to translation
Audio linked to conversation turn
```

Formats:

```txt
wav
mp3
flac
aac
ogg
webm
```

Audio metadata:

```txt
duration
file_size
file_format
sample_rate_optional
bitrate_optional
channels_optional
recording_device_optional
noise_score_future
```

---

# 11. Image and Labeled Image Module

Support:

```txt
Image upload
Image captioning
Object labeling
Classification
Bounding boxes
Multilingual captions
OCR text labels
```

Future:

```txt
Polygon segmentation
Keypoints
Pose
Sign language points
```

Image metadata:

```txt
title
description
category
language
dialect
location
contributor
photographer
copyright_owner
license
consent
```

Annotation fields:

```txt
label_name
label_language_id
label_translation_optional
annotation_type
x_min
y_min
x_max
y_max
confidence
review_status
reviewer_id
is_synthetic
human_verified
```

Export formats:

```txt
COCO JSON
YOLO TXT
Pascal VOC
CSV
JSONL
```

---

# 12. Video Module

Support video uploads.

Formats:

```txt
mp4
mov
webm
mkv
```

Video metadata:

```txt
duration
resolution
frame_rate
file_size
codec_optional
thumbnail_url
audio_track_present
subtitle_available
```

Video use cases:

```txt
Storytelling
Cultural practices
Sign language
Pronunciation demonstrations
Interviews
Educational content
Object/action datasets
```

---

# 13. Document Module

Support:

```txt
pdf
docx
txt
csv
json
xlsx
```

Document metadata:

```txt
title
author
source
publisher_optional
year_optional
language
license
rights_status
ocr_status
```

---

# 14. Synthetic Data Module

Synthetic data may be used for guidance, seeding, examples, and augmentation.

Synthetic data must never be mixed with verified human data unless clearly marked.

Synthetic data uses:

```txt
Example translations
Example conversations
Prompt templates
Reviewer guidance
Training tasks
Low-resource language bootstrapping
Data augmentation after human review
```

Metadata for synthetic data:

```txt
is_synthetic
synthetic_source_model
generated_at
prompt_used
human_verified
review_status
```

Dataset exports must separate:

```txt
human_verified_data
synthetic_data
human_verified_synthetic_data
```

Rules:

```txt
Human data is the gold dataset.
Synthetic data is guidance or augmentation.
Human-reviewed synthetic data may be used for training only if approved.
```

---

# 15. Required Metadata

No contribution may be submitted without required metadata.

Required:

```txt
contribution_id
author_id
author_name
contribution_type
title
description
language_id
dialect_id_optional
target_language_id_optional
target_dialect_id_optional
speech_community_id_optional
district_optional
village_optional
category_id
domain
tags
date_created
date_uploaded
source
license_type
consent_status
review_status
quality_score
version
checksum
file_type
file_size
duration_for_audio_or_video
created_by
updated_by
reviewer_id
reviewer_notes
export_status
is_synthetic
human_verified
```

---

# 16. Consent Requirements

Every contributor must accept consent before submission.

Consent covers:

```txt
Storage
Review
AI training
Research use
Commercial use
Future dataset release
Attribution preference
Withdrawal request process
```

Consent record:

```txt
consent_id
contributor_id
contribution_id
consent_version
accepted_at
ip_address_optional
use_for_ai_training
use_for_research
use_for_commercial
allow_open_release
allow_attribution
```

---

# 17. Review Workflow

Statuses:

```txt
draft
submitted
pending_review
needs_changes
approved
rejected
dataset_ready
exported
```

Reviewer actions:

```txt
approve
reject
request_changes
edit_metadata
add_notes
assign_quality_score
validate_translation
validate_conversation
validate_label
validate_audio_quality
flag_synthetic
```

Coins are awarded only after approval.

---

# 18. Coins / Points Engine

Coins must be built from day one.

The reward system must be partner-agnostic.

Future rewards:

```txt
Orange airtime
Orange data bundles
Mobile money
Gift cards
Certificates
Diteme premium features
```

Wallet fields:

```txt
wallet_id
user_id
pending_coins
earned_coins
redeemed_coins
expired_coins
total_lifetime_coins
```

Coin transaction fields:

```txt
transaction_id
wallet_id
contribution_id
amount
transaction_type
status
reason
created_at
approved_by
```

Example coin rules:

```txt
text_translation = 5
conversation_turn = 3
full_conversation = 20
voice_recording = 10
story = 20
image_upload = 5
image_label = 3
video_upload = 30
human_reviewed_synthetic = 2
rare_language_bonus = 1.5x
high_quality_bonus = 2x
```

---

# 19. Dataset Management

Admins can build datasets from approved data.

Filters:

```txt
language
dialect
target_language
target_dialect
category
contribution_type
date_range
quality_score
reviewer
media_type
license
consent_type
is_synthetic
human_verified
```

Export formats:

```txt
CSV
JSONL
ZIP
COCO JSON
YOLO
TXT
Parquet future
```

Each export generates:

```txt
dataset_card.md
metadata.csv
manifest.json
human_verified.jsonl
synthetic.jsonl
human_verified_synthetic.jsonl
files.zip
license.txt
consent_summary.csv
```

---

# 20. Database Tables

Create:

```txt
users
roles
user_roles

contributors
organizations

language_groups
languages
dialects
speech_communities

categories
domains
tags

contributions
contribution_assets
translation_pairs
conversation_threads
conversation_turns

image_annotations
object_labels

synthetic_examples
synthetic_prompts

consents
reviews

wallets
coin_transactions
coin_rules
campaigns

datasets
dataset_items
dataset_exports

audit_logs
system_settings
```

---

# 21. API Endpoints

## Auth

```txt
GET /auth/me
POST /auth/register
POST /auth/login
POST /auth/logout
```

## Languages

```txt
GET /language-groups
POST /language-groups

GET /languages
POST /languages
GET /languages/{id}
PATCH /languages/{id}

GET /dialects
POST /dialects

GET /speech-communities
POST /speech-communities
```

## Contributions

```txt
GET /contributions
POST /contributions
GET /contributions/{id}
PATCH /contributions/{id}
POST /contributions/{id}/submit
POST /contributions/{id}/assets
GET /contributions/{id}/assets
```

## Translations

```txt
POST /translations
GET /translations/{id}
PATCH /translations/{id}
```

## Conversations

```txt
POST /conversations
GET /conversations/{id}
POST /conversations/{id}/turns
PATCH /conversation-turns/{id}
DELETE /conversation-turns/{id}
```

## Uploads

```txt
POST /uploads/signed-url
POST /uploads/confirm
```

## Image Labels

```txt
POST /image-annotations
GET /image-annotations/{asset_id}
PATCH /image-annotations/{id}
DELETE /image-annotations/{id}
```

## Synthetic Data

```txt
GET /synthetic-examples
POST /synthetic-examples
POST /synthetic-prompts
PATCH /synthetic-examples/{id}/verify
```

## Reviews

```txt
GET /reviews/pending
POST /contributions/{id}/review
POST /contributions/{id}/approve
POST /contributions/{id}/reject
POST /contributions/{id}/request-changes
```

## Wallet

```txt
GET /wallet
GET /wallet/transactions
POST /admin/coins/award
POST /admin/coins/rules
```

## Dataset Exports

```txt
POST /datasets
GET /datasets
POST /datasets/{id}/export
GET /dataset-exports
```

## Analytics

```txt
GET /admin/analytics
GET /admin/analytics/languages
GET /admin/analytics/contributors
GET /admin/analytics/rewards
GET /admin/analytics/synthetic
```

---

# 22. Frontend Pages

Create:

```txt
/
 /login
 /register
 /dashboard

 /contribute
 /contribute/text
 /contribute/translation
 /contribute/conversation
 /contribute/audio
 /contribute/image
 /contribute/labeled-image
 /contribute/video
 /contribute/document

 /synthetic-examples

 /submissions
 /submissions/[id]

 /wallet
 /rewards
 /leaderboard

 /admin
 /admin/contributions
 /admin/contributions/[id]
 /admin/languages
 /admin/dialects
 /admin/categories
 /admin/reviews
 /admin/rewards
 /admin/datasets
 /admin/synthetic
 /admin/analytics
```

---

# 23. Admin Analytics

Show:

```txt
total contributors
total contributions
approved contributions
pending reviews
rejected submissions
languages covered
dialects covered
hours of audio
minutes of video
images uploaded
image labels created
translation pairs collected
conversation turns collected
synthetic examples created
human-verified synthetic examples
words collected
coins awarded
top contributors
top languages
dataset exports created
```

---

# 24. Security Requirements

Implement:

```txt
role-based access control
private R2 bucket
signed upload URLs
signed download URLs
file type validation
max file size rules
audit logs
metadata validation
consent required
admin-only export
reviewer-only approval
password/session security
rate limiting future
virus scanning future
```

---

# 25. Codex Implementation Plan

## Phase 1: Monorepo Setup

Create:

```txt
biidp/
  apps/
    web/
    api/
  packages/
    shared/
  docs/
```

Install:

```txt
Next.js
TypeScript
TailwindCSS
FastAPI
Pydantic
SQLAlchemy
Alembic
PostgreSQL driver
Cloudflare R2 SDK / boto3
Vercel config
```

---

## Phase 2: Database Schema

Create migrations for:

```txt
users
roles
user_roles
contributors
language_groups
languages
dialects
speech_communities
categories
domains
tags
contributions
contribution_assets
translation_pairs
conversation_threads
conversation_turns
image_annotations
object_labels
synthetic_examples
synthetic_prompts
consents
reviews
wallets
coin_transactions
coin_rules
campaigns
datasets
dataset_items
dataset_exports
audit_logs
system_settings
```

---

## Phase 3: Language Taxonomy

Build admin CRUD for:

```txt
language groups
languages
dialects
speech communities
districts/villages optional
```

All forms must include:

```txt
source language dropdown
source dialect dropdown
target language dropdown where applicable
target dialect dropdown where applicable
```

---

## Phase 4: Contribution Engine

Build unified contribution creation.

Fields:

```txt
type
title
description
source language
target language optional
dialect optional
category
domain
tags
metadata
consent
is_synthetic
human_verified
status
```

Block submission if:

```txt
required metadata missing
consent missing
language missing
category missing
```

---

## Phase 5: Translation Module

Build form:

```txt
source language
target language
source text
target text
source dialect optional
target dialect optional
category
context
notes
optional audio
synthetic guidance examples
```

---

## Phase 6: Conversation Module

Build dialogue builder:

```txt
conversation title
source language
target language
category
speaker list
turn list
source text per turn
target text per turn
optional audio per turn
reorder turns
synthetic example guide
submit for review
```

---

## Phase 7: Media Uploads

Implement R2 signed upload:

```txt
create contribution
request signed URL
upload file to R2
confirm upload
save asset metadata
```

Support:

```txt
audio
image
video
document
```

---

## Phase 8: Labeled Image Module

Build image annotation MVP:

```txt
image preview
classification labels
bounding box labels
caption
multilingual caption
object label
save annotations
submit labels for review
```

Export:

```txt
YOLO
COCO JSON
CSV
JSONL
```

---

## Phase 9: Synthetic Data Module

Build synthetic example system.

Admin can:

```txt
create synthetic examples
create synthetic prompts
tag source model
mark as synthetic
send to reviewer
mark human verified
use as contributor guidance
exclude from human dataset exports
```

Contributor can:

```txt
view examples
use prompts as guidance
submit human version
```

---

## Phase 10: Review Dashboard

Build reviewer/admin interface:

```txt
list pending contributions
filter by language/type/status/synthetic
open detail page
play audio
view video
view image
view labels
review translations
review conversation turns
edit metadata
approve/reject/request changes
assign quality score
mark synthetic as human verified
```

---

## Phase 11: Coins Engine

Implement:

```txt
wallet creation
coin rules
pending coins
earned coins
coin transactions
admin campaign bonus
rare language bonus
synthetic verification coin rule
```

Coins are awarded only when approved.

---

## Phase 12: Dataset Builder

Admin can export approved data.

Filters:

```txt
language
dialect
target language
category
type
quality score
date range
media type
is_synthetic
human_verified
```

Generate:

```txt
metadata.csv
human_verified.jsonl
synthetic.jsonl
human_verified_synthetic.jsonl
manifest.json
dataset_card.md
files.zip
```

Store exports in R2.

---

## Phase 13: Analytics

Build analytics dashboard:

```txt
contributions by language
contributions by dialect
audio hours
video minutes
image labels
translation pairs
conversation turns
synthetic examples
human verified synthetic examples
approval rate
coins awarded
top contributors
```

---

# 26. MVP Definition of Done

The MVP is complete when:

```txt
Users can register and log in.
Admins can manage languages and dialects.
Users can select any available language as source language.
Users can select any available language as target language for translations.
Users can submit translation pairs.
Users can submit conversations/dialogues with multiple turns.
Users can record or upload audio.
Users can upload images, videos, and documents.
Users can label images with object labels and captions.
Users can view synthetic guidance examples.
Admins can create and verify synthetic examples.
Every contribution has required metadata.
Every contribution has consent.
Files are stored in Cloudflare R2.
Metadata is stored in PostgreSQL.
Reviewers can approve/reject/request changes.
Approved contributions award coins.
Admins can export datasets with human and synthetic data separated.
The system runs on Vercel.
```
