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
const db = firebase.firestore();

let isPremium = false;
let promptData = null;
let userEmail = null;

auth.onAuthStateChanged(function(user) {
  if (user) {
    userEmail = user.email.toLowerCase();
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('userStatus').style.display = 'block';
    document.getElementById('logoutButton').style.display = 'inline-block';
    document.getElementById('userStatus').innerText = `Welcome, ${userEmail}`;
    checkPremiumOnceAfterLogin();
  } else {
    document.getElementById('loginSection').style.display = 'block';
    document.getElementById('userStatus').style.display = 'none';
    document.getElementById('logoutButton').style.display = 'none';
  }
});

function checkPremiumOnceAfterLogin() {
  db.collection('users').doc(userEmail).get()
    .then((doc) => {
      if (doc.exists) {
        isPremium = doc.data().premium === true;
      } else {
        isPremium = false;
      }

      if (isPremium) {
        document.getElementById('usageInfo').innerText = "Unlimited prompts.";
        document.getElementById('timerDisplay').innerText = "";
        document.getElementById('userStatus').innerText += " ⭐ Premium";
        localStorage.removeItem('promptUsage');
      } else {
        initializePromptTracking();
      }
    })
    .catch((error) => {
      console.error('Error checking premium status:', error);
      isPremium = false;
      initializePromptTracking();
    });
}

function sendVerificationEmail() {
  if (auth.currentUser) {
    auth.currentUser.sendEmailVerification()
      .then(() => {
        document.getElementById('emailVerificationMessage').innerText = "✅ Verification email sent. Check your inbox and click the link. Then log out and log back in.";
      })
      .catch((error) => {
        console.error("❌ Failed to send verification email:", error);
        document.getElementById('emailVerificationMessage').innerText = "❌ Failed to send verification email: " + error.message;
      });
  } else {
    document.getElementById('emailVerificationMessage').innerText = "❌ Please login first.";
  }
}

function convertText() {
  if (!auth.currentUser) {
    alert("Please login first.");
    return;
  }

  if (isPremium) {
    proceedWithConversion();
  } else {
    proceedWithFreeUserFlow();
  }
}

function proceedWithConversion() {
  const text = document.getElementById('inputText').value;
  const replacements = { 'a': 'а', 'c': 'с', 'd': 'ԁ', 'p': 'р', 'e': 'e' };
  const output = text.replace(/[acdep]/g, (letter) => replacements[letter] || letter);
  document.getElementById('outputText').value = output;
}

function proceedWithFreeUserFlow() {
  const text = document.getElementById('inputText').value;
  const wordCount = text.trim().split(/\s+/).length;
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
  proceedWithConversion();
}

function initializePromptTracking() {
  const stored = JSON.parse(localStorage.getItem('promptUsage')) || {};
  if (!stored[userEmail]) {
    stored[userEmail] = { remaining: 5, resetTime: null };
  }
  promptData = stored;
  updatePromptUI();
}

function updatePromptUI() {
  if (isPremium) {
    document.getElementById('usageInfo').innerText = "Unlimited prompts.";
    document.getElementById('timerDisplay').innerText = "";
    return;
  }
  const userData = promptData[userEmail];
  document.getElementById('usageInfo').innerText = `Prompts remaining: ${userData.remaining}/5`;
  if (userData.resetTime) {
    startCountdown(userData.resetTime);
  }
}

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

document.getElementById('logoutButton').addEventListener('click', function () {
  auth.signOut().then(() => {
    alert("You have been logged out.");
    location.reload();
  }).catch((error) => {
    console.error('Logout failed:', error);
  });
});

document.getElementById('loginForm').addEventListener('submit', function (e) {
  e.preventDefault();
  const email = document.getElementById('email').value.toLowerCase();
  const password = document.getElementById('password').value;
  auth.signInWithEmailAndPassword(email, password)
    .then(() => {
      document.getElementById('loginMessage').innerText = "Login successful!";
    })
    .catch((error) => {
      document.getElementById('loginMessage').innerText = "Login failed: " + error.message;
    });
});

document.getElementById('registerForm').addEventListener('submit', function (e) {
  e.preventDefault();
  const email = document.getElementById('registerEmail').value.toLowerCase();
  const password = document.getElementById('registerPassword').value;
  auth.createUserWithEmailAndPassword(email, password)
    .then(() => {
      document.getElementById('registerMessage').innerText = "Registration successful! You can now log in.";
    })
    .catch((error) => {
      document.getElementById('registerMessage').innerText = "Registration failed: " + error.message;
    });
});

function checkPremiumLive() {
  if (!auth.currentUser) {
    document.getElementById('firestoreStatusOutput').innerText = "❌ Not logged in.";
    return;
  }
  const checkEmail = auth.currentUser.email.toLowerCase();
  db.collection('users').doc(checkEmail).get()
    .then((doc) => {
      if (doc.exists) {
        const data = doc.data();
        document.getElementById('firestoreStatusOutput').innerText = `Document Found:\n${JSON.stringify(data, null, 2)}\n\nPremium: ${data.premium === true ? '✅ YES' : '❌ NO'}`;
      } else {
        document.getElementById('firestoreStatusOutput').innerText = "❌ No Firestore document found.";
      }
    })
    .catch((error) => {
      document.getElementById('firestoreStatusOutput').innerText = `❌ Error fetching document: ${error.message}`;
    });
}