function getCurrentCategoryIndex(attemptCount) {
  const categories = Object.keys(masterWordList);
  const index = Math.floor(attemptCount / 10) % categories.length;
  return index;
}

function getWordsForCategory(attemptCount) {
  const index = getCurrentCategoryIndex(attemptCount);
  const category = Object.keys(masterWordList)[index];
  return {
    category,
    words: masterWordList[category],
  };
}

function normalizeInput(inputText) {
  return inputText
    .toLowerCase()
    .replace(/[\s,]+/g, " ")
    .trim()
    .split(" ");
}

function validateWords(userWords, requiredWords) {
  const correct = new Set(requiredWords.map((w) => w.toLowerCase()));
  return userWords.filter((word) => correct.has(word));
}
