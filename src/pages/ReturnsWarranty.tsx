import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Package, RefreshCw, Shield, Clock, AlertTriangle, CheckCircle } from 'lucide-react';

export default function ReturnsWarranty() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-primary mb-6">
            Devoluciones, Cambios y Garantía
          </h1>
          
          <div className="prose prose-sm md:prose-base max-w-none space-y-6 text-foreground">
            <section>
              <p className="text-muted-foreground mb-4">
                <strong>Última actualización:</strong> {new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
              
              <p>
                En <strong>KAIU - Cosmética Natural</strong>, nos comprometemos con tu satisfacción y 
                cumplimos rigurosamente con la normativa colombiana de protección al consumidor.
              </p>
            </section>

            {/* Derecho de Retracto Section */}
            <section className="bg-primary/5 border-2 border-primary/20 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <RefreshCw className="w-8 h-8 text-primary shrink-0 mt-1" />
                <div>
                  <h2 className="text-2xl font-display font-semibold text-primary mb-3">
                    Derecho de Retracto - Ley 1480 de 2011
                  </h2>
                  
                  <div className="bg-white dark:bg-gray-900 p-4 rounded-lg mb-4">
                    <p className="font-semibold text-lg">
                      Tienes <span className="text-primary">5 días hábiles</span> para devolver tu producto
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Según el Artículo 47 de la Ley 1480 de 2011 (Estatuto del Consumidor), 
                      en las ventas que utilizan métodos no tradicionales (ventas online), 
                      el consumidor puede retractarse sin justificación alguna.
                    </p>
                  </div>

                  <h3 className="text-xl font-semibold mt-6 mb-3">¿Cuándo puedo ejercer el derecho de retracto?</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                      <p>Tienes <strong>5 días hábiles</strong> contados desde la recepción del producto.</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                      <p>No necesitas dar explicaciones ni justificar tu decisión.</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                      <p>Es un derecho protegido por la ley colombiana.</p>
                    </div>
                  </div>

                  <h3 className="text-xl font-semibold mt-6 mb-3">Condiciones del producto para devolución</h3>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg">
                    <p className="font-semibold mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" />
                      Requisitos importantes:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 text-sm">
                      <li><strong>Sin usar:</strong> El producto debe estar sin abrir y sin uso.</li>
                      <li><strong>Empaque original:</strong> Debe conservar el empaque, etiquetas y sellos intactos.</li>
                      <li><strong>Sello de seguridad:</strong> Para productos de cosmética natural, el sello NO debe estar roto.</li>
                      <li><strong>Comprobante:</strong> Debes conservar la factura o comprobante de compra.</li>
                      <li><strong>Estado original:</strong> El producto debe estar en perfectas condiciones de reventa.</li>
                    </ul>
                  </div>

                  <h3 className="text-xl font-semibold mt-6 mb-3">¿Cómo solicitar el retracto?</h3>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <ol className="list-decimal pl-6 space-y-3">
                      <li>
                        <strong>Contacta con nosotros:</strong>
                        <p className="text-sm mt-1">Envía un correo a <a href="mailto:kaiu.oficialco@gmail.com" className="text-primary hover:underline">kaiu.oficialco@gmail.com</a> 
                        indicando:</p>
                        <ul className="list-disc pl-6 text-sm mt-2 space-y-1">
                          <li>Número de pedido</li>
                          <li>Productos a devolver</li>
                          <li>Motivo de devolución (opcional)</li>
                        </ul>
                      </li>
                      <li>
                        <strong>Coordina la devolución:</strong>
                        <p className="text-sm mt-1">Te indicaremos cómo enviar el producto de vuelta. 
                        En algunos casos, podemos coordinar la recolección.</p>
                      </li>
                      <li>
                        <strong>Envío del producto:</strong>
                        <p className="text-sm mt-1">Empaca cuidadosamente el producto con todos sus accesorios y documentación.</p>
                      </li>
                      <li>
                        <strong>Verificación:</strong>
                        <p className="text-sm mt-1">Una vez recibido el producto, verificaremos que cumple las condiciones.</p>
                      </li>
                      <li>
                        <strong>Reembolso:</strong>
                        <p className="text-sm mt-1">Procesaremos el reembolso en un plazo máximo de <strong>30 días calendario</strong> 
                        desde la recepción del producto.</p>
                      </li>
                    </ol>
                  </div>

                  <h3 className="text-xl font-semibold mt-6 mb-3">Costos de envío de devolución</h3>
                  <p>
                    Los costos de envío para la devolución del producto son asumidos por el cliente, 
                    salvo que la devolución se deba a un defecto o error de nuestra parte.
                  </p>
                </div>
              </div>
            </section>

            {/* Cambios Section */}
            <section className="mt-8">
              <div className="flex items-start gap-4">
                <Package className="w-8 h-8 text-accent shrink-0 mt-1" />
                <div className="flex-1">
                  <h2 className="text-2xl font-display font-semibold text-primary mb-4">
                    Política de Cambios
                  </h2>
                  
                  <p className="mb-4">
                    Además del derecho de retracto, ofrecemos facilidades para cambios de productos:
                  </p>

                  <h3 className="text-xl font-semibold mt-6 mb-3">Cambios por talla, variante o referencia</h3>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <ul className="space-y-3">
                      <li className="flex items-start gap-2">
                        <span className="text-primary font-semibold">•</span>
                        <span><strong>Plazo:</strong> Hasta 5 días hábiles desde la recepción del producto.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary font-semibold">•</span>
                        <span><strong>Condición:</strong> El producto debe estar sin usar, con etiquetas y empaques originales.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary font-semibold">•</span>
                        <span><strong>Disponibilidad:</strong> Sujeto a disponibilidad del producto deseado en inventario.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary font-semibold">•</span>
                        <span><strong>Diferencia de precio:</strong> Si el nuevo producto tiene un valor mayor, 
                        deberás pagar la diferencia. Si es menor, reembolsamos la diferencia.</span>
                      </li>
                    </ul>
                  </div>

                  <h3 className="text-xl font-semibold mt-6 mb-3">¿Cómo solicitar un cambio?</h3>
                  <p>Contacta a kaiu.oficialco@gmail.com con tu número de pedido y el producto que deseas cambiar.</p>
                </div>
              </div>
            </section>

            {/* Garantía Section */}
            <section className="mt-8">
              <div className="flex items-start gap-4">
                <Shield className="w-8 h-8 text-green-600 shrink-0 mt-1" />
                <div className="flex-1">
                  <h2 className="text-2xl font-display font-semibold text-primary mb-4">
                    Garantía Legal - Ley 1480 de 2011
                  </h2>
                  
                  <p className="mb-4">
                    Todos nuestros productos cuentan con <strong>garantía legal de calidad, idoneidad y seguridad</strong> 
                    según lo establecido en la Ley 1480 de 2011 (Estatuto del Consumidor).
                  </p>

                  <h3 className="text-xl font-semibold mt-6 mb-3">¿Qué cubre la garantía?</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 rounded-lg">
                      <p className="font-semibold text-green-800 dark:text-green-200 mb-2">✓ SÍ cubre:</p>
                      <ul className="text-sm space-y-2">
                        <li>• Defectos de fabricación</li>
                        <li>• Productos que no cumplen características anunciadas</li>
                        <li>• Productos deteriorados al momento de entrega</li>
                        <li>• Productos vencidos o próximos a vencer</li>
                        <li>• Errores en el empaque o etiquetado</li>
                      </ul>
                    </div>

                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-lg">
                      <p className="font-semibold text-red-800 dark:text-red-200 mb-2">✗ NO cubre:</p>
                      <ul className="text-sm space-y-2">
                        <li>• Mal uso o almacenamiento inadecuado</li>
                        <li>• Productos abiertos con alteraciones por exposición</li>
                        <li>• Reacciones alérgicas individuales</li>
                        <li>• Daños por modificación del producto</li>
                        <li>• Uso contrario a las instrucciones</li>
                      </ul>
                    </div>
                  </div>

                  <h3 className="text-xl font-semibold mt-6 mb-3">Duración de la garantía</h3>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2">
                        <Clock className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <span><strong>Productos de cosmética natural:</strong> Según fecha de vencimiento 
                        indicada en el empaque (generalmente 12-24 meses desde apertura).</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Clock className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <span><strong>Defectos visibles:</strong> Deben reclamarse dentro de los primeros 
                        <strong> 30 días</strong> desde la recepción.</span>
                      </li>
                    </ul>
                  </div>

                  <h3 className="text-xl font-semibold mt-6 mb-3">¿Cómo hacer efectiva la garantía?</h3>
                  <div className="bg-accent/10 p-4 rounded-lg">
                    <ol className="list-decimal pl-6 space-y-2">
                      <li>Contacta a kaiu.oficialco@gmail.com dentro del período de garantía.</li>
                      <li>Proporciona número de pedido, fotos del producto y descripción del problema.</li>
                      <li>Conserva el producto y empaque original hasta recibir instrucciones.</li>
                      <li>Según el caso, procederemos a:
                        <ul className="list-disc pl-6 mt-2 space-y-1">
                          <li><strong>Reparación:</strong> Si es posible (casos excepcionales en cosmética).</li>
                          <li><strong>Cambio:</strong> Por un producto nuevo de las mismas características.</li>
                          <li><strong>Devolución del dinero:</strong> Si no hay producto disponible para cambio.</li>
                        </ul>
                      </li>
                    </ol>
                  </div>

                  <div className="bg-primary/10 border-l-4 border-primary p-4 rounded mt-6">
                    <p className="font-semibold mb-2">📋 Importante:</p>
                    <p className="text-sm">
                      De acuerdo con la Ley 1480 de 2011, como vendedor, tenemos un plazo de <strong>30 días calendario</strong> 
                      para atender las solicitudes de garantía. Te mantendremos informado en todo momento del estado de tu caso.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Casos Especiales */}
            <section className="mt-8">
              <h2 className="text-2xl font-display font-semibold text-primary mb-4">
                Casos Especiales
              </h2>
              
              <div className="space-y-4">
                <div className="border-l-4 border-accent pl-4">
                  <h3 className="text-xl font-semibold mb-2">Productos dañados en el envío</h3>
                  <p className="text-sm">
                    Si recibes un producto dañado por la transportadora:
                  </p>
                  <ul className="list-disc pl-6 text-sm mt-2 space-y-1">
                    <li>NO firmes el recibido como "conforme"</li>
                    <li>Anota el daño en la guía de la transportadora</li>
                    <li>Toma fotos del empaque y producto</li>
                    <li>Contacta de inmediato a kaiu.oficialco@gmail.com</li>
                    <li>Realizaremos el cambio sin costo para ti</li>
                  </ul>
                </div>

                <div className="border-l-4 border-accent pl-4">
                  <h3 className="text-xl font-semibold mb-2">Error en el pedido</h3>
                  <p className="text-sm">
                    Si recibiste un producto diferente al que ordenaste por error nuestro:
                  </p>
                  <ul className="list-disc pl-6 text-sm mt-2 space-y-1">
                    <li>Contáctanos inmediatamente</li>
                    <li>Coordinaremos la recolección del producto equivocado (sin costo)</li>
                    <li>Enviaremos el producto correcto de inmediato</li>
                    <li>Los costos de envío corren por nuestra cuenta</li>
                  </ul>
                </div>

                <div className="border-l-4 border-accent pl-4">
                  <h3 className="text-xl font-semibold mb-2">Productos personalizados o en oferta</h3>
                  <p className="text-sm">
                    Para productos en promoción especial o kits personalizados:
                  </p>
                  <ul className="list-disc pl-6 text-sm mt-2 space-y-1">
                    <li>Aplica el derecho de retracto (5 días hábiles)</li>
                    <li>Aplica la garantía legal por defectos</li>
                    <li>Los cambios están sujetos a disponibilidad</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Excepciones */}
            <section className="mt-8">
              <h2 className="text-2xl font-display font-semibold text-primary mb-4">
                Excepciones al Derecho de Retracto
              </h2>
              
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg">
                <p className="font-semibold mb-3">
                  <AlertTriangle className="w-5 h-5 inline mr-2" />
                  No aplica derecho de retracto en los siguientes casos:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-sm">
                  <li><strong>Productos abiertos o usados:</strong> Por razones de higiene y salud pública, 
                  productos de cosmética con sello roto no pueden ser devueltos (salvo defecto de fábrica).</li>
                  <li><strong>Productos personalizados:</strong> Aquellos fabricados según especificaciones del cliente.</li>
                  <li><strong>Productos perecederos:</strong> Si su naturaleza no permite devolución (productos con vida útil muy corta).</li>
                </ul>
              </div>
            </section>

            {/* Reembolsos */}
            <section className="mt-8">
              <h2 className="text-2xl font-display font-semibold text-primary mb-4">
                Política de Reembolsos
              </h2>
              
              <div className="bg-muted/50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3">Método de reembolso</h3>
                <p className="mb-3">El reembolso se realizará por el mismo medio de pago utilizado en la compra:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Tarjeta de crédito/débito:</strong> Reversión a la tarjeta (puede tardar 5-15 días hábiles según el banco).</li>
                  <li><strong>PSE/Transferencia:</strong> Consignación a la cuenta bancaria proporcionada.</li>
                  <li><strong>Nequi/Daviplata:</strong> Transferencia al número registrado.</li>
                </ul>

                <h3 className="text-lg font-semibold mt-6 mb-3">Monto del reembolso</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Se reembolsa el <strong>100% del valor del producto</strong>.</li>
                  <li>Los <strong>costos de envío original NO se reembolsan</strong> (salvo error de nuestra parte).</li>
                  <li>Los <strong>costos de devolución</strong> son asumidos por el cliente (salvo defecto o error nuestro).</li>
                </ul>

                <h3 className="text-lg font-semibold mt-6 mb-3">Tiempo de procesamiento</h3>
                <p>
                  Procesaremos el reembolso dentro de los <strong>30 días calendario</strong> siguientes 
                  a la recepción y verificación del producto devuelto, conforme a la Ley 1480 de 2011.
                </p>
              </div>
            </section>

            {/* Atención al Cliente */}
            <section className="mt-12 pt-8 border-t border-border">
              <h2 className="text-2xl font-display font-semibold text-primary mb-4">
                Atención al Cliente
              </h2>
              
              <p className="mb-4">
                Para cualquier solicitud de devolución, cambio, garantía o consulta:
              </p>

              <div className="bg-primary/10 p-6 rounded-lg">
                <p className="font-semibold text-lg mb-4">Canales de Contacto</p>
                <div className="space-y-2">
                  <p>📧 <strong>Email:</strong> kaiu.oficialco@gmail.com</p>
                  <p>💬 <strong>WhatsApp:</strong> [Número de contacto]</p>
                  <p>⏱️ <strong>Horario:</strong> Lunes a Viernes, 9:00 AM - 6:00 PM</p>
                  <p>📍 <strong>Ubicación:</strong> Bogotá D.C., Colombia</p>
                </div>
                
                <div className="mt-4 pt-4 border-t border-primary/20">
                  <p className="text-sm text-muted-foreground">
                    <strong>Tiempo de respuesta:</strong> Nos comprometemos a responder tu solicitud 
                    en un plazo máximo de <strong>15 días hábiles</strong> según lo establecido en la 
                    Ley 1480 de 2011.
                  </p>
                </div>
              </div>
            </section>

            {/* Marco Legal */}
            <div className="mt-8 p-4 bg-accent/10 border border-accent/30 rounded-lg">
              <p className="text-sm text-center">
                <strong>Marco Legal:</strong> Esta política cumple con la <strong>Ley 1480 de 2011</strong> (Estatuto del Consumidor), 
                <strong> Decreto 735 de 2013</strong> (Comercio Electrónico) y demás normatividad colombiana aplicable 
                en materia de protección al consumidor.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
