/* script.js */

// Global variable to track if user is premium
let isPremium = false;
let deviceId;

// Initialize FingerprintJS to track unique devices
const loadFingerprint = async () => {
  const fp = await FingerprintJS.load();
  const result = await fp.get();
  deviceId = result.visitorId; // Unique identifier for each device
  initializePromptTracking(); // Check or reset prompts
};
loadFingerprint();

// Dummy Login Simulation
// For demonstration only. In production use a secure backend authentication!
document.getElementById('loginForm').addEventListener('submit', function (e) {
  e.preventDefault();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();
  
  // Dummy credentials:
  // Premium account: premium@example.com / password
  // Free account: free@example.com / password
  if (email === "premium@example.com" && password === "password") {
    isPremium = true;
    document.getElementById('userStatus').innerText = "Logged in as Premium User";
    document.getElementById('loginSection').style.display = "none";
  } else if (email === "free@example.com" && password === "password") {
    isPremium = false;
    document.getElementById('userStatus').innerText = "Logged in as Free User";
    document.getElementById('loginSection').style.display = "none";
  } else {
    alert("Invalid credentials. Use premium@example.com or free@example.com with password 'password'.");
  }
});

// Function to replace specific letters with their Cyrillic counterparts
function convertText(text) {
  const replacements = { 'a': 'а', 'c': 'с', 'd': 'ԁ', 'p': 'р', 'e': 'e' };
  return text.replace(/[acdep]/g, letter => replacements[letter] || letter);
}

// Function to count words
function countWords(text) {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

// Retrieve stored data or initialize if none exists
function initializePromptTracking() {
  let storedData = JSON.parse(localStorage.getItem('promptUsage')) || {};
  if (!storedData[deviceId]) {
    storedData[deviceId] = { remaining: 7, resetTime: null };
  }
  localStorage.setItem('promptUsage', JSON.stringify(storedData));
  updatePromptUI();
}

// Check and use a prompt if available
function checkAndUsePrompt() {
  let inputText = document.getElementById('inputText').value;
  
  // Enforce 200-word limit for free users
  if (!isPremium && countWords(inputText) > 200) {
    alert("Free users are limited to 200 words per prompt. Please shorten your input or upgrade to premium.");
    return;
  }
  
  // For free users, retrieve stored data; premium users bypass this check
  let storedData = JSON.parse(localStorage.getItem('promptUsage')) || {};
  let userData = storedData[deviceId] || { remaining: 7, resetTime: null };
  const currentTime = new Date().getTime();
  
  // Reset prompts if the 24-hour period has passed
  if (userData.resetTime && currentTime >= userData.resetTime) {
    userData.remaining = 7;
    userData.resetTime = null;
  }
  
  if (isPremium || userData.remaining > 0) {
    let outputText = convertText(inputText);
    document.getElementById('outputText').value = outputText;
    
    if (!isPremium) {
      userData.remaining -= 1;
      if (userData.remaining === 0) {
        userData.resetTime = currentTime + 24 * 60 * 60 * 1000; // 24-hour reset
        startCountdown(24 * 60 * 60);
      }
      storedData[deviceId] = userData;
      localStorage.setItem('promptUsage', JSON.stringify(storedData));
      updatePromptUI();
    }
  } else {
    alert("You've used all 7 free prompts. Upgrade to premium or wait until reset.");
  }
}

// Update UI with remaining prompts and timer
function updatePromptUI() {
  let storedData = JSON.parse(localStorage.getItem('promptUsage')) || {};
  let userData = storedData[deviceId] || { remaining: 7, resetTime: null };
  document.getElementById('remainingPrompts').innerText = userData.remaining;

  if (userData.resetTime) {
    const remainingTimeInSeconds = Math.floor((userData.resetTime - new Date().getTime()) / 1000);
    if (remainingTimeInSeconds > 0) {
      startCountdown(remainingTimeInSeconds);
    } else {
      userData.remaining = 7;
      userData.resetTime = null;
      storedData[deviceId] = userData;
      localStorage.setItem('promptUsage', JSON.stringify(storedData));
      updatePromptUI();
    }
  }
}

// Start countdown timer
function startCountdown(durationInSeconds) {
  let timerElement = document.getElementById('timer');
  let timeLeft = durationInSeconds;

  function updateTimerDisplay() {
    let hours = Math.floor(timeLeft / 3600);
    let minutes = Math.floor((timeLeft % 3600) / 60);
    timerElement.innerText = `${hours}:${minutes.toString().padStart(2, '0')}`;
  }

  updateTimerDisplay();
  let countdown = setInterval(() => {
    timeLeft--;
    if (timeLeft <= 0) {
      clearInterval(countdown);
      let storedData = JSON.parse(localStorage.getItem('promptUsage')) || {};
      storedData[deviceId] = { remaining: 7, resetTime: null };
      localStorage.setItem('promptUsage', JSON.stringify(storedData));
      updatePromptUI();
    } else {
      updateTimerDisplay();
    }
  }, 1000);
}