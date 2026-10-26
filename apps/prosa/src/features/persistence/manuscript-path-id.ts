/** Matches Rust `manuscript_id_for_path` (URL-safe base64, no padding). */
export function manuscriptIdForPath(pathKey: string): string {
  const bytes = new TextEncoder().encode(pathKey);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  const encoded = btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return `ms_path_${encoded}`;
}
