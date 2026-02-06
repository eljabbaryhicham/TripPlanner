
'use server';

import { z } from 'zod';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import fs from 'fs/promises';
import path from 'path';
import { revalidatePath } from 'next/cache';
import type { Service } from './types';

const adminsFilePath = path.join(process.cwd(), 'src', 'lib', 'admins.json');
const settingsFilePath = path.join(process.cwd(), 'src', 'lib', 'app-config.json');
const servicesFilePath = path.join(process.cwd(), 'src', 'lib', 'placeholder-images.json');


// --- Auth Helpers & Actions ---

async function readAdmins() {
    try {
        const data = await fs.readFile(adminsFilePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error("Failed to read admins file:", error);
        return { admins: [] };
    }
}

async function writeAdmins(data: any) {
    await fs.writeFile(adminsFilePath, JSON.stringify(data, null, 2), 'utf-8');
}

export async function getCurrentUser() {
  const cookieStore = cookies();
  const authCookie = cookieStore.get('auth');
  if (authCookie) {
    try {
      return JSON.parse(authCookie.value);
    } catch (e) {
      return null;
    }
  }
  return null;
}

const loginSchema = z.object({
  login: z.string(),
  password: z.string(),
});

export async function login(prevState: { error: string | null }, formData: FormData) {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { error: 'Invalid login or password format.' };
  }

  const { login, password } = parsed.data;

  const { admins } = await readAdmins();
  const foundAdmin = admins.find((admin: any) => admin.login === login && admin.password === password);


  if (!foundAdmin) {
    return { error: 'Invalid login or password.' };
  }

  const userPayload = { id: foundAdmin.id, login: foundAdmin.login, role: foundAdmin.role };

  cookies().set('auth', JSON.stringify(userPayload), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24, // 1 day
    path: '/',
  });

  redirect('/admin');
}

export async function logout() {
  cookies().delete('auth');
  redirect('/login');
}


// --- Admin Management Actions ---

export async function getAdmins() {
    const { admins } = await readAdmins();
    return admins.map(({ password, ...rest }: any) => rest);
}

const addAdminSchema = z.object({
    login: z.string().min(3, { message: 'Login must be at least 3 characters.'}),
    password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

export async function addAdmin(prevState: { error: string | null, success: boolean }, formData: FormData) {
    const currentUser = await getCurrentUser();
    if (currentUser?.role !== 'superadmin') {
        return { error: 'Permission denied. Only super admins can add new admins.', success: false };
    }

    const parsed = addAdminSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
        return { error: parsed.error.errors[0].message, success: false };
    }

    const { login, password } = parsed.data;
    const adminData = await readAdmins();

    if (adminData.admins.some((admin: any) => admin.login === login)) {
        return { error: 'An admin with this login already exists.', success: false };
    }

    adminData.admins.push({
        id: `admin-${Date.now()}`,
        login,
        password,
        role: 'admin',
    });

    await writeAdmins(adminData);
    revalidatePath('/admin');
    return { error: null, success: true };
}

export async function removeAdmin(prevState: { error: string | null, success: boolean }, formData: FormData) {
    const currentUser = await getCurrentUser();
    if (currentUser?.role !== 'superadmin') {
        return { error: 'Permission denied.', success: false };
    }

    const idToRemove = formData.get('id') as string;
    if (currentUser.id === idToRemove) {
        return { error: "You cannot remove yourself.", success: false };
    }

    const adminData = await readAdmins();
    adminData.admins = adminData.admins.filter((admin: any) => admin.id !== idToRemove);
    
    await writeAdmins(adminData);
    revalidatePath('/admin');
    return { error: null, success: true };
}

export async function setSuperAdmin(prevState: { error: string | null, success: boolean }, formData: FormData) {
    const currentUser = await getCurrentUser();
    if (currentUser?.role !== 'superadmin') {
        return { error: 'Permission denied.', success: false };
    }

    const idToPromote = formData.get('id') as string;
    const adminData = await readAdmins();

    // Demote current superadmin
    const currentSuperAdmin = adminData.admins.find((admin: any) => admin.role === 'superadmin');
    if (currentSuperAdmin) {
        currentSuperAdmin.role = 'admin';
    }

    // Promote new superadmin
    const newSuperAdmin = adminData.admins.find((admin: any) => admin.id === idToPromote);
    if (newSuperAdmin) {
        newSuperAdmin.role = 'superadmin';
    } else {
        return { error: "Admin to promote not found.", success: false };
    }
    
    await writeAdmins(adminData);
    revalidatePath('/admin');
    return { error: null, success: true };
}


// --- Reservation Action ---
const reservationSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  message: z.string().optional(),
  serviceName: z.string(),
  serviceId: z.string(),
  price: z.number(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

type ReservationFormValues = z.infer<typeof reservationSchema>;

export async function submitReservation(data: ReservationFormValues) {
  const parsed = reservationSchema.safeParse(data);

  if (!parsed.success) {
    return { success: false, error: 'Invalid data.' };
  }

  console.log('--- New Reservation Inquiry ---');
  console.log('Service:', parsed.data.serviceName);
  console.log('Name:', parsed.data.name);
  console.log('Email:', parsed.data.email);
  console.log('Phone:', parsed.data.phone || 'N/A');
  console.log('Start Date:', parsed.data.startDate || 'N/A');
  console.log('End Date:', parsed.data.endDate || 'N/A');
  console.log('Message:', parsed.data.message || 'N/A');
  console.log('-----------------------------');

  await new Promise((resolve) => setTimeout(resolve, 1000));

  return { success: true };
}

// --- Settings Action ---

const settingsSchema = z.object({
    whatsappNumber: z.string().min(1, { message: 'WhatsApp number cannot be empty.' }),
});

export async function updateWhatsappNumber(prevState: { error: string | null, success: boolean }, formData: FormData) {
    const parsed = settingsSchema.safeParse(Object.fromEntries(formData));

    if (!parsed.success) {
        return { error: parsed.error.errors[0].message, success: false };
    }

    const { whatsappNumber } = parsed.data;
    
    try {
        const newSettings = JSON.stringify({ whatsappNumber }, null, 2);
        await fs.writeFile(settingsFilePath, newSettings, 'utf-8');
        
        revalidatePath('/admin');
        revalidatePath('/api/settings');
        
        return { error: null, success: true };
    } catch (error) {
        console.error('Failed to update settings:', error);
        return { error: 'Could not save settings.', success: false };
    }
}

// --- Service Management Actions ---

async function readServices(): Promise<{ services: Service[] }> {
    try {
        const data = await fs.readFile(servicesFilePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error("Failed to read services file:", error);
        return { services: [] };
    }
}

async function writeServices(data: { services: Service[] }) {
    await fs.writeFile(servicesFilePath, JSON.stringify(data, null, 2), 'utf-8');
    revalidatePath('/admin');
    revalidatePath('/');
    revalidatePath('/services/cars');
    revalidatePath('/services/hotels');
    revalidatePath('/services/transport');
}

const serviceSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, 'Name is required'),
    description: z.string().min(1, 'Description is required'),
    imageUrl: z.string().url('Must be a valid URL'),
    imageHint: z.string().min(1, 'Image hint is required'),
    category: z.enum(['cars', 'hotels', 'transport']),
    price: z.coerce.number().min(0, 'Price must be non-negative'),
    priceUnit: z.enum(['day', 'night', 'trip']),
    location: z.string().min(1, 'Location is required'),
    isBestOffer: z.preprocess((val) => val === 'on', z.boolean()).default(false),
    details: z.string().transform((str, ctx) => {
        try {
            return JSON.parse(str);
        } catch (e) {
            ctx.addIssue({ code: 'custom', message: 'Details must be valid JSON' });
            return z.NEVER;
        }
    }),
    additionalMedia: z.string().transform((str, ctx) => {
        try {
            if (!str) return [];
            return JSON.parse(str);
        } catch (e) {
            ctx.addIssue({ code: 'custom', message: 'Additional Media must be valid JSON array' });
            return z.NEVER;
        }
    })
});

export async function saveService(prevState: { error: string | null, success: boolean }, formData: FormData) {
    const data = Object.fromEntries(formData);
    const parsed = serviceSchema.safeParse(data);

    if (!parsed.success) {
        return { error: parsed.error.errors.map(e => e.message).join(', '), success: false };
    }

    const { id, ...serviceData } = parsed.data;
    const { services } = await readServices();
    
    if (id) { // Update existing service
        const index = services.findIndex(s => s.id === id);
        if (index === -1) {
            return { error: 'Service not found.', success: false };
        }
        services[index] = { ...services[index], ...serviceData };
    } else { // Add new service
        const newService: Service = {
            id: `${serviceData.category}-${Date.now()}`,
            ...serviceData
        };
        services.push(newService);
    }
    
    await writeServices({ services });
    return { error: null, success: true };
}


export async function deleteService(prevState: { error: string | null, success: boolean }, formData: FormData) {
    const id = formData.get('id') as string;
    if (!id) {
        return { error: 'Service ID is missing.', success: false };
    }
    
    const { services } = await readServices();
    const updatedServices = services.filter(s => s.id !== id);

    if (services.length === updatedServices.length) {
        return { error: 'Service not found.', success: false };
    }

    await writeServices({ services: updatedServices });
    return { error: null, success: true };
}
