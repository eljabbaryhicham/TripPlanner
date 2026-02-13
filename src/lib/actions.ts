'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { Resend } from 'resend';
import { manageAdmin } from '@/ai/flows/manage-admin-flow';
import { getAdminServices } from '@/firebase/admin';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';

// Fills a template string with data.
function fillTemplate(template: string, data: Record<string, any>): string {
  let result = template;
  for (const key in data) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), data[key] || '');
  }
  return result;
}


// --- Inquiry and Reservation Actions ---

const inquirySchema = z.object({
  customerName: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }).optional(),
  phone: z.string().optional(),
  message: z.string().optional(),
  serviceName: z.string(),
  serviceId: z.string(),
  bookingMethod: z.enum(['email', 'whatsapp']),
  totalPrice: z.number().nullable(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  origin: z.string().optional(),
  destination: z.string().optional(),
});

type InquiryData = z.infer<typeof inquirySchema>;

export async function submitInquiryEmail(data: InquiryData): Promise<{ success: boolean; error?: string | null; warning?: string | null; }> {
  const { customerName, email, phone, message, serviceName, startDate, endDate, origin, destination, totalPrice } = data;

  try {
    const { adminFirestore } = getAdminServices();
    const db = adminFirestore;
    const settingsPromise = db.collection('app_settings').doc('general').get();
    const adminTemplatePromise = db.collection('email_templates').doc('admin_notification').get();
    const clientTemplatePromise = db.collection('email_templates').doc('client_confirmation').get();

    const [settingsDoc, adminTemplateDoc, clientTemplateDoc] = await Promise.all([settingsPromise, adminTemplatePromise, clientTemplatePromise]);
    
    const appSettings = settingsDoc.data();
    const adminTemplate = adminTemplateDoc.data()?.template || `<h3>New Booking Inquiry for {{serviceName}}</h3><p><strong>Name:</strong> {{name}}</p><p><strong>Email:</strong> {{email}}</p>`;
    const clientTemplate = clientTemplateDoc.data()?.template || `<h3>Confirmation for {{serviceName}}</h3><p>Hi {{name}},</p><p>We have received your inquiry and will get back to you soon.</p>`;
    
    const recipientEmail = appSettings?.bookingEmailTo;
    const fromEmail = appSettings?.resendEmailFrom;
    
    if (!process.env.RESEND_API_KEY) {
        return { success: true, warning: 'Inquiry saved, but server is not configured to send emails (Resend API Key is missing).' };
    }
    if (!recipientEmail || !fromEmail) {
        return { success: true, warning: 'Inquiry saved, but server is not configured to send emails (Recipient or "From" email is missing).' };
    }
    
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    const detailsHtml = [
        { label: 'Service', value: serviceName },
        { label: 'Name', value: customerName },
        { label: 'Email', value: email },
        { label: 'Phone', value: phone },
        { label: 'Pickup', value: startDate && !endDate ? startDate.toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' }) : undefined },
        { label: 'Dates', value: (startDate && endDate) ? `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}` : undefined },
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
        name: customerName
    };
    
    const adminHtmlBody = fillTemplate(adminTemplate, templateData);
    const clientHtmlBody = fillTemplate(clientTemplate, templateData);

    // Send both emails concurrently
    const [adminResult, clientResult] = await Promise.allSettled([
      resend.emails.send({
        from: fromEmail,
        to: [recipientEmail],
        subject: `New Booking Inquiry for ${serviceName}`,
        html: adminHtmlBody,
        reply_to: email,
      }),
      email ? resend.emails.send({ // Only send to client if email is provided
        from: fromEmail,
        to: [email],
        subject: `Your Booking Inquiry for ${serviceName}`,
        html: clientHtmlBody,
      }) : Promise.resolve({ status: 'fulfilled' })
    ]);

    let warningMessage = null;
    if (adminResult.status === 'rejected') {
        console.error('Resend error (to admin):', adminResult.reason);
        warningMessage = "Your inquiry was saved, but we couldn't notify the administrator. They will follow up as soon as possible.";
    }
    if (clientResult.status === 'rejected') {
        console.error('Resend error (to client):', (clientResult as PromiseRejectedResult).reason);
        warningMessage = (warningMessage || "Your inquiry was saved,") + " but the confirmation email could not be delivered to you. Please check your email address.";
    }

    return { success: true, warning: warningMessage };

  } catch (emailError) {
    console.error('A critical error occurred during email submission:', emailError);
    return { success: true, warning: 'Your inquiry was saved, but an unexpected error occurred while sending notification emails.' };
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
  
  try {
    const { adminFirestore } = getAdminServices();
    const db = adminFirestore;
    const settingsDoc = await db.collection('app_settings').doc('general').get();
    const appSettings = settingsDoc.data();

    const recipientEmail = appSettings?.bookingEmailTo;
    const fromEmail = appSettings?.resendEmailFrom || 'TriPlanner Contact <onboarding@resend.dev>';
    
    if (!process.env.RESEND_API_KEY || !recipientEmail) {
      console.error('Resend API Key or recipient email is not configured.');
      return { success: false, error: 'Server is not configured to send emails.' };
    }
    
    const { name, email, mobile, message } = parsed.data;

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
  } catch (error: any) {
    console.error('Failed to send email:', error);
    const message = error.message || 'An unexpected error occurred.';
    return { success: false, error: message };
  }
}


// --- Settings Action ---

const generalSettingsSchema = z.object({
    whatsappNumber: z.string().min(1, { message: 'WhatsApp number cannot be empty.' }),
    bookingEmailTo: z.string().email({ message: 'A valid recipient email is required.' }),
    resendEmailFrom: z.string().min(1, { message: 'A "from" email is required for Resend.' }),
    logoUrl: z.string().url({ message: "Invalid URL" }).or(z.literal("")).optional(),
    heroBackgroundImageUrl: z.string().url({ message: "Invalid URL for Hero Background" }).or(z.literal("")).optional(),
    suggestionsBackgroundImageUrl: z.string().url({ message: "Invalid URL for Suggestions Background" }).or(z.literal("")).optional(),
    "categoryImages.cars": z.string().url({ message: "Invalid URL for Cars category image" }).or(z.literal("")).optional(),
    "categoryImages.hotels": z.string().url({ message: "Invalid URL for Hotels category image" }).or(z.literal("")).optional(),
    "categoryImages.transport": z.string().url({ message: "Invalid URL for Transport category image" }).or(z.literal("")).optional(),
    "categoryImages.explore": z.string().url({ message: "Invalid URL for Explore category image" }).or(z.literal("")).optional(),
});

export async function updateGeneralSettings(prevState: any, formData: FormData) {
    const rawData = Object.fromEntries(formData);
    const parsed = generalSettingsSchema.safeParse(rawData);

    if (!parsed.success) {
        return { error: parsed.error.errors[0].message, success: false };
    }

    const { 
        "categoryImages.cars": cars, 
        "categoryImages.hotels": hotels,
        "categoryImages.transport": transport,
        "categoryImages.explore": explore,
        ...rest
    } = parsed.data;

    const settingsUpdate = {
        ...rest,
        categoryImages: { 
            cars: cars || "", 
            hotels: hotels || "", 
            transport: transport || "", 
            explore: explore || "" 
        }
    };
    
    const { adminFirestore } = getAdminServices();
    const db = adminFirestore;
    const settingsRef = db.collection('app_settings').doc('general');
    
    // Using non-blocking update
    setDocumentNonBlocking(settingsRef, settingsUpdate, { merge: true });
    
    revalidatePath('/admin', 'layout');
    revalidatePath('/', 'layout');
    
    return { error: null, success: true };
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
    
    const { adminFirestore } = getAdminServices();
    const settingsRef = adminFirestore.collection('app_settings').doc('general');

    setDocumentNonBlocking(settingsRef, { categories: categoryStates }, { merge: true });
    
    revalidatePath('/admin');
    revalidatePath('/services/cars');
    revalidatePath('/services/hotels');
    revalidatePath('/services/transport');
    revalidatePath('/services/explore');
    revalidatePath('/');
    
    return { error: null, success: true };
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
    
    const { adminFirestore } = getAdminServices();
    const templateRef = adminFirestore.collection('email_templates').doc('admin_notification');
    
    setDocumentNonBlocking(templateRef, { template: parsed.data.template }, { merge: true });

    revalidatePath('/admin');
    return { error: null, success: true };
}

// --- Client Email Template Action ---
export async function updateClientEmailTemplate(prevState: any, formData: FormData) {
    const parsed = emailTemplateSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
        return { error: parsed.error.errors[0].message, success: false };
    }
    
    const { adminFirestore } = getAdminServices();
    const templateRef = adminFirestore.collection('email_templates').doc('client_confirmation');

    setDocumentNonBlocking(templateRef, { template: parsed.data.template }, { merge: true });

    revalidatePath('/admin');
    return { error: null, success: true };
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
    

export async function getAdminEmailTemplate(): Promise<{ template?: string; error?: string }> {
    try {
        const { adminFirestore } = getAdminServices();
        const doc = await adminFirestore.collection('email_templates').doc('admin_notification').get();
        if (!doc.exists) {
            const defaultTemplate = `<h3>New Booking Inquiry for {{serviceName}}</h3>
<p><strong>Name:</strong> {{name}}</p>
<p><strong>Email:</strong> {{email}}</p>`;
            return { template: defaultTemplate };
        }
        return { template: doc.data()?.template };
    } catch (error) {
        console.error('Failed to read email template from Firestore:', error);
        const message = error instanceof Error ? error.message : 'Could not load email template from Firestore.';
        return { error: message };
    }
}

export async function getClientEmailTemplate(): Promise<{ template?: string; error?: string }> {
    try {
        const { adminFirestore } = getAdminServices();
        const doc = await adminFirestore.collection('email_templates').doc('client_confirmation').get();
        if (!doc.exists) {
            const defaultTemplate = `<h3>Confirmation for {{serviceName}}</h3><p>Hi {{name}},</p><p>We have received your inquiry and will get back to you soon.</p>`;
            return { template: defaultTemplate };
        }
        return { template: doc.data()?.template };
    } catch (error) {
        console.error('Failed to read client email template from Firestore:', error);
        const message = error instanceof Error ? error.message : 'Could not load client email template from Firestore.';
        return { error: message };
    }
}
