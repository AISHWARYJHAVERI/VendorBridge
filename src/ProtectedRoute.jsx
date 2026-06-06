import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, verifying } = useAuth();
  if (verifying) return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-50"><i className="pi pi-spin pi-spinner text-4xl text-primary"></i></div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
