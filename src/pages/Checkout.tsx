import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Check, Truck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Checkout = () => {
  const { items, cartTotal, itemCount, clearCart } = useCart();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    departamento: '',
    ciudad: '',
    direccion: '',
    barrio: '',
    notas: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
        setIsSubmitting(false);
        toast({
            title: "¡Orden recibida!",
            description: "Te contactaremos pronto para confirmar el envío.",
        });
        clearCart();
        navigate('/');
    }, 2000);

    console.log("Order Data:", { ...formData, items, cartTotal });
  };

  if (itemCount === 0) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
            <h1 className="text-3xl font-display font-bold mb-4">Tu carrito está vacío</h1>
            <p className="text-muted-foreground mb-8">Agrega productos para poder continuar.</p>
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
                <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
                  Finalizar Compra
                </h1>
                <p className="text-muted-foreground mt-2">
                  Completa tus datos para el envío.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre Completo</Label>
                    <Input id="nombre" name="nombre" placeholder="Ej. Ana Pérez" required onChange={handleInputChange} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" name="email" type="email" placeholder="ana@ejemplo.com" required onChange={handleInputChange} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="telefono">Teléfono</Label>
                        <Input id="telefono" name="telefono" type="tel" placeholder="300 123 4567" required onChange={handleInputChange} />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="departamento">Departamento</Label>
                        <Input id="departamento" name="departamento" placeholder="Ej. Antioquia" required onChange={handleInputChange} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="ciudad">Ciudad</Label>
                        <Input id="ciudad" name="ciudad" placeholder="Ej. Medellín" required onChange={handleInputChange} />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="direccion">Dirección de Entrega</Label>
                    <Input id="direccion" name="direccion" placeholder="Calle 10 # 20-30, Apto 501" required onChange={handleInputChange} />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="barrio">Barrio / Localidad</Label>
                    <Input id="barrio" name="barrio" placeholder="Ej. El Poblado" required onChange={handleInputChange} />
                </div>
                 
                <div className="space-y-2">
                    <Label htmlFor="notas">Notas Adicionales (Opcional)</Label>
                    <Input id="notas" name="notas" placeholder="Ej. Dejar en portería" onChange={handleInputChange} />
                </div>

                <div className="bg-accent/10 p-4 rounded-lg flex gap-3 items-start mt-4">
                    <Truck className="w-5 h-5 text-accent mt-0.5" />
                    <div className="text-sm">
                        <p className="font-medium text-foreground">Envío seguro</p>
                        <p className="text-muted-foreground">Los costos de envío se calculan/confirman luego de la compra.</p>
                    </div>
                </div>

                <Button type="submit" className="w-full mt-6" size="lg" disabled={isSubmitting}>
                    {isSubmitting ? 'Procesando...' : `Confirmar Pedido - $${cartTotal.toLocaleString()}`}
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
                            <span className="text-muted-foreground italic">Por confirmar</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold pt-2 text-primary">
                            <span>Total</span>
                            <span>${cartTotal.toLocaleString()}</span>
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
