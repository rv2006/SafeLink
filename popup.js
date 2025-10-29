// This is the "Brain" for the popup.html

// We wrap our main code in an event listener.
// 'DOMContentLoaded' fires when the popup.html has finished loading.
document.addEventListener('DOMContentLoaded', () => {

  // --- Get references to all our HTML elements ---
  const input = document.getElementById('domain-input');
  const addButton = document.getElementById('add-button');
  const container = document.getElementById('blacklist-container');
  const loadingMessage = document.getElementById('loading-message');

  // New setting toggles
  const checkImposter = document.getElementById('check-imposter');
  const checkBlacklist = document.getElementById('check-blacklist');
  const checkHttp = document.getElementById('check-http');

  let currentBlacklist = []; // This will hold our list in memory

  // Object to hold our settings
  const settings = {
    checkImposter: true,  // Default values
    checkBlacklist: true,
    checkHttp: true
  };

  /**
   * Main function to load ALL data from storage (list AND settings)
   */
  async function loadData() {
    // We use 'null' to get ALL items from storage
    const data = await chrome.storage.local.get(null);

    // Load blacklist
    currentBlacklist = data.safelink_blacklist || [];
    
    // Load settings, using defaults if they don't exist yet
    settings.checkImposter = data.safelink_settings?.checkImposter ?? true;
    settings.checkBlacklist = data.safelink_settings?.checkBlacklist ?? true;
    settings.checkHttp = data.safelink_settings?.checkHttp ?? true;

    // Update the UI
    renderBlacklist();
    renderSettings();
  }

  /**
   * Re-draws the entire blacklist in the UI.
   */
  function renderBlacklist() {
    container.innerHTML = ''; 

    if (currentBlacklist.length === 0) {
      loadingMessage.textContent = 'Blacklist is empty.';
      container.appendChild(loadingMessage);
      return;
    }

    currentBlacklist.forEach((domain, index) => {
      const listItem = document.createElement('div');
      listItem.className = 'list-item';

      const domainName = document.createElement('span');
      domainName.className = 'domain-name';
      domainName.textContent = domain;

      const removeButton = document.createElement('button');
      removeButton.className = 'remove-button';
      removeButton.textContent = '×';
      
      removeButton.dataset.index = index;
      removeButton.addEventListener('click', handleRemove);

      listItem.appendChild(domainName);
      listItem.appendChild(removeButton);
      container.appendChild(listItem);
    });
  }

  /**
   * Updates the toggle switches to match our loaded settings.
   */
  function renderSettings() {
    checkImposter.checked = settings.checkImposter;
    checkBlacklist.checked = settings.checkBlacklist;
    checkHttp.checked = settings.checkHttp;
  }

  /**
   * Saves the entire 'currentBlacklist' array back into storage.
   */
  async function saveBlacklist() {
    await chrome.storage.local.set({ safelink_blacklist: currentBlacklist });
  }

  /**
   * Saves the 'settings' object back into storage.
   */
  async function saveSettings() {
    // We save the settings under a *new* key
    await chrome.storage.local.set({ safelink_settings: settings });
  }

  /**
   * Event handler for the "Add" button.
   */
  async function handleAdd() {
    const newDomain = input.value.trim().toLowerCase();
    const cleanDomain = newDomain.replace(/^(?:https?:\/\/)?(?:www\.)?/i, '').split('/')[0];

    if (cleanDomain.length === 0) return;
    if (currentBlacklist.includes(cleanDomain)) {
      input.value = '';
      return;
    }

    currentBlacklist.push(cleanDomain);
    await saveBlacklist();
    renderBlacklist();
    input.value = '';
  }

  /**
   * Event handler for the "Remove" buttons.
   */
  async function handleRemove(event) {
    const indexToRemove = parseInt(event.target.dataset.index, 10);
    currentBlacklist.splice(indexToRemove, 1);
    await saveBlacklist();
    renderBlacklist();
  }

  /**
   * Event handler for when a setting toggle is clicked.
   */
  async function handleSettingChange(event) {
    // 'event.target.id' will be "check-imposter", "check-blacklist", etc.
    const key = event.target.id.split('-')[1]; // "imposter", "blacklist", "http"
    const value = event.target.checked; // true or false

    if (key === 'imposter') settings.checkImposter = value;
    if (key === 'blacklist') settings.checkBlacklist = value;
    if (key === 'http') settings.checkHttp = value;

    // Save the updated settings object
    await saveSettings();
  }

  // --- Start the script ---
  
  // 1. Add listeners to the "Add" button and "Enter" key
  addButton.addEventListener('click', handleAdd);
  input.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') handleAdd();
  });

  // 2. Add listeners to the new setting toggles
  checkImposter.addEventListener('change', handleSettingChange);
  checkBlacklist.addEventListener('change', handleSettingChange);
  checkHttp.addEventListener('change', handleSettingChange);

  // 3. Load all initial data (blacklist AND settings)
  loadData();

});