const DIFF_TAB_PREFIX = "scribam-diff:";

export function isDiffTabId(tabId: string): boolean {
  return tabId.startsWith(DIFF_TAB_PREFIX);
}

export function diffTabId(relativePath: string): string {
  return `${DIFF_TAB_PREFIX}${relativePath}`;
}

export function parseDiffTabId(tabId: string): string | null {
  if (!tabId.startsWith(DIFF_TAB_PREFIX)) {
    return null;
  }
  return tabId.slice(DIFF_TAB_PREFIX.length);
}

export function isPersistedEditorTabId(tabId: string): boolean {
  return !isDiffTabId(tabId);
}
