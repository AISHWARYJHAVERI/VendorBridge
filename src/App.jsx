import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { AuthProvider } from './AuthContext';
import ProtectedRoute from './ProtectedRoute';
import Login from './Login/Login';
import AddOwner from './AddOwner/AddOwner';
import ContactUs from './ContactUs/ContactUs';
import Users from "./Users/Users";
import Dashboard from "./Dashboard/Dashboard";
import Billing from "./Billing/Billing";
import Report from "./Report/Report";

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/add-owner" element={<AddOwner />} />
            <Route path="/contact-us" element={<ContactUs />} />
            <Route path="/master-entry" element={<ProtectedRoute><Users /></ProtectedRoute>} />
            <Route path="/billing" element={<ProtectedRoute><Billing /></ProtectedRoute>} />
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/report" element={<ProtectedRoute><Report /></ProtectedRoute>} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
