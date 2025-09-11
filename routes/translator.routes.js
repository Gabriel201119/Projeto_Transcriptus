const express = require("express");
const router = express.Router();
const translatorController = require("../controllers/translator.controller");
const bodyParser = require("body-parser");
const authMiddleware = require('../middleware/auth.middleware');

router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());

// route to translator
router.get("/tradutor", authMiddleware, (req, res) => {
  res.render("translator");
});

router.post("/significado", authMiddleware, async (req, res) => {
  try {
    const { texts, sourceLang, targetLang } = req.body;
    const userId = res.locals.user?.id;
    const translatedText = await translatorController.translateText(texts, sourceLang, targetLang, userId);
    res.json({ translatedText });
  } catch (err) {
    console.error("Erro na tradução:", err);
    res.json({ translatedText: "Erro ao traduzir. Por favor, tente novamente." });
  }
});

module.exports = router;
