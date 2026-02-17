'use client';

import * as React from 'react';
import type { Service, ServiceCategory, Category } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MoreHorizontal, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection } from 'firebase/firestore';
import { updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '../ui/skeleton';

const getCollectionPath = (category: ServiceCategory) => {
    switch(category) {
        case 'cars': return 'carRentals';
        case 'hotels': return 'hotels';
        case 'transport': return 'transports';
        case 'explore': return 'exploreTrips';
        default: return category;
    }
}

function ServiceStatusToggle({ service }: { service: Service }) {
  const { toast } = useToast();
  const firestore = useFirestore();

  const handleToggle = (checked: boolean) => {
    if (!firestore) {
        toast({ variant: 'destructive', title: 'Error', description: 'Database not available.' });
        return;
    }
    const collectionPath = getCollectionPath(service.category);
    if (!collectionPath) {
        toast({ variant: 'destructive', title: 'Error', description: 'Invalid service category.' });
        return;
    }

    const docRef = doc(firestore, collectionPath, service.id);
    updateDocumentNonBlocking(docRef, { isActive: checked });
    toast({ title: "Status update initiated." });
  };
  
  return (
    <div className="flex items-center space-x-2">
       <Switch
        id={`status-${service.id}`}
        checked={service.isActive ?? true}
        onCheckedChange={handleToggle}
      />
    </div>
  );
}

function BestOfferToggle({ service }: { service: Service }) {
  const { toast } = useToast();
  const firestore = useFirestore();

  const handleToggle = (checked: boolean) => {
    if (!firestore) {
        toast({ variant: 'destructive', title: 'Error', description: 'Database not available.' });
        return;
    }
    const collectionPath = getCollectionPath(service.category);
    if (!collectionPath) {
        toast({ variant: 'destructive', title: 'Error', description: 'Invalid service category.' });
        return;
    }
    
    const docRef = doc(firestore, collectionPath, service.id);
    updateDocumentNonBlocking(docRef, { isBestOffer: checked });
    toast({ title: "Best offer update initiated." });
  };

  return (
    <div className="flex items-center space-x-2">
       <Switch
        id={`best-offer-${service.id}`}
        checked={service.isBestOffer ?? false}
        onCheckedChange={handleToggle}
      />
    </div>
  );
}


function DeleteServiceMenuItem({ service }: { service: Service }) {
    const { toast } = useToast();
    const firestore = useFirestore();
    const [dialogOpen, setDialogOpen] = React.useState(false);

    const handleDelete = () => {
        if (!firestore) {
            toast({ variant: 'destructive', title: 'Error', description: 'Database connection not available.' });
            return;
        }

        const collectionPath = getCollectionPath(service.category);
        if (!collectionPath) {
            toast({ variant: 'destructive', title: 'Error', description: 'Invalid service category.' });
            return;
        }

        const docRef = doc(firestore, collectionPath, service.id);
        deleteDocumentNonBlocking(docRef);
        toast({ title: 'Service Deletion Initiated' });
        setDialogOpen(false);
    };

    return (
        <>
             <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the service
                        "{service.name}".
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <DropdownMenuItem onSelect={(e) => {e.preventDefault(); setDialogOpen(true)}}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
            </DropdownMenuItem>
        </>
    );
}

function ServiceTableSkeleton() {
    return (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Active</TableHead>
                        <TableHead>Best Offer</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {Array.from({ length: 3 }).map((_, i) => (
                        <TableRow key={i}>
                            <TableCell>
                                <Skeleton className="h-5 w-32" />
                                <Skeleton className="h-4 w-24 mt-1" />
                            </TableCell>
                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-11" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-11" /></TableCell>
                            <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}


interface ServiceCategoryTabProps {
    category: Category;
    onEdit: (service: Service) => void;
}

export default function ServiceCategoryTab({ category, onEdit }: ServiceCategoryTabProps) {
    const firestore = useFirestore();
    const collectionPath = getCollectionPath(category.id);
    
    const servicesRef = useMemoFirebase(() => {
        return firestore ? collection(firestore, collectionPath) : null;
    }, [firestore, collectionPath]);

    const { data: services, isLoading } = useCollection(servicesRef);

    if (isLoading) {
        return <ServiceTableSkeleton />;
    }

    return (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Active</TableHead>
                        <TableHead>Best Offer</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {services && services.length > 0 ? (
                        services.map((service) => (
                            <TableRow key={service.id}>
                                <TableCell>
                                    <div className="font-medium">{service.name}</div>
                                    {service.label && <div className="text-xs text-muted-foreground">{service.label}</div>}
                                </TableCell>
                                <TableCell>${service.price} / {service.priceUnit}</TableCell>
                                <TableCell>
                                    <ServiceStatusToggle service={{...service, category: category.id}} />
                                </TableCell>
                                <TableCell>
                                    <BestOfferToggle service={{...service, category: category.id}} />
                                </TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                <span className="sr-only">Open menu</span>
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => onEdit({...service, category: category.id})}>
                                                Edit
                                            </DropdownMenuItem>
                                            <DeleteServiceMenuItem service={{...service, category: category.id}} />
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center">
                                No services found.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
