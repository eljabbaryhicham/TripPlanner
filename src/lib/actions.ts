'use server';

import { z } from 'zod';
import fs from 'fs/promises';
import path from 'path';
import { revalidatePath } from 'next/cache';
import { Resend } from 'resend';
import { manageAdmin } from '@/ai/flows/manage-admin-flow';

// --- File paths for settings that can be written to ---
// Reading configuration is now done via API for reliability in serverless environments.
// However, writing settings still targets the file system. This is a known limitation
// on platforms like Vercel and may need a database in the future for persistent settings.
const settingsFilePath = path.join(process.cwd(), 'src', 'lib', 'app-config.json');
const emailTemplateFilePath = path.join(process.cwd(), 'src', 'lib', 'email-template.json');
const clientEmailTemplateFilePath = path.join(process.cwd(), 'src', 'lib', 'client-email-template.json');


// --- Helper Functions ---

// Gets the base URL for server-side fetching.
const getBaseUrl = () => {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  // Fallback for local development, matching package.json script
  return 'http://localhost:9002';
};

// Fills a template string with data.
function fillTemplate(template: string, data: Record<string, any>): string {
  let result = template;
  for (const key in data) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), data[key] || '');
  }
  return result;
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
    return { success: false, error: 'Invalid form data provided.' };
  }
  
  let appSettings;
  let adminTemplate;
  let clientTemplate;

  try {
    const baseUrl = getBaseUrl();
    const [settingsRes, adminTemplateRes, clientTemplateRes] = await Promise.all([
      fetch(`${baseUrl}/api/settings`, { cache: 'no-store' }),
      fetch(`${baseUrl}/api/email-template`, { cache: 'no-store' }),
      fetch(`${baseUrl}/api/client-email-template`, { cache: 'no-store' })
    ]);

    if (!settingsRes.ok) throw new Error(`Failed to fetch settings: ${settingsRes.statusText}`);
    appSettings = await settingsRes.json();

    if (!adminTemplateRes.ok) throw new Error(`Failed to fetch admin template: ${adminTemplateRes.statusText}`);
    const adminTemplateData = await adminTemplateRes.json();
    adminTemplate = adminTemplateData.template;

    if (!clientTemplateRes.ok) throw new Error(`Failed to fetch client template: ${clientTemplateRes.statusText}`);
    const clientTemplateData = await clientTemplateRes.json();
    clientTemplate = clientTemplateData.template;

  } catch (e) {
    const error = e instanceof Error ? e.message : 'Unknown error';
    console.error('Failed to fetch configuration:', error);
    return { success: false, error: `Server Error: Could not load app configuration. (${error})` };
  }
  
  try {
    const recipientEmail = appSettings?.bookingEmailTo;
    const fromEmail = appSettings?.resendEmailFrom;
    
    if (!process.env.RESEND_API_KEY) {
        return { success: false, error: 'Server configuration error: Resend API Key is missing.' };
    }
    if (!recipientEmail || !fromEmail) {
        return { success: false, error: 'Server configuration error: Recipient or "From" email address is missing in app-config.json.' };
    }
    
    const { name, email, phone, message, serviceName, startDate, endDate, origin, destination, totalPrice } = parsed.data;

    const resend = new Resend(process.env.RESEND_API_KEY);
    
    const detailsHtml = [
        { label: 'Service', value: serviceName },
        { label: 'Name', value: name },
        { label: 'Email', value: email },
        { label: 'Phone', value: phone },
        { label: 'Pickup', value: startDate && !endDate ? startDate : undefined },
        { label: 'Dates', value: (startDate && endDate) ? `${startDate} - ${endDate}` : undefined },
        { label: 'Origin', value: origin },
        { label: 'Destination', value: destination },
        { label: 'Estimated Price', value: totalPrice ? `$${totalPrice.toFixed(2)}` : undefined },
        { label: 'Message', value: message },
    ]
    .filter(item => item.value)
    .map(item => `<li><strong>${item.label}:</strong> <span>${item.value}</span></li>`)
    .join('');

    const templateData = {
        detailsList: detailsHtml,
        serviceName: serviceName,
        email: email,
        name: name
    };
    
    const adminHtmlBody = fillTemplate(adminTemplate, templateData);

    const { error: adminError } = await resend.emails.send({
      from: fromEmail,
      to: [recipientEmail],
      subject: `New Booking Inquiry for ${serviceName}`,
      html: adminHtmlBody,
      reply_to: email,
    });

    if (adminError) {
      console.error('Resend error (to admin):', adminError);
      return { success: false, error: `Failed to send admin notification: ${adminError.message}` };
    }

    const clientHtmlBody = fillTemplate(clientTemplate, templateData);
    
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
            warning: "Your inquiry was sent, but the confirmation email could not be delivered to you. Please check your email address."
        };
    }

    return { success: true };

  } catch (error) {
    console.error('A critical error occurred during email submission:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown exception occurred.';
    return { success: false, error: `An unexpected server error occurred: ${errorMessage}` };
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
  
  let appSettings;
  try {
    const baseUrl = getBaseUrl();
    const settingsRes = await fetch(`${baseUrl}/api/settings`, { cache: 'no-store' });
    if (!settingsRes.ok) throw new Error(`Failed to fetch settings: ${settingsRes.statusText}`);
    appSettings = await settingsRes.json();
  } catch (e) {
    const error = e instanceof Error ? e.message : 'Unknown error';
    console.error('Failed to fetch settings for contact form:', error);
    return { success: false, error: 'Server is not configured to send emails.' };
  }

  const recipientEmail = appSettings.bookingEmailTo;
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
        const configRaw = await fs.readFile(settingsFilePath, 'utf-8');
        const currentConfig = JSON.parse(configRaw);
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
        const configRaw = await fs.readFile(settingsFilePath, 'utf-8');
        const currentConfig = JSON.parse(configRaw);
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

    const result = await manageAdmin({
        action: 'add',
        email: login,
        password: password,
    });

    if (result.success) {
        revalidatePath('/admin');
        return { success: true, error: null };
    } else {
        console.error("Error adding admin:", result.message);
        return { success: false, error: result.message };
    }
}

const removeAdminSchema = z.object({ id: z.string() });
export async function removeAdmin(prevState: any, formData: FormData) {
     const parsed = removeAdminSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
        return { error: "Invalid ID", success: false };
    }
    const { id } = parsed.data;

    const result = await manageAdmin({
        action: 'remove',
        uid: id,
    });

    if (result.success) {
        revalidatePath('/admin');
        return { success: true, error: null };
    } else {
        return { success: false, error: result.message };
    }
}

const setSuperAdminSchema = z.object({ id: z.string() });
export async function setSuperAdmin(prevState: any, formData: FormData) {
    const parsed = setSuperAdminSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
        return { error: "Invalid ID", success: false };
    }
    const { id } = parsed.data;

    const result = await manageAdmin({
        action: 'promote',
        uid: id,
    });

    if (result.success) {
        revalidatePath('/admin');
        return { success: true, error: null };
    } else {
        return { success: false, error: result.message };
    }
}
