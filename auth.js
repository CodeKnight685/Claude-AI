// src/auth.js
// Manages Zoho OAuth2 access tokens using the refresh token grant

import axios from "axios";

const REGION = process.env.ZOHO_REGION || "com";
const TOKEN_URL = `https://accounts.zoho.${REGION}/oauth/v2/token`;

let cachedToken = null;
let tokenExpiresAt = 0;

/**
 * Returns a valid access token, refreshing if needed.
 */
export async function getAccessToken() {
  const now = Date.now();

  // Return cached token if still valid (with 60s buffer)
  if (cachedToken && now < tokenExpiresAt - 60_000) {
    return cachedToken;
  }

  const { ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, ZOHO_REFRESH_TOKEN } = process.env;

  if (!ZOHO_CLIENT_ID || !ZOHO_CLIENT_SECRET || !ZOHO_REFRESH_TOKEN) {
    throw new Error(
      "Missing Zoho credentials. Set ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, and ZOHO_REFRESH_TOKEN in your .env file."
    );
  }

  const params = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: ZOHO_CLIENT_ID,
    client_secret: ZOHO_CLIENT_SECRET,
    refresh_token: ZOHO_REFRESH_TOKEN,
  });

  try {
    const response = await axios.post(TOKEN_URL, params.toString(), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    const { access_token, expires_in } = response.data;

    if (!access_token) {
      throw new Error(`Token refresh failed: ${JSON.stringify(response.data)}`);
    }

    cachedToken = access_token;
    tokenExpiresAt = now + expires_in * 1000;

    return cachedToken;
  } catch (err) {
    const msg = err.response?.data
      ? JSON.stringify(err.response.data)
      : err.message;
    throw new Error(`Failed to refresh Zoho access token: ${msg}`);
  }
}
