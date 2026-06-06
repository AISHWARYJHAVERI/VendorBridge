import { createContext, useContext, useState, useEffect } from 'react';
import api from './api';

const AuthContext = createContext(null);

const getCurrentFinancialYear = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    if (month >= 4) {
        return `${year}-${(year + 1).toString().slice(-2)}`;
    } else {
        return `${year - 1}-${year.toString().slice(-2)}`;
    }
};

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        try {
            const saved = localStorage.getItem('popBillingUser');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed && parsed.id) return parsed;
            }
        } catch {
            localStorage.removeItem('popBillingUser');
        }
        return null;
    });

    const [selectedYear, setSelectedYear] = useState(getCurrentFinancialYear);
    const [verifying, setVerifying] = useState(!!user);

    useEffect(() => {
        if (!user?.id) return;
        let cancelled = false;
        api.getLoginById(user.id).then(data => {
            if (cancelled) return;
            if (!data) {
                setUser(null);
                setSelectedYear(getCurrentFinancialYear());
                localStorage.removeItem('popBillingUser');
            }
            setVerifying(false);
        });
        return () => { cancelled = true; };
    }, [user?.id]);

    const login = (userData, year) => {
        setUser(userData);
        const yearToSave = year || getCurrentFinancialYear();
        setSelectedYear(yearToSave);
        localStorage.setItem('popBillingUser', JSON.stringify({ ...userData, selectedYear: yearToSave }));
    };

    const logout = () => {
        setUser(null);
        setSelectedYear(getCurrentFinancialYear());
        localStorage.removeItem('popBillingUser');
    };

    return (
            <AuthContext.Provider value={{ user, login, logout, selectedYear, setSelectedYear, verifying }}>
            {children}
        </AuthContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export { getCurrentFinancialYear };
