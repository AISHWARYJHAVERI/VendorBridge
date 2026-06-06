import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { useAuth } from '../AuthContext';
import api from '../api';
import OwnerSwitcher from '../components/OwnerSwitcher';

const Dashboard = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const toast = useRef(null);

    const [ownerData, setOwnerData] = useState(null);
    const [contactNumber, setContactNumber] = useState('');
    const [address, setAddress] = useState('');
    const [saving, setSaving] = useState(false);
    const [profileDialog, setProfileDialog] = useState(false);

    useEffect(() => {
        if (user?.id) {
            api.getOwnerProfile(user.id).then(data => {
                if (data) {
                    setOwnerData(data);
                    setContactNumber(data.contactNumber || '');
                    setAddress(data.address || '');
                }
            });
        }
    }, [user]);

    const handleSaveOwner = async () => {
        if (!user?.id) return;
        setSaving(true);
        await api.updateOwnerProfile(user.id, { contactNumber, address });
        toast.current?.show({ severity: 'success', summary: 'Saved', detail: 'Owner details updated.', life: 2000 });
        setProfileDialog(false);
        setSaving(false);
    };

    const handleLogout = () => {
        logout();
        navigate('/login', { replace: true });
    };

    const openProfile = () => {
        if (user?.id) {
            api.getOwnerProfile(user.id).then(data => {
                if (data) {
                    setOwnerData(data);
                    setContactNumber(data.contactNumber || '');
                    setAddress(data.address || '');
                }
            });
        }
        setProfileDialog(true);
    };

    const menuItems = [
        {
            title: 'Master Entry',
            icon: 'pi pi-database',
            description: 'Manage users, products, and system masters',
            color: 'indigo',
            path: '/master-entry'
        },
        {
            title: 'Billing',
            icon: 'pi pi-receipt',
            description: 'Manage invoices and billing operations',
            color: 'blue',
            path: '/billing'
        },
        {
            title: 'Report',
            icon: 'pi pi-chart-bar',
            description: 'View detailed analytics and reports',
            color: 'purple',
            path: '/report'
        }
    ];

    const iconColors = {
        indigo: 'from-primary to-primary-dark',
        blue: 'from-primary to-primary-dark',
        purple: 'from-primary-light to-purple-600',
    };

    const cardColors = {
        indigo: 'hover:border-primary/30',
        blue: 'hover:border-primary/30',
        purple: 'hover:border-purple-400/30',
    };

    const profileDialogFooter = (
        <div className="flex justify-center gap-3 pt-2">
            <Button label="Cancel" icon="pi pi-times" className="p-button-outlined !rounded-lg !px-5 !py-2.5 !font-semibold !border-2 !border-gray-300 !text-gray-600 hover:!border-primary hover:!text-primary-dark hover:!bg-slate-50 !transition-all" onClick={() => setProfileDialog(false)} />
            <Button label="Save Changes" icon="pi pi-check" className="!bg-gradient-to-r !from-primary !to-primary-dark !text-white !font-semibold !rounded-lg !px-5 !py-2.5 !shadow-md hover:!shadow-lg hover:!-translate-y-0.5 !transition-all !border-none" onClick={handleSaveOwner} loading={saving} />
        </div>
    );

    return (
        <div className="min-h-screen flex flex-col relative bg-gradient-to-br from-indigo-50 to-blue-50 animate-[fadeIn_0.5s_ease-out]">
            <Toast ref={toast} />

            <div className="flex justify-between items-center p-4 md:p-8 md:pb-0 flex-wrap gap-3">
                <div className="flex flex-col gap-0.5 flex-1 text-left md:pl-4">
                    <h1 className="text-2xl md:text-3xl lg:text-4xl font-black bg-gradient-to-r from-blue-900 to-primary bg-clip-text text-transparent m-0 leading-tight">
                        Welcome to Billing
                    </h1>
                    <p className="text-sm text-gray-500 font-medium m-0">Select a module to get started</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                    {user && <OwnerSwitcher onEditProfile={openProfile} />}
                    <Button
                        label="Logout"
                        icon="pi pi-sign-out"
                        className="!bg-gradient-to-r !from-red-500 !to-red-600 !text-white !font-semibold !rounded-lg !px-4 !py-2 !text-sm !shadow-md hover:!shadow-lg hover:!-translate-y-0.5 !transition-all !border-none"
                        onClick={handleLogout}
                    />
                </div>
            </div>

            <div className="flex-1 flex items-center justify-center p-4 md:p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 w-full max-w-5xl">
                    {menuItems.map((item, index) => (
                        <div
                            key={index}
                            className="cursor-pointer transition-transform duration-300 hover:-translate-y-2.5"
                            onClick={() => navigate(item.path)}
                        >
                            <Card className={`!h-full !rounded-2xl !border !border-white/70 !bg-white/85 !backdrop-blur !shadow-md hover:!shadow-xl hover:!bg-white !transition-all !overflow-hidden ${cardColors[item.color]}`}>
                                <div className="p-6 md:p-8 flex flex-col items-center text-center min-h-[220px] md:min-h-[280px] justify-between gap-2">
                                    <div className={`w-16 h-16 md:w-[72px] md:h-[72px] rounded-xl bg-gradient-to-br ${iconColors[item.color]} flex items-center justify-center mb-2 transition-transform group-hover:scale-110 group-hover:rotate-6`}>
                                        <i className={`${item.icon} text-2xl md:text-[2.2rem] text-white`}></i>
                                    </div>
                                    <h3 className="text-xl md:text-2xl font-bold text-gray-800 m-0">{item.title}</h3>
                                    <p className="text-sm md:text-base text-gray-500 leading-relaxed m-0 flex-1 flex items-center justify-center">{item.description}</p>
                                    <div className="text-gray-300 text-lg md:text-xl transition-all group-hover:translate-x-2 group-hover:text-primary">
                                        <i className="pi pi-arrow-right"></i>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    ))}
                </div>
            </div>

            <button className="fixed bottom-4 md:bottom-6 right-4 md:right-6 flex items-center gap-2 px-3 py-2.5 md:px-4 md:py-3 bg-gradient-to-r from-primary to-primary-dark text-white border-none rounded-xl font-semibold text-sm cursor-pointer shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all z-50 font-sans" onClick={() => navigate('/contact-us')} title="Contact Developer">
                <i className="pi pi-headphones text-base md:text-lg"></i>
                Contact Us
            </button>

            <Dialog
                visible={profileDialog}
                onHide={() => setProfileDialog(false)}
                header={
                    <div className="flex items-center gap-3 text-lg font-bold text-gray-800">
                        <i className="pi pi-building text-primary text-xl"></i>
                        <span>Owner Profile</span>
                    </div>
                }
                modal
                style={{ width: '500px', maxWidth: 'calc(100vw - 2rem)' }}
                footer={profileDialogFooter}
                draggable={false}
                resizable={false}
                closable={false}
                blockScroll
            >
                <div className="flex flex-col gap-4 px-1">
                    <div className="flex flex-col gap-1.5">
                        <label className="font-semibold text-gray-600 text-sm text-center">Company Name</label>
                        <div className="w-full p-2.5 bg-slate-100 rounded-lg text-gray-800 font-semibold text-sm border border-gray-200 text-center">
                            {ownerData?.companyName || ''}
                        </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="font-semibold text-gray-600 text-sm text-center">Mobile Number</label>
                        <InputText
                            value={contactNumber}
                            onChange={(e) => setContactNumber(e.target.value.replace(/\D/g, ''))}
                            className="!w-full !text-center !rounded-lg !p-2.5"
                            placeholder="Enter mobile number"
                            maxLength={10}
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="font-semibold text-gray-600 text-sm text-center">Address</label>
                        <InputTextarea
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            className="!w-full !text-center !rounded-lg !p-2.5"
                            placeholder="Enter address"
                            rows={2}
                            maxLength={50}
                        />
                    </div>
                </div>
            </Dialog>
        </div>
    );
};

export default Dashboard;
