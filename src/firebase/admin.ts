
import admin from 'firebase-admin';

// Check if the app is already initialized to prevent errors.
// In a managed server environment (like Firebase App Hosting or Cloud Run),
// the SDK will automatically pick up the default service account credentials.
if (!admin.apps.length) {
  admin.initializeApp();
}

// Export singleton instances of the services.
const firestoreAdmin = admin.firestore();
const authAdmin = admin.auth();

export { firestoreAdmin, authAdmin };
