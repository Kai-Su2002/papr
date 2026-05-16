/* Mock feed + article data */

const FEEDS = [
  // Tech
  { id: 'overreacted', folder: 'tech', name: 'overreacted', author: 'Dan Abramov', avatar: 'OR', color: '#7c5cff', url: 'overreacted.io' },
  { id: 'fowler',      folder: 'tech', name: 'Martin Fowler', avatar: 'MF', color: '#2c8a3e', url: 'martinfowler.com' },
  { id: 'simon',       folder: 'tech', name: "Simon Willison's Weblog", avatar: 'SW', color: '#0a6bd4', url: 'simonwillison.net' },
  { id: 'julia',       folder: 'tech', name: 'Julia Evans', avatar: 'JE', color: '#d23a8b', url: 'jvns.ca' },
  { id: 'lobsters',    folder: 'tech', name: 'Lobsters', avatar: 'L',  color: '#a8501f', url: 'lobste.rs' },
  { id: 'hn',          folder: 'tech', name: 'Hacker News: Front Page', avatar: 'Y', color: '#ff6600', url: 'news.ycombinator.com' },

  // 中文
  { id: 'ruanyf',      folder: 'cn',   name: '阮一峰的网络日志', avatar: '阮', color: '#c0392b', url: 'ruanyifeng.com' },
  { id: 'sspai',       folder: 'cn',   name: '少数派', avatar: '少', color: '#d05050', url: 'sspai.com' },
  { id: 'yihui',       folder: 'cn',   name: '谢益辉 | Yihui Xie', avatar: '谢', color: '#3a4cb8', url: 'yihui.org' },
  { id: 'yinwang',     folder: 'cn',   name: '王垠的博客', avatar: '王', color: '#4a4a4a', url: 'yinwang.org' },

  // Design
  { id: 'pixelenvy',   folder: 'design', name: 'Pixel Envy', avatar: 'PE', color: '#1d8a8a', url: 'pxlnv.com' },
  { id: 'frankchimero',folder: 'design', name: 'Frank Chimero', avatar: 'FC', color: '#b85c00', url: 'frankchimero.com' },
  { id: 'rauchg',      folder: 'design', name: 'Guillermo Rauch', avatar: 'GR', color: '#111', url: 'rauchg.com' },

  // Media
  { id: 'verge',       folder: 'media', name: 'The Verge', avatar: 'V',  color: '#5200ff', url: 'theverge.com' },
  { id: 'stratechery', folder: 'media', name: 'Stratechery', avatar: 'S', color: '#1a73e8', url: 'stratechery.com' },
  { id: 'kottke',      folder: 'media', name: 'kottke.org', avatar: 'k',  color: '#000', url: 'kottke.org' },
];

const FOLDERS = [
  { id: 'tech', name: '技术' },
  { id: 'cn',   name: '中文个人' },
  { id: 'design', name: '设计' },
  { id: 'media', name: '媒体' },
];

// Reusable body fragments for variety
const BODY_LONG = (
  <>
    <p>The security research community is one of our platform's greatest assets. Every year, researchers from around the world help us find and fix vulnerabilities, making the platform safer for the millions of developers who depend on it every day.</p>
    <p>But like every program of this kind, we're adapting to a changing landscape. We want to share what we're seeing, what we're doing about it, and how we think about the security boundaries of a platform at this scale.</p>
    <h2>The volume problem</h2>
    <p>Over the past year, submission volume across the industry has grown significantly. New tools, including AI-assisted analysis, have lowered the barrier to entry for security research — which in many ways is a positive development. More people exploring attack surfaces means more opportunities to find real issues.</p>
    <p>However, it also means more noise. Reports that confidently describe a "critical vulnerability" but on examination turn out to be expected behavior, misconfigurations of the reporter's own environment, or simply hallucinated by an automated tool — these now make up a meaningful share of intake.</p>
    <blockquote>The signal-to-noise ratio matters more than raw submission count. A triage queue full of plausible-looking but ultimately invalid reports slows down response for the cases that genuinely matter.</blockquote>
    <h2>What we're changing</h2>
    <p>Starting this quarter, we're tightening our intake criteria and being more explicit about scope. We're also investing in faster triage for high-confidence signals — patterns we've learned to recognize from years of running this program.</p>
    <ul>
      <li>Clearer documentation about what's in and out of scope</li>
      <li>Faster initial response for reports that match known-good patterns</li>
      <li>A reputation system that rewards consistent, high-quality reporters</li>
      <li>Better feedback for invalid reports, so reporters can calibrate</li>
    </ul>
    <h3>On AI-assisted reports</h3>
    <p>We don't have a blanket policy against AI-generated reports. What we care about is whether the report describes a real, reproducible issue. If a researcher uses tools to surface candidates and then validates them carefully before reporting — that's good research. If a tool generates a report and the reporter forwards it without verification — that's spam, regardless of how the underlying text was produced.</p>
    <figure>
      <div className="fig-placeholder" />
      <figcaption>Submission volume vs. valid finding rate, last 36 months.</figcaption>
    </figure>
    <p>We remain deeply committed to working with the research community. The path forward is one where everyone's time is respected — yours and ours.</p>
    <hr />
    <p>If you have feedback on these changes, we'd genuinely like to hear it. The form linked below goes directly to the team running the program, not a general support queue.</p>
  </>
);

const BODY_CN = (
  <>
    <p>最近一段时间，我一直在思考一个问题：为什么在所有写作工具里，<strong>纯文本编辑器</strong>依然有它独特的位置？</p>
    <p>这听起来像是开发者才会关心的问题。但实际上，当你把"工具"从写作的过程中完全移除——没有自动补全的标题样式、没有侧边栏的目录、没有云端同步的小图标——剩下的就只是你和文字本身。</p>
    <h2>一、为什么是 Markdown</h2>
    <p>Markdown 不是最优雅的标记语言，它的语法有不少模糊地带，不同实现之间也有差异。但它有一个不可替代的优点：<em>你能用它来读，也能用它来写</em>。</p>
    <p>这一点听起来简单，做到却不容易。HTML 写起来啰嗦，LaTeX 读起来困难，富文本则要求你必须用配套的编辑器。Markdown 是少数几种"原始形态可读"的格式。</p>
    <blockquote>所有的写作工具最终都要回答一个问题：当工具不在了，你的文字还在吗？</blockquote>
    <h3>纯文本的承诺</h3>
    <p>纯文本的承诺是：你的内容在 30 年后依然可以打开。这个承诺对任何依赖某个具体应用、某个具体公司的格式来说，都是难以兑现的。</p>
    <ul>
      <li>它跨越操作系统</li>
      <li>它跨越应用</li>
      <li>更重要的是，它跨越时间</li>
    </ul>
    <h2>二、关于专注</h2>
    <p>我并不主张大家都用记事本写作。专业的写作工具有它们的价值——大纲、引用管理、协作。但每当我有重要的、需要静下心来的东西要写时，我依然会回到最朴素的工具。</p>
    <p>原因不复杂：<code>Cmd+S</code> 之后什么都不会发生，没有评论提醒，没有协作者的光标，也没有"建议"在拼写下面画线。屏幕上只剩下文字。</p>
    <hr />
    <p>这篇文章我用 <code>vim</code> 写完，再用 <code>pandoc</code> 转成 HTML 发出来。整个过程没有调用一次需要登录的服务。这种感觉很好。</p>
  </>
);

const BODY_SHORT = (
  <>
    <p>Three quick things I learned this week, none of them earth-shattering but all of them mildly useful if you're spending a lot of time in a terminal.</p>
    <h3>1. <code>fd</code> instead of <code>find</code></h3>
    <p>I've been using <code>find</code> for years and tolerating its argument order. <code>fd</code> is a drop-in replacement with sensible defaults: it respects <code>.gitignore</code>, it's colorful, and the common case ("find files matching a pattern") is just <code>fd pattern</code>.</p>
    <h3>2. <code>jq</code> for JSON, <code>yq</code> for YAML</h3>
    <p>I knew about <code>jq</code>. I did not know <code>yq</code> existed and accepts most <code>jq</code> expressions. This is going to save me a lot of awkward sed.</p>
    <h3>3. The <code>z</code> command</h3>
    <p>It learns the directories you visit and lets you jump to them with a fragment. <code>z reader</code> takes me to whatever "reader" project I was most recently in. After a week it stops feeling magical and starts feeling like the way directories should always have worked.</p>
  </>
);

const BODY_DESIGN = (
  <>
    <p>I've been redesigning my personal site for the fourth time in eight years, and each time the process gets shorter — not because I'm faster, but because I'm starting to know what I actually want.</p>
    <p>This iteration is the most stripped-down yet. No navigation bar. No footer. No social icons. Just a list of writing and a list of projects, on two pages that share almost no code.</p>
    <h2>What I removed</h2>
    <p>The temptation when redesigning is to add. New gradient, new typography pairing, new little interaction someone showed off on Twitter last week. The discipline is to subtract.</p>
    <ul>
      <li>A blog index sorted by category — nobody used the categories, including me.</li>
      <li>A "now" page — I never updated it, so it lied about my life.</li>
      <li>An RSS subscribe modal — RSS readers find the feed on their own.</li>
      <li>A dark mode toggle — my dark mode followed the system, but I was the only person who knew that.</li>
    </ul>
    <h2>What stayed</h2>
    <p>Generous margins. A serif body. A single accent color that's used for exactly two things: links and the year next to each post. That's it. If you can't tell a site is mine within ten seconds of arriving, I haven't done my job — but a hundred clever flourishes don't make that any more likely than one consistent one.</p>
    <blockquote>The brand isn't the gradient. The brand is the restraint that made you not put a gradient.</blockquote>
    <figure>
      <div className="fig-placeholder" />
      <figcaption>Three iterations of the homepage. The current one is on the right.</figcaption>
    </figure>
    <p>I'll probably redesign it again in two years. By then I'll have removed the photograph at the top.</p>
  </>
);

const ARTICLES = [
  {
    id: 'a1', feed: 'overreacted', title: 'Two Reacts',
    snippet: "There's something I've been thinking about for a while, which is that the React you write in 2026 isn't really one library — it's two, and they're both growing in their own direction.",
    time: '2h', date: 'May 16, 2026', author: 'Dan Abramov',
    starred: true, read: false, saved: false,
    tags: ['react', 'frontend', 'longread'],
    body: BODY_LONG,
  },
  {
    id: 'a2', feed: 'simon', title: 'Notes on running models locally, six months in',
    snippet: 'Half a year ago I committed to doing as much LLM work as possible on a machine I own. Here are the things that actually changed about how I work, and the things that turned out to matter less than I expected.',
    time: '4h', date: 'May 16, 2026', author: 'Simon Willison',
    starred: false, read: false, saved: true,
    tags: ['llm', 'tools'],
    body: BODY_SHORT,
  },
  {
    id: 'a3', feed: 'fowler', title: 'Refactoring a 200KLOC codebase, slowly',
    snippet: 'When the codebase is large and the team is small, the question isn\'t "should we refactor" — it\'s "what does refactoring look like over a horizon longer than a quarter?"',
    time: '8h', date: 'May 16, 2026', author: 'Martin Fowler',
    starred: false, read: false, saved: false,
    tags: ['refactoring', 'practice'],
    body: BODY_LONG,
  },
  {
    id: 'a4', feed: 'julia', title: 'A small tour of strace',
    snippet: "I keep telling people strace is the most underused tool on Linux. Here's a fifteen-minute tour with concrete examples for the four times in your career when it will save you a day.",
    time: '11h', date: 'May 16, 2026', author: 'Julia Evans',
    starred: true, read: false, saved: false,
    tags: ['linux', 'debugging'],
    body: BODY_SHORT,
  },
  {
    id: 'a5', feed: 'ruanyf', title: '为什么我依然在用纯文本写作',
    snippet: '最近又有人问我用什么写作工具。我的回答让人有些失望：一个文本编辑器，加上几个命令行工具。但我想认真解释一下，这背后并不是怀旧，而是一种实用主义。',
    time: '14h', date: '2026 年 5 月 16 日', author: '阮一峰',
    starred: false, read: false, saved: true,
    tags: ['写作', '工具', '纯文本'],
    body: BODY_CN,
  },
  {
    id: 'a6', feed: 'sspai', title: '我把所有订阅都迁回了 RSS，三个月后的感受',
    snippet: '社交媒体的算法越来越像一个无底洞。我决定做一个看起来很怀旧的实验：把所有想要关注的内容源都搬回到 RSS 阅读器里，看看会发生什么。',
    time: '18h', date: '2026 年 5 月 15 日', author: '少数派编辑部',
    starred: false, read: true, saved: false,
    tags: ['RSS', '订阅', '信息消费'],
    body: BODY_CN,
  },
  {
    id: 'a7', feed: 'frankchimero', title: 'On removing the navigation bar',
    snippet: "The fourth redesign of my site finally got rid of the thing I'd been trying to convince myself I needed for years: a navigation bar. Here's what replaced it, which is mostly nothing.",
    time: '1d', date: 'May 15, 2026', author: 'Frank Chimero',
    starred: true, read: false, saved: false,
    tags: ['design', 'web'],
    body: BODY_DESIGN,
  },
  {
    id: 'a8', feed: 'pixelenvy', title: 'A note on dropdown menus, and why nobody can get them right',
    snippet: "The humble select element is doing better than it has in years, and most of the custom replacements are worse. A short post on why we keep building the same thing.",
    time: '1d', date: 'May 15, 2026', author: 'Nick Heer',
    starred: false, read: true, saved: false,
    tags: ['ui', 'accessibility'],
    body: BODY_SHORT,
  },
  {
    id: 'a9', feed: 'yihui', title: 'R Markdown, ten years later',
    snippet: '十年前我做 knitr 的时候，从来没有想过它会变成今天这个样子。这篇短文记录一些我现在回头看时觉得做对了、和做错了的决定。',
    time: '2d', date: '2026 年 5 月 14 日', author: '谢益辉',
    starred: false, read: false, saved: false,
    tags: ['R', 'Markdown', '回顾'],
    body: BODY_CN,
  },
  {
    id: 'a10', feed: 'rauchg', title: 'Edge functions are just functions',
    snippet: 'A short rant: the prefix "edge" has done a lot of marketing work that has obscured a simpler reality. Most edge functions are, mechanically, just functions that happen to run closer to the user.',
    time: '2d', date: 'May 14, 2026', author: 'Guillermo Rauch',
    starred: false, read: false, saved: false,
    tags: ['infrastructure'],
    body: BODY_SHORT,
  },
  {
    id: 'a11', feed: 'verge', title: 'The slow, strange comeback of the personal homepage',
    snippet: 'Personal websites never went away, but in 2026 they\'re showing up in places they didn\'t before — in artist bios, in conference programs, even in dating profiles. A piece about quiet trends.',
    time: '2d', date: 'May 14, 2026', author: 'Nilay Patel',
    starred: false, read: false, saved: false,
    tags: ['culture', 'web'],
    body: BODY_DESIGN,
  },
  {
    id: 'a12', feed: 'stratechery', title: 'Aggregators, deflation, and the long arc',
    snippet: "The aggregation thesis is now old enough to drive. What does it look like when the second-generation aggregators start to face the same disruption pressures that the platforms they unseated did?",
    time: '3d', date: 'May 13, 2026', author: 'Ben Thompson',
    starred: false, read: false, saved: true,
    tags: ['strategy', 'media'],
    body: BODY_LONG,
  },
  {
    id: 'a13', feed: 'lobsters', title: 'PostgreSQL 18: what changed and what didn\'t',
    snippet: 'A community-curated summary of the user-facing changes in Postgres 18, with links to the upstream commits for each. Includes the gotchas around the new default isolation level.',
    time: '3d', date: 'May 13, 2026', author: 'lobste.rs',
    starred: false, read: true, saved: false,
    tags: ['postgres', 'database'],
    body: BODY_SHORT,
  },
  {
    id: 'a14', feed: 'hn', title: 'Show HN: I built a typewriter in my browser, and it has no JS',
    snippet: 'After fifteen years of building things in JavaScript I wanted to see what was possible with only HTML and CSS. The answer turned out to be: more than I expected, and probably less than the title implies.',
    time: '3d', date: 'May 13, 2026', author: 'submitted by tobias',
    starred: false, read: false, saved: false,
    tags: ['show-hn', 'css'],
    body: BODY_SHORT,
  },
  {
    id: 'a15', feed: 'yinwang', title: '关于"代码品味"的一些不合时宜的想法',
    snippet: '我知道这个话题已经被讨论了很多年。但每隔一段时间，我都会想重新写一篇关于代码品味的文章，因为我对它的理解一直在变。',
    time: '4d', date: '2026 年 5 月 12 日', author: '王垠',
    starred: false, read: false, saved: false,
    tags: ['编程', '观点'],
    body: BODY_CN,
  },
  {
    id: 'a16', feed: 'kottke', title: 'A morning collection of pleasant things',
    snippet: "A short Friday post. A few photos, a few links, a recipe I want to try this weekend, and a small video of a heron in Brooklyn.",
    time: '4d', date: 'May 12, 2026', author: 'Jason Kottke',
    starred: false, read: true, saved: false,
    tags: ['miscellany'],
    body: BODY_SHORT,
  },
];

window.RSS_DATA = { FEEDS, FOLDERS, ARTICLES };
