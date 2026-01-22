import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Check, Truck, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import locationsData from '@/lib/locations.json';

const Checkout = () => {
  const { items, cartTotal, itemCount, clearCart } = useCart();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    identificacion: '',
    departamento_code: '',
    ciudad_code: '',
    direccion: '',
    barrio: '',
    notas: ''
  });

  const [shippingCost, setShippingCost] = useState<number | null>(null);
  const [shippingStatus, setShippingStatus] = useState<'calculated' | 'tbd' | null>(null);
  const [isQuoting, setIsQuoting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Derived state for cities based on selected department
  const selectedDept = locationsData.find(d => d.code === formData.departamento_code);
  const cities = selectedDept ? selectedDept.cities : [];
  
  const finalTotal = cartTotal + (shippingCost || 0);

  // Effect to quote shipping when city changes
  useEffect(() => {
    if (formData.ciudad_code && formData.departamento_code && items.length > 0) {
        quoteShipping();
    } else {
        setShippingCost(null);
        setShippingStatus(null);
    }
  }, [formData.ciudad_code, formData.departamento_code, items]);

  const quoteShipping = async () => {
    setIsQuoting(true);
    setShippingStatus(null);
    setShippingCost(null);

    try {
        const response = await fetch('/api/quote-shipping', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                city_code: formData.ciudad_code,
                subdivision_code: formData.departamento_code,
                line_items: items.map(item => ({
                    unit_price: item.selectedVariant.precio,
                    quantity: item.quantity,
                    // Default dimensions if not present
                    weight: 0.5, 
                    height: 10, width: 10, length: 10
                }))
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            console.warn("Shipping quote failed, defaulting to TBD:", data);
            // Fallback strategy: Allow purchase with TBD shipping
            setShippingStatus('tbd');
            setShippingCost(0);
            return;
        }
        
        setShippingCost(data.shipping_cost);
        setShippingStatus('calculated');

    } catch (error) {
        console.error("Error cotizando envío:", error);
        // Fallback strategy on network error
        setShippingStatus('tbd');
        setShippingCost(0);
    } finally {
        setIsQuoting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ 
        ...prev, 
        [name]: value,
        // Reset city if department changes
        ...(name === 'departamento_code' ? { ciudad_code: '' } : {})
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (shippingStatus === null) {
        toast({ title: "Falta calcular envío", description: "Por favor selecciona una ciudad válida." });
        return;
    }

    setIsSubmitting(true);

    try {
      const selectedCity = cities.find(c => c.code === formData.ciudad_code);
      const selectedDeptName = selectedDept?.name || '';

      // 1. Mapear datos al formato de la API
      const orderPayload = {
        // pickup_info se inyecta en el servidor desde variables de entorno
        billing_info: {
            first_name: formData.nombre.split(' ')[0],
            last_name: formData.nombre.split(' ').slice(1).join(' ') || '.',
            email: formData.email,
            phone: formData.telefono,
            identification_type: "CC", 
            identification: formData.identificacion || "1020304050" // Fallback seguro solo si vacio (pero es required)
        },
        shipping_info: {
            first_name: formData.nombre.split(' ')[0],
            last_name: formData.nombre.split(' ').slice(1).join(' ') || '.',
            address_1: `${formData.direccion}, ${formData.barrio}`,
            city_code: formData.ciudad_code,
            subdivision_code: formData.departamento_code,
            country_code: "CO",
            phone: formData.telefono
        },
        line_items: items.map(item => ({
            sku: item.selectedVariant.sku,
            name: item.nombre,
            unit_price: item.selectedVariant.precio,
            quantity: item.quantity,
            weight: 0.2, // Default small weight for oils
            weight_unit: "KG",
            dimensions_unit: "CM",
            height: 10,
            width: 10,
            length: 10,
            type: "STANDARD"
        })),
        payment_method_code: "EXTERNAL_PAYMENT", 
        external_order_id: `KAIU-${Date.now()}`,
        discounts: []
      };

      const response = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Error al procesar la orden');

      // Extract ID correctly: API returns { success: true, order: { items: [ { id: "..." } ] } }
      const orderId = data.order?.items?.[0]?.id || data.order?.id || 'N/A';

      toast({
        title: "¡Orden Creada Exitosamente!",
        description: `Tu pedido #${orderId} ha sido recibido.`,
      });
      
      clearCart();
      navigate('/');

    } catch (error) {
        console.error('Checkout Error:', error);
        toast({
            variant: "destructive",
            title: "Hubo un error",
            description: "No pudimos procesar tu orden.",
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  if (itemCount === 0) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
            <h1 className="text-3xl font-display font-bold mb-4">Tu carrito está vacío</h1>
            <Button onClick={() => navigate('/catalogo')}>Ver Catálogo</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="py-12 md:py-20 bg-secondary/30 min-h-screen">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8 lg:gap-12"
          >
            {/* Form Section */}
            <div className="bg-card p-6 md:p-8 rounded-2xl shadow-sm border border-border/50 h-fit">
              <div className="mb-6">
                <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">Finalizar Compra</h1>
                <p className="text-muted-foreground mt-2">Completa tus datos para el envío.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre Completo</Label>
                    <Input id="nombre" name="nombre" placeholder="Ej. Ana Pérez" required onChange={handleInputChange} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <Label htmlFor="identificacion">Cédula / NIT</Label>
                        <Input id="identificacion" name="identificacion" placeholder="Ej. 1020304050" required onChange={handleInputChange} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" name="email" type="email" required onChange={handleInputChange} />
                    </div>
                </div>
                
                <div className="space-y-2">
                        <Label htmlFor="telefono">Teléfono</Label>
                        <Input id="telefono" name="telefono" type="tel" required onChange={handleInputChange} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Departamento</Label>
                        <Select onValueChange={(val) => handleSelectChange('departamento_code', val)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px]">
                                {locationsData.map((dept) => (
                                    <SelectItem key={dept.code} value={dept.code}>{dept.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Ciudad</Label>
                        <Select 
                            disabled={!formData.departamento_code} 
                            onValueChange={(val) => handleSelectChange('ciudad_code', val)}
                            value={formData.ciudad_code}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px]">
                                {cities.map((city) => (
                                    <SelectItem key={city.code} value={city.code}>{city.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="direccion">Dirección de Entrega</Label>
                    <Input id="direccion" name="direccion" placeholder="Calle 10 # 20-30" required onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="barrio">Barrio</Label>
                    <Input id="barrio" name="barrio" required onChange={handleInputChange} />
                </div>
                 
                <div className="space-y-2">
                    <Label htmlFor="notas">Notas Adicionales (Opcional)</Label>
                    <Input id="notas" name="notas" onChange={handleInputChange} />
                </div>

                <div className={`p-4 rounded-lg flex gap-3 items-start mt-4 ${shippingStatus === 'tbd' ? 'bg-orange-100 text-orange-800' : 'bg-accent/10'}`}>
                    <Truck className={`w-5 h-5 mt-0.5 ${shippingStatus === 'tbd' ? 'text-orange-600' : 'text-accent'}`} />
                    <div className="text-sm">
                        <p className="font-medium font-bold">
                             {shippingStatus === 'tbd' ? 'Envío a Coordinar' : 'Envío Calculado'}
                        </p>
                        <p className={`${shippingStatus === 'tbd' ? 'text-orange-700' : 'text-muted-foreground'}`}>
                            {shippingStatus === 'tbd' 
                                ? "Para esta ciudad no hay tarifa automática. Coordinaremos el envío contigo tras la compra."
                                : shippingCost !== null 
                                    ? `Costo de envío: $${shippingCost.toLocaleString()}`
                                    : "Selecciona tu ciudad para calcular el envío."}
                        </p>
                    </div>
                </div>

                <Button type="submit" className="w-full mt-6" size="lg" disabled={isSubmitting || shippingStatus === null || isQuoting}>
                    {isSubmitting ? 'Procesando...' : `Confirmar Pedido - $${finalTotal.toLocaleString()}`}
                </Button>
              </form>
            </div>

            {/* Order Summary */}
            <div className="space-y-6">
                <div className="bg-card p-6 md:p-8 rounded-2xl shadow-sm border border-border/50">
                    <h2 className="font-display text-xl font-bold mb-4">Resumen de tu Orden</h2>
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {items.map((item) => (
                            <div key={`${item.id}-${item.selectedVariant.sku}`} className="flex gap-4 items-start">
                                <div className="w-16 h-16 bg-secondary/20 rounded-md overflow-hidden shrink-0">
                                    <img src={item.imagen_url} alt={item.nombre} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-medium text-sm text-foreground">{item.nombre}</h4>
                                    <p className="text-xs text-muted-foreground">{item.selectedVariant.nombre}</p>
                                    <div className="flex justify-between items-center mt-1">
                                        <p className="text-xs text-muted-foreground">Cant: {item.quantity}</p>
                                        <p className="font-medium text-sm">${(item.selectedVariant.precio * item.quantity).toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <Separator className="my-4" />
                    
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span className="font-medium">${cartTotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Envío</span>
                            {isQuoting ? (
                                <span className="flex items-center gap-2 text-muted-foreground"><Loader2 className="w-3 h-3 animate-spin"/> Calculando...</span>
                            ) : shippingStatus === 'tbd' ? (
                                <span className="font-medium text-orange-600">A Coordinar</span>
                            ) : shippingCost !== null ? (
                                <span className="font-medium">${shippingCost.toLocaleString()}</span>
                            ) : (
                                <span className="text-muted-foreground italic">--</span>
                            )}
                        </div>
                        <div className="flex justify-between text-lg font-bold pt-2 text-primary">
                            <span>Total</span>
                            <span>${finalTotal.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* Trust Badges */}
                <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10">
                    <div className="flex flex-col gap-4">
                        <div className="flex gap-3 items-center">
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                                <Check className="w-4 h-4" />
                            </div>
                            <p className="text-sm font-medium">Pago Seguro via Venndelo / Wompi</p>
                        </div>
                        <div className="flex gap-3 items-center">
                             <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                                <Check className="w-4 h-4" />
                            </div>
                            <p className="text-sm font-medium">Aceites 100% Puros y Naturales</p>
                        </div>
                    </div>
                </div>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default Checkout;
