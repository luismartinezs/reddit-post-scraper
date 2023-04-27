const { Configuration, OpenAIApi } = require('openai');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const configuration = new Configuration({
  apiKey: process.env.OPEN_AI_SECRET,
});
const openai = new OpenAIApi(configuration);

function formatContent(content) {
  const data = JSON.parse(content);

  const postTitle = data.postTitle.trim();
  const postContent = data.postContent.replace(/[\n]+/g, ' ').trim();

  const formattedComments = data.comments.map((comment) => {
    const author = comment.author.trim();
    const score = comment.score;
    const commentContent = comment.content.replace(/[\n]+/g, ' ').trim();
    return `${author}(${score}): ${commentContent}`;
  });

  const formattedContent = `Title: ${postTitle}\nContent: ${postContent}\nComments:\n${formattedComments.join('\n')}`;
  return formattedContent;
}


function safeStringify(obj, space = 2) {
  const cache = new Set();
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (cache.has(value)) {
        return; // Remove the circular reference
      }
      cache.add(value);
    }
    return value;
  }, space);
}

async function generateSummary(content) {

  try {
    // const maxLength = 8192; // Maximum allowed tokens
    const maxLength = 8192 * 3; // Maximum allowed tokens
    const truncatedContent = content.slice(0, maxLength);

    const task = `Summarize the comments on this reddit post, listing the locations in order of most to least attractive, and including some info for each. Comments are in the format author(comment score): comment. Comments with higher score are more important. The author's username is saito200.`

    const response = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [{
        role: "user",
        content: `${task}\n\n${truncatedContent}`,
        // max_tokens: maxLength
      }],
    });

    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error generating summary:', error);
    return null;
  }
}

const inputFilename = './output/2023-04-27T19:07:37.767Z-12w8yxm.json.json';

fs.readFile(inputFilename, 'utf8', async (error, fileContent) => {
  if (error) {
    console.error(`Error reading file ${inputFilename}:`, error);
    return;
  }

  const formattedDir = 'formatted'
  if (!fs.existsSync(formattedDir)) {
    fs.mkdirSync(formattedDir);
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  const formattedContent = formatContent(fileContent);
  const formattedOutputPath = path.join(formattedDir, `${timestamp}.txt`)

  fs.writeFile(formattedOutputPath, formattedContent, (error) => {
    if (error) {
      console.error(`Error writing file ${formattedOutputPath}:`, error);
      return;
    }

    console.log(`Fomratted text saved to ${formattedOutputPath}`);
  });

  const summary = await generateSummary(formattedContent);

  const summariesDir = 'summaries';
  if (!fs.existsSync(summariesDir)) {
    fs.mkdirSync(summariesDir);
  }

  const outputFilename = `${timestamp}.txt`;
  const outputPath = path.join(summariesDir, outputFilename);

  fs.writeFile(outputPath, summary, (error) => {
    if (error) {
      console.error(`Error writing file ${outputPath}:`, error);
      return;
    }

    console.log(`Summary saved to ${outputPath}`);
  });
});
