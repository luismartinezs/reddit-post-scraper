const axios = require('axios');
const fs = require('fs');
const path = require('path');

function generateOutputPath(url) {
  const timestamp = new Date().toISOString();
  const urlSlug = url.split('/').pop();
  const fileName = `${timestamp}-${urlSlug}.json`;

  const outputDir = 'output';

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  return path.join(outputDir, fileName);
}

async function fetchCommentsRecursively(commentsData) {
  const comments = [];

  for (const commentData of commentsData) {
    if (commentData.kind === 't1') {
      const author = commentData.data.author;
      const content = commentData.data.body;
      const score = commentData.data.score;

      if (author !== '[deleted]' || (content !== '[removed]' && content !== '[deleted]')) {
        comments.push({ author, content, score });
      }

      // Fetch nested comments (replies)
      if (commentData.data.replies && commentData.data.replies.data.children) {
        const nestedCommentsData = commentData.data.replies.data.children;
        comments.push(...(await fetchCommentsRecursively(nestedCommentsData)));
      }
    } else if (commentData.kind === 'more') {
      for (const childId of commentData.data.children) {
        const response = await fetch(`https://www.reddit.com/api/info.json?id=t1_${childId}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:93.0) Gecko/20100101 Firefox/93.0'
          }
        });

        if (response.ok) {
          const responseData = await response.json();
          if (responseData.data && responseData.data.children) {
            comments.push(...(await fetchCommentsRecursively(responseData.data.children)));
          }
        }
      }
    }
  }

  return comments;
}



async function fetchComments(url, after = '') {
  try {
    const response = await axios.get(`${url}?limit=100&depth=10&after=${after}`);
    const commentsData = response.data[1].data.children;
    const moreCommentsAfter = response.data[1].data.after;

    const comments = await fetchCommentsRecursively(commentsData);

    if (moreCommentsAfter) {
      const moreComments = await fetchComments(url, moreCommentsAfter);
      return comments.concat(moreComments);
    }

    return comments.sort((a, b) => b.score - a.score);
  } catch (error) {
    console.error('Error fetching comments from Reddit API:', error.message);
    return [];
  }
}


async function fetchRedditPost(url) {
  try {
    const response = await axios.get(url);
    const postData = response.data[0].data.children[0].data;

    const postTitle = postData.title;
    const postContent = postData.selftext;

    const comments = await fetchComments(url);

    const data = {
      postTitle,
      postContent,
      comments
    };

    const outputPath = generateOutputPath(url);
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
    console.log(`Output written to: ${outputPath}`);
  } catch (error) {
    console.error('Error fetching data from Reddit API:', error.message);
  }
}



const url = 'https://www.reddit.com/r/digitalnomad/comments/12w8yxm.json';
fetchRedditPost(url);

