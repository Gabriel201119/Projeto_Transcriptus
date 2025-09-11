class PronunciationChecker {
  constructor() {
    this.recognition = new (window.SpeechRecognition ||
      window.webkitSpeechRecognition)();
    this.setupRecognition();
    this.setupButtons();
    this.targetWord = document
      .getElementById("frase_ingles")
      .textContent.trim()
      .toLowerCase();
  }

  setupRecognition() {
    this.recognition.lang = "en-US";
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.maxAlternatives = 1;

    this.recognition.onresult = (event) => {
      const spokenWord = event.results[0][0].transcript.toLowerCase();
      const confidence = event.results[0][0].confidence;
      this.checkPronunciation(spokenWord, confidence);
    };

    this.recognition.onerror = (event) => {
      console.error("Erro no reconhecimento:", event.error);
      this.updateStatus("Erro no reconhecimento. Tente novamente.");
    };
  }

  setupButtons() {
    this.startButton = document.querySelector(".start-recording-2");
    this.stopButton = document.querySelector(".stop-recording-2");
    this.statusDiv = document.querySelector(".recording-status-2");
    this.resultDiv = document.querySelector(".pronunciation-result-2");
    this.progressBar = document.querySelector(".progress-bar-2");
    this.progressDiv = document.querySelector(".progress-2");

    this.startButton.addEventListener("click", () => this.startRecording());
    this.stopButton.addEventListener("click", () => this.stopRecording());
  }

  startRecording() {
    this.startButton.classList.add("d-none");
    this.stopButton.classList.remove("d-none");
    this.progressDiv.classList.remove("d-none");
    this.updateStatus("🎙 Ouvindo...");
    this.resultDiv.textContent = "";

    try {
      this.recognition.start();
    } catch (error) {
      console.error("Erro ao iniciar a gravação:", error);
    }
  }

  stopRecording() {
    this.startButton.classList.remove("d-none");
    this.stopButton.classList.add("d-none");
    this.updateStatus("");
    this.recognition.stop();
  }

  updateStatus(message) {
    this.statusDiv.textContent = message;
  }

  checkPronunciation(spokenWord, confidence) {
    const similarityScore = this.calculateSimilarity(
      spokenWord,
      this.targetWord
    );
    const lengthPenalty = this.calculateLengthPenalty(
      spokenWord,
      this.targetWord
    );
    const confidenceScore = confidence * 100;

    const totalScore =
      similarityScore * 0.5 + confidenceScore * 0.3 + lengthPenalty * 0.2;

    this.progressBar.style.width = `${totalScore}%`;
    this.progressBar.classList.remove("bg-danger", "bg-warning", "bg-success");

    let resultMessage = "";
    let scoreClass = "";

    if (spokenWord === this.targetWord) {
      scoreClass = "bg-success";
      resultMessage = "🎯 Pronúncia perfeita!";
    } else if (totalScore > 85) {
      scoreClass = "bg-success";
      resultMessage = "🔊 Excelente pronúncia!";
    } else if (totalScore > 70) {
      scoreClass = "bg-warning";
      resultMessage = "👍 Boa tentativa!";
    } else {
      scoreClass = "bg-danger";
      resultMessage = "😕 Tente novamente. Ouça o áudio para referência.";
    }

    this.progressBar.classList.add(scoreClass);

    this.resultDiv.innerHTML = `
          <div class="mt-3">
            <p><strong>Palavra falada:</strong> ${spokenWord}</p>
            <p><strong>Palavra correta:</strong> ${this.targetWord}</p>
            <p><strong>Precisão total:</strong> ${totalScore.toFixed(1)}%</p>
            <ul>
              <li>Similaridade: ${similarityScore.toFixed(1)}%</li>
              <li>Confiança: ${confidenceScore.toFixed(1)}%</li>
              <li>Ajuste de comprimento: ${lengthPenalty.toFixed(1)}%</li>
            </ul>
            <p class="${
              scoreClass === "bg-success"
                ? "text-success"
                : scoreClass === "bg-warning"
                ? "text-warning"
                : "text-danger"
            }">
              <strong>${resultMessage}</strong>
            </p>
          </div>
        `;

    this.stopRecording();
  }

  calculateSimilarity(str1, str2) {
    const len1 = str1.length;
    const len2 = str2.length;
    const dp = Array(len1 + 1)
      .fill(null)
      .map(() => Array(len2 + 1).fill(0));

    for (let i = 0; i <= len1; i++) dp[i][0] = i;
    for (let j = 0; j <= len2; j++) dp[0][j] = j;

    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + cost
        );
      }
    }

    const maxLen = Math.max(len1, len2);
    const distance = dp[len1][len2];
    return (1 - distance / maxLen) * 100;
  }

  calculateLengthPenalty(spoken, target) {
    const lengthRatio =
      Math.min(spoken.length, target.length) /
      Math.max(spoken.length, target.length);
    return lengthRatio * 100;
  }
}

window.addEventListener("DOMContentLoaded", () => {
  new PronunciationChecker();
});
