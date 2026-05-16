import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import * as api from "../api";
import Icon from "./Icon";

interface Props {
  onClose: () => void;
  onToast: (msg: string) => void;
}

/** Subscribe to a new feed — design-styled centered modal. */
export default function AddFeedDialog({ onClose, onToast }: Props) {
  const qc = useQueryClient();
  const [url, setUrl] = useState("");
  const [folderId, setFolderId] = useState<number | null>(null);
  const folders = useQuery({ queryKey: ["folders"], queryFn: api.listFolders });

  const add = useMutation({
    mutationFn: () => api.addFeed(url.trim(), folderId),
    onSuccess: (feed) => {
      qc.invalidateQueries();
      onToast(`已订阅 ${feed.title}`);
      onClose();
    },
  });

  const submit = () => {
    if (url.trim() && !add.isPending) add.mutate();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>添加订阅源</h2>
        <p className="modal-hint">
          粘贴一个订阅源地址，或任意网站地址 — Lumen 会自动发现它的 RSS。
        </p>
        <input
          className="modal-input"
          type="text"
          autoFocus
          placeholder="https://example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
            if (e.key === "Escape") onClose();
          }}
        />
        {(folders.data?.length ?? 0) > 0 && (
          <select
            className="s-select"
            style={{ width: "100%" }}
            value={folderId ?? ""}
            onChange={(e) =>
              setFolderId(e.target.value ? Number(e.target.value) : null)
            }
          >
            <option value="">不归入文件夹</option>
            {folders.data!.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        )}
        {add.isError && <div className="modal-error">{String(add.error)}</div>}
        <div className="modal-actions">
          <button className="s-btn" onClick={onClose}>
            取消
          </button>
          <button
            className="s-btn primary"
            onClick={submit}
            disabled={!url.trim() || add.isPending}
          >
            <Icon name="plus" size={12} />
            {add.isPending ? "添加中…" : "订阅"}
          </button>
        </div>
      </div>
    </div>
  );
}
