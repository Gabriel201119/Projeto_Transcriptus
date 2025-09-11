class PhraseRecognition {
  constructor() {
    this.recognition = new (window.SpeechRecognition ||
      window.webkitSpeechRecognition)();
    this.setupRecognition();
    this.setupButtons();
    this.currentIndex = null;
    this.isRecording = false;
    this.currentButton = null;

    // Modal elements
    this.modalElement = document.getElementById("pronunciationModal");
    this.modal = new bootstrap.Modal(this.modalElement);
    this.modalPhrase = document.getElementById("modalPhrase");
    this.modalStartBtn = document.getElementById("modalStartRecording");
    this.modalStopBtn = document.getElementById("modalStopRecording");
    this.modalStatus = document.getElementById("modalRecordingStatus");
    this.modalResult = document.getElementById("modalResult");
    this.targetPhrase = "";

    this.setupModal();
  }

  setupModal() {
    document.querySelectorAll(".open-pronunciation-modal").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        // Se já estiver gravando, para a gravação atual
        if (this.isRecording) {
          this.recognition.stop();
        }

        this.targetPhrase = btn.dataset.phrase;
        this.modalPhrase.textContent = this.targetPhrase;
        this.modalResult.innerHTML = "";
        this.modalStatus.textContent = "";
        this.modalStartBtn.classList.remove("d-none");
        this.modalStopBtn.classList.add("d-none");
        this.currentButton = btn;
        this.modal.show();
      });
    });

    this.modalStartBtn.addEventListener("click", () => {
      if (!this.isRecording) {
        console.log("Iniciando gravação...");
        this.recognition.start();
      } else {
        console.warn("Já está gravando!");
      }
    });

    this.modalStopBtn.addEventListener("click", () => {
      this.stopRecording();
    });

    // Garante que ao fechar o modal manualmente, tudo seja resetado
    this.modalElement.addEventListener("hidden.bs.modal", () => {
      console.log("Fechando o modal...");
      this.stopRecording();
    });
  }

  stopRecording() {
    if (this.isRecording) {
      this.recognition.stop();
    }
    this.isRecording = false;
    this.modalStartBtn.classList.remove("d-none");
    this.modalStopBtn.classList.remove("btn-warning");
    this.modalStopBtn.classList.add("btn-danger");
    this.modalStopBtn.classList.add("d-none");
    this.modalStopBtn.innerHTML = `<i class="bi bi-stop-fill"></i> Parar`;
    this.modalStatus.textContent = "";
  }

  setupRecognition() {
    this.recognition.lang = "en-US";
    this.recognition.continuous = false;
    this.recognition.interimResults = false;

    this.recognition.onstart = () => {
      this.isRecording = true;
      // Atualiza visual do modal
      this.modalStartBtn.classList.add("d-none");
      this.modalStopBtn.classList.remove("d-none");
      this.modalStopBtn.classList.remove("btn-danger");
      this.modalStopBtn.classList.add("btn-warning");
      this.modalStopBtn.innerHTML = `<i class="bi bi-record-fill text-danger"></i> Gravando... Clique para parar`;
      this.modalStatus.textContent = "Ouvindo...";
    };

    this.recognition.onend = () => {
      this.isRecording = false;
      // Restaura visual do modal
      this.modalStartBtn.classList.remove("d-none");
      this.modalStopBtn.classList.remove("btn-warning");
      this.modalStopBtn.classList.add("btn-danger");
      this.modalStopBtn.classList.add("d-none");
      this.modalStopBtn.innerHTML = `<i class="bi bi-stop-fill"></i> Parar`;
      this.modalStatus.textContent = "";
    };

    this.recognition.onresult = (event) => {
      const spokenPhrase = event.results[0][0].transcript.toLowerCase();
      const confidence = event.results[0][0].confidence;
      this.checkPronunciation(spokenPhrase, confidence);
    };

    this.recognition.onerror = (event) => {
      console.error("Erro no reconhecimento:", event.error);
      this.stopRecording();
      this.modalStatus.textContent = "Erro no reconhecimento. Tente novamente.";
    };
  }

  setupButtons() {
    document.querySelectorAll(".practice-mic-button").forEach((button) => {
      button.addEventListener("click", () => {
        if (this.isRecording) {
          this.stopRecording();
        } else {
          if (this.currentIndex !== null) {
            this.clearResults(this.currentIndex);
          }
          this.currentIndex = button.dataset.index;
          this.targetPhrase = button.dataset.phrase;
          this.clearResults(this.currentIndex);
          this.recognition.start();
        }
      });
    });
  }

  clearResults(index) {
    const button = document.querySelector(
      `.practice-mic-button[data-index="${index}"]`
    );
    if (!button) {
      console.error(`Botão com data-index="${index}" não encontrado.`);
      return;
    }

    const feedback = button
      .closest(".phrase-box")
      ?.querySelector(".practice-feedback");
    const result = document.getElementById(`result-${index}`);
    const progress = document.getElementById(`progress-${index}`);

    if (feedback) feedback.classList.remove("active");
    if (result) {
      result.textContent = "";
      result.className = "practice-result";
    }
    if (progress) {
      progress.classList.add("d-none");
      progress.querySelector(".progress-bar").style.width = "0%";
    }
  }

  checkPronunciation(spokenPhrase, confidence) {
    const similarityScore = this.calculateSimilarity(
      spokenPhrase,
      this.targetPhrase
    );
    const confidenceScore = confidence * 100;
    const totalScore = similarityScore * 0.7 + confidenceScore * 0.3;

    let message = "";
    let resultClass = "";

    if (totalScore > 85) {
      message = "🎉 Excelente pronúncia!";
      resultClass = "text-success";
    } else if (totalScore > 70) {
      message = "👍 Boa tentativa! Continue praticando.";
      resultClass = "text-warning";
    } else {
      message = "😕 Tente novamente. Ouça a frase para referência.";
      resultClass = "text-danger";
    }

    this.modalResult.innerHTML = `
        <div>
          <p><strong>Sua frase:</strong> ${spokenPhrase}</p>
          <p><strong>Precisão:</strong> ${totalScore.toFixed(1)}%</p>
          <p class="${resultClass}"><strong>${message}</strong></p>
        </div>
      `;
  }

  calculateSimilarity(str1, str2) {
    str1 = str1.toLowerCase();
    str2 = str2.toLowerCase();

    if (str1 === str2) return 100;

    const len1 = str1.length;
    const len2 = str2.length;
    const matrix = Array(len2 + 1)
      .fill(null)
      .map(() => Array(len1 + 1).fill(null));

    for (let i = 0; i <= len1; i++) matrix[0][i] = i;
    for (let j = 0; j <= len2; j++) matrix[j][0] = j;

    for (let j = 1; j <= len2; j++) {
      for (let i = 1; i <= len1; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }

    const distance = matrix[len2][len1];
    const maxLength = Math.max(len1, len2);
    return Math.max(0, ((maxLength - distance) / maxLength) * 100);
  }
}

// Inicializar quando o documento estiver pronto
document.addEventListener("DOMContentLoaded", () => {
  new PhraseRecognition();
});
