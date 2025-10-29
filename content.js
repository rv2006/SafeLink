// This is the "Lookout" script. It runs on the webpage.

/**
 * This is an "Immediately Invoked Function Expression" (IIFE).
 * It's a common JavaScript pattern that runs all our code immediately
 * in a private scope, so we don't conflict with the website's own code.
 * The 'async' keyword is here because we need to 'await' our blacklist.
 */
(async () => {
  // 1. LOAD THE "BRAIN" AND DATA
  // This is the first thing we do. We load the blacklist into memory.
  const blacklist = await loadBlacklist();
  if (blacklist.length > 0) {
    console.log(`SafeLink: Blacklist loaded with ${blacklist.length} domains.`);
  }

  // 2. DEFINE OUR "WARNING" ICON
  // This function creates the little red warning icon we will inject.
  function injectWarningIcon(linkElement, reason) {
    // Check if we already injected an icon for this link.
    // We check if the *next element over* is our icon.
    if (linkElement.nextElementSibling && linkElement.nextElementSibling.classList.contains('safelink-warning-icon')) {
      return; // Already added
    }

    // Create the icon element
    const icon = document.createElement('span');
    icon.textContent = '⚠️';
    icon.className = 'safelink-warning-icon';

    // Style the icon. This is "inline CSS."
    icon.style.cssText = `
      cursor: help;
      font-size: 1.1em;
      margin-left: 4px;
      margin-right: 4px;
      color: red;
      text-shadow: 0 0 3px rgba(0,0,0,0.5);
    `;

    // This creates the "tooltip" you see when you hover over the icon.
    icon.title = `SafeLink Warning: This link is suspicious.\nReason: ${reason}`;

    // Add the icon right after the link.
    linkElement.insertAdjacentElement('afterend', icon);
  }

 // 3. DEFINE THE CORE EVENT HANDLER
  // This function runs every time a user hovers over any link.
  function handleMouseOver(event) {
    // 'event.target' is the element the mouse just moved onto.
    // We use .closest('a') to find the nearest link (the <a> tag).
    const linkElement = event.target.closest('a');

    // If it's not a link or has no href, ignore it.
    if (!linkElement || !linkElement.href) {
      return;
    }

    // --- NEW LOGIC ---
    // Check if we have already processed this link. If so, stop.
    if (linkElement.dataset.safelinkProcessed) {
      return;
    }
    // Set the flag *immediately* to prevent this function
    // from running twice on the same link (a "race condition").
    linkElement.dataset.safelinkProcessed = 'true';
    // --- END NEW LOGIC ---

    // Get the domain from the link's href.
    const domain = getDomainFromUrl(linkElement.href);
    if (!domain) {
      return;
    }

    // === THIS IS THE CORE LOGIC ===
    // We call our "Brain" (analysis.js) to do the hard work.
    const reason = analyzeUrl(linkElement.href, domain, blacklist);

    // If the "Brain" returned a reason, the link is unsafe.
    if (reason) {
      injectWarningIcon(linkElement, reason);
    }
  }

  // 4. ADD LISTENER TO ALL LINKS ON THE PAGE
  // This is all we need. It will listen for 'mouseover' events
  // as they "bubble up" from any element (like a link) to the
  // top of the document. This is very efficient and works on
  // dynamic content without a MutationObserver.
  document.addEventListener('mouseover', handleMouseOver);

})();