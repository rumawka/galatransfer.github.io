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

  const TG_TOKEN    = process.env.TG_TOKEN;
  const TG_CHAT_IDS = (process.env.TG_CHAT_IDS || '').split(',').map(s => s.trim()).filter(Boolean);

  if (!TG_TOKEN || TG_CHAT_IDS.length === 0) {
    return res.status(500).json({ error: 'Server misconfigured' });
  }

  // Парсим body — Vercel иногда передаёт как строку
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch(e) { body = {}; }
  }

  const msg = body && body.msg;
  if (!msg) {
    return res.status(400).json({ error: 'No message' });
  }

  try {
    const results = await Promise.all(
      TG_CHAT_IDS.map(chatId =>
        fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text: msg, parse_mode: 'Markdown' })
        })
      )
    );

    const allOk = results.every(r => r.ok);
    if (allOk) {
      return res.status(200).json({ ok: true });
    } else {
      // Логируем ответы Telegram для отладки
      const details = await Promise.all(results.map(r => r.json().catch(() => ({}))));
      return res.status(502).json({ error: 'Telegram error', details });
    }
  } catch (e) {
    return res.status(500).json({ error: 'Network error', detail: e.message });
  }
}
