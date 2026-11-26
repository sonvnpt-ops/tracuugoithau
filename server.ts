import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Determine port: command line --port arg > (if production: process.env.PORT) > default 3000
let designatedPort = 3000;
const portArgIndex = process.argv.indexOf('--port');
if (portArgIndex !== -1 && process.argv[portArgIndex + 1]) {
  designatedPort = parseInt(process.argv[portArgIndex + 1], 10);
} else if (process.env.NODE_ENV === 'production' && process.env.PORT) {
  designatedPort = parseInt(process.env.PORT, 10);
}
const PORT = designatedPort || 3000;

// Allow large payloads up to 100MB for full 2,817+ records dataset
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

const DATA_DIR = path.resolve(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'dataset.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// API: Get current synchronized dataset
app.get('/api/tenders', (req, res) => {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      const data = JSON.parse(content);
      return res.json({
        success: true,
        records: data.records || [],
        meta: data.meta || null,
      });
    }
    return res.json({
      success: false,
      records: [],
      meta: null,
      message: 'No server dataset saved yet.',
    });
  } catch (err: any) {
    console.error('Error reading dataset:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// API: Fast metadata check
app.get('/api/tenders/meta', (req, res) => {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      const data = JSON.parse(content);
      return res.json({
        success: true,
        meta: data.meta || null,
        recordCount: (data.records || []).length,
      });
    }
    return res.json({ success: false, meta: null, recordCount: 0 });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// API: Save / Sync dataset to server so all devices (phone, desktop) have it
app.post('/api/tenders/sync', (req, res) => {
  try {
    const { records, meta } = req.body;
    if (!records || !Array.isArray(records)) {
      return res.status(400).json({ success: false, error: 'Invalid records array' });
    }

    const payload = {
      records,
      meta: {
        ...meta,
        savedAt: new Date().toISOString(),
        syncedToServer: true,
      },
    };

    fs.writeFileSync(DATA_FILE, JSON.stringify(payload), 'utf-8');
    console.log(`[Server] Synced and saved ${records.length} records to server disk.`);

    return res.json({
      success: true,
      count: records.length,
      meta: payload.meta,
      message: `Đã lưu thành công ${records.length} gói thầu lên máy chủ. Tất cả thiết bị di động đều có thể truy cập!`,
    });
  } catch (err: any) {
    console.error('Error saving dataset:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// API: Clear server dataset (revert to demo)
app.delete('/api/tenders', (req, res) => {
  try {
    if (fs.existsSync(DATA_FILE)) {
      fs.unlinkSync(DATA_FILE);
    }
    return res.json({ success: true, message: 'Server dataset cleared.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT} (isProd: ${isProd})`);
  });

  server.on('error', (err: any) => {
    console.error(`[Server Error]`, err);
  });
}

startServer();
