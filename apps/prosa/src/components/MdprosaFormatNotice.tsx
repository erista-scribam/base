import { useCallback, useState } from "react";

const STORAGE_KEY = "prosa-mdprosa-format-notice-dismissed";

function readDismissed(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export interface MdprosaFormatNoticeProps {
  className?: string;
}

export function MdprosaFormatNotice({ className }: MdprosaFormatNoticeProps) {
  const [dismissed, setDismissed] = useState(readDismissed);

  const dismiss = useCallback(() => {
    setDismissed(true);
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // Ignore private mode / quota.
    }
  }, []);

  if (dismissed) {
    return null;
  }

  return (
    <div
      className={className ? `mdprosa-format-notice ${className}` : "mdprosa-format-notice"}
      role="status"
    >
      <p className="mdprosa-format-notice-text">
        Manuscripts save as <strong>.mdprosa</strong> — Scribam&apos;s plain-text prose format with
        stable structure anchors. It starts from familiar text habits but is not limited to generic
        Markdown; we extend it as Prosa evolves. Existing <strong>.md</strong> files still open and
        convert on save.
      </p>
      <button type="button" className="mdprosa-format-notice-dismiss" onClick={dismiss}>
        Dismiss
      </button>
    </div>
  );
}
