/* Sidebar — subscriptions, library shortcuts */

function Sidebar({ feeds, folders, currentView, onSelect, articles, onAddFeed, onReorder, onContextMenu, onSearchClick, onOpenSettings }) {
  const [collapsedFolders, setCollapsedFolders] = React.useState({});
  const [dragId, setDragId] = React.useState(null);
  const [dropTarget, setDropTarget] = React.useState(null); // {id, pos: 'above'|'below'}

  // Compute unread counts per feed
  const unreadByFeed = React.useMemo(() => {
    const m = {};
    for (const f of feeds) m[f.id] = 0;
    for (const a of articles) if (!a.read && m[a.feed] != null) m[a.feed]++;
    return m;
  }, [articles, feeds]);

  const totalUnread = Object.values(unreadByFeed).reduce((a, b) => a + b, 0);
  const totalStarred = articles.filter(a => a.starred).length;
  const totalSaved = articles.filter(a => a.saved).length;

  const isActive = (key) => currentView.type === key.type && currentView.id === key.id;

  const handleDragStart = (e, id) => {
    setDragId(id);
    e.dataTransfer.effectAllowed = 'move';
  };
  const handleDragOver = (e, id) => {
    if (!dragId || dragId === id) return;
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = e.clientY - rect.top < rect.height / 2 ? 'above' : 'below';
    setDropTarget({ id, pos });
  };
  const handleDragEnd = () => { setDragId(null); setDropTarget(null); };
  const handleDrop = (e, id) => {
    e.preventDefault();
    if (!dragId || !dropTarget) return;
    onReorder(dragId, dropTarget.id, dropTarget.pos);
    handleDragEnd();
  };

  return (
    <div className="sidebar">
      <div className="titlebar">
        <div className="lights">
          <div className="light r" />
          <div className="light y" />
          <div className="light g" />
        </div>
      </div>

      <div style={{ height: 38 }} />

      <div className="sidebar-search" onClick={onSearchClick}>
        <Icon name="search" size={13} />
        <span>搜索文章</span>
        <kbd>⌘K</kbd>
      </div>

      <div className="sidebar-scroll">
        <div className="sb-section-title">
          <span>资料库</span>
        </div>
        <SbItem icon="inbox"    label="全部文章"   count={articles.length}
                active={isActive({type:'view', id:'all'})}
                onClick={() => onSelect({type:'view', id:'all'})}/>
        <SbItem icon="unread"   label="未读"       count={totalUnread}
                active={isActive({type:'view', id:'unread'})}
                onClick={() => onSelect({type:'view', id:'unread'})}/>
        <SbItem icon="star"     label="星标"       count={totalStarred}
                active={isActive({type:'view', id:'starred'})}
                onClick={() => onSelect({type:'view', id:'starred'})}/>
        <SbItem icon="bookmark" label="稍后读"     count={totalSaved}
                active={isActive({type:'view', id:'saved'})}
                onClick={() => onSelect({type:'view', id:'saved'})}/>

        <div className="sb-section-title">
          <span>订阅源</span>
          <button onClick={onAddFeed} title="添加订阅源">
            <Icon name="plus" size={12} />
          </button>
        </div>

        {folders.map(folder => {
          const feedsInFolder = feeds.filter(f => f.folder === folder.id);
          const collapsed = collapsedFolders[folder.id];
          return (
            <div key={folder.id}>
              <div className={`sb-folder ${collapsed ? 'collapsed' : ''}`}
                   onClick={() => setCollapsedFolders(s => ({...s, [folder.id]: !collapsed}))}>
                <Icon name="chevron-down" size={11} />
                <span>{folder.name}</span>
              </div>
              {!collapsed && feedsInFolder.map(feed => {
                const drop = dropTarget && dropTarget.id === feed.id ? dropTarget.pos : null;
                return (
                  <div
                    key={feed.id}
                    className={`sb-item ${isActive({type:'feed', id:feed.id}) ? 'active' : ''} ${dragId === feed.id ? 'dragging' : ''} ${drop === 'above' ? 'drop-above' : ''} ${drop === 'below' ? 'drop-below' : ''}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, feed.id)}
                    onDragOver={(e) => handleDragOver(e, feed.id)}
                    onDragEnd={handleDragEnd}
                    onDrop={(e) => handleDrop(e, feed.id)}
                    onClick={() => onSelect({type:'feed', id:feed.id})}
                    onContextMenu={(e) => onContextMenu(e, {type:'feed', id:feed.id, feed})}
                  >
                    <span className="sb-feed-avatar" style={{background: feed.color}}>{feed.avatar}</span>
                    <span className="sb-label">{feed.name}</span>
                    {unreadByFeed[feed.id] > 0 && (
                      <span className="sb-count">{unreadByFeed[feed.id]}</span>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}

        <div style={{ height: 30 }} />
      </div>

      <div className="sb-footer">
        <button title="添加订阅源 (⌘N)" onClick={onAddFeed}><Icon name="plus" size={14} /></button>
        <button title="刷新所有"><Icon name="refresh" size={14} /></button>
        <button title="OPML 导入 / 导出"><Icon name="open" size={14} /></button>
        <div className="spacer" />
        <button title="设置 (⌘,)" onClick={onOpenSettings}><Icon name="settings" size={14} /></button>
      </div>
    </div>
  );
}

function SbItem({ icon, label, count, active, onClick }) {
  return (
    <div className={`sb-item ${active ? 'active' : ''}`} onClick={onClick}>
      <span className="sb-ico"><Icon name={icon} size={15} /></span>
      <span className="sb-label">{label}</span>
      {count > 0 && <span className="sb-count">{count}</span>}
    </div>
  );
}

window.Sidebar = Sidebar;
