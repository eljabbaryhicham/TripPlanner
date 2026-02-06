'use client';

import Link from 'next/link';
import { BedDouble, Car, Plane, Mountain } from 'lucide-react';

const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 max-w-screen-2xl items-center px-4">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <Mountain className="h-6 w-6" />
          <span className="font-bold font-headline">TriPlanner</span>
        </Link>
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          <Link
            href="/services/cars"
            className="transition-colors hover:text-foreground/80 text-foreground/60"
          >
            Cars
          </Link>
          <Link
            href="/services/hotels"
            className="transition-colors hover:text-foreground/80 text-foreground/60"
          >
            Hotels
          </Link>
          <Link
            href="/services/transport"
            className="transition-colors hover:text-foreground/80 text-foreground/60"
          >
            Transport
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;
