import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, AlertCircle, CreditCard, Truck } from 'lucide-react';
import locationsData from '@/lib/locations.json';

// Define the shape of our form data
export interface CheckoutFormData {
  nombre: string;
  email: string;
  telefono: string;
  identificacion: string;
  departamento_code: string;
  ciudad_code: string;
  direccion: string;
  barrio: string;
  notas: string;
  payment_method: 'COD' | 'EXTERNAL_PAYMENT';
  termsAccepted: boolean;
}

interface CheckoutFormProps {
  formData: CheckoutFormData;
  setFormData: React.Dispatch<React.SetStateAction<CheckoutFormData>>;
  errors: Record<string, string>;
  shippingStatus: 'calculated' | 'tbd' | null;
  shippingCost: number | null;
  isSubmitting: boolean;
  isQuoting: boolean;
  cartTotal: number;
  finalTotal: number;
  isFormValid: boolean;
  cities: { code: string; name: string }[];
  
  // Handlers
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSelectChange: (name: string, value: string) => void;
  handleFormSubmit: (e: React.FormEvent) => void;
  handleWompiPayment: (e: React.FormEvent) => void;
}

export const CheckoutForm = ({
  formData,
  setFormData,
  errors,
  shippingStatus,
  shippingCost,
  isSubmitting,
  isQuoting,
  cartTotal,
  finalTotal,
  isFormValid,
  cities,
  handleInputChange,
  handleSelectChange,
  handleFormSubmit,
  handleWompiPayment
}: CheckoutFormProps) => {

  return (
    <div className="bg-card p-6 md:p-8 rounded-2xl shadow-sm border border-border/50 h-fit">
      <div className="mb-6">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">Finalizar Compra</h1>
        <p className="text-muted-foreground mt-2">Completa tus datos para el envío.</p>
      </div>

      <form id="checkout-form" onSubmit={handleFormSubmit} className="space-y-4">
        {/* Nombre */}
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

        {/* Identificación y Email */}
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
        
        {/* Teléfono */}
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

        {/* Ubicación */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Departamento</Label>
            <Select onValueChange={(val) => handleSelectChange('departamento_code', val)} value={formData.departamento_code}>
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

        {/* Dirección */}
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

        {/* Payment Methods */}
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
               <div className="h-6 w-auto opacity-70">
                💳
               </div>
            </div>
          </div>
        </div>

        {/* Terms */}
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
      </form>

      {/* ACTIONS OUTSIDE FORM TO PREVENT NESTING */}
      {formData.payment_method === 'EXTERNAL_PAYMENT' ? (
          <div className="mt-6">
              {isFormValid ? (
                  <>
                      <Button 
                        onClick={handleWompiPayment} 
                        className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 text-lg shadow-md transition-all"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Procesando...
                            </>
                        ) : (
                            <>
                                <CreditCard className="mr-2 w-5 h-5"/>
                                Pagar ${finalTotal.toLocaleString()} con Wompi
                            </>
                        )}
                      </Button>
                      <p className="text-xs text-center text-muted-foreground mt-2">
                          Serás redirigido a la pasarela segura de Wompi Bancolombia.
                      </p>
                      
                      {/* Hidden Form for Wompi Redirection */}
                      <form id="wompi-redirect-form" action="https://checkout.wompi.co/p/" method="GET" className="hidden">
                            <input type="hidden" name="public-key" value={import.meta.env.VITE_WOMPI_PUB_KEY} />
                            <input type="hidden" name="currency" value="COP" />
                            <input type="hidden" name="amount-in-cents" id="wompi-amount" />
                            <input type="hidden" name="reference" id="wompi-reference" />
                            <input type="hidden" name="signature:integrity" id="wompi-signature" />
                            {/* WAF PROTECTION */}
                             {!['localhost', '127.0.0.1'].includes(window.location.hostname) && (
                                <input type="hidden" name="redirect-url" value={`${window.location.origin}/checkout/success`} />
                             )}
                            
                            <input type="hidden" name="customer-data:email" id="wompi-email" />
                            <input type="hidden" name="customer-data:full-name" id="wompi-fullname" />
                            <input type="hidden" name="customer-data:phone-number" id="wompi-phone" />
                            <input type="hidden" name="customer-data:phone-number-prefix" value="57" />
                      </form>
                  </>
              ) : (
                  <div className="border rounded bg-secondary/50 p-4 text-center">
                      <p className="text-sm text-muted-foreground mb-2"><AlertCircle className="w-4 h-4 inline mr-1"/> Completa correctamente todos los datos y acepta términos para habilitar el pago.</p>
                      <Button disabled className="w-full">Pagar con Wompi</Button>
                  </div>
              )}
          </div>
      ) : (
          <Button type="submit" form="checkout-form" className="w-full mt-6" size="lg" disabled={isSubmitting || shippingStatus === null || isQuoting || cartTotal < 20000 || !isFormValid}>
              {isSubmitting ? 'Procesando...' : `Confirmar Pedido - $${finalTotal.toLocaleString()}`}
          </Button>
      )}
    </div>
  );
};
