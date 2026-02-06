'use client';

import * as React from 'react';
import { useActionState } from 'react';
import type { Service } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, MoreHorizontal, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { deleteService } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { ServiceEditor } from './service-editor';

function DeleteServiceForm({ serviceId }: { serviceId: string }) {
    const { toast } = useToast();
    const [state, formAction] = useActionState(deleteService, { error: null, success: false });

    React.useEffect(() => {
        if (state.success) {
            toast({ title: 'Service Deleted', description: 'The service has been successfully removed.' });
        }
        if (state.error) {
            toast({ variant: 'destructive', title: 'Error', description: state.error });
        }
    }, [state, toast]);

    return (
        <form action={formAction}>
            <input type="hidden" name="id" value={serviceId} />
            <button type="submit" className="w-full text-left">
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                </DropdownMenuItem>
            </button>
        </form>
    );
}

export default function ServiceManagement({ services }: { services: Service[] }) {
    const [editorOpen, setEditorOpen] = React.useState(false);
    const [serviceToEdit, setServiceToEdit] = React.useState<Service | null>(null);

    const handleEdit = (service: Service) => {
        setServiceToEdit(service);
        setEditorOpen(true);
    };

    const handleAdd = () => {
        setServiceToEdit(null);
        setEditorOpen(true);
    };

    const handleCloseEditor = () => {
        setEditorOpen(false);
        setServiceToEdit(null);
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Services Management</CardTitle>
                            <CardDescription>Add, edit, or remove services.</CardDescription>
                        </div>
                        <Button onClick={handleAdd}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add Service
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead>Best Offer</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {services.map((service) => (
                                <TableRow key={service.id}>
                                    <TableCell className="font-medium">{service.name}</TableCell>
                                    <TableCell className="capitalize">{service.category}</TableCell>
                                    <TableCell>${service.price} / {service.priceUnit}</TableCell>
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
                                                <DropdownMenuItem onClick={() => handleEdit(service)}>
                                                    Edit
                                                </DropdownMenuItem>
                                                <DeleteServiceForm serviceId={service.id} />
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            <ServiceEditor
                isOpen={editorOpen}
                onClose={handleCloseEditor}
                service={serviceToEdit}
            />
        </>
    );
}
