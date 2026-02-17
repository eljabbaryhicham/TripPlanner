'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Save, PlusCircle, Edit, Trash2, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSettings } from '@/components/settings-provider';
import type { Category } from '@/lib/types';
import { slugify } from '@/lib/utils';
import { CategoryEditor } from './category-editor';
import { Icon } from '../icon';

export default function CategoryManagement() {
    const router = useRouter();
    const { toast } = useToast();
    const firestore = useFirestore();
    const settings = useSettings();

    const [categories, setCategories] = React.useState<Category[]>([]);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [isEditorOpen, setIsEditorOpen] = React.useState(false);
    const [categoryToEdit, setCategoryToEdit] = React.useState<Category | null>(null);
    
    React.useEffect(() => {
        setCategories(settings.categories || []);
    }, [settings.categories]);

    const handleAddNew = () => {
        setCategoryToEdit(null);
        setIsEditorOpen(true);
    };
    
    const handleEdit = (category: Category) => {
        setCategoryToEdit(category);
        setIsEditorOpen(true);
    };

    const handleDuplicate = (category: Category) => {
        const newCategory: Category = {
            ...category,
            id: `${slugify(category.name)}-${Math.random().toString(36).substr(2, 5)}`,
            name: `${category.name} (Copy)`,
        };
        setCategories(prev => [...prev, newCategory]);
        toast({ title: 'Category Duplicated', description: 'Save your changes to finalize.' });
    };

    const handleDelete = (id: string) => {
        setCategories(prev => prev.filter(c => c.id !== id));
        toast({ title: 'Category Marked for Deletion', description: 'Save your changes to finalize.' });
    };

    const handleSaveCategory = (categoryData: Category) => {
        if (categoryToEdit) { // Editing
            setCategories(prev => prev.map(c => c.id === categoryData.id ? categoryData : c));
        } else { // Adding
            setCategories(prev => [...prev, categoryData]);
        }
        setIsEditorOpen(false);
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSubmitting(true);

        if (!firestore) {
            toast({ variant: 'destructive', title: 'Error', description: 'Database not available.' });
            setIsSubmitting(false);
            return;
        }

        const settingsRef = doc(firestore, 'app_settings', 'general');
        setDocumentNonBlocking(settingsRef, { categories: categories }, { merge: true });

        toast({ title: 'Category settings update initiated.', description: 'Your changes will be live shortly.' });
        setIsSubmitting(false);
        router.refresh();
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                         <div>
                            <CardTitle>Category Management</CardTitle>
                            <CardDescription>
                                Add, edit, remove, and rearrange service categories.
                            </CardDescription>
                         </div>
                         <Button onClick={handleAddNew}><PlusCircle className="mr-2 h-4 w-4" /> Add New</Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4 rounded-md border p-4">
                            {categories.length === 0 ? (
                                <p className="text-center text-muted-foreground">No categories defined. Add one to get started.</p>
                            ) : (
                                categories.map(category => (
                                    <div key={category.id} className="flex items-center justify-between rounded-md border bg-background p-3">
                                        <div className="flex items-center gap-4">
                                            <Icon name={category.icon} className="h-6 w-6 text-muted-foreground" />
                                            <div className="font-medium">{category.name}</div>
                                            <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">{category.id}</div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button type="button" size="icon" variant="ghost" onClick={() => handleEdit(category)}><Edit className="h-4 w-4" /></Button>
                                            <Button type="button" size="icon" variant="ghost" onClick={() => handleDuplicate(category)}><Copy className="h-4 w-4" /></Button>
                                            <Button type="button" size="icon" variant="ghost" onClick={() => handleDelete(category.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="flex justify-end pt-4">
                             <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Save All Changes
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
            <CategoryEditor 
                isOpen={isEditorOpen}
                onClose={() => setIsEditorOpen(false)}
                onSave={handleSaveCategory}
                category={categoryToEdit}
            />
        </>
    );
}