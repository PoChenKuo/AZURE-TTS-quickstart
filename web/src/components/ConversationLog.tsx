import { AudioPreview } from "./AudioPreview";
import type { ChatMessage, UtteranceRecord } from "../types";

type ConversationLogProps = {
  messages: ChatMessage[];
  utteranceById: Map<number, UtteranceRecord>;
};

// Displays the chronological transcript plus any cached audio previews.
export function ConversationLog({ messages, utteranceById }: ConversationLogProps) {
  if (!messages.length) {
    return <p className="text-muted">No messages yet. Say hello to Gemini!</p>;
  }

  return (
    <div className="conversation-log">
      {messages.map((message) => (
        <article key={message.id} className={`message message-${message.role}`}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span className="pill">{message.role.toUpperCase()}</span>
            <span className="text-muted">
              {new Date(message.createdUtc).toLocaleTimeString()}
            </span>
          </div>
          <p className="message-content">{message.content}</p>
          {message.geminiMeta?.tokens && (
            <p className="text-muted">
              {message.geminiMeta.tokens} tokens | {message.geminiMeta.model}
            </p>
          )}
          {message.linkedUtteranceId &&
            utteranceById.get(message.linkedUtteranceId) && (
              <AudioPreview
                buffer={utteranceById.get(message.linkedUtteranceId)!.audioBlob}
              />
            )}
        </article>
      ))}
    </div>
  );
}
