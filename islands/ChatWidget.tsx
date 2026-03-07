import { useState } from "preact/hooks";

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<
    { text: string; from: "user" | "bot" }[]
  >([
    {
      text: "Xin chào! 👋 Chào mừng bạn đến với All Star Fashion. Mình có thể giúp gì cho bạn?",
      from: "bot",
    },
  ]);

  const handleSend = () => {
    if (!message.trim()) return;

    setMessages((prev) => [...prev, { text: message, from: "user" }]);
    setMessage("");

    // Auto reply
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          text: "Cảm ơn bạn đã liên hệ! Nhân viên tư vấn sẽ phản hồi trong ít phút.",
          from: "bot",
        },
      ]);
    }, 1000);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div class="fixed bottom-6 left-6 z-50">
      {/* Chat window */}
      <div
        class={`absolute bottom-16 left-0 w-80 bg-white rounded-2xl shadow-2xl border border-brand-light-gray overflow-hidden transition-all duration-300 origin-bottom-left ${
          isOpen
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 translate-y-2 pointer-events-none"
        }`}
      >
        {/* Header */}
        <div class="bg-brand-black text-white p-4 flex items-center gap-3">
          <div class="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center text-sm font-bold">
            AS
          </div>
          <div class="flex-1">
            <p class="text-sm font-medium tracking-wide">All Star Fashion</p>
            <p class="text-[10px] text-white/60 flex items-center gap-1">
              <span class="w-1.5 h-1.5 bg-green-400 rounded-full inline-block" />
              Đang trực tuyến
            </p>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            class="text-white/60 hover:text-white transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div class="h-72 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
          {messages.map((msg, i) => (
            <div
              key={i}
              class={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                class={`max-w-[85%] px-3.5 py-2.5 text-sm leading-relaxed rounded-2xl ${
                  msg.from === "user"
                    ? "bg-brand-black text-white rounded-br-sm"
                    : "bg-white text-brand-black border border-brand-light-gray rounded-bl-sm"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div class="p-3 border-t border-brand-light-gray bg-white">
          <div class="flex items-center gap-2">
            <input
              type="text"
              value={message}
              onInput={(e) =>
                setMessage((e.target as HTMLInputElement).value)}
              onKeyDown={handleKeyDown}
              placeholder="Nhập tin nhắn..."
              class="flex-1 text-sm px-3 py-2.5 bg-gray-50 rounded-full focus:outline-none focus:bg-gray-100 transition-colors"
            />
            <button
              onClick={handleSend}
              class="w-9 h-9 bg-brand-black text-white rounded-full flex items-center justify-center hover:opacity-80 transition-opacity flex-shrink-0"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Chat hỗ trợ"
        class={`w-14 h-14 rounded-full shadow-lg ring-2 ring-white flex items-center justify-center transition-all duration-300 hover:-translate-y-1 ${
          isOpen
            ? "bg-brand-gray text-white rotate-0"
            : "bg-brand-black text-white"
        }`}
      >
        {isOpen
          ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6 transition-transform duration-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          )
          : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6 transition-transform duration-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          )}
      </button>
    </div>
  );
}
