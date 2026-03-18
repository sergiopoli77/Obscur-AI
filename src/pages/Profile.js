import React, { useState } from "react";
import "../styles/Profile.css";

/* ================================================================
   COMPONENTS
   ================================================================ */

const ProfileRow = ({ label, value, placeholder }) => (
  <div className="profile-row">
    <span className="profile-row-label">{label}</span>
    <span className={`profile-row-value ${placeholder ? "profile-row-placeholder" : ""}`}>
      {value}
    </span>
  </div>
);

const ProfileSection = ({ title, children }) => (
  <div className="profile-section">
    <h2 className="profile-section-title">{title}</h2>
    <div className="profile-card">{children}</div>
  </div>
);


/* ================================================================
   PAGE — PROFILE
   ================================================================ */
const Profile = () => {
  const [initials] = useState("U");

  const memberSince = new Date().toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });

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

  const totalDocuments = () => {
    try {
      return Object.keys(localStorage)
        .filter((k) => k.startsWith("rag_documents_"))
        .reduce((acc, k) => {
          const docs = JSON.parse(localStorage.getItem(k) || "[]");
          return acc + docs.length;
        }, 0);
    } catch { return 0; }
  };

  return (
    <div className="profile-page">
      <div className="profile-container">

        {/* Header */}
        <div className="profile-header">
          <h1 className="profile-title">Profile</h1>
          <p className="profile-subtitle">Your account information</p>
        </div>

        {/* Avatar + Name */}
        <div className="profile-hero">
          <div className="profile-avatar">
            <span className="profile-avatar-initials">{initials}</span>
            <div className="profile-avatar-ring" />
          </div>
          <div className="profile-hero-info">
            <span className="profile-hero-name">User</span>
            <span className="profile-hero-role">Obscure AI Member</span>
          </div>
        </div>

        {/* Stats */}
        <div className="profile-stats">
          <div className="profile-stat-item">
            <span className="profile-stat-number">{totalSessions()}</span>
            <span className="profile-stat-label">Sessions</span>
          </div>
          <div className="profile-stat-divider" />
          <div className="profile-stat-item">
            <span className="profile-stat-number">{totalMessages()}</span>
            <span className="profile-stat-label">Messages</span>
          </div>
          <div className="profile-stat-divider" />
          <div className="profile-stat-item">
            <span className="profile-stat-number">{totalDocuments()}</span>
            <span className="profile-stat-label">Documents</span>
          </div>
        </div>

        {/* Account Info */}
        <ProfileSection title="Account">
          <ProfileRow label="Name" value="— Coming soon" placeholder />
          <ProfileRow label="Email" value="— Coming soon" placeholder />
          <ProfileRow label="Member since" value={memberSince} />
        </ProfileSection>

        {/* Preferences */}
        <ProfileSection title="Preferences">
          <ProfileRow label="Language" value="Bahasa Indonesia / English" />
          <ProfileRow label="Storage" value="localStorage (browser)" />
        </ProfileSection>

        {/* Coming Soon Banner */}
        <div className="profile-coming-soon">
          <span className="coming-soon-icon">🔒</span>
          <div className="coming-soon-text">
            <span className="coming-soon-title">Authentication coming soon</span>
            <span className="coming-soon-desc">
              Login, profile editing, and cloud sync will be available in the next version.
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Profile;