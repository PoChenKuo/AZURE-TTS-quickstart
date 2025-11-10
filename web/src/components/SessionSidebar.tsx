import { useState } from "react";
import type { FormEvent } from "react";
import clsx from "clsx";
import type { ChatSession } from "../types";

type SessionSidebarProps = {
  sessions: ChatSession[] | undefined;
  activeSessionId: number | null;
  onSelect: (sessionId: number | null) => void;
  onNewChat: () => void;
  onDelete: (sessionId: number) => void;
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
    <aside className="conversation-sidebar">
      <button className="btn btn-secondary" type="button" onClick={onNewChat}>
        + New chat
      </button>
      <div className="session-list">
        {(sessions ?? []).map((session) => (
          <div
            key={session.id}
            className={clsx("session-item", {
              "session-item-active": session.id === activeSessionId,
            })}
            role="group"
          >
            <div
              role="button"
              tabIndex={0}
              className="session-click"
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
              <div className="session-item-main">
                {renamingId === session.id ? (
                  // Replace the static label with an inline rename form for the selected session.
                  <form className="session-rename-form" onSubmit={handleRenameSubmit}>
                    <input
                      className="session-rename-input"
                      value={renameValue}
                      onChange={(event) => setRenameValue(event.target.value)}
                      autoFocus
                    />
                    <div className="session-rename-actions">
                      <button type="submit" className="btn btn-primary">
                        Save
                      </button>
                      <button
                        type="button"
                        className="btn btn-text"
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
                    <span className="session-title">{session.title}</span>
                    <span className="session-meta">
                      {new Date(session.updatedUtc).toLocaleTimeString()}
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className="session-actions">
              <button
                type="button"
                className="session-rename"
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
                className="session-delete"
                onClick={(event) => {
                  event.stopPropagation();
                  if (session.id != null) {
                    onDelete(session.id);
                  }
                }}
                aria-label="Delete chat"
              >
                X
              </button>
            </div>
          </div>
        ))}
        {!sessions?.length && (
          <p className="text-muted" style={{ padding: "0.5rem 0.2rem" }}>
            Creating your first chat...
          </p>
        )}
      </div>
    </aside>
  );
}
