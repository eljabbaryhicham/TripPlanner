'use client';

import { useActionState } from 'react';
import { useSearchParams } from 'next/navigation';
import { services } from '@/lib/data';
import { logout, updateWhatsappNumber, toggleBestOffer } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { LogOut, Save } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';

function UpdateSettingsForm({ whatsappNumber }: { whatsappNumber: string }) {
    const [state, formAction] = useActionState(updateWhatsappNumber, { error: null, success: false });
    const { toast } = useToast();

    React.useEffect(() => {
        if (state.success) {
            toast({
                title: "Settings Updated",
                description: "The WhatsApp number has been saved.",
            });
        }
        if (state.error) {
            toast({
                variant: 'destructive',
                title: "Update Failed",
                description: state.error,
            });
        }
    }, [state, toast]);

    return (
        <form action={formAction} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
                <Input
                    id="whatsappNumber"
                    name="whatsappNumber"
                    type="text"
                    placeholder="+1234567890"
                    required
                    defaultValue={whatsappNumber}
                />
            </div>
            {state.error && (
                <p className="text-sm text-destructive">{state.error}</p>
            )}
            <Button type="submit">
                <Save className="mr-2 h-4 w-4" />
                Save Settings
            </Button>
        </form>
    );
}

function BestOfferToggle({ serviceId, isBestOffer }: { serviceId: string; isBestOffer: boolean }) {
    const formRef = React.useRef<HTMLFormElement>(null);
    const { toast } = useToast();

    const dispatchToggleBestOffer = async (formData: FormData) => {
        const result = await toggleBestOffer({ error: null, success: false }, formData);
        if (result.success) {
            toast({
                title: "Best Offer Updated",
            });
        }
        if (result.error) {
            toast({
                variant: 'destructive',
                title: "Update Failed",
                description: result.error,
            });
        }
    };

    return (
        <form action={dispatchToggleBestOffer} ref={formRef}>
            <input type="hidden" name="serviceId" value={serviceId} />
            <Checkbox
                name="isBestOffer"
                defaultChecked={isBestOffer}
                onCheckedChange={() => {
                    setTimeout(() => formRef.current?.requestSubmit(), 50);
                }}
            />
        </form>
    );
}


export default function AdminPage() {
  const searchParams = useSearchParams();
  const whatsappNumber = searchParams.get('whatsappNumber') || '';
  
  return (
    <div className="min-h-screen bg-muted/40">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 py-4">
        <h1 className="text-2xl font-headline">Admin Dashboard</h1>
        <form action={logout} className="ml-auto">
          <Button variant="outline" size="sm">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </form>
      </header>
      <main className="p-4 sm:px-6 sm:py-0 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Services</CardTitle>
            <CardDescription>
              A list of all services available on TriPlanner.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Best Offer</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell className="font-medium">{service.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">{service.category}</Badge>
                    </TableCell>
                    <TableCell>
                        <BestOfferToggle serviceId={service.id} isBestOffer={!!service.isBestOffer} />
                    </TableCell>
                    <TableCell>{service.location}</TableCell>
                    <TableCell className="text-right">
                      ${service.price}/{service.priceUnit}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Application Settings</CardTitle>
                <CardDescription>
                    Update general settings for the application.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <UpdateSettingsForm whatsappNumber={whatsappNumber} />
            </CardContent>
        </Card>
      </main>
    </div>
  );
}
