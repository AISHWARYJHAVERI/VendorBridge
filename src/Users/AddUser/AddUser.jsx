import { useState } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { classNames } from 'primereact/utils';
import { useAuth } from '../../AuthContext';
import api from '../../api';

const formatPAN = (value) => {
    const upper = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    let result = '';
    for (let i = 0; i < upper.length && result.length < 10; i++) {
        const ch = upper[i];
        const pos = result.length;
        if (pos < 5 && /[A-Z]/.test(ch)) {
            result += ch;
        } else if (pos >= 5 && pos < 9 && /[0-9]/.test(ch)) {
            result += ch;
        } else if (pos === 9 && /[A-Z]/.test(ch)) {
            result += ch;
        }
    }
    return result;
};

const AddUser = ({ onUserAdded, showError, showSuccess }) => {
    const { user: ownerUser } = useAuth();
    let emptyUser = {
        firstName: '',
        middleName: '',
        lastName: '',
        mobileNumber: '',
        email: '',
        groupName: '',
        address: {
            houseFlat: '',
            street: '',
            landmark: '',
            city: '',
            zipcode: '',
            state: ''
        },
        company: {
            panNumber: '',
            name: ''
        }
    };

    const [userDialog, setUserDialog] = useState(false);
    const [user, setUser] = useState(emptyUser);
    const [submitted, setSubmitted] = useState(false);

    const openNew = () => {
        setUser(emptyUser);
        setSubmitted(false);
        setUserDialog(true);
    };

    const hideDialog = () => {
        setSubmitted(false);
        setUserDialog(false);
    };

    const isFormValid = () => {
        const emailValid = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(user.email?.trim() || '');
        const mobileValid = /^\d{10}$/.test((user.mobileNumber || '').trim());
        return (
            user.firstName.trim() &&
            user.lastName.trim() &&
            emailValid &&
            mobileValid &&
            user.groupName?.trim() &&
            user.address?.houseFlat?.trim() &&
            user.address?.street?.trim() &&
            user.address?.landmark?.trim() &&
            user.address?.city?.trim() &&
            user.address?.zipcode?.trim() &&
            user.address?.state?.trim() &&
            user.company?.name?.trim() &&
            user.company?.panNumber?.trim()
        );
    };

    const saveUser = async () => {
        setSubmitted(true);
        if (!isFormValid()) return;

        let _user = { ...user };
        _user.firstName = user.firstName.trim();
        _user.middleName = (user.middleName || '').trim();
        _user.lastName = user.lastName.trim();
        _user.mobileNumber = (user.mobileNumber || '').trim();
        _user.email = (user.email || '').trim();
        _user.groupName = (user.groupName || '').trim();
        if (_user.address) {
            Object.keys(_user.address).forEach(k => {
                _user.address[k] = (_user.address[k] || '').trim();
            });
        }
        if (_user.company) {
            _user.company.name = (_user.company.name || '').trim();
            _user.company.panNumber = (_user.company.panNumber || '').trim();
        }
        _user.name = `${_user.firstName} ${_user.lastName}`;
        _user.username = _user.middleName;
        _user.phone = _user.mobileNumber;
        _user.ownerId = ownerUser.id;

        try {
            const newUser = await api.addUser(_user);
            showSuccess("User Created Successfully");
            onUserAdded(newUser);
            setUserDialog(false);
            setUser(emptyUser);
        } catch {
            showError("Error saving user");
        }
    };

    const onInputChange = (e, name) => {
        const val = (e.target && e.target.value) || '';
        let _user = { ...user };

        if (name.includes('.')) {
            const keys = name.split('.');
            if (keys.length === 2) {
                _user[keys[0]] = {
                    ..._user[keys[0]],
                    [keys[1]]: val
                };
            } else if (keys.length === 3) {
                _user[keys[0]] = {
                    ..._user[keys[0]],
                    [keys[1]]: {
                        ..._user[keys[0]][keys[1]],
                        [keys[2]]: val
                    }
                };
            }
        } else {
            _user[name] = val;
        }

        setUser(_user);
    };

    const userDialogFooter = (
        <div className="flex justify-center gap-3 mt-4">
            <Button label="Save User Details" icon="pi pi-check" className="!bg-gradient-to-r !from-success !to-emerald-600 !text-white !font-semibold !rounded-lg !px-5 !py-2.5 !shadow-md hover:!shadow-lg hover:!-translate-y-0.5 !transition-all !border-none" onClick={saveUser} />
            <Button label="Cancel" icon="pi pi-times" className="!bg-gradient-to-r !from-red-500 !to-red-600 !text-white !font-semibold !rounded-lg !px-5 !py-2.5 !shadow-md hover:!shadow-lg hover:!-translate-y-0.5 !transition-all !border-none" onClick={hideDialog} />
        </div>
    );

    return (
        <>
            <Button label="Add New" icon="pi pi-plus" className="!bg-gradient-to-r !from-primary !to-primary-dark !text-white !font-semibold !rounded-lg !px-3 !py-2 !text-sm !shadow-md hover:!shadow-lg hover:!-translate-y-0.5 !transition-all !border-none whitespace-nowrap !h-8 md:!text-xs md:!px-2 md:!py-1.5 md:!h-8" onClick={openNew} />

            <Dialog visible={userDialog} style={{ width: '950px' }} header="Add New User" modal className="p-fluid" footer={userDialogFooter} onHide={hideDialog} draggable={false} resizable={false} blockScroll>

                <div className="flex flex-col gap-6">
                    <div className="p-5 bg-slate-50 rounded-xl border border-gray-200">
                        <h6 className="text-base font-semibold text-primary mb-3 text-center">Primary User Information</h6>
                        <div className="grid grid-cols-12 gap-4">
                            <div className="col-span-12 md:col-span-4 flex flex-col gap-1">
                                <label htmlFor="firstName" className="font-bold text-sm text-gray-700">First Name</label>
                                <InputText id="firstName" value={user.firstName} onChange={(e) => onInputChange(e, 'firstName')} required autoFocus className={classNames({ 'p-invalid': submitted && !user.firstName })} maxLength={50} />
                                {submitted && !user.firstName && <small className="p-error">First Name is required.</small>}
                            </div>
                            <div className="col-span-12 md:col-span-4 flex flex-col gap-1">
                                <label htmlFor="middleName" className="font-bold text-sm text-gray-700">Middle Name</label>
                                <InputText id="middleName" value={user.middleName} onChange={(e) => onInputChange(e, 'middleName')} maxLength={50} />
                            </div>
                            <div className="col-span-12 md:col-span-4 flex flex-col gap-1">
                                <label htmlFor="lastName" className="font-bold text-sm text-gray-700">Last Name</label>
                                <InputText id="lastName" value={user.lastName} onChange={(e) => onInputChange(e, 'lastName')} required className={classNames({ 'p-invalid': submitted && !user.lastName })} maxLength={50} />
                                {submitted && !user.lastName && <small className="p-error">Last Name is required.</small>}
                            </div>
                            <div className="col-span-12 md:col-span-6 flex flex-col gap-1">
                                <label htmlFor="mobileNumber" className="font-bold text-sm text-gray-700">Phone Number</label>
                                <InputText id="mobileNumber" value={user.mobileNumber} onChange={(e) => onInputChange({ target: { value: e.target.value.replace(/\D/g, '').slice(0, 10) } }, 'mobileNumber')} required maxLength={10} className={classNames({ 'p-invalid': submitted && !/^\d{10}$/.test(user.mobileNumber || '') })} />
                                {submitted && !user.mobileNumber && <small className="p-error">Phone Number is required.</small>}
                                {submitted && user.mobileNumber && !/^\d{10}$/.test(user.mobileNumber) && <small className="p-error">Phone must be exactly 10 digits.</small>}
                            </div>
                            <div className="col-span-12 md:col-span-6 flex flex-col gap-1">
                                <label htmlFor="email" className="font-bold text-sm text-gray-700">Email</label>
                                <InputText id="email" value={user.email} onChange={(e) => onInputChange(e, 'email')} required className={classNames({ 'p-invalid': submitted && (!user.email || !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(user.email)) })} maxLength={50} />
                                {submitted && !user.email && <small className="p-error">Email is required.</small>}
                                {submitted && user.email && !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(user.email) && <small className="p-error">Invalid email format (e.g. xyz@gmail.com).</small>}
                            </div>
                        </div>
                    </div>

                    <div className="p-5 bg-slate-50 rounded-xl border border-gray-200">
                        <h6 className="text-base font-semibold text-primary mb-3 text-center">Address Section</h6>
                        <div className="grid grid-cols-12 gap-4">
                            <div className="col-span-12 md:col-span-4 flex flex-col gap-1">
                                <label htmlFor="houseFlat" className="font-bold text-sm text-gray-700">House / Flat</label>
                                <InputText id="houseFlat" value={user.address?.houseFlat || ''} onChange={(e) => onInputChange(e, 'address.houseFlat')} required className={classNames({ 'p-invalid': submitted && !user.address?.houseFlat?.trim() })} maxLength={50} />
                                {submitted && !user.address?.houseFlat?.trim() && <small className="p-error">House / Flat is required.</small>}
                            </div>
                            <div className="col-span-12 md:col-span-4 flex flex-col gap-1">
                                <label htmlFor="street" className="font-bold text-sm text-gray-700">Street</label>
                                <InputText id="street" value={user.address?.street || ''} onChange={(e) => onInputChange(e, 'address.street')} required className={classNames({ 'p-invalid': submitted && !user.address?.street?.trim() })} maxLength={50} />
                                {submitted && !user.address?.street?.trim() && <small className="p-error">Street is required.</small>}
                            </div>
                            <div className="col-span-12 md:col-span-4 flex flex-col gap-1">
                                <label htmlFor="landmark" className="font-bold text-sm text-gray-700">Landmark</label>
                                <InputText id="landmark" value={user.address?.landmark || ''} onChange={(e) => onInputChange(e, 'address.landmark')} required className={classNames({ 'p-invalid': submitted && !user.address?.landmark?.trim() })} maxLength={50} />
                                {submitted && !user.address?.landmark?.trim() && <small className="p-error">Landmark is required.</small>}
                            </div>
                            <div className="col-span-12 md:col-span-4 flex flex-col gap-1 mb-0">
                                <label htmlFor="city" className="font-bold text-sm text-gray-700">City</label>
                                <InputText id="city" value={user.address?.city || ''} onChange={(e) => onInputChange(e, 'address.city')} required className={classNames({ 'p-invalid': submitted && !user.address?.city?.trim() })} maxLength={50} />
                                {submitted && !user.address?.city?.trim() && <small className="p-error">City is required.</small>}
                            </div>
                            <div className="col-span-12 md:col-span-4 flex flex-col gap-1 mb-0">
                                <label htmlFor="zipcode" className="font-bold text-sm text-gray-700">Zipcode</label>
                                <InputText id="zipcode" value={user.address?.zipcode || ''} onChange={(e) => onInputChange(e, 'address.zipcode')} required className={classNames({ 'p-invalid': submitted && !user.address?.zipcode?.trim() })} maxLength={50} />
                                {submitted && !user.address?.zipcode?.trim() && <small className="p-error">Zipcode is required.</small>}
                            </div>
                            <div className="col-span-12 md:col-span-4 flex flex-col gap-1 mb-0">
                                <label htmlFor="state" className="font-bold text-sm text-gray-700">State</label>
                                <InputText id="state" value={user.address?.state || ''} onChange={(e) => onInputChange(e, 'address.state')} required className={classNames({ 'p-invalid': submitted && !user.address?.state?.trim() })} maxLength={50} />
                                {submitted && !user.address?.state?.trim() && <small className="p-error">State is required.</small>}
                            </div>
                        </div>
                    </div>

                    <div className="p-5 bg-slate-50 rounded-xl border border-gray-200">
                        <h6 className="text-base font-semibold text-primary mb-3 text-center">Company Information</h6>
                        <div className="grid grid-cols-12 gap-4">
                            <div className="col-span-12 md:col-span-4 flex flex-col gap-1 mb-0">
                                <label htmlFor="panNumber" className="font-bold text-sm text-gray-700">PAN Number</label>
                                <InputText id="panNumber" value={user.company?.panNumber || ''} onChange={(e) => onInputChange({ target: { value: formatPAN(e.target.value) } }, 'company.panNumber')} required className={classNames({ 'p-invalid': submitted && !user.company?.panNumber?.trim() })} maxLength={10} />
                                {submitted && !user.company?.panNumber?.trim() && <small className="p-error">PAN Number is required.</small>}
                            </div>
                            <div className="col-span-12 md:col-span-4 flex flex-col gap-1 mb-0">
                                <label htmlFor="companyName" className="font-bold text-sm text-gray-700">Company Name</label>
                                <InputText id="companyName" value={user.company?.name || ''} onChange={(e) => onInputChange(e, 'company.name')} required className={classNames({ 'p-invalid': submitted && !user.company?.name?.trim() })} maxLength={50} />
                                {submitted && !user.company?.name?.trim() && <small className="p-error">Company Name is required.</small>}
                            </div>
                            <div className="col-span-12 md:col-span-4 flex flex-col gap-1 mb-0">
                                <label htmlFor="groupName" className="font-bold text-sm text-gray-700">Group Name</label>
                                <InputText id="groupName" value={user.groupName || ''} onChange={(e) => onInputChange(e, 'groupName')} required className={classNames({ 'p-invalid': submitted && !user.groupName?.trim() })} maxLength={50} />
                                {submitted && !user.groupName?.trim() && <small className="p-error">Group Name is required.</small>}
                            </div>
                        </div>
                    </div>
                </div>

            </Dialog>
        </>
    );
};

export default AddUser;
