const { OAuth2Client } = require('google-auth-library');
const axios = require('axios');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Verify a Google ID token and return the user profile payload.
 */
const verifyGoogleToken = async (credential) => {
  try {
    // Attempt 1: Try treating it as an access_token (from useGoogleLogin)
    const { data } = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${credential}` }
    });
    // Map the response fields to match the id_token payload format
    return {
      sub: data.sub,
      name: data.name,
      email: data.email,
      picture: data.picture,
    };
  } catch (err) {
    // Attempt 2: Fallback to verifyIdToken if it's an id_token (from GoogleLogin component)
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    return ticket.getPayload();
  }
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
