document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('translationForm');
    const inputText = document.getElementById('inputText');
    const outputText = document.getElementById('output');
    const switchButton = document.getElementById('switchLanguages');
    const sourceLangInput = document.getElementById('sourceLang');
    const targetLangInput = document.getElementById('targetLang');
    const sourceFlag = document.getElementById('sourceFlag');
    const targetFlag = document.getElementById('targetFlag');
    const sourceText = document.getElementById('sourceText');
    const targetText = document.getElementById('targetText');
    const micButton = document.getElementById('micButton');
    const micStatus = document.getElementById('micStatus');

    // Configuração do reconhecimento de voz
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    let isRecording = false;

    recognition.continuous = true;
    recognition.interimResults = true;

    function updateRecognitionLanguage() {
        recognition.lang = sourceLangInput.value === 'en' ? 'en-US' : 'pt-BR';
    }
    updateRecognitionLanguage();

    // Função para inverter os idiomas
    function switchLanguages() {
        const tempLang = sourceLangInput.value;
        sourceLangInput.value = targetLangInput.value;
        targetLangInput.value = tempLang;

        const tempFlagSrc = sourceFlag.src;
        sourceFlag.src = targetFlag.src;
        targetFlag.src = tempFlagSrc;

        const tempText = sourceText.textContent;
        sourceText.textContent = targetText.textContent;
        targetText.textContent = tempText;

        inputText.value = '';
        outputText.value = '';
        updateRecognitionLanguage();

        inputText.placeholder = sourceLangInput.value === 'en' ? 
            "Escreva ou cole seu texto em inglês aqui" : 
            "Escreva ou cole seu texto em português aqui";
    }

    // Eventos do reconhecimento de voz
    recognition.onstart = () => {
        isRecording = true;
        micButton.classList.add('recording');
        micStatus.textContent = 'Ouvindo...';
        inputText.placeholder = 'Fale agora...';
    };

    recognition.onend = () => {
        isRecording = false;
        micButton.classList.remove('recording');
        micStatus.textContent = '';
        inputText.placeholder = sourceLangInput.value === 'en' ? 
            "Escreva ou cole seu texto em inglês aqui" : 
            "Escreva ou cole seu texto em português aqui";
    };

    recognition.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                finalTranscript += transcript + ' ';
            }
        }
        
        if (finalTranscript) {
            inputText.value = finalTranscript.trim();
            // Traduz automaticamente após reconhecer a fala
            form.dispatchEvent(new Event('submit'));
        }
    };

    recognition.onerror = (event) => {
        console.error('Erro no reconhecimento de voz:', event.error);
        micStatus.textContent = 'Erro no reconhecimento de voz. Tente novamente.';
        micButton.classList.remove('recording');
        isRecording = false;
    };

    // Evento do botão de microfone
    micButton.addEventListener('click', () => {
        if (isRecording) {
            recognition.stop();
        } else {
            inputText.value = '';
            recognition.start();
        }
    });

    // Adiciona evento ao botão de inverter
    switchButton.addEventListener('click', switchLanguages);

    // Função para limpar os campos
    window.clearTextArea = function() {
        inputText.value = '';
        outputText.value = '';
    }

    // Manipula o envio do formulário
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!inputText.value.trim()) {
            return;
        }

        try {
            const response = await fetch('/significado', {
                method: 'POST',
        headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    texts: inputText.value,
                    sourceLang: sourceLangInput.value,
                    targetLang: targetLangInput.value
                })
            });

            const data = await response.json();
            outputText.value = data.translatedText;
    } catch (error) {
            console.error('Erro na tradução:', error);
            outputText.value = 'Erro ao traduzir o texto. Por favor, tente novamente.';
    }
  });
  });
