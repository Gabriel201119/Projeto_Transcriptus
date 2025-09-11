const fs = require("fs");
const Reverso = require("reverso-api");
const reverso = new Reverso({
  puppeteerOptions: {
    headless: "new",
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--disable-gpu",
      "--window-size=1920x1080",
      "--disable-extensions",
      "--disable-notifications",
      "--disable-default-apps",
      "--disable-sync",
      "--disable-background-networking",
      "--disable-background-timer-throttling",
      "--disable-backgrounding-occluded-windows",
      "--disable-breakpad",
      "--disable-component-extensions-with-background-pages",
      "--disable-features=TranslateUI",
      "--disable-ipc-flooding-protection",
      "--disable-renderer-backgrounding",
      "--disable-speech-api",
      "--disable-web-security",
      "--hide-scrollbars",
      "--metrics-recording-only",
      "--mute-audio",
      "--no-default-browser-check",
      "--no-first-run",
      "--no-pings",
      "--no-zygote",
      "--password-store=basic",
      "--use-mock-keychain"
    ],
    timeout: 60000,
    ignoreHTTPSErrors: true,
    defaultViewport: null
  },
});
const dictionary = require("./dictionary.controller.js");
const gAudio = require("./audioController.js");

// Cache system
const cache = new Map();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Check if word is in cache and not expired
const getFromCache = (word) => {
  const cached = cache.get(word);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
};

// Save to cache
const saveToCache = (word, data) => {
  cache.set(word, {
    data,
    timestamp: Date.now()
  });
};

// Check if there are phrases available for a given word
const hasPhrases = async (word) => {
  try {
    const response = await reverso.getTranslation(
      word,
      "english",
      "portuguese"
    );
    const translations = [...new Set(response.translations)];
    return translations.length > 0; // Returns true if there are translations, otherwise false
  } catch (error) {
    console.error(`Failed to translate word: ${word}. Error: ${error.message}`);
    return false; // Return false if there was an error
  }
};

// Generate phrases in English and Portuguese for a given word
const generatePhrases = async (word) => {
  let retryCount = 0;
  const maxRetries = 3;

  while (retryCount < maxRetries) {
    try {
      console.log(`Tentativa ${retryCount + 1} de buscar frases para:`, word);
      const response = await reverso.getContext(word, "english", "portuguese");
      
      if (!response) {
        console.warn("Resposta vazia do Reverso API");
        retryCount++;
        continue;
      }

      if (!response.ok) {
        console.warn("Resposta inválida do Reverso API:", response);
        retryCount++;
        continue;
      }

      if (!response.examples || !Array.isArray(response.examples)) {
        console.warn("Nenhum exemplo encontrado para a palavra:", word);
        return [];
      }

      console.log("Exemplos encontrados:", response.examples.length);
      
      const phrases = response.examples.map((example) => ({
        english: example.source || "",
        portuguese: example.target || ""
      })).filter(phrase => phrase.english && phrase.portuguese);

      console.log("Frases processadas:", phrases.length);
      return phrases;
    } catch (err) {
      console.error(`Erro na tentativa ${retryCount + 1}:`, err.message);
      retryCount++;
      
      if (retryCount === maxRetries) {
        console.error("Número máximo de tentativas atingido para:", word);
        return [];
      }
      
      // Espera 2 segundos antes de tentar novamente
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  return [];
};

// Generate translations to Portuguese for a given word
const generateTranslate = async (word) => {
  try {
    const response = await reverso.getTranslation(
      word,
      "english",
      "portuguese"
    );
    const translations = [...new Set(response.translations)];
    return translations;
  } catch (error) {
    console.error(`Erro ao traduzir palavra: ${word}. Erro: ${error.message}`);
    return ["Tradução indisponível"];
  }
};

// Get all information about a word including translation, phrases, IPA pronunciation, etc.
const getInfoWord = async (word) => {
  try {
    let text = word.toLowerCase().trim();

    // Check cache first
    const cachedData = getFromCache(text);
    if (cachedData) {
      return cachedData;
    }

    // Executa todas as operações em paralelo
    const [translation, phrasesResult, ipaDetails, audioResult] = await Promise.all([
      generateTranslate(text),
      generatePhrases(text),
      dictionary.getDetailsOfTranscription(text),
      gAudio.generateAudio(text).catch(err => {
        console.warn(`Erro ao gerar áudio para ${text}:`, err.message);
        return null;
      })
    ]);

    const [ipa, pronounce] = ipaDetails || ["IPA indisponível", "Pronúncia indisponível"];

    // Create an object containing all information about the word
    const wordInfo = {
      word: text,
      audio: audioResult ? "../audio.mp3" : null,
      translation: translation || ["Tradução indisponível"],
      phrases: Array.isArray(phrasesResult) ? phrasesResult : [],
      ipa: ipa,
      pronounce: pronounce,
    };

    console.log("Informações da palavra geradas:", {
      word: text,
      translationCount: wordInfo.translation.length,
      phrasesCount: wordInfo.phrases.length,
      hasAudio: !!wordInfo.audio
    });

    // Save to cache
    saveToCache(text, wordInfo);

    return wordInfo;
  } catch (error) {
    console.error("Erro ao obter informações da palavra:", error);
    // Retorna um objeto com valores padrão em caso de erro
    return {
      word: word.toLowerCase().trim(),
      audio: null,
      translation: ["Tradução indisponível"],
      phrases: [],
      ipa: "IPA indisponível",
      pronounce: "Pronúncia indisponível",
    };
  }
};

module.exports = {
  generatePhrases,
  generateTranslate,
  getInfoWord,
  hasPhrases,
};
