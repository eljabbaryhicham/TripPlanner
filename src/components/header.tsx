
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { BedDouble, Car, Briefcase, Mountain, Compass } from 'lucide-react';
import * as React from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth, useUser, initiateAnonymousSignIn } from '@/firebase';
import { useSettings } from './settings-provider';
import { Skeleton } from './ui/skeleton';

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
            'flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-200 ease-in-out group-hover:-translate-y-1 group-hover:scale-110 sm:h-14 sm:w-14 sm:rounded-2xl sm:group-hover:-translate-y-2',
            isActive
              ? 'bg-primary/20'
              : 'bg-background/80 group-hover:bg-secondary/50'
          )}
        >
          {children}
        </div>
      </Link>
      <span className="absolute -bottom-5 text-xs text-foreground opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        {label}
      </span>
      {isActive && (
        <div className="absolute -bottom-1.5 h-1 w-1 rounded-full bg-foreground"></div>
      )}
    </div>
  );
};

const Header = () => {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const { categories: categorySettings, logoUrl, isSettingsLoading } = useSettings();

  React.useEffect(() => {
    // If auth is ready, and we're done checking, and there's no user, sign in anonymously.
    if (auth && !isUserLoading && !user) {
      initiateAnonymousSignIn(auth);
    }
  }, [auth, isUserLoading, user]);

  if (isSettingsLoading) {
    return (
      <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 sm:bottom-6">
        <Skeleton className="h-16 w-[280px] rounded-2xl sm:w-[380px] sm:rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 sm:bottom-6">
      <nav className="flex h-16 items-center justify-center gap-2 rounded-2xl border bg-background/50 p-2 shadow-lg backdrop-blur-md sm:gap-4 sm:rounded-3xl sm:p-3">
        <NavLink href="/" label="Home">
          {logoUrl ? (
            <Image src={logoUrl} alt="TriPlanner Logo" width={28} height={28} className="object-contain sm:h-8 sm:w-8" />
          ) : (
            <Mountain className="h-6 w-6 text-foreground sm:h-7 sm:w-7" />
          )}
        </NavLink>
        <div className="mx-1 h-8 self-center w-px bg-border sm:h-10" />
        {categorySettings?.cars && (
          <NavLink href="/services/cars" label="Cars">
            <Car className="h-6 w-6 text-foreground sm:h-7 sm:w-7" />
          </NavLink>
        )}
        {categorySettings?.hotels && (
          <NavLink href="/services/hotels" label="Hotels">
            <BedDouble className="h-6 w-6 text-foreground sm:h-7 sm:w-7" />
          </NavLink>
        )}
        {categorySettings?.transport && (
          <NavLink href="/services/transport" label="Pickup">
            <Briefcase className="h-6 w-6 text-foreground sm:h-7 sm:w-7" />
          </NavLink>
        )}
        {categorySettings?.explore && (
          <NavLink href="/services/explore" label="Explore">
            <Compass className="h-6 w-6 text-foreground sm:h-7 sm:w-7" />
          </NavLink>
        )}
      </nav>
    </div>
  );
};

export default Header;
