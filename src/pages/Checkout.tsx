import { useState, useEffect, useCallback } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useCart } from '@/context/CartContextDef';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import locationsData from '@/lib/locations.json';
import { CheckoutForm, CheckoutFormData } from '@/components/checkout/CheckoutForm';
import { OrderSummary } from '@/components/checkout/OrderSummary';

const Checkout = () => {
  const { items, cartTotal, itemCount, clearCart } = useCart();
  const navigate = useNavigate();
  const { toast } = useToast();

  /* 
    Initialize formData from localStorage if available 
  */
  const [formData, setFormData] = useState<CheckoutFormData>(() => {
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
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Derived State
  const selectedDept = locationsData.find(d => d.code === formData.departamento_code);
  const cities = selectedDept ? selectedDept.cities : [];
  const finalTotal = cartTotal + (shippingCost || 0);

  /* Save formData to LocalStorage whenever it changes */
  useEffect(() => {
    localStorage.setItem('kaiu_checkout_data', JSON.stringify(formData));
  }, [formData]);

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
                    weight: item.selectedVariant.peso || 0.2, 
                    height: item.selectedVariant.alto || 10,
                    width: item.selectedVariant.ancho || 10, 
                    length: item.selectedVariant.largo || 10
                })),
                payment_method_code: formData.payment_method 
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
  }, [formData.ciudad_code, formData.departamento_code, formData.payment_method, items]);

  useEffect(() => {
    if (formData.ciudad_code && formData.departamento_code && items.length > 0) {
        quoteShipping();
    } else {
        setShippingCost(null);
        setShippingStatus(null);
    }
  }, [formData.ciudad_code, formData.departamento_code, formData.payment_method, items, quoteShipping]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name } = e.target;
    let { value } = e.target;
    
    // Auto-Capitalize Title Case
    if (['nombre', 'direccion', 'barrio'].includes(name)) {
        value = value.toLowerCase().replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase(); });
    }

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

  const handleWompiPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) {
         toast({ variant: "destructive", title: "Datos incompletos", description: "Por favor revisa el formulario." });
         return;
    }
    
    setIsSubmitting(true);
    
    try {
        const orderPayload = {
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
            payment_method_code: 'EXTERNAL_PAYMENT', 
            external_order_id: `KAIU-TMP-${Date.now()}`, 
            discounts: []
        };

        const orderRes = await fetch('/api/create-order', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify(orderPayload)
        });
        
        const orderData = await orderRes.json();
        if (!orderRes.ok) throw new Error(orderData.error || "Fallo creando orden preliminar");
        
        const kaiuPin = orderData.order?.readable_id || orderData.order?.db_id || orderData.order?.external_id;
        
        if (!kaiuPin) throw new Error("No se recibió PIN de orden (readable_id missing)");
        
        const finalReference = `KAIU-${kaiuPin}`; 
        const amountInCents = Math.round(finalTotal * 100);

        const signRes = await fetch('/api/wompi/sign', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ 
                 reference: finalReference, 
                 amount: amountInCents, 
                 currency: "COP" 
             })
        });
        
        const signData = await signRes.json();
        if (!signRes.ok) throw new Error(signData.error || "Fallo firmando transacción");
        
        const form = document.getElementById('wompi-redirect-form') as HTMLFormElement;
        if (!form) throw new Error("Formulario Wompi no encontrado");
        
        (document.getElementById('wompi-amount') as HTMLInputElement).value = amountInCents.toString();
        (document.getElementById('wompi-reference') as HTMLInputElement).value = finalReference;
        (document.getElementById('wompi-signature') as HTMLInputElement).value = signData.signature;
        (document.getElementById('wompi-email') as HTMLInputElement).value = formData.email;
        (document.getElementById('wompi-fullname') as HTMLInputElement).value = formData.nombre;
        (document.getElementById('wompi-phone') as HTMLInputElement).value = formData.telefono.replace(/\D/g, '');
        
        form.submit(); 

    } catch (error: unknown) {
        console.error("Wompi Flow Error:", error);
        toast({ variant: "destructive", title: "Error en pago", description: error instanceof Error ? error.message : "Error desconocido" });
    } finally {  setIsSubmitting(false);
    }
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
      const orderPayload = {
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

      const orderId = data.order?.readable_id || data.order?.external_id || data.order?.db_id || 'N/A';

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
            <CheckoutForm 
                formData={formData}
                setFormData={setFormData}
                errors={errors}
                shippingStatus={shippingStatus}
                shippingCost={shippingCost}
                isSubmitting={isSubmitting}
                isQuoting={isQuoting}
                cartTotal={cartTotal}
                finalTotal={finalTotal}
                isFormValid={!!isFormValid}
                cities={cities}
                handleInputChange={handleInputChange}
                handleSelectChange={handleSelectChange}
                handleFormSubmit={handleFormSubmit}
                handleWompiPayment={handleWompiPayment}
            />

            {/* Order Summary */}
            <OrderSummary 
                items={items}
                cartTotal={cartTotal}
                shippingCost={shippingCost}
                shippingStatus={shippingStatus}
                isQuoting={isQuoting}
                finalTotal={finalTotal}
            />
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default Checkout;
