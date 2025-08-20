// (your original file content begins)
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
let promptData = {};
let userUid = null;

auth.onAuthStateChanged(function(user) {
  if (user) {
    userUid = user.uid;
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('userStatus').style.display = 'block';
    document.getElementById('logoutButton').style.display = 'inline-block';
    document.getElementById('userStatus').innerText = `Welcome, ${user.email}`;
    checkPremiumOnceAfterLogin();
  } else {
    document.getElementById('loginSection').style.display = 'block';
    document.getElementById('userStatus').style.display = 'none';
    document.getElementById('logoutButton').style.display = 'none';
  }
});

function checkPremiumOnceAfterLogin() {
  db.collection('users').doc(auth.currentUser.uid).get()
    .then((doc) => {
      if (doc.exists && doc.data().premium === true) {
        isPremium = true;
        document.getElementById('userStatus').innerText += " ⭐ Premium";
        document.getElementById('usageInfo').innerText = "Unlimited prompts.";
        document.getElementById('timerDisplay').innerText = "";
        localStorage.removeItem('promptUsage');
      } else {
        isPremium = false;
        initializePromptTracking();
      }
    })
    .catch((error) => {
      console.error('Error checking premium status:', error);
      isPremium = false;
      initializePromptTracking();
    });
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
  let userData = promptData[userUid] || { remaining: 5, resetTime: null };
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
  promptData[userUid] = userData;
  localStorage.setItem('promptUsage', JSON.stringify(promptData));
  updatePromptUI();
  proceedWithConversion();
}

function initializePromptTracking() {
  promptData = JSON.parse(localStorage.getItem('promptUsage')) || {};
  if (!promptData[userUid]) {
    promptData[userUid] = { remaining: 5, resetTime: null };
  }
  updatePromptUI();
}

function updatePromptUI() {
  if (isPremium) {
    document.getElementById('usageInfo').innerText = "Unlimited prompts.";
    document.getElementById('timerDisplay').innerText = "";
    return;
  }
  const userData = promptData[userUid];
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
      promptData[userUid] = { remaining: 5, resetTime: null };
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
      // ✅ fixed: removed the stray quote that broke the file
      document.getElementById('registerMessage').innerText = "Registration failed: " + error.message;
    });
});

// (your original file content ends)


// === ADDED: route your existing "Subscribe Now" link through your Cloud Function ===
// Forces Stripe to use the Firebase email and includes metadata.uid.
// Falls back to the original link if anything fails (so nothing breaks).
(() => {
  const link = document.querySelector('.premium-section a[href*="buy.stripe.com"]');
  if (!link) return;

  // Your LIVE Stripe Price ID (you provided this)
  const STRIPE_PRICE_ID = 'price_1QrFfLJB5iSnPCgrxmoIifO0';

  // Your deployed function URL from the deploy output
  const CREATE_SESSION_URL = 'https://us-central1-untrace-final.cloudfunctions.net/createCheckoutSession';

  link.addEventListener('click', async (e) => {
    try {
      const user = auth.currentUser;

      // If user not logged in, keep default behavior (no change to your existing flow)
      if (!user) return;

      // Intercept click and use backend-created session
      e.preventDefault();

      const idToken = await user.getIdToken();

      const resp = await fetch(CREATE_SESSION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          priceId: STRIPE_PRICE_ID,
          successUrl: window.location.origin + '/?status=success',
          cancelUrl:  window.location.origin + '/?status=cancel'
        })
      });

      if (!resp.ok) {
        // Backend failed — fall back so user isn’t blocked
        console.error('createCheckoutSession failed, falling back to static link:', await resp.text());
        window.location.href = link.href;
        return;
      }

      const data = await resp.json();
      if (!data || !data.url) {
        console.error('No session URL returned, falling back to static link.');
        window.location.href = link.href;
        return;
      }

      // Redirect to Stripe Checkout created by backend (forces email + metadata.uid)
      window.location.href = data.url;
    } catch (err) {
      console.error('Checkout error, falling back to static link:', err);
      window.location.href = link.href;
    }
  });
})();