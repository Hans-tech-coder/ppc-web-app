import { NextResponse } from "next/server"
import * as admin from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
const initAdmin = () => {
  if (admin.apps.length === 0) {
    try {
      const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
      if (!serviceAccountKey) {
        console.warn("FIREBASE_SERVICE_ACCOUNT_KEY is not set. Trying default initialization.");
        admin.initializeApp();
      } else {
        const parsedKey = JSON.parse(serviceAccountKey);
        if (parsedKey.private_key) {
          parsedKey.private_key = parsedKey.private_key.replace(/\\n/g, '\n');
        }
        admin.initializeApp({
          credential: admin.credential.cert(parsedKey),
        });
      }
    } catch (error) {
      console.error("Firebase Admin Initialization Error:", error);
    }
  }
  return admin.firestore();
};

export async function POST(req: Request) {
  try {
    const db = initAdmin();
    if (!db) {
      return NextResponse.json({ error: "Firebase Admin not properly configured." }, { status: 500 });
    }

    // 1. Verify API Key
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    if (token !== process.env.SYNC_API_KEY) {
      return NextResponse.json({ error: "Invalid API Key" }, { status: 403 });
    }

    // 2. Parse payload
    const body = await req.json();
    const members = Array.isArray(body) ? body : body.members;

    if (!Array.isArray(members)) {
      return NextResponse.json({ error: "Invalid payload format. Expected an array of members." }, { status: 400 });
    }

    // 3. Batch Update Firestore
    const batch = db.batch();
    const membersCollection = db.collection("members");
    
    let processedCount = 0;

    for (const member of members) {
      // Validate necessary fields
      if (!member.name || !member.contactNumber) continue;

      // Use a sanitized contact number as the document ID to prevent duplicates
      const safeId = member.contactNumber.replace(/[^0-9]/g, "");
      if (!safeId) continue;

      const docRef = membersCollection.doc(safeId);
      
      batch.set(docRef, {
        name: member.name,
        contactNumber: member.contactNumber,
        email: member.email || "",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true }); // merge: true updates existing, creates new

      processedCount++;
    }

    await batch.commit();

    return NextResponse.json({ 
      success: true, 
      message: `Successfully synced ${processedCount} members.` 
    });

  } catch (error: any) {
    console.error("Sync Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
