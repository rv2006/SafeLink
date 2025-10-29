// This file is our "Brain." It contains all the logic.

/**
 * A "safe list" of domains we trust. We will check for "imposters" against this list.
 */
const SAFE_DOMAINS = [
  'google.com',
  'youtube.com',
  'facebook.com',
  'amazon.com',
  'reddit.com',
  'wikipedia.org',
  'twitter.com',
  'instagram.com',
  'linkedin.com',
  'paypal.com',
  // You can add your bank's website here
];

/**
 * This is our main analysis function.
 * It will be called by content.js and will return a "reason" if the URL is unsafe.
 */
function analyzeUrl(url, domain, blacklist) {
  // Check 1: Is it unencrypted?
  if (isHttp(url)) {
    return 'Unencrypted (HTTP)';
  }

  // Check 2: Is it on our manually-added blacklist?
  if (isBlacklisted(domain, blacklist)) {
    return 'On Blacklist';
  }

  // Check 3: Is it an "imposter" (typosquatting)?
  if (isTyposquatted(domain)) {
    return 'Possible Imposter';
  }

  // If no checks failed, it's safe.
  return null;
}

// --- CHECK 1: HTTP ---
function isHttp(url) {
  return url.startsWith('http://');
}

// --- CHECK 2: BLACKLIST ---
function isBlacklisted(domain, blacklist) {
  // The blacklist is an array of domains.
  // .some() is a JS function that checks if *any* item in the array passes a test.
  return blacklist.some(blacklistedDomain => domain.includes(blacklistedDomain));
}

// --- CHECK 3: TYPOSQUATTING ---
function isTyposquatted(domain) {
  const maxDistance = 2; // Allow 2 "mistakes" (e.g., 'gogle.com' or 'amaz0n.com')

  // Loop through our list of safe domains
  for (const safeDomain of SAFE_DOMAINS) {
    const distance = levenshtein(domain, safeDomain);

    if (distance > 0 && distance <= maxDistance) {
      // It's not a perfect match, but it's dangerously close.
      return true;
    }
  }
  return false;
}

/**
 * A helper function to get just the domain from a full URL.
 * e.g., "https://www.google.com/search?q=test"  =>  "google.com"
 */
function getDomainFromUrl(url) {
  try {
    const urlObj = new URL(url);
    // This gets 'www.google.com' and we remove the 'www.'
    return urlObj.hostname.replace(/^www\./, '');
  } catch (e) {
    // This might fail if the link is not a valid URL (e.g., "mailto:test@test.com")
    return null;
  }
}

/**
 * This is the Levenshtein distance algorithm.
 * It's a classic algorithm that calculates the number of "edits" (insertions,
 * deletions, or substitutions) required to change one string into the other.
 * You don't need to understand *how* it works, just *what* it does:
 *
 * levenshtein('google.com', 'gogle.com')   => 1
 * levenshtein('amazon.com', 'amaz0n.com') => 1
 * levenshtein('paypal.com', 'paypa1.com') => 1
 * levenshtein('google.com', 'facebook.com') => 8
 */
function levenshtein(s1, s2) {
  s1 = s1.toLowerCase();
  s2 = s2.toLowerCase();
  const costs = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i == 0) {
        costs[j] = j;
      } else {
        if (j > 0) {
          let newValue = costs[j - 1];
          if (s1.charAt(i - 1) != s2.charAt(j - 1)) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          }
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}


/**
 * A helper function to load our blacklist file.
 * We will call this from content.js when the page first loads.
 * 'async' means this function does a task that takes time (like I/O).
 */
async function loadBlacklist() {
  try {
    const url = chrome.runtime.getURL('blacklist.txt');
    const response = await fetch(url); // 'await' pauses the function until the file is fetched
    const text = await response.text();
    // Split the text file by new lines, filter out any empty lines
    return text.split('\n').filter(domain => domain.trim().length > 0);
  } catch (e) {
    console.error('SafeLink Error: Could not load blacklist.', e);
    return [];
  }
}