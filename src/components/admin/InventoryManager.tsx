import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, LayoutGrid, List as ListIcon, Save, Filter, X, Edit, ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ProductInventory {
    sku: string;
    name: string;
    description?: string;
    variantName: string | null;
    price: number;
    stock: number;
    isActive: boolean;
    images: string[];
    category?: string;
    benefits?: string;
    weight?: number;
    width?: number;
    height?: number;
    length?: number;
}

// Helper to convert Google Drive view links to direct image links
// Logic aligned with src/lib/products.ts
const getDirectImage = (url: string | undefined): string => {
    if (!url) return '';
    
    // 1. https://drive.google.com/file/d/ID/view...
    // 2. https://drive.google.com/open?id=ID
    // 3. https://drive.google.com/uc?id=ID
    
    const idRegex = /(?:id=|\/d\/)([-\w]{25,})/;
    const match = url.match(idRegex);
    
    if (match && (url.includes('drive.google.com') || url.includes('docs.google.com'))) {
        const id = match[1];
        // Adding =s1000?authuser=0 matches the catalog logic which works
        return `https://lh3.googleusercontent.com/d/${id}=s1000?authuser=0`;
    }
    return url;
};

export function InventoryManager() {
    const token = sessionStorage.getItem('kaiu_admin_token');
    const [products, setProducts] = useState<ProductInventory[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const [editingProduct, setEditingProduct] = useState<ProductInventory | null>(null);
    const [isAddingProduct, setIsAddingProduct] = useState(false);
    const [variantDraft, setVariantDraft] = useState<Partial<ProductInventory> | null>(null);
    const { toast } = useToast();

    const [sortConfig, setSortConfig] = useState<{ key: keyof ProductInventory; direction: 'asc' | 'desc' } | null>(null);
    
    // Filters
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [selectedType, setSelectedType] = useState<string>('all');
    const [selectedVolume, setSelectedVolume] = useState<string>('all');

    // Derived Lists for Selects
    const { categories, types, volumes, allVariants } = useMemo(() => {
        const cats = new Set<string>();
        const typs = new Set<string>();
        const vols = new Set<string>();
        const vars = new Set<string>();

        products.forEach(p => {
            if (p.category) cats.add(p.category);
            
            const fullName = (p.name + ' ' + (p.variantName || '')).toLowerCase();
            const sku = p.sku.toLowerCase();

            // Type Parsing
            if (sku.includes('got') || fullName.includes('gotero')) typs.add('Gotero');
            else if (sku.includes('rol') || fullName.includes('roll-on') || fullName.includes('roll on')) typs.add('Roll-on');
            else if (fullName.includes('spray')) typs.add('Spray');
            else if (fullName.includes('difusor')) typs.add('Difusor');
            else if (fullName.includes('kit')) typs.add('Kit');

            // Volume Parsing
            const volMatch = fullName.match(/(\d+)\s?(ml|g|gr)/);
            if (volMatch) vols.add(volMatch[0].replace(/\s/g, ''));

            if (p.variantName) vars.add(p.variantName);
        });

        return {
            categories: Array.from(cats).sort(),
            types: Array.from(typs).sort(),
            volumes: Array.from(vols).sort((a, b) => parseInt(a) - parseInt(b)), // Numeric sort roughly
            allVariants: Array.from(vars).sort()
        };
    }, [products]);


    // Fetch Inventory
    const fetchInventory = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await fetch('/api/admin/inventory', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Error cargando inventario');
            const data = await res.json();
            setProducts(data);
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "No se pudo cargar el inventario", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [token, toast]);

    useEffect(() => {
        fetchInventory();
    }, [fetchInventory]);

    const handleUpdate = async (sku: string, updates: Partial<ProductInventory>) => {
        try {
            // Optimistic Update
            setProducts(prev => prev.map(p => p.sku === sku ? { ...p, ...updates } : p));

            const res = await fetch('/api/admin/inventory', {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ sku, updates })
            });

            if (!res.ok) throw new Error('Fallo al guardar');
            
            toast({ title: "Guardado", description: "Producto actualizado", duration: 1500 });
        } catch (error) {
            toast({ title: "Error", description: "No se pudo guardar el cambio", variant: "destructive" });
            fetchInventory(); // Revert
        }
    };

    const handleCreate = async (newProduct: Partial<ProductInventory>) => {
        try {
            const res = await fetch('/api/admin/inventory', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newProduct)
            });

            if (!res.ok) throw new Error('Fallo al crear producto');
            
            toast({ title: "Creado", description: "Producto agregado correctamente", duration: 1500 });
            await fetchInventory(); // Refresh full list to get IDs and DB specifics
            setIsAddingProduct(false);
            setVariantDraft(null);
        } catch (error) {
            toast({ title: "Error", description: "No se pudo crear el producto", variant: "destructive" });
        }
    };

    const handleSort = (key: keyof ProductInventory) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const filteredAndSortedProducts = [...products]
        .filter(p => {
             // Text Search
             const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                   p.sku.toLowerCase().includes(searchTerm.toLowerCase());
             if (!matchesSearch) return false;

             // Category Filter
             if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;

             const fullName = (p.name + ' ' + (p.variantName || '')).toLowerCase();
             const sku = p.sku.toLowerCase();

             // Type Filter
             if (selectedType !== 'all') {
                const type = selectedType.toLowerCase();
                if (type === 'gotero' && !sku.includes('got') && !fullName.includes('gotero')) return false;
                if (type === 'roll-on' && !sku.includes('rol') && !fullName.includes('roll-on') && !fullName.includes('roll on')) return false;
                if (type === 'spray' && !fullName.includes('spray')) return false;
                if (type === 'kit' && !fullName.includes('kit')) return false;
                if (type === 'difusor' && !fullName.includes('difusor')) return false;
                // For 'Other' implies not matching any known
             }

             // Volume Filter
             if (selectedVolume !== 'all') {
                const volClean = selectedVolume.toLowerCase(); // "10ml"
                const productVolMatch = fullName.match(/(\d+)\s?(ml|g|gr)/);
                if (!productVolMatch) return false;
                if (productVolMatch[0].replace(/\s/g, '').toLowerCase() !== volClean) return false;
             }

             return true;
        })
        .sort((a, b) => {
            if (!sortConfig) return 0;
            const aValue = a[sortConfig.key];
            const bValue = b[sortConfig.key];
            
            if (aValue === bValue) return 0;
            
            if (sortConfig.direction === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });

    const groupedProducts = useMemo(() => {
        const groups: { [name: string]: ProductInventory[] } = {};
        filteredAndSortedProducts.forEach(p => {
            if (!groups[p.name]) groups[p.name] = [];
            groups[p.name].push(p);
        });

        return Object.entries(groups).map(([name, products]) => {
            const minPrice = Math.min(...products.map(p => p.price));
            const maxPrice = Math.max(...products.map(p => p.price));
            const priceLabel = minPrice === maxPrice 
                ? `$${minPrice.toLocaleString('es-CO')}` 
                : `$${minPrice.toLocaleString('es-CO')} - $${maxPrice.toLocaleString('es-CO')}`;
                
            return {
                name,
                products,
                totalStock: products.reduce((sum, p) => sum + p.stock, 0),
                priceLabel,
                isActive: products.some(p => p.isActive),
                images: products.find(p => p.images && p.images.length > 0)?.images || []
            };
        });
    }, [filteredAndSortedProducts]);

    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
    const toggleGroup = (name: string) => {
        setExpandedGroups(prev => {
            const next = new Set(prev);
            if (next.has(name)) next.delete(name);
            else next.add(name);
            return next;
        });
    };

    return (
        <Card className="flex flex-col h-full">
            <CardHeader className="pb-3">
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                        <div>
                            <CardTitle>Gestión de Inventario</CardTitle>
                            <CardDescription>Administra tus productos, precios y stock.</CardDescription>
                        </div>
                        <div className="flex items-center gap-4">
                            <Button className="bg-kaiu-forest text-white hover:bg-kaiu-forest/90" onClick={() => { setVariantDraft(null); setIsAddingProduct(true); }}>
                                + Agregar Producto
                            </Button>
                            <div className="flex items-center gap-2 border-l pl-4">
                                <Button 
                                    variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
                                    size="icon" 
                                    onClick={() => setViewMode('list')}
                                    title="Vista Lista"
                                >
                                    <ListIcon className="h-4 w-4" />
                                </Button>
                                <Button 
                                    variant={viewMode === 'grid' ? 'secondary' : 'ghost'} 
                                    size="icon" 
                                    onClick={() => setViewMode('grid')}
                                    title="Vista Cuadrícula"
                                >
                                    <LayoutGrid className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                    
                    {/* Filter Bar */}
                    <div className="flex flex-col md:flex-row gap-2 w-full">
                         <div className="relative flex-1">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Buscar Nombre o SKU..." 
                                className="pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        
                        {/* Filters */}
                        <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
                             {/* Category Filter */}
                             <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Categoría" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas</SelectItem>
                                    {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                </SelectContent>
                             </Select>

                             {/* Type Filter */}
                             <Select value={selectedType} onValueChange={setSelectedType}>
                                <SelectTrigger className="w-[130px]">
                                    <SelectValue placeholder="Tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tipos</SelectItem>
                                    {types.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                </SelectContent>
                             </Select>

                             {/* Volume Filter */}
                             <Select value={selectedVolume} onValueChange={setSelectedVolume}>
                                <SelectTrigger className="w-[110px]">
                                    <SelectValue placeholder="Volumen" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tam.</SelectItem>
                                    {volumes.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                                </SelectContent>
                             </Select>
                             
                             {(selectedCategory !== 'all' || selectedType !== 'all' || selectedVolume !== 'all' || searchTerm) && (
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="text-muted-foreground hover:text-foreground"
                                    onClick={() => {
                                        setSearchTerm('');
                                        setSelectedCategory('all');
                                        setSelectedType('all');
                                        setSelectedVolume('all');
                                    }}
                                    title="Limpiar Filtros"
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                             )}
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex justify-center py-10">
                        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <>
                        {viewMode === 'list' ? (
                            <div className="rounded-md border overflow-x-auto">
                                <Table className="min-w-[800px]">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[80px]">Imagen</TableHead>
                                            <TableHead 
                                                className="cursor-pointer hover:bg-muted/50"
                                                onClick={() => handleSort('name')}
                                            >
                                                Producto {sortConfig?.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                            </TableHead>
                                            <TableHead 
                                                className="w-[150px] cursor-pointer hover:bg-muted/50"
                                                onClick={() => handleSort('price')}
                                            >
                                                Precio (COP) {sortConfig?.key === 'price' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                            </TableHead>
                                            <TableHead 
                                                className="w-[120px] cursor-pointer hover:bg-muted/50"
                                                onClick={() => handleSort('stock')}
                                            >
                                                Stock {sortConfig?.key === 'stock' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                            </TableHead>
                                            <TableHead 
                                                className="w-[100px] cursor-pointer hover:bg-muted/50"
                                                onClick={() => handleSort('isActive')}
                                            >
                                                Estado {sortConfig?.key === 'isActive' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                            </TableHead>
                                            <TableHead className="w-[60px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {groupedProducts.map((group) => {
                                            const isExpanded = expandedGroups.has(group.name);
                                            return (
                                                <React.Fragment key={group.name}>
                                                    {/* Parent Group Row */}
                                                    <TableRow 
                                                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                                                        onClick={() => toggleGroup(group.name)}
                                                    >
                                                        <TableCell>
                                                            <div className="flex items-center gap-3">
                                                                {isExpanded ? <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" /> : <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />}
                                                                <div className="h-10 w-10 rounded bg-muted overflow-hidden border hidden sm:block flex-shrink-0">
                                                                    {group.images && group.images.length > 0 ? (
                                                                        <img 
                                                                            src={getDirectImage(group.images[0])} 
                                                                            alt={group.name} 
                                                                            className="h-full w-full object-cover" 
                                                                            loading="lazy"
                                                                            onError={(e) => {
                                                                                e.currentTarget.src = 'https://placehold.co/100?text=No+Img';
                                                                            }}
                                                                        />
                                                                    ) : (
                                                                        <div className="h-full w-full flex items-center justify-center bg-gray-100 text-gray-300 text-[10px]">Sin Foto</div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="font-semibold">{group.name}</div>
                                                            <div className="text-xs text-muted-foreground mt-0.5">{group.products.length} variante(s)</div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <span className="font-medium text-sm">{group.priceLabel}</span>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant={group.totalStock > 10 ? 'default' : group.totalStock > 0 ? 'secondary' : 'destructive'}>
                                                                {group.totalStock} unidades
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-2">
                                                                <Badge variant={group.isActive ? 'default' : 'secondary'} className={group.isActive ? 'bg-green-600' : ''}>
                                                                    {group.isActive ? 'Activo' : 'Inactivo'}
                                                                </Badge>
                                                                <Button 
                                                                    variant="outline" 
                                                                    size="sm" 
                                                                    className="h-7 text-xs ml-2 text-kaiu-forest border-kaiu-forest/30 hover:bg-kaiu-forest/10"
                                                                    onClick={(e) => { 
                                                                        e.stopPropagation(); 
                                                                        setIsAddingProduct(true); 
                                                                        setVariantDraft(group.products[0]); 
                                                                    }} 
                                                                    title="Agregar Variante"
                                                                >
                                                                    <Plus className="h-3 w-3 mr-1" /> Añadir Variante
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell></TableCell>
                                                    </TableRow>
                                                    
                                                    {/* Expanded Variants Rows */}
                                                    {isExpanded && group.products.map((product) => (
                                                        <TableRow key={product.sku} className="bg-muted/10 border-b border-muted/50">
                                                            <TableCell className="pl-12 text-muted-foreground">
                                                                <div className="w-6 h-6 border-l-2 border-b-2 border-muted-foreground/30 rounded-bl-md ml-4 mb-2"></div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="text-sm font-medium">{product.variantName || 'Principal'}</div>
                                                                <div className="text-xs text-muted-foreground font-mono">{product.sku}</div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Input 
                                                                    type="number" 
                                                                    value={product.price} 
                                                                    onChange={(e) => handleUpdate(product.sku, { price: Number(e.target.value) })}
                                                                    className="w-28 h-8"
                                                                />
                                                            </TableCell>
                                                            <TableCell>
                                                                <Input 
                                                                    type="number" 
                                                                    value={product.stock} 
                                                                    onChange={(e) => handleUpdate(product.sku, { stock: Number(e.target.value) })}
                                                                    className={`w-20 h-8 ${product.stock < 5 ? 'border-red-300 bg-red-50' : ''}`}
                                                                />
                                                            </TableCell>
                                                            <TableCell>
                                                                <Switch 
                                                                    checked={product.isActive} 
                                                                    onCheckedChange={(checked) => handleUpdate(product.sku, { isActive: checked })}
                                                                />
                                                            </TableCell>
                                                            <TableCell>
                                                                <Button variant="ghost" size="icon" onClick={() => setEditingProduct(product)} title="Editar Detalles">
                                                                    <Edit className="h-4 w-4 text-muted-foreground" />
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </React.Fragment>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {groupedProducts.map((group) => {
                                    const isExpanded = expandedGroups.has(group.name);
                                    return (
                                    <div key={group.name} className="border rounded-lg overflow-hidden flex flex-col bg-card hover:shadow-sm transition-shadow">
                                        <div className="h-40 bg-muted relative cursor-pointer group" onClick={() => toggleGroup(group.name)}>
                                            {group.images && group.images.length > 0 ? (
                                                <img 
                                                    src={getDirectImage(group.images[0])} 
                                                    alt={group.name} 
                                                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" 
                                                    loading="lazy"
                                                    onError={(e) => {
                                                        e.currentTarget.src = 'https://placehold.co/100?text=No+Img';
                                                    }}
                                                />
                                            ) : (
                                                <div className="h-full w-full flex items-center justify-center text-muted-foreground">Sin Imagen</div>
                                            )}
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <div className="bg-white/90 text-black px-4 py-2 rounded-full font-medium text-sm flex items-center gap-2">
                                                    {isExpanded ? <ChevronDown className="w-4 h-4"/> : <ChevronRight className="w-4 h-4"/>} 
                                                    {isExpanded ? 'Ocultar Variantes' : `Ver ${group.products.length} Variantes`}
                                                </div>
                                            </div>
                                            <Badge className={`absolute top-2 right-2 ${group.isActive ? 'bg-green-500' : 'bg-gray-400'}`}>
                                                {group.isActive ? 'Activo' : 'Inactivo'}
                                            </Badge>
                                        </div>
                                        <div className="p-4 flex-1 flex flex-col">
                                            <div className="mb-4">
                                                <h3 className="text-lg font-semibold leading-tight">{group.name}</h3>
                                                <p className="text-sm text-muted-foreground mt-1">{group.priceLabel}</p>
                                                <p className="text-xs text-muted-foreground mt-1">Stock Total: <span className="font-medium text-foreground">{group.totalStock}</span></p>
                                            </div>
                                            
                                            {isExpanded ? (
                                                <div className="space-y-3 mt-auto pt-4 border-t">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="text-xs font-semibold text-muted-foreground">Variantes</span>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="sm" 
                                                            className="h-6 text-kaiu-forest px-2 py-0" 
                                                            onClick={() => {
                                                                setIsAddingProduct(true); 
                                                                setVariantDraft(group.products[0]); 
                                                            }}
                                                        >
                                                            <Plus className="h-3.5 w-3.5 mr-1" /> Nueva Variante
                                                        </Button>
                                                    </div>
                                                    {group.products.map(product => (
                                                        <div key={product.sku} className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center text-sm bg-muted/30 p-2 rounded-md">
                                                            <div className="truncate pr-2 font-medium" title={product.variantName || product.sku}>
                                                                {product.variantName || 'Principal'}
                                                            </div>
                                                            <Input 
                                                                type="number" 
                                                                value={product.price}
                                                                onChange={(e) => handleUpdate(product.sku, { price: Number(e.target.value) })}
                                                                className="w-20 h-7 text-xs px-2"
                                                                title="Precio"
                                                            />
                                                            <Input 
                                                                type="number" 
                                                                value={product.stock}
                                                                onChange={(e) => handleUpdate(product.sku, { stock: Number(e.target.value) })}
                                                                className={`w-14 h-7 text-xs px-2 ${product.stock < 5 ? 'text-red-600 border-red-200' : ''}`}
                                                                title="Stock"
                                                            />
                                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setEditingProduct(product)}>
                                                                <Edit className="h-3.5 w-3.5 text-muted-foreground" />
                                                            </Button>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="mt-auto pt-4 border-t flex justify-center">
                                                     <Button variant="outline" className="w-full text-xs" onClick={() => toggleGroup(group.name)}>
                                                        Gestionar Inventario ({group.products.length})
                                                     </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}
            </CardContent>
            {editingProduct && (
                <EditProductModal 
                    product={editingProduct} 
                    existingCategories={categories}
                    existingVariants={allVariants}
                    onClose={() => setEditingProduct(null)} 
                    onSave={(sku, updates) => {
                        handleUpdate(sku, updates);
                        setEditingProduct(null);
                    }} 
                />
            )}
            {isAddingProduct && (
                <AddProductModal 
                    existingCategories={categories}
                    existingVariants={allVariants}
                    onClose={() => { setIsAddingProduct(false); setVariantDraft(null); }} 
                    onSave={handleCreate} 
                    initialData={variantDraft || undefined}
                />
            )}
        </Card>
    );
}

function EditProductModal({ product, existingCategories, existingVariants, onClose, onSave }: { product: ProductInventory, existingCategories: string[], existingVariants: string[], onClose: () => void, onSave: (sku: string, updates: Partial<ProductInventory>) => void }) {
    const [name, setName] = useState(product.name);
    const [description, setDescription] = useState(product.description || '');
    const [benefits, setBenefits] = useState(product.benefits || '');
    const [weight, setWeight] = useState(product.weight?.toString() || '0.2');
    const [width, setWidth] = useState(product.width?.toString() || '10');
    const [height, setHeight] = useState(product.height?.toString() || '10');
    const [length, setLength] = useState(product.length?.toString() || '10');

    // Category Logic
    const predefinedCategories = existingCategories.length > 0 ? existingCategories : ["Aceites Esenciales", "Aceites Vegetales"];
    const initialCategory = product.category || '';
    const isCustom = initialCategory !== '' && !predefinedCategories.includes(initialCategory);
    const [categorySelect, setCategorySelect] = useState(isCustom ? 'Otros' : initialCategory);
    const [customCategory, setCustomCategory] = useState(isCustom ? initialCategory : '');

    // Variant Logic
    const predefinedVariants = existingVariants.length > 0 ? existingVariants : ["Principal"];
    const initialVariant = product.variantName || '';
    const isCustomVariant = initialVariant !== '' && !predefinedVariants.includes(initialVariant);
    const [variantSelect, setVariantSelect] = useState(isCustomVariant ? 'Otros' : (initialVariant || 'Principal'));
    const [customVariant, setCustomVariant] = useState(isCustomVariant ? initialVariant : '');

    const handleSave = () => {
        const finalCategory = categorySelect === 'Otros' ? customCategory : categorySelect;
        const finalVariant = variantSelect === 'Otros' ? customVariant : variantSelect;
        onSave(product.sku, { 
            name, 
            description, 
            category: finalCategory, 
            variantName: finalVariant,
            benefits,
            weight: Number(weight) || 0.2,
            width: Number(width) || 10,
            height: Number(height) || 10,
            length: Number(length) || 10
        });
    };

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Editar Detalles del Producto</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Nombre del Producto</Label>
                            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Aceite de Coco" />
                        </div>
                        <div className="grid gap-2">
                            <Label>SKU (Único)</Label>
                            <Input value={product.sku} disabled className="bg-muted text-muted-foreground" title="El SKU no se puede editar" />
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label>Descripción Comercial</Label>
                        <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Descripción larga..." />
                    </div>
                    <div className="grid gap-2">
                        <Label>Beneficios / Tags (separados por coma)</Label>
                        <Input value={benefits} onChange={e => setBenefits(e.target.value)} placeholder="Ej: Hidratante, Calmante, Vegano" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Categoría</Label>
                            <Select value={categorySelect} onValueChange={setCategorySelect}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Categoría Principal..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {predefinedCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                    <SelectItem value="Otros">Otra categoría...</SelectItem>
                                </SelectContent>
                            </Select>
                            {categorySelect === 'Otros' && (
                                <Input 
                                    value={customCategory} 
                                    onChange={e => setCustomCategory(e.target.value)} 
                                    placeholder="Escribe la nueva categoría" 
                                    className="mt-2"
                                />
                            )}
                        </div>
                        <div className="grid gap-2">
                            <Label>Nombre Variante</Label>
                            <Select value={variantSelect} onValueChange={setVariantSelect}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar variante..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {predefinedVariants.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                                    <SelectItem value="Otros">Otra variante...</SelectItem>
                                </SelectContent>
                            </Select>
                            {variantSelect === 'Otros' && (
                                <Input 
                                    value={customVariant} 
                                    onChange={e => setCustomVariant(e.target.value)} 
                                    placeholder="Escribe la nueva variante" 
                                    className="mt-2"
                                />
                            )}
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t">
                        <Label className="block mb-3 text-muted-foreground">Logística (Dimensiones de Empaque)</Label>
                        <div className="grid grid-cols-4 gap-2">
                            <div className="grid gap-1">
                                <span className="text-xs">Peso (kg)</span>
                                <Input type="number" step="0.1" value={weight} onChange={e => setWeight(e.target.value)} />
                            </div>
                            <div className="grid gap-1">
                                <span className="text-xs">Ancho (cm)</span>
                                <Input type="number" value={width} onChange={e => setWidth(e.target.value)} />
                            </div>
                            <div className="grid gap-1">
                                <span className="text-xs">Alto (cm)</span>
                                <Input type="number" value={height} onChange={e => setHeight(e.target.value)} />
                            </div>
                            <div className="grid gap-1">
                                <span className="text-xs">Largo (cm)</span>
                                <Input type="number" value={length} onChange={e => setLength(e.target.value)} />
                            </div>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSave} className="bg-kaiu-forest text-white hover:bg-kaiu-forest/90">Guardar Cambios</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function AddProductModal({ onClose, onSave, initialData, existingCategories, existingVariants }: { onClose: () => void, onSave: (product: Partial<ProductInventory>) => void, initialData?: Partial<ProductInventory>, existingCategories: string[], existingVariants: string[] }) {
    const [name, setName] = useState(initialData?.name || '');
    const [sku, setSku] = useState('');
    const [price, setPrice] = useState('');
    const [stock, setStock] = useState('');
    const [description, setDescription] = useState(initialData?.description || '');
    const [benefits, setBenefits] = useState(initialData?.benefits || '');
    
    // Default config values
    const [weight, setWeight] = useState(initialData?.weight?.toString() || '0.2');
    const [width, setWidth] = useState(initialData?.width?.toString() || '10');
    const [height, setHeight] = useState(initialData?.height?.toString() || '10');
    const [length, setLength] = useState(initialData?.length?.toString() || '10');

    // Category Logic
    const predefinedCategories = existingCategories.length > 0 ? existingCategories : ["Aceites Esenciales", "Aceites Vegetales"];
    const initialCat = initialData?.category || '';
    const isCustomCat = initialCat !== '' && !predefinedCategories.includes(initialCat);
    const [categorySelect, setCategorySelect] = useState(isCustomCat ? 'Otros' : initialCat);
    const [customCategory, setCustomCategory] = useState(isCustomCat ? initialCat : '');

    // Variant Logic
    const predefinedVariants = existingVariants.length > 0 ? existingVariants : ["Principal"];
    const initialVar = initialData?.variantName || '';
    const isCustomVar = initialVar !== '' && !predefinedVariants.includes(initialVar);
    const [variantSelect, setVariantSelect] = useState(isCustomVar ? 'Otros' : (initialVar || 'Principal'));
    const [customVariant, setCustomVariant] = useState(isCustomVar ? initialVar : '');

    const handleSave = () => {
        const finalCategory = categorySelect === 'Otros' ? customCategory : categorySelect;
        const finalVariant = variantSelect === 'Otros' ? customVariant : variantSelect;
        onSave({ 
            sku,
            name, 
            price: Number(price), 
            stock: Number(stock || 0), 
            description, 
            category: finalCategory, 
            variantName: finalVariant,
            benefits,
            weight: Number(weight) || 0.2,
            width: Number(width) || 10,
            height: Number(height) || 10,
            length: Number(length) || 10
        });
    };

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Crear Nuevo Producto</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Nombre del Producto *</Label>
                            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Crema Facial Antioxidante" />
                        </div>
                        <div className="grid gap-2">
                            <Label>SKU (Opcional)</Label>
                            <Input value={sku} onChange={e => setSku(e.target.value)} placeholder="Ej: CRE-FAC-01" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Precio (COP) *</Label>
                            <Input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="Ej: 45000" />
                        </div>
                        <div className="grid gap-2">
                            <Label>Stock Inicial</Label>
                            <Input type="number" value={stock} onChange={e => setStock(e.target.value)} placeholder="Ej: 10" />
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label>Descripción Comercial</Label>
                        <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Descripción larga..." />
                    </div>
                    <div className="grid gap-2">
                        <Label>Beneficios / Tags (separados por coma)</Label>
                        <Input value={benefits} onChange={e => setBenefits(e.target.value)} placeholder="Ej: Hidratante, Calmante" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Categoría</Label>
                            <Select value={categorySelect} onValueChange={setCategorySelect}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {predefinedCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                    <SelectItem value="Otros">Otra categoría...</SelectItem>
                                </SelectContent>
                            </Select>
                            {categorySelect === 'Otros' && (
                                <Input 
                                    value={customCategory} 
                                    onChange={e => setCustomCategory(e.target.value)} 
                                    placeholder="Escribe la nueva categoría" 
                                    className="mt-2"
                                />
                            )}
                        </div>
                        <div className="grid gap-2">
                            <Label>Nombre Variante</Label>
                            <Select value={variantSelect} onValueChange={setVariantSelect}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar variante..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {predefinedVariants.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                                    <SelectItem value="Otros">Otra variante...</SelectItem>
                                </SelectContent>
                            </Select>
                            {variantSelect === 'Otros' && (
                                <Input 
                                    value={customVariant} 
                                    onChange={e => setCustomVariant(e.target.value)} 
                                    placeholder="Escribe la nueva variante" 
                                    className="mt-2"
                                />
                            )}
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t">
                        <Label className="block mb-3 text-muted-foreground">Logística (Opcional)</Label>
                        <div className="grid grid-cols-4 gap-2">
                            <div className="grid gap-1">
                                <span className="text-xs">Peso (kg)</span>
                                <Input type="number" step="0.1" value={weight} onChange={e => setWeight(e.target.value)} />
                            </div>
                            <div className="grid gap-1">
                                <span className="text-xs">Ancho (cm)</span>
                                <Input type="number" value={width} onChange={e => setWidth(e.target.value)} />
                            </div>
                            <div className="grid gap-1">
                                <span className="text-xs">Alto (cm)</span>
                                <Input type="number" value={height} onChange={e => setHeight(e.target.value)} />
                            </div>
                            <div className="grid gap-1">
                                <span className="text-xs">Largo (cm)</span>
                                <Input type="number" value={length} onChange={e => setLength(e.target.value)} />
                            </div>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                    <Button 
                        disabled={!name || !price}
                        onClick={handleSave} 
                        className="bg-kaiu-forest text-white hover:bg-kaiu-forest/90"
                    >
                        Agregar al Catálogo
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default InventoryManager;
