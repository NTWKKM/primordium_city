import { useState, useEffect, useRef } from 'react';
import { Routes, Route, useNavigate, useLocation, Link } from 'react-router-dom';
import Markdown from 'react-markdown';
import './index.css';

function App() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'eye-care');
  const [fontSize, setFontSize] = useState(parseInt(localStorage.getItem('fontSize')) || 18);
  const [catalog, setCatalog] = useState([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    document.body.style.setProperty('--font-size-base', `${fontSize}px`);
    localStorage.setItem('fontSize', fontSize);
  }, [fontSize]);

  useEffect(() => {
    fetch(import.meta.env.BASE_URL + 'content/catalog.json?t=' + Date.now())
      .then(res => res.json())
      .then(data => setCatalog(data.chapters));
  }, []);

  const navigateWithTransition = (path) => {
    if (!document.startViewTransition) {
      navigate(path);
      return;
    }
    const transition = document.startViewTransition(() => {
      navigate(path);
    });
    
    // MANDATORY Accessibility Routing: Route focus after transition
    transition.finished.finally(() => {
      document.getElementById("main-heading")?.focus();
    });
  };

  return (
    <>
      <div className="scroll-progress-bar" aria-hidden="true"></div>

      <header className="app-bar">
        <div 
          style={{ fontWeight: 'bold', fontFamily: 'var(--font-heading)', cursor: 'pointer' }}
          onClick={() => navigateWithTransition('/')}
          title="Go to Home"
          role="button"
          tabIndex={0}
        >
          Primordium City
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="icon-btn" onClick={() => navigateWithTransition('/')} title="Home">🏠</button>
          <button className="icon-btn" onClick={() => navigateWithTransition('/world-bible')} title="World Bible">📚</button>
          <button className="icon-btn" onClick={() => setSettingsOpen(true)} title="Settings">⚙️</button>
        </div>
      </header>

      <main className="container markdown-body" style={{ minHeight: '80vh', paddingBottom: '100px' }} tabIndex="-1">
        <Routes>
          <Route path="/" element={<Home catalog={catalog} navigateWithTransition={navigateWithTransition} />} />
          <Route path="/read/:chapterId" element={<Reader catalog={catalog} navigateWithTransition={navigateWithTransition} />} />
          <Route path="/world-bible" element={<WorldBible />} />
        </Routes>
      </main>

      <footer className="bottom-bar">
        <button className="icon-btn" onClick={() => setCatalogOpen(true)}>📑 Table of Contents</button>
        <button className="icon-btn" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>⬆️ Back to Top</button>
      </footer>

      {/* Settings Drawer */}
      <Drawer isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} title="Reading Settings">
        <div className="controls-section">
          <h3>Theme</h3>
          <div className="theme-selector">
            {['eye-care', 'vintage', 'light', 'dark', 'gray'].map(t => (
              <button 
                key={t}
                className={`theme-btn ${theme === t ? 'active' : ''}`}
                data-value={t}
                onClick={() => setTheme(t)}
                title={t}
                aria-label={`Select ${t} theme`}
              />
            ))}
          </div>
        </div>
        <div className="controls-section">
          <h3>Font Size</h3>
          <div className="font-size-controls">
            <button className="font-btn" onClick={() => setFontSize(f => Math.max(12, f - 2))}>A-</button>
            <span style={{ fontFamily: 'var(--font-heading)' }}>{fontSize}px</span>
            <button className="font-btn" onClick={() => setFontSize(f => Math.min(32, f + 2))}>A+</button>
          </div>
        </div>
      </Drawer>

      {/* Centered Modal for Table of Contents */}
      <div className={`modal-overlay ${catalogOpen ? 'open' : ''}`} onClick={() => setCatalogOpen(false)}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2 style={{ margin: 0 }}>Table of Contents</h2>
            <button className="icon-btn" onClick={() => setCatalogOpen(false)}>❌</button>
          </div>
          <div className="modal-body">
            <ul className="chapter-list">
              {catalog.map(chap => (
                <li key={chap.id} className="chapter-item">
                  <a 
                    href={`#/read/${encodeURIComponent(chap.id)}`} 
                    className="chapter-link"
                    onClick={(e) => {
                      e.preventDefault();
                      setCatalogOpen(false);
                      navigateWithTransition(`/read/${encodeURIComponent(chap.id)}`);
                    }}
                  >
                    {chap.title}
                  </a>
                  <div className="chapter-meta">Read time: ~{chap.readTimeMin} min</div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

    </>
  );
}

function Drawer({ isOpen, onClose, title, children }) {
  return (
    <>
      <div className={`drawer-overlay ${isOpen ? 'open' : ''}`} onClick={onClose}></div>
      <div className={`drawer ${isOpen ? 'open' : ''}`}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 style={{ margin: 0 }}>{title}</h2>
          <button className="icon-btn" onClick={onClose}>❌</button>
        </div>
        {children}
      </div>
    </>
  );
}

function Home({ catalog, navigateWithTransition }) {
  return (
    <div style={{ textAlign: 'center', marginTop: '4rem' }}>
      <h1 id="main-heading" tabIndex="-1" style={{ outline: 'none' }}>Primordium City</h1>
      <p style={{ opacity: 0.8, fontSize: '1.2em' }}>Welcome to the cyber world and mysteries</p>
      {catalog.length > 0 && (
        <button 
          onClick={() => navigateWithTransition(`/read/${encodeURIComponent(catalog[0].id)}`)}
          style={{ 
            marginTop: '2rem', padding: '1rem 2rem', 
            fontSize: '1.2rem', backgroundColor: 'var(--primary-color)', 
            color: 'var(--bg-color)', border: 'none', borderRadius: '8px',
            transition: 'transform 0.2s',
            cursor: 'pointer'
          }}
          onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          Start Reading
        </button>
      )}
    </div>
  );
}

function Reader({ catalog, navigateWithTransition }) {
  const { pathname } = useLocation();
  const chapterId = decodeURIComponent(pathname.split('/read/')[1] || '');
  const [content, setContent] = useState('Loading content...');

  useEffect(() => {
    if (chapterId) {
      window.scrollTo(0, 0);
      setContent('Loading content...');
      fetch(import.meta.env.BASE_URL + 'content/' + chapterId + '?t=' + Date.now())
        .then(res => {
          if (!res.ok) throw new Error('Not found');
          return res.text();
        })
        .then(text => setContent(text))
        .catch(() => setContent('Error loading content'));
    }
  }, [chapterId]);

  const currentIndex = catalog.findIndex(c => c.id === chapterId);
  const prevChap = currentIndex > 0 ? catalog[currentIndex - 1] : null;
  const nextChap = currentIndex < catalog.length - 1 ? catalog[currentIndex + 1] : null;

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft' && prevChap) {
        navigateWithTransition(`/read/${encodeURIComponent(prevChap.id)}`);
      } else if (e.key === 'ArrowRight' && nextChap) {
        navigateWithTransition(`/read/${encodeURIComponent(nextChap.id)}`);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [prevChap, nextChap]);

  return (
    <div>
      {/* Invisible heading for focus management */}
      <h1 id="main-heading" tabIndex="-1" className="sr-only" style={{ outline: 'none', position: 'absolute', width: '1px', height: '1px', margin: '-1px', overflow: 'hidden' }}>
        {currentIndex !== -1 ? catalog[currentIndex]?.title : 'Reading Chapter'}
      </h1>
      
      <Markdown>{content}</Markdown>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid var(--border-color)' }}>
        {prevChap ? (
          <button 
            onClick={() => navigateWithTransition(`/read/${encodeURIComponent(prevChap.id)}`)}
            style={{ padding: '0.8rem 1.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-color)' }}
          >
            &laquo; Previous
          </button>
        ) : <div></div>}
        
        {nextChap ? (
          <button 
            onClick={() => navigateWithTransition(`/read/${encodeURIComponent(nextChap.id)}`)}
            style={{ padding: '0.8rem 1.5rem', borderRadius: '8px', backgroundColor: 'var(--primary-color)', color: 'var(--bg-color)', border: 'none' }}
          >
            Next &raquo;
          </button>
        ) : <div></div>}
      </div>
    </div>
  );
}

function WorldBible() {
  const [content, setContent] = useState('Loading...');
  
  useEffect(() => {
    window.scrollTo(0, 0);
    fetch(import.meta.env.BASE_URL + 'content/WORLD_BIBLE.md?t=' + Date.now())
      .then(res => res.text())
      .then(text => setContent(text))
      .catch(() => setContent('World Bible not found'));
  }, []);
  
  return (
    <div>
      <h1 id="main-heading" tabIndex="-1" style={{ outline: 'none', fontSize: '2.5rem', textAlign: 'center', marginBottom: '2rem' }}>World Bible</h1>
      <Markdown>{content}</Markdown>
    </div>
  );
}

export default App;
