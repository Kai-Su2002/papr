import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Icon, { type IconName } from "./Icon";

export type MenuEntry =
  | {
      icon?: IconName;
      label: string;
      shortcut?: string;
      danger?: boolean;
      onClick: () => void;
    }
  | { separator: true };

interface Props {
  x: number;
  y: number;
  items: MenuEntry[];
  onClose: () => void;
}

/** Floating context menu, clamped inside the viewport — design `.ctx-menu`. */
export default function ContextMenu({ x, y, items, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: x, top: y });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    let left = x;
    let top = y;
    if (left + r.width > window.innerWidth - 8) left = window.innerWidth - r.width - 8;
    if (top + r.height > window.innerHeight - 8) top = window.innerHeight - r.height - 8;
    setPos({ left, top });
  }, [x, y]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const t = window.setTimeout(() => {
      document.addEventListener("mousedown", onDown);
      window.addEventListener("keydown", onKey);
    }, 0);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      className="ctx-menu"
      ref={ref}
      style={{ left: pos.left, top: pos.top }}
      onClick={(e) => e.stopPropagation()}
    >
      {items.map((it, i) =>
        "separator" in it ? (
          <div key={i} className="ctx-sep" />
        ) : (
          <div
            key={i}
            className="ctx-item"
            style={it.danger ? { color: "oklch(0.55 0.17 28)" } : undefined}
            onClick={() => {
              it.onClick();
              onClose();
            }}
          >
            <span className="ctx-ico">
              {it.icon && <Icon name={it.icon} size={13} />}
            </span>
            {it.label}
            {it.shortcut && <span className="ctx-shortcut">{it.shortcut}</span>}
          </div>
        ),
      )}
    </div>
  );
}
