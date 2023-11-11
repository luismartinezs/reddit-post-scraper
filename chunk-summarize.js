const fs = require('fs');
const { Configuration, OpenAIApi } = require('openai');
require('dotenv').config();

const configuration = new Configuration({
  apiKey: process.env.OPEN_AI_SECRET,
});
const openai = new OpenAIApi(configuration);

async function summarizeChunks(text, maxLength = 4096) {
  const COMMENT_SEPARATOR = '\n\n';

  console.debug(`Summarizing chunks: ${text}`);
  // Split text into comments
  const comments = text.split(COMMENT_SEPARATOR);
  console.debug(`Number of comments: ${comments.length}`);
  const chunks = [];

  const CHARACTERS_PER_TOKEN = 4;
  const TOKENS_PER_WORD = 4 / 3;
  const SPACE_FOR_SUMMARY_WORDS = 500;

  // Calculate the estimated tokens needed for the summary
  const summaryTokens = Math.round(SPACE_FOR_SUMMARY_WORDS * TOKENS_PER_WORD);

  console.debug(`Summary tokens: ${summaryTokens}`);

  // Allocate tokens for the chunk
  const chunkTokens = maxLength - summaryTokens;

  console.debug(`Chunk tokens: ${chunkTokens}`);

  // Combine comments into chunks
  let currentChunk = comments[0];

  for (let i = 1; i < comments.length; i++) {
    const comment = comments[i];

    // Calculate the combined token count for currentChunk and comment
    const combinedTokenCount = Math.ceil((currentChunk.length + comment.length) / CHARACTERS_PER_TOKEN);

    console.debug(`Combined token count: ${combinedTokenCount}`);

    if (combinedTokenCount < chunkTokens) {
      currentChunk += '\n\n' + comment;
    } else {
      chunks.push(currentChunk);
      currentChunk = comment;
    }
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }

  console.debug(chunks.map(ch => Math.ceil(ch.length / CHARACTERS_PER_TOKEN)));


  if (!fs.existsSync('_chunk-summaries')) {
    fs.mkdirSync('_chunk-summaries');
  }
  const timestamp = new Date().toISOString();
  const outputDir = `_chunk-summaries/${timestamp}`;
  fs.mkdirSync(outputDir);

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const summary = await summarize(chunk);
    const outputFilename = `${outputDir}/chunk_${i}.txt`;

    await new Promise((resolve, reject) => {
      fs.writeFile(outputFilename, summary, (err) => {
        if (err) {
          console.error(`Error writing file: ${outputFilename}`);
          reject(err);
        } else {
          console.log(`Summary written to: ${outputFilename}`);
          resolve();
        }
      });
    });
  }
}

async function summarize(text) {
  console.debug(`Summarizing text: ${text}`);
  try {
    const response = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [{
        role: "user",
        content: `Rewrite the following text from reddit as a brief informative report, removing any small talk. Comments are listed as user_name(reddit score), your job is also to keep the score next to each piece of information and give more importance to higher scores. The user name is saito200:\n\n${text}\n\nSummary:`,
      }],
    });

    const summary = response.data.choices[0].message.content.trim();
    return summary;
  } catch (error) {
    console.error("Error:", error);
  }
}

const inputFilename = './formatted/2023-04-29T10-30-16-311Z.txt';

fs.readFile(inputFilename, 'utf-8', (err, data) => {
  if (err) {
    console.error(`Error reading file: ${inputFilename}`);
    return;
  }

  summarizeChunks(data);
});
