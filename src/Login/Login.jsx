import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AutoComplete } from 'primereact/autocomplete';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { useAuth, getCurrentFinancialYear } from '../AuthContext';
import api from '../api';

const MAX_LOGINS = 3;

const generateYears = () => {
    const years = [];
    const currentYear = new Date().getFullYear();
    for (let i = -3; i <= 1; i++) {
        const y = currentYear + i;
        const fyStart = y;
        const fyEnd = (y + 1).toString().slice(-2);
        const label = `${fyStart}-${fyEnd}`;
        years.push({ label, value: label });
    }
    return years;
};

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const toast = useRef(null);

  const [logins, setLogins] = useState([]);
  const [filteredLogins, setFilteredLogins] = useState([]);
  const [selectedLogin, setSelectedLogin] = useState(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [maxDialogVisible, setMaxDialogVisible] = useState(false);
  const [selectedYear, setSelectedYear] = useState(getCurrentFinancialYear);

  const yearOptions = generateYears();

  useEffect(() => {
    api.getLogins().then(data => setLogins(data.filter(l => !l.isDevice)));
  }, []);

  const searchAccount = (e) => {
    const query = e.query.toLowerCase();
    setFilteredLogins(logins.filter(l => l.companyName.toLowerCase().includes(query)));
  };

  const handleSelect = (e) => {
    const sel = e.value;
    setSelectedLogin(sel);
    if (sel && typeof sel === 'object' && sel.password) {
      setPassword(sel.password);
    } else {
      setPassword('');
    }
  };

  const handleLogin = async () => {
    if (!selectedLogin) {
      toast.current?.show({ severity: 'warn', summary: 'Select Account', detail: 'Please select an account from the dropdown.', life: 2500 });
      return;
    }
    if (!password) {
      toast.current?.show({ severity: 'warn', summary: 'Enter Password', detail: 'Please enter your password.', life: 2500 });
      return;
    }
    setLoading(true);
    const loginData = await api.getLoginById(selectedLogin.id);
    if (loginData && loginData.password === password) {
      login({ id: loginData.id, companyName: loginData.companyName, address: loginData.address, contactNumber: loginData.contactNumber }, selectedYear);
      navigate('/dashboard', { replace: true });
    } else {
      toast.current?.show({ severity: 'error', summary: 'Invalid Password', detail: 'The password you entered is incorrect.', life: 2500 });
    }
    setLoading(false);
  };

  const handleAddNewOwner = () => {
    if (logins.length >= MAX_LOGINS) {
      setMaxDialogVisible(true);
    } else {
      navigate('/add-owner');
    }
  };

  const selectedCompanyName = selectedLogin ? selectedLogin.companyName : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center p-3 md:p-6 animate-[fadeIn_0.5s_ease-out]">
      <Toast ref={toast} />

      <div className="w-full max-w-3xl bg-white/70 backdrop-blur-lg rounded-2xl shadow-lg border border-white/60 p-5 md:p-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6 md:mb-8 text-center relative pb-3 after:content-[''] after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:h-1 after:w-14 after:bg-gradient-to-r after:from-primary after:to-primary-light after:rounded">
          Owner Login
        </h2>

        <div className="flex flex-col md:flex-row gap-3 md:gap-4">
          <div className="flex-1 p-4 md:p-6 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-gray-200">
            <h3 className="text-base md:text-lg font-bold text-gray-800 mb-4 md:mb-5 text-center">Sign In</h3>

            <div className="mb-4">
              <label className="block text-center text-sm font-semibold text-gray-600 mb-1.5">Select Account</label>
              <AutoComplete
                value={selectedLogin}
                suggestions={filteredLogins}
                completeMethod={searchAccount}
                onChange={handleSelect}
                field="companyName"
                placeholder={logins.length ? 'Type to search account…' : 'No accounts yet'}
                className="w-full [&_.p-inputtext]:text-center [&_.p-inputtext]:rounded-lg [&_.p-inputtext]:w-full"
                inputClassName="w-full"
                style={{ width: '100%' }}
              />
            </div>

            <div className="mb-4">
              <label className="block text-center text-sm font-semibold text-gray-600 mb-1.5">Password</label>
              <div style={{ position: 'relative', width: '100%' }}>
                <i
                  className={`pi ${showPassword ? 'pi-eye-slash' : 'pi-eye'} absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 hover:text-primary z-10`}
                  onClick={() => setShowPassword(!showPassword)}
                />
                <InputText
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full text-center rounded-lg"
                  style={{ width: '100%', paddingRight: '2.5rem' }}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleLogin(); }}
                  maxLength={50}
                />
              </div>
            </div>

            <Button
              label="Login"
              icon="pi pi-sign-in"
              className="!bg-gradient-to-r !from-primary !to-primary-dark !text-white !font-semibold !rounded-lg !px-5 !py-2.5 !shadow-md hover:!shadow-lg hover:!-translate-y-0.5 !transition-all !border-none w-full !mt-2"
              onClick={handleLogin}
              loading={loading}
            />

            {selectedCompanyName && (
              <p className="mt-3 text-xs text-gray-500 text-center">
                Logging in as <strong>{selectedCompanyName}</strong>
              </p>
            )}
          </div>

          <div className="flex-1 p-4 md:p-6 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-gray-200 flex flex-col justify-center text-center">
            <h3 className="text-base md:text-lg font-bold text-gray-800 mb-4 md:mb-5 text-center">New Owner</h3>
            <p className="text-sm text-gray-500 leading-relaxed mb-5">
              Create a new owner account to access the billing system. You can add up to <strong>{MAX_LOGINS}</strong> accounts.
            </p>
            <Button
              label={logins.length >= MAX_LOGINS ? 'Max Accounts Reached' : 'Add New Owner'}
              icon="pi pi-user-plus"
              className="!bg-gradient-to-r !from-primary !to-primary-dark !text-white !font-semibold !rounded-lg !px-5 !py-2.5 !shadow-md hover:!shadow-lg hover:!-translate-y-0.5 !transition-all !border-none w-full"
              onClick={handleAddNewOwner}
            />
            <p className="mt-3 text-xs text-gray-400 text-center">{logins.length} / {MAX_LOGINS} accounts created</p>
          </div>
        </div>

        <div className="mt-5 p-4 md:p-5 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-gray-200 flex flex-col md:flex-row items-center justify-center gap-3 md:gap-5">
          <div className="flex items-center gap-2 font-bold text-base text-gray-700">
            <i className="pi pi-calendar text-primary" style={{ fontSize: '1.1rem' }}></i>
            <span>Financial Year</span>
          </div>
          <Dropdown
            value={selectedYear}
            options={yearOptions}
            onChange={(e) => setSelectedYear(e.value)}
            className="min-w-[150px] [&_.p-dropdown-label]:text-center [&_.p-dropdown-label]:font-bold [&_.p-dropdown-label]:text-gray-700 [&_.p-dropdown-trigger]:hidden [&_.p-dropdown]:rounded-lg [&_.p-dropdown]:border-gray-300 hover:[&_.p-dropdown]:border-primary"
            appendTo="self"
          />
        </div>

        <div className="flex justify-center mt-5 pt-4 border-t border-gray-100">
          <Button
            label="Buy Login"
            icon="pi pi-shopping-cart"
            className="p-button-text p-button-sm !text-primary !font-semibold !text-sm hover:!underline !no-underline"
            onClick={() => navigate('/contact-us')}
          />
        </div>
      </div>

      <Dialog
        header="Maximum Accounts Reached"
        visible={maxDialogVisible}
        onHide={() => setMaxDialogVisible(false)}
        style={{ width: '400px' }}
        draggable={false}
        resizable={false}
      >
        <p style={{ marginBottom: '1.5rem', color: '#475569', lineHeight: 1.6 }}>
          You have already created the maximum of <strong>{MAX_LOGINS}</strong> owner accounts.
          Please contact the developer to purchase additional login slots.
        </p>
        <div className="flex justify-center gap-3">
          <Button label="Close" icon="pi pi-times" className="p-button-outlined" onClick={() => setMaxDialogVisible(false)} />
          <Button label="Contact Developer" icon="pi pi-phone" className="!bg-gradient-to-r !from-primary !to-primary-dark !text-white !font-semibold !rounded-lg !px-5 !py-2.5 !shadow-md !border-none" onClick={() => { setMaxDialogVisible(false); navigate('/contact-us'); }} />
        </div>
      </Dialog>
    </div>
  );
}
