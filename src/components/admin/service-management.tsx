'use client';

import * as React from 'react';
import type { Service } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '../ui/skeleton';
import { useSettings } from '../settings-provider';
import { Icon } from '../icon';
import ServiceCategoryTab from './service-category-tab';

export default function ServiceManagement({ 
    onAdd,
    onEdit 
}: { 
    onAdd: () => void,
    onEdit: (service: Service) => void,
}) {
    const { categories, isSettingsLoading } = useSettings();
    const enabledCategories = categories.filter(c => c.enabled);

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4">
                    <div>
                        <CardTitle>Services Management</CardTitle>
                        <CardDescription>Add, edit, or remove services from Firestore.</CardDescription>
                    </div>
                    <Button onClick={onAdd} className="w-full sm:w-auto">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Service
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {isSettingsLoading ? (
                     <div className="space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-40 w-full" />
                    </div>
                ) : (
                    <Tabs defaultValue={enabledCategories[0]?.id || ''} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
                             {enabledCategories.map(cat => (
                                <TabsTrigger key={cat.id} value={cat.id}>
                                    <Icon name={cat.icon} className="mr-2 h-4 w-4" />
                                    {cat.name}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                        {enabledCategories.map(cat => (
                             <TabsContent key={cat.id} value={cat.id} className="mt-4">
                                <ServiceCategoryTab category={cat} onEdit={onEdit} />
                            </TabsContent>
                        ))}
                    </Tabs>
                )}
            </CardContent>
        </Card>
    );
}
