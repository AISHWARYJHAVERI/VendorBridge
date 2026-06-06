import { useState, useEffect } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';

const ViewUser = ({ rowData }) => {
    const [viewDialog, setViewDialog] = useState(false);
    const [user, setUser] = useState({});

    const openView = () => {
        let _user = { ...rowData };
        
        if (!_user.firstName && _user.name) {
            const parts = _user.name.split(' ');
            _user.firstName = parts[0] || '';
            _user.lastName = parts.slice(1).join(' ') || '';
        }
        if (!_user.middleName && _user.username) {
            _user.middleName = _user.username;
        }
        if (!_user.mobileNumber && _user.phone) {
            _user.mobileNumber = _user.phone; 
        }
        if (!_user.address) _user.address = {};
        if (!_user.company) _user.company = {};

        setUser(_user);
        setViewDialog(true);
    };

    const hideViewDialog = () => {
        setViewDialog(false);
    };

    const viewDialogFooter = (
        <div className="flex justify-center">
            <Button label="Close" icon="pi pi-times" className="!bg-gradient-to-r !from-red-500 !to-red-600 !text-white !font-semibold !rounded-lg !px-5 !py-2.5 !shadow-md hover:!shadow-lg hover:!-translate-y-0.5 !transition-all !border-none" onClick={hideViewDialog} />
        </div>
    );

    return (
        <>
            <Button icon="pi pi-eye" rounded outlined severity="info" className="!w-9 !h-9" onClick={openView} title="View User" />

            <Dialog visible={viewDialog} style={{ width: '950px' }} header="User Profile" modal className="p-fluid" footer={viewDialogFooter} onHide={hideViewDialog}>
                <div className="text-center">
                    <div className="mb-6 relative">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-light to-primary flex items-center justify-center mx-auto mb-5 shadow-lg border-4 border-white">
                            <span className="text-4xl font-bold text-white">{user.firstName ? user.firstName.charAt(0).toUpperCase() : (user.name ? user.name.charAt(0).toUpperCase() : 'U')}</span>
                        </div>
                        <h3 className="text-xl md:text-2xl font-bold text-gray-800 m-0">{user.name || `${user.firstName || ''} ${user.lastName || ''}`}</h3>
                        <p className="text-gray-500 mt-2 text-base font-medium">@{user.middleName || user.username}</p>
                    </div>

                    <div className="flex flex-col gap-6 text-left">
                        <div className="p-5 bg-slate-50 rounded-xl border border-gray-200">
                            <h6 className="text-base font-semibold text-primary mb-3 text-center">Primary User Information</h6>
                            <div className="grid grid-cols-12 gap-4 text-center">
                                <div className="col-span-12 md:col-span-4 flex flex-col gap-1">
                                    <label className="font-bold text-sm text-gray-600">First Name</label>
                                    <div className="p-inputtext p-disabled bg-gray-100 rounded-lg p-2.5 text-gray-700">{user.firstName || '-'}</div>
                                </div>
                                <div className="col-span-12 md:col-span-4 flex flex-col gap-1">
                                    <label className="font-bold text-sm text-gray-600">Middle Name</label>
                                    <div className="p-inputtext p-disabled bg-gray-100 rounded-lg p-2.5 text-gray-700">{user.middleName || '-'}</div>
                                </div>
                                <div className="col-span-12 md:col-span-4 flex flex-col gap-1">
                                    <label className="font-bold text-sm text-gray-600">Last Name</label>
                                    <div className="p-inputtext p-disabled bg-gray-100 rounded-lg p-2.5 text-gray-700">{user.lastName || '-'}</div>
                                </div>
                                <div className="col-span-12 md:col-span-6 flex flex-col gap-1">
                                    <label className="font-bold text-sm text-gray-600">Mobile Number</label>
                                    <div className="p-inputtext p-disabled bg-gray-100 rounded-lg p-2.5 text-gray-700">{user.mobileNumber || '-'}</div>
                                </div>
                                <div className="col-span-12 md:col-span-6 flex flex-col gap-1">
                                    <label className="font-bold text-sm text-gray-600">Email</label>
                                    <div className="p-inputtext p-disabled bg-gray-100 rounded-lg p-2.5 text-gray-700">{user.email || '-'}</div>
                                </div>
                            </div>
                        </div>

                        <div className="p-5 bg-slate-50 rounded-xl border border-gray-200">
                            <h6 className="text-base font-semibold text-primary mb-3 text-center">Address Section</h6>
                            <div className="grid grid-cols-12 gap-4 text-center">
                                <div className="col-span-12 md:col-span-4 flex flex-col gap-1">
                                    <label className="font-bold text-sm text-gray-600">House / Flat</label>
                                    <div className="p-inputtext p-disabled bg-gray-100 rounded-lg p-2.5 text-gray-700">{user.address?.houseFlat || '-'}</div>
                                </div>
                                <div className="col-span-12 md:col-span-4 flex flex-col gap-1">
                                    <label className="font-bold text-sm text-gray-600">Street</label>
                                    <div className="p-inputtext p-disabled bg-gray-100 rounded-lg p-2.5 text-gray-700">{user.address?.street || '-'}</div>
                                </div>
                                <div className="col-span-12 md:col-span-4 flex flex-col gap-1">
                                    <label className="font-bold text-sm text-gray-600">Landmark</label>
                                    <div className="p-inputtext p-disabled bg-gray-100 rounded-lg p-2.5 text-gray-700">{user.address?.landmark || '-'}</div>
                                </div>
                                <div className="col-span-12 md:col-span-4 flex flex-col gap-1 mb-0">
                                    <label className="font-bold text-sm text-gray-600">City</label>
                                    <div className="p-inputtext p-disabled bg-gray-100 rounded-lg p-2.5 text-gray-700">{user.address?.city || '-'}</div>
                                </div>
                                <div className="col-span-12 md:col-span-4 flex flex-col gap-1 mb-0">
                                    <label className="font-bold text-sm text-gray-600">Zipcode</label>
                                    <div className="p-inputtext p-disabled bg-gray-100 rounded-lg p-2.5 text-gray-700">{user.address?.zipcode || '-'}</div>
                                </div>
                                <div className="col-span-12 md:col-span-4 flex flex-col gap-1 mb-0">
                                    <label className="font-bold text-sm text-gray-600">State</label>
                                    <div className="p-inputtext p-disabled bg-gray-100 rounded-lg p-2.5 text-gray-700">{user.address?.state || '-'}</div>
                                </div>
                            </div>
                        </div>

                        <div className="p-5 bg-slate-50 rounded-xl border border-gray-200">
                            <h6 className="text-base font-semibold text-primary mb-3 text-center">Company Information</h6>
                            <div className="grid grid-cols-12 gap-4 text-center">
                                <div className="col-span-12 md:col-span-4 flex flex-col gap-1 mb-0">
                                    <label className="font-bold text-sm text-gray-600">PAN Number</label>
                                    <div className="p-inputtext p-disabled bg-gray-100 rounded-lg p-2.5 text-gray-700">{user.company?.panNumber || '-'}</div>
                                </div>
                                <div className="col-span-12 md:col-span-4 flex flex-col gap-1 mb-0">
                                    <label className="font-bold text-sm text-gray-600">Company Name</label>
                                    <div className="p-inputtext p-disabled bg-gray-100 rounded-lg p-2.5 text-gray-700">{user.company?.name || '-'}</div>
                                </div>
                                <div className="col-span-12 md:col-span-4 flex flex-col gap-1 mb-0">
                                    <label className="font-bold text-sm text-gray-600">Group Name</label>
                                    <div className="p-inputtext p-disabled bg-gray-100 rounded-lg p-2.5 text-gray-700">{user.groupName || '-'}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Dialog>
        </>
    );
};

export default ViewUser;