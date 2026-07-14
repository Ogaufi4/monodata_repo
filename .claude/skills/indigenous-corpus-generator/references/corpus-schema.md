# Corpus Schema

Use JSONL. Each line is one prompt record.

## Prompt Record

```json
{
  "id": "eng_translation_word_daily_life_00000001",
  "schema_version": "1.0",
  "record_type": "source_prompt",
  "task_type": "translation_word",
  "source_language": "English",
  "target_language": null,
  "source_text": "water",
  "normalized_text": "water",
  "display_text": "water",
  "part_of_speech": "noun",
  "domain": "daily_life",
  "subdomain": "basic_needs",
  "difficulty": "basic",
  "context": "Use the ordinary daily-life meaning.",
  "example_sentence": "The child is drinking water.",
  "prompt_instruction": "Translate this English word into the selected local language.",
  "expected_label_fields": [
    "target_text",
    "dialect_id",
    "speech_community_id",
    "literal_translation",
    "natural_translation",
    "notes"
  ],
  "repeat_policy": {
    "max_submitted_per_language": 3,
    "min_approved_for_release": 2,
    "count_statuses": ["submitted", "approved"],
    "exclude_statuses": ["rejected"]
  },
  "review_policy": {
    "requires_human_review": true,
    "requires_native_speaker": true,
    "minimum_quality_score": 80
  },
  "consent_policy": {
    "ai_training": true,
    "research": true,
    "open_release_allowed": true,
    "commercial_allowed": false
  },
  "sensitivity": "low",
  "tags": ["daily_life", "basic_needs", "noun"],
  "dedupe_key": "english|translation_word|water|daily_life",
  "created_by": "indigenous-corpus-generator"
}
```

## Required Fields

- `id`
- `schema_version`
- `record_type`
- `task_type`
- `source_language`
- `source_text`
- `normalized_text`
- `part_of_speech`
- `domain`
- `difficulty`
- `prompt_instruction`
- `repeat_policy`
- `review_policy`
- `dedupe_key`

## Task Types

- `translation_word`: one word to translate
- `translation_phrase`: short phrase to translate
- `translation_sentence`: sentence to translate
- `pronunciation_word`: one word to pronounce
- `pronunciation_sentence`: sentence to read aloud
- `conversation_seed`: scenario for collecting dialogue
- `grammar_probe`: controlled grammar example
- `cultural_knowledge_prompt`: prompt for human-authored cultural explanation

## Dataset Quality Mix

For a strong model, collect:

- 50k to 200k word and phrase prompts
- 500k+ sentence pairs
- 50k+ conversations
- 100k+ instruction examples
- 50k+ dictionary and grammar entries
- 500 to 5,000 hours of speech with transcripts
- 5k to 20k expert-reviewed evaluation examples

Words alone are useful for coverage, but they will not create a powerful model
without sentences, conversations, speech, grammar, and review labels.
