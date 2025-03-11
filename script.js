// Firebase Import & Initialization
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyDhAAn061YCAy8B251n_QeUVQwC1j8RFQk",
    authDomain: "untraceaiv2.firebaseapp.com",
    projectId: "untraceaiv2",
    storageBucket: "untraceaiv2.firebasestorage.app",
    messagingSenderId: "237094049484",
    appId: "1:237094049484:web:cf099e98c588ce2fccd469"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Authentication Handlers
document.getElementById("registerBtn").addEventListener("click", () => {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    createUserWithEmailAndPassword(auth, email, password)
        .then(() => alert("Account created successfully!"))
        .catch(error => alert(error.message));
});

document.getElementById("loginBtn").addEventListener("click", () => {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    signInWithEmailAndPassword(auth, email, password)
        .then(() => alert("Logged in successfully!"))
        .catch(error => alert(error.message));
});

document.getElementById("logoutBtn").addEventListener("click", () => {
    signOut(auth).then(() => alert("Logged out successfully!"))
        .catch(error => alert(error.message));
});

// FingerprintJS Initialization
let deviceId;
const loadFingerprint = async () => {
    const fp = await FingerprintJS.load();
    const result = await fp.get();
    deviceId = result.visitorId; 
    initializePromptTracking();
};
loadFingerprint();

// Convert Text Function
function convertText(text) {
    const replacements = { 'a': 'а', 'c': 'с', 'd': 'ԁ', 'p': 'р', 'e': 'е' };
    return text.replace(/[acdep]/g, letter => replacements[letter] || letter);
}

// Prompt Usage System
function initializePromptTracking() {
    let storedData = JSON.parse(localStorage.getItem('promptUsage')) || {};
    if (!storedData[deviceId]) {
        storedData[deviceId] = { remaining: 7, resetTime: null };
    }
    localStorage.setItem('promptUsage', JSON.stringify(storedData));
    updatePromptUI();
}

document.getElementById("convertBtn").addEventListener("click", () => {
    let storedData = JSON.parse(localStorage.getItem('promptUsage')) || {};
    let userData = storedData[deviceId] || { remaining: 7, resetTime: null };
    const currentTime = new Date().getTime();
    
    if (userData.resetTime && currentTime >= userData.resetTime) {
        userData.remaining = 7;
        userData.resetTime = null;
    }

    if (userData.remaining > 0) {
        let inputText = document.getElementById('inputText').value;
        let outputText = convertText(inputText);
        document.getElementById('outputText').value = outputText;
        
        userData.remaining -= 1;
        if (userData.remaining === 0) {
            userData.resetTime = currentTime + 24 * 60 * 60 * 1000; 
            startCountdown(24 * 60 * 60);
        }
    } else {
        alert("You've used all 7 free prompts. Upgrade to premium or wait until reset.");
    }

    storedData[deviceId] = userData;
    localStorage.setItem('promptUsage', JSON.stringify(storedData));
    updatePromptUI();
});

// Countdown Timer
function startCountdown(duration) {
    let timerElement = document.getElementById('timer');
    let timeLeft = duration;
    let countdown = setInterval(() => {
        let hours = Math.floor(timeLeft / 3600);
        let minutes = Math.floor((timeLeft % 3600) / 60);
        timerElement.innerText = `${hours}:${minutes.toString().padStart(2, '0')}`;
        timeLeft--;

        if (timeLeft < 0) {
            clearInterval(countdown);
            initializePromptTracking();
        }
    }, 1000);
}

updatePromptUI();