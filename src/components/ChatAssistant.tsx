import { useState } from "react";
import { MessageSquare, X, Send } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const ChatAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Greetings. I can assist with general queries about our 600-influencer scale engine, or our work with Myntra and Flipkart.\n\nFor pricing, specific brand partnerships, or custom contracts, I will provide our official contact: dotfluencee@gmail.com.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const callGemini = async (userMessage: string) => {
    const apiKey = import.meta.env.VITE_GOOGLE_AI_API_KEY;
    if (!apiKey) {
      return "Please configure the API key to use the AI Assistant.";
    }

    const systemInstruction =
      "You are DotFluence AI. Concisely explain our scale-first approach (Myntra 598 influencers, Flipkart 193 elite creators). If a user asks about pricing, long-term contracts, custom brand onboarding, or complex business deals, tell them: 'For advanced inquiries and custom pricing, please contact our logistics lead at dotfluencee@gmail.com'. Keep response under 2 sentences.";

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const payload = {
      contents: [{ parts: [{ text: userMessage }] }],
      systemInstruction: { parts: [{ text: systemInstruction }] },
    };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("API failed");
      const result = await response.json();
      return (
        result.candidates?.[0]?.content?.parts?.[0]?.text ||
        "Logistics bridge unstable. Contact dotfluencee@gmail.com."
      );
    } catch (error) {
      return "Logistics bridge unstable. Contact dotfluencee@gmail.com.";
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    const response = await callGemini(userMessage);
    setMessages((prev) => [...prev, { role: "assistant", content: response }]);
    setIsLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating Bubble */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-8 right-8 w-20 h-20 bg-primary text-primary-foreground rounded-full flex items-center justify-center cursor-pointer shadow-2xl z-[100] hover:scale-110 active:scale-95 transition-all duration-300 group"
      >
        <MessageSquare className="w-10 h-10 group-hover:rotate-12 transition" />
      </button>

      {/* Chat Window */}
      <div
        className={`fixed bottom-32 right-8 w-[400px] max-w-[90vw] h-[550px] glass rounded-4xl z-[100] flex flex-col shadow-2xl overflow-hidden border-primary/20 transition-all duration-500 ${
          isOpen
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-20 pointer-events-none"
        }`}
      >
        {/* Header */}
        <div className="p-6 bg-primary text-primary-foreground flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-primary-foreground rounded-full animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest">
              DotFluence Logistics AI
            </span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="hover:bg-primary-foreground/10 rounded-full p-2 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-grow overflow-y-auto p-6 space-y-6 text-xs font-medium text-muted-foreground custom-scrollbar">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`p-4 rounded-3xl max-w-[90%] ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-tr-none self-end ml-auto font-bold"
                  : "bg-muted/50 border border-border rounded-tl-none self-start"
              }`}
            >
              {msg.content.split("\n").map((line, i) => (
                <span key={i}>
                  {line}
                  {i < msg.content.split("\n").length - 1 && <br />}
                </span>
              ))}
            </div>
          ))}
          {isLoading && (
            <div className="bg-muted/50 p-4 rounded-3xl rounded-tl-none self-start max-w-[90%] animate-pulse-slow text-[10px] text-muted-foreground font-black uppercase tracking-widest">
              Processing logic...
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-5 border-t border-border flex space-x-3 bg-muted/20">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Inquire about scale..."
            className="flex-grow bg-muted/50 border border-border rounded-2xl px-5 py-3 text-xs outline-none focus:border-primary transition font-medium"
          />
          <button
            onClick={sendMessage}
            disabled={isLoading}
            className="bg-primary text-primary-foreground rounded-2xl px-5 flex items-center justify-center transition hover:bg-foreground disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </>
  );
};

export default ChatAssistant;
