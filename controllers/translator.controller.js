const { translate } = require("bing-translate-api");
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Translation between languages
const translation = async (text, sourceLang, targetLang) => {
  try {
    const res = await translate(text, sourceLang === 'pt' ? 'pt' : null, targetLang === 'pt' ? 'pt' : 'en');
    return res.translation;
  } catch (err) {
    console.error("Erro na tradução:", err);
    return "Tradução indisponível";
  }
};

// Translate text between languages
const translateText = async (text, sourceLang, targetLang, userId) => {
  try {
    const translatedText = await translation(text, sourceLang, targetLang);
    
    // Registra a busca no histórico do usuário
    if (userId) {
    await prisma.search.create({
      data: {
        word: text,
        type: 'TRANSLATION',
        userId: userId
      }
    });
    }

    return translatedText;
  } catch (err) {
    console.error("Erro ao traduzir texto:", err);
    return "Não foi possível realizar a tradução. Tente novamente mais tarde.";
  }
};

module.exports = { translateText };
