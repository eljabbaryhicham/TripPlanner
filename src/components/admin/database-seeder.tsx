'use client';

import * as React from 'react';
import { seedDatabase } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Database } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function DatabaseSeeder() {
    const { toast } = useToast();
    const [isSeeding, setIsSeeding] = React.useState(false);

    const handleSeed = async () => {
        setIsSeeding(true);
        const result = await seedDatabase();
        if (result.success) {
            toast({ title: 'Database Seeded', description: 'Sample services have been added to Firestore.' });
        } else {
            toast({ variant: 'destructive', title: 'Seeding Failed', description: result.error });
        }
        setIsSeeding(false);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Database Management</CardTitle>
                <CardDescription>Populate your Firestore database with the initial set of sample services.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                    This will overwrite any existing services with the same IDs. This is useful for resetting the data to its original state or for initial setup.
                </p>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button disabled={isSeeding}>
                            {isSeeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Database className="mr-2 h-4 w-4" />}
                            Seed Database
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action will populate your Firestore collections with sample data from the project. Any existing sample services will be overwritten.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleSeed}>Continue</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardContent>
        </Card>
    );
}
