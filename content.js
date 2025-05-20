chrome.storage.local.get(["unlocked", "lastUnlockTime"], (result) => {
  const SIX_MINUTES = 6 * 60 * 1000;
  const now = Date.now();

  const shouldLock =
    !result.unlocked || now - result.lastUnlockTime > SIX_MINUTES;

  if (shouldLock) {
    chrome.storage.local.set({ unlocked: false }, () => {
      if (!window.location.href.includes("lock.html")) {
        chrome.storage.local.set({ lockedUrl: window.location.href }, () => {
          window.location.href = chrome.runtime.getURL("lock.html");
        });
      }
    });
  }
});
