/**
 * Procedural quiz generator — difficulty-accurate, infinite variety
 */
const QuizGen = (function () {
  "use strict";

  const BANK = {
    mystery: {
      words: [
        ["CLUE", "Detectives collect these at a crime scene."],
        ["ALIBI", "Proof you were somewhere else when it happened."],
        ["SUSPECT", "Everyone the detective questions first."],
        ["EVIDENCE", "Facts that point toward the truth."],
        ["MOTIVE", "The reason someone might have done it."],
        ["CASE", "What a detective opens after a crime."],
        ["TRACE", "A nearly invisible sign someone was here."],
        ["RANSOM", "Money demanded in a kidnapping plot."],
      ],
      cryptic: [
        ["CIPHER", "A secret code only the right key reveals."],
        ["REDHERRING", "A false trail meant to mislead you."],
        ["FORENSIC", "Science used to study crime-scene details."],
        ["UNDERCOVER", "Working in disguise to catch someone."],
      ],
    },
    nature: {
      words: [
        ["TREE", "Roots below, branches above, photosynthesis within."],
        ["RIVER", "Always moving, never the same water twice."],
        ["STORM", "Thunder, clouds, and sudden pouring skies."],
        ["MOSS", "Soft green carpet on old forest stones."],
        ["CORAL", "Undersea colonies builders of reefs."],
        ["EAGLE", "Sharp eyes circling high above valleys."],
      ],
      cryptic: [
        ["ECOSYSTEM", "Every living thing connected in one place."],
        ["PHOTOSYNTHESIS", "How green plants turn light into food."],
        ["BIODIVERSITY", "Many species sharing one habitat."],
      ],
    },
    words: {
      words: [
        ["PALINDROME", "Reads identical forward and backward."],
        ["ANAGRAM", "Same letters reshuffled into a new word."],
        ["VOWEL", "A, E, I, O, U — the singing letters."],
        ["RHYME", "Moon and June share this quality."],
        ["PREFIX", "Re- or un- attached before a root word."],
      ],
      cryptic: [
        ["ONOMATOPOEIA", "Buzz and splash sound like their meaning."],
        ["ALLITERATION", "Peter Piper picked this device."],
      ],
    },
    logic: {
      words: [
        ["PUZZLE", "Pieces or ideas that must fit together."],
        ["PARADOX", "True and false at once — a brain teaser."],
        ["DEDUCE", "Reason from clues to a conclusion."],
        ["PATTERN", "Something that repeats with a rule."],
      ],
      cryptic: [
        ["SYLLOGISM", "Two premises leading to a conclusion."],
        ["INDUCTION", "General rule from many examples."],
      ],
    },
    history: {
      words: [
        ["EMPIRE", "Vast lands ruled from one powerful center."],
        ["TREATY", "Nations sign this to end a war."],
        ["ARTIFACT", "An object left behind by ancient people."],
        ["REVOLT", "People rise against those in power."],
        ["DYNASTY", "One family ruling for generations."],
      ],
      cryptic: [
        ["RENAISSANCE", "Europe's rebirth of art and science."],
        ["ARCHAEOLOGY", "Digging up stories from the ground."],
      ],
    },
    science: {
      words: [
        ["ATOM", "Tiny building block of matter."],
        ["GRAVITY", "What keeps your feet on the ground."],
        ["LASER", "Focused beam of synchronized light."],
        ["VIRUS", "Needs a host cell to multiply."],
        ["ORBIT", "A path around a star or planet."],
      ],
      cryptic: [
        ["MOLECULE", "Two or more atoms bonded together."],
        ["ENTROPY", "Disorder increasing in closed systems."],
        ["QUANTUM", "Physics of the very smallest scales."],
      ],
    },
    pop: {
      words: [
        ["MOVIE", "Stories told with light on a big screen."],
        ["REMIX", "A song rebuilt with new beats."],
        ["FANDOM", "Fans who love a show or artist deeply."],
        ["STREAM", "Watch instantly without a DVD."],
      ],
      cryptic: [
        ["BLOCKBUSTER", "A film everyone talks about opening weekend."],
      ],
    },
    riddles: {
      words: [
        ["ECHO", "I repeat you but have no voice of my own."],
        ["SHADOW", "I follow you but weigh nothing."],
        ["FUTURE", "Always coming, never arriving."],
        ["SECRET", "Known by few, guessed by many."],
      ],
      cryptic: [
        ["PARADOX", "The more you share me, the more I remain."],
      ],
    },
    hidden: {
      words: [
        ["SECRET", "Hidden in plain sight if you read carefully."],
        ["MASK", "Covers truth beneath a false face."],
        ["LAYER", "Peel one away to see what's under."],
        ["CODE", "Symbols standing in for real words."],
      ],
      cryptic: [
        ["SUBTEXT", "Meaning lurking between the lines."],
        ["ENCRYPT", "Scrambled so only keys can read it."],
      ],
    },
  };

  const TEMPLATES = {
    easy: [
      (w, s) => s,
      (w, s) => `Simple one: ${s}`,
    ],
    normal: [
      (w, s) => `I'm related to "${w.slice(0, 2)}..." — ${s}`,
      (w, s) => s.replace(/\.$/, "") + " What word fits?",
    ],
    hard: [
      (w, s) => `Not spelled out: ${s} (${w.length} letters)`,
      (w, s) => `Think sideways — ${s}`,
    ],
    harder: [
      (w, s) => `Cryptic sketch: "${s}" — answer length ${w.length}.`,
      (w, s) => `Hidden in the theme: ${s} (obscure)`,
    ],
    insane: [
      (w, s) => `Layered clue — ${s} Yet the word is ${w.length} letters only.`,
      (w, s) => `Read metaphorically: ${s}`,
    ],
    extreme: [
      (w, s) => `⚡ Extreme: peel every obvious meaning. ${s} (${w.length} letters, no letters given)`,
      (w, s) => `Master riddle — "${s}" — only the sharpest see ${w.length} letters.`,
    ],
  };

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function wordPool(categoryId, difficultyId) {
    const cat = BANK[categoryId] || BANK.mystery;
    const d = diffIndex(difficultyId);
    if (d >= diffIndex("extreme")) return cat.cryptic.length ? cat.cryptic : cat.words.filter((w) => w[0].length >= 7);
    if (d >= diffIndex("insane")) return cat.cryptic.concat(cat.words.filter((w) => w[0].length >= 6));
    if (d >= diffIndex("harder")) return cat.words.filter((w) => w[0].length >= 5);
    if (d >= diffIndex("hard")) return cat.words.filter((w) => w[0].length >= 4 && w[0].length <= 9);
    if (d >= diffIndex("normal")) return cat.words.filter((w) => w[0].length >= 3 && w[0].length <= 8);
    return cat.words.filter((w) => w[0].length <= 5);
  }

  function generate(categoryId, difficultyId) {
    const pool = wordPool(categoryId, difficultyId);
    const entry = pick(pool.length ? pool : BANK.mystery.words);
    const [answer, baseSentence] = entry;
    const templates = TEMPLATES[difficultyId] || TEMPLATES.normal;
    const clue = pick(templates)(answer, baseSentence);

    const hints = buildHints(answer, baseSentence, difficultyId);
    return {
      category: categoryId,
      difficulty: difficultyId,
      clue,
      answer,
      hints,
    };
  }

  function buildHints(answer, base, difficultyId) {
    const d = diffIndex(difficultyId);
    const hints = [];
    if (d >= 0) hints.push(`Theme check: ${base.split(" ").slice(0, 6).join(" ")}...`);
    if (d >= diffIndex("normal")) hints.push(`The answer has exactly ${answer.length} letters.`);
    if (d >= diffIndex("hard")) hints.push(`Starts with "${answer[0]}" and relates to the category.`);
    if (d >= diffIndex("harder")) hints.push(`Still not obvious? Think: ${base}`);
    if (d >= diffIndex("insane")) hints.push(`Almost given away: rhymes or pairs with common ${answer.length}-letter words.`);
    if (d >= diffIndex("extreme")) hints.push(`Final push: category experts know this ${answer.length}-letter word well.`);
    return hints;
  }

  return { generate };
})();
