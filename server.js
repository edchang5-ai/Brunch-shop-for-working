import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PlacesClient } from './lib/google.js';
import { GeminiClient } from './lib/gemini.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;

const places = new PlacesClient(process.env.GOOGLE_MAPS_API_KEY);
const gemini = new GeminiClient(process.env.GEMINI_API_KEY, process.env.GEMINI_MODEL);

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function requireKeys(req, res, next) {
  if (!process.env.GOOGLE_MAPS_API_KEY || !process.env.GEMINI_API_KEY) {
    return res.status(500).json({
      error: '缺少 API Key，請先複製 .env.example 為 .env 並填入 GOOGLE_MAPS_API_KEY 與 GEMINI_API_KEY。',
    });
  }
  next();
}

app.post('/api/search', requireKeys, async (req, res) => {
  try {
    const query = req.body.query || process.env.DEFAULT_QUERY || '彰化市 brunch';
    const count = Math.min(Number(req.body.count) || 10, 20);
    const results = await places.searchText(query, count);
    res.json({ results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/analyze', requireKeys, async (req, res) => {
  try {
    const { placeId } = req.body;
    if (!placeId) return res.status(400).json({ error: '缺少 placeId' });

    const place = await places.getDetails(placeId);
    const analysis = await gemini.analyzePlace(place);
    res.json({ place, analysis });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Brunch Shop 服務已啟動：http://localhost:${PORT}`);
});
