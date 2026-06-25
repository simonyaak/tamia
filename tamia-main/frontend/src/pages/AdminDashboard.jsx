import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboard() {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [stats, setStats] = useState(null);
    const [verificationRequests, setVerificationRequests] = useState([]);
    const [users, setUsers] = useState([]);
    const [listings, setListings] = useState([]);
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Pagination & Filtering state
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    
    // Modal state
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedListing, setSelectedListing] = useState(null);

    // Monetization state
    const [monetizationData, setMonetizationData] = useState(null);

    // Audit logs state
    const [auditLogs, setAuditLogs] = useState([]);

    // Moderation state
    const [categories, setCategories] = useState([]);
    const [isEditingListing, setIsEditingListing] = useState(false);
    const [editListingForm, setEditListingForm] = useState({ title: '', description: '', price: '', category_id: '' });
    const [warningReason, setWarningReason] = useState('');

    // Category Management State
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [selectedCategoryForEdit, setSelectedCategoryForEdit] = useState(null);
    const [categoryForm, setCategoryForm] = useState({ name: '', slug: '', icon: '', parent_id: '' });

    const fetchCategories = async () => {
        try {
            const res = await fetch('/api/categories');
            const data = await res.json();
            setCategories(data);
        } catch (err) {
            console.error('Failed to load categories');
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    // Reset pagination when tab changes
    useEffect(() => {
        setPage(1);
        setSearchQuery('');
        setFilterStatus('');
    }, [activeTab]);

    useEffect(() => {
        if (authLoading) return;
        if (!user || user.role !== 'admin') {
            navigate('/');
            return;
        }
        fetchDashboardData();
    }, [user, authLoading, navigate, activeTab, page]);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'dashboard') {
                const dashRes = await fetch('/api/admin/dashboard', { credentials: 'include' });
                const dashData = await dashRes.json();
                setStats(dashData.stats);
            } else {
                const url = new URL(`/api/admin/${activeTab === 'verification' ? 'verification-requests' : activeTab}`, window.location.origin);
                url.searchParams.append('page', page);
                if (searchQuery) url.searchParams.append('search', searchQuery);
                if (filterStatus) {
                    if (activeTab === 'users') url.searchParams.append('role', filterStatus);
                    else url.searchParams.append('status', filterStatus);
                }

                const res = await fetch(url, { credentials: 'include' });
                const data = await res.json();
                
                if (activeTab === 'verification') {
                    setVerificationRequests(data.requests.data);
                    setTotalPages(data.requests.last_page);
                } else if (activeTab === 'users') {
                    setUsers(data.users.data);
                    setTotalPages(data.users.last_page);
                } else if (activeTab === 'listings') {
                    setListings(data.listings.data);
                    setTotalPages(data.listings.last_page);
                } else if (activeTab === 'reports') {
                    setReports(data.reports.data);
                    setTotalPages(data.reports.last_page);
                } else if (activeTab === 'monetization') {
                    setMonetizationData(data);
                } else if (activeTab === 'logs') {
                    setAuditLogs(data.logs.data);
                    setTotalPages(data.logs.last_page);
                }
            }
        } catch (err) {
            console.error('Error fetching admin data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleUserAction = async (userId, action, reason = '') => {
        try {
            const response = await fetch(
                `/api/admin/users/${userId}/${action}`,
                {
                    method: 'PATCH',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(reason ? { reason } : {}),
                }
            );
            if (response.ok) {
                fetchDashboardData();
            }
        } catch (err) {
            console.error('Error:', err);
        }
    };

    const handleListingAction = async (listingId, action, reason = '') => {
        try {
            const response = await fetch(
                `/api/admin/listings/${listingId}/${action}`,
                {
                    method: 'PATCH',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(reason ? { reason } : {}),
                }
            );
            if (response.ok) {
                fetchDashboardData();
            }
        } catch (err) {
            console.error('Error:', err);
        }
    };

    const handleReportAction = async (reportId, action, notes = '') => {
        try {
            const response = await fetch(
                `/api/admin/reports/${reportId}/resolve`,
                {
                    method: 'PATCH',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action, notes }),
                }
            );
            if (response.ok) {
                fetchDashboardData();
            }
        } catch (err) {
            console.error('Error:', err);
        }
    };

    const renderControls = (showRoleFilter = false, showStatusFilter = false) => (
        <div className="flex flex-col md:flex-row gap-4 mb-6 p-6 bg-white rounded-lg shadow">
            <div className="flex-1">
                <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            setPage(1);
                            fetchDashboardData();
                        }
                    }}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
            </div>
            {showRoleFilter && (
                <select
                    value={filterStatus}
                    onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
                    className="px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                >
                    <option value="">All Roles</option>
                    <option value="buyer">Buyer</option>
                    <option value="seller">Seller</option>
                    <option value="admin">Admin</option>
                </select>
            )}
            {showStatusFilter && (
                <select
                    value={filterStatus}
                    onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
                    className="px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                >
                    <option value="">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="suspended">Suspended</option>
                    <option value="rejected">Rejected</option>
                    <option value="resolved">Resolved</option>
                </select>
            )}
            <button
                onClick={() => { setPage(1); fetchDashboardData(); }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
            >
                Search
            </button>
        </div>
    );

    const renderPagination = () => {
        if (totalPages <= 1) return null;
        return (
            <div className="flex justify-between items-center mt-6 mb-8">
                <button
                    disabled={page === 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    className="px-6 py-2 bg-white border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50 font-semibold shadow-sm text-gray-700"
                >
                    Previous
                </button>
                <span className="text-gray-600 font-medium">Page {page} of {totalPages}</span>
                <button
                    disabled={page === totalPages}
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    className="px-6 py-2 bg-white border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50 font-semibold shadow-sm text-gray-700"
                >
                    Next
                </button>
            </div>
        );
    };

    const handleWarnUser = async (e) => {
        e.preventDefault();
        if (!warningReason.trim()) return;
        try {
            const res = await fetch(`/api/admin/users/${selectedUser.id}/warn`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: warningReason })
            });
            if (res.ok) {
                alert('Warning sent successfully');
                setWarningReason('');
            }
        } catch (err) { console.error('Failed to warn user', err); }
    };

    const startEditingListing = () => {
        setEditListingForm({
            title: selectedListing.title,
            description: selectedListing.description,
            price: selectedListing.price,
            category_id: selectedListing.category_id,
        });
        setIsEditingListing(true);
    };

    const handleUpdateListing = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`/api/admin/listings/${selectedListing.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editListingForm)
            });
            if (res.ok) {
                const data = await res.json();
                setSelectedListing(data.listing);
                setIsEditingListing(false);
                fetchDashboardData();
            }
        } catch (err) { console.error('Failed to update listing', err); }
    };

    const handleSaveCategory = async (e) => {
        e.preventDefault();
        const method = selectedCategoryForEdit ? 'PUT' : 'POST';
        const url = selectedCategoryForEdit ? `/api/admin/categories/${selectedCategoryForEdit.id}` : '/api/admin/categories';
        
        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(categoryForm)
            });
            if (res.ok) {
                setIsCategoryModalOpen(false);
                fetchCategories();
            } else {
                const data = await res.json();
                alert('Error saving category: ' + (data.message || 'Unknown error'));
            }
        } catch (err) { console.error('Failed to save category', err); }
    };

    const handleDeleteCategory = async (id) => {
        if (!window.confirm('Are you sure you want to delete this category?')) return;
        try {
            const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchCategories();
            } else {
                const data = await res.json();
                alert(data.message || 'Error deleting category');
            }
        } catch (err) { console.error('Failed to delete category', err); }
    };

    const openCategoryModal = (category = null) => {
        if (category) {
            setSelectedCategoryForEdit(category);
            setCategoryForm({ name: category.name, slug: category.slug, icon: category.icon || '', parent_id: category.parent_id || '' });
        } else {
            setSelectedCategoryForEdit(null);
            setCategoryForm({ name: '', slug: '', icon: '', parent_id: '' });
        }
        setIsCategoryModalOpen(true);
    };

    const renderUserModal = () => {
        if (!selectedUser) return null;
        return (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
                    <div className="p-6 border-b flex justify-between items-center bg-gray-50">
                        <h2 className="text-xl font-bold text-gray-900">User Details</h2>
                        <button onClick={() => setSelectedUser(null)} className="text-gray-400 hover:text-gray-600">
                            ✕
                        </button>
                    </div>
                    <div className="p-6 overflow-y-auto space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl font-bold">
                                {selectedUser.name.substring(0, 1).toUpperCase()}
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">{selectedUser.name}</h3>
                                <p className="text-gray-500 text-sm">{selectedUser.email}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-4">
                            <div className="bg-gray-50 p-3 rounded-lg">
                                <p className="text-xs text-gray-400 uppercase font-bold">Role</p>
                                <p className="font-semibold text-gray-800 capitalize">{selectedUser.role}</p>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg">
                                <p className="text-xs text-gray-400 uppercase font-bold">Phone</p>
                                <p className="font-semibold text-gray-800">{selectedUser.phone || 'N/A'}</p>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg">
                                <p className="text-xs text-gray-400 uppercase font-bold">Status</p>
                                <p className="font-semibold text-gray-800 capitalize">{selectedUser.status}</p>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg">
                                <p className="text-xs text-gray-400 uppercase font-bold">Verification</p>
                                <p className="font-semibold text-gray-800">{selectedUser.is_verified ? 'Verified' : 'Unverified'}</p>
                            </div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-xs text-gray-400 uppercase font-bold">Joined</p>
                            <p className="font-semibold text-gray-800">{new Date(selectedUser.created_at).toLocaleString()}</p>
                        </div>
                        
                        <div className="bg-red-50 border border-red-100 p-4 rounded-lg mt-4">
                            <h4 className="text-sm font-bold text-red-600 mb-2 uppercase flex items-center gap-2">
                                <span>⚠️</span> Send Official Warning
                            </h4>
                            <form onSubmit={handleWarnUser} className="flex flex-col gap-2">
                                <textarea 
                                    className="w-full p-2 border border-red-200 rounded-lg text-sm focus:ring-red-500 focus:border-red-500 bg-white" 
                                    placeholder="Enter reason for warning this user..." 
                                    value={warningReason}
                                    onChange={(e) => setWarningReason(e.target.value)}
                                    required
                                    rows="3"
                                ></textarea>
                                <button type="submit" className="self-end px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors">
                                    Send Warning
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderListingModal = () => {
        if (!selectedListing) return null;
        return (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
                    <div className="p-6 border-b flex justify-between items-center bg-gray-50">
                        <h2 className="text-xl font-bold text-gray-900 truncate pr-4">{selectedListing.title}</h2>
                        <button onClick={() => setSelectedListing(null)} className="text-gray-400 hover:text-gray-600">
                            ✕
                        </button>
                    </div>
                    <div className="p-6 overflow-y-auto space-y-6">
                        {selectedListing.images && selectedListing.images.length > 0 ? (
                            <div className="flex gap-2 overflow-x-auto pb-2">
                                {selectedListing.images.map((img, idx) => (
                                    <img key={idx} src={img.url} alt="listing" className="h-32 w-48 object-cover rounded-lg border border-gray-200" />
                                ))}
                            </div>
                        ) : (
                            <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                                No Images
                            </div>
                        )}
                        
                        {isEditingListing ? (
                            <form onSubmit={handleUpdateListing} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                    <input type="text" value={editListingForm.title} onChange={e => setEditListingForm({...editListingForm, title: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                                    <input type="number" value={editListingForm.price} onChange={e => setEditListingForm({...editListingForm, price: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                    <select value={editListingForm.category_id} onChange={e => setEditListingForm({...editListingForm, category_id: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500" required>
                                        <option value="">Select Category</option>
                                        {categories.map(c => (
                                            <optgroup key={c.id} label={c.name}>
                                                <option value={c.id}>{c.name}</option>
                                                {c.children && c.children.map(child => (
                                                    <option key={child.id} value={child.id}>-- {child.name}</option>
                                                ))}
                                            </optgroup>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <textarea value={editListingForm.description} onChange={e => setEditListingForm({...editListingForm, description: e.target.value})} rows="4" className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500" required></textarea>
                                </div>
                                <div className="flex justify-end gap-2 pt-2">
                                    <button type="button" onClick={() => setIsEditingListing(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium text-sm">Cancel</button>
                                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm">Save Changes</button>
                                </div>
                            </form>
                        ) : (
                            <>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="bg-gray-50 p-3 rounded-lg">
                                        <p className="text-xs text-gray-400 uppercase font-bold">Price</p>
                                        <p className="font-bold text-green-600">UGX {new Intl.NumberFormat().format(selectedListing.price)}</p>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-lg">
                                        <p className="text-xs text-gray-400 uppercase font-bold">Category</p>
                                        <p className="font-semibold text-gray-800">{selectedListing.category?.name}</p>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-lg">
                                        <p className="text-xs text-gray-400 uppercase font-bold">Status</p>
                                        <p className="font-semibold text-gray-800 capitalize">{selectedListing.status}</p>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-lg">
                                        <p className="text-xs text-gray-400 uppercase font-bold">Seller</p>
                                        <p className="font-semibold text-gray-800">{selectedListing.user?.name}</p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 uppercase font-bold mb-2">Description</p>
                                    <p className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg text-sm">{selectedListing.description}</p>
                                </div>
                                <div className="flex justify-between border-t pt-4">
                                    <button onClick={startEditingListing} className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 font-semibold text-sm flex items-center gap-2">
                                        <span>✏️</span> Edit Listing Content
                                    </button>
                                    <a href={`/listing/${selectedListing.slug}`} target="_blank" rel="noreferrer" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-sm">
                                        View Live Listing
                                    </a>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    if (authLoading || (loading && !stats && users.length === 0)) {
        return <div className="min-h-screen flex items-center justify-center">Loading admin dashboard...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-100 py-8 px-4 md:px-8">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

                {/* Navigation Tabs */}
                <div className="flex gap-4 mb-8 bg-white rounded-lg shadow p-2 overflow-x-auto">
                    {['dashboard', 'verification', 'users', 'listings', 'reports', 'categories', 'monetization', 'logs'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => {
                                setActiveTab(tab);
                                setLoading(true);
                            }}
                            className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                                activeTab === tab
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Dashboard Stats */}
                {activeTab === 'dashboard' && stats && (
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        <div className="bg-white rounded-lg shadow p-6">
                            <p className="text-gray-600 text-sm font-semibold">Total Users</p>
                            <p className="text-3xl font-bold text-blue-600">{stats.total_users}</p>
                        </div>
                        <div className="bg-white rounded-lg shadow p-6">
                            <p className="text-gray-600 text-sm font-semibold">Total Listings</p>
                            <p className="text-3xl font-bold text-green-600">{stats.total_listings}</p>
                        </div>
                        <div className="bg-white rounded-lg shadow p-6">
                            <p className="text-gray-600 text-sm font-semibold">Active Listings</p>
                            <p className="text-3xl font-bold text-green-500">{stats.active_listings}</p>
                        </div>
                        <div className="bg-white rounded-lg shadow p-6">
                            <p className="text-gray-600 text-sm font-semibold">Avg Rating</p>
                            <p className="text-3xl font-bold text-yellow-500">
                                {stats.avg_rating ? Number(stats.avg_rating).toFixed(1) : 'N/A'}
                            </p>
                        </div>
                        <div className="bg-white rounded-lg shadow p-6">
                            <p className="text-gray-600 text-sm font-semibold">Total Reviews</p>
                            <p className="text-3xl font-bold text-purple-600">{stats.total_reviews}</p>
                        </div>
                        <div className="bg-white rounded-lg shadow p-6">
                            <p className="text-gray-600 text-sm font-semibold">Total Reports</p>
                            <p className="text-3xl font-bold text-red-600">{stats.total_reports}</p>
                        </div>
                        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
                            <p className="text-gray-600 text-sm font-semibold">Pending Verifications</p>
                            <p className="text-3xl font-bold text-blue-600">{stats.pending_verifications}</p>
                        </div>
                    </div>
                )}

                {/* Verification Requests */}
                {activeTab === 'verification' && (
                    <>
                        {renderControls()}
                        <div className="bg-white rounded-lg shadow overflow-x-auto">
                            <div className="p-6 border-b border-gray-100">
                                <h2 className="text-xl font-semibold text-gray-900">Pending Verification Requests</h2>
                                <p className="mt-2 text-sm text-gray-500">Review users who requested identity verification.</p>
                            </div>
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Role</th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Requested</th>
                                        <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {verificationRequests.map((u) => (
                                        <tr key={u.id} className="border-b hover:bg-gray-50">
                                            <td className="px-6 py-3 text-sm text-gray-900 font-medium">
                                                <button onClick={() => setSelectedUser(u)} className="hover:text-blue-600 hover:underline">{u.name}</button>
                                            </td>
                                            <td className="px-6 py-3 text-sm text-gray-600">{u.email}</td>
                                            <td className="px-6 py-3 text-sm text-gray-600">{u.role}</td>
                                            <td className="px-6 py-3 text-sm text-gray-600">{new Date(u.verification_requested_at).toLocaleString()}</td>
                                            <td className="px-6 py-3 text-sm text-right space-x-2">
                                                <button
                                                    onClick={() => handleUserAction(u.id, 'verify')}
                                                    className="text-green-600 hover:text-green-900 font-semibold"
                                                >
                                                    Verify
                                                </button>
                                                <button
                                                    onClick={() => handleUserAction(u.id, 'reject-verification', 'Verification request denied by admin')}
                                                    className="text-orange-600 hover:text-orange-900 font-semibold"
                                                >
                                                    Reject
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {renderPagination()}
                    </>
                )}

                {/* Users Management */}
                {activeTab === 'users' && (
                    <>
                        {renderControls(true, false)}
                        <div className="bg-white rounded-lg shadow overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Role</th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Verification</th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                                        <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((u) => (
                                        <tr key={u.id} className="border-b hover:bg-gray-50">
                                            <td className="px-6 py-3 text-sm text-gray-900 font-medium">
                                                <button onClick={() => setSelectedUser(u)} className="hover:text-blue-600 hover:underline">{u.name}</button>
                                            </td>
                                            <td className="px-6 py-3 text-sm text-gray-600">{u.email}</td>
                                            <td className="px-6 py-3 text-sm text-gray-600">{u.role}</td>
                                            <td className="px-6 py-3 text-sm">
                                                {u.is_verified ? (
                                                    <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                                                        Verified
                                                    </span>
                                                ) : u.verification_requested_at ? (
                                                    <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold animate-pulse">
                                                        Pending
                                                    </span>
                                                ) : (
                                                    <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
                                                        Not requested
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-3 text-sm">
                                                {u.status}
                                            </td>
                                            <td className="px-6 py-3 text-sm text-right space-x-2">
                                                {!u.is_verified && u.verification_requested_at && (
                                                    <button
                                                        onClick={() => handleUserAction(u.id, 'reject-verification', 'Verification request denied by admin')}
                                                        className="text-orange-600 hover:text-orange-900 font-semibold"
                                                    >
                                                        Reject Request
                                                    </button>
                                                )}
                                                {!u.is_verified && (
                                                    <button
                                                        onClick={() => handleUserAction(u.id, 'verify')}
                                                        className="text-green-600 hover:text-green-900 font-semibold"
                                                    >
                                                        Verify
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleUserAction(u.id, 'suspend', 'Suspended by admin')}
                                                    className="text-red-600 hover:text-red-900 font-semibold"
                                                >
                                                    Suspend
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {renderPagination()}
                    </>
                )}

                {/* Listings Moderation */}
                {activeTab === 'listings' && (
                    <>
                        {renderControls(false, true)}
                        <div className="space-y-4">
                            {listings.map((listing) => (
                                <div key={listing.id} className="bg-white rounded-lg shadow p-6 border-l-4 border-transparent hover:border-blue-500 transition-colors">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900">
                                                <button onClick={() => setSelectedListing(listing)} className="hover:text-blue-600 hover:underline text-left">
                                                    {listing.title}
                                                </button>
                                            </h3>
                                            <p className="text-gray-600">By <button onClick={() => setSelectedUser(listing.user)} className="hover:underline">{listing.user.name}</button></p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                            {
                                                'active': 'bg-green-100 text-green-800',
                                                'pending': 'bg-yellow-100 text-yellow-800',
                                                'suspended': 'bg-red-100 text-red-800',
                                                'rejected': 'bg-gray-100 text-gray-800',
                                            }[listing.status] || 'bg-gray-100 text-gray-800'
                                        }`}>
                                            {listing.status}
                                        </span>
                                    </div>
                                    <p className="text-gray-700 mb-4">{listing.description}</p>
                                    <div className="flex gap-2">
                                        {listing.status !== 'active' && (
                                            <button
                                                onClick={() => handleListingAction(listing.id, 'approve')}
                                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                            >
                                                Approve
                                            </button>
                                        )}
                                        {listing.status !== 'suspended' && (
                                            <button
                                                onClick={() => handleListingAction(listing.id, 'suspend', 'Suspended by admin')}
                                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                            >
                                                Suspend
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                        {renderPagination()}
                    </>
                )}

                {/* Reports Management */}
                {activeTab === 'reports' && (
                    <>
                        {renderControls(false, true)}
                        <div className="space-y-4">
                            {reports.map((report) => (
                                <div key={report.id} className="bg-white rounded-lg shadow p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900">
                                                Report #{report.id}
                                            </h3>
                                            <p className="text-gray-600 text-sm">
                                                By <strong>{report.reporter.name}</strong>
                                            </p>
                                            {report.listing && (
                                                <p className="text-gray-600 text-sm">
                                                    About: <strong>{report.listing.title}</strong>
                                                </p>
                                            )}
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                            report.status === 'pending'
                                                ? 'bg-yellow-100 text-yellow-800'
                                                : 'bg-green-100 text-green-800'
                                        }`}>
                                            {report.status}
                                        </span>
                                    </div>
                                    <p className="text-gray-700 mb-4"><strong>Reason:</strong> {report.reason}</p>
                                    {report.status === 'pending' && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleReportAction(report.id, 'dismiss')}
                                                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                                            >
                                                Dismiss
                                            </button>
                                            <button
                                                onClick={() => handleReportAction(report.id, 'suspend_listing')}
                                                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                                            >
                                                Suspend Listing
                                            </button>
                                            <button
                                                onClick={() => handleReportAction(report.id, 'suspend_user')}
                                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                            >
                                                Suspend User
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        {renderPagination()}
                    </>
                )}

                {/* Categories Management */}
                {activeTab === 'categories' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow">
                            <h2 className="text-xl font-bold text-gray-900">Manage Categories</h2>
                            <button onClick={() => openCategoryModal()} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-sm shadow-sm">
                                + Add Category
                            </button>
                        </div>
                        <div className="bg-white rounded-lg shadow overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Slug</th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Level</th>
                                        <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {categories.map((c) => (
                                        <React.Fragment key={c.id}>
                                            <tr className="border-b hover:bg-gray-50">
                                                <td className="px-6 py-3 text-sm text-gray-900 font-bold">{c.icon} {c.name}</td>
                                                <td className="px-6 py-3 text-sm text-gray-600">{c.slug}</td>
                                                <td className="px-6 py-3 text-sm text-gray-600">Parent</td>
                                                <td className="px-6 py-3 text-sm text-right space-x-2">
                                                    <button onClick={() => openCategoryModal(c)} className="text-blue-600 hover:text-blue-900 font-semibold">Edit</button>
                                                    <button onClick={() => handleDeleteCategory(c.id)} className="text-red-600 hover:text-red-900 font-semibold">Delete</button>
                                                </td>
                                            </tr>
                                            {c.children && c.children.map(child => (
                                                <tr key={child.id} className="border-b hover:bg-gray-50 bg-gray-50/50">
                                                    <td className="px-6 py-3 text-sm text-gray-900 pl-12">└ {child.name}</td>
                                                    <td className="px-6 py-3 text-sm text-gray-600">{child.slug}</td>
                                                    <td className="px-6 py-3 text-sm text-gray-600">Child</td>
                                                    <td className="px-6 py-3 text-sm text-right space-x-2">
                                                        <button onClick={() => openCategoryModal(child)} className="text-blue-600 hover:text-blue-900 font-semibold">Edit</button>
                                                        <button onClick={() => handleDeleteCategory(child.id)} className="text-red-600 hover:text-red-900 font-semibold">Delete</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Monetization Management */}
                {activeTab === 'monetization' && monetizationData && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
                                <p className="text-gray-600 text-sm font-semibold">Total Revenue</p>
                                <p className="text-3xl font-bold text-green-600">UGX {new Intl.NumberFormat().format(monetizationData.total_revenue || 0)}</p>
                            </div>
                            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
                                <p className="text-gray-600 text-sm font-semibold">Currently Promoted Listings</p>
                                <p className="text-3xl font-bold text-purple-600">{monetizationData.promoted_listings_count}</p>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow overflow-hidden">
                            <div className="p-6 border-b border-gray-100">
                                <h2 className="text-xl font-semibold text-gray-900">Recent Payments</h2>
                            </div>
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Reference</th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">User</th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Listing</th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Type</th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Amount</th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {monetizationData.recent_payments && monetizationData.recent_payments.map((payment) => (
                                        <tr key={payment.id} className="border-b hover:bg-gray-50">
                                            <td className="px-6 py-3 text-sm text-gray-900 font-mono">{payment.reference}</td>
                                            <td className="px-6 py-3 text-sm text-gray-600">
                                                <button onClick={() => setSelectedUser(payment.user)} className="hover:text-blue-600 hover:underline">{payment.user?.name}</button>
                                            </td>
                                            <td className="px-6 py-3 text-sm text-gray-600">
                                                <button onClick={() => setSelectedListing(payment.listing)} className="hover:text-blue-600 hover:underline">{payment.listing?.title}</button>
                                            </td>
                                            <td className="px-6 py-3 text-sm text-gray-600 capitalize">{payment.type}</td>
                                            <td className="px-6 py-3 text-sm font-bold text-green-600">UGX {new Intl.NumberFormat().format(payment.amount)}</td>
                                            <td className="px-6 py-3 text-sm text-gray-600">{new Date(payment.created_at).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                    {(!monetizationData.recent_payments || monetizationData.recent_payments.length === 0) && (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-4 text-center text-gray-500">No recent payments found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Audit Logs */}
                {activeTab === 'logs' && (
                    <>
                        <div className="bg-white rounded-lg shadow overflow-x-auto">
                            <div className="p-6 border-b border-gray-100">
                                <h2 className="text-xl font-semibold text-gray-900">Audit Logs</h2>
                                <p className="mt-2 text-sm text-gray-500">Track all administrative actions performed on the platform.</p>
                            </div>
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Admin</th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Action</th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Target</th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Details</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {auditLogs.map((log) => (
                                        <tr key={log.id} className="border-b hover:bg-gray-50">
                                            <td className="px-6 py-3 text-sm text-gray-600 whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td>
                                            <td className="px-6 py-3 text-sm font-medium text-gray-900">{log.admin?.name}</td>
                                            <td className="px-6 py-3 text-sm text-blue-600 font-semibold">{log.action}</td>
                                            <td className="px-6 py-3 text-sm text-gray-600">{log.target_type} #{log.target_id}</td>
                                            <td className="px-6 py-3 text-sm text-gray-500">
                                                {log.details ? <pre className="text-xs">{JSON.stringify(log.details, null, 2)}</pre> : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                    {auditLogs.length === 0 && (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-4 text-center text-gray-500">No logs found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {renderPagination()}
                    </>
                )}
            </div>
            
            {/* Render Modals */}
            {renderUserModal()}
            {renderListingModal()}
            
            {/* Category Form Modal */}
            {isCategoryModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
                        <div className="p-6 border-b flex justify-between items-center bg-gray-50">
                            <h2 className="text-xl font-bold text-gray-900">{selectedCategoryForEdit ? 'Edit Category' : 'Add Category'}</h2>
                            <button onClick={() => setIsCategoryModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>
                        <div className="p-6">
                            <form onSubmit={handleSaveCategory} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                    <input type="text" value={categoryForm.name} onChange={e => setCategoryForm({...categoryForm, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Slug (URL friendly name)</label>
                                    <input type="text" value={categoryForm.slug} onChange={e => setCategoryForm({...categoryForm, slug: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Icon (optional, emoji or class)</label>
                                    <input type="text" value={categoryForm.icon} onChange={e => setCategoryForm({...categoryForm, icon: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Parent Category (optional)</label>
                                    <select value={categoryForm.parent_id} onChange={e => setCategoryForm({...categoryForm, parent_id: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500">
                                        <option value="">None (Top Level)</option>
                                        {categories.map(c => (
                                            <option key={c.id} value={c.id} disabled={selectedCategoryForEdit?.id === c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex justify-end gap-2 pt-4">
                                    <button type="button" onClick={() => setIsCategoryModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium">Cancel</button>
                                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">Save</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
