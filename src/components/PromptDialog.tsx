import { useState } from "react";

interface Props {
  title: string;
  initialValue?: string;
  placeholder?: string;
  confirmLabel?: string;
  onSubmit: (value: string) => void;
  onClose: () => void;
}

/** A single-field modal prompt — feed / folder rename, new folder. */
export default function PromptDialog({
  title,
  initialValue = "",
  placeholder,
  confirmLabel = "确定",
  onSubmit,
  onClose,
}: Props) {
  const [value, setValue] = useState(initialValue);

  const submit = () => {
    const v = value.trim();
    if (!v) return;
    onSubmit(v);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{title}</h2>
        <input
          className="modal-input"
          autoFocus
          value={value}
          placeholder={placeholder}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
            if (e.key === "Escape") onClose();
          }}
          style={{ marginTop: 8 }}
        />
        <div className="modal-actions">
          <button className="s-btn" onClick={onClose}>
            取消
          </button>
          <button className="s-btn primary" onClick={submit} disabled={!value.trim()}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
