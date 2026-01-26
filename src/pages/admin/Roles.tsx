import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import '../../services/api'; // Ensure api is imported if needed, but we'll use fetch for simplicity in this admin page for now or generic api
// Actually let's use the fetchApi helper but I need to export it or just use fetch with header logic.
// I'll reuse the logic or just use raw fetch + token for this specific admin page to save time on setting up a new service file.

interface Permission {
    id: string;
    code: string;
    description: string;
    module: string;
}

interface Role {
    id: string;
    name: string;
    description: string;
    permissions: string[]; // Codes
}

export default function Roles() {
    const [roles, setRoles] = useState<Role[]>([]);
    const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);

    // Form
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [selectedPerms, setSelectedPerms] = useState<string[]>([]); // permission IDs to send

    const { token } = useAuth();

    useEffect(() => {
        fetchRoles();
        fetchPermissions();
    }, []);

    const fetchRoles = async () => {
        const res = await fetch('http://localhost:3001/api/roles', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) setRoles(await res.json());
    };

    const fetchPermissions = async () => {
        const res = await fetch('http://localhost:3001/api/roles/permissions', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) setAllPermissions(await res.json());
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = { name, description, permissions: selectedPerms }; // selectedPerms should be IDs for the backend

        const url = editingRole
            ? `http://localhost:3001/api/roles/${editingRole.id}`
            : 'http://localhost:3001/api/roles';

        const method = editingRole ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            setIsModalOpen(false);
            fetchRoles();
        } else {
            alert('Failed to save role');
        }
    };

    const handleEdit = (role: Role) => {
        setEditingRole(role);
        setName(role.name);
        setDescription(role.description);

        // Map role permission codes back to IDs for the form
        const rolePermIds = allPermissions
            .filter(p => role.permissions.includes(p.code))
            .map(p => p.id);

        setSelectedPerms(rolePermIds);
        setIsModalOpen(true);
    };

    const handleCreate = () => {
        setEditingRole(null);
        setName('');
        setDescription('');
        setSelectedPerms([]);
        setIsModalOpen(true);
    };

    const togglePermission = (permId: string) => {
        if (selectedPerms.includes(permId)) {
            setSelectedPerms(selectedPerms.filter(id => id !== permId));
        } else {
            setSelectedPerms([...selectedPerms, permId]);
        }
    };

    // Group permissions by module
    const permsByModule = allPermissions.reduce((acc, perm) => {
        if (!acc[perm.module]) acc[perm.module] = [];
        acc[perm.module].push(perm);
        return acc;
    }, {} as Record<string, Permission[]>);

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-white">Roles & Permissions</h1>
                <button className="btn btn-primary" onClick={handleCreate}>New Role</button>
            </div>

            <div className="glass-card">
                <table className="table w-full">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Description</th>
                            <th>Permissions</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {roles.map(role => (
                            <tr key={role.id}>
                                <td>{role.name}</td>
                                <td>{role.description}</td>
                                <td>
                                    <span className="text-sm text-gray-400">
                                        {role.permissions.length} permissions
                                    </span>
                                </td>
                                <td>
                                    <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(role)}>Edit</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
                    <div className="modal glass-card" style={{ maxWidth: '800px' }} onClick={e => e.stopPropagation()}>
                        <h2 className="text-xl font-bold mb-4">{editingRole ? 'Edit Role' : 'New Role'}</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm mb-1">Role Name</label>
                                    <input className="form-input w-full" value={name} onChange={e => setName(e.target.value)} required />
                                </div>
                                <div>
                                    <label className="block text-sm mb-1">Description</label>
                                    <input className="form-input w-full" value={description} onChange={e => setDescription(e.target.value)} />
                                </div>
                            </div>

                            <h3 className="text-lg font-semibold mb-2">Permissions</h3>
                            <div className="overflow-y-auto" style={{ maxHeight: '400px' }}>
                                {Object.entries(permsByModule).map(([module, perms]) => (
                                    <div key={module} className="mb-4">
                                        <h4 className="text-md font-medium text-blue-400 capitalize mb-2">{module}</h4>
                                        <div className="grid grid-cols-2 gap-2">
                                            {perms.map(perm => (
                                                <label key={perm.id} className="flex items-center space-x-2 p-2 rounded hover:bg-white/5 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedPerms.includes(perm.id)}
                                                        onChange={() => togglePermission(perm.id)}
                                                    />
                                                    <span className="text-sm">{perm.description}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-end gap-2 mt-6">
                                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Save Role</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
