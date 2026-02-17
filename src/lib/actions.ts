'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { Resend } from 'resend';
import { getAdminServices } from '@/firebase/admin';

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

  // Run email sending in the background, do not await it from the client's perspective
  (async () => {
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
      
      if (!process.env.RESEND_API_KEY || !recipientEmail || !fromEmail) {
          console.warn('Email sending is not configured. RESEND_API_KEY, recipient, or from-email is missing.');
          return; // Exit if not configured
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
        }) : Promise.resolve({ status: 'fulfilled' as const })
      ]);

      if (adminResult.status === 'rejected') {
          console.error('Resend error (to admin):', adminResult.reason);
      }
      if (clientResult.status === 'rejected') {
          console.error('Resend error (to client):', (clientResult as PromiseRejectedResult).reason);
      }

    } catch (emailError) {
      console.error('A critical error occurred during background email submission:', emailError);
    }
  })();
  
  // Return immediately to the client
  return { success: true, warning: null };
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

export async function grantInitialAdminAccess(input: { uid: string; email: string; }): Promise<{ success: boolean; error?: string | null; }> {
    try {
      const { adminFirestore } = getAdminServices();
      const adminRolesCollection = adminFirestore.collection('roles_admin');
      
      const snapshot = await adminRolesCollection.limit(1).get();
      if (!snapshot.empty) {
          return { success: false, error: 'An admin already exists. Cannot bootstrap a new superadmin.' };
      }

      await adminRolesCollection.doc(input.uid).set({
        email: input.email,
        role: 'superadmin',
        createdAt: new Date(),
        id: input.uid,
      });

      revalidatePath('/admin');
      return { success: true, error: null };

    } catch (error: any) {
      console.error(`Superadmin bootstrap failed:`, error);
      return { success: false, error: error.message || 'An unknown error occurred.' };
    }
}
