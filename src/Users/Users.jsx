import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { AutoComplete } from 'primereact/autocomplete';
import { Toast } from 'primereact/toast';
import { useAuth } from '../AuthContext';
import api from '../api';
import OwnerSwitcher from '../components/OwnerSwitcher';

import AddUser from './AddUser/AddUser';
import EditUser from './EditUser/EditUser';
import ViewUser from './ViewUser/ViewUser';
import DeleteUser from './DeleteUser/DeleteUser';
import ImportUsers from './ImportUsers/ImportUsers';

function Users() {
    const [users, setUsers] = useState([]);
    const [globalFilter, setGlobalFilter] = useState(null);
    const [searchValue, setSearchValue] = useState('');
    const [filteredSearchUsers, setFilteredSearchUsers] = useState([]);
    const toast = useRef(null);
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const showError = (detail) => {
        toast.current?.show({ severity: 'error', summary: 'Error', detail, life: 3000 });
    };

    const showSuccess = (detail) => {
        toast.current?.show({ severity: 'success', summary: 'Successful', detail, life: 3000 });
    };

    useEffect(() => {
        if (!user?.id) return;
        api.getUsers().then(setUsers);
    }, [user]);

    const handleUserAdded = (newUser) => {
        setUsers([...users, newUser]);
    };

    const handleUserUpdated = (updatedUser) => {
        const index = users.findIndex(u => u.id === updatedUser.id);
        if (index !== -1) {
            const _users = [...users];
            _users[index] = updatedUser;
            setUsers(_users);
        }
    };

    const handleUserDeleted = (deletedUserId) => {
        setUsers(users.filter(u => u.id !== deletedUserId));
    };

    const searchUsers = (event) => {
        setTimeout(() => {
            const query = event.query.toLowerCase().trim();
            if (!query) {
                setFilteredSearchUsers([]);
                return;
            }
            const _filtered = [];
            users.forEach(u => {
                const fullName = `${u.firstName || ''} ${u.lastName || ''}`.trim().toLowerCase();
                const email = (u.email || '').toLowerCase();
                const phone = (u.mobileNumber || u.phone || '').toLowerCase();
                const company = (u.company?.name || '').toLowerCase();
                const group = (u.groupName || '').toLowerCase();

                if (fullName.includes(query) || email.includes(query) || phone.includes(query) || company.includes(query) || group.includes(query)) {
                    _filtered.push({
                        label: `${u.firstName || ''} ${u.lastName || ''}`.trim(),
                        sub: u.email || u.mobileNumber || '',
                        user: u
                    });
                }
            });
            const seen = new Set();
            const unique = _filtered.filter(item => {
                if (seen.has(item.user.id)) return false;
                seen.add(item.user.id);
                return true;
            });
            setFilteredSearchUsers(unique);
        }, 200);
    };

    const onSearchChange = (e) => {
        if (typeof e.value === 'string') {
            setSearchValue(e.value);
            setGlobalFilter(e.value || null);
        } else {
            const selected = e.value;
            setSearchValue(selected.label);
            setGlobalFilter(selected.label);
        }
    };

    const searchItemTemplate = (item) => (
        <div className="flex items-center w-full justify-between gap-2">
            <div className="flex flex-col">
                <span className="font-medium text-sm">{item.label}</span>
                {item.sub && <span className="text-xs text-gray-400">{item.sub}</span>}
            </div>
        </div>
    );

    const actionBodyTemplate = (rowData) => {
        return (
            <div className="flex gap-2 justify-center">
                <ViewUser rowData={rowData} />
                <EditUser rowData={rowData} onUserUpdated={handleUserUpdated} showError={showError} showSuccess={showSuccess} />
                <DeleteUser rowData={rowData} onUserDeleted={handleUserDeleted} showSuccess={showSuccess} />
            </div>
        );
    };

    const firstNameBodyTemplate = (rowData) => {
        return rowData.firstName || (rowData.name ? rowData.name.split(' ')[0] : '');
    };

    const lastNameBodyTemplate = (rowData) => {
        return rowData.lastName || (rowData.name ? rowData.name.split(' ').slice(1).join(' ') : '');
    };

    const phoneBodyTemplate = (rowData) => {
        return rowData.phone || `${rowData.phoneCountryCode || ''} ${rowData.mobileNumber || ''}`.trim();
    };

    const companyBodyTemplate = (rowData) => {
        return rowData.company?.name || '';
    };

    const groupNameBodyTemplate = (rowData) => {
        return rowData.groupName || '';
    };

    const header = (
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-4 mb-4 md:mb-5">
            <div className="flex items-center gap-3 md:gap-4 w-full md:w-auto">
                <button 
                    className="w-9 h-9 md:w-10 md:h-10 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-400 text-base md:text-lg hover:text-primary hover:border-primary hover:-translate-x-1 transition-all shadow-sm cursor-pointer flex-shrink-0 font-sans" 
                    onClick={() => navigate('/dashboard')}
                    title="Back to Dashboard"
                >
                    <i className="pi pi-arrow-left"></i>
                </button>
                <h4 className="m-0 text-sm md:text-base font-semibold text-gray-600 uppercase tracking-wide">Manage Users</h4>
                {user && <OwnerSwitcher />}
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full md:flex-1">
                <div className="relative w-full min-w-0">
                    <i className="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
                    <AutoComplete
                        value={searchValue}
                        suggestions={filteredSearchUsers}
                        completeMethod={searchUsers}
                        onChange={onSearchChange}
                        itemTemplate={searchItemTemplate}
                        placeholder="Search by name, email, phone..."
                        className="w-full [&_.p-autocomplete-input]:!w-full [&_.p-autocomplete-input]:!pl-9 [&_.p-autocomplete-input]:!rounded-lg md:[&_.p-autocomplete-input]:!h-10"
                    />
                </div>
                <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto max-sm:[&_.p-button]:!w-full">
                    <ImportUsers onImportComplete={() => api.getUsers().then(setUsers)} showError={showError} showSuccess={showSuccess} />
                    <AddUser onUserAdded={handleUserAdded} showError={showError} showSuccess={showSuccess} />
                    <Button label="Logout" icon="pi pi-sign-out" className="!bg-gradient-to-r !from-red-500 !to-red-600 !text-white !font-semibold !rounded-lg !text-sm !shadow-md hover:!shadow-lg hover:!-translate-y-0.5 !transition-all !border-none !px-3 !py-2 !h-8 md:!text-xs md:!px-2 md:!py-1.5 md:!h-8 whitespace-nowrap" onClick={() => { logout(); navigate('/login', { replace: true }); }} />
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen p-2 md:p-4 lg:p-6 max-w-7xl mx-auto flex justify-center items-start bg-gradient-to-br from-indigo-50 to-blue-50 animate-[fadeIn_0.5s_ease-out]">
            <Toast ref={toast} />

            <div className="w-full bg-white/95 backdrop-blur rounded-2xl p-4 md:p-6 lg:p-8 shadow-md border border-white/60">
                <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-800 mb-4 md:mb-5 pb-2 md:pb-3 relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:h-1 after:w-12 after:bg-gradient-to-r after:from-primary after:to-primary-light after:rounded">
                    User Management Dashboard
                </h2>

                <DataTable value={users} header={header} globalFilter={globalFilter} paginator rows={10}
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
                    currentPageReportTemplate="Showing {first} to {last} of {totalRecords} users"
                    className="p-datatable-users [&_.p-datatable-wrapper]:rounded-xl [&_.p-datatable-wrapper]:min-h-[750px] [&_.p-datatable-wrapper]:overflow-hidden [&_.p-datatable-wrapper]:border [&_.p-datatable-wrapper]:border-gray-200 [&_.p-datatable-header]:bg-transparent [&_.p-datatable-header]:border-none [&_.p-datatable-header]:p-0 [&_.p-datatable-thead>tr>th]:bg-slate-50 [&_.p-datatable-thead>tr>th]:text-gray-600 [&_.p-datatable-thead>tr>th]:p-3 md:[&_.p-datatable-thead>tr>th]:p-4 [&_.p-datatable-thead>tr>th]:font-semibold [&_.p-datatable-thead>tr>th]:text-xs md:text-sm [&_.p-datatable-thead>tr>th]:uppercase [&_.p-datatable-thead>tr>th]:tracking-wide [&_.p-datatable-thead>tr>th]:border-b-2 [&_.p-datatable-thead>tr>th]:border-gray-200 [&_.p-datatable-tbody>tr]:bg-white [&_.p-datatable-tbody>tr:hover]:bg-slate-50 [&_.p-datatable-tbody>tr:hover]:scale-[1.002] [&_.p-datatable-tbody>tr:hover]:shadow-sm [&_.p-datatable-tbody>tr:hover]:relative [&_.p-datatable-tbody>tr:hover]:z-10 [&_.p-datatable-tbody>tr>td]:p-3 md:[&_.p-datatable-tbody>tr>td]:p-4 [&_.p-datatable-tbody>tr>td]:text-sm md:text-base [&_.p-datatable-tbody>tr>td]:border-b [&_.p-datatable-tbody>tr>td]:border-gray-100 [&_.p-datatable-tbody>tr>td]:text-gray-700 [&_.p-datatable-tbody>tr>td]:align-middle"
                    emptyMessage="No users found."
                    responsiveLayout="scroll">
                    <Column field="id" header="ID" align="center" style={{ width: '10%' }}></Column>
                    <Column field="firstName" header="First Name" body={firstNameBodyTemplate} align="center" style={{ width: '15%' }}></Column>
                    <Column field="lastName" header="Last Name" body={lastNameBodyTemplate} align="center" style={{ width: '15%' }}></Column>
                    <Column field="email" header="Email" align="center" style={{ width: '20%' }}></Column>
                    <Column field="mobileNumber" header="Phone" body={phoneBodyTemplate} align="center" style={{ width: '15%' }}></Column>
                    <Column field="company.name" header="Company" body={companyBodyTemplate} align="center" style={{ width: '10%' }}></Column>
                    <Column field="groupName" header="Group" body={groupNameBodyTemplate} align="center" style={{ width: '10%' }}></Column>
                    <Column body={actionBodyTemplate} exportable={false} align="center" style={{ width: '15%' }} header="Actions"></Column>
                </DataTable>
            </div>
        </div>
    );
}

export default Users;