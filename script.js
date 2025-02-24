// Initialize FingerprintJS to track unique devices
let deviceId;
const loadFingerprint = async () => {
    const fp = await FingerprintJS.load();
    const result = await fp.get();
    deviceId = result.visitorId; // Unique identifier for each device
    initializePromptTracking(); // Call function to check or reset prompts
};
loadFingerprint();

// Function to replace specific letters with their Cyrillic counterparts while maintaining formatting
function convertText(text) {
    const replacements = { 'a': 'а', 'c': 'с', 'd': 'ԁ', 'p': 'р', 'e': 'е' };
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
    
    // If reset time is reached, restore 7 prompts
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
            userData.resetTime = currentTime + 24 * 60 * 60 * 1000; // Set reset time to 24 hours later
            startCountdown(24 * 60 * 60); // Start the timer when last free prompt is used
        }
    } else {
        alert("You've used all 7 free prompts. Upgrade to premium or wait until reset.");
    }

    storedData[deviceId] = userData;
    localStorage.setItem('promptUsage', JSON.stringify(storedData));
    updatePromptUI();
}

// Update UI with remaining prompts and start timer if necessary
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