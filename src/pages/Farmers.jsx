import React, { useState, useEffect } from 'react';
import { useBranch } from '../context/BranchContext';
import { db } from '../db/db';
import { Plus, Search, Edit2, Trash2, Filter, AlertCircle, ShieldAlert, X, Save } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { useLanguage } from '../context/LanguageContext';

const Farmers = () => {
    const { currentBranch } = useBranch();
    const { isFarmer, isOwner, isMember } = useUser();
    const { t } = useLanguage();
    const [farmers, setFarmers] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingFarmer, setEditingFarmer] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        manualId: '',
        name: '',
        milkType: 'Cow',
        phone: '',
        status: 'Active'
    });

    useEffect(() => {
        if (currentBranch) {
            loadFarmers();
        }
    }, [currentBranch]);

    const loadFarmers = async () => {
        const list = await db.farmers.where('branchId').equals(currentBranch.id).toArray();
        setFarmers(list);
    };

    const handleOpenModal = (farmer = null) => {
        if (farmer) {
            setEditingFarmer(farmer);
            setFormData({
                manualId: farmer.manualId || farmer.id.toString(),
                name: farmer.name,
                milkType: farmer.milkType,
                phone: farmer.phone,
                status: farmer.status
            });
        } else {
            setEditingFarmer(null);
            setFormData({
                manualId: (farmers.length + 1).toString(),
                name: '',
                milkType: 'Cow',
                phone: '',
                status: 'Active'
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!currentBranch) return;

        try {
            const data = {
                ...formData,
                branchId: currentBranch.id,
                updatedAt: new Date()
            };

            if (editingFarmer) {
                await db.farmers.update(editingFarmer.id, data);
            } else {
                await db.farmers.add({ ...data, createdAt: new Date() });
            }

            setIsModalOpen(false);
            loadFarmers();
        } catch (error) {
            alert('Failed to save farmer: ' + error.message);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this farmer? This will not delete their historical milk entries.')) {
            await db.farmers.delete(id);
            loadFarmers();
        }
    };

    const filteredFarmers = farmers.filter(f =>
        f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (f.phone && f.phone.includes(searchTerm)) ||
        (f.manualId && f.manualId.includes(searchTerm))
    );

    return (
        <div className="farmers-page">
            <div className="page-header">
                <div>
                    <h1>{t('common.farmers')}</h1>
                    <p>{t('farmers.manageFarmersDesc')} {currentBranch?.name}</p>
                </div>
                {!isFarmer && (
                    <button
                        className="btn btn-primary"
                        onClick={() => handleOpenModal()}
                        disabled={!currentBranch}
                    >
                        <Plus size={20} />
                        <span>{t('dashboard.addFarmer')}</span>
                    </button>
                )}
            </div>

            {isFarmer && (
                <div className="info-banner" style={{ marginBottom: '20px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', borderRadius: '12px' }}>
                    <AlertCircle size={20} />
                    <span>{t('farmers.readOnlyAccess')}</span>
                </div>
            )}

            <div className="filter-bar">
                <div className="search-box">
                    <Search size={20} color="#94a3b8" />
                    <input
                        type="text"
                        placeholder={t('farmers.searchPlaceholder')}
                        className="rural-input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="card farmer-list-card">
                <div className="table-responsive">
                    <table className="farmer-table">
                        <thead>
                            <tr>
                                <th>{t('farmers.id')}</th>
                                <th>{t('farmers.name')}</th>
                                <th>{t('farmers.cattleType')}</th>
                                <th>{t('farmers.mobile')}</th>
                                <th>{t('common.status')}</th>
                                {!isFarmer && <th>{t('common.actions')}</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredFarmers.map(farmer => (
                                <tr key={farmer.id}>
                                    <td><span className="id-badge">#{farmer.manualId || farmer.id}</span></td>
                                    <td>
                                        <div className="farmer-name-cell">
                                            <div className="avatar-sm">{farmer.name[0]}</div>
                                            <span>{farmer.name}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`badge ${farmer.milkType.toLowerCase()}`}>
                                            {farmer.milkType === 'Cow' ? `🐄 ${t('farmers.cow')}` : `🐃 ${t('farmers.buffalo')}`}
                                        </span>
                                    </td>
                                    <td>{farmer.phone || 'N/A'}</td>
                                    <td>
                                        <span className={`status-pill ${farmer.status.toLowerCase()}`}>
                                            {farmer.status}
                                        </span>
                                    </td>
                                    {!isFarmer && (
                                        <td>
                                            <div className="action-btns">
                                                <button className="icon-btn edit" onClick={() => handleOpenModal(farmer)}><Edit2 size={16} /></button>
                                                <button className="icon-btn delete" onClick={() => handleDelete(farmer.id)}><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                            {filteredFarmers.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="empty-row">{t('farmers.noFarmers')}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal card">
                        <h2>{editingFarmer ? t('farmers.editFarmer') : t('farmers.addNewFarmer')}</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>{t('farmers.manualId')}</label>
                                    <input
                                        type="text"
                                        className="rural-input"
                                        required
                                        value={formData.manualId}
                                        onChange={(e) => setFormData({ ...formData, manualId: e.target.value })}
                                        placeholder="1, 2, 3..."
                                    />
                                </div>
                                <div className="form-group">
                                    <label>{t('farmers.name')}</label>
                                    <input
                                        type="text"
                                        className="rural-input"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder={t('common.enterName')}
                                    />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>{t('farmers.cattleType')}</label>
                                    <select
                                        className="rural-input"
                                        value={formData.milkType}
                                        onChange={(e) => setFormData({ ...formData, milkType: e.target.value })}
                                    >
                                        <option value="Cow">🐄 {t('farmers.cow')}</option>
                                        <option value="Buffalo">🐃 {t('farmers.buffalo')}</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>{t('farmers.mobile')}</label>
                                    <input
                                        type="tel"
                                        className="rural-input"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder={t('common.enterMobile')}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>{t('common.status')}</label>
                                <select
                                    className="rural-input"
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                >
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                </select>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>{t('common.cancel')}</button>
                                <button type="submit" className="btn btn-primary">{t('common.save')}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
        .farmers-page { display: flex; flex-direction: column; gap: 24px; }
        .page-header { display: flex; justify-content: space-between; align-items: center; }
        .filter-bar { display: flex; gap: 16px; }
        .search-box { flex: 1; position: relative; display: flex; align-items: center; }
        .search-box svg { position: absolute; left: 14px; }
        .search-box .rural-input { padding-left: 45px; }

        .id-badge { background: #f1f5f9; color: #475569; padding: 2px 8px; border-radius: 4px; font-weight: 700; font-family: monospace; }
        .farmer-table { width: 100%; border-collapse: collapse; }
        .farmer-table th { text-align: left; padding: 16px; color: var(--text-muted); font-weight: 600; border-bottom: 2px solid var(--border); }
        .farmer-table td { padding: 16px; border-bottom: 1px solid var(--border); }
        .farmer-name-cell { display: flex; align-items: center; gap: 12px; font-weight: 600; }
        .avatar-sm { width: 32px; height: 32px; border-radius: 50%; background: var(--primary-light); color: white; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; }

        .badge { padding: 4px 12px; border-radius: 20px; font-size: 0.85rem; font-weight: 600; }
        .badge.cow { background: #dcfce7; color: #166534; }
        .badge.buffalo { background: #dbeafe; color: #1e40af; }

        .status-pill { padding: 4px 10px; border-radius: 6px; font-size: 0.8rem; font-weight: 600; text-transform: uppercase; }
        .status-pill.active { background: #f0fdf4; color: #15803d; }
        .status-pill.inactive { background: #fef2f2; color: #b91c1c; }

        .action-btns { display: flex; gap: 8px; }
        .icon-btn { width: 34px; height: 34px; border-radius: 8px; border: 1px solid var(--border); background: white; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; }
        .icon-btn:hover { background: #f8fafc; border-color: var(--primary); color: var(--primary); }
        .icon-btn.delete:hover { border-color: #ef4444; color: #ef4444; }

        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; padding: 20px; z-index: 2000; }
        .modal { width: 100%; max-width: 500px; padding: 30px; position: relative; }
        .form-group { margin-bottom: 20px; }
        .form-group label { display: block; margin-bottom: 8px; font-weight: 600; color: var(--secondary); }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .modal-footer { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; }
        .empty-row { text-align: center; padding: 40px; color: var(--text-muted); font-style: italic; }

        @media (max-width: 768px) {
            .farmers-page { gap: 16px; }
            .page-header { flex-direction: column; align-items: stretch; gap: 12px; }
            .filter-bar { flex-direction: column; }
            .farmer-table { display: block; overflow-x: auto; -webkit-overflow-scrolling: touch; }
            .farmer-table th, .farmer-table td { padding: 12px 8px; font-size: 0.85rem; }
            .modal { padding: 20px; max-width: 100%; }
            .form-row { grid-template-columns: 1fr; }
            .modal-footer { flex-direction: column-reverse; }
            .modal-footer .btn { width: 100%; }
        }
      `}} />
        </div>
    );
};

export default Farmers;
