import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, LayoutGrid, List as ListIcon, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

interface ProductInventory {
    sku: string;
    name: string;
    variantName: string | null;
    price: number;
    stock: number;
    isActive: boolean;
    images: string[];
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

export function InventoryManager({ token }: { token: string | null }) {
    const [products, setProducts] = useState<ProductInventory[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const { toast } = useToast();

    const [sortConfig, setSortConfig] = useState<{ key: keyof ProductInventory; direction: 'asc' | 'desc' } | null>(null);

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

    const handleSort = (key: keyof ProductInventory) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const filteredAndSortedProducts = [...products]
        .filter(p => 
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            p.sku.toLowerCase().includes(searchTerm.toLowerCase())
        )
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


    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <CardTitle>Gestión de Inventario</CardTitle>
                        <CardDescription>Administra tus productos, precios y stock.</CardDescription>
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Buscar por Nombre o SKU..." 
                                className="pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex border rounded-md">
                            <Button 
                                variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
                                size="icon" 
                                onClick={() => setViewMode('list')}
                            >
                                <ListIcon className="h-4 w-4" />
                            </Button>
                            <Button 
                                variant={viewMode === 'grid' ? 'secondary' : 'ghost'} 
                                size="icon" 
                                onClick={() => setViewMode('grid')}
                            >
                                <LayoutGrid className="h-4 w-4" />
                            </Button>
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
                            <div className="rounded-md border">
                                <Table>
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
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredAndSortedProducts.map((product) => (
                                            <TableRow key={product.sku}>
                                                <TableCell>
                                                    <div className="h-12 w-12 rounded bg-muted overflow-hidden border">
                                                        {product.images && product.images.length > 0 ? (
                                                            <img 
                                                                src={getDirectImage(product.images[0])} 
                                                                alt={product.name} 
                                                                className="h-full w-full object-cover" 
                                                                loading="lazy"
                                                                referrerPolicy="no-referrer"
                                                                onError={(e) => {
                                                                    e.currentTarget.src = 'https://placehold.co/100?text=No+Img';
                                                                    e.currentTarget.onerror = null;
                                                                }}
                                                            />
                                                        ) : (
                                                            <div className="h-full w-full flex items-center justify-center bg-gray-100 text-gray-300 text-xs">Sin Foto</div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-medium">{product.name}</div>
                                                    <div className="text-xs text-muted-foreground font-mono mt-0.5">{product.variantName || product.sku}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <Input 
                                                        type="number" 
                                                        value={product.price} 
                                                        onChange={(e) => handleUpdate(product.sku, { price: Number(e.target.value) })}
                                                        className="w-32 h-8"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Input 
                                                        type="number" 
                                                        value={product.stock} 
                                                        onChange={(e) => handleUpdate(product.sku, { stock: Number(e.target.value) })}
                                                        className={`w-24 h-8 ${product.stock < 5 ? 'border-red-300 bg-red-50' : ''}`}
                                                    />
                                                    {product.stock < 5 && <span className="text-[10px] text-red-500 block mt-1">Stock Bajo</span>}
                                                </TableCell>
                                                <TableCell>
                                                    <Switch 
                                                        checked={product.isActive} 
                                                        onCheckedChange={(checked) => handleUpdate(product.sku, { isActive: checked })}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {filteredAndSortedProducts.map((product) => (
                                    <div key={product.sku} className="border rounded-lg overflow-hidden flex flex-col bg-card hover:shadow-sm transition-shadow">
                                        <div className="h-40 bg-muted relative">
                                            {product.images && product.images.length > 0 ? (
                                                <img 
                                                    src={getDirectImage(product.images[0])} 
                                                    alt={product.name} 
                                                    className="h-full w-full object-cover" 
                                                    loading="lazy"
                                                    referrerPolicy="no-referrer"
                                                    onError={(e) => {
                                                        e.currentTarget.src = 'https://placehold.co/100?text=No+Img';
                                                        e.currentTarget.onerror = null;
                                                    }}
                                                />
                                            ) : (
                                                <div className="h-full w-full flex items-center justify-center text-muted-foreground">Sin Imagen</div>
                                            )}
                                            <Badge className={`absolute top-2 right-2 ${product.isActive ? 'bg-green-500' : 'bg-gray-400'}`}>
                                                {product.isActive ? 'Activo' : 'Inactivo'}
                                            </Badge>
                                        </div>
                                        <div className="p-4 flex-1 flex flex-col">
                                            <div className="mb-2">
                                                <h3 className="font-semibold truncate" title={product.name}>{product.name}</h3>
                                                <p className="text-xs text-muted-foreground">{product.variantName || product.sku}</p>
                                            </div>
                                            
                                            <div className="mt-auto space-y-3 pt-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-muted-foreground">Precio:</span>
                                                    <Input 
                                                        type="number" 
                                                        value={product.price}
                                                        onChange={(e) => handleUpdate(product.sku, { price: Number(e.target.value) })}
                                                        className="w-28 h-8 text-right"
                                                    />
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-muted-foreground">Stock:</span>
                                                    <Input 
                                                        type="number" 
                                                        value={product.stock}
                                                        onChange={(e) => handleUpdate(product.sku, { stock: Number(e.target.value) })}
                                                        className={`w-20 h-8 text-right ${product.stock < 5 ? 'text-red-600 border-red-200' : ''}`}
                                                    />
                                                </div>
                                                <div className="flex items-center justify-between pt-2 border-t">
                                                     <span className="text-xs text-muted-foreground">Visible en tienda</span>
                                                     <Switch 
                                                        checked={product.isActive} 
                                                        onCheckedChange={(checked) => handleUpdate(product.sku, { isActive: checked })}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
}

export default InventoryManager;
