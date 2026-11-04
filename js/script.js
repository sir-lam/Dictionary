const form = document.getElementById("form");
const wordInput = document.getElementById("wordInput");
const result= document.getElementById("result");
const API_URL = "https://api.dictionaryapi.dev/api/v2/entries/en/";

form.addEventListener("submit", e => {
    e.preventDefault();
    search(wordInput.value.trim());
});

result.addEventListener("click", e => {
    const { word, audio }= e.target.dataset;
    if (word) search(word);
    if (audio) new Audio(audio).play();
});

async function search(word) {
    if (!word) return;
    input.value = word;
    button.disabled = true;
    result.innerHTML = `<div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
    </div>`;

    try {
        const response = await fetch(API_URL + encodeURIComponent(word));)
        if (!response.ok) throw new Error("Word not found");
        const data = await response.json();
        result.innerHTML = renderResult(data);
    } catch (error) {

        result.innerHTML = `<p class="text-danger">${error.message}</p>`;
    } finally {
        button.disabled = false;
    }
}

function renderResult(data) {
    const wordData = data[0];
    const phonetics = wordData.phonetics.map(p => p.text).join(", ");
    const audio = wordData.phonetics.find(p => p.audio)?.audio || "";
    const meanings = wordData.meanings.map(meaning => {
        const definitions = meaning.definitions.map(def => `<li>${def.definition}</li>`).join("");
        return `<h5>${meaning.partOfSpeech}</h5><ul>${definitions}</ul>`;
    }).join("");

    return `
        <h3>${wordData.word} <button class="btn btn-link" data-audio="${audio}">🔊</button></h3>
        <p>Phonetics: ${phonetics}</p>
        ${meanings}
    `;
}