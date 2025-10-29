// This is the "Brain" for the popup.html

// We wrap our main code in an event listener.
// 'DOMContentLoaded' fires when the popup.html has finished loading.
document.addEventListener('DOMContentLoaded', () => {

  const input = document.getElementById('domain-input');
  const addButton = document.getElementById('add-button');
  const container = document.getElementById('blacklist-container');
  const loadingMessage = document.getElementById('loading-message');

  let currentBlacklist = []; // This will hold our list in memory

  /**
   * Main function to load the list from storage and display it.
   */
  async function loadBlacklist() {
    const data = await chrome.storage.local.get('safelink_blacklist');
    currentBlacklist = data.safelink_blacklist || [];
    renderBlacklist();
  }

  /**
   * Re-draws the entire blacklist in the UI.
   * This is called after we load, add, or remove an item.
   */
  function renderBlacklist() {
    // 1. Clear the current list
    container.innerHTML = ''; 

    if (currentBlacklist.length === 0) {
      loadingMessage.textContent = 'Blacklist is empty.';
      container.appendChild(loadingMessage);
      return;
    }

    // 2. Loop through the list and create an HTML element for each item
    currentBlacklist.forEach((domain, index) => {
      const listItem = document.createElement('div');
      listItem.className = 'list-item';

      // Create the domain name text
      const domainName = document.createElement('span');
      domainName.className = 'domain-name';
      domainName.textContent = domain;

      // Create the "Remove" button
      const removeButton = document.createElement('button');
      removeButton.className = 'remove-button';
      removeButton.textContent = '×'; // This is a "times" symbol
      
      // Add an event listener to the remove button
      // We use 'data-index' to know which item to remove
      removeButton.dataset.index = index;
      removeButton.addEventListener('click', handleRemove);

      // Add the text and button to the list item
      listItem.appendChild(domainName);
      listItem.appendChild(removeButton);

      // Add the list item to the main container
      container.appendChild(listItem);
    });
  }

  /**
   * Saves the entire 'currentBlacklist' array back into storage.
   */
  async function saveBlacklist() {
    await chrome.storage.local.set({ safelink_blacklist: currentBlacklist });
  }

  /**
   * Event handler for the "Add" button.
   */
  async function handleAdd() {
    const newDomain = input.value.trim().toLowerCase();

    // Clean the input (remove http://, www., etc.)
    const cleanDomain = newDomain.replace(/^(?:https?:\/\/)?(?:www\.)?/i, '').split('/')[0];

    if (cleanDomain.length === 0) {
      return; // Do nothing if input is empty
    }

    // Check for duplicates
    if (currentBlacklist.includes(cleanDomain)) {
      input.value = ''; // Clear input
      return; // Do nothing if it's already on the list
    }

    // 1. Add to our local array
    currentBlacklist.push(cleanDomain);
    
    // 2. Save the *entire* updated array to storage
    await saveBlacklist();
    
    // 3. Re-draw the UI
    renderBlacklist();
    
    // 4. Clear the input box
    input.value = '';
  }

  /**
   * Event handler for the "Remove" buttons.
   */
  async function handleRemove(event) {
    // Get the index from the 'data-index' attribute we set
    const indexToRemove = parseInt(event.target.dataset.index, 10);

    // 1. Remove the item from our local array
    currentBlacklist.splice(indexToRemove, 1);
    
    // 2. Save the updated array to storage
    await saveBlacklist();
    
    // 3. Re-draw the UI
    renderBlacklist();
  }

  // --- Start the script ---
  
  // 1. Add listeners to the "Add" button
  addButton.addEventListener('click', handleAdd);
  
  // 2. Allow pressing "Enter" to add a domain
  input.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
      handleAdd();
    }
  });

  // 3. Load the initial list from storage
  loadBlacklist();

});