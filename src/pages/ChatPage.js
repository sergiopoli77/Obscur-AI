import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import ReactMarkdown from "react-markdown";
import "../styles/Chatpage.css";

/* ================================================================
   API SERVICE
   ================================================================ */
const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
const TIMEOUT_MS = 30000;

const fetchWithTimeout = (url, options = {}) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  return fetch(url, { ...options, signal: controller.signal }).finally(() =>
    clearTimeout(timer)
  );
};

const apiUploadPDFs = async (files) => {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/api/upload`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Upload failed (${res.status})`);
    }
    return await res.json();
  } catch (error) {
    if (error.name === "AbortError") throw new Error("Upload timed out. Please try again.");
    throw new Error(error.message || "Failed to upload file.");
  }
};

const apiAskQuestion = async (question, sessionId) => {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/api/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, sessionId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Request failed (${res.status})`);
    }
    return await res.json();
  } catch (error) {
    if (error.name === "AbortError") throw new Error("Request timed out. Please try again.");
    throw new Error(error.message || "Failed to get a response.");
  }
};


/* ================================================================
   HOOKS
   ================================================================ */
const SESSIONS_KEY = "rag_sessions";
const ACTIVE_SESSION_KEY = "rag_active_session";
const MESSAGES_KEY = (id) => `rag_messages_${id}`;
const DOCUMENTS_KEY = (id) => `rag_documents_${id}`;

const genId = (prefix) =>
  `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

const lsGet = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const lsSet = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    console.warn("localStorage write failed:", key);
  }
};

// useSession
const useSession = () => {
  const [sessions, setSessions] = useState(() => lsGet(SESSIONS_KEY, []));
  const [sessionId, setSessionId] = useState(() => {
    const saved = localStorage.getItem(ACTIVE_SESSION_KEY);
    if (saved) return saved;
    const existing = lsGet(SESSIONS_KEY, []);
    if (existing.length > 0) return existing[existing.length - 1].id;
    const newId = genId("sess");
    const newSession = { id: newId, title: "New Chat", createdAt: Date.now() };
    lsSet(SESSIONS_KEY, [newSession]);
    return newId;
  });

  useEffect(() => {
    if (sessionId) localStorage.setItem(ACTIVE_SESSION_KEY, sessionId);
  }, [sessionId]);

  const createNewSession = useCallback(() => {
    const newId = genId("sess");
    const newSession = { id: newId, title: "New Chat", createdAt: Date.now() };
    setSessions((prev) => {
      const updated = [...prev, newSession];
      lsSet(SESSIONS_KEY, updated);
      return updated;
    });
    setSessionId(newId);
  }, []);

  const switchSession = useCallback((id) => setSessionId(id), []);

  const updateSessionTitle = useCallback((id, title) => {
    setSessions((prev) => {
      const updated = prev.map((s) => (s.id === id ? { ...s, title } : s));
      lsSet(SESSIONS_KEY, updated);
      return updated;
    });
  }, []);

  return {
    sessionId,
    sessions,
    activeSession: sessions.find((s) => s.id === sessionId) || null,
    createNewSession,
    switchSession,
    updateSessionTitle,
  };
};

// useChat
const useChat = (sessionId, updateSessionTitle) => {
  const [messages, setMessages] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [askError, setAskError] = useState(null);

  useEffect(() => {
    if (!sessionId) return;
    setMessages(lsGet(MESSAGES_KEY(sessionId), []));
    setDocuments(lsGet(DOCUMENTS_KEY(sessionId), []));
    setUploadError(null);
    setAskError(null);
  }, [sessionId]);

  const uploadDocuments = useCallback(
    async (files) => {
      if (!files || files.length === 0) return;
      const invalid = files.filter((f) => f.type !== "application/pdf");
      if (invalid.length > 0) {
        setUploadError("Only PDF files are supported.");
        return;
      }
      setIsUploading(true);
      setUploadError(null);
      try {
        await apiUploadPDFs(files);
        const newDocs = files.map((f) => ({
          id: genId("doc"),
          name: f.name,
          size: f.size,
          uploadedAt: Date.now(),
        }));
        setDocuments((prev) => {
          const updated = [...prev, ...newDocs];
          lsSet(DOCUMENTS_KEY(sessionId), updated);
          return updated;
        });
      } catch (error) {
        setUploadError(error.message || "Failed to upload file. Please try again.");
      } finally {
        setIsUploading(false);
      }
    },
    [sessionId]
  );

  const sendMessage = useCallback(
    async (question) => {
      if (!question.trim() || isThinking) return;
      const userMsg = {
        id: genId("msg"),
        role: "user",
        content: question,
        timestamp: Date.now(),
      };
      setMessages((prev) => {
        const updated = [...prev, userMsg];
        lsSet(MESSAGES_KEY(sessionId), updated);
        // Auto-title session from first message
        if (prev.length === 0) {
          updateSessionTitle(sessionId, question.slice(0, 40));
        }
        return updated;
      });
      setIsThinking(true);
      setAskError(null);
      try {
        const data = await apiAskQuestion(question, sessionId);
        const aiMsg = {
          id: genId("msg"),
          role: "assistant",
          content: data.answer || "No response received.",
          sources: data.sources || [],
          timestamp: Date.now(),
        };
        setMessages((prev) => {
          const updated = [...prev, aiMsg];
          lsSet(MESSAGES_KEY(sessionId), updated);
          return updated;
        });
      } catch (error) {
        setAskError(error.message || "Something went wrong. Please try again.");
      } finally {
        setIsThinking(false);
      }
    },
    [sessionId, isThinking, updateSessionTitle]
  );

  const clearErrors = useCallback(() => {
    setUploadError(null);
    setAskError(null);
  }, []);

  return {
    messages,
    documents,
    isUploading,
    isThinking,
    uploadError,
    askError,
    uploadDocuments,
    sendMessage,
    clearErrors,
  };
};


/* ================================================================
   COMPONENTS — UI
   ================================================================ */

// LoadingDots
const LoadingDots = () => (
  <div className="loading-dots">
    <span className="dot dot-1" />
    <span className="dot dot-2" />
    <span className="dot dot-3" />
  </div>
);

// ErrorToast
const ErrorToast = ({ message, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [message, onDismiss]);

  return (
    <div className="error-toast">
      <span className="error-toast-icon">⚠</span>
      <span className="error-toast-message">{message}</span>
      <button className="error-toast-dismiss" onClick={onDismiss}>✕</button>
    </div>
  );
};


/* ================================================================
   COMPONENTS — SIDEBAR
   ================================================================ */

// UploadZone
const UploadZone = ({ isUploading, uploadError, onUploadClick, onClearError }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).filter(
      (f) => f.type === "application/pdf"
    );
    if (files.length > 0) onUploadClick(files);
  };

  return (
    <div className="upload-zone-wrapper">
      <div
        className={`upload-zone ${isDragging ? "upload-zone-dragging" : ""} ${isUploading ? "upload-zone-loading" : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={!isUploading ? onUploadClick : undefined}
      >
        {isUploading ? (
          <div className="upload-loading">
            <div className="upload-spinner" />
            <span className="upload-loading-text">Uploading...</span>
          </div>
        ) : (
          <>
            <span className="upload-icon">⬆</span>
            <span className="upload-label">Upload PDF</span>
            <span className="upload-hint">Click or drag & drop</span>
          </>
        )}
      </div>
      {uploadError && (
        <div className="upload-error">
          <span className="upload-error-text">{uploadError}</span>
          <button className="upload-error-dismiss" onClick={onClearError}>✕</button>
        </div>
      )}
    </div>
  );
};

// DocumentList
const DocumentList = ({ documents }) => (
  <div className="document-list">
    <span className="document-list-label">Uploaded Files</span>
    <ul className="document-items">
      {documents.map((doc, i) => (
        <li key={doc.id || i} className="document-item">
          <span className="document-item-icon">📄</span>
          <div className="document-item-info">
            <span className="document-item-name">
              {doc.name.length > 22 ? doc.name.slice(0, 22) + "…" : doc.name}
            </span>
            <span className="document-item-size">
              {doc.size ? (doc.size / 1024).toFixed(0) + " KB" : "PDF"}
            </span>
          </div>
          <span className="document-item-status">✓</span>
        </li>
      ))}
    </ul>
  </div>
);

// Sidebar
const NAV_ITEMS = [
  { id: "chat",      label: "Chat",      icon: "💬" },
  { id: "documents", label: "Documents", icon: "📁" },
];

const Sidebar = ({
  open,
  activeMenu,
  onMenuChange,
  sessions,
  sessionId,
  documents,
  isUploading,
  uploadError,
  onNewChat,
  onSwitchSession,
  onUpload,
  onClearError,
  onClose,
  onLogout,
  isLoggingOut,
}) => {
  const fileInputRef = useRef(null);
  const activeSession = sessions.find((s) => s.id === sessionId);

  const formatSessionDate = (timestamp) => {
    const date = timestamp ? new Date(timestamp) : new Date();
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
    });
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) { onUpload(files); e.target.value = ""; }
  };

  if (!open) return null;

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <span className="logo-icon">◈</span>
          <span className="logo-text">Obscure AI</span>
        </div>
        <button className="sidebar-close-btn" onClick={onClose} aria-label="Close sidebar">
          ✕
        </button>
      </div>

      {/* New Chat */}
      <div className="sidebar-new-chat">
        <button className="new-chat-btn" onClick={onNewChat}>
          <span className="new-chat-icon">+</span>
          <span className="new-chat-label">New Chat</span>
        </button>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${activeMenu === item.id ? "nav-item-active" : ""}`}
            onClick={() => onMenuChange(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
            {item.id === "documents" && documents.length > 0 && (
              <span className="nav-badge">{documents.length}</span>
            )}
          </button>
        ))}
      </nav>

      {/* Panel */}
      <div className="sidebar-panel">
        {/* Documents */}
        {activeMenu === "documents" && (
          <div className="panel documents-panel">
            <div className="panel-header">
              <span className="panel-title">Documents</span>
            </div>
            <UploadZone
              isUploading={isUploading}
              uploadError={uploadError}
              onUploadClick={() => fileInputRef.current?.click()}
              onClearError={onClearError}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              multiple
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
            {documents.length > 0 && <DocumentList documents={documents} />}
          </div>
        )}

        {/* Chat overview */}
        {activeMenu === "chat" && (
          <div className="panel chat-panel">
            <div className="panel-header">
              <span className="panel-title">Chat History</span>
            </div>
            <ul className="history-list">
              <li>
                <button
                  className="history-item history-item-active"
                  onClick={() => sessionId && onSwitchSession(sessionId)}
                >
                  <span className="history-item-title">
                    {activeSession?.title || "New Chat"}
                  </span>
                  <span className="history-item-date">
                    {formatSessionDate(activeSession?.createdAt)}
                  </span>
                </button>
              </li>
            </ul>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="sidebar-footer">
        <button
          className={`sidebar-logout-btn ${isLoggingOut ? "sidebar-logout-loading" : ""}`}
          type="button"
          onClick={onLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut && <span className="logout-spinner" aria-hidden="true" />}
          <span>{isLoggingOut ? "Logging out..." : "Logout"}</span>
        </button>
      </div>
    </aside>
  );
};


/* ================================================================
   COMPONENTS — CHAT
   ================================================================ */

// EmptyState
const EmptyState = ({ hasDocuments, onUploadPrompt }) => (
  <div className="empty-state">
    <div className="empty-state-icon">◈</div>
    {hasDocuments ? (
      <>
        <h2 className="empty-state-title">Ready to explore your document</h2>
        <p className="empty-state-desc">
          Ask anything about the content of your uploaded PDF.
        </p>
        <ul className="empty-state-suggestions">
          <li>"Summarize this document for me"</li>
          <li>"What are the key points?"</li>
          <li>"Explain the section about…"</li>
        </ul>
      </>
    ) : (
      <>
        <h2 className="empty-state-title">No document uploaded yet</h2>
        <p className="empty-state-desc">
          Upload a PDF to start asking questions about its content.
        </p>
        <button className="empty-state-upload-btn" onClick={onUploadPrompt}>
          <span>📁</span>
          <span>Upload a PDF</span>
        </button>
      </>
    )}
  </div>
);

// MessageBubble
const MessageBubble = ({ message }) => {
  const [showSources, setShowSources] = useState(false);
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const formatTime = (ts) =>
    ts ? new Date(ts).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "";

  return (
    <div className={`message-bubble-wrapper ${isUser ? "message-user" : "message-ai"}`}>
      {!isUser && <div className="message-avatar ai-avatar">AI</div>}

      <div className="message-bubble">
        <div className="message-content">
          {isUser ? (
            <p className="message-text">{message.content}</p>
          ) : (
            <div className="message-markdown">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          )}
        </div>

        <div className="message-meta">
          <span className="message-time">{formatTime(message.timestamp)}</span>
          {!isUser && (
            <button
              className={`copy-btn ${copied ? "copy-btn-success" : ""}`}
              onClick={handleCopy}
            >
              {copied ? "✓ Copied" : "Copy"}
            </button>
          )}
        </div>

        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="message-sources">
            <button className="sources-toggle" onClick={() => setShowSources((p) => !p)}>
              <span className="sources-toggle-icon">{showSources ? "▾" : "▸"}</span>
              <span>{showSources ? "Hide sources" : `${message.sources.length} source${message.sources.length > 1 ? "s" : ""}`}</span>
            </button>
            {showSources && (
              <ul className="sources-list">
                {message.sources.map((src, i) => (
                  <li key={i} className="source-tag">
                    <span className="source-icon">📄</span>
                    <span className="source-text">{src}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {isUser && <div className="message-avatar user-avatar">You</div>}
    </div>
  );
};

// ChatInput
const ChatInput = ({ onSend, disabled, placeholder }) => {
  const [value, setValue] = useState("");
  const textareaRef = useRef(null);

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }, [value, disabled, onSend]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleChange = (e) => {
    setValue(e.target.value);
    const ta = textareaRef.current;
    if (ta) { ta.style.height = "auto"; ta.style.height = Math.min(ta.scrollHeight, 160) + "px"; }
  };

  return (
    <div className={`chat-input ${disabled ? "chat-input-disabled" : ""}`}>
      <textarea
        ref={textareaRef}
        className="chat-input-textarea"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
      />
      <button
        className="chat-send-btn"
        onClick={handleSend}
        disabled={disabled || !value.trim()}
        aria-label="Send message"
      >
        <span className="send-icon">↑</span>
      </button>
    </div>
  );
};

// ChatArea
const ChatArea = ({ messages, isThinking, askError, hasDocuments, onSendMessage, onClearError, onUploadPrompt }) => {
  const bottomRef = useRef(null);
  const scrollRef = useRef(null);
  const [userScrolledUp, setUserScrolledUp] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  useEffect(() => {
    if (!userScrolledUp) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking, userScrolledUp]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const fromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (fromBottom > 100) { setUserScrolledUp(true); setShowScrollBtn(true); }
    else { setUserScrolledUp(false); setShowScrollBtn(false); }
  };

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    setUserScrolledUp(false);
    setShowScrollBtn(false);
  };

  return (
    <div className="chat-area">
      {askError && <ErrorToast message={askError} onDismiss={onClearError} />}

      <div className="chat-messages" ref={scrollRef} onScroll={handleScroll}>
        {messages.length === 0 ? (
          <EmptyState hasDocuments={hasDocuments} onUploadPrompt={onUploadPrompt} />
        ) : (
          <>
            {messages.map((msg, i) => (
              <MessageBubble key={msg.id || i} message={msg} />
            ))}
            {isThinking && (
              <div className="chat-thinking">
                <div className="thinking-avatar">AI</div>
                <LoadingDots />
              </div>
            )}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {showScrollBtn && (
        <button className="scroll-to-bottom-btn" onClick={scrollToBottom}>↓</button>
      )}

      <div className="chat-input-wrapper">
        <ChatInput
          onSend={onSendMessage}
          disabled={isThinking || !hasDocuments}
          placeholder={
            !hasDocuments
              ? "Upload a PDF first to start chatting…"
              : "Ask something about your document…"
          }
        />
      </div>
    </div>
  );
};


/* ================================================================
   PAGE — CHATPAGE
   ================================================================ */
const ChatPage = ({ onLogout }) => {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth > 768);
  const [activeMenu, setActiveMenu] = useState("chat");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const quickUploadInputRef = useRef(null);

  const { sessionId, sessions, createNewSession, switchSession, updateSessionTitle } = useSession();
  const { messages, documents, isUploading, isThinking, uploadError, askError, uploadDocuments, sendMessage, clearErrors } = useChat(sessionId, updateSessionTitle);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      setSidebarOpen(!mobile);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const goToPage = useCallback((page) => {
    const targetPath = `/${page}`;
    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, "", targetPath);
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  }, []);

  const handleMenuChange = useCallback((menuId) => {
    setActiveMenu(menuId);
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [isMobile]);

  const handleNewChat = useCallback(() => {
    createNewSession();
    setActiveMenu("chat");
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [createNewSession, isMobile]);

  const handleSwitchSession = useCallback((id) => {
    switchSession(id);
    setActiveMenu("chat");
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [switchSession, isMobile]);

  const handleQuickUploadChange = useCallback((e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      uploadDocuments(files);
    }
    e.target.value = "";
  }, [uploadDocuments]);

  const handleLogout = useCallback(async () => {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);
    try {
      // Keep a brief visible loading state so users notice logout is in progress.
      await new Promise((resolve) => setTimeout(resolve, 850));
      await onLogout?.();
    } catch (error) {
      console.error("Logout failed:", error);
      setIsLoggingOut(false);
    }
  }, [isLoggingOut, onLogout]);

  return (
    <div className={`chat-page ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
      {isMobile && sidebarOpen && (
        <button
          className="sidebar-backdrop"
          aria-label="Close sidebar backdrop"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar
        open={sidebarOpen}
        activeMenu={activeMenu}
        onMenuChange={handleMenuChange}
        sessions={sessions}
        sessionId={sessionId}
        documents={documents}
        isUploading={isUploading}
        uploadError={uploadError}
        onNewChat={handleNewChat}
        onSwitchSession={handleSwitchSession}
        onUpload={uploadDocuments}
        onClearError={clearErrors}
        onClose={() => setSidebarOpen(false)}
        onLogout={handleLogout}
        isLoggingOut={isLoggingOut}
      />

      <div className="chat-main">
        <div className="chat-topbar">
          <button
            className="topbar-toggle-btn"
            onClick={() => setSidebarOpen((p) => !p)}
            aria-label="Toggle sidebar"
          >
            <svg
              className="toggle-icon-svg"
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden="true"
            >
              <path
                className="toggle-icon-path"
                d={sidebarOpen ? "M12.5 5.5L8 10L12.5 14.5" : "M7.5 5.5L12 10L7.5 14.5"}
              />
            </svg>
          </button>

          <div className="topbar-doc-info">
            {documents.length > 0 && (
              <div className="topbar-docs-badge">
                <span className="docs-icon">📄</span>
                <span className="docs-count">
                  {documents.length} document{documents.length > 1 ? "s" : ""} active
                </span>
              </div>
            )}
          </div>

          <div className="topbar-session-info">
            <span className="session-label">Session</span>
            <span className="session-id">{sessionId ? sessionId.slice(0, 12) + "…" : "—"}</span>
          </div>

          <div className="topbar-mobile-actions">
            <button
              type="button"
              className="topbar-action-btn"
              aria-label="Go to profile"
              onClick={() => goToPage("profile")}
            >
              <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M10 10a3.25 3.25 0 1 0 0-6.5 3.25 3.25 0 0 0 0 6.5Z" />
                <path d="M4.5 16.5a5.5 5.5 0 0 1 11 0" />
              </svg>
            </button>

            <button
              type="button"
              className="topbar-action-btn"
              aria-label="Go to settings"
              onClick={() => goToPage("settings")}
            >
              <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
                <path d="m16.25 10-.9-.52a5.76 5.76 0 0 0-.18-.43l.26-1.01-1.33-1.33-1.01.26c-.14-.07-.29-.13-.43-.18L12.14 6h-1.88l-.52.9c-.14.05-.29.11-.43.18l-1.01-.26-1.33 1.33.26 1.01c-.07.14-.13.29-.18.43L6 10v1.88l.9.52c.05.14.11.29.18.43l-.26 1.01 1.33 1.33 1.01-.26c.14.07.29.13.43.18l.52.9h1.88l.52-.9c.14-.05.29-.11.43-.18l1.01.26 1.33-1.33-.26-1.01c.07-.14.13-.29.18-.43l.9-.52V10Z" />
              </svg>
            </button>
          </div>
        </div>

        <ChatArea
          messages={messages}
          isThinking={isThinking}
          askError={askError}
          hasDocuments={documents.length > 0}
          onSendMessage={sendMessage}
          onClearError={clearErrors}
          onUploadPrompt={() => quickUploadInputRef.current?.click()}
        />

        <input
          ref={quickUploadInputRef}
          type="file"
          accept=".pdf"
          multiple
          style={{ display: "none" }}
          onChange={handleQuickUploadChange}
        />
      </div>
    </div>
  );
};

export default ChatPage;