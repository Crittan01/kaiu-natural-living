import { Layout } from '@/components/layout/Layout';

export default function TerminosCondiciones() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 md:py-16 max-w-4xl">
        <h1 className="font-display text-4xl md:text-5xl font-bold mb-8 text-primary">
          Términos y Condiciones
        </h1>
        
        <div className="prose prose-lg max-w-none space-y-6 text-foreground/90">
          <p className="text-sm text-muted-foreground">
            Última actualización: {new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <section>
            <h2 className="font-display text-2xl font-semibold text-primary mb-4">1. Información General</h2>
            <p>
              Bienvenido a KAIU Cosmética Natural. Estos Términos y Condiciones regulan el uso de nuestro sitio web 
              y la compra de productos, en cumplimiento con la Ley 1480 de 2011 (Estatuto del Consumidor), 
              la Ley 527 de 1999 (Comercio Electrónico) y demás normativa aplicable en Colombia.
            </p>
            <div className="bg-muted p-4 rounded-lg mt-4">
              <p className="font-semibold">Datos del Comerciante:</p>
              <ul className="list-none space-y-1 mt-2">
                <li><strong>Nombre:</strong> KAIU Cosmética Natural</li>
                <li><strong>Tipo de persona:</strong> Persona Natural</li>
                <li><strong>Ubicación:</strong> Bogotá, Colombia</li>
                <li><strong>Email:</strong> kaiu.oficialco@gmail.com</li>
                <li><strong>WhatsApp:</strong> +57 123 456 7890</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-primary mb-4">2. Aceptación de los Términos</h2>
            <p>
              Al acceder y realizar compras en nuestra tienda en línea, usted acepta estar sujeto a estos 
              Términos y Condiciones. Si no está de acuerdo con alguna parte de estos términos, 
              le recomendamos no utilizar nuestros servicios.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-primary mb-4">3. Productos y Servicios</h2>
            <p>
              KAIU ofrece productos cosméticos naturales, incluyendo aceites esenciales y vegetales. 
              Todos nuestros productos:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Cumplen con las regulaciones sanitarias colombianas (INVIMA)</li>
              <li>Son para uso externo, siguiendo las indicaciones de cada producto</li>
              <li>No sustituyen tratamientos médicos</li>
              <li>Se describen con la mayor precisión posible, aunque los colores pueden variar según la pantalla</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-primary mb-4">4. Precios y Formas de Pago</h2>
            <p>
              Los precios están expresados en pesos colombianos (COP) e incluyen el IVA cuando aplique. 
              Nos reservamos el derecho de modificar los precios sin previo aviso. El precio aplicable 
              será el vigente al momento de confirmar la compra.
            </p>
            <p className="mt-4">
              <strong>Medios de pago aceptados:</strong>
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Tarjetas de crédito y débito (a través de pasarela de pago Wompi)</li>
              <li>PSE (Pagos Seguros en Línea)</li>
              <li>Otros métodos habilitados en nuestra plataforma de pago</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-primary mb-4">
              5. Derecho de Retracto (Ley 1480/2011, Art. 47)
            </h2>
            <p>
              Como consumidor, usted tiene derecho a retractarse de su compra dentro de los 
              <strong> cinco (5) días hábiles</strong> siguientes a la entrega del producto, 
              sin necesidad de justificación y sin penalidad alguna.
            </p>
            <div className="bg-accent/10 border-l-4 border-accent p-4 mt-4">
              <p className="font-semibold mb-2">Condiciones para el retracto:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>El producto debe estar sin usar, con etiquetas y empaque original</li>
                <li>Debe notificarnos por escrito (email o WhatsApp)</li>
                <li>Los costos de devolución corren por cuenta del consumidor</li>
                <li>El reembolso se realizará dentro de los 30 días calendario siguientes</li>
              </ul>
            </div>
            <p className="mt-4">
              <strong>Excepciones:</strong> Por razones de higiene y salud, productos de cosmética que hayan sido 
              abiertos o utilizados no pueden ser devueltos, excepto por defectos de fabricación.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-primary mb-4">6. Envíos y Entregas</h2>
            <p>
              Realizamos envíos a todo Colombia a través de empresas de mensajería certificadas. 
              Los tiempos de entrega varían según la ciudad de destino:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Bogotá y principales ciudades:</strong> 2-4 días hábiles</li>
              <li><strong>Otras ciudades:</strong> 3-7 días hábiles</li>
            </ul>
            <p className="mt-4">
              El riesgo de pérdida o daño del producto pasa al consumidor una vez la transportadora 
              confirme la entrega. Es importante verificar el estado del paquete al momento de recibirlo.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-primary mb-4">7. Garantías</h2>
            <p>
              Todos nuestros productos cuentan con garantía legal de conformidad según la Ley 1480 de 2011. 
              Si el producto presenta defectos de fabricación o no cumple con lo ofrecido, usted puede:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Solicitar la reparación o cambio del producto</li>
              <li>Solicitar la devolución del dinero</li>
              <li>Solicitar rebaja proporcional del precio</li>
            </ul>
            <p className="mt-4">
              La garantía no cubre daños causados por uso indebido, almacenamiento inadecuado o 
              causas externas al producto.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-primary mb-4">8. Responsabilidades</h2>
            <p>
              KAIU no se responsabiliza por:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Reacciones alérgicas a componentes naturales (se recomienda realizar prueba de sensibilidad)</li>
              <li>Uso inadecuado de los productos contrario a las instrucciones</li>
              <li>Retrasos en la entrega causados por la empresa de mensajería o fuerza mayor</li>
              <li>Información incorrecta proporcionada por el cliente al momento del pedido</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-primary mb-4">9. Propiedad Intelectual</h2>
            <p>
              Todo el contenido de este sitio web (textos, imágenes, logos, diseños) es propiedad de KAIU 
              o sus licenciantes y está protegido por las leyes de propiedad intelectual colombianas e internacionales. 
              Queda prohibida su reproducción sin autorización expresa.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-primary mb-4">
              10. Resolución de Conflictos
            </h2>
            <p>
              Para cualquier reclamación, usted puede contactarnos a través de:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Email: kaiu.oficialco@gmail.com</li>
              <li>WhatsApp: +57 123 456 7890</li>
            </ul>
            <p className="mt-4">
              En caso de no llegar a un acuerdo, usted puede acudir a:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Superintendencia de Industria y Comercio (SIC)</strong></li>
              <li><strong>Ligas de Consumidores</strong></li>
              <li><strong>Defensorías del Consumidor</strong></li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-primary mb-4">11. Modificaciones</h2>
            <p>
              Nos reservamos el derecho de modificar estos Términos y Condiciones en cualquier momento. 
              Los cambios entrarán en vigor inmediatamente después de su publicación en el sitio web. 
              Le recomendamos revisar periódicamente esta página.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-primary mb-4">12. Legislación Aplicable</h2>
            <p>
              Estos Términos y Condiciones se rigen por las leyes de la República de Colombia. 
              Cualquier controversia se someterá a la jurisdicción de los tribunales competentes en Bogotá D.C., Colombia.
            </p>
          </section>

          <section className="bg-primary/5 p-6 rounded-lg mt-8">
            <h3 className="font-display text-xl font-semibold mb-4">Contacto</h3>
            <p>
              Para cualquier pregunta sobre estos Términos y Condiciones, por favor contáctenos:
            </p>
            <ul className="list-none space-y-2 mt-4">
              <li><strong>Email:</strong> kaiu.oficialco@gmail.com</li>
              <li><strong>WhatsApp:</strong> +57 123 456 7890</li>
              <li><strong>Ubicación:</strong> Bogotá, Colombia</li>
            </ul>
          </section>
        </div>
      </div>
    </Layout>
  );
}
