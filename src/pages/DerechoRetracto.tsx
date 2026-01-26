import { Layout } from '@/components/layout/Layout';
import { Package, ArrowLeft, Clock, CheckCircle2, XCircle } from 'lucide-react';

export default function DerechoRetracto() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 md:py-16 max-w-4xl">
        <h1 className="font-display text-4xl md:text-5xl font-bold mb-8 text-primary flex items-center gap-3">
          <ArrowLeft className="w-10 h-10" />
          Derecho de Retracto
        </h1>
        
        <div className="prose prose-lg max-w-none space-y-6 text-foreground/90">
          <div className="bg-primary/10 border-l-4 border-primary p-6 rounded-lg">
            <p className="font-semibold text-lg mb-2">
              Según la Ley 1480 de 2011 (Estatuto del Consumidor), Artículo 47
            </p>
            <p>
              Todo consumidor tiene derecho a retractarse de su compra en un plazo de 
              <strong> cinco (5) días hábiles</strong>, contados a partir de la entrega del producto.
            </p>
          </div>

          <section>
            <h2 className="font-display text-2xl font-semibold text-primary mb-4 flex items-center gap-2">
              <Clock className="w-7 h-7" />
              ¿Qué es el Derecho de Retracto?
            </h2>
            <p>
              Es la facultad que tiene usted como consumidor de devolver un producto comprado 
              por internet u otros canales no presenciales, <strong>sin tener que dar explicaciones</strong> 
              ni pagar penalidades, dentro del plazo legal establecido.
            </p>
            <p className="mt-4">
              Este derecho está consagrado en la legislación colombiana para proteger al consumidor 
              en compras a distancia, donde no pudo ver o probar físicamente el producto antes de adquirirlo.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-primary mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-7 h-7" />
              Condiciones para Ejercer el Retracto
            </h2>
            
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-2">1. Plazo</h3>
                <p>
                  Debe ejercer su derecho dentro de los <strong>5 días hábiles</strong> siguientes 
                  a la recepción del producto. Los días hábiles no incluyen sábados, domingos ni festivos.
                </p>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-2">2. Estado del Producto</h3>
                <p>El producto debe cumplir con:</p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>Sin haber sido usado o abierto</li>
                  <li>Con todas sus etiquetas originales</li>
                  <li>En su empaque original intacto</li>
                  <li>Con todos sus accesorios y documentos</li>
                </ul>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-2">3. Notificación</h3>
                <p>
                  Debe notificarnos por escrito su intención de retractarse a través de:
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li><strong>Email:</strong> kaiu.oficialco@gmail.com</li>
                  <li><strong>WhatsApp:</strong> +57 123 456 7890</li>
                </ul>
                <p className="mt-2 text-sm">
                  Incluya su número de pedido, nombre completo y razón del retracto (opcional).
                </p>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-2">4. Devolución del Producto</h3>
                <p>
                  Una vez notificado el retracto, debe devolver el producto:
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>Los costos de envío de devolución corren por su cuenta</li>
                  <li>Debe usar un método de envío con rastreo</li>
                  <li>Le proporcionaremos la dirección de devolución</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-primary mb-4 flex items-center gap-2">
              <Package className="w-7 h-7" />
              Proceso de Reembolso
            </h2>
            
            <div className="bg-accent/10 p-6 rounded-lg">
              <ol className="list-decimal pl-6 space-y-3">
                <li>
                  <strong>Recepción del producto:</strong> Verificaremos que el producto cumpla 
                  con las condiciones de devolución.
                </li>
                <li>
                  <strong>Aprobación:</strong> Una vez aprobado, procesaremos el reembolso del 
                  valor pagado por el producto.
                </li>
                <li>
                  <strong>Reembolso:</strong> El dinero será devuelto dentro de los 
                  <strong> 30 días calendario</strong> siguientes al ejercicio del derecho de retracto.
                </li>
                <li>
                  <strong>Método de reembolso:</strong> Se realizará por el mismo medio de pago utilizado 
                  en la compra original.
                </li>
              </ol>
            </div>

            <p className="mt-4 text-sm italic">
              <strong>Nota importante:</strong> El valor del envío inicial NO es reembolsable, 
              excepto si el producto llegó defectuoso o diferente a lo ofrecido.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-primary mb-4 flex items-center gap-2">
              <XCircle className="w-7 h-7" />
              Excepciones al Derecho de Retracto
            </h2>
            
            <div className="bg-destructive/10 border-l-4 border-destructive p-6 rounded-lg">
              <p className="font-semibold mb-3">
                Por razones de higiene, salud y seguridad, NO se aceptan devoluciones de:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Productos cosméticos abiertos o utilizados:</strong> Una vez roto el sello 
                  de seguridad, el producto no puede ser devuelto por razones sanitarias.
                </li>
                <li>
                  <strong>Productos con sellos de garantía rotos:</strong> Si el producto cuenta con 
                  un precinto de seguridad que ha sido violado.
                </li>
                <li>
                  <strong>Productos personalizados:</strong> Artículos hechos a medida según 
                  especificaciones del cliente.
                </li>
              </ul>
              <p className="mt-4 text-sm">
                <strong>Excepción a la excepción:</strong> Si el producto presenta defectos de 
                fabricación, llega dañado o es diferente a lo ofrecido, SÍ tiene derecho a devolución 
                incluso si fue abierto, bajo la garantía legal.
              </p>
            </div>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-primary mb-4">
              Diferencia: Retracto vs. Garantía
            </h2>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="border-2 border-primary p-4 rounded-lg">
                <h3 className="font-semibold mb-3 text-primary">Derecho de Retracto</h3>
                <ul className="space-y-2 text-sm">
                  <li>✓ Sin justificación necesaria</li>
                  <li>✓ 5 días hábiles desde la entrega</li>
                  <li>✓ Producto debe estar sin usar</li>
                  <li>✓ Costos de devolución a cargo del consumidor</li>
                  <li>✓ Solo compras no presenciales</li>
                </ul>
              </div>

              <div className="border-2 border-accent p-4 rounded-lg">
                <h3 className="font-semibold mb-3 text-accent">Garantía Legal</h3>
                <ul className="space-y-2 text-sm">
                  <li>✓ Por defectos o incumplimiento</li>
                  <li>✓ Varía según tipo de producto</li>
                  <li>✓ Producto puede estar usado</li>
                  <li>✓ Costos a cargo del vendedor</li>
                  <li>✓ Aplica para todas las compras</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-primary mb-4">
              Paso a Paso para Ejercer su Retracto
            </h2>
            
            <div className="space-y-3">
              <div className="flex gap-4 items-start bg-muted p-4 rounded-lg">
                <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-semibold">Contacte dentro del plazo</h3>
                  <p className="text-sm mt-1">
                    Envíe un email a kaiu.oficialco@gmail.com o WhatsApp al +57 123 456 7890 
                    indicando su número de pedido y la intención de retracto.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start bg-muted p-4 rounded-lg">
                <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-semibold">Reciba instrucciones</h3>
                  <p className="text-sm mt-1">
                    Le enviaremos la dirección de devolución y las instrucciones específicas.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start bg-muted p-4 rounded-lg">
                <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">
                  3
                </div>
                <div>
                  <h3 className="font-semibold">Empaque y envíe</h3>
                  <p className="text-sm mt-1">
                    Empaque el producto en su caja original con todos los accesorios y 
                    envíelo a la dirección indicada con rastreo.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start bg-muted p-4 rounded-lg">
                <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">
                  4
                </div>
                <div>
                  <h3 className="font-semibold">Espere verificación</h3>
                  <p className="text-sm mt-1">
                    Verificaremos el estado del producto al recibirlo.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start bg-muted p-4 rounded-lg">
                <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">
                  5
                </div>
                <div>
                  <h3 className="font-semibold">Reciba su reembolso</h3>
                  <p className="text-sm mt-1">
                    Una vez aprobado, recibirá el reembolso en máximo 30 días calendario.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-primary/5 border-2 border-primary p-6 rounded-lg mt-8">
            <h3 className="font-display text-xl font-semibold mb-4">¿Necesita Ayuda?</h3>
            <p className="mb-4">
              Si tiene dudas sobre el proceso de retracto, estamos aquí para ayudarle:
            </p>
            <ul className="list-none space-y-2">
              <li><strong>Email:</strong> kaiu.oficialco@gmail.com</li>
              <li><strong>WhatsApp:</strong> +57 123 456 7890</li>
              <li><strong>Asunto:</strong> "Derecho de Retracto - Pedido #[número]"</li>
            </ul>
            <p className="mt-4 text-sm text-muted-foreground">
              Horario de atención: Lunes a Viernes, 9:00 AM - 6:00 PM (hora Colombia)
            </p>
          </section>

          <section className="mt-8 text-sm text-muted-foreground border-t pt-6">
            <p>
              <strong>Marco Legal:</strong> Ley 1480 de 2011 (Estatuto del Consumidor de Colombia), 
              Artículo 47 - Retracto. Decreto 1074 de 2015 sobre Comercio Electrónico.
            </p>
          </section>
        </div>
      </div>
    </Layout>
  );
}
