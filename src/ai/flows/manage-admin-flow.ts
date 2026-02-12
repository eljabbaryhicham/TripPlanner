
'use server';

/**
 * @fileOverview A Genkit flow for managing admin users in Firebase.
 * This flow handles creating users, deleting users, and updating their roles.
 * It encapsulates Firebase Admin SDK logic to ensure it runs in a properly
 * authenticated server environment.
 *
 * - manageAdmin - A function that handles all admin management actions.
 * - ManageAdminInput - The input type for the manageAdmin function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { initializeApp, getApps, getApp, applicationDefault } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

// Gets the initialized Firebase Admin services, creating them if necessary.
// This is a stateless function, making it robust for serverless environments.
function getAdminServices(): { adminAuth: Auth; adminFirestore: Firestore } {
    if (getApps().length === 0) {
        // In a managed Google Cloud environment, initializeApp() with applicationDefault
        // automatically discovers service account credentials.
        initializeApp({
            credential: applicationDefault(),
        });
    }
    
    const adminApp = getApp();
    return {
        adminAuth: getAuth(adminApp),
        adminFirestore: getFirestore(adminApp),
    };
}


const ManageAdminInputSchema = z.object({
  action: z.enum(['add', 'remove', 'promote']),
  uid: z.string().optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
});

export type ManageAdminInput = z.infer<typeof ManageAdminInputSchema>;

const ManageAdminOutputSchema = z.object({
    success: z.boolean(),
    message: z.string(),
    uid: z.string().optional(),
});

export async function manageAdmin(input: ManageAdminInput): Promise<z.infer<typeof ManageAdminOutputSchema>> {
  return manageAdminFlow(input);
}

const manageAdminFlow = ai.defineFlow(
  {
    name: 'manageAdminFlow',
    inputSchema: ManageAdminInputSchema,
    outputSchema: ManageAdminOutputSchema,
  },
  async (input) => {
    try {
      const { adminAuth, adminFirestore } = getAdminServices();

      switch (input.action) {
        case 'add':
          if (!input.email || !input.password) {
            throw new Error('Email and password are required to add an admin.');
          }
          const userRecord = await adminAuth.createUser({ email: input.email, password: input.password });
          await adminFirestore.collection('roles_admin').doc(userRecord.uid).set({
            email: input.email,
            role: 'admin',
            createdAt: new Date(),
            id: userRecord.uid,
          });
          return { success: true, message: 'Admin added successfully.', uid: userRecord.uid };

        case 'remove':
          if (!input.uid) {
            throw new Error('User ID is required to remove an admin.');
          }
          await adminAuth.deleteUser(input.uid);
          await adminFirestore.collection('roles_admin').doc(input.uid).delete();
          return { success: true, message: 'Admin removed successfully.' };

        case 'promote':
          if (!input.uid) {
            throw new Error('User ID is required to promote an admin.');
          }
          await adminFirestore.collection('roles_admin').doc(input.uid).update({ role: 'superadmin' });
          return { success: true, message: 'Admin promoted to superadmin.' };

        default:
          throw new Error('Invalid action specified.');
      }
    } catch (error: any) {
      console.error(`Admin management flow failed for action "${input.action}":`, error);
      return { success: false, message: error.message || 'An unknown error occurred.' };
    }
  }
);
