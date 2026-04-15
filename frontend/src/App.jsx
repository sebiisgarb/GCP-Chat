import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Send } from "lucide-react"
import ReactMarkdown from "react-markdown"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism"

function getTime() {
  const now = new Date()
  return now.toTimeString().slice(0, 5)
}


const markdownComponents = {
  pre({ children }) {
    return <>{children}</>
  },
  code({ node, className, children, ...props }) {
    const match = /language-(\w+)/.exec(className || "")
    const lang = match ? match[1] : ""
    const childString = String(children).replace(/\n$/, "")
    const isBlock = !!className || childString.includes("\n")
    if (isBlock) {
      return (
        <SyntaxHighlighter
          style={oneDark}
          language={lang || "text"}
          PreTag="pre"
          customStyle={{
            borderRadius: 10,
            fontSize: 13,
            margin: "8px 0",
            border: "1px solid #2a2a2a",
            overflowX: "auto",
          }}
        >
          {childString}
        </SyntaxHighlighter>
      )
    }
    return (
      <code
        style={{
          background: "#2a2a2a",
          padding: "2px 6px",
          borderRadius: 4,
          fontSize: 13,
          fontFamily: "monospace",
          color: "#e2c08d",
        }}
        {...props}
      >
        {children}
      </code>
    )
  },
  p({ children }) {
    return <p style={{ margin: "4px 0", lineHeight: 1.6 }}>{children}</p>
  },
  ul({ children }) {
    return <ul style={{ margin: "4px 0", paddingLeft: 20 }}>{children}</ul>
  },
  ol({ children }) {
    return <ol style={{ margin: "4px 0", paddingLeft: 20 }}>{children}</ol>
  },
}

function ChatMessage({ msg, isStreaming }) {
  const isUser = msg.role === "user"
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: isUser ? "flex-end" : "flex-start",
        marginBottom: 12,
      }}
    >
      <div
        style={{
          maxWidth: "78%",
          padding: "10px 16px",
          borderRadius: 16,
          borderBottomRightRadius: isUser ? 4 : 16,
          borderBottomLeftRadius: isUser ? 16 : 4,
          background: isUser ? "#1e3a5f" : "#1a1a1a",
          border: isUser ? "1px solid #2a4a7f" : "1px solid #2a2a2a",
          color: "#e8e8e8",
          fontSize: 14,
          lineHeight: 1.6,
          wordBreak: "break-word",
          textAlign: "left",
        }}
      >
        {isStreaming ? (
          <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word", fontFamily: "inherit", fontSize: 14, lineHeight: 1.6 }}>
            {msg.content}
          </pre>
        ) : (
          <ReactMarkdown components={markdownComponents}>
            {msg.content}
          </ReactMarkdown>
        )}
      </div>
      <span style={{ fontSize: 11, color: "#555", marginTop: 4, paddingInline: 4 }}>
        {msg.timestamp}
      </span>
    </motion.div>
  )
}

export default function App() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading])

  useEffect(() => {
    if (!loading) {
      inputRef.current?.focus()
    }
  }, [loading])

  async function sendMessage() {
    if (!input.trim() || loading) return

    const userMessage = { role: "user", content: input, timestamp: getTime() }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput("")
    setLoading(true)

    const assistantMessage = { role: "model", content: "", timestamp: getTime() }
    setMessages([...newMessages, assistantMessage])

    const response = await fetch("http://localhost:8000/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: input,
        history: messages.map(({ role, content }) => ({ role, content })),
      }),
    })

    const reader = response.body.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value)
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          content: updated[updated.length - 1].content + chunk,
        }
        return updated
      })
    }

    setLoading(false)
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: "#0d0d0d",
        color: "#e8e8e8",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px 24px",
          borderBottom: "1px solid #1e1e1e",
          background: "#0d0d0d",
          textAlign: "center",
        }}
      >
        <span style={{ fontSize: 15, fontWeight: 600, color: "#ccc", letterSpacing: 0.5 }}>
          Chat
        </span>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "24px 20px 12px",
          maxWidth: 760,
          width: "100%",
          margin: "0 auto",
          boxSizing: "border-box",
          scrollbarWidth: "thin",
          scrollbarColor: "#2a2a2a transparent",
        }}
      >
        {messages.length === 0 && (
          <div
            style={{
              textAlign: "center",
              color: "#444",
              marginTop: "30vh",
              fontSize: 14,
            }}
          >
            Start a conversation...
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <ChatMessage key={i} msg={msg} isStreaming={loading && i === messages.length - 1} />
          ))}
        </AnimatePresence>

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div
        style={{
          padding: "16px 20px",
          borderTop: "1px solid #1e1e1e",
          background: "#0d0d0d",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 10,
            maxWidth: 760,
            margin: "0 auto",
            background: "#141414",
            border: "1px solid #272727",
            borderRadius: 14,
            padding: "10px 14px",
          }}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => {
              setInput(e.target.value)
              e.target.style.height = "auto"
              e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px"
            }}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                sendMessage()
              }
            }}
            placeholder="Message... (Shift+Enter for new line)"
            disabled={loading}
            rows={1}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "#e8e8e8",
              fontSize: 14,
              lineHeight: 1.5,
              resize: "none",
              fontFamily: "inherit",
              minHeight: 22,
              maxHeight: 160,
              overflow: "auto",
              paddingTop: 2,
              caretColor: "#e8e8e8",
            }}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 34,
              height: 34,
              borderRadius: 8,
              border: "none",
              background:
                loading || !input.trim() ? "#1e1e1e" : "#2a5fc7",
              color:
                loading || !input.trim() ? "#444" : "#fff",
              cursor:
                loading || !input.trim() ? "not-allowed" : "pointer",
              flexShrink: 0,
              transition: "background 0.2s, color 0.2s",
            }}
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
