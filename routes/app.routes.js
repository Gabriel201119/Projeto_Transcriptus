const express = require("express");
const router = express.Router();
const verbeteController = require("../controllers/verbete.controller");
const operationsController = require("../controllers/dictionary.controller");

// Rota principal: sempre gera nova palavra
router.get("/", async (req, res) => {
  try {
    const dailyWordInfo = await verbeteController.generateRandomWordtoDailyWord();

    const textError = req.flash("textError");

    res.render("index", { 
      dailyWordInfo,
      textError: textError.length > 0 ? textError[0] : null 
    });
  } catch (error) {
    console.error("Erro ao carregar palavra do dia:", error);
    res.render("index", {
      dailyWordInfo: {
        dailyWord: "welcome",
        definition: "An expression of greeting",
        phonetic: "/ˈwelkəm/",
        date: new Date().toISOString().split("T")[0],
      },
      textError: null
    });
  }
});

router.get("/pronuncia", (req, res) => {
  res.redirect("/");
});

// Gera uma palavra aleatória (para botões AJAX, etc.)
router.post("/random", async (req, res) => {
  try {
    let randomWord;
    let definition;
    let phonetic;
    let translatedDefinition;
    let maxAttempts = 10;
    let attemptCount = 0;

    while (maxAttempts > 0) {
      attemptCount++;
      try {
        randomWord = operationsController.generateRandomWord();

        // Busca definição pela API
        const wordInfo = await verbeteController.getWordInfo(randomWord);
        definition = await verbeteController.getDefinition(wordInfo);

        // Busca fonética pelo dicionário interno
        const [ipaSymbols, phoneticTranscription] = await operationsController.getDetailsOfTranscription(randomWord.toLowerCase());
        phonetic = phoneticTranscription || ipaSymbols || "";

        if (definition) {
          // Traduz definição para português
          translatedDefinition = await verbeteController.translateDefinition(definition);
          console.log(`✓ Palavra válida encontrada após ${attemptCount} tentativa(s): "${randomWord}"`);
          break;
        }
      } catch (error) {
        // Continua tentando sem log para não poluir o console
      }
      maxAttempts--;
    }

    if (!definition) {
      const defaults = [
        { word: "welcome", def: "An expression of greeting", phon: "/ˈwelkəm/", trans: "Uma expressão de cumprimento" },
        { word: "hello", def: "Used as a greeting", phon: "/həˈloʊ/", trans: "Usado como cumprimento" },
        { word: "good", def: "To be desired or approved of", phon: "/ɡʊd/", trans: "Ser desejado ou aprovado" },
        { word: "happy", def: "Feeling or showing pleasure", phon: "/ˈhæpi/", trans: "Sentindo ou mostrando prazer" },
      ];
      const fallback = defaults[Math.floor(Math.random() * defaults.length)];
      return res.json({
        randomWord: fallback.word,
        definition: fallback.def,
        phonetic: fallback.phon,
        translatedDefinition: fallback.trans
      });
    }

    res.json({
      randomWord,
      definition,
      phonetic,
      translatedDefinition
    });
  } catch (error) {
    console.error("❌ Erro crítico ao gerar palavra aleatória:", error.message);
    res.json({
      randomWord: "welcome",
      definition: "An expression of greeting",
      phonetic: "/ˈwelkəm/",
      translatedDefinition: "Uma expressão de cumprimento"
    });
  }
});

module.exports = router;
