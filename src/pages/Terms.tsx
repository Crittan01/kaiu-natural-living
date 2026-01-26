import { Layout } from '@/components/layout/Layout';
import { Separator } from '@/components/ui/separator';

const Terms = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 md:py-20 max-w-4xl">
        <h1 className="text-3xl md:text-4xl font-display font-bold mb-6">Términos y Condiciones</h1>
        <p className="text-muted-foreground mb-8">Última actualización: {new Date().toLocaleDateString()}</p>
        
        <div className="prose prose-stone dark:prose-invert max-w-none space-y-8">
            <section>
                <h3 className="text-xl font-bold text-primary mb-2">1. Introducción</h3>
                <p>
                    Bienvenido a KAIU Natural Living. Al acceder a nuestro sitio web y realizar compras, aceptas los siguientes términos y condiciones.
                    Estos términos se rigen por las leyes de la República de Colombia, especialmente la Ley 1480 de 2011 (Estatuto del Consumidor) y la Ley 527 de 1999 (Comercio Electrónico).
                </p>
            </section>

            <Separator />

            <section>
                <h3 className="text-xl font-bold text-primary mb-2">2. Productos y Precios</h3>
                <p>
                    KAIU se esfuerza por mostrar los colores y detalles de nuestros productos con la mayor precisión posible. Sin embargo, no garantizamos que la visualización en tu pantalla sea exacta.
                    Los precios están en Pesos Colombianos (COP) e incluyen IVA cuando aplica. Nos reservamos el derecho de cambiar precios sin previo aviso (no afecta pedidos ya confirmados).
                </p>
            </section>

            <Separator />

            <section>
                <h3 className="text-xl font-bold text-primary mb-2">3. Envíos y Entregas</h3>
                <p>
                    Los tiempos de entrega son estimados y dependen de las transportadoras aliadas (Interrapidísimo, Coordinadora, etc.) gestionadas a través de la plataforma Venndelo.
                    El tiempo promedio es de 2 a 5 días hábiles en ciudades principales. KAIU no se hace responsable por retrasos debidos a fuerza mayor, pero asistiremos en el rastreo.
                </p>
            </section>

            <Separator />

            <section>
                <h3 className="text-xl font-bold text-primary mb-2">4. Pagos</h3>
                <p>
                    Aceptamos pagos a través de Wompi (Bancolombia), tarjeta de crédito, débito, PSE y Nequi. También ofrecemos Pago Contra Entrega en zonas cubiertas por nuestras transportadoras.
                    Todas las transacciones son seguras y cifradas.
                </p>
            </section>

            <Separator />

            <section>
                <h3 className="text-xl font-bold text-primary mb-2">5. Derecho de Retracto (Ley 1480 de 2011)</h3>
                <p>
                    De acuerdo con la ley colombiana, tienes derecho a retractarte de tu compra dentro de los <strong>5 días hábiles</strong> siguientes a la entrega del producto.
                    <br/><br/>
                    <strong>Condiciones:</strong>
                    <ul className="list-disc pl-5 mt-2">
                        <li>El producto debe estar nuevo, sin abrir, sin uso, y en su empaque original sellado (por razones de higiene al ser productos cosméticos/naturales).</li>
                        <li>Debes asumir los costos de envío de devolución.</li>
                        <li>El dinero se reembolsará en un plazo máximo de 30 días calendario tras recibir y validar el estado del producto.</li>
                    </ul>
                </p>
            </section>
        </div>
      </div>
    </Layout>
  );
};

export default Terms;
