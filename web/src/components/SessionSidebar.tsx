import { useState } from "react";
import type { FormEvent } from "react";
import clsx from "clsx";
import type { ChatSession } from "../types";

type SessionSidebarProps = {
  sessions: ChatSession[] | undefined;
  activeSessionId: number | null;
  onSelect: (sessionId: number | null) => void;
  onNewChat: () => void;
  onDelete: (sessionId: number) => Promise<void> | void;
  onRename: (sessionId: number, title: string) => Promise<void> | void;
};

// Renders the chat list, rename UX, and per-session actions without leaking state to the parent.
export function SessionSidebar({
  sessions,
  activeSessionId,
  onSelect,
  onNewChat,
  onDelete,
  onRename,
}: SessionSidebarProps) {
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [pendingDelete, setPendingDelete] = useState<{ id: number; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleRenameSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (renamingId == null) {
      return;
    }
    const next = renameValue.trim();
    if (!next) {
      return;
    }
    await onRename(renamingId, next);
    setRenamingId(null);
  }

  function startRenaming(sessionId?: number, currentTitle = "") {
    if (!sessionId) {
      return;
    }
    setRenamingId(sessionId);
    setRenameValue(currentTitle);
  }

  return (
    <aside className="w-64 max-w-full rounded-2xl border border-white/10 bg-slate-900/60 p-4 flex flex-col gap-3 h-fit max-lg:w-full">
      <button className="btn btn-secondary w-full" type="button" onClick={onNewChat}>
        + New chat
      </button>
      <div className="flex flex-col gap-2 max-h-[70vh] overflow-y-auto pr-1">
        {(sessions ?? []).map((session) => {
          const isActive = session.id === activeSessionId;
          return (
            <div
              key={session.id}
              className={clsx(
                "flex flex-col gap-1.5 rounded-xl border border-transparent bg-slate-900/40 px-3 py-2 cursor-pointer focus-within:ring-2 focus-within:ring-cyan-400/60",
                isActive ? "border-cyan-400/70 bg-slate-900/80" : "hover:border-slate-600/40"
              )}
              role="group"
            >
              <div
                role="button"
                tabIndex={0}
                className="flex flex-col gap-1.5 outline-none"
                onClick={() => onSelect(session.id ?? null)}
                onKeyDown={(event) => {
                  if (event.target !== event.currentTarget) {
                    return;
                  }
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelect(session.id ?? null);
                  }
                }}
              >
                {renamingId === session.id ? (
                  <form className="flex flex-col gap-2" onSubmit={handleRenameSubmit}>
                    <input
                      className="w-full rounded-lg border border-slate-500/60 bg-slate-950/70 px-2 py-1 text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-400"
                      value={renameValue}
                      onChange={(event) => setRenameValue(event.target.value)}
                      autoFocus
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="submit"
                        className="rounded-full bg-sky-600 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white hover:bg-sky-500"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        className="text-xs font-semibold text-slate-300 hover:text-white"
                        onClick={(event) => {
                          event.stopPropagation();
                          setRenamingId(null);
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <span className="text-sm font-semibold text-slate-100 truncate">
                      {session.title}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(session.updatedUtc).toLocaleTimeString()}
                    </span>
                  </>
                )}
              </div>
              <div className="flex justify-end gap-2 text-xs text-slate-400">
                <button
                  type="button"
                  className="hover:text-slate-100"
                  onClick={(event) => {
                    event.stopPropagation();
                    startRenaming(session.id, session.title);
                  }}
                  aria-label="Rename chat"
                >
                  Rename
                </button>
                <button
                  type="button"
                  className="text-rose-300 hover:text-rose-200"
                  onClick={(event) => {
                    event.stopPropagation();
                    if (session.id != null) {
                      setPendingDelete({ id: session.id, title: session.title });
                    }
                  }}
                  aria-label="Delete chat"
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
        {!sessions?.length && (
          <p className="text-sm text-slate-400 px-1 py-2">Creating your first chat...</p>
        )}
      </div>
      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-slate-900 p-5 shadow-2xl space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-white">Delete chat?</h3>
              <p className="text-sm text-slate-300">
                This removes <span className="font-semibold text-white">{pendingDelete.title || "Untitled chat"}</span> and its cached audio. This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  if (isDeleting) {
                    return;
                  }
                  setPendingDelete(null);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary bg-rose-600 hover:bg-rose-500 disabled:opacity-60"
                disabled={isDeleting}
                onClick={async () => {
                  setIsDeleting(true);
                  try {
                    await Promise.resolve(onDelete(pendingDelete.id));
                  }
                  finally {
                    setIsDeleting(false);
                    setPendingDelete(null);
                  }
                }}
              >
                {isDeleting ? "Deleting..." : "Delete chat"}
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
