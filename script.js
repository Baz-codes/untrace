// Import Firebase modules using the modular (v9) SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";

// Firebase configuration (use the values from your Firebase project)
const firebaseConfig = {
  apiKey: "AIzaSyDg9blYBnUYxTCurTIDWKJmmXFYw9o4JPY",
  authDomain: "realuntrace.firebaseapp.com",
  projectId: "realuntrace",
  storageBucket: "realuntrace.firebasestorage.app",
  messagingSenderId: "711868278652",
  appId: "1:711868278652:web:0c95f0e350c11b6d6aa6f9"
};

// Initialize Firebase and Auth
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Global variables to track user subscription status and device ID
let isPremium = false;
let deviceId;

// Initialize FingerprintJS to get a unique device identifier
const loadFingerprint = async () => {
  const fp = await FingerprintJS.load();
  const result = await fp.get();
  deviceId = result.visitorId; // Unique identifier for each device
  initializePromptTracking(); // Initialize prompt tracking data
};
loadFingerprint();

// Listen for authentication state changes
onAuthStateChanged(auth, (user) => {
  if (user) {
    // For production, retrieve subscription status from a database or custom claims.
    // Here, we use a simple check: if the email is "premium@example.com", we consider the user premium.
    isPremium = (user.email === "premium@example.com");
    document.getElementById('userStatus').innerText = isPremium
      ? "Logged in as Premium User"
      : "Logged in as Free User";
    document.getElementById('loginSection').style.display = "none";
  } else {
    document.getElementById('loginSection').style.display = "block";
    document.getElementById('userStatus').innerText = "Not logged in";
  }
});

// Handle login form submission using Firebase Auth
document.getElementById('loginForm').addEventListener('submit', function (e) {
  e.preventDefault();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();

  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      // Successful login – onAuthStateChanged will update the UI.
    })
    .catch((error) => {
      document.getElementById('loginMessage').innerText = "Login failed: " + error.message;
    });
});

// Function to convert text by replacing select letters with their Cyrillic counterparts
function convertText(text) {
  const replacements = { 'a': 'а', 'c': 'с', 'd': 'ԁ', 'p': 'р', 'e': 'e' };
  return text.replace(/[acdep]/g, letter => replacements[letter] || letter);
}

// Function to count words in the input text
function countWords(text) {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

// Initialize prompt tracking data using localStorage
function initializePromptTracking() {
  let storedData = JSON.parse(localStorage.getItem('promptUsage')) || {};
  if (!storedData[deviceId]) {
    storedData[deviceId] = { remaining: 7, resetTime: null };
  }
  localStorage.setItem('promptUsage', JSON.stringify(storedData));
  updatePromptUI();
}

// Main function to check prompt usage and convert text
window.checkAndUsePrompt = function() {
  let inputText = document.getElementById('inputText').value;
  
  // Enforce a 200-word limit for free users
  if (!isPremium && countWords(inputText) > 200) {
    alert("Free users are limited to 200 words per prompt. Please shorten your input or upgrade to premium.");
    return;
  }
  
  let storedData = JSON.parse(localStorage.getItem('promptUsage')) || {};
  let userData = storedData[deviceId] || { remaining: 7, resetTime: null };
  const currentTime = new Date().getTime();
  
  // Reset free prompts if the 24-hour period has elapsed
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
        userData.resetTime = currentTime + 24 * 60 * 60 * 1000; // Set 24-hour reset timer
        startCountdown(24 * 60 * 60);
      }
      storedData[deviceId] = userData;
      localStorage.setItem('promptUsage', JSON.stringify(storedData));
      updatePromptUI();
    }
  } else {
    alert("You've used all 7 free prompts. Upgrade to premium or wait until reset.");
  }
};

// Update the UI with the remaining prompt count and reset timer
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

// Countdown timer for prompt reset
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