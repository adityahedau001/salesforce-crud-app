import React from "react";
import { api } from "../api";

export default function Login({ authError }) {
  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-eyebrow">SALESFORCE OBJECT CONSOLE</div>
        <h1>Read, write, and clean up records without leaving this tab.</h1>
        <p className="login-copy">
          Connect a Salesforce org to browse Accounts, Opportunities, Leads, Contacts, and Cases,
          and create, edit, or delete them directly through the REST API.
        </p>
        {authError && <div className="login-error">Connection failed: {authError}</div>}
        <a className="btn btn-primary btn-login" href={api.loginUrl()}>
          <span className="dot" /> Log in with Salesforce
        </a>
        <div className="login-footnote">OAuth 2.0 Web Server Flow · tokens never touch the browser</div>
      </div>
    </div>
  );
}
