const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const CONTENT_FILE = path.join(__dirname, 'content.json');

app.use(express.json({ limit: '2mb' }));
app.use(express.static(__dirname));

app.get('/api/content', (req, res) => {
  res.sendFile(CONTENT_FILE);
});

app.post('/api/content', (req, res) => {
  try {
    fs.writeFileSync(CONTENT_FILE, JSON.stringify(req.body, null, 2), 'utf8');
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`\n✅  Admin Panel: http://localhost:${PORT}/admin.html`);
  console.log(`🌐  Portfolio:   http://localhost:${PORT}/portfolio.html\n`);
});
