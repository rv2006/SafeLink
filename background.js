// This is the background service worker.
// It handles events for the extension.

/**
 * An event listener that runs *only* when the extension is first installed.
 * We use this to set up our initial database.
 */
chrome.runtime.onInstalled.addListener(async (details) => {
  // Check if this is the first install.
  if (details.reason === 'install') {
    try {
      // 1. Get the URL of our local 'blacklist.txt' file
      const url = chrome.runtime.getURL('blacklist.txt');
      
      // 2. Fetch the file's contents
      const response = await fetch(url);
      const text = await response.text();
      
      // 3. Convert the text into a clean array of domains
      const blacklistArray = text.split('\n').filter(domain => domain.trim().length > 0);

      // 4. Save this array to the 'chrome.storage.local' database
      // We are creating a new "key" named 'safelink_blacklist'
      await chrome.storage.local.set({ safelink_blacklist: blacklistArray });

      console.log('SafeLink: Initial blacklist loaded into storage.');
      
    } catch (e) {
      console.error('SafeLink Error: Failed to initialize blacklist.', e);
    }
  }
});