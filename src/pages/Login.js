import React, { useState, useEffect, useRef } from "react";
import "../styles/Login.css";

/* ================================================================
   COMPONENTS — BACKGROUND EFFECTS
   ================================================================ */

// Floating Paper Background
const FloatingPapers = () => {
  const papers = Array.from({ length: 8 }, (_, i) => i);
  return (
    <div className="floating-papers">
      {papers.map((i) => (
        <div key={i} className={`paper paper-${i + 1}`}>
          <div className="paper-line" />
          <div className="paper-line" />
          <div className="paper-line short" />
        </div>
      ))}
    </div>
  );
};

// Particle Dots Canvas
const ParticleCanvas = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const PARTICLE_COUNT = 60;
    const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 1.8 + 0.4,
      alpha: Math.random() * 0.4 + 0.1,
    }));

    let animId;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw connection lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(198, 144, 38, ${0.08 * (1 - dist / 100)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw particles
      particles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(198, 144, 38, ${p.alpha})`;
        ctx.fill();

        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      });

      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="particle-canvas" />;
};

// Ink Reveal Overlay
const InkReveal = ({ onDone }) => {
  useEffect(() => {
    const timer = setTimeout(onDone, 1600);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div className="ink-reveal">
      <div className="ink-circle" />
    </div>
  );
};


/* ================================================================
   COMPONENTS — FORM
   ================================================================ */

const InputField = ({ label, type, value, onChange, placeholder, icon }) => {
  const [focused, setFocused] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const isPassword = type === "password";

  return (
    <div className={`input-field ${focused ? "input-focused" : ""} ${value ? "input-has-value" : ""}`}>
      <label className="input-label">{label}</label>
      <div className="input-wrapper">
        <span className="input-icon">{icon}</span>
        <input
          type={isPassword && showPass ? "text" : type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="input-el"
          autoComplete={isPassword ? "current-password" : "email"}
        />
        {isPassword && (
          <button
            type="button"
            className="input-toggle-pass"
            onClick={() => setShowPass((p) => !p)}
            tabIndex={-1}
          >
            {showPass ? "🙈" : "👁"}
          </button>
        )}
      </div>
    </div>
  );
};


/* ================================================================
   COMPONENTS — LEFT PANEL
   ================================================================ */

const LeftPanel = () => (
  <div className="login-left">
    <ParticleCanvas />
    <FloatingPapers />

    <div className="left-content">
      <div className="left-logo">
        <span className="left-logo-icon">◈</span>
        <span className="left-logo-text">Obscur AI</span>
      </div>

      <div className="left-headline">
        <h1 className="left-title">
          Your documents,
          <br />
          <span className="left-title-accent">understood.</span>
        </h1>
        <p className="left-desc">
          Upload any PDF and start a conversation with its content.
          Powered by RAG — intelligent, fast, and context-aware.
        </p>
      </div>

      <div className="left-features">
        {[
          { icon: "📄", text: "Multi-PDF support" },
          { icon: "⚡", text: "Instant answers" },
          { icon: "🔒", text: "Session-based privacy" },
        ].map((f, i) => (
          <div key={i} className="left-feature-item">
            <span className="left-feature-icon">{f.icon}</span>
            <span className="left-feature-text">{f.text}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);


/* ================================================================
   PAGE — LOGIN
   ================================================================ */

const Login = ({ onLoginSuccess }) => {
  const [inkDone, setInkDone] = useState(false);
  const [mode, setMode] = useState("login"); // 'login' | 'register'
  const [form, setForm] = useState({ email: "", password: "", name: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    setError("");
    // TODO: integrate with auth backend
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    onLoginSuccess?.();
  };

  return (
    <div className={`login-page ${inkDone ? "ink-done" : ""}`}>
      {/* Ink reveal on mount */}
      {!inkDone && <InkReveal onDone={() => setInkDone(true)} />}

      {/* Left — branding + effects */}
      <LeftPanel />

      {/* Right — form */}
      <div className="login-right">
        <div className="login-form-container">

          {/* Mobile logo */}
          <div className="login-mobile-logo">
            <span className="left-logo-icon">◈</span>
            <span className="left-logo-text">Obscur AI</span>
          </div>

          {/* Tab switch */}
          <div className="login-tabs">
            <button
              className={`login-tab ${mode === "login" ? "login-tab-active" : ""}`}
              onClick={() => { setMode("login"); setError(""); }}
            >
              Sign In
            </button>
            <button
              className={`login-tab ${mode === "register" ? "login-tab-active" : ""}`}
              onClick={() => { setMode("register"); setError(""); }}
            >
              Register
            </button>
            <div className={`login-tab-indicator ${mode === "register" ? "tab-right" : ""}`} />
          </div>

          {/* Heading */}
          <div className="login-heading">
            <h2 className="login-title">
              {mode === "login" ? "Welcome back" : "Create account"}
            </h2>
            <p className="login-subtitle">
              {mode === "login"
                ? "Sign in to continue to Obscur AI"
                : "Start chatting with your documents"}
            </p>
          </div>

          {/* Form */}
          <form className="login-form" onSubmit={handleSubmit} noValidate>
            {mode === "register" && (
              <InputField
                label="Full Name"
                type="text"
                value={form.name}
                onChange={handleChange("name")}
                placeholder="Your name"
                icon="👤"
              />
            )}

            <InputField
              label="Email"
              type="email"
              value={form.email}
              onChange={handleChange("email")}
              placeholder="you@example.com"
              icon="✉"
            />

            <InputField
              label="Password"
              type="password"
              value={form.password}
              onChange={handleChange("password")}
              placeholder="••••••••"
              icon="🔑"
            />

            {mode === "login" && (
              <div className="login-forgot">
                <button type="button" className="forgot-btn">
                  Forgot password?
                </button>
              </div>
            )}

            {error && (
              <div className="login-error">
                <span>⚠ {error}</span>
              </div>
            )}

            <button
              type="submit"
              className={`login-submit-btn ${loading ? "login-submit-loading" : ""}`}
              disabled={loading}
            >
              {loading ? (
                <span className="submit-spinner" />
              ) : (
                <span>{mode === "login" ? "Sign In" : "Create Account"}</span>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="login-divider">
            <span className="divider-line" />
            <span className="divider-text">or continue with</span>
            <span className="divider-line" />
          </div>

          {/* Social */}
          <div className="login-social">
            <button className="social-btn" type="button">
              <span className="social-icon">G</span>
              <span>Google</span>
            </button>
            <button className="social-btn" type="button">
              <span className="social-icon">⌥</span>
              <span>GitHub</span>
            </button>
          </div>

          <p className="login-footer-text">
            {mode === "login" ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              className="login-switch-btn"
              onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
            >
              {mode === "login" ? "Register" : "Sign In"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;