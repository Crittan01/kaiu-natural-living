import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-primary mb-6">
            Política de Privacidad y Protección de Datos Personales
          </h1>
          
          <div className="prose prose-sm md:prose-base max-w-none space-y-6 text-foreground">
            <section>
              <p className="text-muted-foreground mb-4">
                <strong>Última actualización:</strong> {new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
              
              <div className="bg-primary/10 border-l-4 border-primary p-4 rounded">
                <p className="font-semibold">
                  KAIU - Cosmética Natural se compromete con la protección de sus datos personales conforme 
                  a la Ley 1581 de 2012 (Ley de Protección de Datos Personales - Habeas Data), Decreto 1377 de 2013 
                  y demás normas concordantes y complementarias.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-display font-semibold text-primary mt-8 mb-4">
                1. Responsable del Tratamiento de Datos
              </h2>
              <div className="bg-muted/50 p-4 rounded-lg">
                <p><strong>Razón Social:</strong> KAIU - Cosmética Natural</p>
                <p><strong>Tipo de Persona:</strong> Persona Natural</p>
                <p><strong>Domicilio:</strong> Bogotá D.C., Colombia</p>
                <p><strong>Correo Electrónico:</strong> kaiu.oficialco@gmail.com</p>
                <p><strong>Actividad:</strong> Comercio electrónico de productos de cosmética natural</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-display font-semibold text-primary mt-8 mb-4">
                2. Datos Personales que Recolectamos
              </h2>
              
              <h3 className="text-xl font-semibold mt-6 mb-3">2.1 Datos de Identificación</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Nombre completo</li>
                <li>Número de identificación (cédula de ciudadanía, cédula de extranjería o pasaporte)</li>
                <li>Fecha de nacimiento (cuando sea requerida)</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-3">2.2 Datos de Contacto</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Dirección de correo electrónico</li>
                <li>Número de teléfono móvil</li>
                <li>Dirección física de residencia y/o entrega</li>
                <li>Ciudad y departamento</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-3">2.3 Datos Comerciales</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Historial de compras</li>
                <li>Productos favoritos (wishlist)</li>
                <li>Preferencias de productos</li>
                <li>Información de facturación</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-3">2.4 Datos de Navegación</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Dirección IP</li>
                <li>Tipo de navegador y dispositivo</li>
                <li>Páginas visitadas</li>
                <li>Tiempo de navegación</li>
                <li>Cookies (ver sección de cookies)</li>
              </ul>

              <p className="mt-4 text-sm text-muted-foreground italic">
                <strong>Nota:</strong> NO recolectamos datos sensibles como información médica, biométrica, 
                orientación sexual, afiliación política o religiosa, salvo que usted voluntariamente nos la proporcione 
                (por ejemplo, en consultas sobre alergias), caso en el cual solicitaremos su autorización expresa.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-display font-semibold text-primary mt-8 mb-4">
                3. Finalidades del Tratamiento de Datos
              </h2>
              
              <p className="mb-4">Sus datos personales serán tratados para las siguientes finalidades:</p>

              <h3 className="text-xl font-semibold mt-6 mb-3">3.1 Finalidades Principales</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Procesamiento de pedidos:</strong> Gestionar sus compras, pagos, envíos y facturación.</li>
                <li><strong>Atención al cliente:</strong> Responder consultas, quejas, reclamos y solicitudes.</li>
                <li><strong>Cumplimiento de obligaciones legales:</strong> Facturación electrónica, reportes tributarios ante la DIAN.</li>
                <li><strong>Garantías y devoluciones:</strong> Gestionar el derecho de retracto y garantías legales.</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-3">3.2 Finalidades Secundarias (Marketing)</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Envío de promociones, descuentos y ofertas personalizadas</li>
                <li>Boletines informativos (newsletters) sobre nuevos productos</li>
                <li>Encuestas de satisfacción y estudios de mercado</li>
                <li>Comunicaciones sobre rituales de bienestar y contenido educativo</li>
              </ul>
              
              <div className="bg-accent/10 border border-accent/30 p-4 rounded-lg mt-4">
                <p className="text-sm">
                  ✓ <strong>Puede darse de baja en cualquier momento</strong> de las comunicaciones de marketing 
                  haciendo clic en el enlace de "Cancelar suscripción" en nuestros correos o escribiendo a 
                  kaiu.oficialco@gmail.com.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-display font-semibold text-primary mt-8 mb-4">
                4. Legitimación y Base Legal del Tratamiento
              </h2>
              
              <p>El tratamiento de sus datos personales se fundamenta en:</p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li><strong>Consentimiento informado:</strong> Al crear una cuenta o realizar una compra, usted acepta nuestra política de privacidad.</li>
                <li><strong>Ejecución de contrato:</strong> Para procesar y entregar sus pedidos.</li>
                <li><strong>Cumplimiento de obligaciones legales:</strong> Emisión de facturas electrónicas, reportes ante la DIAN, etc.</li>
                <li><strong>Interés legítimo:</strong> Mejora de nuestros servicios y prevención de fraude.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-display font-semibold text-primary mt-8 mb-4">
                5. Destinatarios y Transferencia de Datos
              </h2>
              
              <p className="mb-4">
                Sus datos personales pueden ser compartidos con terceros únicamente cuando sea necesario 
                para cumplir con las finalidades descritas:
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3">5.1 Proveedores de Servicios</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Wompi:</strong> Pasarela de pagos para procesar transacciones (cumple con estándares PCI-DSS).</li>
                <li><strong>Empresas de mensajería:</strong> Para entrega de productos (Coordinadora, Servientrega, etc.).</li>
                <li><strong>Servicios de email:</strong> Para envío de comunicaciones y newsletters.</li>
                <li><strong>Proveedores de hosting:</strong> Para almacenamiento seguro de la base de datos.</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-3">5.2 Autoridades Competentes</h3>
              <p>
                Cuando sea requerido por ley, compartiremos información con:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>DIAN (Dirección de Impuestos y Aduanas Nacionales)</li>
                <li>Superintendencia de Industria y Comercio</li>
                <li>Autoridades judiciales mediante orden judicial</li>
              </ul>

              <p className="mt-4 text-sm text-muted-foreground">
                <strong>Importante:</strong> KAIU NO vende, alquila ni comercializa sus datos personales a terceros 
                para fines publicitarios sin su consentimiento expreso.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-display font-semibold text-primary mt-8 mb-4">
                6. Seguridad de los Datos
              </h2>
              
              <p className="mb-4">
                Implementamos medidas técnicas, administrativas y físicas para proteger sus datos personales:
              </p>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">🔒 Medidas Técnicas</h4>
                  <ul className="text-sm space-y-1">
                    <li>• Cifrado SSL/TLS en el sitio web</li>
                    <li>• Bases de datos protegidas con encriptación</li>
                    <li>• Firewalls y sistemas anti-intrusión</li>
                    <li>• Copias de seguridad periódicas</li>
                  </ul>
                </div>
                
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">👥 Medidas Administrativas</h4>
                  <ul className="text-sm space-y-1">
                    <li>• Acceso restringido a datos personales</li>
                    <li>• Acuerdos de confidencialidad</li>
                    <li>• Capacitación del personal</li>
                    <li>• Políticas de seguridad de la información</li>
                  </ul>
                </div>
              </div>

              <p className="mt-4 text-sm text-muted-foreground">
                A pesar de nuestros esfuerzos, ningún sistema es 100% seguro. En caso de violación de seguridad 
                que comprometa sus datos, le notificaremos de inmediato y tomaremos las medidas correctivas necesarias.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-display font-semibold text-primary mt-8 mb-4">
                7. Tiempo de Conservación de los Datos
              </h2>
              
              <p className="mb-4">Conservamos sus datos personales por los siguientes períodos:</p>
              
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Datos de clientes activos:</strong> Mientras mantenga su cuenta activa y/o realice compras.</li>
                <li><strong>Historial de compras:</strong> 5 años (requisito de la DIAN para facturación electrónica).</li>
                <li><strong>Datos de marketing:</strong> Hasta que solicite darse de baja o eliminar su cuenta.</li>
                <li><strong>Cookies:</strong> Ver sección específica de cookies.</li>
              </ul>

              <p className="mt-4">
                Una vez vencidos estos plazos, sus datos serán eliminados o anonimizados de forma segura, 
                salvo que exista una obligación legal de conservarlos por más tiempo.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-display font-semibold text-primary mt-8 mb-4">
                8. Sus Derechos como Titular de Datos (Habeas Data)
              </h2>
              
              <div className="bg-accent/10 border-l-4 border-accent p-4 rounded mb-4">
                <p className="font-semibold">
                  De acuerdo con la Ley 1581 de 2012, usted tiene los siguientes derechos:
                </p>
              </div>

              <div className="space-y-4">
                <div className="border-l-4 border-primary/30 pl-4">
                  <h4 className="font-semibold">📋 Derecho de Acceso</h4>
                  <p className="text-sm">Conocer, consultar y obtener copia de sus datos personales.</p>
                </div>

                <div className="border-l-4 border-primary/30 pl-4">
                  <h4 className="font-semibold">✏️ Derecho de Rectificación</h4>
                  <p className="text-sm">Actualizar o corregir datos inexactos, incompletos o desactualizados.</p>
                </div>

                <div className="border-l-4 border-primary/30 pl-4">
                  <h4 className="font-semibold">🗑️ Derecho de Supresión</h4>
                  <p className="text-sm">Solicitar la eliminación de sus datos cuando ya no sean necesarios 
                  (salvo obligaciones legales de conservación).</p>
                </div>

                <div className="border-l-4 border-primary/30 pl-4">
                  <h4 className="font-semibold">🚫 Derecho de Oposición</h4>
                  <p className="text-sm">Oponerse al tratamiento de sus datos cuando no exista un deber legal que lo obligue.</p>
                </div>

                <div className="border-l-4 border-primary/30 pl-4">
                  <h4 className="font-semibold">📢 Derecho a Revocar la Autorización</h4>
                  <p className="text-sm">Retirar su consentimiento en cualquier momento.</p>
                </div>

                <div className="border-l-4 border-primary/30 pl-4">
                  <h4 className="font-semibold">⚖️ Derecho a Presentar Quejas</h4>
                  <p className="text-sm">Acudir ante la Superintendencia de Industria y Comercio si considera 
                  que sus derechos han sido vulnerados.</p>
                </div>
              </div>

              <h3 className="text-xl font-semibold mt-8 mb-3">8.1 ¿Cómo Ejercer sus Derechos?</h3>
              <p className="mb-3">Para ejercer cualquiera de estos derechos, puede:</p>
              <ol className="list-decimal pl-6 space-y-2">
                <li>Enviar correo electrónico a: <strong>kaiu.oficialco@gmail.com</strong></li>
                <li>Indicar en el asunto: "Solicitud de Habeas Data"</li>
                <li>Describir claramente su solicitud (acceso, rectificación, supresión, etc.)</li>
                <li>Adjuntar copia de su documento de identidad</li>
              </ol>

              <p className="mt-4 text-sm text-muted-foreground">
                <strong>Plazo de respuesta:</strong> Responderemos su solicitud en un plazo máximo de 
                <strong> quince (15) días hábiles</strong> contados desde la fecha de recepción, 
                según lo establecido en el Decreto 1377 de 2013.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-display font-semibold text-primary mt-8 mb-4">
                9. Uso de Cookies y Tecnologías Similares
              </h2>
              
              <p className="mb-4">
                Nuestro sitio web utiliza cookies y tecnologías similares para mejorar su experiencia de navegación.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3">9.1 ¿Qué son las Cookies?</h3>
              <p>
                Las cookies son pequeños archivos de texto que se almacenan en su dispositivo cuando visita nuestro sitio web.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3">9.2 Tipos de Cookies que Utilizamos</h3>
              
              <div className="space-y-3">
                <div className="bg-muted/50 p-3 rounded">
                  <p className="font-semibold">🔧 Cookies Estrictamente Necesarias</p>
                  <p className="text-sm">Esenciales para el funcionamiento del sitio (carrito de compras, sesión de usuario). 
                  No pueden desactivarse.</p>
                </div>

                <div className="bg-muted/50 p-3 rounded">
                  <p className="font-semibold">📊 Cookies Analíticas</p>
                  <p className="text-sm">Nos ayudan a entender cómo los visitantes interactúan con el sitio 
                  (páginas visitadas, tiempo de permanencia). Opcional.</p>
                </div>

                <div className="bg-muted/50 p-3 rounded">
                  <p className="font-semibold">🎯 Cookies de Personalización</p>
                  <p className="text-sm">Recuerdan sus preferencias (idioma, productos favoritos, tema). Opcional.</p>
                </div>

                <div className="bg-muted/50 p-3 rounded">
                  <p className="font-semibold">📢 Cookies de Marketing</p>
                  <p className="text-sm">Utilizadas para mostrar anuncios relevantes. Requieren su consentimiento.</p>
                </div>
              </div>

              <h3 className="text-xl font-semibold mt-6 mb-3">9.3 Control de Cookies</h3>
              <p>
                Puede gestionar o eliminar cookies según sus preferencias:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li>Al visitar nuestro sitio por primera vez, aparecerá un banner de cookies donde puede aceptar o rechazar.</li>
                <li>Puede configurar su navegador para rechazar cookies (esto puede afectar la funcionalidad del sitio).</li>
                <li>Puede eliminar cookies almacenadas desde la configuración de su navegador.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-display font-semibold text-primary mt-8 mb-4">
                10. Menores de Edad
              </h2>
              
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg">
                <p className="font-semibold mb-2">⚠️ Protección de Menores</p>
                <p>
                  Nuestro sitio web está dirigido a mayores de 18 años. NO recolectamos intencionalmente 
                  datos de menores de edad sin el consentimiento de sus padres o tutores legales.
                </p>
              </div>

              <p className="mt-4">
                Si un padre o tutor identifica que un menor ha proporcionado datos personales sin autorización, 
                debe contactarnos inmediatamente para eliminar dicha información.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-display font-semibold text-primary mt-8 mb-4">
                11. Transferencias Internacionales
              </h2>
              
              <p>
                Algunos de nuestros proveedores de servicios (hosting, email marketing) pueden almacenar 
                datos en servidores ubicados fuera de Colombia.
              </p>
              
              <p className="mt-3">
                En estos casos, nos aseguramos de que:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li>El país de destino cuente con niveles adecuados de protección de datos.</li>
                <li>Existan cláusulas contractuales que garanticen la protección de sus datos.</li>
                <li>Los proveedores cumplan con estándares internacionales (ISO 27001, SOC 2, etc.).</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-display font-semibold text-primary mt-8 mb-4">
                12. Modificaciones a la Política de Privacidad
              </h2>
              
              <p>
                KAIU se reserva el derecho de modificar esta política de privacidad en cualquier momento 
                para adaptarla a cambios legislativos, tecnológicos o en nuestras prácticas comerciales.
              </p>

              <p className="mt-3">
                Cualquier cambio material será notificado a través de:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li>Publicación en nuestro sitio web con la fecha de "Última actualización"</li>
                <li>Correo electrónico a clientes registrados (cambios significativos)</li>
                <li>Banner informativo en el sitio web</li>
              </ul>

              <p className="mt-3 text-sm text-muted-foreground">
                Le recomendamos revisar periódicamente esta política para mantenerse informado.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-display font-semibold text-primary mt-8 mb-4">
                13. Autoridad de Control
              </h2>
              
              <p>
                Si considera que el tratamiento de sus datos personales infringe la normativa vigente, 
                tiene derecho a presentar una queja ante la autoridad de control:
              </p>

              <div className="bg-muted/50 p-4 rounded-lg mt-4">
                <p className="font-semibold">Superintendencia de Industria y Comercio (SIC)</p>
                <p className="text-sm mt-2">
                  <strong>Delegatura para la Protección de Datos Personales</strong><br />
                  Carrera 13 # 27-00, Pisos 1 y 3<br />
                  Bogotá D.C., Colombia<br />
                  <strong>Línea Gratuita Nacional:</strong> 01 8000 910 165<br />
                  <strong>Sitio web:</strong> <a href="https://www.sic.gov.co" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">www.sic.gov.co</a><br />
                  <strong>Email:</strong> contactenos@sic.gov.co
                </p>
              </div>
            </section>

            <section className="mt-12 pt-8 border-t border-border">
              <h2 className="text-2xl font-display font-semibold text-primary mb-4">
                Contacto - Oficial de Protección de Datos
              </h2>
              
              <p className="mb-4">
                Para cualquier consulta relacionada con el tratamiento de sus datos personales o para 
                ejercer sus derechos de Habeas Data:
              </p>

              <div className="bg-primary/10 p-4 rounded-lg">
                <p><strong>KAIU - Cosmética Natural</strong></p>
                <p><strong>Oficial de Protección de Datos</strong></p>
                <p className="mt-2">
                  📧 Email: kaiu.oficialco@gmail.com<br />
                  📍 Domicilio: Bogotá D.C., Colombia<br />
                  ⏱️ Horario de atención: Lunes a Viernes, 9:00 AM - 6:00 PM
                </p>
              </div>
            </section>

            <div className="mt-8 p-4 bg-accent/10 border border-accent/30 rounded-lg">
              <p className="text-center text-sm">
                Esta Política de Privacidad cumple con la <strong>Ley 1581 de 2012</strong> (Ley de Protección de Datos Personales), 
                el <strong>Decreto 1377 de 2013</strong>, la <strong>Ley 1266 de 2008</strong> (Habeas Data) y demás normatividad 
                colombiana vigente en materia de protección de datos personales.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
