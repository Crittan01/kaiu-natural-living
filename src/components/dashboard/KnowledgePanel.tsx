import { Plus, Search, FileText } from "lucide-react";

export default function KnowledgePanel() {
    return (
        <div className="p-6 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Base de Conocimiento</h2>
                    <p className="text-sm text-gray-500">Gestiona los productos y documentos para la IA</p>
                </div>
                <button className="bg-kaiu-forest text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-kaiu-forest/90 transition-colors">
                    <Plus size={18} />
                    <span>Agregar Nuevo</span>
                </button>
            </div>

            <div className="mb-6 relative">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
                <input 
                    type="text" 
                    placeholder="Buscar productos, ingredientes..." 
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-kaiu-sage/20"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto">
                <KnowledgeCard title="Aceite de Lavanda" type="Producto" status="Activo" />
                <KnowledgeCard title="Kit Sueño Profundo" type="Kit" status="Activo" />
                <KnowledgeCard title="Política de Envíos" type="Documento" status="Activo" />
                <KnowledgeCard title="Aceite de Eucalipto" type="Producto" status="Sin Stock" />
            </div>
        </div>
    );
}

function KnowledgeCard({ title, type, status }: { title: string, type: string, status: string }) {
    return (
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
            <div className="flex items-start justify-between mb-2">
                <div className="p-2 bg-gray-50 rounded-lg text-kaiu-forest group-hover:bg-kaiu-forest/10">
                    <FileText size={20} />
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${status === 'Activo' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {status}
                </span>
            </div>
            <h3 className="font-semibold text-gray-800">{title}</h3>
            <p className="text-xs text-gray-500">{type}</p>
        </div>
    )
}
