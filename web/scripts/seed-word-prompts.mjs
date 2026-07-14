import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const words = [
  ["water", "daily_life", "basic", "noun", "Clean water is important."],
  ["food", "daily_life", "basic", "noun", "The family needs food."],
  ["house", "home", "basic", "noun", "The house is near the road."],
  ["school", "education", "basic", "noun", "The child is going to school."],
  ["teacher", "education", "basic", "noun", "The teacher is writing."],
  ["student", "education", "basic", "noun", "The student is reading."],
  ["doctor", "health", "basic", "noun", "The doctor helps people."],
  ["clinic", "health", "basic", "noun", "The clinic opens early."],
  ["medicine", "health", "basic", "noun", "Take the medicine after food."],
  ["mother", "family", "basic", "noun", "My mother is at home."],
  ["father", "family", "basic", "noun", "My father is working."],
  ["child", "family", "basic", "noun", "The child is sleeping."],
  ["friend", "daily_life", "basic", "noun", "My friend is coming."],
  ["village", "place", "basic", "noun", "The village is quiet."],
  ["town", "place", "basic", "noun", "We are going to town."],
  ["road", "transport", "basic", "noun", "The road is long."],
  ["car", "transport", "basic", "noun", "The car is new."],
  ["bus", "transport", "basic", "noun", "The bus is full."],
  ["market", "commerce", "basic", "noun", "The market is busy."],
  ["money", "commerce", "basic", "noun", "She saved money."],
  ["work", "daily_life", "basic", "noun", "Work starts in the morning."],
  ["farm", "agriculture", "basic", "noun", "The farm has cattle."],
  ["cattle", "agriculture", "basic", "noun", "The cattle need water."],
  ["goat", "agriculture", "basic", "noun", "The goat is eating grass."],
  ["rain", "weather", "basic", "noun", "The rain is heavy."],
  ["sun", "weather", "basic", "noun", "The sun is hot."],
  ["wind", "weather", "basic", "noun", "The wind is strong."],
  ["fire", "daily_life", "basic", "noun", "The fire is warm."],
  ["tree", "nature", "basic", "noun", "The tree gives shade."],
  ["river", "nature", "basic", "noun", "The river is flowing."],
  ["morning", "time", "basic", "noun", "I wake up in the morning."],
  ["night", "time", "basic", "noun", "The night is cold."],
  ["today", "time", "basic", "adverb", "Today we are meeting."],
  ["tomorrow", "time", "basic", "adverb", "Tomorrow we will travel."],
  ["yesterday", "time", "basic", "adverb", "Yesterday it rained."],
  ["eat", "daily_life", "basic", "verb", "The children eat porridge."],
  ["drink", "daily_life", "basic", "verb", "Please drink water."],
  ["sleep", "daily_life", "basic", "verb", "The baby will sleep."],
  ["walk", "movement", "basic", "verb", "We walk to school."],
  ["run", "movement", "basic", "verb", "The boy can run fast."],
  ["come", "movement", "basic", "verb", "Please come here."],
  ["go", "movement", "basic", "verb", "I will go home."],
  ["speak", "communication", "basic", "verb", "Speak slowly."],
  ["listen", "communication", "basic", "verb", "Listen carefully."],
  ["read", "education", "basic", "verb", "Read the sentence."],
  ["write", "education", "basic", "verb", "Write your name."],
  ["learn", "education", "basic", "verb", "We learn every day."],
  ["help", "community", "basic", "verb", "Please help your neighbour."],
  ["buy", "commerce", "basic", "verb", "I want to buy bread."],
  ["sell", "commerce", "basic", "verb", "They sell vegetables."],
  ["cook", "home", "basic", "verb", "She will cook dinner."],
  ["clean", "home", "basic", "verb", "Clean the room."],
  ["open", "daily_life", "basic", "verb", "Open the door."],
  ["close", "daily_life", "basic", "verb", "Close the window."],
  ["big", "description", "basic", "adjective", "The bag is big."],
  ["small", "description", "basic", "adjective", "The cup is small."],
  ["hot", "description", "basic", "adjective", "The tea is hot."],
  ["cold", "description", "basic", "adjective", "The water is cold."],
  ["good", "description", "basic", "adjective", "That is a good idea."],
  ["bad", "description", "basic", "adjective", "The road is bad."],
  ["new", "description", "basic", "adjective", "This is a new book."],
  ["old", "description", "basic", "adjective", "The chair is old."],
  ["happy", "emotion", "basic", "adjective", "The child is happy."],
  ["sad", "emotion", "basic", "adjective", "The man is sad."],
];

const promptTypes = ["translation", "pronunciation"];

for (const [sourceText, domain, difficulty, partOfSpeech, exampleSentence] of words) {
  const normalizedText = sourceText.toLowerCase();
  for (const promptType of promptTypes) {
    await prisma.promptItem.upsert({
      where: {
        sourceLanguage_normalizedText_promptType: {
          sourceLanguage: "English",
          normalizedText,
          promptType,
        },
      },
      create: {
        sourceLanguage: "English",
        sourceText,
        normalizedText,
        promptType,
        domain,
        difficulty,
        partOfSpeech,
        exampleSentence,
        context: `Use the ordinary ${domain.replace("_", " ")} meaning.`,
        tags: [domain, difficulty, partOfSpeech].filter(Boolean),
        maxRepeats: 3,
        isActive: true,
      },
      update: {
        domain,
        difficulty,
        partOfSpeech,
        exampleSentence,
        context: `Use the ordinary ${domain.replace("_", " ")} meaning.`,
        tags: [domain, difficulty, partOfSpeech].filter(Boolean),
        maxRepeats: 3,
        isActive: true,
      },
    });
  }
}

console.log(`Seeded ${words.length * promptTypes.length} word prompts.`);
await prisma.$disconnect();
