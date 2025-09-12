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
const { translate } = require("bing-translate-api");

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
  // Em produção, usar frases estáticas como fallback
  if (process.env.NODE_ENV === 'production') {
    console.log("Modo produção: usando frases estáticas para:", word);
    return generateStaticPhrases(word);
  }

  let retryCount = 0;
  const maxRetries = 2; // Reduzido para produção

  while (retryCount < maxRetries) {
    try {
      console.log(`Tentativa ${retryCount + 1} de buscar frases para:`, word);
      
      // Timeout mais curto para produção
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 15000)
      );
      
      const apiPromise = reverso.getContext(word, "english", "portuguese");
      const response = await Promise.race([apiPromise, timeoutPromise]);
      
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
        return generateStaticPhrases(word);
      }

      console.log("Exemplos encontrados:", response.examples.length);
      
      const phrases = response.examples.map((example) => {
        // Verificar se example é válido
        if (!example || typeof example !== 'object') {
          return null;
        }
        
        return {
          english: example.source || "",
          portuguese: example.target || ""
        };
      }).filter(phrase => phrase && phrase.english && phrase.portuguese);

      console.log("Frases processadas:", phrases.length);
      
      // Se não conseguiu frases suficientes, usar fallback
      if (phrases.length < 2) {
        return generateStaticPhrases(word);
      }
      
      return phrases;
    } catch (err) {
      console.error(`Erro na tentativa ${retryCount + 1}:`, err.message);
      retryCount++;
      
      if (retryCount === maxRetries) {
        console.error("Número máximo de tentativas atingido para:", word);
        return generateStaticPhrases(word);
      }
      
      // Espera 1 segundo antes de tentar novamente
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return generateStaticPhrases(word);
};

// Gerar frases estáticas como fallback
const generateStaticPhrases = (word) => {
  const staticPhrases = {
    'cat': [
      { english: "The cat is sleeping", portuguese: "O gato está dormindo" },
      { english: "I love my cat", portuguese: "Eu amo meu gato" }
    ],
    'dog': [
      { english: "The dog is playing", portuguese: "O cachorro está brincando" },
      { english: "My dog is very friendly", portuguese: "Meu cachorro é muito amigável" }
    ],
    'house': [
      { english: "This is my house", portuguese: "Esta é minha casa" },
      { english: "The house is beautiful", portuguese: "A casa é bonita" }
    ],
    'car': [
      { english: "I drive my car", portuguese: "Eu dirijo meu carro" },
      { english: "The car is fast", portuguese: "O carro é rápido" }
    ],
    'book': [
      { english: "I read a book", portuguese: "Eu leio um livro" },
      { english: "This book is interesting", portuguese: "Este livro é interessante" }
    ]
  };

  return staticPhrases[word.toLowerCase()] || [
    { english: `The ${word} is important`, portuguese: `O ${word} é importante` },
    { english: `I like ${word}`, portuguese: `Eu gosto de ${word}` }
  ];
};

// Fallback translation using Bing Translate
const fallbackTranslate = async (word) => {
  try {
    const result = await translate(word, null, 'pt');
    const translation = result.translation;
    
    // Gerar múltiplas traduções baseadas na palavra
    const translations = [translation];
    
    // Adicionar traduções adicionais baseadas em palavras comuns
    const additionalTranslations = getAdditionalTranslations(word);
    translations.push(...additionalTranslations);
    
    // Remover duplicatas
    return [...new Set(translations)];
  } catch (error) {
    console.warn(`Erro no fallback de tradução para ${word}:`, error.message);
    return getStaticTranslations(word);
  }
};

// Obter traduções adicionais baseadas na palavra
const getAdditionalTranslations = (word) => {
  const wordTranslations = {
    'cat': ['gato', 'felino', 'bichano'],
    'dog': ['cachorro', 'cão', 'canino'],
    'house': ['casa', 'residência', 'moradia'],
    'car': ['carro', 'automóvel', 'veículo'],
    'book': ['livro', 'obra', 'publicação'],
    'water': ['água', 'líquido'],
    'food': ['comida', 'alimento', 'refeição'],
    'love': ['amor', 'carinho', 'afeição'],
    'happy': ['feliz', 'alegre', 'contente'],
    'good': ['bom', 'bem', 'ótimo']
  };
  
  return wordTranslations[word.toLowerCase()] || [];
};

// Traduções estáticas como último recurso
const getStaticTranslations = (word) => {
  return [`Tradução de ${word}`, `Significado de ${word}`];
};

// Generate translations to Portuguese for a given word
const generateTranslate = async (word) => {
  // Em produção, priorizar Bing Translate que é mais confiável
  if (process.env.NODE_ENV === 'production') {
    console.log("Modo produção: usando Bing Translate para:", word);
    return await fallbackTranslate(word);
  }

  try {
    const response = await reverso.getTranslation(
      word,
      "english",
      "portuguese"
    );
    
    // Verificar se a resposta é válida
    if (!response) {
      console.warn("Resposta vazia da API de tradução para:", word);
      return await fallbackTranslate(word);
    }
    
    // Verificar se translations existe e é um array
    if (!response.translations || !Array.isArray(response.translations)) {
      console.warn("Formato de resposta inválido para tradução:", response);
      return await fallbackTranslate(word);
    }
    
    const translations = [...new Set(response.translations)];
    return translations.length > 0 ? translations : await fallbackTranslate(word);
  } catch (error) {
    console.error(`Erro ao traduzir palavra: ${word}. Erro: ${error.message}`);
    return await fallbackTranslate(word);
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
