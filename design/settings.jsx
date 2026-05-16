/* Settings — macOS-style preferences modal */

const SETTINGS_SECTIONS = [
  { id: 'general',       label: '通用',     icon: 'settings',  color: '#7a756c' },
  { id: 'appearance',    label: '外观',     icon: 'globe',     color: '#bb6743' },
  { id: 'reading',       label: '阅读',     icon: 'eye',       color: '#3a4cb8' },
  { id: 'subscriptions', label: '订阅',     icon: 'rss',       color: '#d97706' },
  { id: 'sync',          label: '同步',     icon: 'refresh',   color: '#2c8a3e' },
  { id: 'shortcuts',     label: '快捷键',   icon: 'command',   color: '#5a5fc4' },
  { id: 'notifications', label: '通知',     icon: 'inbox',     color: '#a8501f' },
  { id: 'advanced',      label: '高级',     icon: 'sort',      color: '#4a4a4a' },
  { id: 'about',         label: '关于',     icon: 'sparkle',   color: '#111' },
];

function Settings({ open, onClose, tw, setTweak, feeds, articles, onShowToast }) {
  const [section, setSection] = React.useState('general');

  // Esc to close
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose(); }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [open, onClose]);

  if (!open) return null;

  const currentSection = SETTINGS_SECTIONS.find(s => s.id === section);

  return (
    <div className="settings-backdrop" onClick={onClose}>
      <div className="settings-window" onClick={e => e.stopPropagation()}>
        <div className="settings-sidebar">
          <div className="settings-sidebar-title">
            设置
            <span className="badge">⌘,</span>
          </div>
          {SETTINGS_SECTIONS.map(s => (
            <div
              key={s.id}
              className={`settings-nav-item ${section === s.id ? 'active' : ''}`}
              onClick={() => setSection(s.id)}
            >
              <span className="nav-ico" style={{background: s.color}}>
                <Icon name={s.icon} size={11} color="#fff" />
              </span>
              {s.label}
            </div>
          ))}
          <div className="settings-nav-spacer" />
          <div className="settings-version">Reader 2.4.1 · macOS</div>
        </div>

        <div className="settings-content">
          <div className="settings-header">
            <h2>{currentSection.label}</h2>
            <span className="sub">{
              { general: '订阅源刷新、默认行为、启动方式',
                appearance: '主题、强调色、密度',
                reading: '正文字体、字号、版面',
                subscriptions: `${feeds.length} 个订阅源 · ${articles.length} 篇文章`,
                sync: '云端同步与第三方服务',
                shortcuts: '键盘快捷键 · 共 18 个',
                notifications: '新文章提醒与角标',
                advanced: '缓存、网络、实验功能',
                about: '版本信息与致谢',
              }[section]
            }</span>
          </div>
          <button className="settings-close" onClick={onClose} title="关闭 (Esc)">
            <Icon name="x" size={15} />
          </button>

          <div className="settings-scroll">
            {section === 'general'       && <GeneralSection tw={tw} setTweak={setTweak} />}
            {section === 'appearance'    && <AppearanceSection tw={tw} setTweak={setTweak} />}
            {section === 'reading'       && <ReadingSection tw={tw} setTweak={setTweak} />}
            {section === 'subscriptions' && <SubscriptionsSection feeds={feeds} onShowToast={onShowToast} />}
            {section === 'sync'          && <SyncSection onShowToast={onShowToast} />}
            {section === 'shortcuts'     && <ShortcutsSection />}
            {section === 'notifications' && <NotificationsSection />}
            {section === 'advanced'      && <AdvancedSection onShowToast={onShowToast} />}
            {section === 'about'         && <AboutSection />}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Row helpers ───
function Row({ label, desc, children }) {
  return (
    <div className="settings-row">
      <div className="settings-row-text">
        <div className="settings-row-label">{label}</div>
        {desc && <div className="settings-row-desc">{desc}</div>}
      </div>
      <div className="settings-row-control">{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange }) {
  return <input type="checkbox" className="s-toggle" checked={checked} onChange={e => onChange(e.target.checked)} />;
}

function Select({ value, options, onChange }) {
  return (
    <select className="s-select" value={value} onChange={e => onChange(e.target.value)}>
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

function Segmented({ value, options, onChange }) {
  return (
    <div className="s-seg">
      {options.map(o => (
        <button key={o.value} className={value === o.value ? 'on' : ''} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Slider({ value, min, max, step = 1, unit = '', onChange }) {
  return (
    <>
      <input type="range" className="s-slider" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} />
      <span className="s-value">{value}{unit}</span>
    </>
  );
}

// ─── General ───
function GeneralSection({ tw, setTweak }) {
  const [autoRefresh, setAutoRefresh] = React.useState(true);
  const [refreshMins, setRefreshMins] = React.useState(15);
  const [markReadOnScroll, setMarkReadOnScroll] = React.useState(false);
  const [markReadOnOpen, setMarkReadOnOpen] = React.useState(true);
  const [launchAtLogin, setLaunchAtLogin] = React.useState(false);
  const [defaultView, setDefaultView] = React.useState('unread');
  const [hideReadDefault, setHideReadDefault] = React.useState(false);

  return (
    <>
      <div className="settings-group">
        <h3 className="settings-group-title">刷新</h3>
        <Row label="自动刷新" desc="后台定期检查订阅源更新">
          <Toggle checked={autoRefresh} onChange={setAutoRefresh} />
        </Row>
        <Row label="刷新间隔" desc="时间越短，电池消耗越大">
          <Slider value={refreshMins} min={5} max={120} step={5} unit=" 分钟" onChange={setRefreshMins} />
        </Row>
      </div>

      <div className="settings-group">
        <h3 className="settings-group-title">已读行为</h3>
        <Row label="打开文章时标为已读">
          <Toggle checked={markReadOnOpen} onChange={setMarkReadOnOpen} />
        </Row>
        <Row label="滚动到底部时标为已读" desc="适合快速浏览长列表">
          <Toggle checked={markReadOnScroll} onChange={setMarkReadOnScroll} />
        </Row>
      </div>

      <div className="settings-group">
        <h3 className="settings-group-title">启动</h3>
        <Row label="开机自启动">
          <Toggle checked={launchAtLogin} onChange={setLaunchAtLogin} />
        </Row>
        <Row label="启动时打开">
          <Select value={defaultView} options={[
            {value:'all', label:'全部文章'},
            {value:'unread', label:'未读'},
            {value:'starred', label:'星标'},
            {value:'last', label:'上次的位置'},
          ]} onChange={setDefaultView} />
        </Row>
        <Row label="启动时隐藏已读">
          <Toggle checked={hideReadDefault} onChange={setHideReadDefault} />
        </Row>
      </div>
    </>
  );
}

// ─── Appearance ───
function AppearanceSection({ tw, setTweak }) {
  const accents = [
    { value: 'clay',   color: '#bb6743', label: '陶土' },
    { value: 'pine',   color: '#3d7a5e', label: '松绿' },
    { value: 'indigo', color: '#5a5fc4', label: '靛蓝' },
    { value: 'ink',    color: '#2b2620', label: '墨色' },
  ];
  return (
    <>
      <div className="settings-group">
        <h3 className="settings-group-title">主题</h3>
        <Row label="外观" desc="影响整个应用的明暗">
          <Segmented value={tw.theme} options={[
            {value:'light', label:'浅色'},
            {value:'dark', label:'深色'},
            {value:'auto', label:'跟随系统'},
          ]} onChange={v => setTweak('theme', v === 'auto' ? 'light' : v)} />
        </Row>
        <Row label="强调色" desc="链接、星标和强调元素">
          <div className="s-swatches">
            {accents.map(a => (
              <button
                key={a.value}
                className={`s-swatch ${tw.accent === a.value ? 'on' : ''}`}
                style={{background: a.color}}
                onClick={() => setTweak('accent', a.value)}
                title={a.label}
              />
            ))}
          </div>
        </Row>
      </div>

      <div className="settings-group">
        <h3 className="settings-group-title">布局</h3>
        <Row label="信息密度" desc="影响列表行高与间距">
          <Segmented value={tw.density} options={[
            {value:'compact', label:'紧凑'},
            {value:'cozy', label:'适中'},
            {value:'spacious', label:'宽松'},
          ]} onChange={v => setTweak('density', v)} />
        </Row>
        <Row label="文章列表样式">
          <Segmented value={tw.viewMode} options={[
            {value:'list', label:'列表'},
            {value:'card', label:'卡片'},
          ]} onChange={v => setTweak('viewMode', v)} />
        </Row>
      </div>

      <div className="settings-group">
        <h3 className="settings-group-title">细节</h3>
        <Row label="侧栏显示未读计数">
          <Toggle checked={true} onChange={() => {}} />
        </Row>
        <Row label="文章卡片显示缩略图" desc="仅在卡片视图下生效">
          <Toggle checked={true} onChange={() => {}} />
        </Row>
        <Row label="减少动效" desc="符合系统的 Reduce Motion 偏好">
          <Toggle checked={false} onChange={() => {}} />
        </Row>
      </div>
    </>
  );
}

// ─── Reading ───
function ReadingSection({ tw, setTweak }) {
  const [fontSize, setFontSize] = React.useState(17);
  const [lineHeight, setLineHeight] = React.useState(165);
  const [maxWidth, setMaxWidth] = React.useState(680);
  const [linkBehavior, setLinkBehavior] = React.useState('browser');

  // Live preview controls actually affect the reader
  React.useEffect(() => {
    const r = document.documentElement.style;
    r.setProperty('--reader-size', fontSize + 'px');
    r.setProperty('--reader-leading', (lineHeight / 100));
    r.setProperty('--reader-width', maxWidth + 'px');
  }, [fontSize, lineHeight, maxWidth]);

  return (
    <>
      <div className="settings-group">
        <h3 className="settings-group-title">字体</h3>
        <Row label="正文字体">
          <Segmented value={tw.useSerif ? 'serif' : 'sans'} options={[
            {value:'serif', label:'衬线'},
            {value:'sans', label:'无衬线'},
          ]} onChange={v => setTweak('useSerif', v === 'serif')} />
        </Row>
        <Row label="字号">
          <Slider value={fontSize} min={14} max={22} unit="px" onChange={setFontSize} />
        </Row>
        <Row label="行高">
          <Slider value={lineHeight} min={130} max={200} step={5} unit="%" onChange={setLineHeight} />
        </Row>
      </div>

      <div className="settings-group">
        <h3 className="settings-group-title">版面</h3>
        <Row label="正文最大宽度">
          <Slider value={maxWidth} min={520} max={840} step={20} unit="px" onChange={setMaxWidth} />
        </Row>
        <Row label="两端对齐" desc="对中文/英文混排可能会有空隙">
          <Toggle checked={false} onChange={() => {}} />
        </Row>
        <Row label="显示标签">
          <Toggle checked={true} onChange={() => {}} />
        </Row>
        <Row label="显示预计阅读时间">
          <Toggle checked={true} onChange={() => {}} />
        </Row>
      </div>

      <div className="settings-group">
        <h3 className="settings-group-title">链接</h3>
        <Row label="在哪里打开链接">
          <Select value={linkBehavior} options={[
            {value:'browser', label:'默认浏览器'},
            {value:'reader', label:'在阅读器内打开'},
            {value:'inapp', label:'内嵌网页视图'},
          ]} onChange={setLinkBehavior} />
        </Row>
      </div>
    </>
  );
}

// ─── Subscriptions ───
function SubscriptionsSection({ feeds, onShowToast }) {
  const [search, setSearch] = React.useState('');
  const filtered = feeds.filter(f => !search || f.name.toLowerCase().includes(search.toLowerCase()));
  return (
    <>
      <div className="settings-group" style={{marginBottom: 18}}>
        <div style={{display:'flex', gap: 8, alignItems:'center', marginBottom: 12}}>
          <div style={{
            flex: 1, display:'flex', alignItems:'center', gap: 8,
            padding: '6px 10px', borderRadius: 7,
            border: '1px solid var(--hair-strong)',
            background: 'var(--panel)',
          }}>
            <Icon name="search" size={13} color="var(--muted)" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="在订阅源中查找…"
              style={{
                flex: 1, border: 0, outline: 0, background: 'transparent',
                fontFamily: 'inherit', fontSize: 12.5, color: 'var(--ink)',
              }}
            />
          </div>
          <button className="s-btn" onClick={() => onShowToast('OPML 已导入')}>
            <Icon name="arrow-down" size={12} /> 导入 OPML
          </button>
          <button className="s-btn" onClick={() => onShowToast('OPML 已导出到下载文件夹')}>
            <Icon name="arrow-up" size={12} /> 导出
          </button>
          <button className="s-btn primary" onClick={() => onShowToast('打开"添加订阅源"…')}>
            <Icon name="plus" size={12} /> 添加
          </button>
        </div>
      </div>

      <div className="settings-group">
        <h3 className="settings-group-title">订阅源 · {filtered.length} 个</h3>
        <div>
          {filtered.map(f => (
            <div key={f.id} className="s-feed-row">
              <span className="sb-feed-avatar" style={{background: f.color, width: 22, height: 22, borderRadius: 5}}>{f.avatar}</span>
              <span className="name">{f.name}</span>
              <span className="url">{f.url}</span>
              <div className="actions">
                <button className="icon-btn" title="设置" onClick={() => onShowToast(`${f.name} 的设置`)}>
                  <Icon name="settings" size={13} />
                </button>
                <button className="icon-btn" title="静音" onClick={() => onShowToast(`已静音 ${f.name}`)}>
                  <Icon name="mute" size={13} />
                </button>
                <button className="icon-btn" title="退订" onClick={() => onShowToast(`已退订 ${f.name}`)}>
                  <Icon name="trash" size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ─── Sync ───
function SyncSection({ onShowToast }) {
  const services = [
    { id: 'icloud',    name: 'iCloud',    color: '#0089E0', initial: '☁', desc: '在你的 Apple 设备之间同步订阅、星标和已读状态。', connected: true },
    { id: 'feedly',    name: 'Feedly',    color: '#2BB24C', initial: 'F', desc: '同步到 Feedly 账户。需要付费订阅以解锁全功能。', connected: false },
    { id: 'inoreader', name: 'Inoreader', color: '#1976D2', initial: 'I', desc: '同步到 Inoreader 账户。免费账户支持基础同步。', connected: false },
    { id: 'fresh',     name: 'FreshRSS',  color: '#4A4A4A', initial: '⚡', desc: '自建 FreshRSS 服务器。需要填写 API 地址。', connected: false },
  ];
  return (
    <>
      <div className="settings-group">
        <h3 className="settings-group-title">同步服务</h3>
        {services.map(s => (
          <div key={s.id} className="s-service">
            <div className="logo" style={{background: s.color}}>{s.initial}</div>
            <div className="info">
              <div className="title">{s.name}</div>
              <div className="desc">{s.desc}</div>
            </div>
            <span className={`status ${s.connected ? 'on' : ''}`}>
              {s.connected ? '已连接' : '未连接'}
            </span>
            <button className="s-btn" onClick={() => onShowToast(s.connected ? `已断开 ${s.name}` : `正在连接 ${s.name}…`)}>
              {s.connected ? '断开' : '连接…'}
            </button>
          </div>
        ))}
      </div>

      <div className="settings-group">
        <h3 className="settings-group-title">同步内容</h3>
        <Row label="同步星标"><Toggle checked={true} onChange={() => {}} /></Row>
        <Row label="同步稍后读"><Toggle checked={true} onChange={() => {}} /></Row>
        <Row label="同步已读状态"><Toggle checked={true} onChange={() => {}} /></Row>
        <Row label="同步设备间设置" desc="包括外观、阅读偏好、快捷键"><Toggle checked={false} onChange={() => {}} /></Row>
      </div>
    </>
  );
}

// ─── Shortcuts ───
function ShortcutsSection() {
  const groups = [
    { title: '导航', items: [
      { desc: '下一篇',           keys: ['J'] },
      { desc: '上一篇',           keys: ['K'] },
      { desc: '打开当前文章',     keys: ['O'] },
      { desc: '在浏览器中打开',   keys: ['⌘', 'O'] },
      { desc: '回到列表',         keys: ['Esc'] },
    ]},
    { title: '操作', items: [
      { desc: '星标',             keys: ['S'] },
      { desc: '稍后读',           keys: ['B'] },
      { desc: '标为已读 / 未读',  keys: ['U'] },
      { desc: '当前列表全标已读', keys: ['⇧', 'A'] },
      { desc: '复制链接',         keys: ['⌘', '⇧', 'C'] },
    ]},
    { title: '视图', items: [
      { desc: '焦点阅读',         keys: ['F'] },
      { desc: 'AI 摘要',          keys: ['I'] },
      { desc: '隐藏已读',         keys: ['V'] },
      { desc: '切换深 / 浅色',    keys: ['⇧', 'D'] },
      { desc: '切换侧栏',         keys: ['⌘', '\\'] },
    ]},
    { title: '全局', items: [
      { desc: '命令面板',         keys: ['⌘', 'K'] },
      { desc: '搜索',             keys: ['⌘', 'F'] },
      { desc: '刷新所有订阅源',   keys: ['⌘', 'R'] },
      { desc: '添加订阅源',       keys: ['⌘', 'N'] },
      { desc: '设置',             keys: ['⌘', ','] },
    ]},
  ];
  return (
    <>
      {groups.map(g => (
        <div className="settings-group" key={g.title}>
          <h3 className="settings-group-title">{g.title}</h3>
          <div className="s-shortcuts">
            {g.items.map((it, i) => (
              <div className="s-shortcut" key={i}>
                <span className="desc">{it.desc}</span>
                <span className="keys">
                  {it.keys.map((k, j) => <span className="s-key" key={j}>{k}</span>)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

// ─── Notifications ───
function NotificationsSection() {
  const [enabled, setEnabled] = React.useState(true);
  const [showBadge, setShowBadge] = React.useState(true);
  const [perFeed, setPerFeed] = React.useState('starred');
  const [sound, setSound] = React.useState(false);
  return (
    <>
      <div className="settings-group">
        <h3 className="settings-group-title">系统通知</h3>
        <Row label="允许通知" desc="新文章到达时显示系统通知">
          <Toggle checked={enabled} onChange={setEnabled} />
        </Row>
        <Row label="显示 Dock 角标计数">
          <Toggle checked={showBadge} onChange={setShowBadge} />
        </Row>
        <Row label="通知声音">
          <Toggle checked={sound} onChange={setSound} />
        </Row>
      </div>

      <div className="settings-group">
        <h3 className="settings-group-title">通知哪些订阅源</h3>
        <Row label="范围" desc="可在订阅源设置中单独开启或屏蔽">
          <Select value={perFeed} options={[
            {value:'all', label:'全部订阅源'},
            {value:'starred', label:'仅已标记重要的订阅源'},
            {value:'none', label:'不通知'},
          ]} onChange={setPerFeed} />
        </Row>
      </div>

      <div className="settings-group">
        <h3 className="settings-group-title">勿扰</h3>
        <Row label="夜间勿扰" desc="22:00 — 08:00 之间不显示通知">
          <Toggle checked={true} onChange={() => {}} />
        </Row>
        <Row label="专注模式时静音" desc="跟随系统专注模式">
          <Toggle checked={true} onChange={() => {}} />
        </Row>
      </div>
    </>
  );
}

// ─── Advanced ───
function AdvancedSection({ onShowToast }) {
  const total = 412;
  const articles = 218;
  const images = 168;
  const cache = total - articles - images;
  const pct = v => `${(v / total * 100).toFixed(0)}%`;
  return (
    <>
      <div className="settings-group">
        <h3 className="settings-group-title">存储</h3>
        <div className="settings-row">
          <div className="settings-row-text" style={{flex: 1}}>
            <div className="settings-row-label">数据占用</div>
            <div className="s-bar">
              <span style={{width: pct(articles), background: 'var(--accent)'}} />
              <span style={{width: pct(images), background: 'oklch(0.70 0.10 220)'}} />
              <span style={{width: pct(cache), background: 'oklch(0.55 0.02 50)'}} />
            </div>
            <div className="s-legend">
              <span><i style={{background: 'var(--accent)'}} />文章 {articles} MB</span>
              <span><i style={{background: 'oklch(0.70 0.10 220)'}} />图片 {images} MB</span>
              <span><i style={{background: 'oklch(0.55 0.02 50)'}} />缓存 {cache} MB</span>
            </div>
          </div>
        </div>
        <Row label="保留文章时长" desc="超出时间后会自动清理（星标和稍后读除外）">
          <Select value="90" options={[
            {value:'30', label:'30 天'},
            {value:'90', label:'90 天'},
            {value:'180', label:'180 天'},
            {value:'forever', label:'永久保留'},
          ]} onChange={() => {}} />
        </Row>
        <Row label="清空图片缓存" desc="不会影响文章本身">
          <button className="s-btn" onClick={() => onShowToast(`已清空 ${images} MB 图片缓存`)}>清空</button>
        </Row>
      </div>

      <div className="settings-group">
        <h3 className="settings-group-title">网络</h3>
        <Row label="代理">
          <Select value="system" options={[
            {value:'system', label:'跟随系统'},
            {value:'none', label:'不使用代理'},
            {value:'custom', label:'自定义…'},
          ]} onChange={() => {}} />
        </Row>
        <Row label="并发请求数" desc="一次最多同时刷新几个订阅源">
          <Slider value={6} min={1} max={16} onChange={() => {}} />
        </Row>
        <Row label="请求超时">
          <Slider value={30} min={5} max={120} unit=" 秒" onChange={() => {}} />
        </Row>
      </div>

      <div className="settings-group">
        <h3 className="settings-group-title">实验功能</h3>
        <Row label="本地 AI 摘要" desc="使用本地模型生成摘要，无需联网">
          <Toggle checked={true} onChange={() => {}} />
        </Row>
        <Row label="自动翻译" desc="将非默认语言文章翻译为中文">
          <Toggle checked={false} onChange={() => {}} />
        </Row>
        <Row label="智能去重" desc="折叠重复推送的相同文章">
          <Toggle checked={true} onChange={() => {}} />
        </Row>
      </div>

      <div className="settings-group">
        <h3 className="settings-group-title">危险操作</h3>
        <Row label="重置所有设置" desc="不会删除你的订阅和文章">
          <button className="s-btn" onClick={() => onShowToast('已恢复默认设置')}>恢复默认</button>
        </Row>
        <Row label="清除全部本地数据" desc="此操作不可撤销 — 请先导出 OPML">
          <button className="s-btn danger" onClick={() => onShowToast('请先二次确认')}>清除…</button>
        </Row>
      </div>
    </>
  );
}

// ─── About ───
function AboutSection() {
  return (
    <div className="s-about">
      <div className="mark">
        <Icon name="rss" size={32} color="#fff" />
      </div>
      <h1 className="app-name">Quietly</h1>
      <p className="tagline">一个安静、纯粹的 RSS 阅读器</p>
      <div className="version">Version 2.4.1 (build 4127) · macOS 15</div>
      <p className="credits">
        Inter Tight by Rasmus Andersson · Newsreader by Production Type<br/>
        中文显示由 PingFang SC 渲染 · 强调色取自 OKLCH 色彩空间<br/>
        感谢所有维护开放标准的人 — RSS 让独立写作仍然可达。
      </p>
      <div style={{marginTop: 30, display:'flex', gap: 10, justifyContent:'center'}}>
        <button className="s-btn">使用条款</button>
        <button className="s-btn">隐私政策</button>
        <button className="s-btn">查看更新日志</button>
        <button className="s-btn">致谢</button>
      </div>
    </div>
  );
}

window.Settings = Settings;
