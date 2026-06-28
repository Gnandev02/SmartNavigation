import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="language-switcher" style={{ display: 'flex', gap: '8px', alignItems: 'center', marginLeft: '16px' }}>
      <button 
        onClick={() => changeLanguage('en')}
        style={{ fontWeight: i18n.language.startsWith('en') ? 'bold' : 'normal', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-color)' }}
      >
        EN
      </button>
      <span style={{ color: 'var(--text-color)' }}>|</span>
      <button 
        onClick={() => changeLanguage('es')}
        style={{ fontWeight: i18n.language.startsWith('es') ? 'bold' : 'normal', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-color)' }}
      >
        ES
      </button>
      <span style={{ color: 'var(--text-color)' }}>|</span>
      <button 
        onClick={() => changeLanguage('fr')}
        style={{ fontWeight: i18n.language.startsWith('fr') ? 'bold' : 'normal', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-color)' }}
      >
        FR
      </button>
      <span style={{ color: 'var(--text-color)' }}>|</span>
      <button 
        onClick={() => changeLanguage('hi')}
        style={{ fontWeight: i18n.language.startsWith('hi') ? 'bold' : 'normal', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-color)' }}
      >
        HI
      </button>
      <span style={{ color: 'var(--text-color)' }}>|</span>
      <button 
        onClick={() => changeLanguage('te')}
        style={{ fontWeight: i18n.language.startsWith('te') ? 'bold' : 'normal', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-color)' }}
      >
        TE
      </button>
    </div>
  );
};

export default LanguageSwitcher;
