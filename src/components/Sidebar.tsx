import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import * as api from "../api";
import { useUi } from "../store";
import { feedAvatar, feedColor } from "../lib/feedMeta";
import type { ArticleQuery, Feed, Folder } from "../types";
import Icon, { type IconName } from "./Icon";
import ContextMenu, { type MenuEntry } from "./ContextMenu";
import PromptDialog from "./PromptDialog";

interface Props {
  onAddFeed: () => void;
  onOpenSettings: (section?: string) => void;
  onSearchClick: () => void;
  onRefresh: () => void;
  refreshing: boolean;
  onToast: (msg: string) => void;
}

const sameQuery = (a: ArticleQuery, b: ArticleQuery) =>
  JSON.stringify(a) === JSON.stringify(b);

type Menu =
  | { x: number; y: number; kind: "feed"; feed: Feed }
  | { x: number; y: number; kind: "folder"; folder: Folder };

type Prompt = {
  title: string;
  initial: string;
  placeholder: string;
  onSubmit: (v: string) => void;
};

function SbItem({
  icon,
  label,
  count,
  active,
  onClick,
}: {
  icon: IconName;
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <div className={`sb-item ${active ? "active" : ""}`} onClick={onClick}>
      <span className="sb-ico">
        <Icon name={icon} size={15} />
      </span>
      <span className="sb-label">{label}</span>
      {count != null && count > 0 && <span className="sb-count">{count}</span>}
    </div>
  );
}

export default function Sidebar({
  onAddFeed,
  onOpenSettings,
  onSearchClick,
  onRefresh,
  refreshing,
  onToast,
}: Props) {
  const qc = useQueryClient();
  const query = useUi((s) => s.query);
  const select = useUi((s) => s.select);
  const showCounts = useUi((s) => s.prefs.showSidebarCounts);

  const feeds = useQuery({ queryKey: ["feeds"], queryFn: api.listFeeds });
  const folders = useQuery({ queryKey: ["folders"], queryFn: api.listFolders });
  const counts = useQuery({ queryKey: ["counts"], queryFn: api.smartCounts });

  const [collapsed, setCollapsed] = useState<Record<number, boolean>>(() => {
    try {
      return JSON.parse(localStorage.getItem("collapsedFolders") || "{}");
    } catch {
      return {};
    }
  });
  useEffect(() => {
    localStorage.setItem("collapsedFolders", JSON.stringify(collapsed));
  }, [collapsed]);

  const [menu, setMenu] = useState<Menu | null>(null);
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [dragId, setDragId] = useState<number | null>(null);
  const [dropFolder, setDropFolder] = useState<number | "none" | null>(null);

  const guard = (p: Promise<unknown>, ok: string) =>
    p
      .then(() => {
        qc.invalidateQueries();
        onToast(ok);
      })
      .catch((e) => onToast(String(e)));

  const allFeeds = feeds.data ?? [];
  const allFolders = folders.data ?? [];
  const ungrouped = allFeeds.filter((f) => f.folderId == null);
  const isActive = (q: ArticleQuery) => sameQuery(q, query);

  // ── drag to move a feed between folders ──
  const handleDrop = (target: number | null) => {
    const feed = allFeeds.find((f) => f.id === dragId);
    setDragId(null);
    setDropFolder(null);
    if (!feed || feed.folderId === target) return;
    const folderName =
      target == null ? "未分类" : allFolders.find((f) => f.id === target)?.name ?? "";
    guard(api.moveFeed(feed.id, target), `已移动 ${feed.title} → ${folderName}`);
  };

  // ── feed / folder context menus ──
  const feedMenu = (f: Feed): MenuEntry[] => {
    const moves: MenuEntry[] = allFolders
      .filter((fo) => fo.id !== f.folderId)
      .map((fo) => ({
        icon: "folder" as const,
        label: `移动到「${fo.name}」`,
        onClick: () => guard(api.moveFeed(f.id, fo.id), `已移动到 ${fo.name}`),
      }));
    if (f.folderId != null)
      moves.push({
        icon: "folder",
        label: "移出文件夹",
        onClick: () => guard(api.moveFeed(f.id, null), "已移出文件夹"),
      });
    return [
      {
        icon: "check-all",
        label: "全部标为已读",
        onClick: () =>
          guard(api.markAllRead({ kind: "feed", value: f.id }), "已全部标为已读"),
      },
      {
        icon: "settings",
        label: "重命名…",
        onClick: () =>
          setPrompt({
            title: "重命名订阅源",
            initial: f.title,
            placeholder: "订阅源名称",
            onSubmit: (v) => guard(api.renameFeed(f.id, v), "已重命名"),
          }),
      },
      ...(moves.length ? [{ separator: true } as MenuEntry, ...moves] : []),
      { separator: true },
      {
        icon: "trash",
        label: "退订",
        danger: true,
        onClick: () => guard(api.deleteFeed(f.id), `已退订 ${f.title}`),
      },
    ];
  };

  const folderMenu = (folder: Folder): MenuEntry[] => [
    {
      icon: "check-all",
      label: "全部标为已读",
      onClick: () =>
        guard(api.markAllRead({ kind: "folder", value: folder.id }), "已全部标为已读"),
    },
    {
      icon: "settings",
      label: "重命名…",
      onClick: () =>
        setPrompt({
          title: "重命名文件夹",
          initial: folder.name,
          placeholder: "文件夹名称",
          onSubmit: (v) => guard(api.renameFolder(folder.id, v), "已重命名"),
        }),
    },
    { separator: true },
    {
      icon: "trash",
      label: "删除文件夹",
      danger: true,
      onClick: () => guard(api.deleteFolder(folder.id), "已删除文件夹"),
    },
  ];

  // ── feed row ──
  const feedRow = (f: Feed) => (
    <div
      key={f.id}
      className={`sb-item ${
        isActive({ kind: "feed", value: f.id }) ? "active" : ""
      } ${dragId === f.id ? "dragging" : ""}`}
      draggable
      onDragStart={() => setDragId(f.id)}
      onDragEnd={() => {
        setDragId(null);
        setDropFolder(null);
      }}
      onClick={() => select({ kind: "feed", value: f.id }, f.title)}
      onContextMenu={(e) => {
        e.preventDefault();
        setMenu({ x: e.clientX, y: e.clientY, kind: "feed", feed: f });
      }}
      title={f.fetchError ?? f.title}
    >
      <span className="sb-feed-avatar" style={{ background: feedColor(f.id) }}>
        {feedAvatar(f.title)}
      </span>
      <span className="sb-label">{f.title}</span>
      {f.fetchError && <span className="sb-warn">!</span>}
      {showCounts && f.unreadCount > 0 && (
        <span className="sb-count">{f.unreadCount}</span>
      )}
    </div>
  );

  return (
    <div className="sidebar">
      <div className="titlebar" data-tauri-drag-region />

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
        <SbItem
          icon="inbox"
          label="全部文章"
          active={isActive({ kind: "all" })}
          onClick={() => select({ kind: "all" }, "全部文章")}
        />
        <SbItem
          icon="unread"
          label="未读"
          count={showCounts ? counts.data?.unread : undefined}
          active={isActive({ kind: "unread" })}
          onClick={() => select({ kind: "unread" }, "未读")}
        />
        <SbItem
          icon="star"
          label="星标"
          count={showCounts ? counts.data?.starred : undefined}
          active={isActive({ kind: "starred" })}
          onClick={() => select({ kind: "starred" }, "星标")}
        />
        <SbItem
          icon="bookmark"
          label="稍后读"
          count={showCounts ? counts.data?.readLater : undefined}
          active={isActive({ kind: "readLater" })}
          onClick={() => select({ kind: "readLater" }, "稍后读")}
        />

        <div className="sb-section-title">
          <span>订阅源</span>
          <button onClick={onAddFeed} title="添加订阅源">
            <Icon name="plus" size={12} />
          </button>
        </div>

        {allFeeds.length === 0 && (
          <div
            style={{
              padding: "10px 12px",
              fontSize: 12,
              color: "var(--muted)",
              lineHeight: 1.5,
            }}
          >
            还没有订阅源。点击 + 添加一个。
          </div>
        )}

        {/* ungrouped feeds — also the drop zone for "move out of folder" */}
        {ungrouped.length > 0 && (
          <div
            onDragOver={(e) => {
              if (dragId != null) {
                e.preventDefault();
                setDropFolder("none");
              }
            }}
            onDrop={() => handleDrop(null)}
            style={
              dropFolder === "none"
                ? { outline: "2px solid var(--accent)", borderRadius: 8 }
                : undefined
            }
          >
            {ungrouped.map(feedRow)}
          </div>
        )}

        {allFolders.map((folder) => {
          const inFolder = allFeeds.filter((f) => f.folderId === folder.id);
          const isCollapsed = collapsed[folder.id];
          return (
            <div
              key={folder.id}
              onDragOver={(e) => {
                if (dragId != null) {
                  e.preventDefault();
                  setDropFolder(folder.id);
                }
              }}
              onDrop={() => handleDrop(folder.id)}
              style={
                dropFolder === folder.id
                  ? { outline: "2px solid var(--accent)", borderRadius: 8 }
                  : undefined
              }
            >
              <div
                className={`sb-folder ${isCollapsed ? "collapsed" : ""}`}
                onClick={() =>
                  setCollapsed((s) => ({ ...s, [folder.id]: !isCollapsed }))
                }
                onContextMenu={(e) => {
                  e.preventDefault();
                  setMenu({ x: e.clientX, y: e.clientY, kind: "folder", folder });
                }}
              >
                <Icon name="chevron-down" size={11} />
                <span>{folder.name}</span>
              </div>
              {!isCollapsed && inFolder.map(feedRow)}
            </div>
          );
        })}

        <div style={{ height: 30 }} />
      </div>

      <div className="sb-footer">
        <button title="添加订阅源 (A)" onClick={onAddFeed}>
          <Icon name="plus" size={14} />
        </button>
        <button
          title="刷新所有 (⌘R)"
          onClick={onRefresh}
          disabled={refreshing}
          className={refreshing ? "spinning" : ""}
        >
          <Icon name="refresh" size={14} />
        </button>
        <button
          title="OPML 导入 / 导出"
          onClick={() => onOpenSettings("subscriptions")}
        >
          <Icon name="open" size={14} />
        </button>
        <div className="spacer" />
        <button title="设置 (⌘,)" onClick={() => onOpenSettings()}>
          <Icon name="settings" size={14} />
        </button>
      </div>

      {menu && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          items={menu.kind === "feed" ? feedMenu(menu.feed) : folderMenu(menu.folder)}
          onClose={() => setMenu(null)}
        />
      )}
      {prompt && (
        <PromptDialog
          title={prompt.title}
          initialValue={prompt.initial}
          placeholder={prompt.placeholder}
          onSubmit={prompt.onSubmit}
          onClose={() => setPrompt(null)}
        />
      )}
    </div>
  );
}
