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
                <span style={{ ...styles.dot,
