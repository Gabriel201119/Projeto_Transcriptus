const express = require("express");
const router = express.Router();
const bodyParser = require("body-parser");
const wordInfoController = require("../controllers/wordDetails.controller");
const inputIsValid = require("../middleware/checkInput.middleware");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const path = require("path");
const fs = require("fs");

router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());

router.get("/audio/:word.mp3", (req, res) => {
  try {
    const audioPath = path.join(__dirname, "../public/audio.mp3");
    
    if (fs.existsSync(audioPath)) {
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Cache-Control', 'no-cache');
      res.sendFile(audioPath);
    } else {
      res.status(404).send('Audio file not found');
    }
  } catch (error) {
    console.error("Erro ao servir áudio:", error);
    res.status(500).send('Error serving audio file');
  }
});

// Rota para exibir detalhes da palavra
router.get("/word/:word", async (req, res) => {
  try {
    const word = req.params.word;
    const wordInfo = await wordInfoController.getInfoWord(word);
    res.render("wordDetails", { wordInfo });
  } catch (error) {
    console.error(error);
    req.flash("textError", "Palavra não encontrada");
    res.redirect("/");
  }
});

// router to save the transcription of word
router.post("/text/save", inputIsValid, async (req, res) => {
  try {
    const word = req.body.text;
    const userId = res.locals.user?.id;

    // Salva no histórico se o usuário estiver logado
    if (userId) {
      await prisma.search.create({
        data: {
          word: word,
          type: "PRONUNCIATION",
          userId: userId,
        },
      });
    }

    const wordInfo = await wordInfoController.getInfoWord(word);
    res.redirect(`/word/${word}`);
  } catch (error) {
    console.error(error);
    req.flash("textError", "Palavra não encontrada");
    res.redirect("/");
  }
});

module.exports = router;
