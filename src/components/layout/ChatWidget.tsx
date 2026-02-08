import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Image as ImageIcon, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Message {
  role: 'user' | 'assistant';
  content: string;
  image?: string | null;
}

const INITIAL_MESSAGE: Message = { role: 'assistant', content: '¡Hola! Soy Sara 🌿, tu asesora de bienestar. ¿En qué puedo ayudarte hoy?' };

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  // Load from SessionStorage or use Default
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = sessionStorage.getItem('kaiu_chat_history');
      return saved ? JSON.parse(saved) : [INITIAL_MESSAGE];
    } catch (e) {
      return [INITIAL_MESSAGE];
    }
  });

  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  // Ref for the bottom of the scroll area
  const scrollBottomRef = useRef<HTMLDivElement>(null);

  // Save to SessionStorage on Change
  useEffect(() => {
    sessionStorage.setItem('kaiu_chat_history', JSON.stringify(messages));
  }, [messages]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollBottomRef.current) {
      scrollBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleClearChat = () => {
    setMessages([INITIAL_MESSAGE]);
    sessionStorage.removeItem('kaiu_chat_history');
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMsg = inputValue.trim();
    setInputValue('');
    const newMessages = [...messages, { role: 'user', content: userMsg } as Message];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const history = newMessages.slice(1).map(m => ({ role: m.role, content: m.content }));
      
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, history })
      });

      const data = await res.json();
      
      if (data.error) throw new Error(data.error);

      // Parse Image Logic
      let assistantText = data.text;
      let assistantImage = null;
      
      const imageMatch = assistantText.match(/\[SEND_IMAGE:\s*([a-fA-F0-9-]{36})\]/);
      if (imageMatch) {
        const imageId = imageMatch[1];
        // Find URL in sources
        const source = data.sources?.find((s: any) => s.id === imageId);
        if (source && source.image) {
            assistantImage = source.image;
        }
        // Remove tag for display
        assistantText = assistantText.replace(imageMatch[0], '').trim();
      }

      setMessages(prev => [...prev, { role: 'assistant', content: assistantText, image: assistantImage }]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { role: 'assistant', content: "Lo siento, tuve un problema de conexión. Intenta de nuevo." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const renderContent = (msg: Message) => {
    // 0. Safety Strip: Remove any UUIDs that might have leaked into the text
    // Regex matches 8-4-4-4-12 hex string
    const cleanContent = msg.content.replace(/\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\b/g, '').trim();

    // Format Lists (simple dash replacement)
    const formattedText = cleanContent.split('\n').map((line, i) => (
      <div key={i} className={line.trim().startsWith('-') ? 'ml-4' : ''}>
         {line}
      </div>
    ));

    return (
      <div className="space-y-2">
        <div className="text-sm whitespace-pre-wrap">{formattedText}</div>
        {msg.image && (
           <div className="mt-2 rounded-lg overflow-hidden border border-border shadow-sm">
             <img src={msg.image} alt="Producto recomendado" className="w-full h-auto object-cover max-h-48" />
           </div>
        )}
      </div>
    );
  };

  return (
    <>
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-xl bg-[#25D366] hover:bg-[#128C7E] z-50 p-0 transition-transform hover:scale-110 flex items-center justify-center"
        >
          <MessageCircle className="h-8 w-8 text-white" />
        </Button>
      )}

      {isOpen && (
          <div className="fixed bottom-6 right-6 w-[350px] h-[550px] bg-background border border-border rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">
            {/* Header */}
            <div className="bg-[#25D366] p-4 flex items-center justify-between text-white shadow-md">
              <div className="flex items-center gap-3">
                <Avatar className="border-2 border-white/20">
                  <AvatarImage src="/sara-avatar.png" />
                  <AvatarFallback className="text-green-700 bg-white font-bold">S</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-bold">Sara 🌿</h3>
                  <p className="text-xs text-green-100 opacity-90">Asesora KAIU</p>
                </div>
              </div>
              <div className="flex gap-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={handleClearChat} className="text-white hover:bg-white/20 rounded-full h-8 w-8">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Borrar chat</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="text-white hover:bg-white/20 rounded-full h-8 w-8">
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4 bg-gray-50 dark:bg-zinc-900/50">
              <div className="space-y-4">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground rounded-tr-none'
                          : 'bg-white dark:bg-zinc-800 text-foreground border border-border rounded-tl-none'
                      }`}
                    >
                      {renderContent(msg)}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white dark:bg-zinc-800 border border-border rounded-2xl rounded-tl-none px-4 py-3 text-sm flex items-center gap-2">
                       <span className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                       <span className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                       <span className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                  </div>
                )}
                <div ref={scrollBottomRef} />
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-4 border-t bg-background flex gap-2 items-center">
              <Input 
                value={inputValue} 
                onChange={(e) => setInputValue(e.target.value)} 
                onKeyDown={handleKeyDown}
                placeholder="Escribe tu duda..." 
                className="flex-1 rounded-full bg-muted/50 focus:bg-background transition-colors"
                autoFocus
              />
              <Button size="icon" onClick={handleSendMessage} disabled={isLoading || !inputValue.trim()} className="rounded-full w-10 h-10 shrink-0">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
      )}
    </>
  );
}
