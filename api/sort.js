module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { emails } = req.body;

    const prompt = `You are an email sorter for Brian Adams, a radiologist/PA-C in St. George Utah who runs Red Sands Vein and Laser Institute. Categorize each email as "important", "junk", or "unsure".
Important: work, medical, scheduling, QGenda, personal messages from real people, security alerts, GitHub, Vercel, calendar invites, anything needing action.
Junk: marketing, promos, newsletters, Facebook suggestions, YouTube recommendations, social media notifications.
Unsure: anything ambiguous.
Reply ONLY with valid JSON array, no markdown. Example: [{"id":"abc","folder":"important"}]
Emails: ${JSON.stringify(emails)}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    const raw = data.content?.find(b => b.type === 'text')?.text || '[]';
    const results = JSON.parse(raw.replace(/```json|```/g, '').trim());
    res.json({ results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
