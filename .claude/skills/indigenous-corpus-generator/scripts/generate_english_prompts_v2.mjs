#!/usr/bin/env node
// v2: large curated vocabulary + grammar-aware sentence templates.
// Emits unique, deduplicated English source prompts (words, phrases, sentences)
// for translation and pronunciation collection. No local-language text is generated.
import fs from "node:fs";
import path from "node:path";

// Verb entries: [base, thirdPerson, ing, past, compatibleObjects[]]
const DOMAINS = [
  {
    name: "daily_life", subdomain: "basic_needs", sensitivity: "low",
    people: ["woman", "man", "child", "neighbour", "friend", "visitor"],
    things: ["water", "food", "house", "fire", "clothes", "blanket", "soap", "door", "window", "chair", "table", "bed", "cup", "plate", "bag", "broom", "bucket", "knife", "pot", "key"],
    places: ["home", "kitchen", "yard", "village", "well"],
    verbs: [
      ["drink", "drinks", "drinking", "drank", ["water"]],
      ["eat", "eats", "eating", "ate", ["food"]],
      ["clean", "cleans", "cleaning", "cleaned", ["house", "plate", "cup", "window", "pot"]],
      ["wash", "washes", "washing", "washed", ["clothes", "plate", "cup", "blanket"]],
      ["open", "opens", "opening", "opened", ["door", "window", "bag"]],
      ["close", "closes", "closing", "closed", ["door", "window"]],
      ["carry", "carries", "carrying", "carried", ["bag", "bucket", "water", "chair"]],
      ["fix", "fixes", "fixing", "fixed", ["chair", "table", "door", "bed"]],
      ["fill", "fills", "filling", "filled", ["cup", "bucket", "pot"]],
      ["find", "finds", "finding", "found", ["key", "knife", "bag"]],
    ],
    adjectives: ["clean", "dirty", "warm", "cold", "heavy", "light", "new", "old", "broken", "full", "empty"],
  },
  {
    name: "family", subdomain: "relationships", sensitivity: "low",
    people: ["mother", "father", "child", "baby", "sister", "brother", "grandmother", "grandfather", "aunt", "uncle", "cousin"],
    things: ["family", "story", "name", "gift", "photo", "letter"],
    places: ["home", "village"],
    verbs: [
      ["love", "loves", "loving", "loved", ["baby", "family"]],
      ["help", "helps", "helping", "helped", ["mother", "grandmother", "child"]],
      ["visit", "visits", "visiting", "visited", ["aunt", "uncle", "grandmother"]],
      ["tell", "tells", "telling", "told", ["story"]],
      ["send", "sends", "sending", "sent", ["letter", "gift", "photo"]],
      ["remember", "remembers", "remembering", "remembered", ["name", "story"]],
    ],
    adjectives: ["young", "old", "kind", "happy", "big", "small"],
  },
  {
    name: "education", subdomain: "school", sensitivity: "low",
    people: ["teacher", "student", "pupil", "headmaster"],
    things: ["book", "pen", "paper", "lesson", "question", "answer", "word", "sentence", "story", "exam", "homework", "blackboard"],
    places: ["school", "classroom", "library"],
    verbs: [
      ["read", "reads", "reading", "read", ["book", "story", "sentence", "word"]],
      ["write", "writes", "writing", "wrote", ["word", "sentence", "answer", "letter"]],
      ["learn", "learns", "learning", "learned", ["lesson", "word"]],
      ["teach", "teaches", "teaching", "taught", ["lesson", "word"]],
      ["ask", "asks", "asking", "asked", ["question"]],
      ["answer", "answers", "answering", "answered", ["question"]],
      ["finish", "finishes", "finishing", "finished", ["homework", "exam", "lesson"]],
      ["explain", "explains", "explaining", "explained", ["lesson", "answer", "story"]],
    ],
    adjectives: ["easy", "difficult", "correct", "wrong", "long", "short", "new"],
  },
  {
    name: "health", subdomain: "clinic", sensitivity: "medium",
    people: ["doctor", "nurse", "patient", "mother", "health worker"],
    things: ["medicine", "pain", "fever", "cough", "headache", "wound", "blood", "tablet", "bandage", "injection", "appointment"],
    places: ["clinic", "hospital", "pharmacy"],
    verbs: [
      ["take", "takes", "taking", "took", ["medicine", "tablet"]],
      ["feel", "feels", "feeling", "felt", ["pain"]],
      ["clean", "cleans", "cleaning", "cleaned", ["wound"]],
      ["treat", "treats", "treating", "treated", ["wound", "patient", "fever", "cough"]],
      ["help", "helps", "helping", "helped", ["patient"]],
      ["miss", "misses", "missing", "missed", ["appointment"]],
    ],
    adjectives: ["sick", "healthy", "strong", "weak", "clean", "deep", "serious"],
  },
  {
    name: "agriculture", subdomain: "farming", sensitivity: "low",
    people: ["farmer", "herder", "boy", "worker"],
    things: ["cattle", "cow", "goat", "sheep", "chicken", "donkey", "seed", "soil", "harvest", "maize", "field", "fence", "grass", "crop"],
    places: ["farm", "field", "kraal", "borehole"],
    verbs: [
      ["plant", "plants", "planting", "planted", ["seed", "maize", "crop"]],
      ["water", "waters", "watering", "watered", ["crop", "field"]],
      ["feed", "feeds", "feeding", "fed", ["cattle", "goat", "chicken", "donkey"]],
      ["milk", "milks", "milking", "milked", ["cow"]],
      ["herd", "herds", "herding", "herded", ["cattle", "goat", "sheep"]],
      ["harvest", "harvests", "harvesting", "harvested", ["maize", "crop"]],
      ["repair", "repairs", "repairing", "repaired", ["fence"]],
      ["sell", "sells", "selling", "sold", ["goat", "maize", "chicken"]],
    ],
    adjectives: ["dry", "green", "ready", "strong", "thin", "fat", "healthy"],
  },
  {
    name: "law", subdomain: "justice", sensitivity: "medium",
    people: ["lawyer", "judge", "police officer", "witness", "chief"],
    things: ["law", "case", "statement", "fine", "agreement", "dispute", "evidence", "rule"],
    places: ["court", "kgotla", "police station"],
    verbs: [
      ["report", "reports", "reporting", "reported", ["case", "dispute"]],
      ["sign", "signs", "signing", "signed", ["statement", "agreement"]],
      ["pay", "pays", "paying", "paid", ["fine"]],
      ["follow", "follows", "following", "followed", ["law", "rule"]],
      ["settle", "settles", "settling", "settled", ["dispute", "case"]],
      ["explain", "explains", "explaining", "explained", ["law", "rule", "case"]],
      ["respect", "respects", "respecting", "respected", ["law", "chief"]],
    ],
    adjectives: ["fair", "unfair", "new", "important", "serious"],
  },
  {
    name: "government", subdomain: "public_services", sensitivity: "medium",
    people: ["officer", "citizen", "clerk", "councillor"],
    things: ["permit", "identity card", "form", "signature", "application", "certificate", "passport", "tax", "meeting"],
    places: ["office", "council", "post office"],
    verbs: [
      ["complete", "completes", "completing", "completed", ["form", "application"]],
      ["submit", "submits", "submitting", "submitted", ["application", "form"]],
      ["collect", "collects", "collecting", "collected", ["certificate", "passport", "permit"]],
      ["renew", "renews", "renewing", "renewed", ["permit", "passport", "identity card"]],
      ["pay", "pays", "paying", "paid", ["tax"]],
      ["attend", "attends", "attending", "attended", ["meeting"]],
      ["sign", "signs", "signing", "signed", ["form", "certificate"]],
    ],
    adjectives: ["ready", "open", "closed", "new", "official", "late"],
  },
  {
    name: "commerce", subdomain: "market", sensitivity: "low",
    people: ["customer", "seller", "trader", "shopkeeper"],
    things: ["money", "price", "receipt", "bread", "fruit", "sugar", "salt", "meat", "change"],
    places: ["market", "shop", "bank"],
    verbs: [
      ["buy", "buys", "buying", "bought", ["bread", "fruit", "meat", "sugar", "salt"]],
      ["sell", "sells", "selling", "sold", ["fruit", "meat", "bread"]],
      ["count", "counts", "counting", "counted", ["money", "change"]],
      ["keep", "keeps", "keeping", "kept", ["receipt", "change", "money"]],
      ["save", "saves", "saving", "saved", ["money"]],
      ["check", "checks", "checking", "checked", ["price", "receipt", "change"]],
    ],
    adjectives: ["cheap", "expensive", "fresh", "busy", "closed", "open", "fair"],
  },
  {
    name: "transport", subdomain: "movement", sensitivity: "low",
    people: ["driver", "passenger", "traveller", "conductor"],
    things: ["road", "car", "bus", "taxi", "bicycle", "journey", "ticket", "luggage", "engine", "wheel", "fuel"],
    places: ["bus stop", "station", "town", "junction"],
    verbs: [
      ["drive", "drives", "driving", "drove", ["car", "bus", "taxi"]],
      ["ride", "rides", "riding", "rode", ["bicycle"]],
      ["buy", "buys", "buying", "bought", ["ticket", "fuel"]],
      ["board", "boards", "boarding", "boarded", ["bus", "taxi"]],
      ["repair", "repairs", "repairing", "repaired", ["car", "bicycle", "engine", "wheel"]],
      ["carry", "carries", "carrying", "carried", ["luggage"]],
      ["start", "starts", "starting", "started", ["engine", "car", "journey"]],
    ],
    adjectives: ["long", "short", "full", "empty", "new", "old", "fast", "slow", "safe"],
  },
  {
    name: "technology", subdomain: "devices", sensitivity: "low",
    people: ["technician", "user", "student", "operator"],
    things: ["phone", "computer", "radio", "battery", "message", "password", "network", "charger", "screen", "television"],
    places: ["shop", "office", "home"],
    verbs: [
      ["charge", "charges", "charging", "charged", ["phone", "battery", "computer"]],
      ["send", "sends", "sending", "sent", ["message"]],
      ["type", "types", "typing", "typed", ["message", "password"]],
      ["restart", "restarts", "restarting", "restarted", ["phone", "computer"]],
      ["repair", "repairs", "repairing", "repaired", ["phone", "radio", "television", "screen"]],
      ["check", "checks", "checking", "checked", ["network", "message", "battery"]],
      ["use", "uses", "using", "used", ["phone", "computer", "radio"]],
    ],
    adjectives: ["new", "old", "broken", "fast", "slow", "flat", "strong", "weak"],
  },
  {
    name: "environment", subdomain: "nature", sensitivity: "low",
    people: ["child", "farmer", "ranger", "villager"],
    things: ["rain", "sun", "wind", "tree", "river", "sand", "stone", "grass", "animal", "bird", "cloud", "moon", "star", "hill", "firewood", "shade"],
    places: ["river", "forest", "hill", "bush"],
    verbs: [
      ["plant", "plants", "planting", "planted", ["tree"]],
      ["climb", "climbs", "climbing", "climbed", ["tree", "hill"]],
      ["watch", "watches", "watching", "watched", ["bird", "animal", "star", "moon"]],
      ["collect", "collects", "collecting", "collected", ["firewood", "stone"]],
      ["protect", "protects", "protecting", "protected", ["tree", "river", "animal", "bird"]],
      ["cross", "crosses", "crossing", "crossed", ["river"]],
    ],
    adjectives: ["hot", "cold", "dry", "wet", "green", "tall", "heavy", "strong", "beautiful"],
  },
  {
    name: "culture", subdomain: "heritage", sensitivity: "low",
    people: ["elder", "dancer", "singer", "storyteller", "guest"],
    things: ["song", "dance", "drum", "story", "tradition", "ceremony", "custom", "proverb", "dress", "basket"],
    places: ["kgotla", "village", "hall"],
    verbs: [
      ["sing", "sings", "singing", "sang", ["song"]],
      ["perform", "performs", "performing", "performed", ["dance", "song", "ceremony"]],
      ["tell", "tells", "telling", "told", ["story", "proverb"]],
      ["respect", "respects", "respecting", "respected", ["tradition", "custom", "elder"]],
      ["learn", "learns", "learning", "learned", ["song", "dance", "proverb", "custom"]],
      ["weave", "weaves", "weaving", "wove", ["basket"]],
      ["beat", "beats", "beating", "beat", ["drum"]],
    ],
    adjectives: ["old", "traditional", "beautiful", "important", "famous"],
  },
];

const PERSON_ADJECTIVES = ["happy", "tired", "busy", "kind", "late", "ready"];

// [render(person, verbForms, object), difficulty]
const VERB_TEMPLATES = [
  [(p, v, o) => `The ${p} is ${v.ing} the ${o}.`, "basic"],
  [(p, v, o) => `The ${p} ${v.s} the ${o}.`, "basic"],
  [(p, v, o) => `The ${p} ${v.past} the ${o} yesterday.`, "intermediate"],
  [(p, v, o) => `The ${p} will ${v.base} the ${o} tomorrow.`, "intermediate"],
  [(p, v, o) => `The ${p} did not ${v.base} the ${o}.`, "intermediate"],
  [(p, v, o) => `Did the ${p} ${v.base} the ${o}?`, "intermediate"],
  [(p, v, o) => `The ${p} wants to ${v.base} the ${o}.`, "intermediate"],
  [(p, v, o) => `The ${p} can ${v.base} the ${o}.`, "intermediate"],
  [(p, v, o) => `The ${p} must ${v.base} the ${o}.`, "advanced"],
  [(p, v, o) => `Why did the ${p} ${v.base} the ${o}?`, "advanced"],
  [(p, v, o) => `When will the ${p} ${v.base} the ${o}?`, "advanced"],
];

function cap(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function normalize(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function instruction(taskType) {
  if (taskType.startsWith("pronunciation")) {
    return "Read this English prompt aloud for pronunciation collection.";
  }
  if (taskType === "conversation_seed") {
    return "Write this conversation in the selected local language, turn by turn.";
  }
  if (taskType === "translation_phrase") {
    return "Translate this English phrase into the selected local language.";
  }
  if (taskType === "translation_sentence") {
    return "Translate this English sentence into the selected local language.";
  }
  return "Translate this English word or phrase into the selected local language.";
}

function buildSeeds() {
  const seeds = [];
  const add = (domain, kind, sourceText, partOfSpeech, difficulty, example) => {
    seeds.push({ domain, kind, sourceText, partOfSpeech, difficulty, example: example ?? null });
  };

  for (const domain of DOMAINS) {
    const firstPlace = domain.places[0];
    const firstPerson = domain.people[0];

    // --- words ---
    for (const person of domain.people) {
      add(domain, "word", person, "noun", "basic", `The ${person} is at the ${firstPlace}.`);
    }
    for (const [index, thing] of domain.things.entries()) {
      const adjective = domain.adjectives[index % domain.adjectives.length];
      add(domain, "word", thing, "noun", "basic", `The ${thing} is ${adjective}.`);
    }
    for (const place of domain.places) {
      add(domain, "word", place, "noun", "basic", `The ${firstPerson} is at the ${place}.`);
    }
    for (const [base, s, ing, past, objects] of domain.verbs) {
      add(domain, "word", base, "verb", "basic", `The ${firstPerson} ${s} the ${objects[0]}.`);
      void ing;
      void past;
    }
    for (const [index, adjective] of domain.adjectives.entries()) {
      const thing = domain.things[index % domain.things.length];
      add(domain, "word", adjective, "adjective", "basic", `The ${thing} is ${adjective}.`);
    }

    // --- phrases ---
    for (const [index, thing] of domain.things.entries()) {
      const adjA = domain.adjectives[index % domain.adjectives.length];
      const adjB = domain.adjectives[(index + 1) % domain.adjectives.length];
      add(domain, "phrase", `the ${adjA} ${thing}`, "phrase", "basic");
      if (adjB !== adjA) add(domain, "phrase", `the ${adjB} ${thing}`, "basic", "basic");
    }
    for (const [base, , , , objects] of domain.verbs) {
      for (const object of objects) {
        add(domain, "phrase", `${base} the ${object}`, "phrase", "basic");
      }
    }
    for (const place of domain.places) {
      add(domain, "phrase", `at the ${place}`, "phrase", "basic");
    }

    // --- sentences: verb templates ---
    for (const [base, s, ing, past, objects] of domain.verbs) {
      const forms = { base, s, ing, past };
      for (const object of objects) {
        add(domain, "sentence", `${cap(base)} the ${object}.`, "sentence", "basic");
        add(domain, "sentence", `Who will ${base} the ${object}?`, "sentence", "advanced");
        for (const person of domain.people) {
          for (const [render, difficulty] of VERB_TEMPLATES) {
            add(domain, "sentence", render(person, forms, object), "sentence", difficulty);
          }
        }
      }
    }

    // --- conversation seeds: a scenario two people can act out ---
    for (const place of domain.places) {
      for (const [indexA, speakerA] of domain.people.entries()) {
        const speakerB = domain.people[(indexA + 1) % domain.people.length];
        if (speakerA === speakerB) continue;
        for (const [base, , , , objects] of domain.verbs) {
          const object = objects[0];
          add(
            domain,
            "conversation",
            `At the ${place}, a ${speakerA} and a ${speakerB} talk about how to ${base} the ${object}.`,
            "scenario",
            "intermediate",
            `${cap(speakerA)}: We must ${base} the ${object}.`,
          );
        }
      }
    }

    // --- sentences: descriptions, questions, locations ---
    for (const [index, thing] of domain.things.entries()) {
      const adjA = domain.adjectives[index % domain.adjectives.length];
      const adjB = domain.adjectives[(index + 3) % domain.adjectives.length];
      add(domain, "sentence", `The ${thing} is ${adjA}.`, "sentence", "basic");
      if (adjB !== adjA) add(domain, "sentence", `The ${thing} is not ${adjB}.`, "sentence", "intermediate");
      add(domain, "sentence", `Where is the ${thing}?`, "sentence", "basic");
    }
    for (const [index, person] of domain.people.entries()) {
      add(domain, "sentence", `The ${person} is ${PERSON_ADJECTIVES[index % PERSON_ADJECTIVES.length]}.`, "sentence", "basic");
      for (const place of domain.places) {
        add(domain, "sentence", `The ${person} is at the ${place}.`, "sentence", "basic");
        add(domain, "sentence", `The ${person} is going to the ${place}.`, "sentence", "basic");
      }
    }
  }
  return seeds;
}

const KIND_TASKS = {
  word: ["translation_word", "pronunciation_word"],
  phrase: ["translation_phrase"],
  sentence: ["translation_sentence", "pronunciation_sentence"],
  conversation: ["conversation_seed"],
};

function makeRecord(recordNumber, seed, taskType, maxRepeats) {
  const normalizedText = normalize(seed.sourceText);
  const id = `eng_${taskType}_${seed.domain.name}_${String(recordNumber).padStart(8, "0")}`;
  return {
    id,
    schema_version: "1.0",
    record_type: "source_prompt",
    task_type: taskType,
    source_language: "English",
    target_language: null,
    source_text: seed.sourceText,
    normalized_text: normalizedText,
    display_text: seed.sourceText,
    part_of_speech: seed.partOfSpeech,
    domain: seed.domain.name,
    subdomain: seed.domain.subdomain,
    difficulty: seed.difficulty,
    context: `Use the ordinary ${seed.domain.name.replace(/_/g, " ")} meaning.`,
    example_sentence: seed.example,
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
      minimum_quality_score: seed.domain.sensitivity === "medium" ? 85 : 80,
    },
    consent_policy: {
      ai_training: true,
      research: true,
      open_release_allowed: true,
      commercial_allowed: false,
    },
    sensitivity: seed.domain.sensitivity,
    tags: [seed.domain.name, seed.domain.subdomain, seed.difficulty, seed.partOfSpeech, taskType],
    dedupe_key: `english|${taskType}|${normalizedText}|${seed.domain.name}`,
    created_by: "indigenous-corpus-generator",
  };
}

function args() {
  const parsed = { out: "data/corpus/english-prompts", shardSize: 10000, maxRepeats: 3 };
  for (let index = 2; index < process.argv.length; index += 1) {
    const key = process.argv[index];
    const value = process.argv[index + 1];
    if (key === "--out") parsed.out = value;
    if (key === "--shard-size") parsed.shardSize = Number(value);
    if (key === "--max-repeats") parsed.maxRepeats = Number(value);
    if (key.startsWith("--")) index += 1;
  }
  if (!Number.isInteger(parsed.shardSize) || parsed.shardSize < 1) {
    throw new Error("--shard-size must be a positive integer");
  }
  return parsed;
}

function main() {
  const options = args();
  fs.rmSync(options.out, { recursive: true, force: true });
  fs.mkdirSync(options.out, { recursive: true });

  const seeds = buildSeeds();
  const seen = new Set();
  const records = [];
  for (const seed of seeds) {
    for (const taskType of KIND_TASKS[seed.kind]) {
      const dedupeKey = `english|${taskType}|${normalize(seed.sourceText)}|${seed.domain.name}`;
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);
      records.push(makeRecord(records.length + 1, seed, taskType, options.maxRepeats));
    }
  }

  const files = [];
  for (let shard = 0; shard * options.shardSize < records.length; shard += 1) {
    const file = `english-prompts-${String(shard + 1).padStart(5, "0")}.jsonl`;
    const chunk = records.slice(shard * options.shardSize, (shard + 1) * options.shardSize);
    fs.writeFileSync(path.join(options.out, file), chunk.map((r) => JSON.stringify(r)).join("\n") + "\n");
    files.push(file);
  }

  const byTask = {};
  const byDomain = {};
  const byDifficulty = {};
  for (const record of records) {
    byTask[record.task_type] = (byTask[record.task_type] ?? 0) + 1;
    byDomain[record.domain] = (byDomain[record.domain] ?? 0) + 1;
    byDifficulty[record.difficulty] = (byDifficulty[record.difficulty] ?? 0) + 1;
  }

  const manifest = {
    schema_version: "1.0",
    generated_at: new Date().toISOString(),
    generator: "indigenous-corpus-generator-v2",
    record_count: records.length,
    shard_size: options.shardSize,
    max_repeats: options.maxRepeats,
    files,
    records_by_task_type: byTask,
    records_by_domain: byDomain,
    records_by_difficulty: byDifficulty,
    note: "English source prompts only, deduplicated by dedupe_key. Target-language labels require human contributors and review.",
  };
  fs.writeFileSync(path.join(options.out, "manifest.json"), JSON.stringify(manifest, null, 2));
  console.log(JSON.stringify({ record_count: records.length, shards: files.length, by_task_type: byTask }, null, 2));
}

main();
