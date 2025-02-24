const cyrillicMap = {
    'a': 'а', 'c': 'с', 'd': 'ԁ', 'p': 'р', 'e': 'е'
};

function convertText() {
    let inputText = document.getElementById("inputText").value;
    let outputText = inputText.replace(/[acdep]/g, char => cyrillicMap[char] || char);
    document.getElementById("outputText").innerText = outputText;
}

document.getElementById("convertButton").addEventListener("click", function () {
    if (isPremiumUser()) {
        convertText();
    } else if (remainingPrompts > 0) {
        convertText();
        remainingPrompts--;
        localStorage.setItem("remainingPrompts", remainingPrompts);
        if (remainingPrompts === 0) {
            startTimer();
        }
    } else {
        alert("You've used all your free prompts. Subscribe for unlimited access.");
    }
    updatePromptCounter();
});

// Ensuring Free Prompts Cannot Be Reset
let remainingPrompts = parseInt(localStorage.getItem("remainingPrompts")) || 7;
let lastUsedTime = parseInt(localStorage.getItem("lastUsedTime")) || null;

function updatePromptCounter() {
    document.getElementById("remainingPrompts").innerText = remainingPrompts;
}

function startTimer() {
    let resetTime = Date.now() + 24 * 60 * 60 * 1000;  // 24 hours from last use
    localStorage.setItem("resetTime", resetTime);
    updateTimer();
}

function updateTimer() {
    let resetTime = parseInt(localStorage.getItem("resetTime"));
    let now = Date.now();
    let remaining = resetTime - now;

    if (remaining <= 0) {
        remainingPrompts = 7;
        localStorage.setItem("remainingPrompts", remainingPrompts);
        localStorage.removeItem("resetTime");
        updatePromptCounter();
    } else {
        let hours = Math.floor(remaining / (1000 * 60 * 60));
        let minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        document.getElementById("timer").innerText = `${hours}:${minutes < 10 ? '0' : ''}${minutes}`;
        setTimeout(updateTimer, 60000);
    }
}

if (remainingPrompts === 0 && localStorage.getItem("resetTime")) {
    updateTimer();
} else {
    updatePromptCounter();
}

// Check if the user is premium
function isPremiumUser() {
    return localStorage.getItem("premiumUser") === "true";
}

// Redirect after successful payment
function checkPremiumStatus() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('premium')) {
        localStorage.setItem("premiumUser", "true");
        updatePromptCounter();
    }
}

checkPremiumStatus();