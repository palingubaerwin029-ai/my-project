import React, { createContext, useContext, useState, useEffect } from "react";
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getReactNativePersistence,
  initializeAuth,
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { getStorage } from "firebase/storage";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";

// ── Firebase config ────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyCijq5i4CbBEovzJCGYhKkCOL4oj2D1rDo",
  authDomain: "citivoice-e83b2.firebaseapp.com",
  projectId: "citivoice-e83b2",
  storageBucket: "citivoice-e83b2.appspot.com",
  messagingSenderId: "489125998465",
  appId: "1:489125998465:web:364a60e6a8cf546ca24280",
};

// ── Firebase init (singleton) ──────────────────────────────────────────────
let app, auth, db, storage;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage),
  });
  db = getFirestore(app);
  storage = getStorage(app);
} else {
  app = getApp();
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
}

export { auth, db, storage };

// ── Verification status constants ──────────────────────────────────────────
export const VERIFICATION_STATUS = {
  UNVERIFIED: "unverified", // just registered — hasn't submitted ID
  PENDING: "pending", // submitted ID, waiting for admin review
  VERIFIED: "verified", // admin approved — full access
  REJECTED: "rejected", // admin rejected — must resubmit
};

// ── Auth Context ───────────────────────────────────────────────────────────
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ── Listen to Firebase auth state ─────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const snap = await getDoc(doc(db, "users", firebaseUser.uid));
          if (snap.exists()) {
            const userData = { uid: firebaseUser.uid, ...snap.data() };

            // ── VERIFICATION GATE ──────────────────────────────────────
            // If admin has NOT approved this user yet,
            // silently sign them out so AppNavigator never
            // routes them to CitizenTabs or AdminTabs.
            // They will see the auth stack with a status screen.
            const status = userData.verificationStatus;
            const isAdmin = userData.role === "admin";

            if (!isAdmin && status !== VERIFICATION_STATUS.VERIFIED) {
              // Keep them authenticated in Firebase but expose their
              // status so the Login/Status screen can show the right message.
              // Do NOT call signOut — that would cause an infinite loop.
              setUser({ ...userData, _blocked: true });
            } else {
              setUser(userData);
            }
          } else {
            await signOut(auth);
            setUser(null);
          }
        } catch (err) {
          console.log("Auth state error:", err.message);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  // ── Login ──────────────────────────────────────────────────────────────
  const login = async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const snap = await getDoc(doc(db, "users", cred.user.uid));
    if (!snap.exists()) {
      await signOut(auth);
      throw new Error("NO_PROFILE");
    }
    const userData = { uid: cred.user.uid, ...snap.data() };
    return userData; // Caller receives full user data incl. verificationStatus
  };

  // ── Register ───────────────────────────────────────────────────────────
  // New users start as 'unverified' — they must submit an ID
  // before admin can approve them.
  const register = async ({ name, email, password, phone, barangay }) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const userData = {
      uid: cred.user.uid,
      name,
      email,
      phone: phone || "",
      barangay,
      role: "citizen",
      verificationStatus: VERIFICATION_STATUS.UNVERIFIED,
      isVerified: false,
      idType: null,
      idNumber: null,
      idImageUrl: null,
      rejectionReason: null,
      verifiedAt: null,
      submittedAt: null,
      fcmToken: null,
      createdAt: serverTimestamp(),
    };
    await setDoc(doc(db, "users", cred.user.uid), userData);
    return userData;
  };

  // ── Submit ID for verification ─────────────────────────────────────────
  const submitVerification = async (uid, { idType, idNumber, idImageUrl }) => {
    await updateDoc(doc(db, "users", uid), {
      idType,
      idNumber,
      idImageUrl,
      verificationStatus: VERIFICATION_STATUS.PENDING,
      submittedAt: serverTimestamp(),
      rejectionReason: null,
    });
    // Refresh local user state
    const snap = await getDoc(doc(db, "users", uid));
    if (snap.exists()) {
      setUser({ uid, ...snap.data(), _blocked: true });
    }
  };

  // ── Logout ─────────────────────────────────────────────────────────────
  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        submitVerification,
        db,
        storage,
        VERIFICATION_STATUS,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
