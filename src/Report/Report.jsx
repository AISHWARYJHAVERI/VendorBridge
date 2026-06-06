import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { AutoComplete } from 'primereact/autocomplete';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { useAuth } from '../AuthContext';
import api from '../api';
import OwnerSwitcher from '../components/OwnerSwitcher';
import * as XLSX from 'xlsx';

const numberToWords = (num) => {
    if (num === 0) return 'Zero';
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    if ((num = num.toString()).length > 9) return 'overflow';
    const n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return '';
    let str = '';
    str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
    str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
    str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
    str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
    str += (n[5] != 0) ? ((str !== '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
    return str.trim();
};

const fmtINR = (val) => (Number(val) || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' });

const parseDate = (str) => {
    if (!str || !/^\d{2}\/\d{2}\/\d{4}$/.test(str)) return null;
    const [d, m, y] = str.split('/').map(Number);
    return new Date(y, m - 1, d);
};

const formatDate = (d) => {
    if (!d) return '';
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

const generateYears = () => {
    const years = [];
    const currentYear = new Date().getFullYear();
    for (let i = -3; i <= 1; i++) {
        const y = currentYear + i;
        const label = `${y}-${(y + 1).toString().slice(-2)}`;
        years.push({ label, value: label });
    }
    return years;
};

const getCurrentFinancialYear = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    if (month >= 4) return `${year}-${(year + 1).toString().slice(-2)}`;
    return `${year - 1}-${year.toString().slice(-2)}`;
};

const invoiceTypeOptions = [
    { label: 'All', value: 'all' },
    { label: 'Cash Memo', value: 'Cash Memo' },
    { label: 'Credit Memo', value: 'Credit Memo' }
];

const yearOptions = generateYears();

const Report = () => {
    const navigate = useNavigate();
    const toast = useRef(null);
    const { user, logout, selectedYear: authYear } = useAuth();

    const [bills, setBills] = useState([]);
    const [users, setUsers] = useState([]);
    const [logins, setLogins] = useState([]);
    const [filteredBills, setFilteredBills] = useState([]);

    const [searchValue, setSearchValue] = useState('');
    const [filteredSearch, setFilteredSearch] = useState([]);
    const [selectedSuggestion, setSelectedSuggestion] = useState(null);

    const [yearFilter, setYearFilter] = useState(authYear || getCurrentFinancialYear());
    const [invoiceTypeFilter, setInvoiceTypeFilter] = useState('all');
    const [dateFrom, setDateFrom] = useState(formatDate(new Date()));
    const [dateTo, setDateTo] = useState(formatDate(new Date()));

    const [billNoValue, setBillNoValue] = useState('');
    const [filteredBillNos, setFilteredBillNos] = useState([]);

    const [printBill, setPrintBill] = useState(null);
    const printedRef = useRef(false);

    useEffect(() => {
        if (!printBill) return;
        printedRef.current = false;
        const timer = setTimeout(() => window.print(), 300);
        const afterPrint = () => {
            if (printedRef.current) return;
            printedRef.current = true;
            setPrintBill(null);
        };
        window.addEventListener('afterprint', afterPrint);
        const fallback = setTimeout(() => {
            if (!printedRef.current) {
                printedRef.current = true;
                setPrintBill(null);
            }
        }, 15000);
        return () => {
            clearTimeout(timer);
            clearTimeout(fallback);
            window.removeEventListener('afterprint', afterPrint);
        };
    }, [printBill]);

    const handlePrintBill = (bill) => {
        setPrintBill(bill);
    };

    useEffect(() => {
        if (!user?.id) return;
        Promise.all([
            api.getBills(),
            api.getUsers(),
            api.getLogins()
        ]).then(([b, u, l]) => {
            setBills(b);
            setUsers(u);
            setLogins(l);
        });
    }, [user]);

    const applyFilters = useCallback(() => {
        let result = [...bills];

        if (yearFilter) {
            result = result.filter(b => {
                const year = b.items?.[0]?.year;
                return year === yearFilter;
            });
        }

        if (invoiceTypeFilter && invoiceTypeFilter !== 'all') {
            result = result.filter(b => b.invoiceType === invoiceTypeFilter);
        }

        const hasOtherFilter = selectedSuggestion || searchValue.trim() || billNoValue.trim() || (invoiceTypeFilter && invoiceTypeFilter !== 'all');

        if (!hasOtherFilter) {
            if (dateFrom) {
                const from = parseDate(dateFrom);
                if (from) result = result.filter(b => {
                    const bd = parseDate(b.date);
                    return bd && bd >= from;
                });
            }

            if (dateTo) {
                const to = parseDate(dateTo);
                if (to) {
                    to.setHours(23, 59, 59, 999);
                    result = result.filter(b => {
                        const bd = parseDate(b.date);
                        return bd && bd <= to;
                    });
                }
            }
        }

        if (selectedSuggestion) {
            const sug = selectedSuggestion;
            if (sug.type === 'Group') {
                const groupUsers = users.filter(u => u.groupName === sug.groupName);
                const names = new Set();
                groupUsers.forEach(u => {
                    const fn = `${u.firstName || ''} ${u.lastName || ''}`.trim();
                    if (fn) names.add(fn.toLowerCase());
                    if (u.company?.name) names.add(u.company.name.toLowerCase());
                });
                result = result.filter(b => {
                    const name = (b.customerName || '').toLowerCase();
                    for (const n of names) { if (name.includes(n)) return true; }
                    return false;
                });
            } else if (sug.type === 'Phone') {
                const phone = (sug.user?.mobileNumber || '').toLowerCase();
                result = result.filter(b => (b.customerPhone || '').toLowerCase().includes(phone));
            } else {
                const matchNames = new Set();
                if (sug.user) {
                    const fn = `${sug.user.firstName || ''} ${sug.user.lastName || ''}`.trim();
                    if (fn) matchNames.add(fn.toLowerCase());
                    if (sug.user.company?.name) matchNames.add(sug.user.company.name.toLowerCase());
                }
                result = result.filter(b => {
                    const name = (b.customerName || '').toLowerCase();
                    for (const m of matchNames) { if (name.includes(m)) return true; }
                    return false;
                });
            }
        } else if (searchValue.trim()) {
            const q = searchValue.trim().toLowerCase();
            result = result.filter(b =>
                (b.customerName || '').toLowerCase().includes(q) ||
                (b.customerPhone || '').toLowerCase().includes(q)
            );
        }

        if (billNoValue) {
            const q = billNoValue.trim();
            result = result.filter(b => (b.billNo?.toString() || '').includes(q));
        }

        setFilteredBills(result);
    }, [bills, yearFilter, invoiceTypeFilter, dateFrom, dateTo, selectedSuggestion, searchValue, billNoValue, users]);

    useEffect(() => { applyFilters(); }, [applyFilters]);

    const searchSuggestions = (event) => {
        setTimeout(() => {
            const query = event.query.trim().toLowerCase();
            if (!query) { setFilteredSearch([]); return; }
            const results = [];
            users.forEach(u => {
                const fullName = `${u.firstName || ''} ${u.lastName || ''}`.trim();
                const companyName = u.company?.name || '';
                const groupName = u.groupName || '';
                const phone = u.mobileNumber || '';

                if (fullName && fullName.toLowerCase().includes(query)) {
                    results.push({ label: fullName + (phone ? ` - ${phone}` : ''), type: 'Name', user: u, groupName: '' });
                }
                if (companyName && companyName.toLowerCase().includes(query)) {
                    results.push({ label: `${companyName} (Company)`, type: 'Company', user: u, groupName: '' });
                }
                if (groupName && groupName.toLowerCase().includes(query)) {
                    results.push({ label: `Group: ${groupName}`, type: 'Group', user: u, groupName });
                }
                if (phone && phone.toLowerCase().includes(query)) {
                    results.push({ label: `${fullName || companyName} - ${phone}`, type: 'Phone', user: u, groupName: '' });
                }
            });
            const seen = new Set();
            const unique = results.filter(r => {
                const key = r.type + '|' + (r.user?.id || '') + '|' + (r.groupName || '');
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            });
            setFilteredSearch(unique);
        }, 200);
    };

    const searchItemTemplate = (item) => (
        <div className="flex items-center w-full justify-between gap-2 whitespace-nowrap">
            <div className="flex flex-col min-w-0">
                <span className="font-medium text-sm">{item.label}</span>
            </div>
            <small className="shrink-0" style={{ color: '#64748b', backgroundColor: '#f1f5f9', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                {item.type}
            </small>
        </div>
    );

    const onSearchChange = (e) => {
        if (typeof e.value === 'string') {
            setSearchValue(e.value);
            setSelectedSuggestion(null);
        } else {
            setSearchValue(e.value.label);
            setSelectedSuggestion(e.value);
        }
    };

    const searchBillNos = (event) => {
        setTimeout(() => {
            const query = event.query.trim();
            if (!query) { setFilteredBillNos([]); return; }
            const _filtered = bills.filter(b => b.billNo?.toString().includes(query));
            setFilteredBillNos(_filtered);
        }, 200);
    };

    const onBillNoChange = (e) => {
        if (typeof e.value === 'string') {
            setBillNoValue(e.value);
        } else {
            setBillNoValue(e.value.billNo?.toString() || '');
        }
    };

    const billNoItemTemplate = (bill) => (
        <div className="flex justify-between w-full">
            <strong>Bill No: {bill.billNo}</strong>
            <span style={{ color: '#64748b', fontSize: '0.85rem' }}>{bill.customerName} ({bill.date})</span>
        </div>
    );

    const clearFilters = () => {
        setSearchValue('');
        setSelectedSuggestion(null);
        setInvoiceTypeFilter('all');
        const today = formatDate(new Date());
        setDateFrom(today);
        setDateTo(today);
        setBillNoValue('');
        setYearFilter(authYear || getCurrentFinancialYear());
    };

    const exportCSV = () => {
        if (!filteredBills.length) {
            toast.current?.show({ severity: 'warn', summary: 'No Data', detail: 'No bills to export.', life: 2000 });
            return;
        }
        const headers = ['Bill No', 'Date', 'Customer Name', 'Phone', 'Invoice Type', 'Year', 'Items', 'Grand Total'];
        const rows = filteredBills.map(b => [
            b.billNo,
            b.date,
            `"${(b.customerName || '').replace(/"/g, '""')}"`,
            b.customerPhone || '',
            b.invoiceType || '',
            b.items?.[0]?.year || '',
            b.items?.length || 0,
            Number(b.grandTotal || 0).toFixed(2)
        ]);
        const BOM = '\uFEFF';
        const csv = BOM + headers.join(',') + '\n' + rows.map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report_${formatDate(new Date()).replace(/\//g, '-')}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.current?.show({ severity: 'success', summary: 'Exported', detail: 'CSV file downloaded.', life: 2000 });
    };

    const exportExcel = () => {
        if (!filteredBills.length) {
            toast.current?.show({ severity: 'warn', summary: 'No Data', detail: 'No bills to export.', life: 2000 });
            return;
        }
        const data = filteredBills.map(b => ({
            'Bill No': b.billNo,
            'Date': b.date,
            'Customer Name': b.customerName || '',
            'Phone': b.customerPhone || '',
            'Invoice Type': b.invoiceType || '',
            'Year': b.items?.[0]?.year || '',
            'Items': b.items?.length || 0,
            'Grand Total': Number(b.grandTotal || 0)
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Bills');
        XLSX.writeFile(wb, `report_${formatDate(new Date()).replace(/\//g, '-')}.xlsx`);
        toast.current?.show({ severity: 'success', summary: 'Exported', detail: 'Excel file downloaded.', life: 2000 });
    };

    const invoiceTypeBody = (rowData) => {
        const isCash = rowData.invoiceType === 'Cash Memo';
        return (
            <span className={`inline-flex px-2 py-0.5 text-xs font-bold rounded-full ${isCash ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                {rowData.invoiceType || 'Credit Memo'}
            </span>
        );
    };

    const actionBody = (rowData) => (
        <Button
            icon="pi pi-print"
            className="!w-9 !h-9 !rounded-lg !bg-indigo-50 !text-primary !border !border-indigo-200 hover:!bg-indigo-100 hover:!-translate-y-0.5 !transition-all !shadow-sm"
            onClick={() => handlePrintBill(rowData)}
            title="Print Bill"
        />
    );

    const grandTotalBody = (rowData) => (
        <span className="font-bold text-gray-800">{fmtINR(rowData.grandTotal)}</span>
    );

    const itemsBody = (rowData) => (
        <span className="text-gray-600">{rowData.items?.length || 0}</span>
    );

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
                <h4 className="m-0 text-sm md:text-base font-semibold text-gray-600 uppercase tracking-wide">Bills Report</h4>
                {user && <OwnerSwitcher />}
            </div>
            <div className="flex items-center gap-2 sm:gap-3 w-full md:w-auto flex-wrap">
                <Button label="Clear Filters" icon="pi pi-filter-slash" className="!bg-gradient-to-r !from-gray-500 !to-gray-600 !text-white !font-semibold !rounded-lg !text-xs md:!text-sm !shadow-md hover:!shadow-lg hover:!-translate-y-0.5 !transition-all !border-none !px-3 !py-1.5 md:!px-4 md:!py-2" onClick={clearFilters} />
                <Button label="Excel" icon="pi pi-file" className="!bg-gradient-to-r !from-blue-600 !to-blue-700 !text-white !font-semibold !rounded-lg !text-xs md:!text-sm !shadow-md hover:!shadow-lg hover:!-translate-y-0.5 !transition-all !border-none !px-3 !py-1.5 md:!px-4 md:!py-2" onClick={exportExcel} />
                <Button label="Logout" icon="pi pi-sign-out" className="!bg-gradient-to-r !from-red-500 !to-red-600 !text-white !font-semibold !rounded-lg !text-xs md:!text-sm !shadow-md hover:!shadow-lg hover:!-translate-y-0.5 !transition-all !border-none !px-3 !py-1.5 md:!px-4 md:!py-2" onClick={() => { logout(); navigate('/login', { replace: true }); }} />
            </div>
        </div>
    );

    const totalGrand = filteredBills.reduce((sum, b) => sum + Number(b.grandTotal || 0), 0);

    return (
        <div className="min-h-screen p-2 md:p-4 lg:p-6 max-w-7xl mx-auto flex justify-center items-start bg-gradient-to-br from-indigo-50 to-blue-50 animate-[fadeIn_0.5s_ease-out]">
            <Toast ref={toast} />

            <div className="w-full bg-white/95 backdrop-blur rounded-2xl p-3 md:p-6 lg:p-8 shadow-md border border-white/60 flex flex-col no-print">
                <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-800 mb-3 md:mb-4 pb-2 md:pb-3 relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:h-1 after:w-12 after:bg-gradient-to-r after:from-primary after:to-primary-light after:rounded">
                    Report Section
                    <span className="inline-flex items-center ml-1 md:ml-3 px-1.5 py-0.5 md:px-3 md:py-1 bg-gradient-to-r from-sky-500 to-sky-600 text-white text-[10px] md:text-sm font-bold rounded-full shadow-md align-middle whitespace-nowrap">
                        {yearFilter}
                    </span>
                </h2>

                {header}

                <div className="flex flex-col gap-3 mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-[6fr_2fr_2fr] gap-2 md:gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1 !pl-3">Search (Name/Company/Group/Phone)</label>
                            <div className="relative">
                                <i className="pi pi-search absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 z-10 text-sm pointer-events-none" />
                                <AutoComplete
                                    value={searchValue}
                                    suggestions={filteredSearch}
                                    completeMethod={searchSuggestions}
                                    onChange={onSearchChange}
                                    itemTemplate={searchItemTemplate}
                                    placeholder="Type to search..."
                                    panelClassName="!rounded-xl !shadow-lg !border !border-gray-200 !mt-1.5 !min-w-[500px]"
                                    className="!w-full [&_.p-autocomplete-input]:!w-full [&_.p-autocomplete-input]:!pl-10 [&_.p-autocomplete-input]:!rounded-lg [&_.p-autocomplete-input]:!py-3 [&_.p-autocomplete-input]:!text-sm [&_.p-autocomplete-input]:!bg-gray-50 [&_.p-autocomplete-input]:!border [&_.p-autocomplete-input]:!border-gray-300 [&_.p-autocomplete-input]:hover:!border-indigo-400 [&_.p-autocomplete-input]:focus:!border-indigo-500 [&_.p-autocomplete-input]:focus:!ring-2 [&_.p-autocomplete-input]:focus:!ring-indigo-200 [&_.p-autocomplete-input]:!transition-all [&_.p-autocomplete-input]:!shadow-sm [&_.p-autocomplete-input]:!outline-none"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1 !pl-3">Year</label>
                            <Dropdown
                                value={yearFilter}
                                options={yearOptions}
                                onChange={(e) => setYearFilter(e.value)}
                                className="w-full [&_.p-dropdown-label]:text-center [&_.p-dropdown-label]:font-bold [&_.p-dropdown-label]:text-gray-700 [&_.p-dropdown-trigger]:hidden [&_.p-dropdown]:rounded-lg"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1 !pl-3">Invoice Type</label>
                            <Dropdown
                                value={invoiceTypeFilter}
                                options={invoiceTypeOptions}
                                onChange={(e) => setInvoiceTypeFilter(e.value)}
                                className="w-full [&_.p-dropdown-label]:text-center [&_.p-dropdown-label]:font-bold [&_.p-dropdown-label]:text-gray-700 [&_.p-dropdown]:rounded-lg"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2 md:gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1 !pl-3">Date From (DD/MM/YYYY)</label>
                            <InputText
                                value={dateFrom}
                                onChange={(e) => { const v = e.target.value.replace(/[^0-9\/]/g, '').slice(0, 10); setDateFrom(v); }}
                                placeholder="DD/MM/YYYY"
                                className="!w-full !text-center !rounded-lg"
                                maxLength={10}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1 !pl-3">Date To (DD/MM/YYYY)</label>
                            <InputText
                                value={dateTo}
                                onChange={(e) => { const v = e.target.value.replace(/[^0-9\/]/g, '').slice(0, 10); setDateTo(v); }}
                                placeholder="DD/MM/YYYY"
                                className="!w-full !text-center !rounded-lg"
                                maxLength={10}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1 !pl-3">Bill No</label>
                            <AutoComplete
                                value={billNoValue}
                                suggestions={filteredBillNos}
                                completeMethod={searchBillNos}
                                onChange={onBillNoChange}
                                itemTemplate={billNoItemTemplate}
                                placeholder="Search bill no..."
                                 className="!w-full [&_.p-autocomplete-input]:!w-full [&_.p-autocomplete-input]:!rounded-lg"
                            />
                        </div>
                        <div className="flex items-end justify-end gap-2">
                            <Button label="CSV" icon="pi pi-file-excel" className="!bg-gradient-to-r !from-green-600 !to-green-700 !text-white !font-semibold !rounded-lg !text-xs md:!text-sm !shadow-md hover:!shadow-lg hover:!-translate-y-0.5 !transition-all !border-none !px-3 !py-1.5 md:!px-4 md:!py-2" onClick={exportCSV} />
                        </div>
                    </div>
                </div>

                <DataTable
                    value={filteredBills}
                    paginator
                    rows={15}
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
                    currentPageReportTemplate="Showing {first} to {last} of {totalRecords} bills"
                    className="p-datatable-users [&_.p-datatable-wrapper]:rounded-xl [&_.p-datatable-wrapper]:overflow-hidden [&_.p-datatable-wrapper]:border [&_.p-datatable-wrapper]:border-gray-200 [&_.p-datatable-header]:bg-transparent [&_.p-datatable-header]:border-none [&_.p-datatable-header]:p-0 [&_.p-datatable-thead>tr>th]:bg-slate-50 [&_.p-datatable-thead>tr>th]:text-gray-600 [&_.p-datatable-thead>tr>th]:p-3 md:[&_.p-datatable-thead>tr>th]:p-4 [&_.p-datatable-thead>tr>th]:font-semibold [&_.p-datatable-thead>tr>th]:text-xs md:text-sm [&_.p-datatable-thead>tr>th]:uppercase [&_.p-datatable-thead>tr>th]:tracking-wide [&_.p-datatable-thead>tr>th]:border-b-2 [&_.p-datatable-thead>tr>th]:border-gray-200 [&_.p-datatable-tbody>tr]:bg-white [&_.p-datatable-tbody>tr:hover]:bg-slate-50 [&_.p-datatable-tbody>tr>td]:p-3 md:[&_.p-datatable-tbody>tr>td]:p-4 [&_.p-datatable-tbody>tr>td]:text-sm md:text-base [&_.p-datatable-tbody>tr>td]:border-b [&_.p-datatable-tbody>tr>td]:border-gray-100 [&_.p-datatable-tbody>tr>td]:text-gray-700 [&_.p-datatable-tbody>tr>td]:align-middle"
                    emptyMessage="No bills found."
                    responsiveLayout="scroll"
                    sortField="billNo"
                    sortOrder={-1}
                >
                    <Column field="billNo" header="Bill No" align="center" style={{ width: '8%' }} sortable />
                    <Column field="date" header="Date" align="center" style={{ width: '10%' }} sortable />
                    <Column field="customerName" header="Customer Name" align="left" style={{ width: '18%' }} sortable />
                    <Column field="customerPhone" header="Contact" align="center" style={{ width: '12%' }} />
                    <Column field="invoiceType" header="Type" body={invoiceTypeBody} align="center" style={{ width: '10%' }} sortable />
                    <Column field="items" header="Items" body={itemsBody} align="center" style={{ width: '5%' }} />
                    <Column field="grandTotal" header="Grand Total" body={grandTotalBody} align="right" style={{ width: '12%' }} sortable />
                    <Column body={actionBody} exportable={false} align="center" style={{ width: '5%' }} header="Print" />
                </DataTable>

                {filteredBills.length > 0 && (
                    <div className="mt-4 p-3 md:p-4 bg-white rounded-xl border border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-2">
                        <span className="text-sm text-gray-500 font-semibold">
                            Total Bills: <strong className="text-gray-800">{filteredBills.length}</strong>
                        </span>
                        <span className="text-sm md:text-base text-gray-500 font-semibold">
                            Grand Total: <strong className="text-primary-dark text-lg">{fmtINR(totalGrand)}</strong>
                        </span>
                    </div>
                )}
            </div>

            {(() => {
                const pb = printBill;
                const pOwner = logins.find(l => l.id === pb?.ownerId);
                const cName = pOwner?.companyName || user?.companyName || 'COMPANY NAME';
                const addr = pOwner?.address || '';
                const contactNum = pOwner?.contactNumber || '';
                const validItems = (pb?.items || []).filter(i => i.description && i.description.trim());
                const pbGrandTotal = validItems.reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.price) || 0), 0);
                return (
                    <div className={`print-template ${!pb ? 'print-empty' : ''}`}>
                        {pb && (
                            <div className="bill-paper">
                                <div className="print-content-wrapper">
                                    <div className="print-header-center">
                                        <div className="print-jurisdiction">SUBJECT TO PATAN JURISDICTION</div>
                                        <div className="print-company-title">{cName.toUpperCase()}</div>
                                        {addr && <div className="print-company-address">{addr.toUpperCase()}</div>}
                                        {contactNum && <div className="print-company-contact">MO: {contactNum}</div>}
                                    </div>
                                    <div className="print-meta-row">
                                        <span className="print-bill-no">BILL NO : {pb.billNo}</span>
                                        <span className="print-memo-title">{(pb.invoiceType || 'Credit Memo').toUpperCase()}</span>
                                        <span className="print-date">DATE : {pb.date}</span>
                                    </div>
                                    <div className="print-customer-name">NAME : <strong>{(pb.customerName || '').toUpperCase()}</strong></div>
                                    <div className="print-table-container">
                                        <table className="print-dashed-table">
                                            <thead>
                                                <tr>
                                                    <th className="col-sr">SR.<br/>No.</th>
                                                    <th className="col-particulars">PARTICULARS</th>
                                                    <th className="col-year">YEAR</th>
                                                    <th className="col-qty">QTY</th>
                                                    <th className="col-price">UNIT<br/>PRICE</th>
                                                    <th className="col-amount">AMOUNT</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {validItems.map((row, idx) => (
                                                    <tr key={row.id || idx}>
                                                        <td className="col-sr">{row.sNo}</td>
                                                        <td className="col-particulars">{row.description}</td>
                                                        <td className="col-year">{row.year}</td>
                                                        <td className="col-qty">{row.quantity}</td>
                                                        <td className="col-price">{Number(row.price) || 0}</td>
                                                        <td className="col-amount">{(Number(row.quantity) || 0) * (Number(row.price) || 0)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        <div className="print-total-row">
                                            <span className="print-total-label">TOTAL RS.</span>
                                            <span className="print-total-value">{pbGrandTotal}</span>
                                        </div>
                                    </div>
                                    <div className="print-footer-words">
                                        RUPEES <strong>{numberToWords(pbGrandTotal)} Only.</strong>
                                    </div>
                                    <div className="print-footer-signature">
                                        <strong>FOR {cName.toUpperCase()}</strong>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })()}
        </div>
    );
};

export default Report;
