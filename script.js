// Initialize FingerprintJS to track unique devices
let deviceId;
const loadFingerprint = async () => {
    const fp = await FingerprintJS.load();
    const result = await fp.get();
    deviceId = result.visitorId; // Unique identifier for each device
    initializePromptTracking(); // Call function to check or reset prompts
};
loadFingerprint();

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyDhAAn061YCAy8B251n_QeUVQwC1j8RFQk",
    authDomain: "untraceaiv2.firebaseapp.com",
    projectId: "untraceaiv2",
    storageBucket: "untraceaiv2.firebasestorage.app",
    messagingSenderId: "237094049484",
    appId: "1:237094049484:web:cf099e98c588ce2fccd469"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// Register User
function registerUser() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            alert("Registration successful! You can now log in.");
        })
        .catch((error) => {
            alert(error.message);
        });
}

// Login User
function loginUser() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            alert("Login successful!");
            updateUserStatus(userCredential.user);
        })
        .catch((error) => {
            alert(error.message);
        });
}

// Logout User
function logoutUser() {
    auth.signOut()
        .then(() => {
            alert("Logged out successfully!");
            updateUserStatus(null);
        })
        .catch((error) => {
            alert(error.message);
        });
}

// Update user login status
function updateUserStatus(user) {
    document.getElementById("userStatus").innerText = user ? `Logged in as: ${user.email}` : "Not logged in";
}

// Check login status on page load
auth.onAuthStateChanged((user) => {
    updateUserStatus(user);
});

// Function to replace specific letters with their Cyrillic counterparts while maintaining formatting
function convertText(text) {
    const replacements = { 'a': 'а', 'c': 'с', 'd': 'ԁ', 'p': 'р', 'e': 'e' };
    return text.replace(/[acdep]/g, letter => replacements[letter] || letter);
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
}