import { useState } from 'react';
import { systemApi } from '../services/api';
import './Products.css';

export default function SystemBackup() {
    const [importFile, setImportFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleExport = () => {
        window.location.href = systemApi.exportDb();
    };

    const handleImport = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!importFile) return;

        setLoading(true);
        setMessage(null);
        try {
            const formData = new FormData();
            formData.append('backup', importFile);
            await systemApi.importDb(formData);
            setMessage({ type: 'success', text: 'Database successfully restored!' });
            setImportFile(null);
        } catch (error) {
            console.error('Import failed:', error);
            setMessage({ type: 'error', text: 'Failed to restore database. Please check the file format.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1>System Maintenance</h1>
                    <p className="text-muted">Manage database backups and system data</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Export Card */}
                <div className="glass-card p-6">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-primary-100 rounded-lg text-primary-600">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-semibold">Backup Database</h2>
                    </div>
                    <p className="text-muted mb-6">Download a complete backup of your system data including products, customers, and invoices in JSON format.</p>
                    <button className="btn btn-primary w-full" onClick={handleExport}>
                        Export Data
                    </button>
                </div>

                {/* Import Card */}
                <div className="glass-card p-6">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-warning-100 rounded-lg text-warning-600">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="17 8 12 3 7 8" />
                                <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-semibold">Restore Database</h2>
                    </div>
                    <p className="text-muted mb-6">Restore your system from a previously exported backup file. <span className="text-danger-500 font-bold">Warning: This will overwrite current data.</span></p>

                    <form onSubmit={handleImport}>
                        <div className="form-group mb-4">
                            <input
                                type="file"
                                className="form-input"
                                accept=".json"
                                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className="btn btn-secondary w-full"
                            disabled={!importFile || loading}
                        >
                            {loading ? 'Restoring...' : 'Upload & Restore'}
                        </button>
                    </form>
                </div>
            </div>

            {message && (
                <div className={`mt-6 p-4 rounded-lg flex items-center gap-3 ${message.type === 'success' ? 'bg-success-100 text-success-800' : 'bg-danger-100 text-danger-800'
                    }`}>
                    <span>{message.type === 'success' ? '✅' : '❌'}</span>
                    <p>{message.text}</p>
                </div>
            )}
        </div>
    );
}
