let promptsUsed = 0;
let maxPrompts = 7;
let resetTime = new Date().setHours(24, 0, 0, 0);  // Resets in 24 hours

// Update prompt counter and reset timer
function updatePromptInfo() {
    let timeRemaining = resetTime - new Date();
    if (timeRemaining <= 0) {
        promptsUsed = 0;  // Reset the count if 24 hours have passed
        resetTime = new Date().setHours(24, 0, 0, 0); // Set next 24-hour cycle
    }
    let minutesRemaining = Math.floor(timeRemaining / 1000 / 60);
    document.getElementById("remainingPrompts").textContent = `You have ${maxPrompts - promptsUsed} free prompts remaining today.`;
    document.getElementById("resetTimer").textContent = `Reset in: ${Math.floor(minutesRemaining / 60)} hours ${minutesRemaining % 60} minutes`;
}

// Convert the input text
document.getElementById("convertBtn").addEventListener("click", function() {
    if (promptsUsed < maxPrompts) {
        let inputText = document.getElementById("inputText").value;
        let outputText = convertText(inputText);
        document.getElementById("outputText").innerHTML = `<p>${outputText}</p>`;
        promptsUsed++;
        updatePromptInfo();
    } else {
        alert("You've used all your free prompts for today. Please subscribe for unlimited access.");
    }
});

// Function to convert the text
function convertText(text) {
    const conversions = {
        "a": "а",
        "c": "с",
        "d": "ԁ", 
        "p": "р"
    };

    let result = text.split('').map(char => conversions[char] || char).join('');
    return result;
}

// Initialize the prompt counter
updatePromptInfo();

