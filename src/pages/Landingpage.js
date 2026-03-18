import React, { useState, useEffect, useRef } from "react";
import "../styles/Landingpage.css";

/* ================================================================
   DATA
   ================================================================ */

const FEATURES = [
  {
    icon: "◈",
    title: "Multi-PDF Intelligence",
    desc: "Upload multiple documents at once. Obscur AI reads, indexes, and understands all of them simultaneously.",
  },
  {
    icon: "⚡",
    title: "Instant Contextual Answers",
    desc: "Ask anything in natural language. Get precise answers extracted directly from your document's content.",
  },
  {
    icon: "🔒",
    title: "Session-Based Privacy",
    desc: "Each conversation is isolated to your session. Your documents stay yours — no data retention.",
  },
  {
    icon: "🌐",
    title: "Language Agnostic",
    desc: "Works with documents in any language. Ask in Bahasa, get answers in English — or the other way around.",
  },
  {
    icon: "📌",
    title: "Source References",
    desc: "Every answer comes with traceable sources from your document. No hallucinations, only evidence.",
  },
  {
    icon: "♾",
    title: "Unlimited Questions",
    desc: "No query limits per session. Explore your document as deeply as you need to.",
  },
];

const STEPS = [
  {
    number: "01",
    title: "Upload your PDF",
    desc: "Drag and drop one or multiple PDF files. Obscur AI processes and indexes your document instantly.",
  },
  {
    number: "02",
    title: "Ask anything",
    desc: "Type your question in natural language — summaries, specific clauses, data points, anything.",
  },
  {
    number: "03",
    title: "Get precise answers",
    desc: "Receive contextual, source-backed answers from your document in seconds. No fluff, just clarity.",
  },
];

const PRICING = [
  {
    name: "Free",
    price: "0",
    period: "forever",
    desc: "Perfect for trying out Obscur AI",
    features: ["3 documents per session", "50 questions per day", "Standard response speed", "Session history (7 days)"],
    cta: "Get Started",
    highlight: false,
  },
  {
    name: "Pro",
    price: "12",
    period: "per month",
    desc: "For individuals who work with documents daily",
    features: ["Unlimited documents", "Unlimited questions", "Priority response speed", "Session history (unlimited)", "Source citations", "Export conversations"],
    cta: "Start Free Trial",
    highlight: true,
  },
  {
    name: "Team",
    price: "39",
    period: "per month",
    desc: "For teams collaborating on documents",
    features: ["Everything in Pro", "Up to 10 team members", "Shared document library", "Admin dashboard", "API access", "Priority support"],
    cta: "Contact Sales",
    highlight: false,
  },
];

const TESTIMONIALS = [
  {
    name: "Rina Kusuma",
    role: "Legal Analyst",
    avatar: "RK",
    text: "I used to spend hours going through contracts. Obscur AI cut that down to minutes. The source references give me confidence every single time.",
  },
  {
    name: "David Hartono",
    role: "Research Engineer",
    avatar: "DH",
    text: "Reading dense academic papers is now actually enjoyable. I upload, ask, and understand — it's that simple. Nothing else comes close.",
  },
  {
    name: "Sarah Lim",
    role: "Product Manager",
    avatar: "SL",
    text: "Our team uses Obscur AI for onboarding documentation. New hires get answers instantly without bothering anyone. It's been a game changer.",
  },
  {
    name: "Marco Wijaya",
    role: "Finance Director",
    avatar: "MW",
    text: "Financial reports used to be a nightmare. Now I just upload the PDF and ask exactly what I need. The precision is impressive.",
  },
];


/* ================================================================
   COMPONENTS — NAVBAR
   ================================================================ */

const Navbar = ({ onLoginClick }) => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  };

  return (
    <nav className={`navbar ${scrolled ? "navbar-scrolled" : ""}`}>
      <div className="navbar-inner">
        <div className="navbar-logo" onClick={() => scrollTo("hero")}>
          <span className="navbar-logo-icon">◈</span>
          <span className="navbar-logo-text">Obscur AI</span>
        </div>

        <div className={`navbar-links ${menuOpen ? "navbar-links-open" : ""}`}>
          {["features", "how-it-works", "pricing", "testimonials"].map((id) => (
            <button key={id} className="navbar-link" onClick={() => scrollTo(id)}>
              {id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
            </button>
          ))}
        </div>

        <div className="navbar-actions">
          <button className="navbar-login-btn" onClick={onLoginClick}>Login</button>
          <button className="navbar-cta-btn" onClick={onLoginClick}>Start for Free</button>
        </div>

        <button
          className={`navbar-hamburger ${menuOpen ? "hamburger-open" : ""}`}
          onClick={() => setMenuOpen((p) => !p)}
          aria-label="Toggle menu"
        >
          <span /><span /><span />
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="navbar-mobile-menu">
          {["features", "how-it-works", "pricing", "testimonials"].map((id) => (
            <button key={id} className="mobile-menu-link" onClick={() => scrollTo(id)}>
              {id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
            </button>
          ))}
          <div className="mobile-menu-actions">
            <button className="navbar-login-btn" onClick={onLoginClick}>Login</button>
            <button className="navbar-cta-btn" onClick={onLoginClick}>Start for Free</button>
          </div>
        </div>
      )}
    </nav>
  );
};


/* ================================================================
   COMPONENTS — HERO
   ================================================================ */

const HeroMockup = () => (
  <div className="hero-mockup">
    <div className="mockup-window">
      <div className="mockup-topbar">
        <div className="mockup-dots">
          <span className="mockup-dot red" />
          <span className="mockup-dot yellow" />
          <span className="mockup-dot green" />
        </div>
        <span className="mockup-title">obscur.ai</span>
      </div>
      <div className="mockup-body">
        <div className="mockup-sidebar">
          <div className="mockup-logo-sm">◈</div>
          <div className="mockup-nav-items">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className={`mockup-nav-item ${i === 1 ? "active" : ""}`} />
            ))}
          </div>
        </div>
        <div className="mockup-chat">
          <div className="mockup-doc-badge">📄 Annual Report 2024.pdf</div>
          <div className="mockup-messages">
            <div className="mockup-msg user">What was the total revenue in Q3?</div>
            <div className="mockup-msg ai">
              <div className="mockup-msg-line long" />
              <div className="mockup-msg-line medium" />
              <div className="mockup-msg-line short" />
            </div>
            <div className="mockup-msg user">Compare it to Q2 performance.</div>
            <div className="mockup-msg ai">
              <div className="mockup-msg-line medium" />
              <div className="mockup-msg-line long" />
            </div>
          </div>
          <div className="mockup-input">
            <span className="mockup-input-text">Ask anything about your document…</span>
            <span className="mockup-send-btn">↑</span>
          </div>
        </div>
      </div>
    </div>

    {/* Floating badges */}
    <div className="mockup-badge badge-1">
      <span>⚡</span> Answered in 0.8s
    </div>
    <div className="mockup-badge badge-2">
      <span>📌</span> 3 sources found
    </div>
    <div className="mockup-badge badge-3">
      <span>🔒</span> Private session
    </div>
  </div>
);

const Hero = ({ onCtaClick }) => (
  <section id="hero" className="hero-section">
    <div className="hero-bg-grid" />
    <div className="hero-bg-glow" />

    <div className="hero-inner">
      <div className="hero-text">
        <div className="hero-badge">
          <span className="hero-badge-dot" />
          <span>AI-powered document intelligence</span>
        </div>

        <h1 className="hero-title">
          Your documents,
          <br />
          <span className="hero-title-gradient">finally understood.</span>
        </h1>

        <p className="hero-desc">
          Upload any PDF and start a conversation with its content.
          Obscur AI reads, understands, and answers — with precision,
          speed, and full source transparency.
        </p>

        <div className="hero-actions">
          <button className="hero-cta-btn" onClick={onCtaClick}>
            Start for Free
            <span className="hero-cta-arrow">→</span>
          </button>
          <button className="hero-secondary-btn" onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}>
            See how it works
          </button>
        </div>

        <div className="hero-social-proof">
          <div className="hero-avatars">
            {["A", "B", "C", "D"].map((l, i) => (
              <div key={i} className="hero-avatar">{l}</div>
            ))}
          </div>
          <span className="hero-proof-text">
            Trusted by <strong>2,000+</strong> professionals
          </span>
        </div>
      </div>

      <HeroMockup />
    </div>
  </section>
);


/* ================================================================
   COMPONENTS — FEATURES
   ================================================================ */

const Features = () => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="features" className="features-section" ref={ref}>
      <div className="section-inner">
        <div className="section-label">Features</div>
        <h2 className="section-title">Everything you need to<br />understand any document</h2>
        <p className="section-desc">Built for professionals who can't afford to miss details.</p>

        <div className={`features-grid ${visible ? "features-visible" : ""}`}>
          {FEATURES.map((f, i) => (
            <div key={i} className="feature-card" style={{ animationDelay: `${i * 80}ms` }}>
              <div className="feature-icon">{f.icon}</div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};


/* ================================================================
   COMPONENTS — HOW IT WORKS
   ================================================================ */

const HowItWorks = () => (
  <section id="how-it-works" className="hiw-section">
    <div className="hiw-bg-line" />
    <div className="section-inner">
      <div className="section-label">How it works</div>
      <h2 className="section-title">Three steps to clarity</h2>
      <p className="section-desc">No learning curve. No setup. Just upload and ask.</p>

      <div className="hiw-steps">
        {STEPS.map((step, i) => (
          <div key={i} className="hiw-step">
            <div className="hiw-step-number">{step.number}</div>
            <div className="hiw-step-content">
              <h3 className="hiw-step-title">{step.title}</h3>
              <p className="hiw-step-desc">{step.desc}</p>
            </div>
            {i < STEPS.length - 1 && <div className="hiw-connector" />}
          </div>
        ))}
      </div>
    </div>
  </section>
);


/* ================================================================
   COMPONENTS — PRICING
   ================================================================ */

const Pricing = ({ onCtaClick }) => (
  <section id="pricing" className="pricing-section">
    <div className="section-inner">
      <div className="section-label">Pricing</div>
      <h2 className="section-title">Simple, transparent pricing</h2>
      <p className="section-desc">Start free. Upgrade when you're ready.</p>

      <div className="pricing-grid">
        {PRICING.map((plan, i) => (
          <div key={i} className={`pricing-card ${plan.highlight ? "pricing-card-highlight" : ""}`}>
            {plan.highlight && <div className="pricing-popular-badge">Most Popular</div>}
            <div className="pricing-header">
              <span className="pricing-name">{plan.name}</span>
              <span className="pricing-desc">{plan.desc}</span>
            </div>
            <div className="pricing-price">
              <span className="pricing-currency">$</span>
              <span className="pricing-amount">{plan.price}</span>
              <span className="pricing-period">/{plan.period}</span>
            </div>
            <ul className="pricing-features">
              {plan.features.map((f, j) => (
                <li key={j} className="pricing-feature-item">
                  <span className="pricing-check">✓</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <button
              className={`pricing-cta-btn ${plan.highlight ? "pricing-cta-highlight" : ""}`}
              onClick={onCtaClick}
            >
              {plan.cta}
            </button>
          </div>
        ))}
      </div>
    </div>
  </section>
);


/* ================================================================
   COMPONENTS — TESTIMONIALS
   ================================================================ */

const Testimonials = () => (
  <section id="testimonials" className="testimonials-section">
    <div className="section-inner">
      <div className="section-label">Testimonials</div>
      <h2 className="section-title">Trusted by professionals<br />across industries</h2>

      <div className="testimonials-grid">
        {TESTIMONIALS.map((t, i) => (
          <div key={i} className="testimonial-card">
            <div className="testimonial-quote">"</div>
            <p className="testimonial-text">{t.text}</p>
            <div className="testimonial-author">
              <div className="testimonial-avatar">{t.avatar}</div>
              <div className="testimonial-info">
                <span className="testimonial-name">{t.name}</span>
                <span className="testimonial-role">{t.role}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);


/* ================================================================
   COMPONENTS — CTA + FOOTER
   ================================================================ */

const CtaSection = ({ onCtaClick }) => (
  <section className="cta-section">
    <div className="cta-bg-glow" />
    <div className="section-inner cta-inner">
      <h2 className="cta-title">
        Stop reading.<br />
        <span className="cta-title-accent">Start understanding.</span>
      </h2>
      <p className="cta-desc">
        Join thousands of professionals who use Obscur AI to work smarter with their documents.
      </p>
      <button className="hero-cta-btn" onClick={onCtaClick}>
        Get Started for Free
        <span className="hero-cta-arrow">→</span>
      </button>
    </div>
  </section>
);

const Footer = () => (
  <footer className="footer">
    <div className="footer-inner">
      <div className="footer-brand">
        <div className="footer-logo">
          <span className="navbar-logo-icon">◈</span>
          <span className="navbar-logo-text">Obscur AI</span>
        </div>
        <p className="footer-tagline">Your documents, finally understood.</p>
      </div>

      <div className="footer-links">
        <div className="footer-col">
          <span className="footer-col-title">Product</span>
          <a href="#features" className="footer-link">Features</a>
          <a href="#pricing" className="footer-link">Pricing</a>
          <a href="#how-it-works" className="footer-link">How it works</a>
        </div>
        <div className="footer-col">
          <span className="footer-col-title">Company</span>
          <a href="#" className="footer-link">About</a>
          <a href="#" className="footer-link">Blog</a>
          <a href="#" className="footer-link">Contact</a>
        </div>
        <div className="footer-col">
          <span className="footer-col-title">Legal</span>
          <a href="#" className="footer-link">Privacy Policy</a>
          <a href="#" className="footer-link">Terms of Service</a>
        </div>
      </div>
    </div>

    <div className="footer-bottom">
      <span>© {new Date().getFullYear()} Obscur AI. All rights reserved.</span>
      <span className="footer-made">Made with ◈</span>
    </div>
  </footer>
);


/* ================================================================
   PAGE — LANDING PAGE
   ================================================================ */

const LandingPage = ({ onLoginClick }) => {
  return (
    <div className="landing-page">
      <Navbar onLoginClick={onLoginClick} />
      <Hero onCtaClick={onLoginClick} />
      <Features />
      <HowItWorks />
      <Pricing onCtaClick={onLoginClick} />
      <Testimonials />
      <CtaSection onCtaClick={onLoginClick} />
      <Footer />
    </div>
  );
};

export default LandingPage;