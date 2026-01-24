import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function TermsConditions() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-primary mb-6">
            Términos y Condiciones
          </h1>
          
          <div className="prose prose-sm md:prose-base max-w-none space-y-6 text-foreground">
            <section>
              <p className="text-muted-foreground mb-4">
                <strong>Última actualización:</strong> {new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
              
              <p>
                Bienvenido a <strong>KAIU</strong>. Los presentes términos y condiciones regulan el uso de nuestro sitio web 
                y la compra de productos de cosmética natural. Al acceder y realizar compras en nuestro sitio, 
                usted acepta estos términos en su totalidad.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-display font-semibold text-primary mt-8 mb-4">
                1. Información del Comerciante
              </h2>
              <div className="bg-muted/50 p-4 rounded-lg">
                <p><strong>Nombre o Razón Social:</strong> KAIU - Cosmética Natural</p>
                <p><strong>Tipo de Persona:</strong> Persona Natural</p>
                <p><strong>Ubicación:</strong> Bogotá D.C., Colombia</p>
                <p><strong>Correo Electrónico:</strong> kaiu.oficialco@gmail.com</p>
                <p><strong>Régimen Tributario:</strong> Persona Natural - Régimen Simplificado</p>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                <em>Nota: Como persona natural en Colombia, KAIU opera bajo el marco legal establecido 
                para emprendedores y microempresarios según la Ley 1429 de 2010 (Ley de Formalización y 
                Generación de Empleo) y está registrado ante la DIAN.</em>
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-display font-semibold text-primary mt-8 mb-4">
                2. Objeto
              </h2>
              <p>
                KAIU es una tienda virtual especializada en la comercialización de aceites esenciales, 
                aceites vegetales y productos de cosmética natural de alta calidad. Todos nuestros productos 
                son 100% naturales, libres de crueldad animal y producidos con los más altos estándares de calidad.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-display font-semibold text-primary mt-8 mb-4">
                3. Productos y Servicios
              </h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Los productos mostrados en el sitio web están sujetos a disponibilidad.</li>
                <li>Las imágenes son referenciales y pueden variar del producto real.</li>
                <li>Los precios están expresados en Pesos Colombianos (COP) e incluyen IVA cuando aplique.</li>
                <li>KAIU se reserva el derecho de modificar precios sin previo aviso.</li>
                <li>La disponibilidad de stock se actualiza en tiempo real, pero puede variar en alta demanda.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-display font-semibold text-primary mt-8 mb-4">
                4. Proceso de Compra y Pago
              </h2>
              
              <h3 className="text-xl font-semibold mt-6 mb-3">4.1 Realización del Pedido</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Seleccione los productos deseados y agréguelos al carrito de compras.</li>
                <li>Revise su pedido antes de proceder al pago.</li>
                <li>Complete los datos de envío y contacto de manera precisa.</li>
                <li>Seleccione su método de pago preferido.</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-3">4.2 Medios de Pago</h3>
              <p>Aceptamos los siguientes medios de pago a través de <strong>Wompi</strong> (Pasarela de Pagos certificada en Colombia):</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Tarjetas de crédito (Visa, Mastercard, American Express)</li>
                <li>Tarjetas débito</li>
                <li>PSE (Pagos Seguros en Línea)</li>
                <li>Nequi</li>
                <li>Bancolombia QR</li>
              </ul>
              <p className="mt-3">
                Todos los pagos son procesados de forma segura. KAIU no almacena información de tarjetas de crédito.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3">4.3 Confirmación del Pedido</h3>
              <p>
                Una vez completado el pago, recibirá un correo electrónico de confirmación con los detalles de su pedido 
                y un número de referencia para rastreo.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-display font-semibold text-primary mt-8 mb-4">
                5. Envíos y Entregas
              </h2>
              
              <h3 className="text-xl font-semibold mt-6 mb-3">5.1 Cobertura</h3>
              <p>Realizamos envíos a todo el territorio colombiano a través de empresas de mensajería certificadas.</p>

              <h3 className="text-xl font-semibold mt-6 mb-3">5.2 Tiempos de Entrega</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Bogotá:</strong> 2-4 días hábiles</li>
                <li><strong>Principales ciudades:</strong> 3-5 días hábiles</li>
                <li><strong>Resto del país:</strong> 5-8 días hábiles</li>
              </ul>
              <p className="mt-3 text-sm text-muted-foreground">
                Los tiempos son estimados y pueden variar por condiciones logísticas o casos de fuerza mayor.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3">5.3 Costos de Envío</h3>
              <p>
                Los costos de envío se calculan automáticamente según el destino y peso del pedido. 
                El valor se muestra antes de confirmar la compra.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3">5.4 Rastreo del Pedido</h3>
              <p>
                Puede rastrear su pedido en cualquier momento ingresando a la sección "Rastreo de Pedidos" 
                en nuestro sitio web con su número de referencia.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-display font-semibold text-primary mt-8 mb-4">
                6. Derecho de Retracto (Ley 1480 de 2011)
              </h2>
              <div className="bg-accent/10 border-l-4 border-accent p-4 rounded">
                <p className="font-semibold mb-2">
                  De acuerdo con el Estatuto del Consumidor colombiano (Ley 1480 de 2011, Artículo 47):
                </p>
                <p>
                  Los consumidores tienen derecho a retracto dentro de los <strong>cinco (5) días hábiles</strong> siguientes 
                  a la entrega del producto, sin necesidad de justificación alguna.
                </p>
              </div>

              <h3 className="text-xl font-semibold mt-6 mb-3">6.1 Condiciones para Ejercer el Retracto</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>El producto debe estar sin usar, en su empaque original y con sus etiquetas.</li>
                <li>Para productos de cosmética natural, el sello de seguridad NO debe estar roto.</li>
                <li>Debe conservar la factura o comprobante de compra.</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-3">6.2 Procedimiento</h3>
              <ol className="list-decimal pl-6 space-y-2">
                <li>Enviar correo a <strong>kaiu.oficialco@gmail.com</strong> indicando número de orden.</li>
                <li>Coordinar la devolución del producto.</li>
                <li>Una vez recibido y verificado el estado, se procederá al reembolso.</li>
              </ol>

              <h3 className="text-xl font-semibold mt-6 mb-3">6.3 Excepciones</h3>
              <p>
                No aplica derecho de retracto para productos que por su naturaleza no puedan ser devueltos 
                (productos personalizados o abiertos por razones de higiene).
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-display font-semibold text-primary mt-8 mb-4">
                7. Garantía Legal (Ley 1480 de 2011)
              </h2>
              <p>
                Todos nuestros productos cuentan con garantía legal de calidad, idoneidad y seguridad según 
                lo establecido en la Ley 1480 de 2011.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3">7.1 Duración de la Garantía</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>La garantía cubre defectos de fabricación o calidad del producto.</li>
                <li>El plazo de garantía es de acuerdo a la vida útil esperada de cada producto.</li>
                <li>Productos cosméticos naturales: verificar fecha de vencimiento en el empaque.</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-3">7.2 Qué Cubre la Garantía</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Defectos de fabricación</li>
                <li>Productos que no cumplan con las características anunciadas</li>
                <li>Productos deteriorados o vencidos al momento de la entrega</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-3">7.3 Qué NO Cubre la Garantía</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Daños causados por mal uso o almacenamiento inadecuado</li>
                <li>Productos abiertos que presenten alteraciones por exposición ambiental</li>
                <li>Reacciones alérgicas individuales (se recomienda realizar prueba de parche)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-display font-semibold text-primary mt-8 mb-4">
                8. Responsabilidad y Uso de Productos
              </h2>
              
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg">
                <p className="font-semibold mb-2">⚠️ Advertencia Importante:</p>
                <ul className="list-disc pl-6 space-y-2 text-sm">
                  <li>Nuestros aceites esenciales son productos naturales concentrados para uso externo.</li>
                  <li>Realizar prueba de parche antes del primer uso.</li>
                  <li>No ingerir a menos que el producto indique lo contrario.</li>
                  <li>Mantener fuera del alcance de niños y mascotas.</li>
                  <li>Consultar con profesional de la salud en caso de embarazo, lactancia o condiciones médicas.</li>
                  <li>Discontinuar uso si presenta irritación.</li>
                </ul>
              </div>

              <p className="mt-4">
                El cliente acepta que ha leído y comprendido las instrucciones de uso y advertencias de cada producto. 
                KAIU no se hace responsable por el uso inadecuado de los productos.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-display font-semibold text-primary mt-8 mb-4">
                9. Propiedad Intelectual
              </h2>
              <p>
                Todos los contenidos del sitio web (textos, imágenes, logos, diseños, marcas) son propiedad 
                de KAIU o de sus proveedores y están protegidos por las leyes de propiedad intelectual colombianas 
                (Ley 23 de 1982 y Decisión 486 de la CAN).
              </p>
              <p className="mt-3">
                Está prohibida la reproducción, distribución o modificación sin autorización escrita.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-display font-semibold text-primary mt-8 mb-4">
                10. Protección de Datos Personales
              </h2>
              <p>
                El tratamiento de sus datos personales se realiza conforme a la Ley 1581 de 2012 (Ley de Protección 
                de Datos Personales - Habeas Data) y su decreto reglamentario 1377 de 2013.
              </p>
              <p className="mt-3">
                Para más información, consulte nuestra <a href="/politica-privacidad" className="text-primary hover:underline font-semibold">Política de Privacidad</a>.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-display font-semibold text-primary mt-8 mb-4">
                11. Resolución de Conflictos
              </h2>
              
              <h3 className="text-xl font-semibold mt-6 mb-3">11.1 Atención al Cliente</h3>
              <p>
                Para quejas, reclamos o sugerencias, puede contactarnos a través de:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li><strong>Email:</strong> kaiu.oficialco@gmail.com</li>
                <li><strong>WhatsApp:</strong> [Número de contacto]</li>
                <li><strong>Tiempo de respuesta:</strong> Máximo 15 días hábiles (según Ley 1480 de 2011)</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-3">11.2 Autoridades Competentes</h3>
              <p>
                En caso de no obtener respuesta satisfactoria, puede acudir a:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li><strong>Superintendencia de Industria y Comercio (SIC)</strong> - Protección al Consumidor</li>
                <li>Website: <a href="https://www.sic.gov.co" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">www.sic.gov.co</a></li>
                <li>Línea gratuita nacional: 01 8000 910 165</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-3">11.3 Jurisdicción</h3>
              <p>
                Estos términos se rigen por las leyes de la República de Colombia. Cualquier controversia 
                será resuelta ante los tribunales competentes de Bogotá D.C.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-display font-semibold text-primary mt-8 mb-4">
                12. Modificaciones
              </h2>
              <p>
                KAIU se reserva el derecho de modificar estos términos y condiciones en cualquier momento. 
                Las modificaciones entrarán en vigor desde su publicación en el sitio web.
              </p>
              <p className="mt-3">
                Se recomienda revisar periódicamente esta página para estar al tanto de posibles cambios.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-display font-semibold text-primary mt-8 mb-4">
                13. Aceptación
              </h2>
              <p>
                Al utilizar nuestro sitio web y realizar una compra, usted declara que:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li>Ha leído y comprendido estos términos y condiciones.</li>
                <li>Es mayor de edad (18 años en Colombia).</li>
                <li>Acepta cumplir con todas las condiciones aquí establecidas.</li>
                <li>Proporciona información veraz y actualizada.</li>
              </ul>
            </section>

            <section className="mt-12 pt-8 border-t border-border">
              <h2 className="text-2xl font-display font-semibold text-primary mb-4">
                Contacto
              </h2>
              <p>
                Para cualquier consulta sobre estos términos y condiciones, por favor contáctenos:
              </p>
              <div className="bg-muted/50 p-4 rounded-lg mt-4">
                <p><strong>KAIU - Cosmética Natural</strong></p>
                <p>Email: kaiu.oficialco@gmail.com</p>
                <p>Bogotá D.C., Colombia</p>
              </div>
            </section>

            <div className="mt-8 text-center text-sm text-muted-foreground italic">
              <p>
                Estos términos y condiciones cumplen con la legislación colombiana vigente, 
                incluyendo la Ley 1480 de 2011 (Estatuto del Consumidor), Ley 1581 de 2012 
                (Protección de Datos Personales) y demás normatividad aplicable.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
