import type { ManuscriptSummary } from "@scribo/core";

const dateTimeOptions: Intl.DateTimeFormatOptions = {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
};

const dateShortOptions: Intl.DateTimeFormatOptions = {
  month: "short",
  day: "numeric",
};

function formatDate(iso: string, options: Intl.DateTimeFormatOptions): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }
  return parsed.toLocaleString(undefined, options);
}

export function formatManuscriptEdited(iso: string): string {
  return formatDate(iso, dateShortOptions);
}

export function formatManuscriptTimestamp(iso: string): string {
  return formatDate(iso, dateTimeOptions);
}

export function formatCompactMeta(item: ManuscriptSummary): string {
  const edited = formatManuscriptEdited(item.updatedAt);
  if (!item.filePath || item.source === "internal") {
    return `App storage · ${edited}`;
  }
  const segments = item.filePath.split(/[/\\]/);
  if (segments.length <= 1) {
    return edited;
  }
  const folder = segments.slice(0, -1).join("/");
  return `${folder} · ${edited}`;
}

export function formatManuscriptPath(item: ManuscriptSummary): string | null {
  if (!item.filePath || item.source === "internal") {
    return "App storage";
  }
  return item.filePath.replace(/^\/Users\/[^/]+/, "~");
}
