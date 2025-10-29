/**
 * This is an "Immediately Invoked Function Expression" (IIFE).
 * It's a common JavaScript pattern that runs all our code immediately
 * The 'async' keyword is here because we need to 'await' our blacklist.
 */
// This is the "Lookout" script. It runs on the webpage.

(async () => {
  // 1. LOAD THE DATA FROM THE DATABASE
  // We fetch our 'safelink_blacklist' key from chrome.storage.
  const data = await chrome.storage.local.get('safelink_blacklist');
  
  // Make sure the blacklist exists and isn't empty
  const blacklist = data.safelink_blacklist || [];
  
  if (blacklist.length > 0) {
    console.log(`SafeLink: Blacklist loaded from storage with ${blacklist.length} domains.`);
  }

  // 2. DEFINE OUR "WARNING" ICON
  // This function creates the little red warning icon we will inject.
  function injectWarningIcon(linkElement, reason) {
    // Check if we already injected an icon for this link.
    if (linkElement.nextElementSibling && linkElement.nextElementSibling.classList.contains('safelink-warning-icon')) {
      return; // Already added
    }

    const icon = document.createElement('span');
    icon.textContent = '⚠️';
    icon.className = 'safelink-warning-icon';

    icon.style.cssText = `
      cursor: help;
      font-size: 1.1em;
      margin-left: 4px;
      margin-right: 4px;
      color: red;
      text-shadow: 0 0 3px rgba(0,0,0,0.5);
    `;

    icon.title = `SafeLink Warning: This link is suspicious.\nReason: ${reason}`;
    linkElement.insertAdjacentElement('afterend', icon);
  }

  // 3. DEFINE THE CORE EVENT HANDLER
  // This function runs every time a user hovers over any link.
  function handleMouseOver(event) {
    const linkElement = event.target.closest('a');

    if (!linkElement || !linkElement.href) {
      return;
    }

    // Check if we have already processed this link.
    if (linkElement.dataset.safelinkProcessed) {
      return;
    }
    // Set the flag *immediately* to prevent race conditions.
    linkElement.dataset.safelinkProcessed = 'true';

    const domain = getDomainFromUrl(linkElement.href);
    if (!domain) {
      return;
    }

    // === THIS IS THE CORE LOGIC ===
    // We pass the 'blacklist' array we got from storage.
    const reason = analyzeUrl(linkElement.href, domain, blacklist);

    if (reason) {
      injectWarningIcon(linkElement, reason);
    }
  }

  // 4. ADD LISTENER TO ALL LINKS ON THE PAGE
  document.addEventListener('mouseover', handleMouseOver);

})();