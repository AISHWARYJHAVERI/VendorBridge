import { Button } from 'primereact/button';
import api from '../../api';

const DeleteUser = ({ rowData, onUserDeleted, showSuccess }) => {
    const confirmDeleteUser = async () => {
        if (window.confirm(`Are you sure you want to delete ${rowData.name}?`)) {
            await api.deleteUser(rowData.id);
            showSuccess("User Deleted Successfully");
            onUserDeleted(rowData.id);
        }
    };

    return (
        <Button icon="pi pi-trash" rounded outlined severity="danger" className="!w-9 !h-9" onClick={confirmDeleteUser} title="Delete User" />
    );
};

export default DeleteUser;
