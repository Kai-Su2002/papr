import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import * as api from "../api";
import { useUi } from "../store";
import { feedAvatar, feedColor, feedHost } from "../lib/feedMeta";
import type { Feed } from "../types";
import Icon, { type IconName } from "./Icon";

interface Props {
  onClose: () => void;
  onToast: (msg: string) => void;
  initialSection?: string;
  onAddFeed: () => void;
}

const SECTIONS: { id: string; label: string; icon: IconName; color: string }[] = [
  { id: "general", label: "通用", icon: "settings", color: "#7a756c" },
  { id: "appearance", label: "外观", icon: "globe", color: "#bb6743" },
  { id: "reading", label: "阅读", icon: "eye", color: "#3a4cb8" },
  { id: "subscriptions", label: "订阅", icon: "rss", color: "#d97706" },
  { id: "sync", label: "同步", icon: "refresh", color: "#2c8a3e" },
  { id: "shortcuts", label: "快捷键", icon: "command", color: "#5a5fc4" },
  { id: "notifications", label: "通知", icon: "inbox", color: "#a8501f" },
  { id: "advanced", label: "高级", icon: "sort", color: "#4a4a4a" },
  { id: "about", label: "关于", icon: "sparkle", color: "#111" },
];

export default function SettingsDialog({
  onClose,
  onToast,
  initialSection,
  onAddFeed,
}: Props) {
  const [section, setSection] = useState(initialSection ?? "general");
  const feeds = useQuery({ queryKey: ["feeds"], queryFn: api.listFeeds });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onClose]);

  const cur = SECTIONS.find((s) => s.id === section)!;
  const feedCount = feeds.data?.length ?? 0;

  const subs: Record<string, string> = {
    general: "订阅源刷新、默认行为、启动方式",
    appearance: "主题、强调色、密度",
    reading: "正文字体、字号、版面",
    subscriptions: `${feedCount} 个订阅源`,
    sync: "云端同步与第三方服务",
    shortcuts: "键盘快捷键",
    notifications: "新文章提醒与角标",
    advanced: "缓存、网络、实验功能",
    about: "版本信息与致谢",
  };

  return (
    <div className="settings-backdrop" onClick={onClose}>
      <div className="settings-window" onClick={(e) => e.stopPropagation()}>
        <div className="settings-sidebar">
          <div className="settings-sidebar-title">
            设置
            <span className="badge">⌘,</span>
          </div>
          {SECTIONS.map((s) => (
            <div
              key={s.id}
              className={`settings-nav-item ${section === s.id ? "active" : ""}`}
              onClick={() => setSection(s.id)}
            >
              <span className="nav-ico" style={{ background: s.color }}>
                <Icon name={s.icon} size={11} color="#fff" />
              </span>
              {s.label}
            </div>
          ))}
          <div className="settings-nav-spacer" />
          <div className="settings-version">Lumen 0.1.0 · macOS</div>
        </div>

        <div className="settings-content">
          <div className="settings-header">
            <h2>{cur.label}</h2>
            <span className="sub">{subs[section]}</span>
          </div>
          <button className="settings-close" onClick={onClose} title="关闭 (Esc)">
            <Icon name="x" size={15} />
          </button>

          <div className="settings-scroll">
            {section === "general" && <GeneralSection />}
            {section === "appearance" && <AppearanceSection />}
            {section === "reading" && <ReadingSection />}
            {section === "subscriptions" && (
              <SubscriptionsSection
                feeds={feeds.data ?? []}
                onToast={onToast}
                onAddFeed={onAddFeed}
              />
            )}
            {section === "sync" && <SyncSection onToast={onToast} />}
            {section === "shortcuts" && <ShortcutsSection />}
            {section === "notifications" && <NotificationsSection />}
            {section === "advanced" && <AdvancedSection onToast={onToast} />}
            {section === "about" && <AboutSection />}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── row helpers ─────────────────────────────────────────── */
function Row({
  label,
  desc,
  children,
}: {
  label: string;
  desc?: string;
  children: React.ReactNode;
}) {
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

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <input
      type="checkbox"
      className="s-toggle"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
    />
  );
}

function Select<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <select
      className="s-select"
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="s-seg">
      {options.map((o) => (
        <button
          key={o.value}
          className={value === o.value ? "on" : ""}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Slider({
  value,
  min,
  max,
  step = 1,
  unit = "",
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
}) {
  return (
    <>
      <input
        type="range"
        className="s-slider"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <span className="s-value">
        {value}
        {unit}
      </span>
    </>
  );
}

/* ── general ─────────────────────────────────────────────── */
// Auto-refresh "off" is stored as a year-long interval — the only lever the
// backend scheduler exposes (it reads `refresh_interval_min`, minimum 5).
const OFF_INTERVAL = 525600;

function GeneralSection() {
  const prefs = useUi((s) => s.prefs);
  const setPref = useUi((s) => s.setPref);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshMins, setRefreshMins] = useState(30);

  useEffect(() => {
    api
      .getSetting("refresh_interval_min")
      .then((v) => {
        const n = v ? Number(v) : 30;
        if (n >= 100000) setAutoRefresh(false);
        else {
          setAutoRefresh(true);
          setRefreshMins(Math.max(5, n));
        }
      })
      .catch(() => {});
  }, []);

  const writeInterval = (auto: boolean, mins: number) => {
    api
      .setSetting("refresh_interval_min", auto ? String(mins) : String(OFF_INTERVAL))
      .catch(() => {});
  };

  return (
    <>
      <div className="settings-group">
        <h3 className="settings-group-title">刷新</h3>
        <Row label="自动刷新" desc="后台定期检查订阅源更新">
          <Toggle
            checked={autoRefresh}
            onChange={(v) => {
              setAutoRefresh(v);
              writeInterval(v, refreshMins);
            }}
          />
        </Row>
        {autoRefresh && (
          <Row label="刷新间隔" desc="时间越短，电池消耗越大">
            <Slider
              value={refreshMins}
              min={5}
              max={120}
              step={5}
              unit=" 分钟"
              onChange={(m) => {
                setRefreshMins(m);
                writeInterval(true, m);
              }}
            />
          </Row>
        )}
      </div>
      <div className="settings-group">
        <h3 className="settings-group-title">已读行为</h3>
        <Row label="打开文章时标为已读">
          <Toggle
            checked={prefs.markReadOnOpen}
            onChange={(v) => setPref({ markReadOnOpen: v })}
          />
        </Row>
        <Row label="滚动到底部时标为已读" desc="适合快速浏览长列表">
          <Toggle
            checked={prefs.markReadOnScroll}
            onChange={(v) => setPref({ markReadOnScroll: v })}
          />
        </Row>
      </div>
      <div className="settings-group">
        <h3 className="settings-group-title">启动</h3>
        <Row label="启动时打开" desc="下次打开应用时默认进入的视图">
          <Select
            value={prefs.startupView}
            options={[
              { value: "all", label: "全部文章" },
              { value: "unread", label: "未读" },
              { value: "starred", label: "星标" },
              { value: "last", label: "上次的位置" },
            ]}
            onChange={(v) => setPref({ startupView: v })}
          />
        </Row>
        <Row label="启动时隐藏已读">
          <Toggle
            checked={prefs.hideReadOnStartup}
            onChange={(v) => setPref({ hideReadOnStartup: v })}
          />
        </Row>
      </div>
    </>
  );
}

/* ── appearance ──────────────────────────────────────────── */
function AppearanceSection() {
  const theme = useUi((s) => s.theme);
  const setTheme = useUi((s) => s.setTheme);
  const accent = useUi((s) => s.accent);
  const setAccent = useUi((s) => s.setAccent);
  const density = useUi((s) => s.density);
  const setDensity = useUi((s) => s.setDensity);
  const viewMode = useUi((s) => s.viewMode);
  const setViewMode = useUi((s) => s.setViewMode);
  const prefs = useUi((s) => s.prefs);
  const setPref = useUi((s) => s.setPref);

  const accents = [
    { value: "clay", color: "#bb6743", label: "陶土" },
    { value: "pine", color: "#3d7a5e", label: "松绿" },
    { value: "indigo", color: "#5a5fc4", label: "靛蓝" },
    { value: "ink", color: "#2b2620", label: "墨色" },
  ] as const;

  return (
    <>
      <div className="settings-group">
        <h3 className="settings-group-title">主题</h3>
        <Row label="外观" desc="影响整个应用的明暗">
          <Segmented
            value={theme}
            options={[
              { value: "light", label: "浅色" },
              { value: "dark", label: "深色" },
            ]}
            onChange={setTheme}
          />
        </Row>
        <Row label="强调色" desc="链接、星标和强调元素">
          <div className="s-swatches">
            {accents.map((a) => (
              <button
                key={a.value}
                className={`s-swatch ${accent === a.value ? "on" : ""}`}
                style={{ background: a.color }}
                onClick={() => setAccent(a.value)}
                title={a.label}
              />
            ))}
          </div>
        </Row>
      </div>
      <div className="settings-group">
        <h3 className="settings-group-title">布局</h3>
        <Row label="信息密度" desc="影响列表行高与间距">
          <Segmented
            value={density}
            options={[
              { value: "compact", label: "紧凑" },
              { value: "cozy", label: "适中" },
              { value: "spacious", label: "宽松" },
            ]}
            onChange={setDensity}
          />
        </Row>
        <Row label="文章列表样式">
          <Segmented
            value={viewMode}
            options={[
              { value: "list", label: "列表" },
              { value: "card", label: "卡片" },
            ]}
            onChange={setViewMode}
          />
        </Row>
      </div>
      <div className="settings-group">
        <h3 className="settings-group-title">细节</h3>
        <Row label="侧栏显示未读计数">
          <Toggle
            checked={prefs.showSidebarCounts}
            onChange={(v) => setPref({ showSidebarCounts: v })}
          />
        </Row>
        <Row label="文章卡片显示缩略图" desc="仅在卡片视图下生效">
          <Toggle
            checked={prefs.showCardThumbs}
            onChange={(v) => setPref({ showCardThumbs: v })}
          />
        </Row>
        <Row label="减少动效" desc="关闭界面过渡与动画">
          <Toggle
            checked={prefs.reduceMotion}
            onChange={(v) => setPref({ reduceMotion: v })}
          />
        </Row>
      </div>
    </>
  );
}

/* ── reading ─────────────────────────────────────────────── */
function ReadingSection() {
  const useSerif = useUi((s) => s.useSerif);
  const setUseSerif = useUi((s) => s.setUseSerif);
  const readerSize = useUi((s) => s.readerSize);
  const readerLeading = useUi((s) => s.readerLeading);
  const readerWidth = useUi((s) => s.readerWidth);
  const setReader = useUi((s) => s.setReader);
  const prefs = useUi((s) => s.prefs);
  const setPref = useUi((s) => s.setPref);
  return (
    <>
      <div className="settings-group">
        <h3 className="settings-group-title">字体</h3>
        <Row label="正文字体">
          <Segmented
            value={useSerif ? "serif" : "sans"}
            options={[
              { value: "serif", label: "衬线" },
              { value: "sans", label: "无衬线" },
            ]}
            onChange={(v) => setUseSerif(v === "serif")}
          />
        </Row>
        <Row label="字号">
          <Slider
            value={readerSize}
            min={14}
            max={22}
            unit="px"
            onChange={(v) => setReader({ readerSize: v })}
          />
        </Row>
        <Row label="行高">
          <Slider
            value={readerLeading}
            min={130}
            max={200}
            step={5}
            unit="%"
            onChange={(v) => setReader({ readerLeading: v })}
          />
        </Row>
      </div>
      <div className="settings-group">
        <h3 className="settings-group-title">版面</h3>
        <Row label="正文最大宽度">
          <Slider
            value={readerWidth}
            min={520}
            max={840}
            step={20}
            unit="px"
            onChange={(v) => setReader({ readerWidth: v })}
          />
        </Row>
        <Row label="显示预计阅读时间" desc="在文章信息栏显示估算阅读时长">
          <Toggle
            checked={prefs.showReadingTime}
            onChange={(v) => setPref({ showReadingTime: v })}
          />
        </Row>
      </div>
    </>
  );
}

/* ── subscriptions ───────────────────────────────────────── */
function SubscriptionsSection({
  feeds,
  onToast,
  onAddFeed,
}: {
  feeds: Feed[];
  onToast: (m: string) => void;
  onAddFeed: () => void;
}) {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const filtered = feeds.filter(
    (f) => !search || f.title.toLowerCase().includes(search.toLowerCase()),
  );

  const exportOpml = async () => {
    try {
      const xml = await api.exportOpml();
      const blob = new Blob([xml], { type: "text/xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "subscriptions.opml";
      a.click();
      URL.revokeObjectURL(url);
      onToast("OPML 已导出到下载文件夹");
    } catch (e) {
      onToast(String(e));
    }
  };

  const importOpml = async (file: File) => {
    try {
      const n = await api.importOpml(await file.text());
      await qc.invalidateQueries();
      onToast(`已从 OPML 导入 ${n} 个订阅源`);
    } catch (e) {
      onToast(String(e));
    }
  };

  const unsubscribe = (f: Feed) =>
    api
      .deleteFeed(f.id)
      .then(() => {
        qc.invalidateQueries();
        onToast(`已退订 ${f.title}`);
      })
      .catch((e) => onToast(String(e)));

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept=".opml,.xml"
        style={{ display: "none" }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) importOpml(f);
          e.target.value = "";
        }}
      />
      <div className="settings-group" style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 10px",
              borderRadius: 7,
              border: "1px solid var(--hair-strong)",
              background: "var(--panel)",
            }}
          >
            <Icon name="search" size={13} color="var(--muted)" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="在订阅源中查找…"
              style={{
                flex: 1,
                border: 0,
                outline: 0,
                background: "transparent",
                fontFamily: "inherit",
                fontSize: 12.5,
                color: "var(--ink)",
              }}
            />
          </div>
          <button className="s-btn" onClick={() => fileRef.current?.click()}>
            <Icon name="arrow-down" size={12} /> 导入 OPML
          </button>
          <button className="s-btn" onClick={exportOpml}>
            <Icon name="arrow-up" size={12} /> 导出
          </button>
          <button className="s-btn primary" onClick={onAddFeed}>
            <Icon name="plus" size={12} /> 添加
          </button>
        </div>
      </div>
      <div className="settings-group">
        <h3 className="settings-group-title">订阅源 · {filtered.length} 个</h3>
        <div>
          {filtered.map((f) => (
            <div key={f.id} className="s-feed-row">
              <span
                className="sb-feed-avatar"
                style={{
                  background: feedColor(f.id),
                  width: 22,
                  height: 22,
                  borderRadius: 5,
                }}
              >
                {feedAvatar(f.title)}
              </span>
              <span className="name">{f.title}</span>
              <span className="url">{feedHost(f)}</span>
              <div className="actions">
                <button
                  className="icon-btn"
                  title="退订"
                  onClick={() => unsubscribe(f)}
                >
                  <Icon name="trash" size={13} />
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div
              style={{ padding: "16px 4px", fontSize: 13, color: "var(--muted)" }}
            >
              没有匹配的订阅源。
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ── sync ────────────────────────────────────────────────── */
function SyncSection({ onToast }: { onToast: (m: string) => void }) {
  const services = [
    { id: "icloud", name: "iCloud", color: "#0089E0", initial: "☁", desc: "在你的 Apple 设备之间同步订阅、星标和已读状态。", connected: true },
    { id: "feedly", name: "Feedly", color: "#2BB24C", initial: "F", desc: "同步到 Feedly 账户。需要付费订阅以解锁全功能。", connected: false },
    { id: "inoreader", name: "Inoreader", color: "#1976D2", initial: "I", desc: "同步到 Inoreader 账户。免费账户支持基础同步。", connected: false },
    { id: "fresh", name: "FreshRSS", color: "#4A4A4A", initial: "⚡", desc: "自建 FreshRSS 服务器。需要填写 API 地址。", connected: false },
  ];
  return (
    <>
      <div className="settings-group">
        <h3 className="settings-group-title">同步服务</h3>
        {services.map((s) => (
          <div key={s.id} className="s-service">
            <div className="logo" style={{ background: s.color }}>
              {s.initial}
            </div>
            <div className="info">
              <div className="title">{s.name}</div>
              <div className="desc">{s.desc}</div>
            </div>
            <span className={`status ${s.connected ? "on" : ""}`}>
              {s.connected ? "已连接" : "未连接"}
            </span>
            <button
              className="s-btn"
              onClick={() =>
                onToast(s.connected ? `已断开 ${s.name}` : `正在连接 ${s.name}…`)
              }
            >
              {s.connected ? "断开" : "连接…"}
            </button>
          </div>
        ))}
      </div>
      <div className="settings-group">
        <h3 className="settings-group-title">同步内容</h3>
        <Row label="同步星标">
          <Toggle checked onChange={() => {}} />
        </Row>
        <Row label="同步稍后读">
          <Toggle checked onChange={() => {}} />
        </Row>
        <Row label="同步已读状态">
          <Toggle checked onChange={() => {}} />
        </Row>
        <Row label="同步设备间设置" desc="包括外观、阅读偏好、快捷键">
          <Toggle checked={false} onChange={() => {}} />
        </Row>
      </div>
    </>
  );
}

/* ── shortcuts ───────────────────────────────────────────── */
function ShortcutsSection() {
  const groups = [
    {
      title: "导航",
      items: [
        { desc: "下一篇", keys: ["J"] },
        { desc: "上一篇", keys: ["K"] },
        { desc: "在浏览器中打开", keys: ["O"] },
        { desc: "标为已读 / 未读", keys: ["U"] },
        { desc: "退出焦点 / 关闭抽屉", keys: ["Esc"] },
      ],
    },
    {
      title: "操作",
      items: [
        { desc: "星标", keys: ["S"] },
        { desc: "稍后读", keys: ["B"] },
        { desc: "AI 摘要", keys: ["I"] },
        { desc: "当前列表全标已读", keys: ["⇧", "A"] },
      ],
    },
    {
      title: "视图",
      items: [
        { desc: "焦点阅读", keys: ["F"] },
        { desc: "隐藏已读", keys: ["V"] },
        { desc: "切换深 / 浅色", keys: ["⇧", "D"] },
      ],
    },
    {
      title: "全局",
      items: [
        { desc: "命令面板", keys: ["⌘", "K"] },
        { desc: "刷新所有订阅源", keys: ["⌘", "R"] },
        { desc: "添加订阅源", keys: ["A"] },
        { desc: "设置", keys: ["⌘", ","] },
      ],
    },
  ];
  return (
    <>
      {groups.map((g) => (
        <div className="settings-group" key={g.title}>
          <h3 className="settings-group-title">{g.title}</h3>
          <div className="s-shortcuts">
            {g.items.map((it, i) => (
              <div className="s-shortcut" key={i}>
                <span className="desc">{it.desc}</span>
                <span className="keys">
                  {it.keys.map((k, j) => (
                    <span className="s-key" key={j}>
                      {k}
                    </span>
                  ))}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

/* ── notifications ───────────────────────────────────────── */
function NotificationsSection() {
  const [enabled, setEnabled] = useState(true);
  const [showBadge, setShowBadge] = useState(true);
  const [perFeed, setPerFeed] = useState("starred");
  const [sound, setSound] = useState(false);
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
          <Select
            value={perFeed}
            options={[
              { value: "all", label: "全部订阅源" },
              { value: "starred", label: "仅已标记重要的订阅源" },
              { value: "none", label: "不通知" },
            ]}
            onChange={setPerFeed}
          />
        </Row>
      </div>
      <div className="settings-group">
        <h3 className="settings-group-title">勿扰</h3>
        <Row label="夜间勿扰" desc="22:00 — 08:00 之间不显示通知">
          <Toggle checked onChange={() => {}} />
        </Row>
        <Row label="专注模式时静音" desc="跟随系统专注模式">
          <Toggle checked onChange={() => {}} />
        </Row>
      </div>
    </>
  );
}

/* ── advanced ────────────────────────────────────────────── */
function AdvancedSection({ onToast }: { onToast: (m: string) => void }) {
  const total = 412;
  const articles = 218;
  const images = 168;
  const cache = total - articles - images;
  const pct = (v: number) => `${((v / total) * 100).toFixed(0)}%`;
  return (
    <>
      <AiSettingsGroup onToast={onToast} />
      <div className="settings-group">
        <h3 className="settings-group-title">存储</h3>
        <div className="settings-row">
          <div className="settings-row-text" style={{ flex: 1 }}>
            <div className="settings-row-label">数据占用</div>
            <div className="s-bar">
              <span style={{ width: pct(articles), background: "var(--accent)" }} />
              <span
                style={{ width: pct(images), background: "oklch(0.70 0.10 220)" }}
              />
              <span
                style={{ width: pct(cache), background: "oklch(0.55 0.02 50)" }}
              />
            </div>
            <div className="s-legend">
              <span>
                <i style={{ background: "var(--accent)" }} />
                文章 {articles} MB
              </span>
              <span>
                <i style={{ background: "oklch(0.70 0.10 220)" }} />
                图片 {images} MB
              </span>
              <span>
                <i style={{ background: "oklch(0.55 0.02 50)" }} />
                缓存 {cache} MB
              </span>
            </div>
          </div>
        </div>
        <Row label="清空图片缓存" desc="不会影响文章本身">
          <button
            className="s-btn"
            onClick={() => onToast(`已清空 ${images} MB 图片缓存`)}
          >
            清空
          </button>
        </Row>
      </div>
      <div className="settings-group">
        <h3 className="settings-group-title">网络</h3>
        <Row label="代理">
          <Select
            value="system"
            options={[
              { value: "system", label: "跟随系统" },
              { value: "none", label: "不使用代理" },
              { value: "custom", label: "自定义…" },
            ]}
            onChange={() => {}}
          />
        </Row>
        <Row label="并发请求数" desc="一次最多同时刷新几个订阅源">
          <Slider value={6} min={1} max={16} onChange={() => {}} />
        </Row>
      </div>
    </>
  );
}

/** Real AI provider configuration — backing the AI summary feature. */
function AiSettingsGroup({ onToast }: { onToast: (m: string) => void }) {
  const [provider, setProvider] = useState<"anthropic" | "openai">("anthropic");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");
  const savedKey = useRef("");
  const savedModel = useRef("");

  useEffect(() => {
    Promise.all([
      api.getSetting("ai_provider"),
      api.getSetting("ai_api_key"),
      api.getSetting("ai_model"),
    ])
      .then(([p, k, m]) => {
        if (p === "openai" || p === "anthropic") setProvider(p);
        if (k) {
          setApiKey(k);
          savedKey.current = k;
        }
        if (m) {
          setModel(m);
          savedModel.current = m;
        }
      })
      .catch(() => {});
  }, []);

  const save = (key: string, value: string, label: string) => {
    api
      .setSetting(key, value)
      .then(() => onToast(`${label}已保存`))
      .catch((e) => onToast(String(e)));
  };

  const placeholder =
    provider === "openai" ? "gpt-4.1-mini（默认）" : "claude-sonnet-4-6（默认）";

  return (
    <div className="settings-group">
      <h3 className="settings-group-title">AI 摘要</h3>
      <Row label="服务商" desc="用于生成文章摘要的大模型提供方">
        <Select
          value={provider}
          options={[
            { value: "anthropic", label: "Anthropic" },
            { value: "openai", label: "OpenAI" },
          ]}
          onChange={(v) => {
            setProvider(v);
            save("ai_provider", v, "AI 服务商");
          }}
        />
      </Row>
      <Row label="API Key" desc="密钥仅保存在本地数据库，不会上传">
        <input
          className="s-text-input"
          type="password"
          value={apiKey}
          placeholder="sk-…"
          onChange={(e) => setApiKey(e.target.value)}
          onBlur={() => {
            if (apiKey !== savedKey.current) {
              savedKey.current = apiKey;
              save("ai_api_key", apiKey, "API Key");
            }
          }}
        />
      </Row>
      <Row label="模型" desc="留空则使用该服务商的默认模型">
        <input
          className="s-text-input"
          type="text"
          value={model}
          placeholder={placeholder}
          onChange={(e) => setModel(e.target.value)}
          onBlur={() => {
            if (model !== savedModel.current) {
              savedModel.current = model;
              save("ai_model", model, "AI 模型");
            }
          }}
        />
      </Row>
    </div>
  );
}

/* ── about ───────────────────────────────────────────────── */
function AboutSection() {
  return (
    <div className="s-about">
      <div className="mark">
        <Icon name="rss" size={32} color="#fff" />
      </div>
      <h1 className="app-name">Lumen</h1>
      <p className="tagline">一个安静、纯粹的 RSS 阅读器</p>
      <div className="version">Version 0.1.0 · macOS</div>
      <p className="credits">
        Inter Tight by Rasmus Andersson · Newsreader by Production Type
        <br />
        中文显示由 PingFang SC 渲染 · 强调色取自 OKLCH 色彩空间
        <br />
        感谢所有维护开放标准的人 — RSS 让独立写作仍然可达。
      </p>
    </div>
  );
}
