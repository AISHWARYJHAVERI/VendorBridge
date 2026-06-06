import { createContext, useContext } from 'react';

export const AuthContext = createContext(null);

export const getCurrentFinancialYear = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  if (month >= 4) {
    return `${year}-${(year + 1).toString().slice(-2)}`;
  }

  return `${year - 1}-${year.toString().slice(-2)}`;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
