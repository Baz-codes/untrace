import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyDhAAn061YCAy8B251n_QeUVQwC1j8RFQk",
    authDomain: "untraceaiv2.firebaseapp.com",
    projectId: "untraceaiv2",
    storageBucket: "untraceaiv2.firebasestorage.app",
    messagingSenderId: "237094049484",
    appId: "1:237094049484:web:cf099e98c588ce2fccd469"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth();

// Auth Functions
function register() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    createUserWithEmailAndPassword(auth, email, password)
        .then(() => document.getElementById("auth-status").innerText = "Registered successfully")
        .catch(error => document.getElementById("auth-status").innerText = error.message);
}

function login() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    signInWithEmailAndPassword(auth, email, password)
        .then(() => document.getElementById("auth-status").innerText = "Logged in successfully")
        .catch(error => document.getElementById("auth-status").innerText = error.message);
}

function logout() {
    signOut(auth)
        .then(() => document.getElementById("auth-status").innerText = "Logged out successfully")
        .catch(error => document.getElementById("auth-status").innerText = error.message);
}

window.register = register;
window.login = login;
window.logout = logout;

// FingerprintJS
let deviceId;
const loadFingerprint = async () => {
    const fp = await FingerprintJS.load();
    const result = await fp.get();
    deviceId = result.visitorId;
    initializePromptTracking();
};
loadFingerprint();

// Prompt Tracking
function initializePromptTracking() {
    let storedData = JSON.parse(localStorage.getItem('promptUsage')) || {};
    if (!storedData[deviceId]) storedData[deviceId] = { remaining: 7, resetTime: null };
    localStorage.setItem('promptUsage', JSON.stringify(storedData));
    updatePromptUI();
}

function checkAndUsePrompt() {
    let storedData = JSON.parse(localStorage.getItem('promptUsage')) || {};
    let userData = storedData[deviceId] || { remaining: 7, resetTime: null };
    const currentTime = Date.now();

    if (userData.resetTime && currentTime >= userData.resetTime) {
        userData.remaining = 7;
        userData.resetTime = null;
    }

    if (userData.remaining > 0) {
        userData.remaining--;
        if (userData.remaining === 0) userData.resetTime = currentTime + 86400000;
    } else {
        alert("No free prompts left. Upgrade to premium or wait.");
    }

    storedData[deviceId] = userData;
    localStorage.setItem('promptUsage', JSON.stringify(storedData));
    updatePromptUI();
}

function updatePromptUI() {
    let storedData = JSON.parse(localStorage.getItem('promptUsage')) || {};
    let userData = storedData[deviceId] || { remaining: 7, resetTime: null };
    document.getElementById('remainingPrompts').innerText = userData.remaining;
}

// Cyrillic Letter Conversion (ONLY 'a', 'c', 'd', 'p')
const cyrillicMap = {
    'a': 'а', 'c': 'с', 'd': 'ԁ', 'p': 'р'
};

function convertToCyrillic(text) {
    return text.split('').map(char => cyrillicMap[char.toLowerCase()] || char).join('');
}

function convertText() {
    checkAndUsePrompt();
    const inputText = document.getElementById("inputText").value;
    document.getElementById("outputText").value = convertToCyrillic(inputText);
}

window.convertText = convertText;