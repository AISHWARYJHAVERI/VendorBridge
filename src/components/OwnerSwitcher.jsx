import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../AuthContext';
import api from '../api';

const OwnerSwitcher = ({ onEditProfile }) => {
    const { user, login, selectedYear } = useAuth();
    const [logins, setLogins] = useState([]);
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        api.getLogins().then(setLogins);
    }, []);

    useEffect(() => {
        const handleClick = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const switchOwner = (target) => {
        login({
            id: target.id,
            companyName: target.companyName,
            address: target.address,
            contactNumber: target.contactNumber
        }, selectedYear);
        setOpen(false);
    };

    const others = logins.filter(l => l.id !== user?.id);

    return (
        <div className="relative" ref={ref}>
            <div
                className="inline-flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-gray-200 text-sm font-semibold text-gray-600 cursor-pointer transition-all hover:bg-indigo-50 hover:border-primary hover:-translate-y-0.5 hover:shadow-md select-none"
                onClick={() => setOpen(!open)}
            >
                <i className="pi pi-user text-primary"></i>
                <span>{user?.companyName}</span>
                <i className={`pi pi-chevron-down text-xs transition-transform ${open ? 'rotate-180' : ''}`}></i>
            </div>
            {open && (
                <div className="absolute top-full mt-1 max-md:left-0 md:right-0 w-64 max-md:max-w-[calc(100vw-1.5rem)] max-md:w-auto max-md:min-w-[200px] bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-50 animate-[fadeIn_0.15s_ease-out] max-h-[50vh] overflow-y-auto">
                    <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Switch Owner</div>
                    {others.length === 0 && (
                        <div className="px-3 py-2 text-sm text-gray-400">No other owners available</div>
                    )}
                    {others.map(login => (
                        <div
                            key={login.id}
                            className="px-3 py-2.5 hover:bg-indigo-50 cursor-pointer text-sm text-gray-700 flex items-center gap-2.5 transition-colors border-b border-gray-100 last:border-0"
                            onClick={() => switchOwner(login)}
                        >
                            <i className="pi pi-user text-gray-400 text-xs"></i>
                            <span className="font-medium">{login.companyName}</span>
                        </div>
                    ))}
                    {onEditProfile && (
                        <>
                            <div className="border-t border-gray-100 my-1"></div>
                            <div
                                className="px-3 py-2.5 hover:bg-indigo-50 cursor-pointer text-sm text-gray-700 flex items-center gap-2.5 transition-colors"
                                onClick={() => { setOpen(false); onEditProfile(); }}
                            >
                                <i className="pi pi-pencil text-gray-400 text-xs"></i>
                                <span className="font-medium">Edit Profile</span>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default OwnerSwitcher;
