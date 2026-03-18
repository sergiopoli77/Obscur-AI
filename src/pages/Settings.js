import React, { useState } from "react";
import "../styles/Settings.css";

/* ================================================================
   COMPONENTS
   ================================================================ */

const SettingRow = ({ label, desc, children }) => (
  <div className="setting-row">
    <div className="setting-row-info">
      <span className="setting-row-label">{label}</span>
      {desc && <span className="setting-row-desc">{desc}</span>}
    </div>
    <div className="setting-row-action">{children}</div>
  </div>
);

const SettingSection = ({ title, children }) => (
  <div className="setting-section">
    <h2 className="setting-section-title">{title}</h2>
    <div className="setting-card">{children}</div>
  </div>
);


/* ================================================================
   PAGE — SETTINGS
   ================================================================ */
const Settings = () => {
  const [cleared, setCleared] = useState(false);
  const [copied, setCopied] = useState(false);

  const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";

  const handleClearAllData = () => {
    const keys = Object.keys(localStorage).filter((k) => k.startsWith("rag_"));
    keys.forEach((k) => localStorage.removeItem(k));
    setCleared(true);
    setTimeout(() => setCleared(false), 3000);
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(apiUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const totalSessions = () => {
    try {
      const raw = localStorage.getItem("rag_sessions");
      return raw ? JSON.parse(raw).length : 0;
    } catch { return 0; }
  };

  const totalMessages = () => {
    try {
      return Object.keys(localStorage)
        .filter((k) => k.startsWith("rag_messages_"))
        .reduce((acc, k) => {
          const msgs = JSON.parse(localStorage.getItem(k) || "[]");
          return acc + msgs.length;
        }, 0);
    } catch { return 0; }
  };

  return (
    <div className="settings-page">
      <div className="settings-container">

        {/* Header */}
        <div className="settings-header">
          <div className="settings-header-icon">⚙️</div>
          <div className="settings-header-text">
            <h1 className="settings-title">Settings</h1>
            <p className="settings-subtitle">Manage your app preferences and data</p>
          </div>
        </div>

        {/* Backend */}
        <SettingSection title="Backend">
          <SettingRow
            label="API Endpoint"
            desc={
              <>
                Set via <code>REACT_APP_API_URL</code> in your <code>.env</code> file
              </>
            }
          >
            <div className="setting-url-row">
              <span className="setting-url-value">{apiUrl}</span>
              <button
                className={`setting-btn-ghost ${copied ? "setting-btn-success" : ""}`}
                onClick={handleCopyUrl}
              >
                {copied ? "✓ Copied" : "Copy"}
              </button>
            </div>
          </SettingRow>
        </SettingSection>

        {/* Storage */}
        <SettingSection title="Storage">
          <SettingRow label="Sessions" desc="Total chat sessions stored in this browser">
            <span className="setting-stat">{totalSessions()}</span>
          </SettingRow>
          <SettingRow label="Messages" desc="Total messages across all sessions">
            <span className="setting-stat">{totalMessages()}</span>
          </SettingRow>
          <SettingRow
            label="Clear All Data"
            desc="Permanently removes all sessions, messages, and document records from this browser"
          >
            <button
              className={`setting-btn-danger ${cleared ? "setting-btn-cleared" : ""}`}
              onClick={handleClearAllData}
            >
              {cleared ? "✓ Cleared" : "Clear Data"}
            </button>
          </SettingRow>
        </SettingSection>

        {/* About */}
        <SettingSection title="About">
          <SettingRow label="App" desc="AI-powered PDF RAG Chatbot">
            <span className="setting-stat">Obscure AI</span>
          </SettingRow>
          <SettingRow label="Version">
            <span className="setting-version-badge">v1.0.0</span>
          </SettingRow>
          <SettingRow label="Storage type" desc="Chat history is stored locally in your browser">
            <span className="setting-stat">localStorage</span>
          </SettingRow>
        </SettingSection>

      </div>
    </div>
  );
};

export default Settings;