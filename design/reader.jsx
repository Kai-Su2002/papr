/* Reader panel — right column */

function Reader({ article, feed, useSerif, focusMode, onToggleStar, onToggleSave, onToggleAI, onToggleFocus, aiOpen, onOpenExternal }) {
  const [scrolled, setScrolled] = React.useState(false);
  const scrollRef = React.useRef(null);

  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => setScrolled(el.scrollTop > 8);
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, [article?.id]);

  // Reset scroll on article change
  React.useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [article?.id]);

  if (!article) {
    return (
      <div className="reader">
        <div className="reader-toolbar" />
        <div className="empty" style={{flex: 1}}>
          <div className="glyph"><Icon name="rss" size={22} /></div>
          <div>选择一篇文章开始阅读</div>
          <div style={{fontSize: 11.5, color: 'var(--muted-2)'}}>
            按 <kbd style={{fontFamily:'var(--mono)', fontSize:10, padding:'1px 5px', border:'1px solid var(--hair)', borderRadius:3}}>J</kbd> / <kbd style={{fontFamily:'var(--mono)', fontSize:10, padding:'1px 5px', border:'1px solid var(--hair)', borderRadius:3}}>K</kbd> 上下切换
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="reader">
      <div className={`reader-toolbar ${scrolled ? 'scrolled' : ''}`}>
        <button className={`tb-btn ${article.starred ? 'on' : ''}`} onClick={onToggleStar} title="星标 (S)">
          <Icon name={article.starred ? 'star-fill' : 'star'} size={16} />
        </button>
        <button className={`tb-btn ${article.saved ? 'on' : ''}`} onClick={onToggleSave} title="稍后读 (B)">
          <Icon name={article.saved ? 'bookmark-fill' : 'bookmark'} size={16} />
        </button>
        <button className={`tb-btn ${aiOpen ? 'on' : ''}`} onClick={onToggleAI} title="AI 摘要 (I)">
          <Icon name={aiOpen ? 'sparkle-fill' : 'sparkle'} size={16} />
        </button>
        <button className="tb-btn" title="复制链接"><Icon name="copy" size={16} /></button>
        <button className="tb-btn" title="分享"><Icon name="share" size={16} /></button>
        <button className={`tb-btn ${focusMode ? 'on' : ''}`} onClick={onToggleFocus} title="焦点阅读 (F)">
          <Icon name="focus" size={16} />
        </button>
        <div className="tb-btn spacer" />
        <button className="tb-btn" title="在浏览器中打开 (⌘O)" onClick={onOpenExternal}>
          <Icon name="open" size={16} />
        </button>
      </div>

      <div className="reader-scroll" ref={scrollRef}>
        <article className="article reader-content" key={article.id}>
          <a className="article-feed" href="#" onClick={e => e.preventDefault()}>
            <Icon name="rss" size={13} />
            {feed?.name}
          </a>
          <h1 className="article-title">{article.title}</h1>
          <div className="article-meta">
            <span className="author">{article.author}</span>
            <span>·</span>
            <span>{article.date}</span>
            <span>·</span>
            <span>{Math.max(2, Math.round((typeof article.body === 'string' ? article.body.length : 1800) / 350))} 分钟阅读</span>
          </div>
          <div className="article-body" data-serif={useSerif}>
            {article.body}
          </div>
          {article.tags && article.tags.length > 0 && (
            <div className="tag-row">
              {article.tags.map(t => <span className="tag" key={t}>#{t}</span>)}
            </div>
          )}
        </article>
      </div>

      <AIDrawer open={aiOpen} article={article} onClose={onToggleAI} />
    </div>
  );
}

function AIDrawer({ open, article, onClose }) {
  const [phase, setPhase] = React.useState('idle'); // idle | loading | done
  const [content, setContent] = React.useState(null);

  // When drawer opens for a new article, simulate generation
  React.useEffect(() => {
    if (!open || !article) return;
    setPhase('loading');
    setContent(null);
    const t = setTimeout(() => {
      setPhase('done');
      setContent(makeSummary(article));
    }, 900);
    return () => clearTimeout(t);
  }, [open, article?.id]);

  if (!article) return null;

  return (
    <div className={`ai-drawer ${open ? 'open' : ''}`}>
      <div className="ai-head">
        <span className="accent-ico"><Icon name="sparkle-fill" size={15} /></span>
        <h3>AI 摘要</h3>
        <button className="tb-btn close" onClick={onClose} title="关闭">
          <Icon name="x" size={14} />
        </button>
      </div>
      <div className="ai-body">
        {phase === 'loading' && (
          <div className="ai-loading">
            <span className="ai-dot" />
            <span className="ai-dot" />
            <span className="ai-dot" />
            <span style={{marginLeft: 4}}>正在阅读全文…</span>
          </div>
        )}
        {phase === 'done' && content && (
          <>
            <div className="ai-section">
              <h4>一句话</h4>
              <p style={{margin: 0, color: 'var(--ink)'}}>{content.oneLine}</p>
            </div>
            <div className="ai-section">
              <h4>要点</h4>
              <ul>
                {content.bullets.map((b, i) => <li key={i}>{b}</li>)}
              </ul>
            </div>
            <div className="ai-section">
              <h4>值得追问</h4>
              <ul>
                {content.questions.map((q, i) => <li key={i}>{q}</li>)}
              </ul>
            </div>
            <div style={{fontSize: 11, color: 'var(--muted-2)', marginTop: 24, lineHeight: 1.5}}>
              由本地模型生成 · 仅供参考 · 内容可能不准确
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function makeSummary(a) {
  // Static deterministic summaries keyed off article id
  const map = {
    a1: {
      oneLine: 'React 正在分裂成两套实践，分别面向不同的应用形态。',
      bullets: [
        '客户端 React 仍然在快速演进，但目标更偏向交互密集的应用。',
        '服务端 React + RSC 是另一条线索，关注的是首屏与数据流。',
        '两条路径正在产生不同的最佳实践，混用时需要明确边界。',
      ],
      questions: [
        '团队选型时应该如何划分这两类应用？',
        'RSC 在中小型团队的真实采用成本？',
      ],
    },
    a5: {
      oneLine: '作者用纯文本+命令行工具写作，强调可移植性与专注。',
      bullets: [
        'Markdown 是少数"原始形态可读"的格式之一。',
        '纯文本承诺：30 年后内容依然可以打开。',
        '专业写作工具有价值，但需要专注时回到最简形态。',
      ],
      questions: [
        '协作写作场景下纯文本是否仍然成立？',
        '如何在保持纯文本的同时获得现代工具的便利？',
      ],
    },
  };
  return map[a.id] || {
    oneLine: '本文围绕一个核心论点展开，并给出若干具体的例子加以支撑。',
    bullets: [
      '提出一个与当前实践相对的观点。',
      '通过三个左右的例子说明这个观点的实际意义。',
      '在最后给出可操作的建议或后续思考方向。',
    ],
    questions: [
      '作者的论点在你自己的语境里是否成立？',
      '哪一个例子最能改变你接下来的做法？',
    ],
  };
}

window.Reader = Reader;
