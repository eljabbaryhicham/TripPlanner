import Header from '@/components/header';
import Footer from '@/components/footer';
import { Info } from 'lucide-react';
import Image from 'next/image';

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 py-16 md:py-24">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="text-center mb-12">
            <Info className="mx-auto h-12 w-12 text-primary" />
            <h1 className="mt-4 font-headline text-3xl font-bold md:text-4xl">
              About TriPlanner
            </h1>
            <p className="mt-2 max-w-2xl mx-auto text-lg text-foreground/80">
              Your ultimate travel planning assistant.
            </p>
          </div>
          <div className="space-y-8 text-lg text-foreground/90">
            <div className="relative aspect-[16/9] w-full rounded-lg overflow-hidden">
                <Image 
                    src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=1935&auto=format&fit=crop"
                    alt="Traveler looking at a map"
                    fill
                    className="object-cover"
                    priority
                />
            </div>
            <p>
              Welcome to TriPlanner, your one-stop solution for seamless travel planning. Our mission is to take the hassle out of organizing your trips by providing a curated selection of the best cars, hotels, and transport services all in one place.
            </p>
            <p>
              We believe that planning your adventure should be as exciting as the journey itself. That's why we've built a platform that is simple, intuitive, and powered by smart technology to bring you personalized suggestions and the best offers available. Whether you're planning a business trip, a family vacation, or a solo adventure, TriPlanner is here to help you every step of the way.
            </p>
            <p>
              Our dedicated team is passionate about travel and committed to providing you with exceptional service. From our easy-to-use booking system to our responsive customer support, we strive to make your experience with TriPlanner a memorable one.
            </p>
            <p>
              Thank you for choosing TriPlanner. Let's plan your next adventure together!
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
