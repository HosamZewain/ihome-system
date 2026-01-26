import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

interface User {
    id: string;
    username: string;
    full_name: string;
    role_id: string;
    role_name: string;
}

interface Role {
    id: string;
    name: string;
}

export default function Users() {
    const [users, setUsers] = useState<User[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    // Form
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [roleId, setRoleId] = useState('');

    const { token } = useAuth();

    useEffect(() => {
        fetchUsers();
        fetchRoles();
    }, []);

    const fetchUsers = async () => {
        const res = await fetch('http://localhost:3001/api/users', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) setUsers(await res.json());
    };

    const fetchRoles = async () => {
        const res = await fetch('http://localhost:3001/api/roles', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) setRoles(await res.json());
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload: any = { username, fullName, roleId };
        if (password) payload.password = password;

        const url = editingUser
            ? `http://localhost:3001/api/users/${editingUser.id}`
            : 'http://localhost:3001/api/users';

        const method = editingUser ? 'PUT' : 'POST';

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
            fetchUsers();
        } else {
            alert('Failed to save user');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this user?')) return;
        try {
            const res = await fetch(`http://localhost:3001/api/users/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                fetchUsers();
            } else {
                const data = await res.json().catch(() => ({}));
                alert(data.message || 'Failed to delete user');
            }
        } catch (error) {
            console.error('Failed to delete user:', error);
            alert('Failed to delete user. Please check your connection.');
        }
    };

    const handleEdit = (user: User) => {
        setEditingUser(user);
        setUsername(user.username);
        setFullName(user.full_name);
        setRoleId(user.role_id);
        setPassword(''); // Don't show password
        setIsModalOpen(true);
    };

    const handleCreate = () => {
        setEditingUser(null);
        setUsername('');
        setPassword('');
        setFullName('');
        setRoleId('');
        setIsModalOpen(true);
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-white">Users</h1>
                <button className="btn btn-primary" onClick={handleCreate}>New User</button>
            </div>

            <div className="glass-card">
                <table className="table w-full">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Username</th>
                            <th>Role</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id}>
                                <td>{user.full_name}</td>
                                <td>{user.username}</td>
                                <td>
                                    <span className="badge badge-primary">{user.role_name}</span>
                                </td>
                                <td>
                                    <button className="btn btn-ghost btn-sm mr-2" onClick={() => handleEdit(user)}>Edit</button>
                                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(user.id)}>Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
                    <div className="modal glass-card" onClick={e => e.stopPropagation()}>
                        <h2 className="text-xl font-bold mb-4">{editingUser ? 'Edit User' : 'New User'}</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label className="block text-sm mb-1">Full Name</label>
                                <input className="form-input w-full" value={fullName} onChange={e => setFullName(e.target.value)} required />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm mb-1">Username</label>
                                <input className="form-input w-full" value={username} onChange={e => setUsername(e.target.value)} required disabled={!!editingUser} />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm mb-1">Password {editingUser && '(Leave blank to keep current)'}</label>
                                <input className="form-input w-full" type="password" value={password} onChange={e => setPassword(e.target.value)} required={!editingUser} />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm mb-1">Role</label>
                                <select className="form-input w-full" value={roleId} onChange={e => setRoleId(e.target.value)} required>
                                    <option value="">Select Role</option>
                                    {roles.map(r => (
                                        <option key={r.id} value={r.id}>{r.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex justify-end gap-2 mt-6">
                                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Save User</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
