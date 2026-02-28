import { useNavigate } from "react-router-dom";
import { MessageCircle, Clock, CheckCircle2, User, AlertTriangle } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import React, { useEffect } from "react";
import { io } from "socket.io-client";

const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const socket = io(socketUrl);

interface Session {
    id: string;
    phone: string;
    name?: string;
    status: 'bot' | 'human' | 'handover';
    lastMsg: string;
    time?: string;
}

const fetchSessions = async (): Promise<Session[]> => {
    const token = sessionStorage.getItem('kaiu_admin_token');
    // Using relative URL since Vite proxies /api to backend (port 3001)
    const { data } = await axios.get('/api/sessions', {
        headers: { Authorization: `Bearer ${token}` }
    });
    return data;
};

export default function ChatList() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    
    // Fetch sessions
    const { data: sessions, isLoading, error } = useQuery({
        queryKey: ['sessions'],
        queryFn: fetchSessions,
        refetchInterval: 15000 // Fallback slow poll, WebSockets handle fast updates 
    });

    useEffect(() => {
        const handleUpdate = () => {
             console.log("WebSocket: Global chat list update trigger");
             queryClient.invalidateQueries({ queryKey: ['sessions'] });
        };

        socket.on('chat_list_update', handleUpdate);
        socket.on('session_new', handleUpdate);
        socket.on('session_update', handleUpdate);

        return () => {
            socket.off('chat_list_update', handleUpdate);
            socket.off('session_new', handleUpdate);
            socket.off('session_update', handleUpdate);
        };
    }, [queryClient]);

    if (isLoading) return <div className="p-4 text-center text-gray-400 text-sm">Cargando chats...</div>;
    if (error) return <div className="p-4 text-center text-red-400 text-sm">Error al cargar chats</div>;

    return (
        <div className="w-full md:w-80 bg-white border-r border-gray-200 flex flex-col h-full">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                <h2 className="font-semibold text-gray-700 mb-2">Activos ({sessions?.length || 0})</h2>
                <input 
                    type="text" 
                    placeholder="Buscar..." 
                    className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-kaiu-sage/20"
                />
            </div>
            
            <div className="flex-1 overflow-y-auto">
                {sessions?.map((session: Session) => (
                    <div 
                        key={session.id} 
                        onClick={() => navigate(`/dashboard/chats/${session.id}`)}
                        className="p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors group"
                    >
                        <div className="flex justify-between items-start mb-1">
                            <h3 className="font-medium text-gray-900 text-sm">{session.name || session.phone}</h3>
                            <span className="text-[10px] text-gray-400">
                                {session.time ? format(new Date(session.time), 'HH:mm', { locale: es }) : ''}
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-1 mb-2 group-hover:text-gray-700">
                            {session.lastMsg}
                        </p>
                        <div className="flex items-center gap-2">
                           {session.status === 'bot' && <Badge icon={<CheckCircle2 size={10} />} label="AI Activa" color="bg-kaiu-sage text-white" />}
                           {session.status === 'handover' && <Badge icon={<AlertTriangle size={10} />} label="Requiere Atención" color="bg-red-100 text-red-600" />}
                           {session.status === 'human' && <Badge icon={<User size={10} />} label="Manual" color="bg-blue-100 text-blue-600" />}
                        </div>
                    </div>
                ))}

                {sessions?.length === 0 && (
                     <div className="p-8 text-center text-gray-400 text-xs">
                         No hay conversaciones recientes.
                         <br/>Envía un mensaje a WhatsApp para empezar.
                     </div>
                )}
            </div>
        </div>
    );
}

function Badge({ icon, label, color }: { icon: React.ReactNode, label: string, color: string }) {
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium ${color}`}>
            {icon} {label}
        </span>
    )
}

