'use client';

import * as React from 'react';
import type { Service } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, MoreHorizontal, Trash2, Car, BedDouble, Briefcase, Compass, Loader2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { updateServiceStatus } from '@/lib/actions';

function ServiceStatusToggle({ service }: { service: Service }) {
  const { toast } = useToast();
  const [isPending, startTransition] = React.useTransition();

  const handleToggle = (checked: boolean) => {
    startTransition(async () => {
      const result = await updateServiceStatus(service.id, service.category, checked);
      if (result.success) {
        toast({ title: "Status Updated" });
      } else {
        toast({ variant: "destructive", title: "Error", description: result.error });
      }
    });
  };

  return (
    <div className="flex items-center space-x-2">
       <Switch
        id={`status-${service.id}`}
        checked={service.isActive ?? true}
        onCheckedChange={handleToggle}
        disabled={isPending}
      />
      {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
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

        let collectionPath: string;
        switch(service.category) {
            case 'cars': collectionPath = 'carRentals'; break;
            case 'hotels': collectionPath = 'hotels'; break;
            case 'transport': collectionPath = 'transports'; break;
            case 'explore': collectionPath = 'exploreTrips'; break;
            default:
                toast({ variant: 'destructive', title: 'Error', description: 'Invalid service category.' });
                return;
        }

        const docRef = doc(firestore, collectionPath, service.id);
        deleteDoc(docRef)
            .then(() => {
                toast({ title: 'Service Deleted', description: 'The service has been successfully removed.' });
            })
            .catch(error => {
                const permissionError = new FirestorePermissionError({
                    path: docRef.path,
                    operation: 'delete',
                });
                errorEmitter.emit('permission-error', permissionError);
                toast({ variant: 'destructive', title: 'Delete Failed', description: 'You may not have the required permissions.' });
            });
        
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

export default function ServiceManagement({ 
    services,
    onAdd,
    onEdit 
}: { 
    services: Service[],
    onAdd: () => void,
    onEdit: (service: Service) => void,
}) {
    const carServices = services.filter(s => s.category === 'cars');
    const hotelServices = services.filter(s => s.category === 'hotels');
    const transportServices = services.filter(s => s.category === 'transport');
    const exploreServices = services.filter(s => s.category === 'explore');

    const renderTable = (servicesForCategory: Service[]) => (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Best Offer</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {servicesForCategory && servicesForCategory.length > 0 ? (
                    servicesForCategory.map((service) => (
                        <TableRow key={service.id}>
                            <TableCell className="font-medium">{service.name}</TableCell>
                            <TableCell>${service.price} / {service.priceUnit}</TableCell>
                            <TableCell>
                                <ServiceStatusToggle service={service} />
                            </TableCell>
                            <TableCell>
                                {service.isBestOffer ? <Badge>Yes</Badge> : <Badge variant="secondary">No</Badge>}
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
                                        <DropdownMenuItem onClick={() => onEdit(service)}>
                                            Edit
                                        </DropdownMenuItem>
                                        <DeleteServiceMenuItem service={service} />
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
    );

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Services Management</CardTitle>
                        <CardDescription>Add, edit, or remove services from Firestore.</CardDescription>
                    </div>
                    <Button onClick={onAdd}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Service
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="cars" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="cars"><Car className="mr-2 h-4 w-4" />Cars</TabsTrigger>
                        <TabsTrigger value="hotels"><BedDouble className="mr-2 h-4 w-4" />Hotels</TabsTrigger>
                        <TabsTrigger value="transport"><Briefcase className="mr-2 h-4 w-4" />Transport</TabsTrigger>
                        <TabsTrigger value="explore"><Compass className="mr-2 h-4 w-4" />Explore</TabsTrigger>
                    </TabsList>
                    <TabsContent value="cars" className="mt-4">
                        {renderTable(carServices)}
                    </TabsContent>
                    <TabsContent value="hotels" className="mt-4">
                        {renderTable(hotelServices)}
                    </TabsContent>
                    <TabsContent value="transport" className="mt-4">
                        {renderTable(transportServices)}
                    </TabsContent>
                    <TabsContent value="explore" className="mt-4">
                        {renderTable(exploreServices)}
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
