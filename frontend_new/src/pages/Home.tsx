import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';

const Home: React.FC = () => {
  const { t } = useTranslation();

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
            <li><a href="#features">{t('nav.features')}</a></li>
            <li><a href="#demo">{t('nav.live_demo')}</a></li>
            <li><a href="#accessibility">{t('nav.accessibility')}</a></li>
            <li><Link to="/assistant" className="btn btn-primary">{t('nav.start_assistant')}</Link></li>
            <li><Link to="/caregiver" className="btn btn-secondary">{t('nav.login')}</Link></li>
            <li><LanguageSwitcher /></li>
          </ul>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="container hero">
        <div className="hero-content">
          <div className="trust-indicators">
            <span className="trust-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              {t('hero.wcag')}
            </span>
            <span className="trust-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
              {t('hero.voice_first')}
            </span>
          </div>
          <h1 className="hero-heading">{t('hero.title')}</h1>
          <p>{t('hero.subtitle')}</p>
          <div className="hero-buttons">
            <Link to="/assistant" className="btn btn-primary">{t('hero.launch_web_app')}</Link>
            <a href="#demo" className="btn btn-secondary">{t('hero.try_live_demo')}</a>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section id="features" className="section" style={{ background: 'var(--surface-color)' }}>
        <div className="container">
          <h2 className="section-heading">{t('features.title')}</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">👁️</div>
              <h3 className="card-heading">{t('features.detection_title')}</h3>
              <p>{t('features.detection_desc')}</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📖</div>
              <h3 className="card-heading">{t('features.ocr_title')}</h3>
              <p>{t('features.ocr_desc')}</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎙️</div>
              <h3 className="card-heading">{t('features.voice_title')}</h3>
              <p>{t('features.voice_desc')}</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🚨</div>
              <h3 className="card-heading">{t('features.sos_title')}</h3>
              <p>{t('features.sos_desc')}</p>
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
              <p className="text-small" style={{ maxWidth: '250px' }}>{t('footer.desc')}</p>
            </div>
            <div className="footer-col">
              <h4>{t('footer.platform')}</h4>
              <ul>
                <li><Link to="/assistant">{t('footer.voice_assistant')}</Link></li>
                <li><Link to="/caregiver">{t('footer.caregiver_dashboard')}</Link></li>
                <li><a href="#features">{t('nav.features')}</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>{t('footer.company')}</h4>
              <ul>
                <li><a href="#accessibility">{t('footer.accessibility_statement')}</a></li>
                <li><Link to="/admin">{t('footer.admin_portal')}</Link></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>{t('footer.rights')}</p>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Home;
