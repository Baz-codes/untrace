// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBMldQ1ZlHE2sSfbMNcfj7IlY6ZJ5njvdU",
  authDomain: "untrace-final.firebaseapp.com",
  projectId: "untrace-final",
  storageBucket: "untrace-final.firebasestorage.app",
  messagingSenderId: "826975738444",
  appId: "1:826975738444:web:77b7a5fcfb9acdc46c72e9"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

let isPremium = false;
let userEmail = null;
let promptData = null;

// Check user login state and update UI
auth.onAuthStateChanged(function(user) {
  if (user) {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('userStatus').style.display = 'block';
    document.getElementById('userStatus').innerText = `Welcome, ${user.email}`;
    userEmail = user.email;
    isPremium = user.email === "premium@example.com"; // <-- You can replace this with your premium emails
    initializePromptTracking();
  } else {
    document.getElementById('loginSection').style.display = 'block';
    document.getElementById('userStatus').style.display = 'none';
  }
});

// Login
document.getElementById('loginForm').addEventListener('submit', function (e) {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  auth.signInWithEmailAndPassword(email, password)
    .then(() => {
      document.getElementById('loginMessage').innerText = "Login successful!";
    })
    .catch((error) => {
      document.getElementById('loginMessage').innerText = "Login failed: " + error.message;
    });
});

// Register
document.getElementById('registerForm').addEventListener('submit', function (e) {
  e.preventDefault();
  const email = document.getElementById('registerEmail').value;
  const password = document.getElementById('registerPassword').value;
  auth.createUserWithEmailAndPassword(email, password)
    .then(() => {
      document.getElementById('registerMessage').innerText = "Registration successful! You can now log in.";
    })
    .catch((error) => {
      document.getElementById('registerMessage').innerText = "Registration failed: " + error.message;
    });
});

// Initialize or load prompt data for the user
function initializePromptTracking() {
  const stored = JSON.parse(localStorage.getItem('promptUsage')) || {};
  if (!stored[userEmail]) {
    stored[userEmail] = { remaining: 5, resetTime: null };
  }
  promptData = stored;
  updatePromptUI();
}

// Convert text
function convertText() {
  const text = document.getElementById('inputText').value;
  const wordCount = text.trim().split(/\s+/).length;
  if (!isPremium) {
    if (wordCount > 100) {
      alert("Free users can only use up to 100 words per prompt.");
      return;
    }
    let userData = promptData[userEmail];
    const currentTime = new Date().getTime();
    if (!userData.resetTime) {
      userData.resetTime = currentTime + 24 * 60 * 60 * 1000;
      startCountdown(userData.resetTime);
    } else if (currentTime >= userData.resetTime) {
      userData.remaining = 5;
      userData.resetTime = currentTime + 24 * 60 * 60 * 1000;
      startCountdown(userData.resetTime);
    }
    if (userData.remaining <= 0) {
      alert("You've used all your 5 free prompts. Please wait for reset or upgrade to premium.");
      return;
    }
    userData.remaining--;
    localStorage.setItem('promptUsage', JSON.stringify(promptData));
    updatePromptUI();
  }
  const replacements = { 'a': 'а', 'c': 'с', 'd': 'ԁ', 'p': 'р', 'e': 'e' };
  const output = text.replace(/[acdep]/g, (letter) => replacements[letter] || letter);
  document.getElementById('outputText').value = output;
}

// Update prompt UI
function updatePromptUI() {
  const userData = promptData[userEmail];
  document.getElementById('usageInfo').innerText = isPremium ? "Unlimited prompts." : `Prompts remaining: ${userData.remaining}/5`;
  if (userData.resetTime) {
    startCountdown(userData.resetTime);
  }
}

// Timer countdown
function startCountdown(endTime) {
  const timerDisplay = document.getElementById('timerDisplay');
  function updateTimer() {
    const now = new Date().getTime();
    const timeLeft = endTime - now;
    if (timeLeft <= 0) {
      timerDisplay.innerText = "Prompt limit reset!";
      promptData[userEmail] = { remaining: 5, resetTime: null };
      localStorage.setItem('promptUsage', JSON.stringify(promptData));
      updatePromptUI();
      return;
    }
    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    timerDisplay.innerText = `Next reset in: ${hours}h ${minutes}m`;
  }
  updateTimer();
  setInterval(updateTimer, 60000);
}