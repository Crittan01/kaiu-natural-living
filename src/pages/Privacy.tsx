import { Layout } from '@/components/layout/Layout';

const Privacy = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 md:py-20 max-w-4xl">
        <h1 className="text-3xl md:text-4xl font-display font-bold mb-6">Política de Privacidad y Tratamiento de Datos</h1>
        
        <div className="prose prose-stone dark:prose-invert max-w-none space-y-6">
            <p>
                En cumplimiento de la Ley 1581 de 2012 y el Decreto 1377 de 2013, KAIU Natural Living informa que es responsable del tratamiento de tus datos personales.
            </p>

            <h3 className="text-xl font-bold text-primary">1. Recolección de Datos</h3>
            <p>
                Recopilamos información como nombre, cédula, dirección, teléfono y correo electrónico únicamente con el fin de:
                <ul className="list-disc pl-5 mt-2">
                    <li>Procesar y enviar tus pedidos.</li>
                    <li>Generar facturación electrónica si es requerida.</li>
                    <li>Enviarte notificaciones sobre el estado de tu compra.</li>
                    <li>Enviar promociones (solo si has aceptado explícitamente recibirlas).</li>
                </ul>
            </p>

            <h3 className="text-xl font-bold text-primary">2. Derechos del Titular</h3>
            <p>
                Como titular de los datos, tienes derecho a conocer, actualizar, rectificar y solicitar la eliminación de tu información de nuestras bases de datos en cualquier momento.
                Para ejercer estos derechos, escribe a <strong>contacto@kaiu.co</strong>.
            </p>

            <h3 className="text-xl font-bold text-primary">3. Seguridad</h3>
            <p>
                Tus datos no serán vendidos ni compartidos con terceros, excepto con las empresas transportadoras y pasarelas de pago estrictamente para el cumplimiento de la entrega del pedido.
            </p>
        </div>
      </div>
    </Layout>
  );
};

export default Privacy;
