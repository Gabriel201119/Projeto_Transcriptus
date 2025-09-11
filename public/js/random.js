const outputButton = document.getElementById("output");
const processarBtn = document.getElementById("raffle");
const copyButton = document.getElementById("copyButton");
const wordOfTheDay = document.getElementById("word-of-the-day");
const wordDefinition = document.getElementById("word-definition");
const wordPhonetic = document.getElementById("word-phonetic");
const wordTranslation = document.getElementById("word-translation");

processarBtn.addEventListener("click", async (event) => {
  event.preventDefault();

  try {
  const response = await fetch("/random", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  const data = await response.json();
    
    // Atualiza a palavra principal
    wordOfTheDay.textContent = data.randomWord;
    
    // Atualiza a definição
    if (wordDefinition) {
      wordDefinition.textContent = data.definition;
    }
    
    // Atualiza a fonética
    if (wordPhonetic) {
      wordPhonetic.textContent = data.phonetic;
    }
    
    // Atualiza a tradução
    if (wordTranslation && data.translatedDefinition) {
      wordTranslation.textContent = data.translatedDefinition;
    }

    // Atualiza o botão de cópia
  outputButton.textContent = data.randomWord;
    copyButton.classList.remove("hidden");
    outputButton.style.display = "block";
  } catch (error) {
    console.error("Erro ao sortear palavra:", error);
  }
});
