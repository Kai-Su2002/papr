// Type mirrors of the Rust domain model (see src-tauri/src/models.rs).

export type SourceType = "rss" | "youtube" | "podcast" | "mastodon" | "bluesky";

export interface Folder {
  id: number;
  name: string;
  position: number;
}

export interface Feed {
  id: number;
  feedUrl: string;
  siteUrl: string | null;
  title: string;
  description: string | null;
  faviconUrl: string | null;
  folderId: number | null;
  sourceType: SourceType;
  lastFetchedAt: string | null;
  fetchError: string | null;
  unreadCount: number;
}

export interface Enclosure {
  url: string;
  mimeType: string | null;
  length: number | null;
}

export interface ArticleSummary {
  id: number;
  feedId: number;
  feedTitle: string;
  sourceType: SourceType;
  title: string;
  author: string | null;
  snippet: string | null;
  imageUrl: string | null;
  url: string | null;
  publishedAt: string | null;
  isRead: boolean;
  isStarred: boolean;
  readLater: boolean;
}

export interface ArticleDetail {
  id: number;
  feedId: number;
  feedTitle: string;
  sourceType: SourceType;
  title: string;
  author: string | null;
  url: string | null;
  contentHtml: string | null;
  extractedHtml: string | null;
  imageUrl: string | null;
  publishedAt: string | null;
  isRead: boolean;
  isStarred: boolean;
  readLater: boolean;
  aiSummary: string | null;
  enclosures: Enclosure[];
}

export interface SmartCounts {
  unread: number;
  starred: number;
  readLater: number;
}

// Mirrors the adjacently-tagged Rust `ArticleQuery` enum.
export type ArticleQuery =
  | { kind: "all" }
  | { kind: "unread" }
  | { kind: "starred" }
  | { kind: "readLater" }
  | { kind: "feed"; value: number }
  | { kind: "folder"; value: number };

export type AiEvent =
  | { type: "delta"; data: string }
  | { type: "done" }
  | { type: "error"; data: string };

export type RefreshProgress =
  | { event: "started"; data: { total: number } }
  | {
      event: "feedDone";
      data: { feedId: number; newArticles: number; error: string | null };
    }
  | { event: "finished"; data: { newArticles: number } };
