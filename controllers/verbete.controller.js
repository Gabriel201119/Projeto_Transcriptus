const axios = require("axios");
const dayjs = require("dayjs");
const dictionary = require("./dictionary.controller");
const { translate } = require("bing-translate-api");
const fs = require("fs").promises;
const path = require("path");

// Cache da palavra diária
const DAILY_WORD_CACHE_FILE = path.join(__dirname, "../dailyWord.json");

// Verifica se a palavra do dia já foi gerada hoje
async function getCachedDailyWord() {
  try {
    const data = await fs.readFile(DAILY_WORD_CACHE_FILE, 'utf8');
    const cached = JSON.parse(data);
    const today = dayjs().format("YYYY/MM/DD");
    
    if (cached.date === today && cached.dailyWord && cached.definition) {
      console.log(`✓ Usando palavra do dia em cache: "${cached.dailyWord}"`);
      return cached;
    }
    
    return null;
  } catch (error) {
    console.log("Cache da palavra diária não encontrado ou inválido");
    return null;
  }
}

// Salva a palavra do dia no cache
async function saveDailyWordToCache(dailyWordData) {
  try {
    await fs.writeFile(DAILY_WORD_CACHE_FILE, JSON.stringify(dailyWordData, null, 2));
    console.log(`✓ Palavra do dia salva no cache: "${dailyWordData.dailyWord}"`);
  } catch (error) {
    console.error("Erro ao salvar palavra do dia no cache:", error);
  }
}

// Busca informações da palavra na API externa
async function getWordInfo(word) {
  try {
    const response = await axios.get(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`,
      { timeout: 5000 } // Timeout de 5 segundos
    );
    return response.data;
  } catch (error) {
    // Só loga erros que não sejam 404 (palavra não encontrada)
    if (error.response && error.response.status === 404) {
      // Palavra não encontrada - não é um erro crítico
      return null;
    } else if (error.code === 'ECONNABORTED' || error.code === 'ENOTFOUND') {
      // Problemas de conexão - loga apenas uma vez
      console.warn("Problema de conexão com API de dicionário:", error.message);
      return null;
    } else {
      // Outros erros - loga apenas uma vez
      console.warn("Erro ao buscar informações da palavra:", error.message);
      return null;
    }
  }
}

// Pega definição da palavra
async function getDefinition(wordInfoJson) {
  if (!wordInfoJson || !Array.isArray(wordInfoJson)) return null;
  try {
    const definitions = wordInfoJson[0]?.meanings?.flatMap((meaning) =>
      meaning.definitions.map((definition) => definition.definition)
    );
    return definitions?.[0] || null;
  } catch (error) {
    console.error("Erro ao obter definição:", error);
    return null;
  }
}

// Traduz definição para português
async function translateDefinition(definition) {
  if (!definition) return null;
  try {
    const result = await translate(definition, null, 'pt');
    return result.translation;
  } catch (error) {
    console.warn("Erro ao traduzir definição:", error.message);
    return null;
  }
}

// Gera palavra aleatória do dia com fonética e definição
async function generateRandomWordtoDailyWord() {
  try {
    // 1. Verifica se já existe palavra do dia em cache
    const cachedWord = await getCachedDailyWord();
    if (cachedWord) {
      return cachedWord;
    }

    console.log("🔄 Gerando nova palavra do dia...");
    const today = dayjs().format("YYYY/MM/DD");
    let randomWord, phonetic, definition, translatedDefinition;

    let attempts = 3; // Reduzido para 3 tentativas para melhor performance
    let foundValidWord = false;

    while (attempts > 0 && !foundValidWord) {
      try {
        // 1. Gera palavra aleatória do ipadict
        randomWord = dictionary.generateRandomWord();

        // 2. Busca fonética do ipadict
        const [ipaSymbols, phoneticTranscription] =
          await dictionary.getDetailsOfTranscription(randomWord.toLowerCase());
        phonetic = phoneticTranscription || ipaSymbols || "Phonetic not available";

        // 3. Busca definição via API
        const wordInfoJson = await getWordInfo(randomWord);
        definition = await getDefinition(wordInfoJson);

        if (definition) {
          // 4. Traduz definição para português
          translatedDefinition = await translateDefinition(definition);
          foundValidWord = true;
          console.log(`✓ Palavra do dia gerada: "${randomWord}"`);
        } else {
          console.log(`⚠ Palavra "${randomWord}" não encontrada na API, tentando outra...`);
        }
      } catch (error) {
        console.log(`⚠ Erro ao processar palavra "${randomWord}":`, error.message);
      }
      
      attempts--;
    }

    // fallback caso não consiga encontrar definição
    if (!foundValidWord) {
      console.log("⚠ Usando palavra padrão devido a falhas na API");
      randomWord = "welcome";
      definition = "An expression of greeting";
      phonetic = "/ˈwelkəm/";
      translatedDefinition = "Uma expressão de cumprimento";
    }

    const dailyWordData = {
      date: today,
      dailyWord: randomWord,
      definition,
      phonetic,
      translatedDefinition,
    };

    // Salva no cache para próximas requisições do dia
    await saveDailyWordToCache(dailyWordData);

    return dailyWordData;
  } catch (error) {
    console.error("Erro ao gerar palavra diária:", error);
    return {
      date: dayjs().format("YYYY/MM/DD"),
      dailyWord: "welcome",
      definition: "An expression of greeting",
      phonetic: "/ˈwelkəm/",
      translatedDefinition: "Uma expressão de cumprimento",
    };
  }
}

module.exports = {
  generateRandomWordtoDailyWord,
  getWordInfo,
  getDefinition,
  translateDefinition,
};
