import { useState, useRef } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import * as XLSX from 'xlsx';
import { useAuth } from '../../AuthContext';
import api from '../../api';

const MAX_IMPORT_ROWS = 50;

const COLUMN_MAP = {
  'firstname': 'firstName',
  'first name': 'firstName',
  'middle name': 'middleName',
  'middlename': 'middleName',
  'lastname': 'lastName',
  'last name': 'lastName',
  'mobile number': 'mobileNumber',
  'phonenumber': 'mobileNumber',
  'phone number': 'mobileNumber',
  'phone': 'mobileNumber',
  'mobile': 'mobileNumber',
  'email': 'email',
  'groupname': 'groupName',
  'group name': 'groupName',
  'group': 'groupName',
  'houseflat': 'houseFlat',
  'house/flat': 'houseFlat',
  'house / flat': 'houseFlat',
  'house flat': 'houseFlat',
  'house': 'houseFlat',
  'flat': 'houseFlat',
  'street': 'street',
  'landmark': 'landmark',
  'city': 'city',
  'zipcode': 'zipcode',
  'zip code': 'zipcode',
  'zip': 'zipcode',
  'pin code': 'zipcode',
  'pincode': 'zipcode',
  'state': 'state',
  'pannumber': 'panNumber',
  'pan number': 'panNumber',
  'pan': 'panNumber',
  'companyname': 'companyName',
  'company name': 'companyName',
  'company': 'companyName',
};

const FORMATTED_HEADERS = {
  firstName: 'First Name',
  middleName: 'Middle Name',
  lastName: 'Last Name',
  mobileNumber: 'Phone Number',
  email: 'Email',
  groupName: 'Group Name',
  houseFlat: 'House/Flat',
  street: 'Street',
  landmark: 'Landmark',
  city: 'City',
  zipcode: 'Zipcode',
  state: 'State',
  panNumber: 'PAN Number',
  companyName: 'Company Name',
};

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

const ImportUsers = ({ onImportComplete, showError, showSuccess }) => {
  const { user: ownerUser } = useAuth();
  const fileInputRef = useRef(null);
  const toast = useRef(null);

  const [sheetDialog, setSheetDialog] = useState(false);
  const [sheets, setSheets] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState(null);
  const [pendingWorkbook, setPendingWorkbook] = useState(null);

  const [previewDialog, setPreviewDialog] = useState(false);
  const [parsedRows, setParsedRows] = useState([]);
  const [detectedHeaders, setDetectedHeaders] = useState([]);
  const [rowErrors, setRowErrors] = useState({});
  const [importing, setImporting] = useState(false);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array', cellText: true });

        const sheetNames = workbook.SheetNames;
        if (sheetNames.length === 1) {
          parseAndPreview(workbook, sheetNames[0]);
        } else {
          setPendingWorkbook(workbook);
          setSheets(sheetNames);
          setSelectedSheet(sheetNames[0]);
          setSheetDialog(true);
        }
      } catch {
        showError('Failed to read Excel file. Make sure it is a valid .xlsx or .xls file.');
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const handleSheetConfirm = () => {
    if (!pendingWorkbook || !selectedSheet) return;
    parseAndPreview(pendingWorkbook, selectedSheet);
    setSheetDialog(false);
    setPendingWorkbook(null);
  };

  const mapHeaders = (headers) => {
    const mapped = [];
    const unknownCols = [];
    headers.forEach((h) => {
      const key = (h || '').toString().trim().toLowerCase().replace(/\s+/g, ' ');
      const field = COLUMN_MAP[key];
      if (field) {
        mapped.push(field);
      } else if (key) {
        unknownCols.push(h);
      }
    });
    return { mapped, unknownCols };
  };

  const validateRow = (row) => {
    const errors = [];
    const required = ['firstName', 'lastName', 'mobileNumber', 'email', 'groupName', 'houseFlat', 'street', 'landmark', 'city', 'zipcode', 'state', 'panNumber', 'companyName'];

    required.forEach((f) => {
      if (!(row[f] || '').trim()) {
        errors.push(`${FORMATTED_HEADERS[f] || f} is required`);
      }
    });

    const mobile = (row.mobileNumber || '').trim();
    if (mobile && !/^\d{10}$/.test(mobile)) {
      errors.push('Phone must be exactly 10 digits');
    }

    const email = (row.email || '').trim();
    if (email && !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
      errors.push('Invalid email format');
    }

    return errors;
  };

  const parseAndPreview = (workbook, sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: '',
      raw: false,
    });

    if (jsonData.length < 2) {
      showError('Excel file must have a header row and at least one data row.');
      return;
    }

    const headerRow = jsonData[0].map((h) => (h || '').toString().trim());
    const { mapped: mappedFields, unknownCols } = mapHeaders(headerRow);

    if (mappedFields.length === 0) {
      showError('No recognized columns found. Column headers must match field names like "First Name", "Email", "Phone Number", etc.');
      return;
    }

    if (unknownCols.length > 0) {
      showError(`Unrecognized columns: ${unknownCols.join(', ')}`);
      return;
    }

    const dataRows = jsonData.slice(1).filter((r) => r.some((cell) => (cell || '').toString().trim() !== ''));
    if (dataRows.length === 0) {
      showError('No data rows found in the selected sheet.');
      return;
    }

    if (dataRows.length > MAX_IMPORT_ROWS) {
      showError(`Maximum ${MAX_IMPORT_ROWS} rows can be imported at once. Your file has ${dataRows.length} rows.`);
      return;
    }

    const rows = dataRows.map((row) => {
      const obj = {};
      mappedFields.forEach((field, i) => {
        obj[field] = (row[i] || '').toString().trim();
      });
      if (obj.panNumber) {
        obj.panNumber = formatPAN(obj.panNumber);
      }
      return obj;
    });

    const errors = {};
    rows.forEach((row, i) => {
      const rowErrs = validateRow(row);
      if (rowErrs.length) {
        errors[i] = rowErrs;
      }
    });

    setDetectedHeaders(mappedFields);
    setParsedRows(rows);
    setRowErrors(errors);
    setPreviewDialog(true);
  };

  const handleImport = async () => {
    if (Object.keys(rowErrors).length > 0) return;
    setImporting(true);

    try {
      const userDataList = parsedRows.map((r) => ({
        firstName: r.firstName,
        middleName: r.middleName || '',
        lastName: r.lastName,
        mobileNumber: r.mobileNumber,
        email: r.email,
        groupName: r.groupName,
        address: {
          houseFlat: r.houseFlat,
          street: r.street,
          landmark: r.landmark,
          city: r.city,
          zipcode: r.zipcode,
          state: r.state,
        },
        company: {
          name: r.companyName,
          panNumber: r.panNumber,
        },
        name: `${r.firstName} ${r.lastName}`,
        username: r.middleName || '',
        phone: r.mobileNumber,
        ownerId: ownerUser.id,
      }));

      await Promise.all(userDataList.map((u) => api.addUser(u)));

      if (onImportComplete) await onImportComplete();

      showSuccess(`${parsedRows.length} user(s) imported successfully!`);
      setPreviewDialog(false);
      setParsedRows([]);
      setRowErrors({});
    } catch {
      showError('Error importing users. Please try again.');
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const headers = [
      'First Name', 'Middle Name', 'Last Name', 'Phone Number', 'Email',
      'Group Name', 'House/Flat', 'Street', 'Landmark', 'City',
      'Zipcode', 'State', 'PAN Number', 'Company Name',
    ];
    const sampleRow = [
      'John', 'M', 'Doe', '9876543210', 'john@gmail.com',
      'Regular', '42', 'Main Street', 'Near Mall', 'Mumbai',
      '400001', 'Maharashtra', 'ABCDE1234F', 'Acme Corp',
    ];
    const ws = XLSX.utils.aoa_to_sheet([headers, sampleRow]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Users');
    XLSX.writeFile(wb, 'user_import_template.xlsx');
    toast.current?.show({ severity: 'info', summary: 'Template Downloaded', detail: 'Open the file, fill in your data, and import it back.', life: 3000 });
  };

  const hasErrors = Object.keys(rowErrors).length > 0;

  const errorsBodyTemplate = (_, { rowIndex }) => {
    const errs = rowErrors[rowIndex];
    if (!errs) return <span style={{ color: '#22c55e' }}>No errors</span>;
    return (
      <div style={{ color: '#ef4444', fontSize: '0.8rem' }}>
        {errs.map((e, i) => <div key={i}>{e}</div>)}
      </div>
    );
  };

  const sheetDialogFooter = (
    <div className="flex justify-center gap-3">
      <Button label="Cancel" icon="pi pi-times" className="!bg-gradient-to-r !from-red-500 !to-red-600 !text-white !font-semibold !rounded-lg !px-4 !py-2 !shadow-md !border-none" onClick={() => { setSheetDialog(false); setPendingWorkbook(null); }} />
      <Button label="Continue" icon="pi pi-check" className="!bg-gradient-to-r !from-primary !to-primary-dark !text-white !font-semibold !rounded-lg !px-4 !py-2 !shadow-md !border-none" onClick={handleSheetConfirm} disabled={!selectedSheet} />
    </div>
  );

  const previewDialogFooter = (
    <div className="flex justify-center gap-3 flex-wrap">
      <Button label="Download Template" icon="pi pi-download" className="!bg-gradient-to-r !from-sky-500 !to-sky-600 !text-white !font-semibold !rounded-lg !px-4 !py-2 !shadow-md !border-none !text-sm" onClick={downloadTemplate} />
      <Button label="Cancel" icon="pi pi-times" className="!bg-gradient-to-r !from-red-500 !to-red-600 !text-white !font-semibold !rounded-lg !px-4 !py-2 !shadow-md !border-none" onClick={() => { setPreviewDialog(false); setParsedRows([]); setRowErrors({}); }} />
      <Button label={importing ? 'Importing...' : `Import ${parsedRows.length} User(s)`} icon="pi pi-upload" className="!bg-gradient-to-r !from-emerald-500 !to-emerald-600 !text-white !font-semibold !rounded-lg !px-4 !py-2 !shadow-md !border-none" onClick={handleImport} disabled={hasErrors || importing} />
    </div>
  );

  return (
    <>
      <Toast ref={toast} />

      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      <Button
        label="Import Excel"
        icon="pi pi-file-excel"
        className="!bg-gradient-to-r !from-emerald-500 !to-emerald-600 !text-white !font-semibold !rounded-lg !text-sm !shadow-md hover:!shadow-lg hover:!-translate-y-0.5 !transition-all !border-none !px-3 !py-2 !h-8 md:!text-xs md:!px-2 md:!py-1.5 md:!h-8 whitespace-nowrap"
        onClick={handleButtonClick}
      />
      <Button
        label="Template"
        icon="pi pi-download"
        tooltip="Download sample Excel format"
        tooltipOptions={{ position: 'top' }}
        className="!bg-gradient-to-r !from-sky-500 !to-sky-600 !text-white !font-semibold !rounded-lg !text-sm !shadow-md hover:!shadow-lg hover:!-translate-y-0.5 !transition-all !border-none !px-3 !py-2 !h-8 md:!text-xs md:!px-2 md:!py-1.5 md:!h-8 whitespace-nowrap"
        onClick={downloadTemplate}
      />

      <Dialog
        visible={sheetDialog}
        header="Select Sheet"
        modal
        style={{ width: '400px' }}
        footer={sheetDialogFooter}
        onHide={() => { setSheetDialog(false); setPendingWorkbook(null); }}
        draggable={false}
        resizable={false}
        blockScroll
      >
        <div className="flex flex-col gap-3 p-3">
          <p className="text-sm text-gray-600">The Excel file contains multiple sheets. Select which one to import:</p>
          <Dropdown
            value={selectedSheet}
            options={sheets.map((s) => ({ label: s, value: s }))}
            onChange={(e) => setSelectedSheet(e.value)}
            className="w-full"
          />
        </div>
      </Dialog>

      <Dialog
        visible={previewDialog}
        header="Preview Import Data"
        modal
        style={{ width: '950px' }}
        footer={previewDialogFooter}
        onHide={() => { setPreviewDialog(false); setParsedRows([]); setRowErrors({}); }}
        draggable={false}
        resizable={false}
        blockScroll
      >
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-sm font-semibold text-gray-600">
              Found <strong>{parsedRows.length}</strong> row(s)
              {hasErrors && (
                <span className="text-red-500 ml-2">
                  — <strong>{Object.keys(rowErrors).length}</strong> row(s) with errors
                </span>
              )}
            </span>
            {!hasErrors && (
              <span className="text-sm text-green-600 font-semibold">All rows valid — ready to import</span>
            )}
          </div>
          <DataTable
            value={parsedRows.map((r, i) => ({ ...r, _rowIndex: i }))}
            scrollable
            scrollHeight="400px"
            className="p-datatable-users [&_.p-datatable-wrapper]:rounded-xl [&_.p-datatable-wrapper]:border [&_.p-datatable-wrapper]:border-gray-200"
            emptyMessage="No data"
            responsiveLayout="scroll"
          >
            {detectedHeaders.map((field) => (
              <Column
                key={field}
                field={field}
                header={FORMATTED_HEADERS[field] || field}
                style={{ minWidth: '120px' }}
                bodyStyle={field === 'middleName' ? { fontStyle: 'italic', color: '#94a3b8' } : {}}
              />
            ))}
            <Column
              header="Errors"
              body={errorsBodyTemplate}
              style={{ minWidth: '180px' }}
            />
          </DataTable>
        </div>
      </Dialog>
    </>
  );
};

export default ImportUsers;
