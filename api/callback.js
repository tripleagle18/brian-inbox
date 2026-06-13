const { google } = require('googleapis');
module.exports = async (req, res) => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  const { code } = req.query;
  try {
    const { tokens } = await oauth2Client.getToken(code);
    const tokenData = encodeURIComponent(JSON.stringify(tokens));
    res.redirect(`/?tokens=${tokenData}`);
  } catch (err) {
    res.status(500).send('Auth failed: ' + err.message);
  }
};
