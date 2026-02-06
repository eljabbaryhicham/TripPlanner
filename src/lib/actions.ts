
'use server';

import { z } from 'zod';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import fs from 'fs/promises';
import path from 'path';
import { revalidatePath } from 'next/cache';

const adminsFilePath = path.join(process.cwd(), 'src', 'lib', 'admins.json');
const settingsFilePath = path.join(process.cwd(), 'src', 'lib', 'app-config.json');

// --- Auth Helpers & Actions ---

async function readAdmins() {
    try {
        const data = await fs.readFile(adminsFilePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error("Failed to read admins file:", error);
        // If file doesn't exist or is invalid, return a default structure
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
  email: z.string(),
  password: z.string(),
});

export async function login(prevState: { error: string | null }, formData: FormData) {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { error: 'Invalid email or password format.' };
  }

  const { email, password } = parsed.data;
  const { admins } = await readAdmins();

  const foundAdmin = admins.find((admin: any) => admin.email === email && admin.password === password);

  if (!foundAdmin) {
    return { error: 'Invalid email or password.' };
  }

  const userPayload = { id: foundAdmin.id, email: foundAdmin.email, role: foundAdmin.role };

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
    // Return admins without their passwords for security
    return admins.map(({ password, ...rest }: any) => rest);
}

const addAdminSchema = z.object({
    email: z.string().email(),
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

    const { email, password } = parsed.data;
    const adminData = await readAdmins();

    if (adminData.admins.some((admin: any) => admin.email === email)) {
        return { error: 'An admin with this email already exists.', success: false };
    }

    adminData.admins.push({
        id: `admin-${Date.now()}`,
        email,
        password,
        role: 'admin',
    });

    await writeAdmins(adminData);
    revalidatePath('/admin');
    return { error: null, success: true };
}

export async function removeAdmin(formData: FormData) {
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

export async function setSuperAdmin(formData: FormData) {
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

  // Simulate network delay
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

export async function toggleBestOffer(prevState: { error: string | null, success: boolean }, formData: FormData) {
  const serviceId = formData.get('serviceId') as string;
  const isBestOffer = !!formData.get('isBestOffer');

  if (!serviceId) {
    return { error: 'Service ID is missing.', success: false };
  }

  try {
    const filePath = path.join(process.cwd(), 'src', 'lib', 'placeholder-images.json');
    const fileData = await fs.readFile(filePath, 'utf-8');
    const jsonData = JSON.parse(fileData);

    const serviceIndex = jsonData.placeholderImages.findIndex((s: any) => s.id === serviceId);

    if (serviceIndex === -1) {
      return { error: 'Service not found.', success: false };
    }
    
    if (isBestOffer) {
      jsonData.placeholderImages[serviceIndex].isBestOffer = true;
    } else {
      delete jsonData.placeholderImages[serviceIndex].isBestOffer;
    }
    
    const updatedData = JSON.stringify(jsonData, null, 2);
    await fs.writeFile(filePath, updatedData, 'utf-8');
    
    revalidatePath('/admin');
    revalidatePath('/');
    revalidatePath('/services/cars');
    revalidatePath('/services/hotels');
    revalidatePath('/services/transport');

    return { error: null, success: true };

  } catch (error) {
    console.error('Failed to update best offer status:', error);
    return { error: 'Could not update best offer status.', success: false };
  }
}
