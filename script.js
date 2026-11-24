const form = document.getElementById("guess-form");
const input = document.getElementById("number");
const submitBtn = document.querySelector(".btn-submit");
const resetBtn = document.getElementById("reset-btn");
const resultEl = document.getElementById("result");
const rangeTextEl = document.getElementById("range-text");
const attemptsEl = document.getElementById("attempts");
const boundsEl = document.getElementById("bounds");
const bestScoreEl = document.getElementById("best-score");
const historySection = document.getElementById("history-section");
const historyList = document.getElementById("guess-history");
const diffButtons = document.querySelectorAll(".diff-btn");

let maxNumber = 100;
let secretNumber = 0;
let attempts = 0;
let minBound = 1;
let maxBound = maxNumber;
let guessedNumbers = new Set();

function getBestKey(max) {
    return `number-guess-best-${max}`;
}

function getBestScore(max) {
    try {
        const saved = localStorage.getItem(getBestKey(max));
        return saved ? Number(saved) : null;
    } catch {
        return null;
    }
}

function saveBestScore(max, score) {
    try {
        localStorage.setItem(getBestKey(max), String(score));
    } catch {
        // Ignore storage errors in restricted environments.
    }
}

function setResult(message, type = "info") {
    resultEl.textContent = message;
    resultEl.className = message ? `result ${type}` : "result";
}

function updateStats() {
    attemptsEl.textContent = attempts;
    boundsEl.textContent = `${minBound} – ${maxBound}`;
    const best = getBestScore(maxNumber);
    bestScoreEl.textContent = best !== null ? best : "—";
}

function addGuessChip(guess, direction) {
    const item = document.createElement("li");
    item.className = `guess-chip ${direction}`;
    const arrow = direction === "low" ? "↑" : direction === "high" ? "↓" : "✓";
    item.textContent = `${guess} ${arrow}`;
    historyList.appendChild(item);
    historySection.hidden = false;
}

function startNewGame(newMax = maxNumber) {
    maxNumber = newMax;
    secretNumber = Math.floor(Math.random() * maxNumber) + 1;
    attempts = 0;
    minBound = 1;
    maxBound = maxNumber;
    guessedNumbers.clear();

    rangeTextEl.textContent = `Guess the secret number between 1 and ${maxNumber}`;
    input.placeholder = `Enter 1–${maxNumber}...`;
    input.value = "";
    input.disabled = false;
    submitBtn.disabled = false;
    resetBtn.classList.remove("highlight");
    historyList.innerHTML = "";
    historySection.hidden = true;
    setResult("");
    updateStats();
    input.focus();
}

function getProximityHint(guess) {
    const diff = Math.abs(guess - secretNumber);
    const warmThreshold = Math.max(3, Math.round(maxNumber * 0.05));
    if (diff <= warmThreshold) {
        return { text: " Very close!", isWarm: true };
    }
    return { text: "", isWarm: false };
}

form.addEventListener("submit", function (event) {
    event.preventDefault();

    const raw = input.value.trim();
    if (raw === "") {
        setResult("Please enter a number!", "error");
        input.focus();
        return;
    }

    const guess = Number(raw);
    if (!Number.isInteger(guess) || guess < 1 || guess > maxNumber) {
        setResult(`Enter a valid whole number between 1 and ${maxNumber}!`, "error");
        input.select();
        return;
    }

    if (guessedNumbers.has(guess)) {
        setResult(`You already guessed ${guess}. Try a different number!`, "error");
        input.select();
        return;
    }

    guessedNumbers.add(guess);
    attempts++;
    input.value = "";

    if (guess === secretNumber) {
        const previousBest = getBestScore(maxNumber);
        const isNewBest = previousBest === null || attempts < previousBest;
        if (isNewBest) {
            saveBestScore(maxNumber, attempts);
        }

        minBound = secretNumber;
        maxBound = secretNumber;
        updateStats();
        addGuessChip(guess, "win");

        const attemptWord = attempts === 1 ? "attempt" : "attempts";
        const bestNotice = isNewBest ? " New best score!" : "";
        setResult(`🎉 Correct! You guessed ${secretNumber} in ${attempts} ${attemptWord}.${bestNotice}`, "win");

        input.disabled = true;
        submitBtn.disabled = true;
        resetBtn.classList.add("highlight");
        return;
    }

    const { text: proximityText, isWarm } = getProximityHint(guess);

    if (guess < secretNumber) {
        minBound = Math.max(minBound, guess + 1);
        addGuessChip(guess, "low");
        setResult(`Too low! Try a higher number.${proximityText}`, isWarm ? "warm" : "info");
    } else {
        maxBound = Math.min(maxBound, guess - 1);
        addGuessChip(guess, "high");
        setResult(`Too high! Try a lower number.${proximityText}`, isWarm ? "warm" : "info");
    }

    updateStats();
    input.focus();
});

diffButtons.forEach((button) => {
    button.addEventListener("click", function () {
        const selectedMax = Number(button.dataset.max);
        if (selectedMax === maxNumber && attempts === 0) return;

        diffButtons.forEach((btn) => btn.classList.remove("active"));
        button.classList.add("active");
        startNewGame(selectedMax);
    });
});

resetBtn.addEventListener("click", function () {
    startNewGame(maxNumber);
});

startNewGame(100);
