chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    unlocked: false,
    lastUnlockTime: 0,
    attemptCount: 0,
  });
});
