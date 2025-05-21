const categoryDiv = document.querySelector("#category");
const wordListDiv = document.querySelector("#wordList");
const inputField = document.querySelector("#inputField");
const progressText = document.querySelector("#progress");
const message = document.querySelector("#message");
const timer = document.querySelector("#timer");
const submitBtn = document.querySelector("#submitBtn");

let words = [];
let category = "";

const tooltipMeaningBox = document.querySelector("#tooltipMeaningBox");


function getCurrentCategoryIndex(attemptCount) {
  const categories = Object.keys(masterWordList);
  return attemptCount % categories.length;
}

function getWordsForCategory(attemptCount) {
  const index = getCurrentCategoryIndex(attemptCount);
  const key = Object.keys(masterWordList)[index];
  return {
    category: key,
    words: masterWordList[key].words,
    sentence: masterWordList[key].sentence,
  };
}

// Load category and words
chrome.storage.local.get(["attemptCount"], (res) => {
  const attemptCount = res.attemptCount || 0;
  const result = getWordsForCategory(attemptCount);
  words = result.words;
  category = result.category;

  categoryDiv.innerText = `Category: ${category}`;
  wordListDiv.innerText = result.sentence;
});

let timeLeft = 300;
const countdown = setInterval(() => {
  timeLeft--;
  timer.innerText = `⏳ Time left: ${timeLeft}s`;
  if (timeLeft <= 0) {
    clearInterval(countdown);
    message.innerText = "⛔ Time's up!";
    inputField.setAttribute("contenteditable", "false");
  }
}, 1000);

// Normalize input
function normalizeInput(text) {
  return text.trim().split(/\s+/).filter(Boolean);
}

function escapeHTML(str) {
  return str.replace(/&/g, "&amp;")
            .replace(/"/g, "&quot;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
}

// Live preview
inputField.addEventListener("input", () => {
  const userWords = updateLivePreview();  // 👈 Capture returned value
  const lastWord = userWords[userWords.length - 1];
  const match = words.find((w) => w.word.toLowerCase() === lastWord?.toLowerCase());

  if (match) {
    tooltipMeaningBox.innerText = `📘 ${match.word}: ${match.meaning}`;
  } else {
    tooltipMeaningBox.innerText = "";
  }
});



function updateLivePreview() {
  const caretOffset = getCaretCharacterOffsetWithin(inputField);
  const rawText = inputField.innerText;
  const userWords = normalizeInput(rawText);
  inputField.innerHTML = "";

  let matchedCount = 0;

  userWords.forEach((word) => {
    const lowerWord = word.toLowerCase();
    const match = words.find((w) => w.word.toLowerCase() === lowerWord);
    const isCorrect = !!match;
    if (isCorrect) matchedCount++;

    const span = document.createElement("span");
    span.textContent = word;
    if (isCorrect) {
      span.setAttribute("title", match.meaning);
    } else {
      span.classList.add("wrong");
    }

    inputField.appendChild(span);
    inputField.appendChild(document.createTextNode(" "));
  });

  restoreCaretAtOffset(inputField, caretOffset);
  progressText.innerText = `${matchedCount}/${words.length} correct`;

  return userWords; // ✅ Return for use in tooltip
}


{/*



function updateLivePreview() {
  const caretOffset = getCaretCharacterOffsetWithin(inputField);
  const rawText = inputField.innerText;
  const userWords = normalizeInput(rawText);
  inputField.innerHTML = "";

  let matchedCount = 0;

  userWords.forEach((word) => {
    const lowerWord = word.toLowerCase();
    const match = words.find((w) => w.word && w.word.toLowerCase() === lowerWord);
    const isCorrect = !!match;
    if (isCorrect) matchedCount++;

    const span = document.createElement("span");
    span.textContent = word;
    if (isCorrect) {
      span.setAttribute("title", match.meaning);
    } else {
      span.classList.add("wrong");
    }

    inputField.appendChild(span);
    inputField.appendChild(document.createTextNode(" "));
  });

  restoreCaretAtOffset(inputField, caretOffset);
  progressText.innerText = `${matchedCount}/${words.length} correct`;
}
*/}

// Speech
inputField.addEventListener("keyup", (e) => {
  if (e.key === " ") {
    const text = inputField.innerText.trim();
    const parts = text.split(/\s+/);
    const lastWord = parts[parts.length - 1];
    if (lastWord) {
      speakWord(lastWord);
    }
  }
});

function speakWord(word) {
  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = "en-US";
  speechSynthesis.speak(utterance);
}

// Submit button
submitBtn.addEventListener("click", () => {
  const rawText = inputField.innerText;
  const userWords = normalizeInput(rawText);
  const correctWords = words.map((w) => w.word.toLowerCase());

  let html = "";
  let matchedCount = 0;

  userWords.forEach((word) => {
    const lowerWord = word.toLowerCase();
    const match = words.find((w) => w.word.toLowerCase() === lowerWord);
    const isCorrect = !!match;
    if (isCorrect) matchedCount++;

    const tooltip = match ? `title="${escapeHTML(match.meaning)}"` : "";
    html += `<span class="${isCorrect ? "" : "wrong"}" ${tooltip}>${escapeHTML(word)}</span> `;
  });

  inputField.innerHTML = html.trim();
  progressText.innerText = `${matchedCount}/${words.length} correct`;

  if (matchedCount === words.length) {
    chrome.storage.local.get(["attemptCount", "lockedUrl"], (res) => {
      const attemptCount = res.attemptCount || 0;
      chrome.storage.local.set({
        unlocked: true,
        lastUnlockTime: Date.now(),
        attemptCount: attemptCount + 1,
      });

      if (res.lockedUrl) {
        setTimeout(() => {
          speakWord(words.map(w => w.word).join(" "));
          window.location.href = res.lockedUrl;
        }, 3000);
      } else {
        message.innerText = "✅ Unlocked!";
      }
    });
  } else {
    message.innerText = "❌ Some words are incorrect!";
  }
});

// Caret helpers
function getCaretCharacterOffsetWithin(element) {
  let caretOffset = 0;
  const selection = window.getSelection();
  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(element);
    preCaretRange.setEnd(range.endContainer, range.endOffset);
    caretOffset = preCaretRange.toString().length;
  }
  return caretOffset;
}

function restoreCaretAtOffset(element, offset) {
  const range = document.createRange();
  const sel = window.getSelection();

  let charIndex = 0;
  const nodeStack = [element];
  let node, foundStart = false;

  while ((node = nodeStack.pop())) {
    if (node.nodeType === 3) {
      const nextCharIndex = charIndex + node.length;
      if (!foundStart && offset >= charIndex && offset <= nextCharIndex) {
        range.setStart(node, offset - charIndex);
        range.collapse(true);
        foundStart = true;
        break;
      }
      charIndex = nextCharIndex;
    } else {
      let i = node.childNodes.length;
      while (i--) {
        nodeStack.push(node.childNodes[i]);
      }
    }
  }

  sel.removeAllRanges();
  sel.addRange(range);
}
