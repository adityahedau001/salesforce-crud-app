import React, { useEffect, useState } from "react";
import { api } from "./api";
import Login from "./components/Login";
import ObjectSelector from "./components/ObjectSelector";
import RecordTable from "./components/RecordTable";

export default function App() {
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState(null);
  const [object, setObject] = useState("Account");
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("authError")) {
      setAuthError(params.get("authError"));
      window.history.replaceState({}, "", window.location.pathname);
    }

    api
      .authStatus()
      .then((data) => setUser(data.loggedIn ? data.user || { name: "Salesforce user" } : null))
      .finally(() => setChecking(false));
  }, []);

  const handleLogout = async () => {
    await api.logout();
    setUser(null);
  };

  if (checking) {
    return <div className="splash">Checking session…</div>;
  }

  if (!user) {
    return <Login authError={authError} />;
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <span className="brand-mark" />
          Salesforce Object Console
        </div>
        <div className="header-controls">
          <ObjectSelector value={object} onChange={setObject} />
          <div className="user-chip">
            <span>{user.name}</span>
            <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
              Log out
            </button>
          </div>
        </div>
      </header>

      <main>
        <RecordTable object={object} />
      </main>
    </div>
  );
}
