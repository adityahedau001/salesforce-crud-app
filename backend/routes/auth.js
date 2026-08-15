const express = require("express");
const axios = require("axios");
const crypto = require("crypto");

const router = express.Router();

// Step 1: send the user to Salesforce's OAuth 2.0 authorize page.
router.get("/login", (req, res) => {
  const state = crypto.randomBytes(16).toString("hex");
  req.session.oauthState = state;

  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.SF_CLIENT_ID,
    redirect_uri: process.env.SF_REDIRECT_URI,
    scope: "api refresh_token",
    state,
  });

  res.redirect(`${process.env.SF_LOGIN_URL}/services/oauth2/authorize?${params.toString()}`);
});

// Step 2: Salesforce redirects back here with an authorization code.
router.get("/callback", async (req, res) => {
  const { code, state, error, error_description } = req.query;

  if (error) {
    return res.redirect(`${process.env.FRONTEND_URL}?authError=${encodeURIComponent(error_description || error)}`);
  }

  if (!state || state !== req.session.oauthState) {
    return res.redirect(`${process.env.FRONTEND_URL}?authError=invalid_state`);
  }

  try {
    const params = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: process.env.SF_CLIENT_ID,
      client_secret: process.env.SF_CLIENT_SECRET,
      redirect_uri: process.env.SF_REDIRECT_URI,
    });

    const tokenResp = await axios.post(`${process.env.SF_LOGIN_URL}/services/oauth2/token`, params.toString(), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    const { access_token, refresh_token, instance_url, id } = tokenResp.data;

    // Fetch basic user info to show who's logged in.
    let userInfo = null;
    try {
      const identity = await axios.get(id, { headers: { Authorization: `Bearer ${access_token}` } });
      userInfo = { name: identity.data.display_name, email: identity.data.email, org: identity.data.organization_id };
    } catch (_) {
      // Non-fatal, identity info is a nice-to-have.
    }

    req.session.sfAuth = { access_token, refresh_token, instance_url };
    req.session.sfUser = userInfo;
    delete req.session.oauthState;

    res.redirect(process.env.FRONTEND_URL);
  } catch (err) {
    console.error("OAuth callback error:", err.response?.data || err.message);
    res.redirect(`${process.env.FRONTEND_URL}?authError=token_exchange_failed`);
  }
});

router.get("/status", (req, res) => {
  if (req.session.sfAuth) {
    res.json({ loggedIn: true, user: req.session.sfUser || null });
  } else {
    res.json({ loggedIn: false });
  }
});

router.post("/logout", (req, res) => {
  req.session = null;
  res.json({ loggedOut: true });
});

module.exports = router;
