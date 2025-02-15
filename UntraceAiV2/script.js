// Character replacement mapping (Cyrillic replacements for a, d, c, p)
function convertText(text) {
    const charMap = {
        'a': 'а',
        'd': 'ԁ',
        'c': 'с',
        'p': 'р'
    };
    return text.replace(/[adcp]/g, letter => charMap[letter] || letter);
}

// Check localStorage for prompts used and reset time
let usedPrompts = localStorage.getItem("usedPrompts") ? parseInt(localStorage.getItem("usedPrompts")) : 0;
let resetTime = localStorage.getItem("resetTime") ? parseInt(localStorage.getItem("resetTime")) : Date.now() + 86400000;

// Update the prompt counter display
function updatePromptCounter() {
    document.getElementById("used-prompts").innerText = usedPrompts;
}

// Start countdown timer
function startCountdown() {
    let interval = setInterval(() => {
        let remainingTime = resetTime - Date.now();
        if (remainingTime <= 0) {
            usedPrompts = 0;
            localStorage.setItem("usedPrompts", usedPrompts);
            resetTime = Date.now() + 86400000;
            localStorage.setItem("resetTime", resetTime);
        }
        let hours = Math.floor(remainingTime / 3600000);
        let minutes = Math.floor((remainingTime % 3600000) / 60000);
        document.getElementById("countdown").innerText = `${hours}:${minutes < 10 ? '0' : ''}${minutes}`;
    }, 1000);
}

// Convert button event listener
document.getElementById("convert-btn").addEventListener("click", function() {
    if (usedPrompts < 7) {
        let inputText = document.getElementById("input-text").value;
        let outputText = convertText(inputText);
        document.getElementById("output-text").value = outputText;
        usedPrompts++;
        localStorage.setItem("usedPrompts", usedPrompts);
        updatePromptCounter();
    } else {
        alert("You have reached your daily limit. Subscribe for unlimited prompts.");
    }
});

// Check subscription status
async function checkSubscription() {
    try {
        let response = await fetch("/check-subscription");
        let data = await response.json();

        if (data.subscribed) {
            document.getElementById("premium-status").innerText = "Premium User: Unlimited Prompts";
            usedPrompts = 9999; // Effectively unlimited
        } else {
            document.getElementById("premium-status").innerText = "Free User: 7 Prompts Per Day";
            updatePromptCounter();
        }
    } catch (error) {
        console.error("Error checking subscription:", error);
    }
}

// Initialize on page load
window.onload = function() {
    updatePromptCounter();
    startCountdown();
    checkSubscription();
};