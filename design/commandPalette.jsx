/* Command palette — Cmd+K */

function CommandPalette({ open, onClose, articles, feeds, onNavigateArticle, onNavigateFeed, onAction }) {
  const [query, setQuery] = React.useState('');
  const [active, setActive] = React.useState(0);
  const inputRef = React.useRef(null);

  React.useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  const items = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const results = [];

    // Always-available actions
    const actions = [
      { id: 'act-mark-read',  group: 'action', icon: 'check-all', label: '将当前列表全部标为已读', hint: '⇧A', action: 'mark-all-read' },
      { id: 'act-toggle-theme', group: 'action', icon: 'globe', label: '切换深色 / 浅色模式', hint: '⇧D', action: 'toggle-theme' },
      { id: 'act-toggle-focus', group: 'action', icon: 'focus', label: '焦点阅读模式', hint: 'F', action: 'toggle-focus' },
      { id: 'act-toggle-ai',  group: 'action', icon: 'sparkle', label: 'AI 摘要当前文章', hint: 'I', action: 'toggle-ai' },
      { id: 'act-refresh',    group: 'action', icon: 'refresh', label: '刷新所有订阅源', hint: '⌘R', action: 'refresh' },
      { id: 'act-add-feed',   group: 'action', icon: 'plus', label: '添加订阅源…', hint: '⌘N', action: 'add-feed' },
      { id: 'act-opml',       group: 'action', icon: 'open', label: 'OPML 导入 / 导出', hint: '', action: 'opml' },
      { id: 'act-settings',   group: 'action', icon: 'settings', label: '打开设置…', hint: '⌘,', action: 'open-settings' },
    ].filter(a => !q || a.label.toLowerCase().includes(q));
    results.push(...actions);

    // Feeds
    const matchedFeeds = feeds.filter(f => !q || f.name.toLowerCase().includes(q) || f.url?.toLowerCase().includes(q))
      .slice(0, 6)
      .map(f => ({
        id: `feed-${f.id}`,
        group: 'feed',
        icon: null,
        feed: f,
        label: f.name,
        hint: f.url,
        action: 'navigate-feed',
        target: f.id,
      }));
    results.push(...matchedFeeds);

    // Articles
    if (q) {
      const matchedArticles = articles.filter(a =>
        a.title.toLowerCase().includes(q) ||
        a.snippet.toLowerCase().includes(q) ||
        (a.tags || []).some(t => t.toLowerCase().includes(q))
      ).slice(0, 8).map(a => ({
        id: `article-${a.id}`,
        group: 'article',
        icon: a.starred ? 'star-fill' : 'rss',
        label: a.title,
        hint: a.time,
        action: 'navigate-article',
        target: a.id,
      }));
      results.push(...matchedArticles);
    }

    return results;
  }, [query, articles, feeds]);

  // Group items
  const grouped = React.useMemo(() => {
    const groups = { action: [], feed: [], article: [] };
    items.forEach(i => groups[i.group].push(i));
    return groups;
  }, [items]);

  // Keep active index in bounds
  React.useEffect(() => {
    if (active >= items.length) setActive(0);
  }, [items.length, active]);

  const handleKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(i => (i + 1) % Math.max(items.length, 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(i => (i - 1 + items.length) % Math.max(items.length, 1)); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      const it = items[active];
      if (!it) return;
      runItem(it);
    }
  };

  const runItem = (it) => {
    if (it.action === 'navigate-article') onNavigateArticle(it.target);
    else if (it.action === 'navigate-feed') onNavigateFeed(it.target);
    else onAction(it.action);
    onClose();
  };

  if (!open) return null;

  let flatIndex = -1;
  const renderGroup = (key, title) => {
    const list = grouped[key];
    if (!list || list.length === 0) return null;
    return (
      <div key={key}>
        <div className="cp-group-title">{title}</div>
        {list.map(it => {
          flatIndex++;
          const isActive = flatIndex === active;
          return (
            <div
              key={it.id}
              className={`cp-item ${isActive ? 'active' : ''}`}
              onMouseEnter={() => setActive(flatIndex)}
              onClick={() => runItem(it)}
            >
              <span className="cp-ico">
                {it.feed ? (
                  <span className="sb-feed-avatar" style={{ background: it.feed.color, width: 18, height: 18, borderRadius: 4 }}>{it.feed.avatar}</span>
                ) : (
                  <Icon name={it.icon || 'rss'} size={15} />
                )}
              </span>
              <span className="cp-label">{it.label}</span>
              {it.hint && <span className="cp-hint">{it.hint}</span>}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="cp-backdrop" onClick={onClose} onKeyDown={handleKey}>
      <div className="cp" onClick={e => e.stopPropagation()}>
        <div className="cp-input">
          <Icon name="search" size={16} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="搜索文章、订阅源，或运行命令…"
          />
          <span className="cp-esc">ESC</span>
        </div>
        <div className="cp-list">
          {items.length === 0 ? (
            <div className="cp-empty">没有结果</div>
          ) : (
            <>
              {renderGroup('action', '操作')}
              {renderGroup('feed', '订阅源')}
              {renderGroup('article', '文章')}
            </>
          )}
        </div>
        <div className="cp-footer">
          <span><kbd>↑</kbd><kbd>↓</kbd> 选择</span>
          <span><kbd>⏎</kbd> 打开</span>
          <span><kbd>esc</kbd> 关闭</span>
          <div style={{flex: 1}} />
          <span>支持文章 · 订阅源 · 命令</span>
        </div>
      </div>
    </div>
  );
}

window.CommandPalette = CommandPalette;
