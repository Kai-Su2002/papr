import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import * as api from "../api";
import { feedAvatar, feedColor, feedHost, relTime } from "../lib/feedMeta";
import type { ArticleSummary, Feed } from "../types";
import Icon, { type IconName } from "./Icon";

export type CommandAction =
  | "mark-all-read"
  | "toggle-theme"
  | "toggle-focus"
  | "toggle-ai"
  | "refresh"
  | "add-feed"
  | "new-folder"
  | "opml"
  | "open-settings";

interface Props {
  open: boolean;
  onClose: () => void;
  onAction: (action: CommandAction) => void;
  onNavigateFeed: (feed: Feed) => void;
  onNavigateArticle: (article: ArticleSummary) => void;
}

interface Item {
  id: string;
  group: "action" | "feed" | "article";
  icon: IconName | null;
  feed?: Feed;
  label: string;
  hint?: string;
  run: () => void;
}

const ACTIONS: { icon: IconName; label: string; hint: string; action: CommandAction }[] = [
  { icon: "check-all", label: "将当前列表全部标为已读", hint: "⇧A", action: "mark-all-read" },
  { icon: "globe", label: "切换深色 / 浅色模式", hint: "⇧D", action: "toggle-theme" },
  { icon: "focus", label: "焦点阅读模式", hint: "F", action: "toggle-focus" },
  { icon: "sparkle", label: "AI 摘要当前文章", hint: "I", action: "toggle-ai" },
  { icon: "refresh", label: "刷新所有订阅源", hint: "⌘R", action: "refresh" },
  { icon: "plus", label: "添加订阅源…", hint: "A", action: "add-feed" },
  { icon: "folder", label: "新建文件夹…", hint: "", action: "new-folder" },
  { icon: "open", label: "OPML 导入 / 导出", hint: "", action: "opml" },
  { icon: "settings", label: "打开设置…", hint: "⌘,", action: "open-settings" },
];

export default function CommandPalette({
  open,
  onClose,
  onAction,
  onNavigateFeed,
  onNavigateArticle,
}: Props) {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setDebounced("");
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 180);
    return () => clearTimeout(t);
  }, [query]);

  const feeds = useQuery({
    queryKey: ["feeds"],
    queryFn: api.listFeeds,
    enabled: open,
  });

  const articleResults = useQuery({
    queryKey: ["cp-search", debounced],
    queryFn: () =>
      api.listArticles({ kind: "all" }, false, debounced, false, 8, 0),
    enabled: open && debounced.length > 0,
  });

  const items: Item[] = useMemo(() => {
    const q = debounced.toLowerCase();
    const out: Item[] = [];

    for (const a of ACTIONS) {
      if (q && !a.label.toLowerCase().includes(q)) continue;
      out.push({
        id: `act-${a.action}`,
        group: "action",
        icon: a.icon,
        label: a.label,
        hint: a.hint,
        run: () => onAction(a.action),
      });
    }

    const matchedFeeds = (feeds.data ?? [])
      .filter(
        (f) =>
          !q ||
          f.title.toLowerCase().includes(q) ||
          feedHost(f).toLowerCase().includes(q),
      )
      .slice(0, 6);
    for (const f of matchedFeeds) {
      out.push({
        id: `feed-${f.id}`,
        group: "feed",
        icon: null,
        feed: f,
        label: f.title,
        hint: feedHost(f),
        run: () => onNavigateFeed(f),
      });
    }

    if (q) {
      for (const a of articleResults.data ?? []) {
        out.push({
          id: `article-${a.id}`,
          group: "article",
          icon: a.isStarred ? "star-fill" : "rss",
          label: a.title,
          hint: relTime(a.publishedAt),
          run: () => onNavigateArticle(a),
        });
      }
    }

    return out;
  }, [debounced, feeds.data, articleResults.data, onAction, onNavigateFeed, onNavigateArticle]);

  useEffect(() => {
    if (active >= items.length) setActive(0);
  }, [items.length, active]);

  if (!open) return null;

  const run = (it: Item) => {
    it.run();
    onClose();
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % Math.max(items.length, 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i - 1 + items.length) % Math.max(items.length, 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const it = items[active];
      if (it) run(it);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  let flat = -1;
  const renderGroup = (key: Item["group"], title: string) => {
    const list = items.filter((i) => i.group === key);
    if (list.length === 0) return null;
    return (
      <div key={key}>
        <div className="cp-group-title">{title}</div>
        {list.map((it) => {
          flat++;
          const idx = flat;
          return (
            <div
              key={it.id}
              className={`cp-item ${idx === active ? "active" : ""}`}
              onMouseEnter={() => setActive(idx)}
              onClick={() => run(it)}
            >
              <span className="cp-ico">
                {it.feed ? (
                  <span
                    className="sb-feed-avatar"
                    style={{
                      background: feedColor(it.feed.id),
                      width: 18,
                      height: 18,
                      borderRadius: 4,
                    }}
                  >
                    {feedAvatar(it.feed.title)}
                  </span>
                ) : (
                  <Icon name={it.icon ?? "rss"} size={15} />
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
    <div className="cp-backdrop" onClick={onClose}>
      <div className="cp" onClick={(e) => e.stopPropagation()}>
        <div className="cp-input">
          <Icon name="search" size={16} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="搜索文章、订阅源，或运行命令…"
          />
          <span className="cp-esc">ESC</span>
        </div>
        <div className="cp-list">
          {items.length === 0 ? (
            <div className="cp-empty">
              {articleResults.isFetching ? "搜索中…" : "没有结果"}
            </div>
          ) : (
            <>
              {renderGroup("action", "操作")}
              {renderGroup("feed", "订阅源")}
              {renderGroup("article", "文章")}
            </>
          )}
        </div>
        <div className="cp-footer">
          <span>
            <kbd>↑</kbd>
            <kbd>↓</kbd> 选择
          </span>
          <span>
            <kbd>⏎</kbd> 打开
          </span>
          <span>
            <kbd>esc</kbd> 关闭
          </span>
          <div style={{ flex: 1 }} />
          <span>支持文章 · 订阅源 · 命令</span>
        </div>
      </div>
    </div>
  );
}
