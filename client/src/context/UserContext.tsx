"use client"
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import axios from "axios";
import api from "@/lib/axios";
import { useRouter } from "next/navigation"

interface User {
    id: string;
    username: string;
    email: string;
    role_id: number;
}

interface UserContextType {
    user: User | null;
    setUser: React.Dispatch<React.SetStateAction<User | null>>
    loading: boolean;
    refreshToken: () => Promise<boolean>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter()

    const refreshToken = async (): Promise<boolean> => {
        try {
            const res = await api.post('/auth/refresh', {}, { withCredentials: true });
            if (res.data.status === 200) {
                return true;
            }
            return false;
        } catch (err) {
            console.error('Token refresh failed:', err);
            setUser(null);
            localStorage.removeItem('user');
            router.push('/login');
            return false;
        }
    };

    const checkAuth = async () => {
        try {
            setLoading(true);
            const res = await api.get('/auth/me', { withCredentials: true });

            if (res.data.status === 200) {
                console.log(res.data.data);
                localStorage.setItem('user', JSON.stringify(res.data.data));
                setUser(res.data.data);
            }
        } catch (err) {
            console.error('Auth check failed:', err);
            // Try to refresh token if authentication fails
            const refreshSuccess = await refreshToken();
            if (!refreshSuccess) {
                setUser(null);
                localStorage.removeItem('user');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkAuth()
    }, []);

    return (
        <UserContext.Provider value={{ user, setUser, loading, refreshToken }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) throw new Error("useUser must be used within UserProvider");
    return context;
};