import { Layout } from '@/components/layout/Layout';

const Retracto = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 md:py-20 max-w-4xl">
        <h1 className="text-3xl md:text-4xl font-display font-bold mb-6">Política de Retracto y Devoluciones</h1>
        
        <div className="prose prose-stone dark:prose-invert max-w-none space-y-6">
            <p className="text-lg">
                Queremos que estés feliz con tu compra. Si no es así, aquí te explicamos cómo funcionan las devoluciones bajo la legislación colombiana.
            </p>

            <div className="bg-primary/5 p-6 rounded-lg border border-primary/10">
                <h3 className="text-xl font-bold text-primary mb-2">Derecho de Retracto</h3>
                <p>
                    Tienes <strong>5 días hábiles</strong> a partir de la recepción del producto para devolverlo sin necesidad de dar explicaciones, recibiendo el reembolso total de lo pagado.
                </p>
            </div>

            <h3 className="text-xl font-bold text-primary">Condiciones para Devolución</h3>
            <ul className="list-disc pl-5 space-y-2">
                <li>El producto no debe haber sido abierto ni usado (por tratarse de productos de cuidado personal y aromaterapia).</li>
                <li>Debe conservar sus etiquetas y empaques originales.</li>
                <li>Los costos de transporte hacia nuestras oficinas corren por cuenta del cliente (salvo si es garantía por defecto de fábrica).</li>
            </ul>

            <h3 className="text-xl font-bold text-primary">Pasos a seguir</h3>
            <ol className="list-decimal pl-5 space-y-2">
                <li>Escríbenos a contacto@kaiu.co indicando tu número de pedido.</li>
                <li>Te daremos las instrucciones de envío.</li>
                <li>Una vez recibamos el producto y verifiquemos su estado, iniciaremos el reembolso (plazo máx. 30 días).</li>
            </ol>
        </div>
      </div>
    </Layout>
  );
};

export default Retracto;
