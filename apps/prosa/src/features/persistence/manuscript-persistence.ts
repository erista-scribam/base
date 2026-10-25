import type { ManuscriptSummary } from "@scribo/core";
import type { ProsaDocument } from "@scribo/document-model";
import {
  saveManuscriptDocument,
  saveRecoverySnapshot,
} from "./tauri-manuscripts";

export type PersistSaveState = "idle" | "dirty" | "saving" | "saved" | "error";

const DEBOUNCE_MS = 800;
const MAX_WAIT_MS = 3000;

export interface PersistCallbacks {
  onStateChange: (state: PersistSaveState) => void;
  onSaved: (summary: ManuscriptSummary) => void;
  onError: (message: string) => void;
}

export class ManuscriptPersistence {
  private revision = 0;
  private lastPersistedRevision = 0;
  private inflightRevision: number | null = null;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private maxWaitTimer: ReturnType<typeof setTimeout> | null = null;
  private firstDirtyAt: number | null = null;
  private pendingManuscriptId: string | null = null;
  private pendingDocument: ProsaDocument | null = null;
  private pendingSummary: ManuscriptSummary | null = null;

  constructor(private readonly callbacks: PersistCallbacks) {}

  noteRevision(): number {
    this.revision += 1;
    return this.revision;
  }

  getRevision(): number {
    return this.revision;
  }

  markDirty(): void {
    if (this.revision === this.lastPersistedRevision) {
      this.callbacks.onStateChange("dirty");
    }
  }

  schedulePersist(
    manuscriptId: string,
    document: ProsaDocument,
    summary: ManuscriptSummary | null,
  ): void {
    this.pendingManuscriptId = manuscriptId;
    this.pendingDocument = document;
    this.pendingSummary = summary;
    this.markDirty();
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    if (!this.firstDirtyAt) {
      this.firstDirtyAt = Date.now();
      this.maxWaitTimer = setTimeout(() => {
        void this.flushPending();
      }, MAX_WAIT_MS);
    }

    this.debounceTimer = setTimeout(() => {
      void this.flushPending();
    }, DEBOUNCE_MS);
  }

  async flushPending(): Promise<void> {
    if (!this.pendingManuscriptId || !this.pendingDocument) {
      return;
    }
    await this.flush(this.pendingManuscriptId, this.pendingDocument, this.pendingSummary);
  }

  clearTimers(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    if (this.maxWaitTimer) {
      clearTimeout(this.maxWaitTimer);
      this.maxWaitTimer = null;
    }
    this.firstDirtyAt = null;
  }

  async flush(
    manuscriptId: string,
    document: ProsaDocument,
    summary: ManuscriptSummary | null,
  ): Promise<void> {
    this.clearTimers();
    const revision = this.revision;
    if (revision <= this.lastPersistedRevision) {
      return;
    }
    if (this.inflightRevision != null && revision <= this.inflightRevision) {
      return;
    }

    this.inflightRevision = revision;
    this.callbacks.onStateChange("saving");

    try {
      await saveRecoverySnapshot(manuscriptId, document, summary);
      const saved = await saveManuscriptDocument(manuscriptId, document, summary);
      if (revision < this.revision) {
        this.callbacks.onStateChange(this.revision > this.lastPersistedRevision ? "dirty" : "saved");
        return;
      }
      this.lastPersistedRevision = revision;
      this.callbacks.onStateChange("saved");
      this.callbacks.onSaved(saved);
    } catch (cause) {
      if (revision >= this.revision) {
        this.callbacks.onStateChange("error");
        this.callbacks.onError(
          cause instanceof Error ? cause.message : "Save failed — your edits are still in memory",
        );
      }
    } finally {
      if (this.inflightRevision === revision) {
        this.inflightRevision = null;
      }
      if (this.revision > this.lastPersistedRevision) {
        this.callbacks.onStateChange("dirty");
      }
    }
  }

  resetBaseline(): void {
    this.revision = 0;
    this.lastPersistedRevision = 0;
    this.inflightRevision = null;
    this.clearTimers();
    this.callbacks.onStateChange("idle");
  }
}
