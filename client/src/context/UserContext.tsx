"use client"
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import axios from "axios";
import api from "@/lib/axios";

interface User {
    id: string;
    username: string;
    email: string;
    role_id: string;
}

interface UserContextType {
    user: User | null;
    setUser: (user: User | null) => void;
    loading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get("/auth/me").then(res => {
            setUser(res.data.data);
        }).finally(() => setLoading(false));
    }, []);

    return (
        <UserContext.Provider value={{ user, setUser, loading }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) throw new Error("useUser must be used within UserProvider");
    return context;
};
