import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { Send, Bot, User, MoreVertical } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { io } from "socket.io-client";

// Initialize Socket (Singleton-ish for this component)
const socket = io('http://localhost:3001'); // Ensure this matches backend port

export default function ChatView() {
    const { id } = useParams();
    const queryClient = useQueryClient();
    const [newMessage, setNewMessage] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    // Fetch Messages
    const { data, isLoading } = useQuery({
        queryKey: ['messages', id],
        queryFn: async () => {
            if (!id) return null;
            const { data } = await axios.get(`http://localhost:3001/api/sessions/${id}/messages`);
            return data;
        },
        enabled: !!id,
    });

    // Mutations
    const sendMessageMutation = useMutation({
        mutationFn: async (content: string) => {
            await axios.post('http://localhost:3001/api/messages/send', {
                sessionId: id,
                content
            });
        }
    });

    const toggleAiMutation = useMutation({
        mutationFn: async (isActive: boolean) => {
            await axios.patch(`http://localhost:3001/api/sessions/${id}/toggle`, {
                isBotActive: isActive
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['messages', id] });
        }
    });

    // Socket Listener
    useEffect(() => {
        if (!id) return;

        socket.emit('join_session', id);

        const handleNewMessage = (payload: any) => {
            if (payload.sessionId === id) {
                queryClient.setQueryData(['messages', id], (old: any) => {
                    if (!old) return old;
                    return {
                        ...old,
                        messages: [...old.messages, payload.message]
                    };
                });
            }
        };

        socket.on('new_message', handleNewMessage);

        return () => {
            socket.off('new_message', handleNewMessage);
        };
    }, [id, queryClient]);

    // Auto-scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [data?.messages]);

    const handleSend = () => {
        if (!newMessage.trim()) return;
        sendMessageMutation.mutate(newMessage);
        setNewMessage("");
    };

    if (!id) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center h-full text-gray-400">
                <Bot size={48} className="mb-4 opacity-20" />
                <p>Selecciona una conversación para comenzar</p>
            </div>
        )
    }

    if (isLoading) return <div className="p-10 text-center text-gray-400">Cargando conversación...</div>;

    const isAiActive = data?.isBotActive ?? true;

    return (
        <div className="flex-1 flex flex-col h-full bg-white">
            {/* Header */}
            <div className="h-16 border-b border-gray-100 flex items-center justify-between px-6 bg-white shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                        <User size={20} />
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold text-gray-900">Conversación {id.slice(0, 8)}...</h2>
                        <span className="text-xs text-gray-400">WhatsApp</span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-gray-50 rounded-full px-1 py-1 border border-gray-200">
                        <button 
                            onClick={() => toggleAiMutation.mutate(true)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${isAiActive ? 'bg-kaiu-sage text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <span className="flex items-center gap-1"><Bot size={12} /> AI</span>
                        </button>
                        <button 
                            onClick={() => toggleAiMutation.mutate(false)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${!isAiActive ? 'bg-blue-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <span className="flex items-center gap-1"><User size={12} /> Manual</span>
                        </button>
                    </div>
                    <button className="text-gray-400 hover:text-gray-600"><MoreVertical size={20} /></button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/30" ref={scrollRef}>
                {data?.messages?.map((msg: any, idx: number) => (
                    <Message 
                        key={idx}
                        role={msg.role} 
                        content={msg.content} 
                        time={msg.time} 
                    />
                ))}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-100 bg-white">
                <div className="relative">
                    <input 
                        type="text" 
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder={isAiActive ? "La IA está respondiendo... (Desactívala para escribir)" : "Escribe un mensaje..."}
                        disabled={isAiActive}
                        className="w-full border border-gray-200 rounded-xl py-3 pl-4 pr-12 focus:outline-none focus:ring-2 focus:ring-kaiu-forest/10 disabled:bg-gray-50 disabled:text-gray-400 transition-colors" 
                    />
                    <button 
                        onClick={handleSend}
                        disabled={isAiActive || !newMessage.trim()}
                        className="absolute right-2 top-2 p-1.5 bg-kaiu-forest text-white rounded-lg hover:bg-kaiu-forest/90 disabled:bg-gray-200 disabled:cursor-not-allowed transition-colors"
                    >
                        <Send size={18} />
                    </button>
                </div>
                <div className="flex justify-between mt-2 px-1">
                    <span className="text-[10px] text-gray-400">Presiona Enter para enviar</span>
                    {isAiActive && <span className="text-[10px] text-kaiu-sage flex items-center gap-1"><Bot size={10} /> IA en control</span>}
                </div>
            </div>
        </div>
    )
}

function Message({ role, content, time }: { role: 'user' | 'assistant', content: string, time: string }) {
    const isUser = role === 'user';
    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
            <div className={`
                max-w-[70%] rounded-2xl px-5 py-3 text-sm shadow-sm
                ${isUser ? 'bg-kaiu-forest text-white rounded-tr-none' : 'bg-white text-gray-700 border border-gray-100 rounded-tl-none'}
            `}>
                <p className="whitespace-pre-wrap leading-relaxed">{content}</p>
                <div className={`text-[10px] mt-1 text-right ${isUser ? 'text-white/70' : 'text-gray-400'}`}>{time}</div>
            </div>
        </div>
    )
}
