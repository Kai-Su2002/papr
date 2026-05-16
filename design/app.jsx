/* Main App */

const { FEEDS: INIT_FEEDS, FOLDERS, ARTICLES: INIT_ARTICLES } = window.RSS_DATA;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "light",
  "accent": "clay",
  "density": "cozy",
  "viewMode": "list",
  "useSerif": true,
  "showShortcuts": true
}/*EDITMODE-END*/;

const ACCENTS = {
  clay:   { accent: 'oklch(0.60 0.13 38)',  soft: 'oklch(0.94 0.04 50)',  ink: 'oklch(0.42 0.10 38)',  darkAccent: 'oklch(0.74 0.13 45)',  darkSoft: 'oklch(0.32 0.06 40)',  darkInk: 'oklch(0.80 0.10 45)' },
  pine:   { accent: 'oklch(0.50 0.10 165)', soft: 'oklch(0.94 0.04 160)', ink: 'oklch(0.38 0.08 165)', darkAccent: 'oklch(0.72 0.11 170)', darkSoft: 'oklch(0.30 0.05 165)', darkInk: 'oklch(0.80 0.08 170)' },
  indigo: { accent: 'oklch(0.52 0.14 268)', soft: 'oklch(0.94 0.04 270)', ink: 'oklch(0.40 0.12 268)', darkAccent: 'oklch(0.74 0.13 270)', darkSoft: 'oklch(0.30 0.06 268)', darkInk: 'oklch(0.82 0.10 270)' },
  ink:    { accent: 'oklch(0.30 0.02 50)',  soft: 'oklch(0.92 0.005 50)', ink: 'oklch(0.20 0.01 50)',  darkAccent: 'oklch(0.86 0.005 50)', darkSoft: 'oklch(0.30 0.005 50)', darkInk: 'oklch(0.92 0.005 50)' },
};

function App() {
  const [tw, setTweak] = useTweaks(TWEAK_DEFAULTS);

  // Core state
  const [feeds, setFeeds] = React.useState(INIT_FEEDS);
  const [articles, setArticles] = React.useState(INIT_ARTICLES);
  const [currentView, setCurrentView] = React.useState({ type: 'view', id: 'all' });
  const [selectedId, setSelectedId] = React.useState('a1');
  const [sortDesc, setSortDesc] = React.useState(true);
  const [hideRead, setHideRead] = React.useState(false);
  const [aiOpen, setAiOpen] = React.useState(false);
  const [focusMode, setFocusMode] = React.useState(false);
  const [cpOpen, setCpOpen] = React.useState(false);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [contextMenu, setContextMenu] = React.useState(null);
  const [hoverPreview, setHoverPreview] = React.useState(null);
  const [toast, setToast] = React.useState(null);
  const hoverTimerRef = React.useRef(null);
  const listRef = React.useRef(null);

  // Apply theme/accent/density to root
  React.useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = tw.theme;
    root.dataset.density = tw.density;
    const a = ACCENTS[tw.accent] || ACCENTS.clay;
    if (tw.theme === 'dark') {
      root.style.setProperty('--accent', a.darkAccent);
      root.style.setProperty('--accent-soft', a.darkSoft);
      root.style.setProperty('--accent-ink', a.darkInk);
    } else {
      root.style.setProperty('--accent', a.accent);
      root.style.setProperty('--accent-soft', a.soft);
      root.style.setProperty('--accent-ink', a.ink);
    }
  }, [tw.theme, tw.accent, tw.density]);

  // Derived: filtered + sorted article list
  const filteredArticles = React.useMemo(() => {
    let list = articles;
    if (currentView.type === 'view') {
      if (currentView.id === 'unread')  list = list.filter(a => !a.read);
      if (currentView.id === 'starred') list = list.filter(a => a.starred);
      if (currentView.id === 'saved')   list = list.filter(a => a.saved);
    } else if (currentView.type === 'feed') {
      list = list.filter(a => a.feed === currentView.id);
    }
    if (hideRead && currentView.id !== 'unread') list = list.filter(a => !a.read);
    return sortDesc ? list : [...list].reverse();
  }, [articles, currentView, hideRead, sortDesc]);

  const selectedArticle = articles.find(a => a.id === selectedId);
  const feedById = React.useMemo(() => Object.fromEntries(feeds.map(f => [f.id, f])), [feeds]);

  // Mark as read when selected (skip initial mount)
  const initialMountRef = React.useRef(true);
  React.useEffect(() => {
    if (initialMountRef.current) { initialMountRef.current = false; return; }
    if (!selectedId) return;
    setArticles(prev => prev.map(a => a.id === selectedId ? { ...a, read: true } : a));
  }, [selectedId]);

  // Navigation helpers
  const navAdjacent = (dir) => {
    const idx = filteredArticles.findIndex(a => a.id === selectedId);
    const next = filteredArticles[idx + dir];
    if (next) {
      setSelectedId(next.id);
      // scroll into view in list
      setTimeout(() => {
        const el = listRef.current?.querySelector(`.art.active`);
        if (el && listRef.current) {
          const rect = el.getBoundingClientRect();
          const parentRect = listRef.current.getBoundingClientRect();
          if (rect.top < parentRect.top + 60 || rect.bottom > parentRect.bottom - 40) {
            listRef.current.scrollTop += rect.top - parentRect.top - 80;
          }
        }
      }, 30);
    }
  };

  const showToast = (text, kbd) => {
    setToast({ text, kbd });
    setTimeout(() => setToast(null), 1900);
  };

  const toggleStar = (id) => {
    setArticles(prev => prev.map(a => a.id === id ? { ...a, starred: !a.starred } : a));
  };
  const toggleSave = (id) => {
    setArticles(prev => prev.map(a => a.id === id ? { ...a, saved: !a.saved } : a));
  };
  const markRead = (id, read = true) => {
    setArticles(prev => prev.map(a => a.id === id ? { ...a, read } : a));
  };
  const markAllRead = () => {
    const ids = new Set(filteredArticles.map(a => a.id));
    setArticles(prev => prev.map(a => ids.has(a.id) ? { ...a, read: true } : a));
    showToast(`已将 ${ids.size} 篇标为已读`);
  };
  const toggleTheme = () => {
    setTweak('theme', tw.theme === 'light' ? 'dark' : 'light');
  };

  // Keyboard
  React.useEffect(() => {
    const onKey = (e) => {
      // Don't intercept in inputs
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCpOpen(o => !o);
        return;
      }
      if (mod && e.key === ',') {
        e.preventDefault();
        setSettingsOpen(o => !o);
        return;
      }
      if (mod && e.key.toLowerCase() === 'r') {
        e.preventDefault();
        showToast('正在刷新所有订阅源…');
        return;
      }
      if (mod) return; // skip other modifier combos

      if (cpOpen || contextMenu || settingsOpen) return;

      switch (e.key.toLowerCase()) {
        case 'j': e.preventDefault(); navAdjacent(1); break;
        case 'k': e.preventDefault(); navAdjacent(-1); break;
        case 'o': e.preventDefault(); if (selectedArticle) showToast('已在浏览器中打开'); break;
        case 's': e.preventDefault(); if (selectedArticle) { toggleStar(selectedArticle.id); showToast(selectedArticle.starred ? '已取消星标' : '已星标', 'S'); } break;
        case 'b': e.preventDefault(); if (selectedArticle) { toggleSave(selectedArticle.id); showToast(selectedArticle.saved ? '已从稍后读移除' : '已加入稍后读', 'B'); } break;
        case 'i': e.preventDefault(); setAiOpen(o => !o); break;
        case 'f': e.preventDefault(); setFocusMode(f => !f); break;
        case 'v': e.preventDefault(); setHideRead(h => !h); break;
        case 'a': if (e.shiftKey) { e.preventDefault(); markAllRead(); } break;
        case 'd': if (e.shiftKey) { e.preventDefault(); toggleTheme(); } break;
        case 'escape': setFocusMode(false); setAiOpen(false); break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [filteredArticles, selectedId, selectedArticle, cpOpen, contextMenu, tw.theme]);

  // Reorder
  const handleReorder = (dragId, targetId, pos) => {
    setFeeds(prev => {
      const arr = [...prev];
      const fromIdx = arr.findIndex(f => f.id === dragId);
      const dragItem = arr[fromIdx];
      arr.splice(fromIdx, 1);
      let toIdx = arr.findIndex(f => f.id === targetId);
      if (pos === 'below') toIdx += 1;
      arr.splice(toIdx, 0, dragItem);
      return arr;
    });
  };

  // Context menu
  const openContext = (e, payload) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, payload });
  };
  const closeContext = () => setContextMenu(null);

  // Hover preview (article list)
  const onHover = (article, e) => {
    clearTimeout(hoverTimerRef.current);
    const rect = e.currentTarget.getBoundingClientRect();
    hoverTimerRef.current = setTimeout(() => {
      setHoverPreview({ article, top: rect.top + 4, left: rect.right + 12 });
    }, 650);
  };
  const onLeaveHover = () => {
    clearTimeout(hoverTimerRef.current);
    setHoverPreview(null);
  };

  // Command palette actions
  const handleCpAction = (action) => {
    if (action === 'mark-all-read') markAllRead();
    else if (action === 'toggle-theme') toggleTheme();
    else if (action === 'toggle-focus') setFocusMode(f => !f);
    else if (action === 'toggle-ai') setAiOpen(o => !o);
    else if (action === 'refresh') showToast('正在刷新所有订阅源…');
    else if (action === 'add-feed') showToast('打开"添加订阅源"…');
    else if (action === 'opml') showToast('OPML 导入 / 导出');
    else if (action === 'open-settings') setSettingsOpen(true);
  };
  const navigateArticle = (id) => {
    const article = articles.find(a => a.id === id);
    if (!article) return;
    setCurrentView({ type: 'feed', id: article.feed });
    setSelectedId(id);
  };
  const navigateFeed = (id) => {
    setCurrentView({ type: 'feed', id });
    const first = articles.find(a => a.feed === id);
    if (first) setSelectedId(first.id);
  };

  return (
    <>
      <div className={`window ${focusMode ? 'focus' : ''}`} onClick={closeContext}>
        <Sidebar
          feeds={feeds}
          folders={FOLDERS}
          currentView={currentView}
          articles={articles}
          onSelect={(v) => { setCurrentView(v); /* clear selected if not in new view */ }}
          onAddFeed={() => showToast('打开"添加订阅源"…')}
          onReorder={handleReorder}
          onContextMenu={openContext}
          onSearchClick={() => setCpOpen(true)}
          onOpenSettings={() => setSettingsOpen(true)}
        />
        <ArticleList
          articles={filteredArticles}
          feeds={feeds}
          currentView={currentView}
          selectedId={selectedId}
          viewMode={tw.viewMode}
          sortDesc={sortDesc}
          hideRead={hideRead}
          onSelect={setSelectedId}
          onContextMenu={openContext}
          onHover={onHover}
          onLeaveHover={onLeaveHover}
          onToggleHideRead={() => setHideRead(h => !h)}
          onToggleSort={() => setSortDesc(s => !s)}
          onMarkAllRead={markAllRead}
          listRef={listRef}
        />
        <Reader
          article={selectedArticle}
          feed={selectedArticle ? feedById[selectedArticle.feed] : null}
          useSerif={tw.useSerif}
          focusMode={focusMode}
          aiOpen={aiOpen}
          onToggleStar={() => selectedArticle && toggleStar(selectedArticle.id)}
          onToggleSave={() => selectedArticle && toggleSave(selectedArticle.id)}
          onToggleAI={() => setAiOpen(o => !o)}
          onToggleFocus={() => setFocusMode(f => !f)}
          onOpenExternal={() => showToast('已在浏览器中打开', 'O')}
        />

        {hoverPreview && <HoverPreview {...hoverPreview} feeds={feeds} />}
      </div>

      <CommandPalette
        open={cpOpen}
        onClose={() => setCpOpen(false)}
        articles={articles}
        feeds={feeds}
        onNavigateArticle={navigateArticle}
        onNavigateFeed={navigateFeed}
        onAction={handleCpAction}
      />

      <Settings
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        tw={tw}
        setTweak={setTweak}
        feeds={feeds}
        articles={articles}
        onShowToast={(text) => showToast(text)}
      />

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          payload={contextMenu.payload}
          onClose={closeContext}
          onAction={(action) => {
            const p = contextMenu.payload;
            if (p.type === 'article') {
              const a = p.article;
              if (action === 'open') { setSelectedId(a.id); }
              else if (action === 'star') toggleStar(a.id);
              else if (action === 'save') toggleSave(a.id);
              else if (action === 'mark-read') markRead(a.id, !a.read);
              else if (action === 'open-ext') showToast('已在浏览器中打开');
              else if (action === 'copy-link') showToast('链接已复制');
              else if (action === 'share') showToast('打开分享…');
            } else if (p.type === 'feed') {
              if (action === 'mark-feed-read') {
                setArticles(prev => prev.map(x => x.feed === p.id ? { ...x, read: true } : x));
                showToast(`已将 ${p.feed.name} 全部标为已读`);
              } else if (action === 'feed-settings') showToast(`${p.feed.name} 的设置`);
              else if (action === 'mute') showToast(`已静音 ${p.feed.name}`);
              else if (action === 'unsubscribe') showToast(`已退订 ${p.feed.name}`);
            }
            closeContext();
          }}
        />
      )}

      {toast && (
        <div className="toast" key={Date.now()}>
          {toast.text}
          {toast.kbd && <kbd>{toast.kbd}</kbd>}
        </div>
      )}

      <RssTweaksPanel tw={tw} setTweak={setTweak} />
    </>
  );
}

// ─── Hover preview ───────────────────────────────────────────
function HoverPreview({ article, top, left, feeds }) {
  const feed = feeds.find(f => f.id === article.feed);
  // Keep inside viewport
  const adjLeft = Math.min(left, window.innerWidth - 360);
  const adjTop = Math.min(top, window.innerHeight - 200);
  return (
    <div className="hover-preview" style={{ top: adjTop, left: adjLeft }}>
      <div className="hp-feed">{feed?.name}</div>
      <div className="hp-title">{article.title}</div>
      <div className="hp-body">{article.snippet}</div>
      <div className="hp-meta">{article.author} · {article.date}</div>
    </div>
  );
}

// ─── Context menu ────────────────────────────────────────────
function ContextMenu({ x, y, payload, onClose, onAction }) {
  const ref = React.useRef(null);
  const [pos, setPos] = React.useState({ left: x, top: y });

  React.useEffect(() => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    let left = x, top = y;
    if (left + rect.width > window.innerWidth - 8) left = window.innerWidth - rect.width - 8;
    if (top + rect.height > window.innerHeight - 8) top = window.innerHeight - rect.height - 8;
    setPos({ left, top });
  }, [x, y]);

  React.useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    setTimeout(() => document.addEventListener('mousedown', handler), 0);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  if (payload.type === 'article') {
    const a = payload.article;
    return (
      <div className="ctx-menu" ref={ref} style={{ left: pos.left, top: pos.top }}>
        <div className="ctx-item" onClick={() => onAction('open')}>
          <span className="ctx-ico"><Icon name="open" size={13} /></span>
          打开
          <span className="ctx-shortcut">⏎</span>
        </div>
        <div className="ctx-item" onClick={() => onAction('open-ext')}>
          <span className="ctx-ico"><Icon name="globe" size={13} /></span>
          在浏览器中打开
          <span className="ctx-shortcut">⌘O</span>
        </div>
        <div className="ctx-sep" />
        <div className="ctx-item" onClick={() => onAction('star')}>
          <span className="ctx-ico"><Icon name={a.starred ? 'star-fill' : 'star'} size={13} /></span>
          {a.starred ? '取消星标' : '星标'}
          <span className="ctx-shortcut">S</span>
        </div>
        <div className="ctx-item" onClick={() => onAction('save')}>
          <span className="ctx-ico"><Icon name={a.saved ? 'bookmark-fill' : 'bookmark'} size={13} /></span>
          {a.saved ? '从稍后读移除' : '加入稍后读'}
          <span className="ctx-shortcut">B</span>
        </div>
        <div className="ctx-item" onClick={() => onAction('mark-read')}>
          <span className="ctx-ico"><Icon name={a.read ? 'circle' : 'check'} size={13} /></span>
          {a.read ? '标为未读' : '标为已读'}
          <span className="ctx-shortcut">U</span>
        </div>
        <div className="ctx-sep" />
        <div className="ctx-item" onClick={() => onAction('copy-link')}>
          <span className="ctx-ico"><Icon name="copy" size={13} /></span>
          复制链接
        </div>
        <div className="ctx-item" onClick={() => onAction('share')}>
          <span className="ctx-ico"><Icon name="share" size={13} /></span>
          分享…
        </div>
      </div>
    );
  }

  // Feed context menu
  return (
    <div className="ctx-menu" ref={ref} style={{ left: pos.left, top: pos.top }}>
      <div className="ctx-item" onClick={() => onAction('mark-feed-read')}>
        <span className="ctx-ico"><Icon name="check-all" size={13} /></span>
        全部标为已读
      </div>
      <div className="ctx-item" onClick={() => onAction('feed-settings')}>
        <span className="ctx-ico"><Icon name="settings" size={13} /></span>
        订阅源设置…
      </div>
      <div className="ctx-sep" />
      <div className="ctx-item" onClick={() => onAction('mute')}>
        <span className="ctx-ico"><Icon name="mute" size={13} /></span>
        静音
      </div>
      <div className="ctx-item" onClick={() => onAction('unsubscribe')}>
        <span className="ctx-ico"><Icon name="trash" size={13} /></span>
        退订
      </div>
    </div>
  );
}

// ─── Tweaks panel ────────────────────────────────────────────
function RssTweaksPanel({ tw, setTweak }) {
  return (
    <TweaksPanel>
      <TweakSection label="外观" />
      <TweakRadio
        label="主题"
        value={tw.theme}
        options={[{label:'浅色', value:'light'}, {label:'深色', value:'dark'}]}
        onChange={v => setTweak('theme', v)}
      />
      <TweakColor
        label="强调色"
        value={tw.accent}
        options={[
          { label: 'clay',   value: 'clay',   color: '#bb6743' },
          { label: 'pine',   value: 'pine',   color: '#3d7a5e' },
          { label: 'indigo', value: 'indigo', color: '#5a5fc4' },
          { label: 'ink',    value: 'ink',    color: '#2b2620' },
        ]}
        onChange={v => setTweak('accent', v)}
      />
      <TweakSection label="布局" />
      <TweakRadio
        label="密度"
        value={tw.density}
        options={[{label:'紧凑', value:'compact'}, {label:'适中', value:'cozy'}, {label:'宽松', value:'spacious'}]}
        onChange={v => setTweak('density', v)}
      />
      <TweakRadio
        label="列表视图"
        value={tw.viewMode}
        options={[{label:'列表', value:'list'}, {label:'卡片', value:'card'}]}
        onChange={v => setTweak('viewMode', v)}
      />
      <TweakSection label="阅读区" />
      <TweakToggle
        label="正文用衬线字体"
        value={tw.useSerif}
        onChange={v => setTweak('useSerif', v)}
      />
    </TweaksPanel>
  );
}

// Custom TweakColor — accept color swatches as options
function TweakColor({ label, value, options, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0' }}>
      <span style={{ fontSize: 12, color: '#666' }}>{label}</span>
      <div style={{ display: 'flex', gap: 6 }}>
        {options.map(o => (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            title={o.label}
            style={{
              width: 22, height: 22,
              borderRadius: 11,
              background: o.color,
              border: value === o.value ? '2px solid #fff' : '2px solid transparent',
              outline: value === o.value ? '1.5px solid #888' : '1px solid rgba(0,0,0,0.12)',
              cursor: 'pointer',
              padding: 0,
            }}
          />
        ))}
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
