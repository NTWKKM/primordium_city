import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Markdown from 'react-markdown';
import './index.css';

function App() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'eye-care');
  const [fontSize, setFontSize] = useState(parseInt(localStorage.getItem('fontSize')) || 18);
  const [catalog, setCatalog] = useState([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [worldBibleOpen, setWorldBibleOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    document.body.style.setProperty('--font-size-base', `${fontSize}px`);
    localStorage.setItem('fontSize', fontSize);
  }, [fontSize]);

  useEffect(() => {
    fetch('/content/catalog.json')
      .then(res => res.json())
      .then(data => setCatalog(data.chapters));
  }, []);

  return (
    <>
      <div className="scroll-progress-bar" aria-hidden="true"></div>

      <header className="app-bar">
        <div style={{ fontWeight: 'bold', fontFamily: 'var(--font-heading)' }}>Primordium City</div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="icon-btn" onClick={() => setWorldBibleOpen(true)} title="World Bible">📚</button>
          <button className="icon-btn" onClick={() => setSettingsOpen(true)} title="Settings">⚙️</button>
        </div>
      </header>

      <main className="container markdown-body" style={{ minHeight: '80vh', paddingBottom: '80px' }}>
        <Routes>
          <Route path="/" element={<Home catalog={catalog} />} />
          <Route path="/read/:chapterId" element={<Reader catalog={catalog} />} />
        </Routes>
      </main>

      <footer className="bottom-bar">
        <button className="icon-btn" onClick={() => setCatalogOpen(true)}>📑 ถือสารบัญ</button>
        <button className="icon-btn" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>⬆️ บนสุด</button>
      </footer>

      {/* Drawers */}
      <Drawer isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} title="ตั้งค่าการอ่าน">
        <div className="controls-section">
          <h3>ธีมสี</h3>
          <div className="theme-selector">
            {['eye-care', 'vintage', 'light', 'dark', 'gray'].map(t => (
              <button 
                key={t}
                className={`theme-btn ${theme === t ? 'active' : ''}`}
                data-value={t}
                onClick={() => setTheme(t)}
                title={t}
              />
            ))}
          </div>
        </div>
        <div className="controls-section">
          <h3>ขนาดตัวอักษร</h3>
          <div className="font-size-controls">
            <button className="font-btn" onClick={() => setFontSize(f => Math.max(12, f - 2))}>A-</button>
            <span style={{ fontFamily: 'var(--font-heading)' }}>{fontSize}px</span>
            <button className="font-btn" onClick={() => setFontSize(f => Math.min(32, f + 2))}>A+</button>
          </div>
        </div>
      </Drawer>

      <Drawer isOpen={catalogOpen} onClose={() => setCatalogOpen(false)} title="สารบัญ">
        <ul className="chapter-list">
          {catalog.map(chap => (
            <li key={chap.id} className="chapter-item">
              <a 
                href={`#/read/${encodeURIComponent(chap.id)}`} 
                className="chapter-link"
                onClick={() => setCatalogOpen(false)}
              >
                {chap.title}
              </a>
              <div className="chapter-meta">เวลาอ่าน: ~{chap.readTimeMin} นาที</div>
            </li>
          ))}
        </ul>
      </Drawer>

      <Drawer isOpen={worldBibleOpen} onClose={() => setWorldBibleOpen(false)} title="World Bible">
        <WorldBible />
      </Drawer>

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

function Home({ catalog }) {
  const navigate = useNavigate();
  return (
    <div style={{ textAlign: 'center', marginTop: '4rem' }}>
      <h1>Primordium City</h1>
      <p style={{ opacity: 0.8 }}>ยินดีต้อนรับสู่โลกแห่งไซเบอร์และปริศนา</p>
      {catalog.length > 0 && (
        <button 
          onClick={() => navigate(`/read/${encodeURIComponent(catalog[0].id)}`)}
          style={{ 
            marginTop: '2rem', padding: '1rem 2rem', 
            fontSize: '1.2rem', backgroundColor: 'var(--primary-color)', 
            color: 'var(--bg-color)', border: 'none', borderRadius: '8px' 
          }}
        >
          เริ่มอ่านตอนแรก
        </button>
      )}
    </div>
  );
}

function Reader({ catalog }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const chapterId = decodeURIComponent(pathname.split('/read/')[1] || '');
  const [content, setContent] = useState('กำลังโหลดเนื้อหา...');

  // View Transitions API
  const navigateWithTransition = (path) => {
    if (!document.startViewTransition) {
      navigate(path);
      return;
    }
    document.startViewTransition(() => {
      navigate(path);
    });
  };

  useEffect(() => {
    if (chapterId) {
      window.scrollTo(0, 0);
      setContent('กำลังโหลดเนื้อหา...');
      fetch(`/content/${chapterId}`)
        .then(res => {
          if (!res.ok) throw new Error('Not found');
          return res.text();
        })
        .then(text => setContent(text))
        .catch(() => setContent('เกิดข้อผิดพลาดในการโหลดเนื้อหา'));
    }
  }, [chapterId]);

  const currentIndex = catalog.findIndex(c => c.id === chapterId);
  const prevChap = currentIndex > 0 ? catalog[currentIndex - 1] : null;
  const nextChap = currentIndex < catalog.length - 1 ? catalog[currentIndex + 1] : null;

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-in-out' }}>
      <Markdown>{content}</Markdown>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid var(--border-color)' }}>
        {prevChap ? (
          <button 
            onClick={() => navigateWithTransition(`/read/${encodeURIComponent(prevChap.id)}`)}
            style={{ padding: '0.8rem 1.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-color)' }}
          >
            &laquo; ตอนก่อนหน้า
          </button>
        ) : <div></div>}
        
        {nextChap ? (
          <button 
            onClick={() => navigateWithTransition(`/read/${encodeURIComponent(nextChap.id)}`)}
            style={{ padding: '0.8rem 1.5rem', borderRadius: '8px', backgroundColor: 'var(--primary-color)', color: 'var(--bg-color)', border: 'none' }}
          >
            ตอนถัดไป &raquo;
          </button>
        ) : <div></div>}
      </div>
    </div>
  );
}

function WorldBible() {
  const [content, setContent] = useState('Loading...');
  useEffect(() => {
    fetch('/content/WORLD_BIBLE.md')
      .then(res => res.text())
      .then(text => setContent(text))
      .catch(() => setContent('ไม่พบข้อมูล World Bible'));
  }, []);
  
  return <Markdown>{content}</Markdown>;
}

export default App;
