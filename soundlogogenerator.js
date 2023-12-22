
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require("fs");
const textToSpeech = require('@google-cloud/text-to-speech').TextToSpeechClient;
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");
const upload = multer({ dest: 'uploads/' });
const app = express();
const port = 3001;

const MODEL_NAME = "gemini-pro-vision";
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEN_AI_API_KEY);

const ttsClient = new textToSpeech();

async function convertTextToSpeech(text) {
  const request = {
    input: {text: text},
    voice: {languageCode: 'en-US', ssmlGender: 'NEUTRAL'},
    audioConfig: {audioEncoding: 'MP3'},
  };
  const [response] = await ttsClient.synthesizeSpeech(request);
  const audioFileName = `audio_output_${Date.now()}.mp3`;
  fs.writeFileSync(`Sound/${audioFileName}`, response.audioContent, 'binary');
  console.log(`Audio content written to file: Sound/${audioFileName}`);
  return audioFileName;
}

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('.'));
app.use('/audio', express.static('Sound'));

app.post('/process-image', upload.single('file'), async (req, res) => {
  if (!req.file) {
      return res.status(400).json({ error: "No image uploaded." });
  }

  try {
        const model = genAI.getGenerativeModel({ model: MODEL_NAME });
        const generationConfig = {
            temperature: 0.9,
            topK: 32,
            topP: 0.95,
            maxOutputTokens: 4096,
        };

        const safetySettings = [
          { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
          { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
          { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
          { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE }
        ];

        const parts = [
            { text: "Analyze this logo and describe its key visual elements. Based on these elements, suggest a musical theme or style that would best represent its brand identity as a sound logo." },
            { inlineData: { mimeType: "image/png", data: Buffer.from(fs.readFileSync(req.file.path)).toString("base64") } }
        ];

        const result = await model.generateContent({ contents: [{ role: "user", parts }], generationConfig, safetySettings });
        const response = result.response;
        const textOutput = response.text();
        console.log(textOutput);

        // Evaluate the generated text using TrueLens
       //const evalResults = await evaluateTextUsingTrueLens(textOutput);
       // Here, you might decide to use evalResults to determine further actions

        const audioFileName = await convertTextToSpeech(textOutput);

        res.status(200).json({ 
          message: "Content generated", 
          textOutput: textOutput, 
          speechAudioFile: audioFileName,
          //truelensEval: evalResults  Optionally send back the evaluation results
      });
      
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error processing image." });
    } finally {
        fs.unlinkSync(req.file.path);
    }
});

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});




// TrueLens Evaluation Function
const { spawn } = require('child_process');

function evaluateTextUsingTrueLens(text) {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn('python', ['truelens_eval_script.py', text]);

    let output = '';
    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        return reject(`Python script exited with code ${code}`);
      }
      try {
        const evalResults = JSON.parse(output);
        resolve(evalResults);
      } catch (error) {
        reject(error);
      }
    });
  });
}
