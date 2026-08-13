"use client"

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';

interface AuthContextType {
    user: User | null;
    isAdmin: boolean;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    isAdmin: false,
    loading: true,
    signInWithGoogle: async () => {},
    signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser);
                // Check if user is in admin_whitelist
                if (firebaseUser.email) {
                    try {
                        const adminDocRef = doc(db, 'admin_whitelist', firebaseUser.email);
                        const adminDocSnap = await getDoc(adminDocRef);
                        setIsAdmin(adminDocSnap.exists());
                    } catch (error) {
                        console.error("Error checking admin status:", error);
                        setIsAdmin(false);
                    }
                } else {
                    setIsAdmin(false);
                }
            } else {
                setUser(null);
                setIsAdmin(false);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const signInWithGoogle = async () => {
        try {
            setLoading(true);
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
        } catch (error) {
            console.error("Error signing in with Google", error);
            setLoading(false);
            throw error; // Rethrow to let the UI handle the error state
        }
    };

    const signOut = async () => {
        try {
            setLoading(true);
            await firebaseSignOut(auth);
        } catch (error) {
            console.error("Error signing out", error);
            setLoading(false);
        }
    };

    return (
        <AuthContext.Provider value={{ user, isAdmin, loading, signInWithGoogle, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};
