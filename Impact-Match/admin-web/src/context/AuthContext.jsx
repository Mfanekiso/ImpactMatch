import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
            setLoading(true);
            if (!firebaseUser) {
                setUser(null);
                setRole(null);
                setLoading(false);
                return;
            }
            try {
                const snap = await getDoc(doc(db, "users", firebaseUser.uid));
                setRole(snap.exists() ? snap.data().role ?? null : null);
            } catch {
                setRole(null);
            }
            setUser(firebaseUser);
            setLoading(false);
        });
        return unsub;
    }, []);

    const login = (email, password) => signInWithEmailAndPassword(auth, email, password);
    const logout = () => signOut(auth);

    const value = {
        user,
        role,
        isAdmin: role === "admin",
        loading,
        login,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
    return ctx;
}
