import React, { useCallback, useMemo, useState } from 'react';
import './ChatWidget.css';
import { ChatAPI } from '../../api/client';

const welcomeMessage = {
  id: 'welcome',
  role: 'assistant',
  content: "Hi! I'm your Pickzi assistant. Ask me anything about the products, orders, or how the site works.",
};

const toApiPayload = (messages) => messages.map((msg) => ({
  role: msg.role,
  content: msg.content,
}));

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([welcomeMessage]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);

  const toggleOpen = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const canSend = useMemo(() => input.trim().length > 0 && !isSending, [input, isSending]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isSending) return;
    setInput('');

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsSending(true);

    try {
      const payload = toApiPayload([...messages, userMessage]);
      const resp = await ChatAPI.send(payload);
      const replyText = typeof resp?.reply === 'string' && resp.reply.trim()
        ? resp.reply.trim()
        : "I'm not sure about that yet, but I'll learn soon!";

      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: replyText,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: `Sorry, I couldn't reach the assistant (${err.message || 'unknown error'}).`,
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }, [input, isSending, messages]);

  const onKeyDown = useCallback((event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (canSend) handleSend();
    }
  }, [canSend, handleSend]);

  return (
    <div className={`chat-widget ${isOpen ? 'is-open' : ''}`}>
      {isOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <div>
              <strong>Pickzi Assistant</strong>
              <div className="chat-header-sub">Powered by OpenAI</div>
            </div>
            <button type="button" className="chat-close" onClick={toggleOpen} aria-label="Close chat">
              ×
            </button>
          </div>
          <div className="chat-messages">
            {messages.map((msg) => (
              <div key={msg.id} className={`chat-message chat-message-${msg.role}`}>
                <div className="chat-message-role">{msg.role === 'assistant' ? 'Assistant' : 'You'}</div>
                <div className="chat-message-text">{msg.content}</div>
              </div>
            ))}
          </div>
          <div className="chat-input">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Type your question..."
              rows={2}
              disabled={isSending}
            />
            <button type="button" onClick={handleSend} disabled={!canSend}>
              {isSending ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        className="chat-toggle"
        onClick={toggleOpen}
        aria-expanded={isOpen}
        aria-controls="chat-widget"
      >
        {isOpen ? 'Chat' : 'Chat with us'}
      </button>
    </div>
  );
};

export default ChatWidget;
