// This is the "Lookout" script. It runs on the webpage.

(async () => {
  // 1. LOAD ALL DATA FROM THE DATABASE
  // We fetch *both* the blacklist and the settings.
  const data = await chrome.storage.local.get([
    'safelink_blacklist',
    'safelink_settings'
  ]);
  
  // Load blacklist
  const blacklist = data.safelink_blacklist || [];
  
  // Load settings, using 'true' as the default for all
  const settings = {
    checkImposter: data.safelink_settings?.checkImposter ?? true,
    checkBlacklist: data.safelink_settings?.checkBlacklist ?? true,
    checkHttp: data.safelink_settings?.checkHttp ?? true
  };
  
  if (blacklist.length > 0) {
    console.log(`SafeLink: Blacklist loaded with ${blacklist.length} domains.`);
  }

  // 2. DEFINE OUR "WARNING" ICON
  function injectWarningIcon(linkElement, reason) {
    if (linkElement.nextElementSibling && linkElement.nextElementSibling.classList.contains('safelink-warning-icon')) {
      return;
    }
    const icon = document.createElement('span');
    icon.textContent = '⚠️';
    icon.className = 'safelink-warning-icon';
    icon.style.cssText = `
      cursor: help; font-size: 1.1em; margin-left: 4px;
      margin-right: 4px; color: red; text-shadow: 0 0 3px rgba(0,0,0,0.5);
    `;
    icon.title = `SafeLink Warning: This link is suspicious.\nReason: ${reason}`;
    linkElement.insertAdjacentElement('afterend', icon);
  }

  // 3. DEFINE THE CORE EVENT HANDLER
  function handleMouseOver(event) {
    const linkElement = event.target.closest('a');
    if (!linkElement || !linkElement.href) return;
    if (linkElement.dataset.safelinkProcessed) return;
    linkElement.dataset.safelinkProcessed = 'true';

    const domain = getDomainFromUrl(linkElement.href);
    if (!domain) return;

    // === THIS IS THE CORE LOGIC ===
    // This line now correctly passes the 'settings' object
    const reason = analyzeUrl(linkElement.href, domain, blacklist, settings);

    if (reason) {
      injectWarningIcon(linkElement, reason);
    }
  }

  // 4. ADD LISTENER TO ALL LINKS ON THE PAGE
  document.addEventListener('mouseover', handleMouseOver);

})();