// Shared article mutations. Both the reading pane and keyboard shortcuts go
// through this so optimistic cache patching stays consistent everywhere.

import { useQueryClient } from "@tanstack/react-query";
import * as api from "../api";
import type { ArticleSummary } from "../types";

type Patch = Partial<
  Pick<ArticleSummary, "isRead" | "isStarred" | "readLater">
>;

export function useArticleActions() {
  const qc = useQueryClient();

  /** Optimistically patch an article across every cache that may hold it. */
  const patch = (id: number, p: Patch) => {
    // Paginated browse lists.
    qc.setQueriesData({ queryKey: ["articles"] }, (old: any) => {
      if (!old?.pages) return old;
      return {
        ...old,
        pages: old.pages.map((page: ArticleSummary[]) =>
          page.map((x) => (x.id === id ? { ...x, ...p } : x)),
        ),
      };
    });
    // Flat hybrid-search results.
    qc.setQueriesData({ queryKey: ["search"] }, (old: any) =>
      Array.isArray(old)
        ? old.map((x: ArticleSummary) => (x.id === id ? { ...x, ...p } : x))
        : old,
    );
    // The open article detail.
    qc.setQueryData(["article", id], (old: any) =>
      old ? { ...old, ...p } : old,
    );
  };

  const refreshCounts = () => {
    qc.invalidateQueries({ queryKey: ["counts"] });
    qc.invalidateQueries({ queryKey: ["feeds"] });
  };

  return {
    patch,
    async setRead(id: number, read: boolean) {
      await api.markRead(id, read);
      patch(id, { isRead: read });
      refreshCounts();
    },
    async setStarred(id: number, starred: boolean) {
      await api.markStarred(id, starred);
      patch(id, { isStarred: starred });
      refreshCounts();
    },
    async setReadLater(id: number, value: boolean) {
      await api.markReadLater(id, value);
      patch(id, { readLater: value });
      refreshCounts();
    },
  };
}
