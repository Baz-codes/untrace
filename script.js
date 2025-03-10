document.addEventListener("DOMContentLoaded", async function () {
    const fp = await FingerprintJS.load();
    const result = await fp.get();
    const deviceId = result.visitorId;

    const freePromptsKey = `freePrompts_${deviceId}`;
    const timerKey = `timer_${deviceId}`;
    const maxFreePrompts = 7;

    function getTimeRemaining(endtime) {
        const total = endtime - Date.now();
        const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((total / (1000 * 60)) % 60);
        return { total, hours, minutes };
    }

    function startTimer(duration) {
        const now = Date.now();
        const endTime = now + duration;
        localStorage.setItem(timerKey, endTime);
        updateTimerDisplay();
    }

    function updateTimerDisplay() {
        const storedEndTime = localStorage.getItem(timerKey);
        if (!storedEndTime) return;

        function updateCountdown() {
            const { total, hours, minutes } = getTimeRemaining(storedEndTime);
            if (total <= 0) {
                localStorage.removeItem(timerKey);
                localStorage.setItem(freePromptsKey, maxFreePrompts);
                document.getElementById("prompt-count").textContent = `${maxFreePrompts} / ${maxFreePrompts}`;
                document.getElementById("timer").textContent = "Prompts reset!";
                return;
            }
            document.getElementById("timer").textContent = `Next reset in: ${hours}h ${minutes}m`;
            requestAnimationFrame(updateCountdown);
        }

        updateCountdown();
    }

    function getRemainingPrompts() {
        return parseInt(localStorage.getItem(freePromptsKey)) || maxFreePrompts;
    }

    function usePrompt() {
        let remainingPrompts = getRemainingPrompts();
        if (remainingPrompts > 0) {
            remainingPrompts--;
            localStorage.setItem(freePromptsKey, remainingPrompts);
            document.getElementById("prompt-count").textContent = `${remainingPrompts} / ${maxFreePrompts}`;

            if (remainingPrompts === 0) {
                startTimer(24 * 60 * 60 * 1000);
            }
        }
    }

    document.getElementById("prompt-count").textContent = `${getRemainingPrompts()} / ${maxFreePrompts}`;
    updateTimerDisplay();

    document.getElementById("convert-btn").addEventListener("click", function () {
        let inputText = document.getElementById("input-text").value;

        if (getRemainingPrompts() === 0) {
            alert("You've used all your free prompts. Please wait for the reset or subscribe for unlimited prompts.");
            return;
        }

        const replacements = {
            'a': 'а', 'c': 'с', 'd': 'ԁ', 'p': 'р'
        };

        let convertedText = inputText.replace(/[acdp]/g, letter => replacements[letter] || letter);

        document.getElementById("output-text").textContent = convertedText;
        usePrompt();
    });
});