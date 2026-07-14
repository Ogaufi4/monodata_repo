import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.SEED_DATABASE_URL } },
});

const here = path.dirname(fileURLToPath(import.meta.url));
const corpusDir = path.resolve(here, "..", "..", "data", "corpus", "english-prompts");

const FAMILIES = [
  {
    name: "Bantu",
    description:
      "Languages descending from Proto-Bantu within the Niger-Congo cluster.",
    languages: [
      { name: "Setswana", localName: "Setswana", isoCode: "tsn" },
      { name: "Shekgalagari", localName: "Shekgalagari", isoCode: "xkv" },
      { name: "Sebirwa", localName: "Sebirwa", isoCode: null },
      { name: "Setswapong", localName: "Setswapong", isoCode: null },
      { name: "Silozi", localName: "Silozi", isoCode: "loz" },
      { name: "Ikalanga", localName: "Ikalanga", isoCode: "kck" },
      { name: "Zezuru", localName: "Zezuru", isoCode: "sna" },
      { name: "Nambya", localName: "Nambya", isoCode: "nmq" },
      { name: "Chikuhane", localName: "Chikuhane (Subiya)", isoCode: "sbs" },
      { name: "Shiyeyi", localName: "Shiyeyi", isoCode: "yey" },
      { name: "Thimbukushu", localName: "Thimbukushu", isoCode: "mhw" },
      { name: "Rugciriku", localName: "Rugciriku (Rumanyo)", isoCode: "diu" },
      { name: "Otjiherero", localName: "Otjiherero", isoCode: "her" },
      { name: "Isindebele", localName: "Isindebele", isoCode: "nde" },
    ],
  },
  {
    name: "Khoesan",
    description:
      "Khoe and San language groups, including click consonant orthographies and regional variants.",
    languages: [
      { name: "Nama", localName: "Khoekhoegowab", isoCode: "naq" },
      { name: "Naro", localName: "Naro", isoCode: "nhr" },
      { name: "Gwi", localName: "Gǀwi", isoCode: "gwj" },
      { name: "Gana", localName: "Gǁana", isoCode: "gnk" },
      { name: "Shua", localName: "Shua", isoCode: "shg" },
      { name: "Tshwa", localName: "Tshwa", isoCode: "hio" },
      { name: "Kua", localName: "Kua", isoCode: "tyu" },
      { name: "Kxoe", localName: "Khwedam", isoCode: "xuu" },
      { name: "Ani", localName: "Aniida", isoCode: "hnh" },
      { name: "Ju/'hoan", localName: "Juǀʼhoan", isoCode: "ktz" },
      { name: "ǂKx'au//'ein", localName: "ǂKxʼauǁʼein", isoCode: "aue" },
      { name: "Hua", localName: "ǀʼHua", isoCode: "huc" },
      { name: "!Xoo", localName: "Taa (ǃXóõ)", isoCode: "nmn" },
    ],
  },
  {
    name: "Germanic",
    description: "Indo-European Germanic languages used in Botswana contexts.",
    languages: [
      { name: "English", localName: "English", isoCode: "eng" },
      { name: "Afrikaans", localName: "Afrikaans", isoCode: "afr" },
    ],
  },
];

// Setswana is the most widely spoken language, so its main regional dialects
// are seeded explicitly.
const SETSWANA_DIALECTS = [
  ["Sengwato", "Central District"],
  ["Sekwena", "Kweneng"],
  ["Sengwaketse", "Southern District"],
  ["Sekgatla", "Kgatleng"],
  ["Setawana", "North West (Ngamiland)"],
  ["Serolong", "Southern / Barolong farms"],
  ["Setlokwa", "Southern District"],
  ["Sehurutshe", "North East / Hurutshe"],
  ["Selete", "South East"],
  ["Setlhaping", "Southern (cross-border)"],
];

const CATEGORIES = [
  ["Greetings", "Everyday greetings and courtesies"],
  ["Everyday speech", "Common daily-life expressions"],
  ["Family", "Family and relationships"],
  ["Education", "School and learning"],
  ["Health", "Clinic, illness, and care"],
  ["Agriculture", "Farming and livestock"],
  ["Law & justice", "Courts, kgotla, and disputes"],
  ["Government services", "Public offices and documents"],
  ["Commerce & market", "Buying, selling, and money"],
  ["Transport", "Travel and movement"],
  ["Technology", "Phones, computers, and devices"],
  ["Environment & nature", "Weather, land, and animals"],
  ["Culture & heritage", "Songs, customs, and traditions"],
];

function basePromptType(taskType) {
  if (taskType.startsWith("pronunciation")) return "pronunciation";
  if (taskType === "conversation_seed") return "conversation";
  return "translation";
}

async function seedLanguages() {
  // Languages seeded earlier had no family; adopt them into the right group
  // instead of creating a second row with the same name.
  for (const family of FAMILIES) {
    const group = await prisma.languageGroup.upsert({
      where: { name: family.name },
      update: { description: family.description },
      create: { name: family.name, description: family.description, isActive: true },
    });

    for (const language of family.languages) {
      const existing = await prisma.language.findFirst({ where: { name: language.name } });
      if (existing) {
        await prisma.language.update({
          where: { id: existing.id },
          data: { ...language, groupId: group.id, isActive: true },
        });
      } else {
        await prisma.language.create({
          data: { ...language, description: null, isActive: true, groupId: group.id },
        });
      }
    }
  }

  // "Khoekhoe" was seeded before the family list arrived; Nama is the same
  // language, so retire the stray row if it is unused.
  const stray = await prisma.language.findFirst({ where: { name: "Khoekhoe" } });
  if (stray) {
    const inUse = await prisma.contribution.count({
      where: { OR: [{ languageId: stray.id }, { targetLanguageId: stray.id }] },
    });
    if (inUse === 0) {
      await prisma.language.delete({ where: { id: stray.id } });
    } else {
      await prisma.language.update({ where: { id: stray.id }, data: { isActive: false } });
    }
  }

  return prisma.language.count();
}

async function seedDialects() {
  const setswana = await prisma.language.findFirst({ where: { name: "Setswana" } });
  if (!setswana) return 0;
  for (const [name, description] of SETSWANA_DIALECTS) {
    const existing = await prisma.dialect.findFirst({
      where: { name, languageId: setswana.id },
    });
    if (existing) continue;
    await prisma.dialect.create({
      data: {
        name,
        localName: name,
        description,
        isActive: true,
        languageId: setswana.id,
      },
    });
  }
  return prisma.dialect.count();
}

async function seedCategories() {
  for (const [name, description] of CATEGORIES) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name, description, isActive: true },
    });
  }
  return prisma.category.count();
}

function loadCorpusRecords() {
  const files = fs.readdirSync(corpusDir).filter((file) => file.endsWith(".jsonl"));
  const byKey = new Map();
  for (const file of files) {
    const lines = fs.readFileSync(path.join(corpusDir, file), "utf8").split("\n").filter(Boolean);
    for (const line of lines) {
      const record = JSON.parse(line);
      const promptType = basePromptType(record.task_type);
      const key = `${promptType}|${record.normalized_text}`;
      if (byKey.has(key)) continue;
      byKey.set(key, {
        sourceLanguage: record.source_language,
        sourceText: record.source_text.slice(0, 240),
        normalizedText: record.normalized_text.slice(0, 240),
        promptType,
        domain: record.domain,
        difficulty: record.difficulty,
        partOfSpeech: record.part_of_speech ?? null,
        context: record.context ?? null,
        exampleSentence: record.example_sentence ?? null,
        tags: record.tags ?? [],
        maxRepeats: record.repeat_policy?.max_submitted_per_language ?? 3,
        isActive: true,
      });
    }
  }
  return [...byKey.values()];
}

async function importPrompts() {
  const records = loadCorpusRecords();
  const batchSize = 1000;
  let inserted = 0;
  for (let start = 0; start < records.length; start += batchSize) {
    const batch = records.slice(start, start + batchSize);
    const result = await prisma.promptItem.createMany({ data: batch, skipDuplicates: true });
    inserted += result.count;
  }
  return { unique: records.length, inserted, total: await prisma.promptItem.count() };
}

const summary = {};
try {
  summary.languages = await seedLanguages();
  summary.dialects = await seedDialects();
  summary.categories = await seedCategories();
  summary.prompts = await importPrompts();
} catch (error) {
  summary.error = String(error);
}
console.log(JSON.stringify(summary, null, 2));
await prisma.$disconnect();
