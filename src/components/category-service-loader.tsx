
'use client';

import { useEffect } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Service } from '@/lib/types';

const getCollectionPath = (category: string) => {
    switch(category) {
        case 'cars': return 'carRentals';
        case 'hotels': return 'hotels';
        case 'transport': return 'transports';
        case 'explore': return 'exploreTrips';
        default: return category;
    }
};

interface CategoryServiceLoaderProps {
  categoryId: string;
  onDataLoaded: (categoryId: string, services: Service[] | null, isLoading: boolean) => void;
}

export const CategoryServiceLoader = ({ categoryId, onDataLoaded }: CategoryServiceLoaderProps) => {
  const firestore = useFirestore();
  
  const collectionPath = getCollectionPath(categoryId);
  
  const servicesRef = useMemoFirebase(
    () => (firestore && collectionPath ? collection(firestore, collectionPath) : null),
    [firestore, collectionPath]
  );
  
  const { data: services, isLoading } = useCollection<Service>(servicesRef);

  useEffect(() => {
    onDataLoaded(categoryId, services, isLoading);
  }, [categoryId, services, isLoading, onDataLoaded]);

  return null; // This component renders nothing
};
