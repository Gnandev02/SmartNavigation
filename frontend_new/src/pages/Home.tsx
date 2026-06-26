import React from 'react';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
  return (
    <>
      {/* Sticky Navigation */}
      <nav className="sticky-nav" id="main-nav">
        <div className="container nav-container">
          <div className="logo">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--primary-color)' }}>
              <circle cx="12" cy="12" r="10"></circle>
              <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
            </svg>
            SmartNav
          </div>
          <ul className="nav-links">
            <li><a href="#features">Features</a></li>
            <li><a href="#demo">Live Demo</a></li>
            <li><a href="#accessibility">Accessibility</a></li>
            <li><Link to="/assistant" className="btn btn-primary">Start Assistant</Link></li>
            <li><Link to="/caregiver" className="btn btn-secondary">Login</Link></li>
          </ul>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="container hero">
        <div className="hero-content">
          <div className="trust-indicators">
            <span className="trust-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              WCAG 2.2 AA
            </span>
            <span className="trust-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
              Voice First
            </span>
          </div>
          <h1 className="hero-heading">Navigate the World with Independence</h1>
          <p>An advanced AI-powered assistant designed for the visually impaired. Understand your surroundings safely using just your smartphone and voice.</p>
          <div className="hero-buttons">
            <Link to="/assistant" className="btn btn-primary">Launch Web App</Link>
            <a href="#demo" className="btn btn-secondary">Try Live Demo</a>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section id="features" className="section" style={{ background: 'var(--surface-color)' }}>
        <div className="container">
          <h2 className="section-heading">Powerful AI Capabilities</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">👁️</div>
              <h3 className="card-heading">Real-Time Detection</h3>
              <p>Instantly identifies people, doors, stairs, and everyday obstacles in your path using advanced computer vision.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📖</div>
              <h3 className="card-heading">Signboard Reading</h3>
              <p>Advanced optical character recognition reads direction boards, room numbers, and warnings aloud.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎙️</div>
              <h3 className="card-heading">100% Voice Control</h3>
              <p>Interact entirely hands-free. Just say "Hey SmartNav, what's in front of me?"</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🚨</div>
              <h3 className="card-heading">Emergency SOS</h3>
              <p>Instantly share your live location and alert caregivers via the connected dashboard during emergencies.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Multi-Column Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-col">
              <div className="logo" style={{ marginBottom: '16px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--primary-color)' }}>
                  <circle cx="12" cy="12" r="10"></circle>
                  <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
                </svg>
                SmartNav
              </div>
              <p className="text-small" style={{ maxWidth: '250px' }}>Empowering visually impaired individuals to navigate the world independently with state-of-the-art AI.</p>
            </div>
            <div className="footer-col">
              <h4>Platform</h4>
              <ul>
                <li><Link to="/assistant">Voice Assistant</Link></li>
                <li><Link to="/caregiver">Caregiver Dashboard</Link></li>
                <li><a href="#features">Features</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>Company</h4>
              <ul>
                <li><a href="#accessibility">Accessibility Statement</a></li>
                <li><Link to="/admin">Admin Portal</Link></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2026 SmartNav Accessibility. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Home;
