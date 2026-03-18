import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "rag_sessions";
const ACTIVE_SESSION_KEY = "rag_active_session";

const generateId = () => {
  return "sess_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 7);
};

const loadSessions = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveSessions = (sessions) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch {
    console.warn("Failed to save sessions to localStorage");
  }
};

export const useSession = () => {
  const [sessions, setSessions] = useState(() => loadSessions());
  const [sessionId, setSessionId] = useState(() => {
    const saved = localStorage.getItem(ACTIVE_SESSION_KEY);
    if (saved) return saved;

    const existing = loadSessions();
    if (existing.length > 0) return existing[existing.length - 1].id;

    const newId = generateId();
    const newSession = {
      id: newId,
      title: "New Chat",
      createdAt: Date.now(),
    };
    saveSessions([newSession]);
    return newId;
  });

  useEffect(() => {
    if (sessionId) {
      localStorage.setItem(ACTIVE_SESSION_KEY, sessionId);
    }
  }, [sessionId]);

  const createNewSession = useCallback(() => {
    const newId = generateId();
    const newSession = {
      id: newId,
      title: "New Chat",
      createdAt: Date.now(),
    };
    setSessions((prev) => {
      const updated = [...prev, newSession];
      saveSessions(updated);
      return updated;
    });
    setSessionId(newId);
  }, []);

  const switchSession = useCallback((id) => {
    setSessionId(id);
  }, []);

  const updateSessionTitle = useCallback((id, title) => {
    setSessions((prev) => {
      const updated = prev.map((s) => (s.id === id ? { ...s, title } : s));
      saveSessions(updated);
      return updated;
    });
  }, []);

  const deleteSession = useCallback(
    (id) => {
      setSessions((prev) => {
        const updated = prev.filter((s) => s.id !== id);

        if (id === sessionId) {
          if (updated.length > 0) {
            setSessionId(updated[updated.length - 1].id);
          } else {
            const newId = generateId();
            const fresh = { id: newId, title: "New Chat", createdAt: Date.now() };
            saveSessions([fresh]);
            setSessionId(newId);
            return [fresh];
          }
        }

        saveSessions(updated);
        return updated;
      });
    },
    [sessionId]
  );

  const activeSession = sessions.find((s) => s.id === sessionId) || null;

  return {
    sessionId,
    sessions,
    activeSession,
    createNewSession,
    switchSession,
    updateSessionTitle,
    deleteSession,
  };
};