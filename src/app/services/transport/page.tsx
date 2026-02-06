
import Header from '@/components/header';
import Footer from '@/components/footer';
import { getServices } from '@/lib/actions';
import type { Service } from '@/lib/types';
import TransportPageContent from '@/components/transport-page-content';

export default async function TransportPage() {
  const services = await getServices();
  const service: Service | undefined = services.find(
    (s) => s.category === 'transport'
  );

  if (!service) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p>Service not found.</p>
        </main>
        <Footer />
      </div>
    );
  }

  return <TransportPageContent service={service} />;
}
