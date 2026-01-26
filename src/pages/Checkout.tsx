import { useState, useEffect, useCallback } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useCart } from '@/context/CartContextDef';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Check, Truck, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox";
import locationsData from '@/lib/locations.json';
import { WompiWidget } from '@/components/checkout/WompiWidget';

const Checkout = () => {
  const { items, cartTotal, itemCount, clearCart } = useCart();
  const navigate = useNavigate();
  const { toast } = useToast();

  /* 
    Initialize formData from localStorage if available so we can recover it 
    after returning from Wompi or refresh.
  */
  const [formData, setFormData] = useState(() => {
    try {
        const saved = localStorage.getItem('kaiu_checkout_data');
        return saved ? JSON.parse(saved) : {
            nombre: '',
            email: '',
            telefono: '',
            identificacion: '',
            departamento_code: '',
            ciudad_code: '',
            direccion: '',
            barrio: '',
            notas: '',
            payment_method: 'COD',
            termsAccepted: false
        };
    } catch {
        return {
            nombre: '',
            email: '',
            telefono: '',
            identificacion: '',
            departamento_code: '',
            ciudad_code: '',
            direccion: '',
            barrio: '',
            notas: '',
            payment_method: 'COD',
            termsAccepted: false
        };
    }
  });

  const [shippingCost, setShippingCost] = useState<number | null>(null);
  const [shippingStatus, setShippingStatus] = useState<'calculated' | 'tbd' | null>(null);
  const [isQuoting, setIsQuoting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Validation State
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Estado derivado: Ciudades filtradas por departamento seleccionado
  const selectedDept = locationsData.find(d => d.code === formData.departamento_code);
  const cities = selectedDept ? selectedDept.cities : [];
  
  const finalTotal = cartTotal + (shippingCost || 0);

  // Generar Referencia Única Estable para esta sesión de checkout
  // Se regenera solo si cambia el total (opcional, pero mejor mantenerla fija por sesión)
  // Usamos useState con initializer para que sea único al montar el componente.
  /* Save formData to LocalStorage whenever it changes */
  useEffect(() => {
    localStorage.setItem('kaiu_checkout_data', JSON.stringify(formData));
  }, [formData]);

  const [orderReference] = useState(`KAIU-${Date.now()}`);

  // --- VALIDATION LOGIC ---
  const validateField = (name: string, value: string): string => {
      switch (name) {
          case 'nombre':
              if (!/^[a-zA-ZñÑáéíóúÁÉÍÓÚ\s]+$/.test(value)) return "Solo letras y espacios.";
              if (value.trim().split(/\s+/).length < 2) return "Ingresa Nombre y Apellido.";
              if (value.trim().length < 5) return "Nombre muy corto.";
              return "";
          case 'telefono':
              if (!/^3\d{9}$/.test(value)) return "Debe ser celular (3xx) de 10 dígitos.";
              return "";
          case 'identificacion':
              if (!/^\d{5,12}$/.test(value)) return "Entre 5 y 12 números.";
              return "";
          case 'email':
              if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value)) return "Email inválido. Ej: usuario@gmail.com";
              return "";
          case 'direccion':
              if (value.trim().length < 10) return "Dirección muy corta. Incluye Calle, # y Barrio.";
              return "";
          case 'barrio':
              if (value.trim().length < 3) return "Barrio muy corto.";
              return "";
          default:
              return "";
      }
  };

  const quoteShipping = useCallback(async () => {
    setIsQuoting(true);
    setShippingStatus(null);
    setShippingCost(null);

    // console.log("Cotizando para:", formData.ciudad_code); // Debug

    try {
        const response = await fetch('/api/quote-shipping', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                city_code: formData.ciudad_code, // Ensure this is not empty
                subdivision_code: formData.departamento_code,
                line_items: items.map(item => ({
                    unit_price: item.selectedVariant.precio,
                    quantity: item.quantity,
                    weight: item.selectedVariant.peso || 0.2, 
                    height: item.selectedVariant.alto || 10,
                    width: item.selectedVariant.ancho || 10, 
                    length: item.selectedVariant.largo || 10
                }))
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            console.warn("Fallo cotización API:", data);
            setShippingStatus('tbd');
            setShippingCost(0);
            return;
        }
        
        setShippingCost(data.shipping_cost);
        setShippingStatus('calculated');

    } catch (error) {
        console.error("Error Network cotizando:", error);
        setShippingStatus('tbd');
        setShippingCost(0);
    } finally {
        setIsQuoting(false);
    }
  }, [formData.ciudad_code, formData.departamento_code, items]);

  useEffect(() => {
    if (formData.ciudad_code && formData.departamento_code && items.length > 0) {
        quoteShipping();
    } else {
        setShippingCost(null);
        setShippingStatus(null);
    }
  }, [formData.ciudad_code, formData.departamento_code, items, quoteShipping]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    let { name, value } = e.target;
    
    // Auto-Capitalize Title Case (Nombre, Direccion, Barrio)
    // Force lowercase first to handle "JUAN PEREZ" -> "Juan Perez"
    if (['nombre', 'direccion', 'barrio'].includes(name)) {
        value = value.toLowerCase().replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase(); });
    }

    // Real-time validation
    const errorMsg = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: errorMsg }));

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ 
        ...prev, 
        [name]: value,
        ...(name === 'departamento_code' ? { ciudad_code: '' } : {})
    }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Final Validation Check
    const newErrors: Record<string, string> = {};
    if (validateField('nombre', formData.nombre)) newErrors.nombre = validateField('nombre', formData.nombre);
    if (validateField('telefono', formData.telefono)) newErrors.telefono = validateField('telefono', formData.telefono);
    if (validateField('identificacion', formData.identificacion)) newErrors.identificacion = validateField('identificacion', formData.identificacion);
    if (validateField('email', formData.email)) newErrors.email = validateField('email', formData.email);
    if (validateField('direccion', formData.direccion)) newErrors.direccion = validateField('direccion', formData.direccion);
    if (validateField('barrio', formData.barrio)) newErrors.barrio = validateField('barrio', formData.barrio);
    
    if (Object.keys(newErrors).length > 0) {
        setErrors(prev => ({ ...prev, ...newErrors }));
        toast({ variant: "destructive", title: "Datos inválidos", description: "Revisa los campos en rojo." });
        return;
    }

    if (!formData.termsAccepted) {
        toast({ variant: "destructive", title: "Atención", description: "Debes aceptar los Términos y Condiciones." });
        return;
    }

    if (shippingStatus === null) {
        toast({ title: "Falta calcular envío", description: "Por favor selecciona una ciudad válida." });
        return;
    }

    setIsSubmitting(true);

    try {
      const selectedCity = cities.find(c => c.code === formData.ciudad_code);
      const selectedDeptName = selectedDept?.name || '';

      const orderPayload = {
        // pickup_info se inyecta en el servidor desde variables de entorno
        billing_info: {
            first_name: formData.nombre.split(' ')[0],
            last_name: formData.nombre.split(' ').slice(1).join(' ') || '.',
            email: formData.email,
            phone: formData.telefono,
            identification_type: "CC", 
            identification: formData.identificacion 
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
            weight: item.selectedVariant.peso || 0.2, 
            weight_unit: "KG",
            dimensions_unit: "CM",
            height: item.selectedVariant.alto || 10,
            width: item.selectedVariant.ancho || 10,
            length: item.selectedVariant.largo || 10,
            type: "STANDARD"
        })),
        payment_method_code: formData.payment_method, 
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

  const isFormValid = 
    !errors.nombre && !errors.telefono && !errors.identificacion && !errors.email && !errors.direccion && !errors.barrio &&
    formData.termsAccepted && 
    formData.nombre && formData.telefono && formData.direccion && formData.ciudad_code && formData.email && formData.identificacion;

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

              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre Completo</Label>
                    <Input 
                        id="nombre" name="nombre" 
                        placeholder="Ej. Ana Pérez" 
                        required 
                        value={formData.nombre}
                        onChange={handleInputChange} 
                        className={errors.nombre ? "border-red-500 bg-red-50" : ""}
                    />
                    {errors.nombre && <span className="text-xs text-red-500">{errors.nombre}</span>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <Label htmlFor="identificacion">Cédula / NIT</Label>
                        <Input 
                            id="identificacion" name="identificacion" 
                            placeholder="Ej. 1020304050" 
                            required 
                            value={formData.identificacion}
                            onChange={handleInputChange} 
                            className={errors.identificacion ? "border-red-500 bg-red-50" : ""}
                        />
                        {errors.identificacion && <span className="text-xs text-red-500">{errors.identificacion}</span>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input 
                            id="email" 
                            name="email" 
                            type="email" 
                            required 
                            value={formData.email} 
                            onChange={handleInputChange}
                            className={errors.email ? "border-red-500 bg-red-50" : ""}
                        />
                        {errors.email && <span className="text-xs text-red-500">{errors.email}</span>}
                    </div>
                </div>
                
                <div className="space-y-2">
                        <Label htmlFor="telefono">Teléfono (Celular)</Label>
                        <Input 
                            id="telefono" name="telefono" type="tel" 
                            placeholder="3001234567"
                            required 
                            value={formData.telefono}
                            onChange={handleInputChange} 
                            className={errors.telefono ? "border-red-500 bg-red-50" : ""}
                        />
                        {errors.telefono && <span className="text-xs text-red-500">{errors.telefono}</span>}
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
                    <Input 
                        id="direccion" 
                        name="direccion" 
                        placeholder="Calle 10 # 20-30 Torre 1 Apto 202" 
                        required 
                        value={formData.direccion} 
                        onChange={handleInputChange}
                        className={errors.direccion ? "border-red-500 bg-red-50" : ""}
                    />
                    {errors.direccion && <span className="text-xs text-red-500">{errors.direccion}</span>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="barrio">Barrio</Label>
                    <Input 
                        id="barrio" 
                        name="barrio" 
                        placeholder="Ej. El Poblado" 
                        required 
                        value={formData.barrio} 
                        onChange={handleInputChange}
                        className={errors.barrio ? "border-red-500 bg-red-50" : ""}
                    />
                    {errors.barrio && <span className="text-xs text-red-500">{errors.barrio}</span>}
                </div>
                 
                <div className="space-y-2">
                    <Label htmlFor="notas">Notas Adicionales (Opcional)</Label>
                    <Input id="notas" name="notas" placeholder="Dejar en portería..." value={formData.notas} onChange={handleInputChange} />
                </div>

                {/* Shipping Calculation Feedback */}
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

                <div className="space-y-3 pt-4 border-t">
                    <Label className="text-base font-medium">Método de Pago</Label>
                    <div className="grid grid-cols-1 gap-3">
                         {/* Option 1: COD */}
                        <div 
                            className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${formData.payment_method === 'COD' ? 'border-primary bg-primary/5' : 'border-border hover:bg-secondary/50'}`}
                            onClick={() => setFormData(prev => ({ ...prev, payment_method: 'COD' }))}
                        >
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${formData.payment_method === 'COD' ? 'border-primary' : 'border-muted-foreground'}`}>
                                {formData.payment_method === 'COD' && <div className="w-2 h-2 rounded-full bg-primary" />}
                            </div>
                            <div className="flex-1">
                                <p className="font-medium text-sm">Pago Contra Entrega</p>
                                <p className="text-xs text-muted-foreground">Pagas en efectivo al recibir tu pedido.</p>
                            </div>
                        </div>

                        {/* Option 2: Online (Wompi) */}
                        <div 
                            className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${formData.payment_method === 'EXTERNAL_PAYMENT' ? 'border-primary bg-primary/5' : 'border-border hover:bg-secondary/50'}`}
                            onClick={() => setFormData(prev => ({ ...prev, payment_method: 'EXTERNAL_PAYMENT' }))}
                        >
                             <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${formData.payment_method === 'EXTERNAL_PAYMENT' ? 'border-primary' : 'border-muted-foreground'}`}>
                                {formData.payment_method === 'EXTERNAL_PAYMENT' && <div className="w-2 h-2 rounded-full bg-primary" />}
                             </div>
                             <div className="flex-1">
                                <p className="font-medium text-sm">Pago en Línea (Wompi)</p>
                                <p className="text-xs text-muted-foreground">Tarjetas de Crédito, Débito, PSE, Nequi</p>
                             </div>
                             {/* Wompi Logo Mock */}
                             <div className="h-6 w-auto opacity-70">
                                💳
                             </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 mt-4">
                    <Checkbox 
                        id="terms" 
                        checked={formData.termsAccepted} 
                        onCheckedChange={(c) => setFormData(prev => ({ ...prev, termsAccepted: c as boolean }))} 
                    />
                    <Label htmlFor="terms" className="text-sm cursor-pointer">
                        Acepto los <span className="underline text-primary">Términos y Condiciones</span> y Política de Tratamiento de Datos.
                    </Label>
                </div>

                {cartTotal < 20000 && (
                     <div className="p-4 rounded-lg bg-red-100 text-red-800 border border-red-200 mt-4 text-sm font-medium">
                        El pedido mínimo es de $20.000 (sin incluir envío).
                     </div>
                )}

                {/* ACTIONS */}
                {formData.payment_method === 'EXTERNAL_PAYMENT' ? (
                    <div className="mt-6">
                        {isFormValid ? (
                            <>
                                <WompiWidget 
                                    amountInCents={finalTotal * 100}
                                    currency="COP"
                                    reference={orderReference} 
                                    email={formData.email}
                                    fullName={formData.nombre}
                                    phoneNumber={formData.telefono}
                                />
                                <p className="text-xs text-center text-muted-foreground mt-2">
                                    Serás redirigido a la pasarela segura de Wompi Bancolombia.
                                </p>
                            </>
                        ) : (
                            <div className="border rounded bg-secondary/50 p-4 text-center">
                                <p className="text-sm text-muted-foreground mb-2"><AlertCircle className="w-4 h-4 inline mr-1"/> Completa correctamente todos los datos y acepta términos para habilitar el pago.</p>
                                <Button disabled className="w-full">Pagar con Wompi</Button>
                            </div>
                        )}
                        
                    </div>
                ) : (
                    <Button type="submit" className="w-full mt-6" size="lg" disabled={isSubmitting || shippingStatus === null || isQuoting || cartTotal < 20000 || !isFormValid}>
                        {isSubmitting ? 'Procesando...' : `Confirmar Pedido - $${finalTotal.toLocaleString()}`}
                    </Button>
                )}
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
                            <span>Total (Pagar)</span>
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
