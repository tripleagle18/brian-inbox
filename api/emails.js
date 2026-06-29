const { google } = require('googleapis');
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  try {
    const { tokens, pageToken } = req.body;
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    oauth2Client.setCredentials(tokens);
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    const listParams = {
      userId: 'me',
      maxResults: 100,
      labelIds: ['INBOX']
    };
    if (pageToken) listParams.pageToken = pageToken;

    const listRes = await gmail.users.messages.list(listParams);
    const messages = listRes.data.messages || [];
    const nextPageToken = listRes.data.nextPageToken || null;

    const emails = await Promise.all(messages.map(async (msg) => {
      const detail = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id,
        format: 'metadata',
        metadataHeaders: ['From', 'Subject', 'Date']
      });
      const headers = detail.data.payload.headers;
      const from = headers.find(h => h.name === 'From')?.value || '';
      const subject = headers.find(h => h.name === 'Subject')?.value || '(no subject)';
      const date = headers.find(h => h.name === 'Date')?.value || '';
      const fromName = from.replace(/<.*>/, '').replace(/"/g, '').trim() || from.split('@')[0];
      const fromEmail = from.match(/<(.+)>/)?.[1] || from;
      return {
        id: msg.id,
        from: fromName,
        email: fromEmail,
        subject,
        preview: detail.data.snippet || '',
        date: new Date(date).toISOString(),
        unread: detail.data.labelIds?.includes('UNREAD') || false,
        folder: 'all'
      };
    }));

    res.json({ emails, tokens: oauth2Client.credentials, nextPageToken });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
