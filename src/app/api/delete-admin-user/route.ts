import { NextResponse } from 'next/server';
import { getAdminServices } from '@/firebase/admin';

export async function POST(request: Request) {
  try {
    const { adminAuth, adminFirestore } = getAdminServices();

    // 1. Verify the caller is a superadmin by checking their ID token
    const token = request.headers.get('authorization')?.split('Bearer ')[1];

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: No token provided.' }, { status: 401 });
    }

    const decodedToken = await adminAuth.verifyIdToken(token);
    const callerUid = decodedToken.uid;

    const adminDoc = await adminFirestore.collection('roles_admin').doc(callerUid).get();
    
    if (!adminDoc.exists || adminDoc.data()?.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden: Caller is not a superadmin.' }, { status: 403 });
    }
    
    // 2. Get the UID to delete from the request body
    const { uidToDelete } = await request.json();
    if (!uidToDelete) {
      return NextResponse.json({ error: 'User ID to delete is required.' }, { status: 400 });
    }

    // Prevent a superadmin from deleting themselves
    if (callerUid === uidToDelete) {
        return NextResponse.json({ error: 'A superadmin cannot delete themselves.' }, { status: 400 });
    }

    // 3. Delete the user from Auth and their role from Firestore
    await adminAuth.deleteUser(uidToDelete);
    await adminFirestore.collection('roles_admin').doc(uidToDelete).delete();

    return NextResponse.json({ success: true, message: `User ${uidToDelete} deleted.` });

  } catch (error: any) {
    console.error('Failed to delete admin user:', error);
    let status = 500;
    let message = 'An internal server error occurred.';

    if (error.code?.startsWith('auth/')) {
        status = 401;
        message = error.message;
    } else if (error.message?.includes('token')) {
        status = 401;
        message = 'Invalid or expired authorization token.';
    }

    return NextResponse.json({ error: 'Failed to delete user.', details: message }, { status: status });
  }
}
