# Implementation plan

The product brief describes a large system. The build is split into vertical
slices so each milestone remains runnable and reviewable.

## 1. Foundation

- Next.js and FastAPI applications
- shared environment conventions
- PostgreSQL session setup
- deployment configuration

## 2. Identity and taxonomy

- JWT-based authentication and role-based access
- user, role, and contributor models
- language groups, languages, dialects, and speech communities
- admin taxonomy CRUD

## 3. Contribution workflow

- unified contribution and consent models
- translation and conversation modules
- submission state machine
- contributor dashboard

## 4. Media and annotation

- private R2 signed uploads
- asset validation and confirmation
- audio recording and playback
- image bounding boxes, captions, and labels

## 5. Review and rewards

- reviewer queue and contribution detail
- approval, rejection, and change requests
- idempotent coin awards on approval
- wallets and transaction history

## 6. Datasets and analytics

- approved-data dataset builder
- separated human and synthetic exports
- export manifests and dataset cards
- operational and contribution analytics

## Immediate next slice

Build identity and taxonomy together. Language selection is required by almost
every contribution type, and authenticated roles are necessary to protect
taxonomy management.
