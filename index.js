const puppeteer = require('puppeteer');

const url = 'https://www.reddit.com/r/digitalnomad/comments/12w8yxm';

async function waitForSelectorOrTimeout(page, selector, timeout = 5000) {
  return Promise.race([
    page.waitForSelector(selector),
    new Promise((_, reject) => setTimeout(() => reject(new Error(`Timeout: unable to find ${selector}`)), timeout))
  ]);
}

async function scrapeRedditPost(url) {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2' });

  await waitForSelectorOrTimeout(page, 'div[data-testid="post-content"]');
  const postTitle = await page.$eval('div[data-testid="post-content"] h1', el => el.innerText);

  await waitForSelectorOrTimeout(page, 'div[data-testid="post-content"]');
  const postContent = await page.$eval('div[data-testid="post-content"]', el => el.innerText);

  await waitForSelectorOrTimeout(page, 'div[data-testid="comment"]');
  const comments = await page.$$eval('div[data-testid="comment"]', comments => {
    return comments.map(comment => {
      const author = comment.querySelector('a[href^="/user/"]').innerText;
      const content = comment.querySelector('div[data-testid="comment-text"]').innerText;

      return { author, content };
    });
  });

  await browser.close();

  return {
    postTitle,
    postContent,
    comments
  };
}


scrapeRedditPost(url)
  .then(data => {
    console.log('Post Title:', data.postTitle);
    console.log('Post Content:', data.postContent);
    console.log('Comments:', data.comments);
  })
  .catch(err => {
    console.error('Error:', err);
  });