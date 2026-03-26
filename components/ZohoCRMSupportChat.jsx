"use client";

import { useState, useRef, useEffect } from "react";

const MOODS = {
  positive: { icon: "😊", color: "#22c55e" },
  neutral: { icon: "😐", color: "#94a3b8" },
  negative: { icon: "😟", color: "#f97316" },
  curious: { icon: "🤔", color: "#3b82f6" },
  frustrated: { icon: "😤", color: "#ef4444" },
  confused: { icon: "😕", color: "#eab308" },
};

export default function ZohoCRMSupportChat() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hello! I'm your AI support agent with access to your CRM. Share your email and I'll pull up your account right away.",
      parsed: {
        response: "Hello! I'm your AI support agent with access to your CRM. Share your email and I'll pull up your account right away.",
        user_mood: "neutral",
        suggested_questions: ["What's my deal status?", "I need to update my phone number", "I have a billing question"],
        crm_context: { contact_found: false },
      },
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionEmail, setSessionEmail] = useState(null);
  const [crmContext, setCrmContext] = useState(null);
  const [toolLog, setToolLog] = useState([]);
  const [showToolLog, setShowToolLog] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return;

    const emailMatch = text.match(/[\w.+-]+@[\w-]+\.[a-z]{2,}/i);
    if (emailMatch && !sessionEmail) setSessionEmail(emailMatch[0]);

    const userMessage = { role: "user", content: text };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const apiMessages = updatedMessages.map((m) => ({
        role: m.role,
        content: m.role === "assistant"
          ? JSON.stringify({ response: m.parsed?.response || m.content })
          : m.content,
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages, sessionEmail }),
      });

      const data = await res.json();

      if (data.crm_context?.contact_found) {
        setCrmContext(data.crm_context);
      }

      if (data.tool_calls?.length) {
        setToolLog((prev) => [...prev, ...data.tool_calls]);
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.response || data.error || "Something went wrong.",
          parsed: data,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
          parsed: { user_mood: "neutral" },
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const lastAssistantMsg = [...messages].reverse().find((m) => m.role === "assistant");
  const suggestions = lastAssistantMsg?.parsed?.suggested_questions || [];
  const mood = lastAssistantMsg?.parsed?.user_mood || "neutral";
  const moodInfo = MOODS[mood] || MOODS.neutral;

  return (
    <div style={styles.layout}>
      <aside style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <span style={styles.sidebarIcon}>🏢</span>
          <span style={styles.sidebarTitle}>CRM Context</span>
        </div>

        {crmContext?.contact_found ? (
          <div style={styles.contactCard}>
            <div style={styles.contactAvatar}>
              {crmContext.contact_name?.[0]?.toUpperCase() || "?"}
            </div>
            <div style={styles.contactInfo}>
              <div style={styles.contactName}>{crmContext.contact_name}</div>
              <div style={styles.contactBadge}>{crmContext.record_type}</div>
            </div>
            {crmContext.contact_id && (
              <div style={styles.contactId}>
                ID: {crmContext.contact_id.slice(0, 8)}…
              </div>
            )}
          </div>
        ) : (
          <div style={styles.noContact}>
            <div style={styles.noContactIcon}>👤</div>
            <div style={styles.noContactText}>No CRM record linked yet</div>
            <div style={styles.noContactHint}>Share your email to look up your account</div>
          </div>
        )}

        <div style={styles.toolLogSection}>
          <button
            style={styles.toolLogToggle}
            onClick={() => setShowToolLog((v) => !v)}
          >
            <span>🔧 CRM Actions ({toolLog.length})</span>
            <span>{showToolLog ? "▲" : "▼"}</span>
          </button>
          {showToolLog && (
            <div style={styles.toolLogList}>
              {toolLog.length === 0 && (
                <div style={styles.toolLogEmpty}>No actions yet</div>
              )}
              {toolLog.map((t, i) => (
                <div key={i} style={styles.toolLogItem}>
                  <div style={styles.toolLogName}>{t.tool.replace(/_/g, " ")}</div>
                  {t.error && <div style={styles.toolLogError}>⚠ {t.error}</div>}
                  {t.result && (
                    <div style={styles.toolLogResult}>
                      {t.result.found === false
                        ? "Not found"
                        : t.result.name || t.result.message || "✓ Success"}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={styles.moodSection}>
          <div style={styles.moodLabel}>Customer Mood</div>
          <div style={{ ...styles.moodBadge, borderColor: moodInfo.color }}>
            <span>{moodInfo.icon}</span>
            <span style={{ color: moodInfo.color, textTransform: "capitalize" }}>{mood}</span>
          </div>
        </div>
      </aside>

      <main style={styles.chatArea}>
        <div style={styles.chatHeader}>
          <div style={styles.chatHeaderLeft}>
            <div style={styles.agentDot} />
            <span style={styles.chatHeaderTitle}>Zoho CRM Support Agent</span>
          </div>
          <div style={styles.chatHeaderRight}>
            Powered by Claude + Zoho CRM
          </div>
        </div>

        <div style={styles.messages}>
          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                ...styles.messageRow,
                justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
              }}
            >
              {msg.role === "assistant" && (
                <div style={styles.agentAvatar}>🤖</div>
              )}
              <div
                style={{
                  ...styles.bubble,
                  ...(msg.role === "user" ? styles.userBubble : styles.agentBubble),
                }}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ ...styles.messageRow, justifyContent: "flex-start" }}>
              <div style={styles.agentAvatar}>🤖</div>
              <div style={{ ...styles.bubble, ...styles.agentBubble, ...styles.typingBubble }}>
                <span style={styles.dot} />
                <span style={{ ...styles.dot, animationDelay: "0.2s" }} />
                <span style={{ ...styles.dot, animationDelay: "0.4s" }} />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {suggestions.length > 0 && !loading && (
          <div style={styles.suggestions}>
            {suggestions.map((q, i) => (
              <button
                key={i}
                style={styles.suggestionBtn}
                onClick={() => sendMessage(q)}
              >
                {q}
              </button>
            ))}
          </div>
        )}

        <div style={styles.inputRow}>
          <input
            style={styles.input}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
            placeholder="Type your message or share your email…"
            disabled={loading}
          />
          <button
            style={{ ...styles.sendBtn, opacity: loading || !input.trim() ? 0.5 : 1 }}
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
          >
            Send
          </button>
        </div>
      </main>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}

const styles = {
  layout: { display: "flex", height: "100vh", background: "#0f1117", fontFamily: "'IBM Plex Sans', sans-serif", color: "#e2e8f0" },
  sidebar: { width: 280, minWidth: 280, background: "#161b27", borderRight: "1px solid #1e2736", display: "flex", flexDirection: "column", padding: "20px 16px", gap: 20, overflowY: "auto" },
  sidebarHeader: { display: "flex", alignItems: "center", gap: 8, paddingBottom: 12, borderBottom: "1px solid #1e2736" },
  sidebarIcon: { fontSize: 18 },
  sidebarTitle: { fontWeight: 600, fontSize: 14, color: "#94a3b8", letterSpacing: "0.05em", textTransform: "uppercase" },
  contactCard: { background: "#1e2736", borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, border: "1px solid #2d3748" },
  contactAvatar: { width: 52, height: 52, borderRadius: "50%", background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 700, color: "#fff" },
  contactInfo: { textAlign: "center" },
  contactName: { fontWeight: 600, fontSize: 15, color: "#e2e8f0" },
  contactBadge: { display: "inline-block", marginTop: 4, padding: "2px 10px", borderRadius: 20, background: "#1d4ed8", color: "#bfdbfe", fontSize: 11, fontWeight: 600 },
  contactId: { fontSize: 11, color: "#4b5563", fontFamily: "monospace" },
  noContact: { background: "#1e2736", borderRadius: 12, padding: 20, textAlign: "center", border: "1px dashed #2d3748" },
  noContactIcon: { fontSize: 32, marginBottom: 8 },
  noContactText: { fontSize: 13, fontWeight: 600, color: "#64748b" },
  noContactHint: { fontSize: 11, color: "#4b5563", marginTop: 4 },
  toolLogSection: { display: "flex", flexDirection: "column", gap: 8 },
  toolLogToggle: { display: "flex", justifyContent: "space-between", alignItems: "center", background: "#1e2736", border: "1px solid #2d3748", borderRadius: 8, padding: "8px 12px", color: "#94a3b8", fontSize: 12, fontWeight: 600, cursor: "pointer", width: "100%" },
  toolLogList: { display: "flex", flexDirection: "column", gap: 6 },
  toolLogEmpty: { fontSize: 12, color: "#4b5563", textAlign: "center", padding: 8 },
  toolLogItem: { background: "#1a2130", borderRadius: 8, padding: "8px 10px", border: "1px solid #1e2736" },
  toolLogName: { fontSize: 11, fontWeight: 600, color: "#60a5fa", textTransform: "capitalize" },
  toolLogResult: { fontSize: 11, color: "#86efac", marginTop: 2 },
  toolLogError: { fontSize: 11, color: "#fca5a5", marginTop: 2 },
  moodSection: { marginTop: "auto", display: "flex", flexDirection: "column", gap: 8 },
  moodLabel: { fontSize: 11, color: "#4b5563", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 },
  moodBadge: { display: "flex", alignItems: "center", gap: 8, background: "#1e2736", borderRadius: 8, padding: "8px 12px", border: "1px solid", fontSize: 13, fontWeight: 600 },
  chatArea: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" },
  chatHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", background: "#161b27", borderBottom: "1px solid #1e2736" },
  chatHeaderLeft: { display: "flex", alignItems: "center", gap: 10 },
  agentDot: { width: 10, height: 10, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 8px #22c55e" },
  chatHeaderTitle: { fontWeight: 700, fontSize: 15, color: "#e2e8f0" },
  chatHeaderRight: { fontSize: 12, color: "#4b5563" },
  messages: { flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: 14 },
  messageRow: { display: "flex", alignItems: "flex-end", gap: 10 },
  agentAvatar: { width: 34, height: 34, borderRadius: "50%", background: "#1e2736", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 },
  bubble: { maxWidth: "70%", padding: "12px 16px", borderRadius: 16, fontSize: 14, lineHeight: 1.6 },
  userBubble: { background: "linear-gradient(135deg, #2563eb, #1d4ed8)", color: "#fff", borderBottomRightRadius: 4 },
  agentBubble: { background: "#1e2736", color: "#e2e8f0", border: "1px solid #2d3748", borderBottomLeftRadius: 4 },
  typingBubble: { display: "flex", alignItems: "center", gap: 5, padding: "14px 18px" },
  dot: { display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: "#4b5563", animation: "bounce 1.2s infinite" },
  suggestions: { display: "flex", flexWrap: "wrap", gap: 8, padding: "0 20px 12px" },
  suggestionBtn: { background: "#1e2736", border: "1px solid #2d3748", borderRadius: 20, padding: "6px 14px", color: "#94a3b8", fontSize: 12, cursor: "pointer" },
  inputRow: { display: "flex", gap: 10, padding: "12px 20px 20px", background: "#161b27", borderTop: "1px solid #1e2736" },
  input: { flex: 1, background: "#1e2736", border: "1px solid #2d3748", borderRadius: 12, padding: "12px 16px", color: "#e2e8f0", fontSize: 14, outline: "none" },
  sendBtn: { background: "linear-gradient(135deg, #2563eb, #1d4ed8)", color: "#fff", border: "none", borderRadius: 12, padding: "12px 22px", fontWeight: 700, fontSize: 14, cursor: "pointer" },
};
