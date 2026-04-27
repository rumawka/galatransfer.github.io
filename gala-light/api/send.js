export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const TG_TOKEN = process.env.TG_TOKEN;
  const TG_CHAT_IDS = (process.env.TG_CHAT_IDS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  if (!TG_TOKEN || TG_CHAT_IDS.length === 0) {
    return res.status(500).json({ error: 'Server misconfigured' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { 
      body = JSON.parse(body); 
    } catch (e) { 
      body = {}; 
    }
  }

  const msg = body && typeof body.msg === 'string' ? body.msg.trim() : '';

  if (!msg) {
    return res.status(400).json({ error: 'No message' });
  }

  async function sendToTelegram(chatId, withMarkdown = true) {
    const payload = {
      chat_id: chatId,
      text: msg.slice(0, 3900),
      disable_web_page_preview: true
    };

    if (withMarkdown) {
      payload.parse_mode = 'Markdown';
    }

    return fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  }

  try {
    const results = await Promise.all(
      TG_CHAT_IDS.map(async chatId => {
        let response = await sendToTelegram(chatId, true);
        if (!response.ok) {
          response = await sendToTelegram(chatId, false);
        }

        return response;
      })
    );

    const allOk = results.every(r => r.ok);

    if (allOk) {
      return res.status(200).json({ ok: true });
    }

    const details = await Promise.all(
      results.map(r => r.json().catch(() => ({})))
    );

    return res.status(502).json({ error: 'Telegram error', details });
  } catch (e) {
    return res.status(500).json({ error: 'Network error', detail: e.message });
  }
}
