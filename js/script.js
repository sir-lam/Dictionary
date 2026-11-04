// Get references to DOM elements
const form = document.getElementById("form");
const wordInput = document.getElementById("wordInput");
const result= document.getElementById("result");
const button = document.getElementById("searchButton");
const API_URL = "https://api.dictionaryapi.dev/api/v2/entries/en/";

// Set the current year in the footer
document.getElementById("year").textContent = new Date().getFullYear();

// Event listeners
form.addEventListener("submit", e => {
    e.preventDefault();
    search(wordInput.value.trim());
});

// Handle clicks on dynamically generated buttons for synonyms, antonyms, and pronunciation
result.addEventListener("click", e => {
    const btn = e.target.closest("button");
    if (!btn) return;
    if (btn.dataset.word) search(btn.dataset.word);
    if (btn.dataset.audio) pronounce(btn.dataset.speak, btn.dataset.audio);
});

//Play pronunciation using audio file if available, otherwise use speech synthesis
async function pronounce(word, audioUrl) {
    if (!("speechSynthesis" in window)) {
        console.warn("This browser does not support speech synthesis.");
        return;
    }
    const speech = new SpeechSynthesisUtterance(word);
    speech.lang = "en-US";
    speech.rate = 0.9;
    speech.error = e => console.warn("Speech synthesis error:", e.error);
    if (speechSynthesis.speaking || speechSynthesis.pending) speechSynthesis.cancel();
    speechSynthesis.resume();
    speechSynthesis.speak(speech);
}

// Search for the word using the dictionary API and display the results
async function search(word) {
    if (!word) return;
    wordInput.value = word;

    const inputError = validate(word);
    if (inputError) {
        result.innerHTML = `<p class="text-danger mb-0">${inputError}</p>`;
        wordInput.focus();
        return;
    }

// Disable the search button and show a loading spinner while fetching data
    button.disabled = true;
    button.textContent = "Searching...";
    result.innerHTML = `
        <div class="loading">
            <div class="spinner-border spinner-border-sm text-primary" role="status"></div>
            <span>Searching for "${escapeHtml(word)}"...</span>
        </div>`;

// Fetch the word definition from the dictionary API and handle errors
    try {
        const response = await fetch(API_URL + encodeURIComponent(word));
        if (response.status === 404) throw new Error("No definitions found for the word");
        if (!response.ok) throw new Error("The dictionary API is currently unavailable. Please try again later.");
        const data = await response.json();
        result.innerHTML = renderResult(data);
    } catch (error) {
        const message = error instanceof TypeError
            ? "Network error. Please check your connection."
            : error.message;
        result.innerHTML = `<p class="text-danger mb-0">${escapeHtml(message)}</p>`;
    } finally {
        button.disabled = false;
        button.textContent = "Search";
    }
}
// Validate the input word to ensure it is not empty and contains only letters
function validate(word) {
    if (!word) return "Please enter a word to search.";
    if (!/^[a-zA-Z]+$/.test(word)) return "Please enter a valid word containing only letters.";
    return null;
}

// Render the result of the dictionary API response into HTML
function renderResult(data) {
    const wordData = data[0];
    const phonetics = [...new Set(wordData.phonetics.map(p => p.text).filter(Boolean))].join(", ");
    const audio = wordData.phonetics.find(p => p.audio)?.audio.replace(/^\/\//, "https://");
    const meanings = wordData.meanings.map(meaning => {
        const definitions = meaning.definitions.slice(0, 5).map(def => `
            <li>${escapeHtml(def.definition)}
              ${def.example ? `<div class="example">Example: ${escapeHtml(def.example)}</div>` : ""}
            </li>`).join("");
        return `<h5 class="mt-3">${escapeHtml(meaning.partOfSpeech)}</h5>
            <ul>${definitions}</ul>
                ${wordButton("synonyms", meaning.synonyms)}
                ${wordButton("antonyms", meaning.antonyms)}`;
    }).join("");

      return `
        <h3>${escapeHtml(wordData.word)}
          <button class="btn btn-link" data-speak="${escapeHtml(wordData.word)}" data-audio="${escapeHtml(audio || "")}" aria-label="Play pronunciation">🔊</button>
        </h3>
        ${phonetics ? `<p>Phonetics: ${escapeHtml(phonetics)}</p>` : ""}
        ${meanings}`;
}

// Generate buttons for synonyms and antonyms, limiting to 5 words each
function wordButton(label, words) {
    if (!words || words.length === 0) return "";
    const buttons = words.slice(0, 5)
        .map(word => `<button class="btn btn-link p-0 synonyms" data-word="${escapeHtml(word)}">${escapeHtml(word)}</button>`)
        .join(", ");
    return `<p>${label}: ${buttons}</p>`;
}

// Escape HTML special characters to prevent XSS attacks
function escapeHtml(text) {
    const escapeChars = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
    return String(text).replace(/[&<>"']/g, match => escapeChars[match]);
}