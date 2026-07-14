#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const domains = [
  {
    name: "daily_life",
    subdomain: "basic_needs",
    sensitivity: "low",
    words: [
      ["water", "noun", "The child is drinking water."],
      ["food", "noun", "The family needs food."],
      ["house", "noun", "The house is near the road."],
      ["fire", "noun", "The fire is warm."],
      ["clothes", "noun", "The clothes are clean."],
      ["blanket", "noun", "The blanket is warm."],
      ["soap", "noun", "Wash your hands with soap."],
      ["door", "noun", "Open the door."],
      ["window", "noun", "Close the window."],
      ["chair", "noun", "The chair is broken."],
      ["table", "noun", "Put the book on the table."],
      ["bed", "noun", "The child is on the bed."],
      ["cup", "noun", "The cup is full."],
      ["plate", "noun", "The plate is clean."],
      ["bag", "noun", "The bag is heavy."]
    ],
  },
  {
    name: "family",
    subdomain: "relationships",
    sensitivity: "low",
    words: [
      ["mother", "noun", "My mother is at home."],
      ["father", "noun", "My father is working."],
      ["child", "noun", "The child is sleeping."],
      ["baby", "noun", "The baby is crying."],
      ["sister", "noun", "My sister is reading."],
      ["brother", "noun", "My brother is outside."],
      ["grandmother", "noun", "My grandmother tells stories."],
      ["grandfather", "noun", "My grandfather is resting."],
      ["aunt", "noun", "My aunt is visiting."],
      ["uncle", "noun", "My uncle has arrived."],
      ["cousin", "noun", "My cousin is at school."],
      ["family", "noun", "The family is eating together."]
    ],
  },
  {
    name: "education",
    subdomain: "school",
    sensitivity: "low",
    words: [
      ["school", "noun", "The child is going to school."],
      ["teacher", "noun", "The teacher is writing."],
      ["student", "noun", "The student is reading."],
      ["book", "noun", "Open the book."],
      ["pen", "noun", "Use a pen to write."],
      ["paper", "noun", "Write your name on the paper."],
      ["lesson", "noun", "The lesson starts now."],
      ["question", "noun", "Ask a question."],
      ["answer", "noun", "The answer is correct."],
      ["learn", "verb", "We learn every day."],
      ["read", "verb", "Read the sentence."],
      ["write", "verb", "Write your name."],
      ["count", "verb", "Count from one to ten."],
      ["explain", "verb", "Explain the story."]
    ],
  },
  {
    name: "health",
    subdomain: "clinic",
    sensitivity: "medium",
    words: [
      ["doctor", "noun", "The doctor helps people."],
      ["nurse", "noun", "The nurse is at the clinic."],
      ["clinic", "noun", "The clinic opens early."],
      ["medicine", "noun", "Take the medicine after food."],
      ["pain", "noun", "I feel pain in my arm."],
      ["fever", "noun", "The child has a fever."],
      ["cough", "noun", "The cough started yesterday."],
      ["headache", "noun", "I have a headache."],
      ["wound", "noun", "Clean the wound carefully."],
      ["blood", "noun", "There is blood on the cloth."],
      ["pregnant", "adjective", "The woman is pregnant."],
      ["sick", "adjective", "The child is sick."],
      ["healthy", "adjective", "The baby is healthy."]
    ],
  },
  {
    name: "agriculture",
    subdomain: "farming",
    sensitivity: "low",
    words: [
      ["farm", "noun", "The farm has cattle."],
      ["field", "noun", "The field is ready for planting."],
      ["cattle", "noun", "The cattle need water."],
      ["goat", "noun", "The goat is eating grass."],
      ["sheep", "noun", "The sheep are near the fence."],
      ["chicken", "noun", "The chicken is outside."],
      ["donkey", "noun", "The donkey carries wood."],
      ["seed", "noun", "Plant the seed in the soil."],
      ["soil", "noun", "The soil is dry."],
      ["harvest", "noun", "The harvest was good."],
      ["plough", "verb", "They plough the field."],
      ["plant", "verb", "We plant maize."],
      ["milk", "verb", "They milk the cow in the morning."]
    ],
  },
  {
    name: "government",
    subdomain: "public_services",
    sensitivity: "medium",
    words: [
      ["office", "noun", "The office is open."],
      ["permit", "noun", "You need a permit."],
      ["identity card", "noun", "Bring your identity card."],
      ["form", "noun", "Fill in the form."],
      ["signature", "noun", "Put your signature here."],
      ["application", "noun", "Submit the application today."],
      ["certificate", "noun", "The certificate is ready."],
      ["law", "noun", "The law protects people."],
      ["court", "noun", "The court is in town."],
      ["vote", "verb", "Citizens can vote."]
    ],
  },
  {
    name: "commerce",
    subdomain: "market",
    sensitivity: "low",
    words: [
      ["market", "noun", "The market is busy."],
      ["money", "noun", "She saved money."],
      ["price", "noun", "The price is too high."],
      ["shop", "noun", "The shop is closed."],
      ["customer", "noun", "The customer is waiting."],
      ["seller", "noun", "The seller has vegetables."],
      ["receipt", "noun", "Keep the receipt."],
      ["buy", "verb", "I want to buy bread."],
      ["sell", "verb", "They sell vegetables."],
      ["pay", "verb", "Pay at the counter."],
      ["cheap", "adjective", "The fruit is cheap."],
      ["expensive", "adjective", "The shoes are expensive."]
    ],
  },
  {
    name: "transport",
    subdomain: "movement",
    sensitivity: "low",
    words: [
      ["road", "noun", "The road is long."],
      ["car", "noun", "The car is new."],
      ["bus", "noun", "The bus is full."],
      ["taxi", "noun", "The taxi is waiting."],
      ["bicycle", "noun", "The bicycle is outside."],
      ["driver", "noun", "The driver is careful."],
      ["passenger", "noun", "The passenger is late."],
      ["journey", "noun", "The journey was long."],
      ["travel", "verb", "We travel tomorrow."],
      ["arrive", "verb", "They arrive at night."],
      ["leave", "verb", "We leave in the morning."]
    ],
  },
  {
    name: "environment",
    subdomain: "nature",
    sensitivity: "low",
    words: [
      ["rain", "noun", "The rain is heavy."],
      ["sun", "noun", "The sun is hot."],
      ["wind", "noun", "The wind is strong."],
      ["tree", "noun", "The tree gives shade."],
      ["river", "noun", "The river is flowing."],
      ["sand", "noun", "The sand is hot."],
      ["stone", "noun", "The stone is heavy."],
      ["grass", "noun", "The grass is green."],
      ["animal", "noun", "The animal is running."],
      ["bird", "noun", "The bird is singing."],
      ["cold", "adjective", "The night is cold."],
      ["hot", "adjective", "The tea is hot."],
      ["dry", "adjective", "The land is dry."]
    ],
  },
  {
    name: "communication",
    subdomain: "language",
    sensitivity: "low",
    words: [
      ["speak", "verb", "Speak slowly."],
      ["listen", "verb", "Listen carefully."],
      ["say", "verb", "Say the word again."],
      ["ask", "verb", "Ask for help."],
      ["answer", "verb", "Answer the question."],
      ["tell", "verb", "Tell the story."],
      ["call", "verb", "Call your friend."],
      ["message", "noun", "Send a message."],
      ["language", "noun", "Language carries knowledge."],
      ["word", "noun", "Translate the word."],
      ["sentence", "noun", "Read the sentence."]
    ],
  },
];

const taskTypes = [
  "translation_word",
  "pronunciation_word",
  "translation_sentence",
  "pronunciation_sentence",
];

function args() {
  const parsed = {
    out: "data/corpus/english-prompts",
    count: 1000,
    shardSize: 10000,
    maxRepeats: 3,
  };
  for (let index = 2; index < process.argv.length; index += 1) {
    const key = process.argv[index];
    const value = process.argv[index + 1];
    if (key === "--out") parsed.out = value;
    if (key === "--count") parsed.count = Number(value);
    if (key === "--shard-size") parsed.shardSize = Number(value);
    if (key === "--max-repeats") parsed.maxRepeats = Number(value);
    if (key.startsWith("--")) index += 1;
  }
  if (!Number.isInteger(parsed.count) || parsed.count < 1) {
    throw new Error("--count must be a positive integer");
  }
  if (!Number.isInteger(parsed.shardSize) || parsed.shardSize < 1) {
    throw new Error("--shard-size must be a positive integer");
  }
  return parsed;
}

function normalize(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function difficultyFor(index, partOfSpeech) {
  if (partOfSpeech === "noun" && index % 5 !== 0) return "basic";
  if (index % 7 === 0) return "advanced";
  return "intermediate";
}

function instruction(taskType) {
  if (taskType.startsWith("pronunciation")) {
    return "Read this English prompt aloud for pronunciation collection.";
  }
  if (taskType.endsWith("sentence")) {
    return "Translate this English sentence into the selected local language.";
  }
  return "Translate this English word or phrase into the selected local language.";
}

function sourceTextFor(taskType, word, exampleSentence) {
  return taskType.endsWith("sentence") ? exampleSentence : word;
}

function makeRecord(recordNumber, domain, entry, taskType, maxRepeats) {
  const [word, partOfSpeech, exampleSentence] = entry;
  const sourceText = sourceTextFor(taskType, word, exampleSentence);
  const normalizedText = normalize(sourceText);
  const difficulty = difficultyFor(recordNumber, partOfSpeech);
  const id = `eng_${taskType}_${domain.name}_${String(recordNumber).padStart(8, "0")}`;
  return {
    id,
    schema_version: "1.0",
    record_type: "source_prompt",
    task_type: taskType,
    source_language: "English",
    target_language: null,
    source_text: sourceText,
    normalized_text: normalizedText,
    display_text: sourceText,
    part_of_speech: taskType.endsWith("sentence") ? "sentence" : partOfSpeech,
    domain: domain.name,
    subdomain: domain.subdomain,
    difficulty,
    context: `Use the ordinary ${domain.name.replace(/_/g, " ")} meaning.`,
    example_sentence: exampleSentence,
    prompt_instruction: instruction(taskType),
    expected_label_fields: taskType.startsWith("pronunciation")
      ? ["audio_asset_id", "transcript", "dialect_id", "speech_community_id", "notes"]
      : ["target_text", "dialect_id", "speech_community_id", "literal_translation", "natural_translation", "notes"],
    repeat_policy: {
      max_submitted_per_language: maxRepeats,
      min_approved_for_release: Math.min(2, maxRepeats),
      count_statuses: ["submitted", "approved"],
      exclude_statuses: ["rejected"],
    },
    review_policy: {
      requires_human_review: true,
      requires_native_speaker: true,
      minimum_quality_score: domain.sensitivity === "medium" ? 85 : 80,
    },
    consent_policy: {
      ai_training: true,
      research: true,
      open_release_allowed: true,
      commercial_allowed: false,
    },
    sensitivity: domain.sensitivity,
    tags: [domain.name, domain.subdomain, difficulty, partOfSpeech, taskType],
    dedupe_key: `english|${taskType}|${normalizedText}|${domain.name}`,
    created_by: "indigenous-corpus-generator",
  };
}

function nextSeed(index) {
  const domain = domains[index % domains.length];
  const entry = domain.words[Math.floor(index / domains.length) % domain.words.length];
  const taskType = taskTypes[Math.floor(index / (domains.length * domain.words.length)) % taskTypes.length];
  return { domain, entry, taskType };
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function main() {
  const options = args();
  ensureDir(options.out);
  const startedAt = new Date().toISOString();
  let shardIndex = 0;
  let writtenInShard = 0;
  let stream = null;
  const files = [];

  function openShard() {
    if (stream) stream.end();
    shardIndex += 1;
    writtenInShard = 0;
    const file = `english-prompts-${String(shardIndex).padStart(5, "0")}.jsonl`;
    const fullPath = path.join(options.out, file);
    files.push(file);
    stream = fs.createWriteStream(fullPath, { encoding: "utf8" });
  }

  openShard();
  for (let index = 0; index < options.count; index += 1) {
    if (writtenInShard >= options.shardSize) openShard();
    const seed = nextSeed(index);
    const record = makeRecord(index + 1, seed.domain, seed.entry, seed.taskType, options.maxRepeats);
    stream.write(`${JSON.stringify(record)}\n`);
    writtenInShard += 1;
  }
  if (stream) stream.end();

  const manifest = {
    schema_version: "1.0",
    generated_at: startedAt,
    generator: "indigenous-corpus-generator",
    record_count: options.count,
    shard_size: options.shardSize,
    max_repeats: options.maxRepeats,
    files,
    note: "English source prompts only. Target-language labels require human contributors and review.",
  };
  fs.writeFileSync(path.join(options.out, "manifest.json"), JSON.stringify(manifest, null, 2));
  console.log(`Generated ${options.count} records in ${files.length} shard(s): ${options.out}`);
}

main();
