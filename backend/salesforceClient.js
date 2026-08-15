const axios = require("axios");

const API_VERSION = process.env.SF_API_VERSION || "v60.0";

/**
 * Refreshes the Salesforce access token using the stored refresh token.
 */
async function refreshAccessToken(refreshToken) {
  const params = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: process.env.SF_CLIENT_ID,
    client_secret: process.env.SF_CLIENT_SECRET,
    refresh_token: refreshToken,
  });

  const resp = await axios.post(`${process.env.SF_LOGIN_URL}/services/oauth2/token`, params.toString(), {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  return resp.data; // { access_token, instance_url, ... }
}

/**
 * Makes an authenticated call to the Salesforce REST API. Transparently
 * refreshes the access token once and retries if the first call gets a 401.
 */
async function sfRequest(req, res, { method, path, data, params }) {
  const auth = req.session.sfAuth;
  if (!auth) {
    const err = new Error("Not authenticated with Salesforce");
    err.status = 401;
    throw err;
  }

  const call = (accessToken, instanceUrl) =>
    axios({
      method,
      url: `${instanceUrl}/services/data/${API_VERSION}${path}`,
      data,
      params,
      headers: { Authorization: `Bearer ${accessToken}` },
      validateStatus: () => true,
    });

  let response = await call(auth.access_token, auth.instance_url);

  if (response.status === 401 && auth.refresh_token) {
    const refreshed = await refreshAccessToken(auth.refresh_token);
    req.session.sfAuth = {
      ...auth,
      access_token: refreshed.access_token,
      instance_url: refreshed.instance_url || auth.instance_url,
    };
    response = await call(req.session.sfAuth.access_token, req.session.sfAuth.instance_url);
  }

  if (response.status >= 400) {
    const err = new Error(
      Array.isArray(response.data) && response.data[0]
        ? `${response.data[0].errorCode}: ${response.data[0].message}`
        : `Salesforce API error (status ${response.status})`
    );
    err.status = response.status;
    err.details = response.data;
    throw err;
  }

  return response.data;
}

module.exports = { sfRequest, refreshAccessToken, API_VERSION };
