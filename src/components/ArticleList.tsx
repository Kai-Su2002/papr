import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useMemo, useRef, useState } from "react";
import { openUrl } from "@tauri-apps/plugin-opener";
import * as api from "../api";
import { useUi } from "../store";
import { useArticleActions } from "../hooks/articleActions";
import { feedAvatar, feedColor, relTime } from "../lib/feedMeta";
import type { ArticleSummary, Feed } from "../types";
import Icon from "./Icon";
import ContextMenu, { type MenuEntry } from "./ContextMenu";

const PAGE = 60;

interface Props {
  onToast: (msg: string) => void;
}

interface Hover {
  article: ArticleSummary;
  top: number;
  left: number;
}

export default function ArticleList({ onToast }: Props) {
  const qc = useQueryClient();
  const actions = useArticleActions();
  const query = useUi((s) => s.query);
  const queryLabel = useUi((s) => s.queryLabel);
  const unreadOnly = useUi((s) => s.unreadOnly);
  const toggleUnreadOnly = useUi((s) => s.toggleUnreadOnly);
  const sortOldest = useUi((s) => s.sortOldest);
  const toggleSort = useUi((s) => s.toggleSort);
  const viewMode = useUi((s) => s.viewMode);
  const density = useUi((s) => s.density);
  const showCardThumbs = useUi((s) => s.prefs.showCardThumbs);
  const selectedId = useUi((s) => s.selectedArticleId);
  const openArticle = useUi((s) => s.openArticle);

  const feeds = useQuery({ queryKey: ["feeds"], queryFn: api.listFeeds });
  const feedById = useMemo(() => {
    const m: Record<number, Feed> = {};
    for (const f of feeds.data ?? []) m[f.id] = f;
    return m;
  }, [feeds.data]);

  const [menu, setMenu] = useState<{
    x: number;
    y: number;
    article: ArticleSummary;
  } | null>(null);
  const [hover, setHover] = useState<Hover | null>(null);
  const hoverTimer = useRef<number | undefined>(undefined);

  const browse = useInfiniteQuery({
    queryKey: ["articles", query, unreadOnly, sortOldest],
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      api.listArticles(query, unreadOnly, null, sortOldest, PAGE, pageParam as number),
    getNextPageParam: (last, all) =>
      last.length < PAGE ? undefined : all.length * PAGE,
  });

  const items: ArticleSummary[] = useMemo(
    () => browse.data?.pages.flat() ?? [],
    [browse.data],
  );

  const scrollRef = useRef<HTMLDivElement>(null);
  const rowEstimate =
    viewMode === "card"
      ? 320
      : density === "compact"
        ? 78
        : density === "spacious"
          ? 122
          : 98;
  const virt = useVirtualizer({
    count: items.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => rowEstimate,
    overscan: 8,
  });

  // Load the next page as the end approaches.
  useEffect(() => {
    const last = virt.getVirtualItems().at(-1);
    if (
      last &&
      last.index >= items.length - 6 &&
      browse.hasNextPage &&
      !browse.isFetchingNextPage
    ) {
      browse.fetchNextPage();
    }
  }, [virt.getVirtualItems(), items.length, browse]);

  // Keep the keyboard-selected article visible.
  useEffect(() => {
    if (selectedId == null) return;
    const i = items.findIndex((a) => a.id === selectedId);
    if (i >= 0) virt.scrollToIndex(i, { align: "auto" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  useEffect(() => () => window.clearTimeout(hoverTimer.current), []);

  const markAll = async () => {
    try {
      const n = await api.markAllRead(query);
      await qc.invalidateQueries();
      onToast(n > 0 ? `已将 ${n} 篇标为已读` : "没有需要标记的文章");
    } catch (e) {
      onToast(String(e));
    }
  };

  const onHover = (a: ArticleSummary, e: React.MouseEvent) => {
    window.clearTimeout(hoverTimer.current);
    const rect = e.currentTarget.getBoundingClientRect();
    hoverTimer.current = window.setTimeout(() => {
      setHover({ article: a, top: rect.top + 4, left: rect.right + 12 });
    }, 650);
  };
  const leaveHover = () => {
    window.clearTimeout(hoverTimer.current);
    setHover(null);
  };

  const articleMenu = (a: ArticleSummary): MenuEntry[] => [
    { icon: "open", label: "打开", shortcut: "⏎", onClick: () => openArticle(a.id) },
    ...(a.url
      ? ([
          {
            icon: "globe",
            label: "在浏览器中打开",
            shortcut: "⌘O",
            onClick: () => openUrl(a.url!).catch(() => {}),
          },
        ] as MenuEntry[])
      : []),
    { separator: true },
    {
      icon: a.isStarred ? "star-fill" : "star",
      label: a.isStarred ? "取消星标" : "星标",
      shortcut: "S",
      onClick: () => actions.setStarred(a.id, !a.isStarred),
    },
    {
      icon: a.readLater ? "bookmark-fill" : "bookmark",
      label: a.readLater ? "从稍后读移除" : "加入稍后读",
      shortcut: "B",
      onClick: () => actions.setReadLater(a.id, !a.readLater),
    },
    {
      icon: a.isRead ? "circle" : "check",
      label: a.isRead ? "标为未读" : "标为已读",
      shortcut: "U",
      onClick: () => actions.setRead(a.id, !a.isRead),
    },
    ...(a.url
      ? ([
          { separator: true },
          {
            icon: "copy",
            label: "复制链接",
            onClick: () =>
              navigator.clipboard
                .writeText(a.url!)
                .then(() => onToast("链接已复制"), () => {}),
          },
        ] as MenuEntry[])
      : []),
  ];

  const vItems = virt.getVirtualItems();
  const showCount = `${items.length}${browse.hasNextPage ? "+" : ""} 篇`;

  return (
    <div className="list">
      <div className="list-header" data-tauri-drag-region>
        <h1 className="list-title">
          {queryLabel}
          <span className="count">{browse.isLoading ? "加载中…" : showCount}</span>
        </h1>
        <div className="list-meta">
          <button
            className={`list-meta-btn ${!sortOldest ? "on" : ""}`}
            onClick={toggleSort}
            title="排序"
          >
            <Icon name={sortOldest ? "arrow-up" : "arrow-down"} size={12} />
            {sortOldest ? "最旧优先" : "最新优先"}
          </button>
          <button
            className={`list-meta-btn ${unreadOnly ? "on" : ""}`}
            onClick={toggleUnreadOnly}
            title="隐藏已读 (V)"
          >
            <Icon name={unreadOnly ? "eye-off" : "eye"} size={12} />
            {unreadOnly ? "仅未读" : "全部"}
          </button>
          <div style={{ flex: 1 }} />
          <button
            className="list-meta-btn"
            onClick={markAll}
            title="全部标为已读 (⇧A)"
          >
            <Icon name="check-all" size={12} />
            标为已读
          </button>
        </div>
      </div>

      <div className="list-scroll" ref={scrollRef}>
        {browse.isLoading && (
          <div>
            {Array.from({ length: 7 }).map((_, i) => (
              <div className="sk-art" key={i}>
                <div className="sk-line" style={{ width: "40%" }} />
                <div className="sk-line" style={{ width: "92%", height: 12 }} />
                <div className="sk-line" style={{ width: "70%" }} />
              </div>
            ))}
          </div>
        )}

        {!browse.isLoading && items.length === 0 && (
          <div className="empty" style={{ height: 240 }}>
            <div className="glyph">
              <Icon name="check" size={22} />
            </div>
            <div>这里没有文章了 — 享受一下空白</div>
          </div>
        )}

        {!browse.isLoading && items.length > 0 && (
          <div
            style={{
              height: virt.getTotalSize(),
              position: "relative",
              width: "100%",
            }}
          >
            {vItems.map((vi) => {
              const a = items[vi.index];
              const feed = feedById[a.feedId];
              const color = feedColor(a.feedId);
              return (
                <div
                  key={a.id}
                  data-index={vi.index}
                  ref={virt.measureElement}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${vi.start}px)`,
                  }}
                >
                  <div
                    className={`art ${viewMode === "card" ? "card" : ""} ${
                      selectedId === a.id ? "active" : ""
                    } ${a.isRead ? "read" : ""}`}
                    onClick={() => openArticle(a.id)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setMenu({ x: e.clientX, y: e.clientY, article: a });
                    }}
                    onMouseEnter={(e) => onHover(a, e)}
                    onMouseLeave={leaveHover}
                  >
                    {viewMode === "card" && showCardThumbs && (
                      <div className="art-thumb">
                        {a.imageUrl ? (
                          <img
                            src={a.imageUrl}
                            alt=""
                            loading="lazy"
                            style={{
                              position: "absolute",
                              inset: 0,
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          <svg
                            viewBox="0 0 200 112"
                            preserveAspectRatio="xMidYMid slice"
                          >
                            <defs>
                              <pattern
                                id={`p-${a.id}`}
                                width="8"
                                height="8"
                                patternUnits="userSpaceOnUse"
                                patternTransform="rotate(135)"
                              >
                                <line
                                  x1="0"
                                  y1="0"
                                  x2="0"
                                  y2="8"
                                  stroke={color}
                                  strokeWidth="1.4"
                                  opacity="0.18"
                                />
                              </pattern>
                            </defs>
                            <rect
                              width="200"
                              height="112"
                              fill={`url(#p-${a.id})`}
                            />
                            <text
                              x="100"
                              y="64"
                              textAnchor="middle"
                              fontSize="32"
                              fontWeight="700"
                              fill={color}
                              opacity="0.55"
                              fontFamily="Inter Tight, sans-serif"
                            >
                              {feedAvatar(a.feedTitle)}
                            </text>
                          </svg>
                        )}
                      </div>
                    )}
                    <div className="art-head">
                      {!a.isRead && <span className="art-dot" />}
                      <span className="art-feed">{a.feedTitle}</span>
                      {feed && feed.sourceType !== "rss" && (
                        <span className="src-badge">{feed.sourceType}</span>
                      )}
                      <span className="art-sep">·</span>
                      <span className="art-time">{relTime(a.publishedAt)}</span>
                      {a.isStarred && (
                        <span className="art-star">
                          <Icon name="star-fill" size={12} />
                        </span>
                      )}
                      {a.readLater && !a.isStarred && (
                        <span className="art-star">
                          <Icon name="bookmark-fill" size={12} />
                        </span>
                      )}
                    </div>
                    <h3 className="art-title">{a.title}</h3>
                    {a.snippet && <p className="art-snippet">{a.snippet}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div style={{ height: 60 }} />
      </div>

      {hover && <HoverPreview {...hover} feedTitle={hover.article.feedTitle} />}

      {menu && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          items={articleMenu(menu.article)}
          onClose={() => setMenu(null)}
        />
      )}
    </div>
  );
}

function HoverPreview({
  article,
  top,
  left,
  feedTitle,
}: Hover & { feedTitle: string }) {
  const adjLeft = Math.min(left, window.innerWidth - 360);
  const adjTop = Math.min(top, window.innerHeight - 200);
  return (
    <div className="hover-preview" style={{ top: adjTop, left: adjLeft }}>
      <div className="hp-feed">{feedTitle}</div>
      <div className="hp-title">{article.title}</div>
      {article.snippet && <div className="hp-body">{article.snippet}</div>}
      <div className="hp-meta">
        {[article.author, relTime(article.publishedAt)].filter(Boolean).join(" · ")}
      </div>
    </div>
  );
}
