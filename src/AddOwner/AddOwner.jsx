import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { useAuth } from '../AuthContext';
import api from '../api';

const MAX_LOGINS = 3;

export default function AddOwner() {
  const navigate = useNavigate();
  useAuth();
  const toast = useRef(null);

  const [companyName, setCompanyName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [existingLogins, setExistingLogins] = useState([]);

  useEffect(() => {
    api.getLogins().then(logins => {
      if (logins.length >= MAX_LOGINS) {
        navigate('/contact-us', { replace: true });
        return;
      }
      setExistingLogins(logins);
    });
  }, [navigate]);

  const handleSave = async () => {
    if (!companyName.trim()) {
      toast.current?.show({ severity: 'warn', summary: 'Required', detail: 'Company Name is required.', life: 2500 });
      return;
    }
    if (!contactNumber.trim()) {
      toast.current?.show({ severity: 'warn', summary: 'Required', detail: 'Contact Number is required.', life: 2500 });
      return;
    }
    if (!address.trim()) {
      toast.current?.show({ severity: 'warn', summary: 'Required', detail: 'Address is required.', life: 2500 });
      return;
    }
    if (!password) {
      toast.current?.show({ severity: 'warn', summary: 'Required', detail: 'Password is required.', life: 2500 });
      return;
    }

    const duplicate = existingLogins.some(l => l.companyName.toLowerCase() === companyName.trim().toLowerCase());
    if (duplicate) {
      toast.current?.show({ severity: 'error', summary: 'Duplicate', detail: 'Company Name already exists. Choose a different name.', life: 3000 });
      return;
    }

    setSaving(true);
    await api.addLogin({
      companyName: companyName.trim(),
      contactNumber: contactNumber.trim(),
      address: address.trim(),
      password,
    });
    toast.current?.show({ severity: 'success', summary: 'Saved', detail: 'Owner account created successfully!', life: 2000 });
    setTimeout(() => navigate('/login'), 1200);
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center p-3 md:p-6 animate-[fadeIn_0.5s_ease-out]">
      <Toast ref={toast} />

      <div className="w-full max-w-lg bg-white/70 backdrop-blur-lg rounded-2xl shadow-lg border border-white/60 p-5 md:p-8">
        <div className="flex items-center gap-3 mb-5">
          <button className="w-10 h-10 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-400 text-lg hover:text-primary hover:border-primary hover:-translate-x-0.5 transition-all shadow-sm cursor-pointer flex-shrink-0 font-sans" onClick={() => navigate('/login')} title="Back to Login">
            <i className="pi pi-arrow-left"></i>
          </button>
          <h2 className="text-xl md:text-2xl font-bold text-gray-800 m-0 relative pb-2.5 after:content-[''] after:absolute after:bottom-0 after:left-0 after:h-1 after:w-12 after:bg-gradient-to-r after:from-primary after:to-primary-light after:rounded">
            Add New Owner
          </h2>
        </div>

        <div className="mt-2">
          <div className="mb-4">
            <label className="block text-center text-sm font-semibold text-gray-600 mb-1.5">Company Name *</label>
            <InputText
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Enter company name"
              className="!w-full !text-center !rounded-lg"
              maxLength={50}
            />
          </div>

          <div className="mb-4">
            <label className="block text-center text-sm font-semibold text-gray-600 mb-1.5">Contact Number *</label>
            <InputText
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value.replace(/\D/g, ''))}
              placeholder="Enter contact number"
              className="!w-full !text-center !rounded-lg"
              maxLength={10}
            />
          </div>

          <div className="mb-4">
            <label className="block text-center text-sm font-semibold text-gray-600 mb-1.5">Address *</label>
            <InputTextarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter full address"
              className="!w-full !text-center !rounded-lg"
              rows={3}
              style={{ width: '100%', resize: 'vertical' }}
              maxLength={50}
            />
          </div>

          <div className="mb-4">
            <label className="block text-center text-sm font-semibold text-gray-600 mb-1.5">Password *</label>
            <div style={{ position: 'relative', width: '100%' }}>
              <i
                className={`pi ${showPassword ? 'pi-eye-slash' : 'pi-eye'} absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 hover:text-primary z-10`}
                onClick={() => setShowPassword(!showPassword)}
              />
              <InputText
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Set a password"
                className="!w-full !text-center !rounded-lg"
                style={{ width: '100%', paddingRight: '2.5rem' }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
                maxLength={50}
              />
            </div>
          </div>

          <div className="flex justify-center gap-3 mt-5">
            <Button label="Cancel" icon="pi pi-times" className="p-button-outlined !rounded-lg !px-5 !py-2.5 !font-semibold" onClick={() => navigate('/login')} />
            <Button label="Save" icon="pi pi-check" className="!bg-gradient-to-r !from-primary !to-primary-dark !text-white !font-semibold !rounded-lg !px-5 !py-2.5 !shadow-md hover:!shadow-lg hover:!-translate-y-0.5 !transition-all !border-none" onClick={handleSave} loading={saving} />
          </div>
        </div>
      </div>
    </div>
  );
}
