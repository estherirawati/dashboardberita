import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  User
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy,
  getDocFromServer
} from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";

// Initialize Core Firebase Services
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); /* CRITICAL: The app will break without this line */
export const auth = getAuth();
export const googleProvider = new GoogleAuthProvider();

// Operational Types for custom diagnostic error reporting
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

/**
 * Validates connection to Firestore. Throws warning log if client is offline.
 */
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
  } catch (error) {
    if (error instanceof Error && error.message.includes("the client is offline")) {
      console.error("Please check your Firebase configuration or network status.");
    }
  }
}

/**
 * Handle custom diagnostic throwing of insufficient access permissions
 */
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Authentication Helpers
export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Gagal login dengan Google:", error);
    throw error;
  }
}

export async function logoutUser() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Gagal logout:", error);
  }
}

// Standard Firestore Operations with the Mandatory Diagnostic Handlers
export const firestoreService = {
  async getPostsAndSync(onUpdate: (posts: any[]) => void, onError?: (err: Error) => void) {
    const path = "posts";
    try {
      const q = query(collection(db, path), orderBy("publishedAt", "desc"));
      return onSnapshot(q, (snapshot) => {
        const postsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        onUpdate(postsList);
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, path);
      });
    } catch (error) {
      if (onError) onError(error as Error);
      handleFirestoreError(error, OperationType.GET, path);
    }
  },

  async createPost(postId: string, data: any) {
    const path = `posts/${postId}`;
    try {
      await setDoc(doc(db, "posts", postId), data);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  async updatePost(postId: string, data: Partial<any>) {
    const path = `posts/${postId}`;
    try {
      await updateDoc(doc(db, "posts", postId), data);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  async getNotesAndSync(postId: string, onUpdate: (notes: any[]) => void) {
    const path = `posts/${postId}/notes`;
    try {
      const q = query(collection(db, "posts", postId, "notes"), orderBy("createdAt", "asc"));
      return onSnapshot(q, (snapshot) => {
        const notesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        onUpdate(notesList);
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, path);
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
    }
  },

  async addNote(postId: string, noteId: string, data: any) {
    const path = `posts/${postId}/notes/${noteId}`;
    try {
      await setDoc(doc(db, "posts", postId, "notes", noteId), data);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  async deleteNote(postId: string, noteId: string) {
    const path = `posts/${postId}/notes/${noteId}`;
    try {
      await deleteDoc(doc(db, "posts", postId, "notes", noteId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  async getAnnouncementsAndSync(onUpdate: (announcements: any[]) => void) {
    const path = "announcements";
    try {
      const q = query(collection(db, path), orderBy("createdAt", "desc"));
      return onSnapshot(q, (snapshot) => {
        const announcementsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        onUpdate(announcementsList);
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, path);
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
    }
  },

  async addAnnouncement(announcementId: string, data: any) {
    const path = `announcements/${announcementId}`;
    try {
      await setDoc(doc(db, "announcements", announcementId), data);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  async deleteAnnouncement(announcementId: string) {
    const path = `announcements/${announcementId}`;
    try {
      await deleteDoc(doc(db, "announcements", announcementId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }
};

// Validate database connection on boot as mandated
testConnection();
