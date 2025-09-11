const gTTS = require("gtts");
const fs = require("fs");
const path = require("path");

// generate a audio file 
const generateAudio = async (word) => {
  return new Promise((resolve, reject) => {
    try {
      const audioPath = path.join(__dirname, "../public/audio.mp3");
      
      // Remove o arquivo antigo se existir
      if (fs.existsSync(audioPath)) {
        fs.unlinkSync(audioPath);
      }

      var gtts = new gTTS(word, "en");
      gtts.save(audioPath, function (err, result) {
        if (err) {
          console.error("Erro ao gerar áudio:", err);
          reject(err);
        } else {
          console.log("Áudio gerado com sucesso");
          resolve(result);
        }
      });
    } catch (error) {
      console.error("Erro ao gerar áudio:", error);
      reject(error);
    }
  });
};

module.exports = { generateAudio };
