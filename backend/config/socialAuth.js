const { OAuth2Client } = require('google-auth-library');
const axios = require('axios');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Verify a Google ID token and return the user profile payload.
 */
const verifyGoogleToken = async (credential) => {
  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  return ticket.getPayload();
};

/**
 * Verify a Facebook access token and return the user profile.
 */
const verifyFacebookToken = async (accessToken) => {
  // Verify the token against Facebook Graph API
  const appSecretProof = require('crypto')
    .createHmac('sha256', process.env.FACEBOOK_APP_SECRET)
    .update(accessToken)
    .digest('hex');

  const { data } = await axios.get('https://graph.facebook.com/me', {
    params: {
      fields: 'id,name,email,picture',
      access_token: accessToken,
      appsecret_proof: appSecretProof,
    }
  });
  return data;
};

module.exports = { verifyGoogleToken, verifyFacebookToken };
