import React, { useEffect, useState } from "react";
import "./App.css";
import ChatPage from "./pages/ChatPage";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import LandingPage from "./pages/Landingpage";

const VALID_PAGES = ["chat", "profile", "settings"];
const ROOT_PATH = "/";
const LOGIN_PATH = "/Login";
const CHAT_PATH = "/Chat";
const AUTH_STORAGE_KEY = "rag_is_authenticated";

const normalizePath = (path) => {
  const lower = (path || "/").toLowerCase();
  const noTrailingSlash = lower.replace(/\/+$/, "");
  return noTrailingSlash || "/";
};

const getPageFromPath = (path) => {
  const normalized = normalizePath(path);
  const slug = normalized.replace("/", "");
  return VALID_PAGES.includes(slug) ? slug : null;
};

const getPathForPage = (page) => (page === "chat" ? CHAT_PATH : `/${page}`);

function App() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);
  const [currentPath, setCurrentPath] = useState(() => normalizePath(window.location.pathname));
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => localStorage.getItem(AUTH_STORAGE_KEY) === "true"
  );

  useEffect(() => {
    const handlePopState = () => setCurrentPath(normalizePath(window.location.pathname));
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const normalized = normalizePath(currentPath);
    const normalizedRoot = normalizePath(ROOT_PATH);
    const normalizedLogin = normalizePath(LOGIN_PATH);

    if (!isAuthenticated) {
      if (normalized !== normalizedRoot && normalized !== normalizedLogin) {
        window.history.replaceState({}, "", LOGIN_PATH);
        setCurrentPath(normalizedLogin);
      }
      return;
    }

    if (normalized === normalizedLogin) {
      window.history.replaceState({}, "", CHAT_PATH);
      setCurrentPath(normalizePath(CHAT_PATH));
      return;
    }

    if (normalized === normalizedRoot) {
      return;
    }

    if (!getPageFromPath(normalized)) {
      window.history.replaceState({}, "", CHAT_PATH);
      setCurrentPath(normalizePath(CHAT_PATH));
    }
  }, [currentPath, isAuthenticated]);

  const goToPage = (page) => {
    const targetPath = getPathForPage(page);
    const normalizedTarget = normalizePath(targetPath);

    if (normalizePath(window.location.pathname) === normalizedTarget) {
      return;
    }

    window.history.pushState({}, "", targetPath);
    setCurrentPath(normalizedTarget);
  };

  const goToLogin = () => {
    const normalizedLogin = normalizePath(LOGIN_PATH);
    if (normalizePath(window.location.pathname) === normalizedLogin) {
      return;
    }

    window.history.pushState({}, "", LOGIN_PATH);
    setCurrentPath(normalizedLogin);
  };

  const handleLoginSuccess = () => {
    localStorage.setItem(AUTH_STORAGE_KEY, "true");
    setIsAuthenticated(true);
    window.history.replaceState({}, "", CHAT_PATH);
    setCurrentPath(normalizePath(CHAT_PATH));
  };

  const handleLogout = async () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setIsAuthenticated(false);
    window.history.replaceState({}, "", LOGIN_PATH);
    setCurrentPath(normalizePath(LOGIN_PATH));
  };

  const normalizedPath = normalizePath(currentPath);

  if (normalizedPath === normalizePath(ROOT_PATH)) {
    return (
      <div className="app-shell">
        <LandingPage onLoginClick={goToLogin} />
      </div>
    );
  }

  const activePage = getPageFromPath(normalizedPath) || "chat";
  const showPageSwitcher = isAuthenticated && (!isMobile || activePage !== "chat");

  if (!isAuthenticated) {
    return (
      <div className="app-shell">
        <Login onLoginSuccess={handleLoginSuccess} />
      </div>
    );
  }

  return (
    <div className="app-shell">
      {showPageSwitcher && (
        <div className="app-page-switcher" role="navigation" aria-label="Page navigation">
          <button
            className={`app-page-btn ${activePage === "chat" ? "app-page-btn-active" : ""}`}
            onClick={() => goToPage("chat")}
          >
            Chat
          </button>
          <button
            className={`app-page-btn ${activePage === "profile" ? "app-page-btn-active" : ""}`}
            onClick={() => goToPage("profile")}
          >
            Profile
          </button>
          <button
            className={`app-page-btn ${activePage === "settings" ? "app-page-btn-active" : ""}`}
            onClick={() => goToPage("settings")}
          >
            Settings
          </button>
        </div>
      )}

      {activePage === "chat" && <ChatPage onLogout={handleLogout} />}
      {activePage === "profile" && <Profile />}
      {activePage === "settings" && <Settings />}
    </div>
  );
}

export default App;
