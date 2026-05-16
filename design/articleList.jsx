/* Article list — middle column */

function ArticleList({ articles, feeds, currentView, selectedId, viewMode, sortDesc, hideRead, onSelect, onContextMenu, onHover, onLeaveHover, onToggleHideRead, onToggleSort, onMarkAllRead, listRef }) {
  const feedById = React.useMemo(() => Object.fromEntries(feeds.map(f => [f.id, f])), [feeds]);

  const title = React.useMemo(() => {
    if (currentView.type === 'view') {
      return { all: '全部文章', unread: '未读', starred: '星标', saved: '稍后读' }[currentView.id];
    }
    const f = feedById[currentView.id];
    return f ? f.name : '';
  }, [currentView, feedById]);

  return (
    <div className="list">
      <div className="list-header">
        <h1 className="list-title">
          {title}
          <span className="count">{articles.length} 篇</span>
        </h1>
        <div className="list-meta">
          <button className={`list-meta-btn ${sortDesc ? 'on' : ''}`} onClick={onToggleSort} title="排序">
            <Icon name={sortDesc ? 'arrow-down' : 'arrow-up'} size={12} />
            {sortDesc ? '最新优先' : '最旧优先'}
          </button>
          <button className={`list-meta-btn ${hideRead ? 'on' : ''}`} onClick={onToggleHideRead} title="隐藏已读 (V)">
            <Icon name={hideRead ? 'eye-off' : 'eye'} size={12} />
            {hideRead ? '仅未读' : '全部'}
          </button>
          <div style={{ flex: 1 }} />
          <button className="list-meta-btn" onClick={onMarkAllRead} title="全部标为已读 (⇧A)">
            <Icon name="check-all" size={12} />
            标为已读
          </button>
        </div>
      </div>

      <div className="list-scroll" ref={listRef}>
        {articles.length === 0 ? (
          <div className="empty" style={{height: 240}}>
            <div className="glyph"><Icon name="check" size={22} /></div>
            <div>这里没有文章了 — 享受一下空白</div>
          </div>
        ) : articles.map(a => {
          const feed = feedById[a.feed];
          return (
            <div
              key={a.id}
              className={`art ${viewMode === 'card' ? 'card' : ''} ${selectedId === a.id ? 'active' : ''} ${a.read ? 'read' : ''}`}
              onClick={() => onSelect(a.id)}
              onContextMenu={(e) => onContextMenu(e, { type: 'article', article: a })}
              onMouseEnter={(e) => onHover(a, e)}
              onMouseLeave={onLeaveHover}
            >
              {viewMode === 'card' && (
                <div className="art-thumb">
                  <svg viewBox="0 0 200 112" preserveAspectRatio="xMidYMid slice">
                    <defs>
                      <pattern id={`p-${a.id}`} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(135)">
                        <line x1="0" y1="0" x2="0" y2="8" stroke={feed?.color || '#999'} strokeWidth="1.4" opacity="0.18"/>
                      </pattern>
                    </defs>
                    <rect width="200" height="112" fill={`url(#p-${a.id})`} />
                    <text x="100" y="64" textAnchor="middle" fontSize="32" fontWeight="700" fill={feed?.color || '#999'} opacity="0.55" fontFamily="Inter Tight, sans-serif">
                      {feed?.avatar}
                    </text>
                  </svg>
                </div>
              )}
              <div className="art-head">
                {!a.read && <span className="art-dot" />}
                <span className="art-feed">{feed?.name}</span>
                <span className="art-sep">·</span>
                <span className="art-time">{a.time}</span>
                {a.starred && (
                  <span className="art-star"><Icon name="star-fill" size={12} /></span>
                )}
                {a.saved && !a.starred && (
                  <span className="art-star"><Icon name="bookmark-fill" size={12} /></span>
                )}
              </div>
              <h3 className="art-title">{a.title}</h3>
              <p className="art-snippet">{a.snippet}</p>
            </div>
          );
        })}
        <div style={{ height: 60 }} />
      </div>
    </div>
  );
}

window.ArticleList = ArticleList;
