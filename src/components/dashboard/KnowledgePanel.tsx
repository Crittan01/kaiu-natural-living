import { useState, useEffect, useCallback } from "react";
import { Plus, Search, FileText, Trash2, Loader2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface KnowledgeItem {
    id: string;
    content: string;
    metadata: { title: string, type: string };
    createdAt: string;
}

export default function KnowledgePanel() {
    const [items, setItems] = useState<KnowledgeItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const { toast } = useToast();

    const fetchKnowledge = useCallback(async () => {
        setLoading(true);
        try {
            const token = sessionStorage.getItem('kaiu_admin_token');
            const res = await fetch('/api/admin/knowledge', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Fallo al cargar base de datos RAG');
            const data = await res.json();
            setItems(data);
        } catch (error) {
            toast({ title: 'Error', description: 'No se pudo conectar con la base de conocimiento', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => { fetchKnowledge(); }, [fetchKnowledge]);

    const handleDelete = async (id: string) => {
        if (!confirm('¿Borrar este fragmento de inteligencia de la IA?')) return;
        try {
            const token = sessionStorage.getItem('kaiu_admin_token');
            const res = await fetch('/api/admin/knowledge', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ id })
            });
            if (res.ok) fetchKnowledge();
        } catch (error) {
            toast({ title: 'Error', variant: 'destructive' });
        }
    };

    const filteredItems = items.filter(i => 
        i.metadata?.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        i.content?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 h-full flex flex-col relative">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Cerebro RAG (IA)</h2>
                    <p className="text-sm text-gray-500">Documentos e instrucciones que el bot lee antes de responder</p>
                </div>
                <button onClick={() => setIsAddModalOpen(true)} className="bg-kaiu-forest text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-kaiu-forest/90 transition-colors">
                    <Plus size={18} />
                    <span>Inyectar Conocimiento</span>
                </button>
            </div>

            <div className="mb-6 relative">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
                <input 
                    type="text" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar manuales, tips, reglas..." 
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-kaiu-sage/20"
                />
            </div>

            {loading ? (
                 <div className="flex-1 flex justify-center items-center"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
            ) : filteredItems.length === 0 ? (
                 <div className="flex-1 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                     <FileText className="w-12 h-12 mb-2" />
                     <p>El cerebro de la IA está vacío o no se encontró nada.</p>
                 </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto content-start">
                    {filteredItems.map(item => (
                        <KnowledgeCard key={item.id} item={item} onDelete={() => handleDelete(item.id)} />
                    ))}
                </div>
            )}

            {isAddModalOpen && (
                <AddKnowledgeModal onClose={() => setIsAddModalOpen(false)} onAdded={fetchKnowledge} />
            )}
        </div>
    );
}

function KnowledgeCard({ item, onDelete }: { item: KnowledgeItem, onDelete: () => void }) {
    const title = item.metadata?.title || 'Sin Título';
    const type = item.metadata?.type || 'Texto';
    return (
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group relative">
            <button onClick={onDelete} className="absolute top-2 right-2 text-red-500 bg-red-50 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <Trash2 size={14} />
            </button>
            <div className="flex items-start justify-between mb-2">
                <div className="p-2 bg-gray-50 rounded-lg text-kaiu-forest group-hover:bg-kaiu-forest/10">
                    <FileText size={20} />
                </div>
                <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                    {type}
                </span>
            </div>
            <h3 className="font-semibold text-gray-800 line-clamp-1">{title}</h3>
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.content}</p>
        </div>
    )
}

function AddKnowledgeModal({ onClose, onAdded }: { onClose: () => void, onAdded: () => void }) {
    const [title, setTitle] = useState('');
    const [type, setType] = useState('Manual');
    const [content, setContent] = useState('');
    const [saving, setSaving] = useState(false);
    const { toast } = useToast();

    const handleSave = async () => {
        if (!title || !content) return;
        setSaving(true);
        try {
            const token = sessionStorage.getItem('kaiu_admin_token');
            const res = await fetch('/api/admin/knowledge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ title, type, content })
            });
            if (!res.ok) throw new Error('Error al guardar');
            toast({ title: 'Conocimiento Inyectado a la IA' });
            onAdded();
            onClose();
        } catch (error) {
            toast({ title: 'Error', variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
                <div className="p-4 border-b flex justify-between items-center">
                    <h3 className="font-bold text-lg">Inyectar Nuevo Conocimiento</h3>
                    <button onClick={onClose}><X size={20} className="text-gray-500 hover:text-black" /></button>
                </div>
                <div className="p-4 space-y-4 flex-1">
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase">Título Interno</label>
                        <input value={title} onChange={e => setTitle(e.target.value)} className="w-full border p-2 rounded-md" placeholder="ej. Horarios de Atención" />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase">Categoría</label>
                        <select value={type} onChange={e => setType(e.target.value)} className="w-full border p-2 rounded-md bg-white">
                            <option>Manual</option>
                            <option>Políticas</option>
                            <option>Respuestas Clave</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase">Texto a memorizar por la IA</label>
                        <textarea value={content} onChange={e => setContent(e.target.value)} className="w-full border p-2 rounded-md min-h-[150px]" placeholder="Escribe aquí el texto que la IA aprenderá..." />
                    </div>
                </div>
                <div className="p-4 bg-gray-50 border-t flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 border rounded-md hover:bg-gray-100">Cancelar</button>
                    <button onClick={handleSave} disabled={saving || !title || !content} className="px-4 py-2 bg-kaiu-forest text-white rounded-md flex items-center">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : 'Guardar en Base de Datos'}
                    </button>
                </div>
            </div>
        </div>
    );
}
