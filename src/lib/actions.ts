
'use server';

import { z } from 'zod';
import fs from 'fs/promises';
import path from 'path';
import { revalidatePath } from 'next/cache';
import { Resend } from 'resend';
import { getAdminAuth, getAdminFirestore } from '@/firebase/admin';

const settingsFilePath = path.join(process.cwd(), 'src', 'lib', 'app-config.json');
const emailTemplateFilePath = path.join(process.cwd(), 'src', 'lib', 'email-template.json');
const clientEmailTemplateFilePath = path.join(process.cwd(), 'src', 'lib', 'client-email-template.json');

// --- Helper to get settings ---
async function getSettings() {
    try {
        const configRaw = await fs.readFile(settingsFilePath, 'utf-8');
        return JSON.parse(configRaw);
    } catch {
        return {};
    }
}

// --- Reservation Action ---
const reservationSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  phone: z.string().optional(),
  message: z.string().optional(),
  serviceName: z.string(),
  serviceId: z.string(),
  totalPrice: z.number().nullable(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  origin: z.string().optional(),
  destination: z.string().optional(),
});

type ReservationFormValues = z.infer<typeof reservationSchema>;

export async function submitReservation(data: ReservationFormValues): Promise<{ success: boolean; error?: string | null; warning?: string | null; }> {
  const parsed = reservationSchema.safeParse(data);

  if (!parsed.success) {
    return { success: false, error: 'Invalid data.', warning: null };
  }
  
  const appSettings = await getSettings();
  const recipientEmail = appSettings.bookingEmailTo || process.env.BOOKING_EMAIL_TO;
  const fromEmail = appSettings.resendEmailFrom || 'TriPlanner <onboarding@resend.dev>';

  if (!process.env.RESEND_API_KEY || !recipientEmail) {
    console.error('Resend API Key or recipient email is not configured.');
    return { success: false, error: 'Server is not configured to send emails.', warning: null };
  }

  const { name, email, phone, message, serviceName, startDate, endDate, origin, destination, totalPrice } = parsed.data;

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    // --- Prepare email content ---
    const detailsHtml = [
        { label: 'Service', value: serviceName },
        { label: 'Name', value: name },
        { label: 'Email', value: email },
        { label: 'Phone', value: phone },
        { label: 'Pickup', value: startDate && !endDate ? startDate : null },
        { label: 'Dates', value: (startDate && endDate) ? `${startDate} - ${endDate}` : null },
        { label: 'Origin', value: origin },
        { label: 'Destination', value: destination },
        { label: 'Estimated Price', value: totalPrice ? `$${totalPrice.toFixed(2)}` : null },
        { label: 'Message', value: message },
    ]
    .filter(item => item.value) // Filter out items with null/undefined/empty string values
    .map(item => `<li><strong>${item.label}:</strong> <span>${item.value}</span></li>`)
    .join('');


    // --- Prepare and send email to Admin ---
    const adminTemplateFile = await fs.readFile(emailTemplateFilePath, 'utf-8');
    const { template: adminTemplate } = JSON.parse(adminTemplateFile);
    
    let adminHtmlBody = adminTemplate.replace('{{detailsList}}', detailsHtml);
    adminHtmlBody = adminHtmlBody.replace(new RegExp('{{serviceName}}', 'g'), serviceName);
    adminHtmlBody = adminHtmlBody.replace(new RegExp('{{email}}', 'g'), email);

    const { error: adminError } = await resend.emails.send({
      from: fromEmail,
      to: [recipientEmail],
      subject: `New Booking Inquiry for ${serviceName}`,
      html: adminHtmlBody,
      reply_to: email,
    });

    if (adminError) {
      console.error('Resend error (to admin):', adminError);
      return { success: false, error: 'Failed to send admin notification email.', warning: null };
    }

    // --- Prepare and send confirmation email to Client ---
    const clientTemplateFile = await fs.readFile(clientEmailTemplateFilePath, 'utf-8');
    const { template: clientTemplate } = JSON.parse(clientTemplateFile);
    
    let clientHtmlBody = clientTemplate.replace('{{detailsList}}', detailsHtml);
    clientHtmlBody = clientHtmlBody.replace(new RegExp('{{name}}', 'g'), name);
    clientHtmlBody = clientHtmlBody.replace(new RegExp('{{serviceName}}', 'g'), serviceName);
    
    const { error: clientError } = await resend.emails.send({
        from: fromEmail,
        to: [email],
        subject: `Your Booking Inquiry for ${serviceName}`,
        html: clientHtmlBody,
    });
    
    if (clientError) {
        console.error('Resend error (to client):', clientError);
        return { 
            success: true, 
            error: null,
            warning: "Your inquiry was sent to our team, but the confirmation email could not be sent to you. Please double-check the email address you provided."
        };
    }

    return { success: true, error: null, warning: null };
  } catch (error) {
    console.error('Failed to send email(s):', error);
    return { success: false, error: 'An unexpected error occurred while sending the email(s).', warning: null };
  }
}

// --- Contact Form Action ---
const contactFormSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  mobile: z.string().optional(),
  message: z.string().min(10, { message: 'Message must be at least 10 characters.' }),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

export async function submitContactForm(data: ContactFormValues): Promise<{ success: boolean; error?: string | null; }> {
  const parsed = contactFormSchema.safeParse(data);

  if (!parsed.success) {
    return { success: false, error: 'Invalid data.' };
  }
  
  const appSettings = await getSettings();
  const recipientEmail = appSettings.bookingEmailTo || process.env.BOOKING_EMAIL_TO;
  const fromEmail = appSettings.resendEmailFrom || 'TriPlanner Contact <onboarding@resend.dev>';
  
  if (!process.env.RESEND_API_KEY || !recipientEmail) {
    console.error('Resend API Key or recipient email is not configured.');
    return { success: false, error: 'Server is not configured to send emails.' };
  }
  
  const { name, email, mobile, message } = parsed.data;

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: fromEmail,
      to: [recipientEmail],
      subject: `New Message from ${name}`,
      reply_to: email,
      html: `<p>You have a new contact form submission:</p>
             <ul>
               <li><strong>Name:</strong> ${name}</li>
               <li><strong>Email:</strong> ${email}</li>
               <li><strong>Mobile:</strong> ${mobile || 'N/A'}</li>
             </ul>
             <p><strong>Message:</strong></p>
             <p>${message}</p>`,
    });

    if (error) {
      console.error('Resend error:', error);
      return { success: false, error: 'Failed to send email.' };
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { success: false, error: 'An unexpected error occurred.' };
  }
}


// --- Settings Action ---

const generalSettingsSchema = z.object({
    whatsappNumber: z.string().min(1, { message: 'WhatsApp number cannot be empty.' }),
    bookingEmailTo: z.string().email({ message: 'A valid recipient email is required.' }),
    resendEmailFrom: z.string().min(1, { message: 'A "from" email is required for Resend.' }),
});

export async function updateGeneralSettings(prevState: any, formData: FormData) {
    const parsed = generalSettingsSchema.safeParse(Object.fromEntries(formData));

    if (!parsed.success) {
        return { error: parsed.error.errors[0].message, success: false };
    }

    const { whatsappNumber, bookingEmailTo, resendEmailFrom } = parsed.data;
    
    try {
        const currentConfig = await getSettings();
        const newSettings = JSON.stringify({ ...currentConfig, whatsappNumber, bookingEmailTo, resendEmailFrom }, null, 2);
        await fs.writeFile(settingsFilePath, newSettings, 'utf-8');
        
        revalidatePath('/admin');
        
        return { error: null, success: true };
    } catch (error) {
        console.error('Failed to update settings:', error);
        return { error: 'Could not save settings.', success: false };
    }
}

// --- Category Settings Action ---
export async function updateCategorySettings(prevState: any, formData: FormData) {
    const data = Object.fromEntries(formData);
    const categoryStates = {
        cars: data.cars === 'on',
        hotels: data.hotels === 'on',
        transport: data.transport === 'on',
        explore: data.explore === 'on',
    };
    
    try {
        const currentConfig = await getSettings();
        currentConfig.categories = categoryStates;
        const newSettings = JSON.stringify(currentConfig, null, 2);
        await fs.writeFile(settingsFilePath, newSettings, 'utf-8');
        
        revalidatePath('/admin');
        revalidatePath('/services/cars');
        revalidatePath('/services/hotels');
        revalidatePath('/services/transport');
        revalidatePath('/services/explore');
        revalidatePath('/'); // For header and homepage
        
        return { error: null, success: true };
    } catch (error) {
        console.error('Failed to update category settings:', error);
        return { error: 'Could not save category settings.', success: false };
    }
}


// --- Email Template Action ---
const emailTemplateSchema = z.object({
    template: z.string().min(1, { message: 'Email template cannot be empty.' }),
});

export async function updateEmailTemplate(prevState: any, formData: FormData) {
    const parsed = emailTemplateSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
        return { error: parsed.error.errors[0].message, success: false };
    }
    
    try {
        const newTemplate = JSON.stringify({ template: parsed.data.template }, null, 2);
        await fs.writeFile(emailTemplateFilePath, newTemplate, 'utf-8');
        revalidatePath('/admin');
        return { error: null, success: true };
    } catch (error) {
        console.error('Failed to update email template:', error);
        return { error: 'Could not save email template.', success: false };
    }
}

// --- Client Email Template Action ---
export async function updateClientEmailTemplate(prevState: any, formData: FormData) {
    const parsed = emailTemplateSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
        return { error: parsed.error.errors[0].message, success: false };
    }
    
    try {
        const newTemplate = JSON.stringify({ template: parsed.data.template }, null, 2);
        await fs.writeFile(clientEmailTemplateFilePath, newTemplate, 'utf-8');
        revalidatePath('/admin');
        return { error: null, success: true };
    } catch (error) {
        console.error('Failed to update client email template:', error);
        return { error: 'Could not save client email template.', success: false };
    }
}


// --- Admin Management Actions ---
const addAdminSchema = z.object({
    login: z.string().email(),
    password: z.string().min(6),
});
export async function addAdmin(prevState: any, formData: FormData) {
    const parsed = addAdminSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
        return { error: parsed.error.errors[0].message, success: false };
    }
    const { login, password } = parsed.data;

    try {
        const adminAuth = getAdminAuth();
        const adminFirestore = getAdminFirestore();
        const userRecord = await adminAuth.createUser({ email: login, password });
        await adminFirestore.collection('roles_admin').doc(userRecord.uid).set({
            email: login,
            role: 'admin',
            createdAt: new Date(),
            id: userRecord.uid,
        });
        revalidatePath('/admin');
        return { success: true, error: null };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

const removeAdminSchema = z.object({ id: z.string() });
export async function removeAdmin(prevState: any, formData: FormData) {
     const parsed = removeAdminSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
        return { error: "Invalid ID", success: false };
    }
    const { id } = parsed.data;

    try {
        const adminAuth = getAdminAuth();
        const adminFirestore = getAdminFirestore();
        await adminAuth.deleteUser(id);
        await adminFirestore.collection('roles_admin').doc(id).delete();
        revalidatePath('/admin');
        return { success: true, error: null };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

const setSuperAdminSchema = z.object({ id: z.string() });
export async function setSuperAdmin(prevState: any, formData: FormData) {
     const parsed = setSuperAdminSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
        return { error: "Invalid ID", success: false };
    }
    const { id } = parsed.data;

    try {
        const adminFirestore = getAdminFirestore();
        await adminFirestore.collection('roles_admin').doc(id).update({ role: 'superadmin' });
        revalidatePath('/admin');
        return { success: true, error: null };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
