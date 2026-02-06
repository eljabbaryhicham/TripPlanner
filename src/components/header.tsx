'use client';

import Link from 'next/link';
import { BedDouble, Car, Briefcase, Mountain } from 'lucide-react';
import * as React from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const NavLink = ({
  href,
  children,
  label,
}: {
  href: string;
  children: React.ReactNode;
  label: string;
}) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <div className="group relative flex flex-col items-center">
      <Link href={href}>
        <div
          className={cn(
            'flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-200 ease-in-out group-hover:-translate-y-2 group-hover:scale-110',
            isActive
              ? 'bg-primary/20'
              : 'bg-background/80 group-hover:bg-secondary/50'
          )}
        >
          {children}
        </div>
      </Link>
      <span className="absolute -bottom-6 text-xs text-foreground opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        {label}
      </span>
      {isActive && (
        <div className="absolute -bottom-2 h-1 w-1 rounded-full bg-foreground"></div>
      )}
    </div>
  );
};

const Header = () => {
  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
      <nav className="flex h-20 items-start justify-center gap-4 rounded-3xl border bg-background/50 p-3 shadow-lg backdrop-blur-md">
        <NavLink href="/" label="Home">
          <Mountain className="h-7 w-7 text-foreground" />
        </NavLink>
        <div className="mx-1 h-10 self-center w-px bg-border" />
        <NavLink href="/services/cars" label="Cars">
          <Car className="h-7 w-7 text-foreground" />
        </NavLink>
        <NavLink href="/services/hotels" label="Hotels">
          <BedDouble className="h-7 w-7 text-foreground" />
        </NavLink>
        <NavLink href="/services/transport" label="Pickup">
          <Briefcase className="h-7 w-7 text-foreground" />
        </NavLink>
      </nav>
    </div>
  );
};

export default Header;
