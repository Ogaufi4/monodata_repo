# Guided Word Prompt Corpus

The platform should keep a large English source-word pool for guided
translation and pronunciation tasks. Each prompt is collected independently per
target language, so one English word can be completed three times for Setswana,
three times for Ikalanga, three times for Naro, and so on.

## Repeat Rule

- Default maximum: 3 submitted or approved completions per language and task.
- Recommended minimum for sensitive or high-value words: 2 independent
  completions before release.
- Rejected completions do not count toward the limit.
- A contributor should not receive the same prompt twice for the same language
  and task unless their previous work was rejected.

## Prompt Item

Each English prompt stores:

- source language: usually English
- source text: the word or phrase shown to contributors
- normalized text: lowercase lookup value
- prompt type: translation or pronunciation
- domain: health, education, agriculture, family, commerce, law, daily life
- difficulty: basic, intermediate, advanced
- part of speech: noun, verb, adjective, adverb, phrase
- context and example sentence
- max repeats
- active/inactive status

## Why This Matters

This prevents the dataset from being flooded with repeated easy words while
still collecting enough independent examples to compare quality. For AI
training, the stronger record is not just `water = metsi`; it is:

- English prompt
- target language
- dialect or speech community where available
- contributor answer
- consent
- review status
- quality score
- repeat count for agreement

That structure is what makes the dataset useful for translation models,
speech models, pronunciation scoring, and later model fine-tuning.
