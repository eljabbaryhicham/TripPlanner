'use client';

import { useTransition, useOptimistic } from 'react';
import { toggleBestOffer } from '@/lib/actions';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import type { ImagePlaceholder } from '@/lib/placeholder-images';

function BestOfferToggle({ service }: { service: ImagePlaceholder }) {
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();

    // The current server state
    const isBestOffer = service.isBestOffer ?? false;
    
    // The optimistic state
    const [optimisticBestOffer, setOptimisticBestOffer] = useOptimistic(
        isBestOffer,
        (state, newState: boolean) => newState
    );

    const action = async (formData: FormData) => {
        startTransition(() => {
             setOptimisticBestOffer(formData.get('isBestOffer') === 'true');
        });

        const result = await toggleBestOffer({ error: null, success: false }, formData);

        if (result?.error) {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        }
    };
    
    return (
        <form action={action}>
            <input type="hidden" name="serviceId" value={service.id} />
            <input type="hidden" name="isBestOffer" value={String(!optimisticBestOffer)} />
            <Switch
                id={`best-offer-${service.id}`}
                checked={optimisticBestOffer}
                onCheckedChange={() => {
                    const formData = new FormData();
                    formData.set('serviceId', service.id);
                    formData.set('isBestOffer', String(!optimisticBestOffer));
                    action(formData);
                }}
                disabled={isPending}
            />
        </form>
    );
}


export default function ServiceManagement({ services }: { services: ImagePlaceholder[] }) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Service Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Best Offer</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {services.map((service) => (
                    <TableRow key={service.id}>
                        <TableCell className="font-medium">{(service as any).name || service.description}</TableCell>
                        <TableCell className="capitalize">{(service as any).category || 'N/A'}</TableCell>
                        <TableCell className="text-right">
                           <BestOfferToggle service={service} />
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}