import { Layout } from '@/components/layout/Layout';

export default function PoliticaPrivacidad() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 md:py-16 max-w-4xl">
        <h1 className="font-display text-4xl md:text-5xl font-bold mb-8 text-primary">
          Política de Privacidad y Tratamiento de Datos Personales
        </h1>
        
        <div className="prose prose-lg max-w-none space-y-6 text-foreground/90">
          <p className="text-sm text-muted-foreground">
            Última actualización: {new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <div className="bg-accent/10 border-l-4 border-accent p-4">
            <p>
              Esta Política de Privacidad cumple con la <strong>Ley 1581 de 2012</strong> (Protección de Datos Personales), 
              el <strong>Decreto 1377 de 2013</strong> y demás normativa aplicable en Colombia sobre Habeas Data.
            </p>
          </div>

          <section>
            <h2 className="font-display text-2xl font-semibold text-primary mb-4">
              1. Responsable del Tratamiento de Datos
            </h2>
            <div className="bg-muted p-4 rounded-lg">
              <ul className="list-none space-y-1">
                <li><strong>Razón Social:</strong> KAIU Cosmética Natural</li>
                <li><strong>Tipo de persona:</strong> Persona Natural</li>
                <li><strong>Domicilio:</strong> Bogotá D.C., Colombia</li>
                <li><strong>Correo electrónico:</strong> kaiu.oficialco@gmail.com</li>
                <li><strong>WhatsApp:</strong> +57 123 456 7890</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-primary mb-4">
              2. Datos Personales que Recolectamos
            </h2>
            <p>
              Recolectamos únicamente los datos necesarios para procesar sus pedidos y mejorar su experiencia de compra:
            </p>
            
            <div className="mt-4">
              <h3 className="font-semibold text-lg mb-2">Datos de Identificación:</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Nombre completo</li>
                <li>Número de identificación (cédula)</li>
                <li>Correo electrónico</li>
                <li>Número de teléfono/celular</li>
              </ul>
            </div>

            <div className="mt-4">
              <h3 className="font-semibold text-lg mb-2">Datos de Entrega:</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Dirección de envío completa</li>
                <li>Ciudad y departamento</li>
                <li>Código postal</li>
                <li>Información adicional de ubicación (si es necesario)</li>
              </ul>
            </div>

            <div className="mt-4">
              <h3 className="font-semibold text-lg mb-2">Datos de Navegación:</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Dirección IP</li>
                <li>Tipo de navegador</li>
                <li>Páginas visitadas</li>
                <li>Tiempo de permanencia</li>
                <li>Cookies (con su consentimiento)</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-primary mb-4">
              3. Finalidades del Tratamiento de Datos
            </h2>
            <p>Sus datos personales serán utilizados para:</p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li><strong>Procesamiento de pedidos:</strong> Gestionar, procesar y entregar sus compras</li>
              <li><strong>Comunicación:</strong> Enviar confirmaciones, actualizaciones de pedidos y responder consultas</li>
              <li><strong>Facturación:</strong> Generar facturas electrónicas y documentos tributarios</li>
              <li><strong>Servicio al cliente:</strong> Atender solicitudes, reclamos y garantías</li>
              <li><strong>Marketing (con autorización):</strong> Enviar promociones, novedades y contenido relacionado</li>
              <li><strong>Mejora del servicio:</strong> Analizar patrones de compra para mejorar nuestra oferta</li>
              <li><strong>Seguridad:</strong> Prevenir fraudes y proteger la integridad de nuestros sistemas</li>
              <li><strong>Cumplimiento legal:</strong> Atender requerimientos de autoridades competentes</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-primary mb-4">
              4. Derechos del Titular de los Datos
            </h2>
            <p>
              Como titular de sus datos personales, usted tiene los siguientes derechos según la Ley 1581 de 2012:
            </p>
            
            <div className="space-y-4 mt-4">
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-2">🔍 Derecho de Acceso</h3>
                <p>Conocer, actualizar y rectificar sus datos personales en nuestras bases de datos.</p>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-2">✏️ Derecho de Rectificación</h3>
                <p>Solicitar la corrección de datos inexactos o incompletos.</p>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-2">🗑️ Derecho de Supresión</h3>
                <p>Solicitar la eliminación de sus datos cuando no exista un deber legal o contractual de conservarlos.</p>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-2">🚫 Derecho de Oposición</h3>
                <p>Oponerse al tratamiento de sus datos por razones legítimas.</p>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-2">📋 Derecho a Revocar Autorización</h3>
                <p>Retirar el consentimiento otorgado en cualquier momento (excepto cuando exista obligación legal).</p>
              </div>
            </div>

            <p className="mt-6">
              Para ejercer estos derechos, puede contactarnos a: <strong>kaiu.oficialco@gmail.com</strong>
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-primary mb-4">
              5. Procedimiento para Consultas y Reclamos
            </h2>
            <p>
              Si desea ejercer sus derechos o presentar un reclamo, debe:
            </p>
            <ol className="list-decimal pl-6 space-y-2 mt-4">
              <li>Enviar una solicitud escrita a <strong>kaiu.oficialco@gmail.com</strong></li>
              <li>Incluir su nombre completo, número de identificación y descripción de la solicitud</li>
              <li>Adjuntar copia de su documento de identidad</li>
            </ol>
            <p className="mt-4">
              <strong>Plazos de respuesta:</strong>
            </p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Consultas: Máximo 10 días hábiles</li>
              <li>Reclamos: Máximo 15 días hábiles</li>
            </ul>
            <p className="mt-4">
              Si no queda satisfecho con nuestra respuesta, puede acudir a la 
              <strong> Superintendencia de Industria y Comercio (SIC)</strong> - Delegatura de Protección de Datos Personales.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-primary mb-4">
              6. Seguridad de los Datos
            </h2>
            <p>
              KAIU implementa medidas de seguridad técnicas, humanas y administrativas para proteger sus datos:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>Conexiones seguras HTTPS con certificados SSL</li>
              <li>Encriptación de datos sensibles</li>
              <li>Acceso restringido a bases de datos solo para personal autorizado</li>
              <li>Políticas de contraseñas seguras</li>
              <li>Copias de seguridad periódicas</li>
              <li>Pasarelas de pago certificadas (Wompi) con cumplimiento PCI-DSS</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-primary mb-4">
              7. Compartición de Datos con Terceros
            </h2>
            <p>
              Sus datos pueden ser compartidos únicamente con terceros necesarios para la prestación del servicio:
            </p>
            <div className="space-y-3 mt-4">
              <div className="border-l-4 border-primary pl-4">
                <h3 className="font-semibold">Empresas de Mensajería</h3>
                <p className="text-sm">Para gestionar y realizar la entrega de sus pedidos.</p>
              </div>
              <div className="border-l-4 border-primary pl-4">
                <h3 className="font-semibold">Pasarela de Pago (Wompi)</h3>
                <p className="text-sm">Para procesar transacciones de forma segura.</p>
              </div>
              <div className="border-l-4 border-primary pl-4">
                <h3 className="font-semibold">Proveedores de Hosting y Email</h3>
                <p className="text-sm">Para almacenar datos y enviar comunicaciones.</p>
              </div>
              <div className="border-l-4 border-primary pl-4">
                <h3 className="font-semibold">Autoridades Competentes</h3>
                <p className="text-sm">Cuando sea requerido por ley (DIAN, SIC, autoridades judiciales).</p>
              </div>
            </div>
            <p className="mt-4">
              <strong>Importante:</strong> Todos estos terceros están obligados a mantener la confidencialidad 
              y seguridad de sus datos.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-primary mb-4">
              8. Uso de Cookies
            </h2>
            <p>
              Utilizamos cookies para mejorar la experiencia de navegación. Las cookies son pequeños archivos 
              que se almacenan en su dispositivo y nos permiten:
            </p>
            <ul className="list-disc pl-6 space-y-1 mt-4">
              <li>Recordar sus preferencias</li>
              <li>Mantener su carrito de compras</li>
              <li>Analizar el tráfico del sitio web</li>
              <li>Personalizar el contenido</li>
            </ul>
            <p className="mt-4">
              Usted puede desactivar las cookies en la configuración de su navegador, aunque esto puede 
              limitar algunas funcionalidades del sitio.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-primary mb-4">
              9. Tiempo de Conservación de Datos
            </h2>
            <p>
              Conservaremos sus datos personales durante el tiempo necesario para:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li><strong>Datos de clientes activos:</strong> Mientras mantenga relación comercial con nosotros</li>
              <li><strong>Datos contables y fiscales:</strong> Mínimo 5 años según normativa tributaria colombiana</li>
              <li><strong>Datos de marketing:</strong> Hasta que revoque su autorización</li>
              <li><strong>Datos de reclamaciones:</strong> Hasta la resolución completa del caso</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-primary mb-4">
              10. Transferencia Internacional de Datos
            </h2>
            <p>
              Algunos de nuestros proveedores de servicios pueden estar ubicados fuera de Colombia 
              (servicios de hosting, análisis, etc.). En estos casos, garantizamos que dichos terceros 
              ofrecen niveles adecuados de protección de datos y cumplen con estándares internacionales.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-primary mb-4">
              11. Menores de Edad
            </h2>
            <p>
              Nuestros servicios están dirigidos a personas mayores de 18 años. No recolectamos 
              intencionalmente datos de menores de edad. Si es padre o tutor y cree que su hijo ha 
              proporcionado información, contáctenos para eliminarla.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-primary mb-4">
              12. Modificaciones a esta Política
            </h2>
            <p>
              Nos reservamos el derecho de actualizar esta Política de Privacidad. Cualquier cambio 
              será publicado en esta página y, si es sustancial, le notificaremos por correo electrónico.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-primary mb-4">
              13. Autorización de Tratamiento de Datos
            </h2>
            <div className="bg-primary/5 p-6 rounded-lg">
              <p className="font-semibold mb-4">
                Al realizar una compra o registrarse en nuestro sitio web, usted:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Autoriza expresamente a KAIU para el tratamiento de sus datos personales conforme a esta política</li>
                <li>Confirma que los datos proporcionados son veraces y actualizados</li>
                <li>Se compromete a actualizar su información cuando sea necesario</li>
                <li>Acepta recibir comunicaciones relacionadas con sus pedidos</li>
              </ul>
              <p className="mt-4 text-sm">
                Si desea recibir también comunicaciones de marketing, puede activar esta opción 
                durante el proceso de compra o contactándonos posteriormente.
              </p>
            </div>
          </section>

          <section className="bg-accent/10 border-2 border-accent p-6 rounded-lg mt-8">
            <h3 className="font-display text-xl font-semibold mb-4">Contacto - Protección de Datos</h3>
            <p className="mb-4">
              Para ejercer sus derechos o realizar consultas sobre el tratamiento de sus datos personales:
            </p>
            <ul className="list-none space-y-2">
              <li><strong>Email:</strong> kaiu.oficialco@gmail.com</li>
              <li><strong>WhatsApp:</strong> +57 123 456 7890</li>
              <li><strong>Asunto:</strong> "Protección de Datos Personales - [Su nombre]"</li>
            </ul>
            <p className="mt-4 text-sm text-muted-foreground">
              <strong>Superintendencia de Industria y Comercio (SIC)</strong><br />
              Delegatura de Protección de Datos Personales<br />
              www.sic.gov.co
            </p>
          </section>
        </div>
      </div>
    </Layout>
  );
}
