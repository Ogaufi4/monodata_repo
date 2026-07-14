---
name: indigenous-corpus-generator
description: Generate structured English prompt corpora for Botswana indigenous-language AI datasets. Use when creating JSONL shards of English words, phrases, sentences, pronunciation prompts, translation prompts, metadata schemas, repeat policies, or corpus plans for Setswana and other local-language data collection.
---

# Indigenous Corpus Generator

Generate collection-ready English source prompts, not final translations. Human
contributors must translate, pronounce, and review the local-language labels.

## Workflow

1. Read `references/corpus-schema.md` before designing or generating corpus files.
2. Decide the task mix:
   - `translation_word`
   - `translation_phrase`
   - `translation_sentence`
   - `pronunciation_word`
   - `pronunciation_sentence`
   - `conversation_seed`
   - `grammar_probe`
   - `cultural_knowledge_prompt`
3. Generate JSONL shards, one JSON object per line.
4. Keep each shard below the requested file size. Prefer 50k to 250k records per shard for easy upload/review.
5. Do not fabricate Setswana, Ikalanga, Naro, or other local-language translations. Leave target fields empty for humans.
6. Include metadata needed for quality control: domain, difficulty, part of speech, repeat limit, review requirements, consent expectations, and dedupe keys.
7. Use `scripts/generate_english_prompts.mjs` for large prompt pools.

## Repeat Policy

Use per-language limits, not global limits:

- Default max repeats: `3` approved or submitted examples per target language and task.
- High-value or sensitive domains can require `2` expert-reviewed examples before release, then continue up to `3`.
- Rejected examples do not count.
- Do not assign the same prompt twice to the same contributor for the same language/task unless their previous contribution was rejected.

## Quality Rules

- Prefer common, concrete, culturally portable English words first.
- Add context for ambiguous words: `bank` as river bank vs financial bank.
- Include example sentences for words that shift meaning by context.
- Separate domains: health, education, agriculture, law, government, family, commerce, transport, technology, environment, culture, daily_life.
- Mark sensitive prompts in health, law, identity, children, trauma, or sacred knowledge.
- Generate minimal pairs and grammar probes only when the prompt is intended for linguist review.

## Output Commands

Small test:

```bash
node .claude/skills/indigenous-corpus-generator/scripts/generate_english_prompts.mjs --out data/corpus/english-prompts --count 1000 --shard-size 250
```

Large generation:

```bash
node .claude/skills/indigenous-corpus-generator/scripts/generate_english_prompts.mjs --out data/corpus/english-prompts --count 1000000 --shard-size 100000
```

The script creates `.jsonl` shards plus `manifest.json`.

## Done Criteria

- JSONL validates as one object per line.
- Each record has stable `id` and `dedupe_key`.
- No target-language translation is invented.
- Records include task type, prompt text, domain, difficulty, repeat policy, and review policy.
- Large corpora are sharded rather than written as one huge JSON file.
