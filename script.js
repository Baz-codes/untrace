// === Firebase setup ===
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

let userUid = null;
let isPremium = false;
let promptData = {};

// === Signup limitation per device ===
const SIGNUP_LIMIT_PER_DAY = 1;
function canRegisterFromThisDevice() {
  const key = "untrace_signup_stats";
  const today = new Date().toISOString().slice(0, 10);
  let data = JSON.parse(localStorage.getItem(key)) || {};
  if (data.date !== today) data = { date: today, count: 0 };
  if (data.count >= SIGNUP_LIMIT_PER_DAY) return false;
  return true;
}
function recordSuccessfulSignup() {
  const key = "untrace_signup_stats";
  const today = new Date().toISOString().slice(0, 10);
  let data = JSON.parse(localStorage.getItem(key)) || {};
  if (data.date !== today) data = { date: today, count: 0 };
  data.count++;
  localStorage.setItem(key, JSON.stringify(data));
}

// === Email plausibility ===
function isPlausibleEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;
  return emailRegex.test(email);
}

// === Auth state change ===
auth.onAuthStateChanged(async (user) => {
  if (user) {
    userUid = user.uid;
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('userStatus').style.display = 'block';
    document.getElementById('logoutButton').style.display = 'inline-block';
    document.getElementById('userStatus').innerText = `Welcome, ${user.email}`;
    await checkPremiumStatus();

    if (!user.emailVerified) {
      document.getElementById('verifyBanner').style.display = 'block';
    } else {
      document.getElementById('verifyBanner').style.display = 'none';
    }
  } else {
    userUid = null;
    isPremium = false;
    document.getElementById('loginSection').style.display = 'block';
    document.getElementById('userStatus').style.display = 'none';
    document.getElementById('logoutButton').style.display = 'none';
  }
});

// === Email verification banner ===
document.getElementById('sendVerification').addEventListener('click', async () => {
  const user = auth.currentUser;
  if (user) {
    await user.sendEmailVerification();
    alert("Verification email sent! Check your inbox or spam folder.");
  }
});

// === Check premium ===
async function checkPremiumStatus() {
  try {
    const doc = await db.collection('users').doc(auth.currentUser.uid).get();
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
  } catch {
    initializePromptTracking();
  }
}

// === Prompt limits ===
function convertText() {
  const user = auth.currentUser;
  if (!user) return alert("Please login first.");
  if (isPremium) return processText();
  if (!user.emailVerified) handleUnverifiedUser();
  else handleVerifiedFreeUser();
}

function processText() {
  const input = document.getElementById('inputText').value;
  const replacements = { 'a': 'а', 'c': 'с', 'e': 'e', 'p': 'р', 'd': 'ԁ' };
  const output = input.replace(/[acdep]/g, (ch) => replacements[ch] || ch);
  document.getElementById('outputText').value = output;
}

function handleUnverifiedUser() {
  const key = "unverified_prompt_usage";
  const lastUse = localStorage.getItem(key);
  const today = new Date().toISOString().slice(0, 10);
  if (lastUse === today) {
    alert("Please verify your email before continuing to use UntraceAI.");
    return;
  }
  localStorage.setItem(key, today);
  processText();
}

function handleVerifiedFreeUser() {
  const text = document.getElementById('inputText').value;
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  if (wordCount > 75) return alert("Free users can only use up to 75 words per prompt.");

  const now = Date.now();
  const data = promptData[userUid] || { remaining: 3, resetTime: now + 86400000 };
  if (now >= data.resetTime) {
    data.remaining = 3;
    data.resetTime = now + 86400000;
  }
  if (data.remaining <= 0) return alert("You've used all free prompts. Verify or upgrade to premium.");
  data.remaining--;
  promptData[userUid] = data;
  localStorage.setItem('promptUsage', JSON.stringify(promptData));
  updatePromptUI();
  processText();
}

function initializePromptTracking() {
  promptData = JSON.parse(localStorage.getItem('promptUsage')) || {};
  if (!promptData[userUid]) promptData[userUid] = { remaining: 3, resetTime: null };
  updatePromptUI();
}

function updatePromptUI() {
  const userData = promptData[userUid];
  document.getElementById('usageInfo').innerText =
    isPremium ? "Unlimited prompts." : `Prompts remaining: ${userData.remaining}/3`;
}

// === Login ===
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value.toLowerCase();
  const password = document.getElementById('password').value;
  try {
    await auth.signInWithEmailAndPassword(email, password);
    document.getElementById('loginMessage').innerText = "Login successful!";
  } catch (err) {
    document.getElementById('loginMessage').innerText = "Login failed: " + err.message;
  }
});

// === Register ===
document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('registerEmail').value.toLowerCase();
  const password = document.getElementById('registerPassword').value;
  const msg = document.getElementById('registerMessage');

  if (auth.currentUser) return msg.innerText = "Please log out before creating another account.";
  if (!canRegisterFromThisDevice()) return msg.innerText = "Too many accounts created from this device today.";
  if (!isPlausibleEmail(email)) return msg.innerText = "Invalid email.";
  if (password.length < 6) return msg.innerText = "Password must be at least 6 characters.";

  msg.innerText = "Creating account...";
  try {
    const cred = await auth.createUserWithEmailAndPassword(email, password);
    await cred.user.sendEmailVerification();
    recordSuccessfulSignup();
    msg.innerText = "Account created! Check your inbox to verify your email.";
  } catch (err) {
    msg.innerText = "Registration failed: " + err.message;
  }
});

// === Logout ===
document.getElementById('logoutButton').addEventListener('click', async () => {
  await auth.signOut();
  alert("Logged out.");
  location.reload();
});

// === Stripe checkout ===
(() => {
  const link = document.querySelector('.premium-section a[href*="buy.stripe.com"]');
  if (!link) return;
  const STRIPE_PRICE_ID = 'price_1QrFfLJB5iSnPCgrxmoIifO0';
  const CREATE_SESSION_URL = 'https://us-central1-untrace-final.cloudfunctions.net/createCheckoutSession';

  link.addEventListener('click', async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return window.location.href = link.href;
    if (!user.emailVerified) return alert("Please verify your email before upgrading.");

    const idToken = await user.getIdToken();
    const resp = await fetch(CREATE_SESSION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
      body: JSON.stringify({
        priceId: STRIPE_PRICE_ID,
        successUrl: window.location.origin + '/?status=success',
        cancelUrl: window.location.origin + '/?status=cancel'
      })
    });
    const data = await resp.json();
    if (data.url) window.location.href = data.url;
    else window.location.href = link.href;
  });
})();