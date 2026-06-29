module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { question, context } = req.body;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 400,
        messages: [{ role: 'user', content: `You are Brian Adams' email assistant. Radiologist/PA-C St George Utah. ${context} Asked: "${question}". Reply in 1-2 sentences.` }]
      })
    });

    const data = await response.json();
    const text = data.content?.find(b => b.type === 'text')?.text || 'No response.';
    res.json({ text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
