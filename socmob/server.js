const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Set up EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// In-memory storage for liked news (replace with a database in a real application)
let likedNews = [];

// Home page route (web-scraped news)
app.get('/', async (req, res) => {
  try {
    const scrapedNews = await scrapeNews();
    res.render('home', { news: scrapedNews, likedNews });
  } catch (error) {
    console.error('Error fetching scraped news:', error);
    res.status(500).send('Error fetching news');
  }
});

// Verified news page route (API-based news)
app.get('/verified-news', async (req, res) => {
  try {
    const verifiedNews = await fetchVerifiedNews();
    res.render('verified-news', { news: verifiedNews, likedNews });
  } catch (error) {
    console.error('Error fetching verified news:', error);
    res.status(500).send('Error fetching news');
  }
});

// Liked news page route
app.get('/liked-news', (req, res) => {
  res.render('liked-news', { likedNews });
});

// Like/unlike news route
app.post('/toggle-like/:id', express.json(), (req, res) => {
  const { id } = req.params;
  const { title, description, source } = req.body;

  const existingIndex = likedNews.findIndex(item => item.id === id);
  if (existingIndex !== -1) {
    likedNews.splice(existingIndex, 1);
  } else {
    likedNews.push({ id, title, description, source });
  }

  res.json({ success: true });
});

// Web scraping function
async function scrapeNews() {
  try {
    const response = await axios.get('https://www.reuters.com/fact-check/');
    const $ = cheerio.load(response.data);
    const news = [];

    $('.news-item').each((index, element) => {
      const title = $(element).find('.title').text();
      const description = $(element).find('.description').text();
      news.push({ id: `scraped-${index}`, title, description, source: 'Web Scrape' });
    });

    return news;
  } catch (error) {
    console.error('Error scraping news:', error);
    return [];
  }
}

// API news fetching function
async function fetchVerifiedNews() {
  try {
    const API_KEY = 'your_api_key_here';
    const API_URL = 'https://newsapi.org/v2/top-headlines';

    const response = await axios.get(API_URL, {
      params: {
        country: 'us',
        apiKey: API_KEY,
      },
    });

    return response.data.articles.map((article, index) => ({
      id: `api-${index}`,
      title: article.title,
      description: article.description,
      source: 'API',
    }));
  } catch (error) {
    console.error('Error fetching verified news:', error);
    return [];
  }
}

app.listen(port, () => {
  console.log(`News aggregator app listening at http://localhost:${port}`);
});