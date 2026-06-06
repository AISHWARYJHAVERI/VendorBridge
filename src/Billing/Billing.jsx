import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import { AutoComplete } from 'primereact/autocomplete';
import { Dropdown } from 'primereact/dropdown';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import AddUser from '../Users/AddUser/AddUser';
import { useAuth } from '../AuthContext';
import api, { BILL_LIMIT } from '../api';
import OwnerSwitcher from '../components/OwnerSwitcher';

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

const Billing = () => {
    const navigate = useNavigate();
    const toast = useRef(null);
    const { user, logout, selectedYear } = useAuth();

    const emptyRow = (sNo, year) => {
        return {
            id: Date.now() + sNo,
            sNo,
            description: '',
            year: year,
            quantity: null,
            price: null,
        };
    };

    const [rows, setRows] = useState([emptyRow(1, selectedYear)]);
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [billDate, setBillDate] = useState(new Date().toLocaleDateString('en-GB'));
    const [billNo, setBillNo] = useState('1');
    const [invoiceType, setInvoiceType] = useState('Credit Memo');
    const [ownerProfile, setOwnerProfile] = useState(null);
    const [savedBills, setSavedBills] = useState([]);
    const [filteredBills, setFilteredBills] = useState([]);
    const [editingBillId, setEditingBillId] = useState(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [billGenerationCount, setBillGenerationCount] = useState(0);
    const [showLimitDialog, setShowLimitDialog] = useState(false);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const invoiceTypeOptions = [
        { label: 'Cash Memo', value: 'Cash Memo' },
        { label: 'Credit Memo', value: 'Credit Memo' }
    ];
    
    const descRefs = useRef({});
    const yearRefs = useRef({});
    const qtyRefs = useRef({});
    const priceRefs = useRef({});

    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [knownDescriptions, setKnownDescriptions] = useState([]);
    const [filteredDescriptions, setFilteredDescriptions] = useState([]);

    useEffect(() => {
        if (!user?.id) return;
        api.getUsers().then(setUsers);
    }, [user]);

    useEffect(() => {
        if (user?.id) {
            api.getOwnerProfile(user.id).then(loginData => {
                setOwnerProfile(loginData);
            });
            fetchNextBillNo();
            fetchSavedBills();
            api.getBillGenerationCount().then(setBillGenerationCount);
        }
    }, [user?.id, selectedYear]);

    const fetchNextBillNo = async () => {
        if (!user?.id) return;
        const counters = await api.getBillCounters();
        const ownerCounters = counters[user.id] || {};
        const nextBillNo = (ownerCounters[selectedYear] || 0) + 1;
        setBillNo(`${nextBillNo}`);
        
        const allBills = await api.getBills();
        const allDescSet = new Set();
        allBills.forEach(b => {
            if (b.items) {
                b.items.forEach(item => {
                    if (item.description && item.description.trim()) {
                        allDescSet.add(item.description.trim());
                    }
                });
            }
        });
        setKnownDescriptions(Array.from(allDescSet));
    };

    const fetchSavedBills = async () => {
        if (!user?.id) return;
        const allBills = await api.getBills();
        const yearFiltered = allBills.filter(b => {
            const firstItemYear = b.items?.[0]?.year;
            return firstItemYear === selectedYear;
        });
        setSavedBills(yearFiltered);
    };

    const searchBill = (event) => {
        setTimeout(() => {
            const query = event.query.trim();
            if (!query) {
                setFilteredBills([]);
                return;
            }
            const _filtered = savedBills.filter(b => b.billNo?.toString().includes(query));
            setFilteredBills(_filtered);
        }, 250);
    };

    const onBillNoChange = (e) => {
        if (typeof e.value === 'string') {
            if (!e.value.trim()) {
                resetForm();
                return;
            }
            setBillNo(e.value);
            setEditingBillId(null);
        } else {
            const bill = e.value;
            loadBill(bill);
        }
    };

    const billItemTemplate = (bill) => (
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <strong>Bill No: {bill.billNo}</strong>
            <span style={{ color: '#64748b', fontSize: '0.85rem' }}>{bill.customerName} ({bill.date})</span>
        </div>
    );

    const loadBill = (bill) => {
        setEditingBillId(bill.id);
        setBillNo(bill.billNo.toString());
        setBillDate(bill.date);
        setInvoiceType(bill.invoiceType || 'Credit Memo');
        setCustomerName(bill.customerName || '');
        setCustomerPhone(bill.customerPhone || '');
        if (bill.items && bill.items.length) {
            setRows(bill.items.map((item, i) => ({
                ...item,
                id: Date.now() + i,
                sNo: i + 1,
            })));
        } else {
            setRows([emptyRow(1, selectedYear)]);
        }
    };

    const showError = (detail) => {
        toast.current?.show({ severity: 'error', summary: 'Error', detail, life: 3000 });
    };

    const showSuccess = (detail) => {
        toast.current?.show({ severity: 'success', summary: 'Successful', detail, life: 3000 });
    };

    const handleUserAdded = (newUser) => {
        setUsers([...users, newUser]);
        setCustomerName(`${(newUser.firstName || '').trim()} ${(newUser.lastName || '').trim()}`.trim());
        setCustomerPhone((newUser.mobileNumber || '').trim());
    };

    const searchCustomer = (event) => {
        setTimeout(() => {
            let _filteredUsers = [];
            const query = event.query.toLowerCase();

            users.forEach((u) => {
                const fullName = `${u.firstName || ''} ${u.lastName || ''}`.trim();
                const companyName = u.company?.name || '';
                const groupName = u.groupName || '';

                const matchesQuery = !query.trim().length || 
                    fullName.toLowerCase().includes(query) || 
                    companyName.toLowerCase().includes(query) || 
                    groupName.toLowerCase().includes(query);

                if (matchesQuery) {
                    if (fullName) {
                        _filteredUsers.push({
                            label: groupName ? `${fullName} (${groupName})` : fullName,
                            user: u,
                            type: 'Customer'
                        });
                    }
                    if (companyName) {
                        _filteredUsers.push({
                            label: groupName ? `${companyName} (${groupName})` : companyName,
                            user: u,
                            type: 'Company'
                        });
                    }
                }
            });

            const uniqueFiltered = Array.from(new Set(_filteredUsers.map(a => a.label)))
                .map(label => _filteredUsers.find(a => a.label === label));

            setFilteredUsers(uniqueFiltered);
        }, 250);
    };

    const onCustomerChange = (e) => {
        if (typeof e.value === 'string') {
            if (!e.value.trim()) {
                setCustomerName('');
                setCustomerPhone('');
            }
        } else if (e.value) {
            const selectedItem = e.value;
            setCustomerName(selectedItem.label);
            setCustomerPhone(selectedItem.user.mobileNumber || '');
        }
    };

    const itemTemplate = (item) => {
        return (
            <div className="flex items-center w-full justify-between">
                <div>
                    <strong>{item.label}</strong>
                    {item.user.mobileNumber ? ` - ${item.user.mobileNumber}` : ''}
                </div>
                <small style={{ color: '#64748b', backgroundColor: '#f1f5f9', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                    {item.type}
                </small>
            </div>
        );
    };

    const MAX_ITEMS = 7;

    const addRow = () => {
        setRows(prev => {
            if (prev.length >= MAX_ITEMS) return prev;
            return [...prev, emptyRow(prev.length + 1, selectedYear)];
        });
    };

    const removeRow = (id) => {
        setRows(prev => {
            if (prev.length <= 1) return prev;
            return prev.filter(r => r.id !== id).map((r, i) => ({ ...r, sNo: i + 1 }));
        });
    };

    const updateRow = (id, field, val) => {
        setRows(prev => {
            const newRows = prev.map(row => {
                if (row.id === id) {
                    return { ...row, [field]: val };
                }
                return row;
            });
            const lastRow = newRows[newRows.length - 1];
            if (lastRow && lastRow.id === id && lastRow.description && lastRow.description.trim() && Number(lastRow.quantity) > 0 && Number(lastRow.price) > 0) {
                if (newRows.length < MAX_ITEMS) {
                    const newRow = emptyRow(newRows.length + 1, selectedYear);
                    return [...newRows, newRow];
                }
            }
            return newRows;
        });
    };

    const handleDescriptionBlur = (val) => {
        if (val && typeof val === 'string' && val.trim()) {
            const trimmed = val.trim().slice(0, 100);
            setKnownDescriptions(prev => prev.includes(trimmed) ? prev : [...prev, trimmed]);
        }
    };

    const lastRowCountRef = useRef(1);
    useEffect(() => {
        if (rows.length > lastRowCountRef.current) {
            lastRowCountRef.current = rows.length;
            const lastRow = rows[rows.length - 1];
            const descInput = descRefs.current[lastRow.id];
            if (descInput && !lastRow.description) {
                setTimeout(() => descInput.focus(), 50);
            }
        } else if (rows.length < lastRowCountRef.current) {
            lastRowCountRef.current = rows.length;
        }
    }, [rows.length]);

    const isRowEmpty = (row) => {
        return !(row.description && row.description.trim()) && !row.quantity && !row.price;
    };

    const getValidRows = () => rows.filter(r => !isRowEmpty(r));

    const searchDescription = (event) => {
        const query = event.query.trim().toLowerCase();
        let _filtered;
        if (!query.length) {
            _filtered = [...knownDescriptions];
        } else {
            _filtered = knownDescriptions.filter(desc => {
                return desc.toLowerCase().includes(query);
            }).sort((a, b) => {
                const lowerA = a.toLowerCase();
                const lowerB = b.toLowerCase();
                
                const getScore = (str) => {
                    if (str === query) return 4;
                    if (str.startsWith(query)) return 3;
                    
                    const words = str.split(/[\s-]+/);
                    if (words.some(w => w.startsWith(query))) return 2;
                    
                    return 1;
                };

                const scoreA = getScore(lowerA);
                const scoreB = getScore(lowerB);

                if (scoreA !== scoreB) {
                    return scoreB - scoreA;
                }
                
                if (a.length !== b.length) {
                    return a.length - b.length;
                }

                return a.localeCompare(b);
            });
        }
        setFilteredDescriptions(_filtered);
    };

    const getRowTotal = (row) => (Number(row.quantity) || 0) * (Number(row.price) || 0);

    const grandTotal = rows.reduce((sum, row) => sum + getRowTotal(row), 0);

    const fmtINR = (val) => val.toLocaleString('en-IN', { style: 'currency', currency: 'INR' });

    const exportPDF = () => {
        const validRows = getValidRows();
        if (!validRows.length || !customerName.trim()) {
            toast.current.show({ severity: 'warn', summary: 'Cannot Export', detail: 'Please add at least one item with description before exporting.', life: 3000 });
            return;
        }
        if (billGenerationCount >= BILL_LIMIT) {
            setShowLimitDialog(true);
            toast.current.show({ severity: 'warn', summary: 'Limit Reached', detail: `You have reached the maximum of ${BILL_LIMIT} bill generations.`, life: 5000 });
            return;
        }
        try {
            const doc = new jsPDF();
            
            doc.setFont('courier', 'normal');
            
            doc.setFontSize(10);
            doc.text("SUBJECT TO PATAN JURISDICTION", 105, 15, { align: "center" });
            
            doc.setFont('courier', 'bold');
            doc.setFontSize(26);
            doc.text(((ownerProfile?.companyName || user?.companyName) || 'COMPANY NAME').toUpperCase(), 105, 26, { align: "center" });
            
            doc.setFont('courier', 'normal');
            doc.setFontSize(12);
            doc.text(((ownerProfile?.address || user?.companyName) || '').toUpperCase(), 105, 36, { align: "center" });
            const contactNum = ownerProfile?.contactNumber || '';
            if (contactNum) {
                doc.text(`MO: ${contactNum}`, 105, 42, { align: "center" });
            }
            
            let startY = 56;
            
            doc.setFontSize(11);
            doc.text(`BILL NO : ${billNo}`, 15, startY);
            doc.setFont('courier', 'bold');
            doc.setFontSize(12);
            doc.text((invoiceType || 'Credit Memo').toUpperCase(), 105, startY, { align: "center" });
            doc.setFont('courier', 'normal');
            doc.setFontSize(11);
            doc.text(`DATE : ${billDate}`, 195, startY, { align: "right" });
            
            startY += 10;
            doc.text(`NAME : `, 15, startY);
            doc.setFont('courier', 'bold');
            doc.text(`${(customerName || '').toUpperCase()}`, 33, startY);
            
            startY += 8;

            const tableColumn = ['SR.\nNo.', 'PARTICULARS', 'YEAR', 'QTY', 'UNIT\nPRICE', 'AMOUNT'];
            const tableRows = validRows.map(row => [
                row.sNo,
                (row.description || ''),
                row.year,
                row.quantity,
                (Number(row.price) || 0).toString(),
                getRowTotal(row).toString(),
            ]);

            doc.setLineDash([3, 3], 0);
            doc.setLineWidth(0.4);

            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: startY,
                theme: 'plain',
                styles: { font: 'courier', cellPadding: 4 },
                headStyles: { fontStyle: 'bold', fontSize: 11, textColor: [0, 0, 0], halign: 'center', valign: 'middle' },
                bodyStyles: { fontSize: 11, textColor: [0, 0, 0] },
                columnStyles: {
                    0: { halign: 'center', cellWidth: 15 },
                    1: { halign: 'left' },
                    2: { halign: 'center', cellWidth: 30 },
                    3: { halign: 'center', cellWidth: 20 },
                    4: { halign: 'center', cellWidth: 30 },
                    5: { halign: 'right', cellWidth: 30 },
                },
                willDrawPage: function(data) {
                    doc.setLineDash([3, 3], 0);
                    doc.line(15, data.settings.startY, 195, data.settings.startY);
                    doc.line(15, data.settings.startY + 14, 195, data.settings.startY + 14);
                }
            });

            const pdfGrandTotal = validRows.reduce((sum, row) => sum + getRowTotal(row), 0);
            const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : startY + 10;
            
            const footerY = Math.max(finalY + 20, 220);
            
            doc.setLineDash([3, 3], 0);
            doc.line(15, footerY - 6, 195, footerY - 6);
            
            doc.setFont('courier', 'normal');
            doc.setFontSize(12);
            doc.text("TOTAL RS.", 15, footerY);
            doc.text(pdfGrandTotal.toString(), 195, footerY, { align: "right" });
            
            doc.line(15, footerY + 6, 195, footerY + 6);
            
            const words = numberToWords(pdfGrandTotal);
            doc.text(`RUPEES`, 15, footerY + 16);
            doc.setFont('courier', 'bold');
            doc.text(`${words} Only.`, 35, footerY + 16);
            
            doc.text(`FOR ${((ownerProfile?.companyName || user?.companyName) || 'COMPANY NAME').toUpperCase()}`, 195, footerY + 35, { align: "right" });
            
            const fileName = `INVOICE_${Date.now()}.pdf`;
            doc.save(fileName);
            
            const pdfBlob = doc.output('blob');
            const blobUrl = URL.createObjectURL(pdfBlob);
            window.open(blobUrl, '_blank');

            toast.current.show({ severity: 'success', summary: 'Exported', detail: 'Bill PDF generated and saved successfully!', life: 3000 });
        } catch (error) {
            console.error("PDF Export Error:", error);
            toast.current.show({ severity: 'error', summary: 'Export Failed', detail: 'Could not generate PDF. Please try again.', life: 3000 });
        }
    };

    const handlePrint = () => window.print();

    const printed = useRef(false);

    const saveBill = async () => {
        const validRows = getValidRows();
        if (!customerName.trim()) {
            toast.current.show({ severity: 'warn', summary: 'Missing Info', detail: 'Please enter the Customer Name.', life: 3000 });
            return false;
        }
        if (!validRows.length) {
            toast.current.show({ severity: 'warn', summary: 'No Items', detail: 'Please add at least one item with description and amount.', life: 3000 });
            return false;
        }

        if (!editingBillId && billGenerationCount >= BILL_LIMIT) {
            setShowLimitDialog(true);
            toast.current.show({ severity: 'warn', summary: 'Limit Reached', detail: `You have reached the maximum of ${BILL_LIMIT} bill generations.`, life: 5000 });
            return false;
        }
        
        const billData = {
            ownerId: user?.id,
            date: billDate,
            billNo: billNo,
            invoiceType: invoiceType,
            customerName: customerName,
            customerPhone: customerPhone,
            items: validRows,
            grandTotal: validRows.reduce((sum, row) => sum + getRowTotal(row), 0)
        };
        if (editingBillId) {
            await api.updateBill(editingBillId, billData);
            toast.current.show({ severity: 'success', summary: 'Success', detail: 'Bill updated successfully!', life: 3000 });
        } else {
            await api.addBill(billData);
            const newCount = await api.incrementBillGenerationCount();
            setBillGenerationCount(newCount);
            if (newCount >= BILL_LIMIT) {
                setShowLimitDialog(true);
                toast.current.show({ severity: 'warn', summary: 'Limit Reached', detail: `You have reached the maximum of ${BILL_LIMIT} bill generations.`, life: 5000 });
            }
            const billNum = parseInt(billNo, 10);
            if (!isNaN(billNum)) {
                await api.setBillCounterValue(user.id, selectedYear, billNum);
            }
            toast.current.show({ severity: 'success', summary: 'Success', detail: 'Bill saved successfully!', life: 3000 });
        }
        await fetchSavedBills();
        return true;
    };

    const resetForm = () => {
        setCustomerName('');
        setCustomerPhone('');
        setRows([emptyRow(1, selectedYear)]);
        setBillDate(new Date().toLocaleDateString('en-GB'));
        setInvoiceType('Credit Memo');
        setEditingBillId(null);
        fetchNextBillNo();
        fetchSavedBills();
    };

    const handleSaveAndPrint = async () => {
        const validRows = getValidRows();
        if (!validRows.length) {
            toast.current.show({ severity: 'warn', summary: 'No Items', detail: 'Please add at least one item with description and amount before printing.', life: 3000 });
            return;
        }
        const saved = await saveBill();
        if (saved) {
            handlePrint();
            printed.current = false;
            const afterPrint = () => {
                if (printed.current) return;
                printed.current = true;
                resetForm();
                window.removeEventListener('afterprint', afterPrint);
            };
            window.addEventListener('afterprint', afterPrint);
            setTimeout(afterPrint, 2000);
        }
    };

    const header = (
        <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
            <div className="flex items-center gap-4">
                <h4 className="m-0 text-sm md:text-base font-semibold text-gray-600 uppercase tracking-wide">Item Entries</h4>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen p-2 md:p-4 lg:p-6 max-w-7xl mx-auto flex justify-center items-start bg-gradient-to-br from-indigo-50 to-blue-50 animate-[fadeIn_0.5s_ease-out]">
            <Toast ref={toast} />

            <div className="w-full bg-white/95 backdrop-blur rounded-2xl p-3 md:p-6 lg:p-8 shadow-md border border-white/60 flex flex-col no-print">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 mb-3">
                    <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                        <button className="w-9 h-9 md:w-10 md:h-10 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-400 text-base md:text-lg hover:text-primary hover:border-primary hover:-translate-x-1 transition-all shadow-sm cursor-pointer flex-shrink-0 font-sans" onClick={() => navigate('/dashboard')} title="Back to Dashboard">
                            <i className="pi pi-arrow-left"></i>
                        </button>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap w-full sm:w-auto justify-start sm:justify-end">
                        {user && <OwnerSwitcher />}
                        <Button label="New Bill" icon="pi pi-file" className="p-button-warning p-button-sm !bg-gradient-to-r !from-amber-500 !to-amber-600 !text-white !font-semibold !rounded-lg !text-xs md:!text-sm !shadow-md hover:!shadow-lg hover:!-translate-y-0.5 !transition-all !border-none !px-3 !py-1.5 md:!px-4 md:!py-2" onClick={resetForm} />
                        <Button label="Logout" icon="pi pi-sign-out" className="!bg-gradient-to-r !from-red-500 !to-red-600 !text-white !font-semibold !rounded-lg !text-xs md:!text-sm !shadow-md hover:!shadow-lg hover:!-translate-y-0.5 !transition-all !border-none !px-3 !py-1.5 md:!px-4 md:!py-2" onClick={() => { logout(); navigate('/login', { replace: true }); }} />
                    </div>
                </div>

                <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-800 mb-3 md:mb-4 pb-2 md:pb-3 relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:h-1 after:w-12 after:bg-gradient-to-r after:from-primary after:to-primary-light after:rounded">
                    Billing Terminal
                    <span className="inline-flex items-center ml-1 md:ml-3 px-1.5 py-0.5 md:px-3 md:py-1 bg-gradient-to-r from-sky-500 to-sky-600 text-white text-[10px] md:text-sm font-bold rounded-full shadow-md align-middle whitespace-nowrap">
                        {selectedYear}
                    </span>
                </h2>
                
                <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 mb-3">
                    <Button label="Export PDF" icon="pi pi-file-pdf" className="p-button-danger p-button-sm !bg-gradient-to-r !from-red-500 !to-red-600 !text-white !font-semibold !rounded-lg !text-xs md:!text-sm !shadow-md hover:!shadow-lg hover:!-translate-y-0.5 !transition-all !border-none !px-3 !py-2" onClick={exportPDF} />
                    <Button label="Save & Print Invoice" icon="pi pi-print" className="p-button-success p-button-sm !bg-gradient-to-r !from-emerald-500 !to-emerald-600 !text-white !font-semibold !rounded-lg !text-xs md:!text-sm !shadow-md hover:!shadow-lg hover:!-translate-y-0.5 !transition-all !border-none !px-3 !py-2" onClick={handleSaveAndPrint} />
                </div>

                <div className="flex flex-col md:flex-row gap-2 md:gap-3 mb-3 md:mb-4">
                    <div className="flex-1 mb-2 md:mb-0">
                        <label className="block text-center text-xs md:text-sm font-semibold text-gray-600 mb-1">Invoice No.</label>
                        <AutoComplete
                            value={billNo}
                            suggestions={filteredBills}
                            completeMethod={searchBill}
                            onChange={onBillNoChange}
                            itemTemplate={billItemTemplate}
                            placeholder="Type bill no. to load..."
                            className="w-full flex"
                            inputStyle={{ width: '100%', textAlign: 'center', fontWeight: 'bold' }}
                        />
                    </div>
                    <div className="flex-1 mb-2 md:mb-0">
                        <label className="block text-center text-xs md:text-sm font-semibold text-gray-600 mb-1">Invoice Type</label>
                        <Dropdown 
                            value={invoiceType} 
                            options={invoiceTypeOptions} 
                            onChange={(e) => setInvoiceType(e.value)} 
                            className="w-full [&_.p-dropdown-trigger]:hidden [&_.p-dropdown-label]:text-center [&_.p-dropdown-label]:font-bold [&_.p-dropdown-label]:text-gray-700"
                            style={{ width: '100%', textAlign: 'center', fontWeight: 'bold' }}
                        />
                    </div>
                    <div className="flex-1">
                        <label className="block text-center text-xs md:text-sm font-semibold text-gray-600 mb-1">Invoice Date</label>
                        <InputText value={billDate} onChange={(e) => { const v = e.target.value.replace(/[^0-9\/]/g, '').slice(0, 10); setBillDate(v); }} onBlur={() => { if (billDate && !/^\d{2}\/\d{2}\/\d{4}$/.test(billDate)) { toast.current?.show({ severity: 'warn', summary: 'Invalid Date', detail: 'Use DD/MM/YYYY format', life: 2000 }); } }} placeholder="DD/MM/YYYY" className="!w-full !text-center !rounded-lg" maxLength={10} />
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-2 md:gap-3 mb-4 md:mb-5">
                    <div className="flex-[1.5] mb-2 md:mb-0">
                        <label htmlFor="customerName" className="block text-center text-xs md:text-sm font-semibold text-gray-600 mb-1.5">Customer / Company Name *</label>
                        <div className="flex gap-2 items-center">
                            <AddUser onUserAdded={handleUserAdded} showError={showError} showSuccess={showSuccess} />
                            <AutoComplete 
                                id="customerName" 
                                value={customerName} 
                                suggestions={filteredUsers} 
                                completeMethod={searchCustomer} 
                                onChange={onCustomerChange} 
                                itemTemplate={itemTemplate}
                                placeholder="Search Customer or Company Name"
                                className="flex-1 w-full"
                                inputStyle={{ width: '100%', textAlign: 'center' }}
                            />
                        </div>
                    </div>
                    <div className="flex-1">
                        <label htmlFor="customerPhone" className="block text-center text-xs md:text-sm font-semibold text-gray-600 mb-1.5">Contact Number</label>
                        <InputText 
                            id="customerPhone" 
                            value={customerPhone} 
                            onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} 
                            placeholder="Enter contact number"
                            className="!w-full !text-center !rounded-lg"
                            maxLength={10}
                        />
                    </div>
                </div>

{isMobile ? (
                    <div className="mobile-items-list">
                        <div className="mobile-items-header">Item Entries</div>
                        {rows.map((row) => (
                            <div className="mobile-item-card" key={row.id}>
                                <div className="mobile-item-card-header">
                                    <span className="mobile-item-sno">#{row.sNo}</span>
                                    <button
                                        className="mobile-item-delete"
                                        onClick={() => removeRow(row.id)}
                                        disabled={rows.length <= 1}
                                    >
                                        <i className="pi pi-trash"></i>
                                    </button>
                                </div>
                                <div className="mobile-item-field">
                                    <label>Item Description</label>
                                    <AutoComplete
                                        value={row.description}
                                        suggestions={filteredDescriptions}
                                        completeMethod={searchDescription}
                                        onChange={(e) => updateRow(row.id, 'description', (e.value || '').slice(0, 100))}
                                        onBlur={(e) => handleDescriptionBlur(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === 'Tab') {
                                                e.preventDefault();
                                                setTimeout(() => {
                                                    const yearInput = yearRefs.current[row.id];
                                                    if (yearInput) {
                                                        if (yearInput.focus) yearInput.focus();
                                                        else if (yearInput.getInput) yearInput.getInput().focus();
                                                        else if (yearInput.getElement) yearInput.getElement().focus();
                                                    }
                                                }, 50);
                                            }
                                        }}
                                        inputRef={el => descRefs.current[row.id] = el}
                                        style={{ width: '100%' }}
                                        inputStyle={{ width: '100%', boxSizing: 'border-box', padding: '0.5rem 0.6rem', fontSize: '14px' }}
                                        placeholder="Type or select..."
                                        inputProps={{ maxLength: 100 }}
                                    />
                                </div>
                                <div className="mobile-item-row-3col">
                                    <div className="mobile-item-field">
                                        <label>Year</label>
                                        <InputText
                                            ref={el => yearRefs.current[row.id] = el}
                                            value={row.year || selectedYear}
                                            onChange={(e) => updateRow(row.id, 'year', e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === 'Tab') {
                                                    e.preventDefault();
                                                    setTimeout(() => {
                                                        const qtyInput = qtyRefs.current[row.id];
                                                        if (qtyInput) {
                                                            if (qtyInput.focus) qtyInput.focus();
                                                            else if (qtyInput.getInput) qtyInput.getInput().focus();
                                                            else if (qtyInput.getElement) qtyInput.getElement().focus();
                                                        }
                                                    }, 50);
                                                }
                                            }}
                                            style={{ width: '100%', boxSizing: 'border-box', textAlign: 'center', padding: '0.5rem 0.4rem', fontSize: '14px' }}
                                            maxLength={50}
                                        />
                                    </div>
                                    <div className="mobile-item-field">
                                        <label>Qty</label>
                                        <InputNumber
                                            inputRef={el => qtyRefs.current[row.id] = el}
                                            value={row.quantity}
                                            onValueChange={(e) => updateRow(row.id, 'quantity', e.value ?? null)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === 'Tab') {
                                                    e.preventDefault();
                                                    setTimeout(() => {
                                                        const priceInput = priceRefs.current[row.id];
                                                        if (priceInput) {
                                                            if (priceInput.focus) priceInput.focus();
                                                            else if (priceInput.getInput) priceInput.getInput().focus();
                                                            else if (priceInput.getElement) priceInput.getElement().focus();
                                                        }
                                                    }, 50);
                                                }
                                            }}
                                            mode="decimal"
                                            minFractionDigits={0}
                                            maxFractionDigits={2}
                                            inputStyle={{ width: '100%', textAlign: 'center', padding: '0.5rem 0.4rem', fontSize: '14px' }}
                                        />
                                    </div>
                                    <div className="mobile-item-field">
                                        <label>Price</label>
                                        <InputNumber
                                            inputRef={el => priceRefs.current[row.id] = el}
                                            value={row.price}
                                            onValueChange={(e) => updateRow(row.id, 'price', e.value ?? null)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === 'Tab') {
                                                    e.preventDefault();
                                                    setTimeout(() => {
                                                        const isLast = row.id === rows[rows.length - 1]?.id;
                                                        if (isLast && row.description && row.description.trim() && (Number(row.quantity) || 0) > 0 && (Number(row.price) || 0) > 0) {
                                                            if (rows.length < MAX_ITEMS) {
                                                                addRow();
                                                            }
                                                        } else {
                                                            const descInput = descRefs.current[row.id];
                                                            if (descInput) {
                                                                if (descInput.focus) descInput.focus();
                                                                else if (descInput.getInput) descInput.getInput().focus();
                                                                else if (descInput.getElement) descInput.getElement().focus();
                                                            }
                                                        }
                                                    }, 50);
                                                }
                                            }}
                                            mode="decimal"
                                            minFractionDigits={0}
                                            maxFractionDigits={2}
                                            inputStyle={{ width: '100%', textAlign: 'right', padding: '0.5rem 0.4rem', fontSize: '14px' }}
                                        />
                                    </div>
                                </div>
                                <div className="mobile-item-total">Total: {fmtINR(getRowTotal(row))}</div>
                            </div>
                        ))}
                        {rows.length < MAX_ITEMS && (
                            <button className="mobile-add-row-btn" onClick={addRow}>
                                <i className="pi pi-plus" style={{ marginRight: '6px' }}></i>
                                Add Item
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="flex-1 overflow-x-auto overflow-y-auto mb-2 -mx-2 px-2 md:mx-0 md:px-0">
                        <DataTable
                            value={rows}
                            header={header}
                            className="p-datatable-users min-w-[600px] [&_.p-datatable-wrapper]:rounded-xl [&_.p-datatable-wrapper]:overflow-hidden [&_.p-datatable-wrapper]:border [&_.p-datatable-wrapper]:border-gray-200 [&_.p-datatable-thead>tr>th]:bg-slate-50 [&_.p-datatable-thead>tr>th]:text-gray-600 [&_.p-datatable-thead>tr>th]:p-2 md:[&_.p-datatable-thead>tr>th]:p-3 [&_.p-datatable-thead>tr>th]:font-semibold [&_.p-datatable-thead>tr>th]:text-xs [&_.p-datatable-thead>tr>th]:uppercase [&_.p-datatable-thead>tr>th]:tracking-wide [&_.p-datatable-thead>tr>th]:border-b-2 [&_.p-datatable-thead>tr>th]:border-gray-200 [&_.p-datatable-tbody>tr]:bg-white [&_.p-datatable-tbody>tr:hover]:bg-slate-50 [&_.p-datatable-tbody>tr>td]:p-2 md:[&_.p-datatable-tbody>tr>td]:p-3 [&_.p-datatable-tbody>tr>td]:text-xs md:[&_.p-datatable-tbody>tr>td]:text-sm [&_.p-datatable-tbody>tr>td]:border-b [&_.p-datatable-tbody>tr>td]:border-gray-100 [&_.p-datatable-tbody>tr>td]:text-gray-700 [&_.p-datatable-tbody>tr>td]:align-middle"
                            responsiveLayout="scroll"
                        >
                            <Column field="sNo" header="S.No" style={{ width: '50px', minWidth: '50px' }} align="center" />
                            <Column
                                field="description"
                                header="Item Description"
                                body={(row) => (
                                    <AutoComplete
                                        value={row.description}
                                        suggestions={filteredDescriptions}
                                        completeMethod={searchDescription}
                                        onChange={(e) => updateRow(row.id, 'description', (e.value || '').slice(0, 100))}
                                        onBlur={(e) => handleDescriptionBlur(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === 'Tab') {
                                                e.preventDefault();
                                                setTimeout(() => {
                                                    const yearInput = yearRefs.current[row.id];
                                                    if (yearInput) {
                                                        if (yearInput.focus) yearInput.focus();
                                                        else if (yearInput.getInput) yearInput.getInput().focus();
                                                        else if (yearInput.getElement) yearInput.getElement().focus();
                                                    }
                                                }, 50);
                                            }
                                        }}
                                        inputRef={el => descRefs.current[row.id] = el}
                                        style={{ width: '100%' }}
                                        inputStyle={{ width: '100%', boxSizing: 'border-box', padding: '0.4rem 0.5rem' }}
                                        placeholder="Type or select..."
                                        inputProps={{ maxLength: 100 }}
                                    />
                                )}
                                style={{ minWidth: '150px' }}
                            />
                            <Column
                                field="year"
                                header="Year"
                                body={(row) => (
                                    <InputText
                                        ref={el => yearRefs.current[row.id] = el}
                                        value={row.year || selectedYear}
                                        onChange={(e) => updateRow(row.id, 'year', e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === 'Tab') {
                                                e.preventDefault();
                                                setTimeout(() => {
                                                    const qtyInput = qtyRefs.current[row.id];
                                                    if (qtyInput) {
                                                        if (qtyInput.focus) qtyInput.focus();
                                                        else if (qtyInput.getInput) qtyInput.getInput().focus();
                                                        else if (qtyInput.getElement) qtyInput.getElement().focus();
                                                    }
                                                }, 50);
                                            }
                                        }}
                                        style={{ width: '100%', boxSizing: 'border-box', textAlign: 'center', padding: '0.4rem 0.5rem' }}
                                        maxLength={50}
                                    />
                                )}
                            style={{ width: '140px', minWidth: '130px' }}
                            align="center"
                        />
                        <Column
                            field="quantity"
                            header="Qty"
                            body={(row) => (
                                    <InputNumber
                                        inputRef={el => qtyRefs.current[row.id] = el}
                                        value={row.quantity}
                                        onValueChange={(e) => updateRow(row.id, 'quantity', e.value ?? null)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === 'Tab') {
                                                e.preventDefault();
                                                setTimeout(() => {
                                                    const priceInput = priceRefs.current[row.id];
                                                    if (priceInput) {
                                                        if (priceInput.focus) priceInput.focus();
                                                        else if (priceInput.getInput) priceInput.getInput().focus();
                                                        else if (priceInput.getElement) priceInput.getElement().focus();
                                                    }
                                                }, 50);
                                            }
                                        }}
                                        mode="decimal"
                                        minFractionDigits={0}
                                        maxFractionDigits={2}
                                        inputStyle={{ width: '100%', textAlign: 'center', padding: '0.4rem 0.5rem' }}
                                    />
                                )}
                            style={{ width: '90px', minWidth: '80px' }}
                            align="center"
                        />
                        <Column
                            field="price"
                            header="Price"
                            body={(row) => (
                                    <InputNumber
                                        inputRef={el => priceRefs.current[row.id] = el}
                                        value={row.price}
                                        onValueChange={(e) => updateRow(row.id, 'price', e.value ?? null)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === 'Tab') {
                                                e.preventDefault();
                                                setTimeout(() => {
                                                    const isLast = row.id === rows[rows.length - 1]?.id;
                                                    if (isLast && row.description && row.description.trim() && (Number(row.quantity) || 0) > 0 && (Number(row.price) || 0) > 0) {
                                                        if (rows.length < MAX_ITEMS) {
                                                            addRow();
                                                        }
                                                    } else {
                                                        const descInput = descRefs.current[row.id];
                                                        if (descInput) {
                                                            if (descInput.focus) descInput.focus();
                                                            else if (descInput.getInput) descInput.getInput().focus();
                                                            else if (descInput.getElement) descInput.getElement().focus();
                                                        }
                                                    }
                                                }, 50);
                                            }
                                        }}
                                        mode="decimal"
                                        minFractionDigits={0}
                                        maxFractionDigits={2}
                                        inputStyle={{ width: '100%', textAlign: 'right', padding: '0.4rem 0.5rem' }}
                                    />
                                )}
                            style={{ width: '110px', minWidth: '100px' }}
                            align="right"
                        />
                        <Column
                            field="amount"
                            header="Total"
                                style={{ width: '100px', minWidth: '90px' }}
                                align="right"
                                bodyStyle={{ fontWeight: '800', color: '#1e293b', fontSize: '1.1rem' }}
                                body={(row) => fmtINR(getRowTotal(row))}
                            />
                            <Column
                                body={(row) => (
                                    <div className="flex gap-2 justify-center">
                                        <Button
                                            icon="pi pi-trash"
                                            className="p-button-danger p-button-outlined p-button-icon-only !w-8 !h-8 md:!w-9 md:!h-9 !text-red-500 !border !border-red-300 !bg-red-50 hover:!bg-red-100 hover:!border-red-500 hover:!-translate-y-0.5 !transition-all"
                                            onClick={() => removeRow(row.id)}
                                        />
                                    </div>
                                )}
                                style={{ width: '50px', minWidth: '50px' }}
                                className="no-print"
                                align="center"
                            />
                        </DataTable>
                    </div>
                )}

                <div className="mt-auto pt-2">
                    <div className="text-right p-3 md:p-4 bg-white rounded-xl border border-gray-200 flex flex-col sm:flex-row justify-end items-center gap-2 sm:gap-4">
                        <span className="text-sm md:text-base text-gray-500 font-semibold">Grand Payable Amount:</span>
                        <span className="text-primary-dark font-extrabold text-lg md:text-xl lg:text-2xl">{fmtINR(grandTotal)}</span>
                    </div>
                </div>
            </div>

            <div className={`print-template ${!getValidRows().length || !customerName.trim() ? 'print-empty' : ''}`}>
                <div className="bill-paper">
                    {(!getValidRows().length || !customerName.trim()) ? null : (
                        <div className="print-content-wrapper">
                            <div className="print-header-center">
                                <div className="print-jurisdiction">SUBJECT TO PATAN JURISDICTION</div>
                                <div className="print-company-title">{((ownerProfile?.companyName || user?.companyName) || 'COMPANY NAME').toUpperCase()}</div>
                                <div className="print-company-address">{((ownerProfile?.address || '') || '').toUpperCase()}</div>
                                {ownerProfile?.contactNumber && <div className="print-company-contact">MO: {ownerProfile?.contactNumber}</div>}
                            </div>
                            
                            <div className="print-meta-row">
                                <span className="print-bill-no">BILL NO : {billNo}</span>
                                <span className="print-memo-title">{(invoiceType || 'Credit Memo').toUpperCase()}</span>
                                <span className="print-date">DATE : {billDate}</span>
                            </div>

                            <div className="print-customer-name">
                                NAME : <strong>{(customerName || '').toUpperCase()}</strong>
                            </div>

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
                                        {getValidRows().map((row) => (
                                            <tr key={row.id}>
                                                <td className="col-sr">{row.sNo}</td>
                                                <td className="col-particulars">{row.description}</td>
                                                <td className="col-year">{row.year}</td>
                                                <td className="col-qty">{row.quantity}</td>
                                                <td className="col-price">{Number(row.price) || 0}</td>
                                                <td className="col-amount">{getRowTotal(row)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <div className="print-total-row">
                                    <span className="print-total-label">TOTAL RS.</span>
                                    <span className="print-total-value">{getValidRows().reduce((sum, row) => sum + getRowTotal(row), 0)}</span>
                                </div>
                            </div>

                            <div className="print-footer-words">
                                RUPEES <strong>{numberToWords(getValidRows().reduce((sum, row) => sum + getRowTotal(row), 0))} Only.</strong>
                            </div>

                            <div className="print-footer-signature">
                                <strong>FOR {((ownerProfile?.companyName || user?.companyName) || 'COMPANY NAME').toUpperCase()}</strong>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <Dialog
                header="Maximum Bill Generation Reached"
                visible={showLimitDialog}
                onHide={() => { setShowLimitDialog(false); window.location.reload(); }}
                style={{ width: '400px' }}
                draggable={false}
                resizable={false}
                closable={false}
            >
                <p style={{ marginBottom: '1.5rem', color: '#475569', lineHeight: 1.6 }}>
                    You have reached the maximum limit of <strong>{BILL_LIMIT}</strong> bill generations per device.
                    Please contact the developer to purchase credits.
                </p>
                <div style={{ marginBottom: '1rem', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <p style={{ margin: '0 0 0.25rem 0', fontWeight: 'bold', color: '#1e293b' }}>Aishwary Jhaveri</p>
                    <p style={{ margin: '0.25rem 0', color: '#475569' }}>Phone: 8160682897</p>
                    <p style={{ margin: '0.25rem 0', color: '#475569' }}>Email: aishwaryzaveri@gmail.com</p>
                </div>
                <div className="flex justify-center gap-3">
                    <Button label="Close" icon="pi pi-times" className="p-button-outlined" onClick={() => { setShowLimitDialog(false); window.location.reload(); }} />
                    <Button label="Contact Developer" icon="pi pi-phone" className="!bg-gradient-to-r !from-primary !to-primary-dark !text-white !font-semibold !rounded-lg !px-5 !py-2.5 !shadow-md !border-none" onClick={() => { setShowLimitDialog(false); navigate('/contact-us'); }} />
                </div>
            </Dialog>
        </div>
    );
};

export default Billing;
