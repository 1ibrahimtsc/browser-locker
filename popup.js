const categoryDiv = document.querySelector("#category");
const wordListDiv = document.querySelector("#wordList");
const inputField = document.querySelector("#inputField");
const progressText = document.querySelector("#progress");
const message = document.querySelector("#message");
const timer = document.querySelector("#timer");

let words = [];
let category = "";

function getWordsForCategory(attemptCount) {
  const index = getCurrentCategoryIndex(attemptCount);
  const key = Object.keys(masterWordList)[index];
  return {
    category: key,
    words: masterWordList[key].words,
    sentence: masterWordList[key].sentence,
  };
}


chrome.storage.local.get(["attemptCount"], (res) => {
  const attemptCount = res.attemptCount || 0;
  const result = getWordsForCategory(attemptCount);
  words = result.words;
  category = result.category;

  categoryDiv.innerText = `Category: ${category}`;
  wordListDiv.innerText = result.sentence; // বাক্য দেখান
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

// ✅ স্পেস চাপলে সর্বশেষ শব্দ উচ্চারণ
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
  utterance.lang = "en-US"; // চাইলে "bn-BD" ব্যবহার করতে পারেন
  speechSynthesis.speak(utterance);
}

document.querySelector("#submitBtn").addEventListener("click", () => {
  const rawText = inputField.innerText;
  const userWords = normalizeInput(rawText);
  const correctWords = words.map((w) => w.toLowerCase());

  let html = "";
  let matchedCount = 0;

  userWords.forEach((word) => {
    const isCorrect = correctWords.includes(word.toLowerCase());
    if (isCorrect) matchedCount++;
    html += `<span class="${isCorrect ? "" : "wrong"}">${word}</span> `;
  });

  inputField.innerHTML = html.trim();
  progressText.innerText = `${matchedCount}/${words.length} correct`;

	  {/*
	  if (matchedCount === words.length) {
    chrome.storage.local.get(["attemptCount", "lockedUrl"], (res) => {
      const attemptCount = res.attemptCount || 0;
      chrome.storage.local.set({
        unlocked: true,
        lastUnlockTime: Date.now(),
        attemptCount: attemptCount + 1,
      });

      if (res.lockedUrl) {
        window.location.href = res.lockedUrl;
      } else {
        message.innerText = "✅ Unlocked!";
      }
    });
  } else {
    message.innerText = "❌ Some words are incorrect!";
  }
	  */}  
  
  function speakSentence(sentence) {
  const utterance = new SpeechSynthesisUtterance(sentence);
  utterance.lang = "en-US"; // বাংলা হলে "bn-BD"
  utterance.rate = 1; // চাইলে স্পিড কমাতে পারেন (যেমন 0.9)
  speechSynthesis.speak(utterance);
}

  if (matchedCount === words.length) {
    const sentence = wordListDiv.innerText;
    speakSentence(sentence); // ✅ বাক্যটি উচ্চারণ করুন

    // ✅ ৩ সেকেন্ড অপেক্ষা করে redirect
    setTimeout(() => {
      chrome.storage.local.get(["attemptCount", "lockedUrl"], (res) => {
        const attemptCount = res.attemptCount || 0;
        chrome.storage.local.set({
          unlocked: true,
          lastUnlockTime: Date.now(),
          attemptCount: attemptCount + 1,
        });

        if (res.lockedUrl) {
          window.location.href = res.lockedUrl;
        } else {
          message.innerText = "✅ Unlocked!";
        }
      });
    }, 3000); // ৩ সেকেন্ড (3000 মিলিসেকেন্ড) ডিলে
  } else {
    message.innerText = "❌ Some words are incorrect!";
  }
});
