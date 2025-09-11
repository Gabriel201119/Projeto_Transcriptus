class PronunciationChecker {
  constructor() {
    this.recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    this.setupRecognition();
    this.setupButtons();
    this.targetWord = document.getElementById('word-text').textContent.trim().toLowerCase();
    this.attempts = [];
    this.maxAttempts = 5;
    this.setupUI();
    
    // Verificar suporte à confiança
    this.checkConfidenceSupport();
  }
  
  checkConfidenceSupport() {
    console.log('Verificando suporte à confiança do navegador...');
    console.log('Navegador:', navigator.userAgent);
    console.log('SpeechRecognition disponível:', 'SpeechRecognition' in window);
    console.log('webkitSpeechRecognition disponível:', 'webkitSpeechRecognition' in window);
  }

  setupUI() {
    // Adicionar elementos de UI melhorados
    this.createAdvancedUI();
  }

  createAdvancedUI() {
    const resultDiv = document.getElementById('pronunciationResult');
    if (resultDiv) {
      resultDiv.innerHTML = `
        <div class="pronunciation-feedback">
          <div class="feedback-header">
            <h5 class="mb-3">🎯 Análise de Pronúncia</h5>
          </div>
          
          <div class="attempts-history mb-3" id="attemptsHistory">
            <h6>📊 Histórico de Tentativas</h6>
            <div class="attempts-list" id="attemptsList"></div>
          </div>

          <div class="current-attempt" id="currentAttempt">
            <div class="row">
              <div class="col-md-6">
                <div class="score-breakdown">
                  <h6>📈 Análise Detalhada</h6>
                  <div class="score-item">
                    <span>Similaridade:</span>
                    <div class="progress mb-1" style="height: 8px;">
                      <div class="progress-bar" id="similarityBar" role="progressbar"></div>
                    </div>
                    <small id="similarityScore">0%</small>
                  </div>
                  <div class="score-item">
                    <span>Confiança:</span>
                    <div class="progress mb-1" style="height: 8px;">
                      <div class="progress-bar" id="confidenceBar" role="progressbar"></div>
                    </div>
                    <small id="confidenceScore">0%</small>
                  </div>
                  <div class="score-item">
                    <span>Comprimento:</span>
                    <div class="progress mb-1" style="height: 8px;">
                      <div class="progress-bar" id="lengthBar" role="progressbar"></div>
                    </div>
                    <small id="lengthScore">0%</small>
                  </div>
                </div>
              </div>
              <div class="col-md-6">
                <div class="pronunciation-tips" id="pronunciationTips">
                  <h6>💡 Dicas de Pronúncia</h6>
                  <div id="tipsContent">Clique em "Ouvir" para começar</div>
                </div>
              </div>
            </div>
          </div>

          <div class="final-result mt-3" id="finalResult"></div>
        </div>
      `;
    }
  }

  setupRecognition() {
    this.recognition.lang = 'en-US';
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.maxAlternatives = 3;
    
    console.log('Configuração do reconhecimento:', {
      lang: this.recognition.lang,
      continuous: this.recognition.continuous,
      interimResults: this.recognition.interimResults,
      maxAlternatives: this.recognition.maxAlternatives
    });

    this.recognition.onresult = (event) => {
      const results = event.results;
      const finalResult = results[results.length - 1];
      
      if (finalResult.isFinal) {
        // Limpar a transcrição removendo pontuação e espaços extras
        const rawTranscript = finalResult[0].transcript.toLowerCase();
        const spokenWord = rawTranscript.replace(/[.,!?;:]/g, '').trim();
        
        // Debug detalhado da estrutura do resultado
        console.log('Estrutura do resultado:', finalResult[0]);
        console.log('Propriedades disponíveis:', Object.keys(finalResult[0]));
        
        // Tentar diferentes formas de obter a confiança
        let confidence = finalResult[0].confidence;
        
        // Se a confiança não estiver disponível, calcular baseado na similaridade
        if (confidence === undefined || confidence === null || confidence === 0) {
          console.log('Confiança não disponível no navegador, calculando baseado na similaridade');
          
          // Calcular uma confiança estimada baseada na similaridade da transcrição
          const rawSimilarity = this.calculateSimilarity(spokenWord, this.targetWord);
          confidence = Math.max(0.3, rawSimilarity / 100); // Mínimo de 30% de confiança
          
          console.log('Confiança estimada baseada na similaridade:', confidence);
        }
        
        const alternatives = Array.from(finalResult).map(alt => ({
          transcript: alt.transcript.toLowerCase().replace(/[.,!?;:]/g, '').trim(),
          confidence: alt.confidence || 0.5
        }));
        
        console.log('Transcrição original:', rawTranscript);
        console.log('Palavra processada:', spokenWord);
        console.log('Palavra alvo:', this.targetWord);
        console.log('Confiança obtida:', confidence);
        console.log('Tipo da confiança:', typeof confidence);
        
        this.checkPronunciation(spokenWord, confidence, alternatives);
      } else {
        // Mostrar resultado intermediário
        const interimTranscript = finalResult[0].transcript.toLowerCase();
        this.updateInterimResult(interimTranscript);
      }
    };

    this.recognition.onerror = (event) => {
      console.error('Erro no reconhecimento:', event.error);
      this.updateStatus('Erro no reconhecimento. Tente novamente.', 'error');
    };

    this.recognition.onstart = () => {
      this.updateStatus('🎤 Ouvindo...', 'listening');
    };

    this.recognition.onend = () => {
      this.updateStatus('', '');
    };
  }

  setupButtons() {
    this.startButton = document.getElementById('startRecording');
    this.stopButton = document.getElementById('stopRecording');
    this.statusDiv = document.getElementById('recordingStatus');
    this.resultDiv = document.getElementById('pronunciationResult');
    
    // Selecionar especificamente a barra de progresso da seção de pronúncia
    this.progressBar = document.querySelector('#resultArea .progress-bar');
    this.progressDiv = document.querySelector('#resultArea .progress');

    this.startButton.addEventListener('click', () => this.startRecording());
    this.stopButton.addEventListener('click', () => this.stopRecording());
  }

  startRecording() {
    if (this.attempts.length >= this.maxAttempts) {
      this.showMaxAttemptsReached();
      return;
    }

    this.startButton.classList.add('d-none');
    this.stopButton.classList.remove('d-none');
    this.progressDiv.classList.remove('d-none');
    this.updateStatus('🎤 Ouvindo...', 'listening');
    this.clearCurrentAttempt();

    try {
      this.recognition.start();
    } catch (error) {
      console.error('Erro ao iniciar gravação:', error);
      this.updateStatus('Erro ao iniciar gravação', 'error');
    }
  }

  stopRecording() {
    this.startButton.classList.remove('d-none');
    this.stopButton.classList.add('d-none');
    this.updateStatus('', '');
    this.recognition.stop();
  }

  updateStatus(message, type = '') {
    if (this.statusDiv) {
      this.statusDiv.textContent = message;
      this.statusDiv.className = `recording-status ${type}`;
    }
  }

  updateInterimResult(transcript) {
    const currentAttempt = document.getElementById('currentAttempt');
    if (currentAttempt) {
      const interimDiv = currentAttempt.querySelector('.interim-result') || 
        document.createElement('div');
      interimDiv.className = 'interim-result text-muted mb-2';
      interimDiv.innerHTML = `<small>🎤 Ouvindo: "${transcript}"</small>`;
      currentAttempt.appendChild(interimDiv);
    }
  }

  clearCurrentAttempt() {
    const currentAttempt = document.getElementById('currentAttempt');
    if (currentAttempt) {
      currentAttempt.querySelectorAll('.interim-result').forEach(el => el.remove());
    }
  }

  checkPronunciation(spokenWord, confidence, alternatives = []) {
    console.log('=== VERIFICAÇÃO DE PRONÚNCIA ===');
    console.log('Palavra falada:', spokenWord);
    console.log('Palavra alvo:', this.targetWord);
    console.log('Confiança:', confidence);
    console.log('Alternativas:', alternatives);
    
    const attempt = {
      spokenWord,
      confidence,
      alternatives,
      timestamp: new Date(),
      scores: this.calculateDetailedScores(spokenWord, confidence)
    };

    console.log('Scores calculados:', attempt.scores);
    
    this.attempts.push(attempt);
    this.updateAttemptsHistory();
    this.updateDetailedScores(attempt.scores);
    this.updatePronunciationTips(spokenWord);
    this.showFinalResult(attempt);
    this.stopRecording();
  }

  calculateDetailedScores(spokenWord, confidence) {
    const similarityScore = this.calculateSimilarity(spokenWord, this.targetWord);
    const lengthPenalty = this.calculateLengthPenalty(spokenWord, this.targetWord);
    
    // Garantir que a confiança seja um número válido
    let confidenceScore = 0;
    if (typeof confidence === 'number' && !isNaN(confidence)) {
      confidenceScore = confidence * 100;
    } else {
      console.warn('Confiança inválida recebida:', confidence, 'usando valor padrão');
      confidenceScore = 50; // Valor padrão se a confiança for inválida
    }
    
    const phoneticScore = this.calculatePhoneticSimilarity(spokenWord, this.targetWord);

    const totalScore = (
      similarityScore * 0.4 +
      confidenceScore * 0.25 +
      lengthPenalty * 0.15 +
      phoneticScore * 0.2
    );

    console.log('Cálculo de scores:', {
      similarity: similarityScore,
      confidence: confidenceScore,
      length: lengthPenalty,
      phonetic: phoneticScore,
      total: totalScore
    });

    return {
      similarity: similarityScore,
      confidence: confidenceScore,
      length: lengthPenalty,
      phonetic: phoneticScore,
      total: totalScore
    };
  }

  calculatePhoneticSimilarity(str1, str2) {
    // Mapeamento de sons similares em inglês
    const phoneticMap = {
      'th': ['f', 'v'],
      'ph': ['f'],
      'gh': ['f', ''],
      'ck': ['k'],
      'qu': ['kw'],
      'x': ['ks'],
      'c': ['k', 's'],
      'g': ['j'],
      's': ['z'],
      't': ['d'],
      'p': ['b'],
      'k': ['g']
    };

    let score = 0;
    const maxLen = Math.max(str1.length, str2.length);
    
    for (let i = 0; i < maxLen; i++) {
      const char1 = str1[i] || '';
      const char2 = str2[i] || '';
      
      if (char1 === char2) {
        score += 1;
      } else {
        // Verificar mapeamentos fonéticos
        let found = false;
        for (const [key, values] of Object.entries(phoneticMap)) {
          if ((char1 === key && values.includes(char2)) || 
              (char2 === key && values.includes(char1))) {
            score += 0.7;
            found = true;
            break;
          }
        }
        if (!found) {
          score += 0.3; // Penalidade menor para caracteres diferentes
        }
      }
    }
    
    return (score / maxLen) * 100;
  }

  updateDetailedScores(scores) {
    this.updateScoreBar('similarityBar', 'similarityScore', scores.similarity);
    this.updateScoreBar('confidenceBar', 'confidenceScore', scores.confidence);
    this.updateScoreBar('lengthBar', 'lengthScore', scores.length);
    
    // Atualizar barra principal
    if (this.progressBar) {
      this.progressBar.style.width = `${scores.total}%`;
      this.progressBar.classList.remove('bg-danger', 'bg-warning', 'bg-success');
      
      if (scores.total > 85) {
        this.progressBar.classList.add('bg-success');
      } else if (scores.total > 70) {
        this.progressBar.classList.add('bg-warning');
      } else {
        this.progressBar.classList.add('bg-danger');
      }
    }
  }

  updateScoreBar(barId, scoreId, score) {
    const bar = document.getElementById(barId);
    const scoreElement = document.getElementById(scoreId);
    
    if (bar && scoreElement) {
      bar.style.width = `${score}%`;
      bar.className = `progress-bar ${this.getScoreClass(score)}`;
      scoreElement.textContent = `${score.toFixed(1)}%`;
    }
  }

  getScoreClass(score) {
    if (score > 85) return 'bg-success';
    if (score > 70) return 'bg-warning';
    return 'bg-danger';
  }

  updateAttemptsHistory() {
    const attemptsList = document.getElementById('attemptsList');
    if (!attemptsList) return;

    attemptsList.innerHTML = this.attempts.map((attempt, index) => `
      <div class="attempt-item mb-2 p-2 border rounded">
        <div class="d-flex justify-content-between align-items-center">
          <span><strong>Tentativa ${index + 1}:</strong> "${attempt.spokenWord}"</span>
          <span class="badge ${this.getScoreClass(attempt.scores.total)}">
            ${attempt.scores.total.toFixed(1)}%
          </span>
        </div>
        <small class="text-muted">
          ${attempt.timestamp.toLocaleTimeString()} - 
          Confiança: ${attempt.scores.confidence.toFixed(1)}%
        </small>
      </div>
    `).join('');
  }

  updatePronunciationTips(spokenWord) {
    const tipsContent = document.getElementById('tipsContent');
    if (!tipsContent) return;

    const tips = this.generatePronunciationTips(spokenWord);
    tipsContent.innerHTML = `
      <div class="tips-list">
        ${tips.map(tip => `<div class="tip-item mb-2">${tip}</div>`).join('')}
      </div>
    `;
  }

  generatePronunciationTips(spokenWord) {
    const tips = [];
    const target = this.targetWord;
    
    // Dicas baseadas na diferença entre palavras
    if (spokenWord.length !== target.length) {
      tips.push(`📏 Comprimento: A palavra tem ${target.length} letras, você falou ${spokenWord.length}`);
    }
    
    if (spokenWord[0] !== target[0]) {
      tips.push(`🔤 Primeira letra: Comece com "${target[0].toUpperCase()}"`);
    }
    
    if (spokenWord[spokenWord.length - 1] !== target[target.length - 1]) {
      tips.push(`🔚 Última letra: Termine com "${target[target.length - 1]}"`);
    }
    
    // Dicas específicas para sons comuns
    if (target.includes('th') && !spokenWord.includes('th')) {
      tips.push(`👅 "TH": Coloque a língua entre os dentes`);
    }
    
    if (target.includes('r') && !spokenWord.includes('r')) {
      tips.push(`🗣️ "R": Enrole a língua levemente`);
    }
    
    if (target.includes('v') && spokenWord.includes('b')) {
      tips.push(`💋 "V": Toque o lábio inferior com os dentes superiores`);
    }
    
    if (tips.length === 0) {
      tips.push(`🎯 Continue praticando! Você está no caminho certo!`);
    }
    
    return tips;
  }

  showFinalResult(attempt) {
    const finalResult = document.getElementById('finalResult');
    if (!finalResult) return;

    const { spokenWord, scores } = attempt;
    const isExact = spokenWord === this.targetWord;
    const isExcellent = scores.total > 85;
    const isGood = scores.total > 70;

    let resultClass = 'text-danger';
    let resultMessage = '';
    let resultIcon = '😕';

    if (isExact) {
      resultClass = 'text-success';
      resultMessage = '🎉 Perfeito! Pronúncia exata!';
      resultIcon = '🎉';
    } else if (isExcellent) {
      resultClass = 'text-success';
      resultMessage = '🎉 Excelente pronúncia!';
      resultIcon = '🎉';
    } else if (isGood) {
      resultClass = 'text-warning';
      resultMessage = '👍 Boa tentativa! Continue praticando!';
      resultIcon = '👍';
    } else {
      resultMessage = '😕 Tente novamente. Ouça o áudio para referência.';
      resultIcon = '😕';
    }

    finalResult.innerHTML = `
      <div class="result-card p-3 border rounded ${resultClass}">
        <div class="text-center">
          <h4>${resultIcon} ${resultMessage}</h4>
          <div class="row mt-3">
            <div class="col-md-6">
              <p><strong>Você falou:</strong> "${spokenWord}"</p>
              <p><strong>Palavra correta:</strong> "${this.targetWord}"</p>
            </div>
            <div class="col-md-6">
              <p><strong>Pontuação total:</strong> ${scores.total.toFixed(1)}%</p>
              <p><strong>Tentativa:</strong> ${this.attempts.length}/${this.maxAttempts}</p>
            </div>
          </div>
          ${this.attempts.length < this.maxAttempts ? 
            '<button class="btn btn-primary mt-2" onclick="location.reload()">Tentar Novamente</button>' : 
            '<div class="alert alert-info mt-2">Máximo de tentativas atingido. Recarregue a página para tentar novamente.</div>'
          }
        </div>
      </div>
    `;
  }

  showMaxAttemptsReached() {
    const finalResult = document.getElementById('finalResult');
    if (finalResult) {
      finalResult.innerHTML = `
        <div class="alert alert-warning">
          <h5>⚠️ Máximo de tentativas atingido</h5>
          <p>Você já fez ${this.maxAttempts} tentativas. Recarregue a página para tentar novamente.</p>
          <button class="btn btn-primary" onclick="location.reload()">Recarregar Página</button>
        </div>
      `;
    }
  }

  calculateSimilarity(str1, str2) {
    if (str1 === str2) return 100;

    const len1 = str1.length;
    const len2 = str2.length;
    
    // Se uma das strings estiver vazia, retornar 0
    if (len1 === 0 || len2 === 0) return 0;
    
    const matrix = Array(len2 + 1).fill(null).map(() => Array(len1 + 1).fill(null));

    for (let i = 0; i <= len1; i++) matrix[0][i] = i;
    for (let j = 0; j <= len2; j++) matrix[j][0] = j;

    for (let j = 1; j <= len2; j++) {
      for (let i = 1; i <= len1; i++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,      // inserção
          matrix[j - 1][i] + 1,      // deleção
          matrix[j - 1][i - 1] + cost // substituição
        );
      }
    }

    const distance = matrix[len2][len1];
    const maxLength = Math.max(len1, len2);
    const similarity = Math.max(0, ((maxLength - distance) / maxLength) * 100);
    
    console.log(`Similaridade entre "${str1}" e "${str2}": ${similarity.toFixed(1)}%`);
    return similarity;
  }

  calculateLengthPenalty(str1, str2) {
    const len1 = str1.length;
    const len2 = str2.length;
    
    if (len1 === 0 || len2 === 0) return 0;
    
    const diff = Math.abs(len1 - len2);
    const maxLen = Math.max(len1, len2);
    
    if (diff === 0) return 100;
    
    // Penalidade mais suave para diferenças pequenas
    const penalty = Math.max(0, (1 - (diff / maxLen)) * 100);
    
    console.log(`Penalidade de comprimento: ${str1.length} vs ${str2.length} = ${penalty.toFixed(1)}%`);
    return penalty;
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new PronunciationChecker();
});
