import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initializeApp, deleteApp } from 'firebase/app';
import {
    getAuth,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    updatePassword,
    EmailAuthProvider,
    reauthenticateWithCredential
} from 'firebase/auth';
import {
    getFirestore,
    collection,
    onSnapshot,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    setDoc,
    serverTimestamp,
    getDoc,
    query,
    where,
    orderBy,
    getDocs,
    writeBatch,
    increment
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
    User, Lock, X, PlusCircle, Trash2, Edit, BarChart as BarChartIcon,
    LogOut, Building, Loader2, Users2, DollarSign, TrendingUp, AlertTriangle,
    LayoutDashboard, BarChartHorizontal, BookCopy, Download, FlaskConical, Search,
    MessageSquare, Stethoscope, Calendar, HeartPulse, LifeBuoy, UploadCloud, FileText,
    Camera, Menu, Eye, EyeOff, UserPlus, File, CircleDollarSign, Package, Box, Truck,
    Check, CheckCheck, Send, MapPin, Settings, Moon, Sun, ExternalLink, BookHeart
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, Sector } from 'recharts';

// Konfigurasi Firebase Anda
const firebaseConfig = {
    apiKey: "AIzaSyA84VAbum2z9b-sqr0twFXWV0JSd9QofYA",
    authDomain: "sibiomasi-bf0b4.firebaseapp.com",
    projectId: "sibiomasi-bf0b4",
    storageBucket: "sibiomasi-bf0b4.firebasestorage.app",
    messagingSenderId: "1048556092969",
    appId: "1:1048556092969:web:0892c47b7d0752b862a638"
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// --- Komponen Loading Spinner ---
const LoadingSpinner = () => (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
            <Loader2 className="animate-spin text-indigo-600 h-16 w-16 mx-auto" />
            <p className="mt-4 text-gray-600">Memuat data...</p>
        </div>
    </div>
);

// --- Komponen Modal Kustom ---
const CustomModal = ({ show, onClose, title, children, footer }) => {
    if (!show) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md m-auto" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>
                <div className="p-6 text-gray-600">
                    {children}
                </div>
                {footer && (
                    <div className="flex justify-end items-center p-4 bg-gray-50 border-t rounded-b-lg space-x-2">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};

// --- [BARU] Komponen Manajemen Layanan ---
const ServiceManagement = ({ services, showModal, hideModal }) => {
    const [showForm, setShowForm] = useState(false);
    const [editingService, setEditingService] = useState(null);
    const [formData, setFormData] = useState({ name: '', category: '', price: '' });

    const resetForm = () => {
        setFormData({ name: '', category: '', price: '' });
        setEditingService(null);
        setShowForm(false);
    };

    const handleEdit = (service) => {
        setEditingService(service);
        setFormData({ name: service.name, category: service.category, price: service.price });
        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const dataToSave = {
                ...formData,
                price: Number(formData.price)
            };

            if (editingService) {
                await updateDoc(doc(db, 'services', editingService.id), dataToSave);
            } else {
                await addDoc(collection(db, 'services'), dataToSave);
            }
            resetForm();
            showModal({
                title: 'Sukses',
                children: <p>Data layanan berhasil disimpan.</p>,
                footer: <button onClick={hideModal} className="bg-indigo-600 text-white px-4 py-2 rounded-md">OK</button>
            });
        } catch (error) {
            console.error("Error saving service:", error);
            showModal({
                title: 'Error',
                children: <p>Gagal menyimpan data layanan. Silakan coba lagi.</p>,
                footer: <button onClick={hideModal} className="bg-red-600 text-white px-4 py-2 rounded-md">Tutup</button>
            });
        }
    };

    const handleDelete = (serviceId) => {
        showModal({
            title: 'Konfirmasi Hapus Layanan',
            children: <p>Apakah Anda yakin ingin menghapus layanan ini?</p>,
            footer: (
                <>
                    <button onClick={hideModal} className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-400">Batal</button>
                    <button
                        onClick={async () => {
                            try {
                                await deleteDoc(doc(db, "services", serviceId));
                                hideModal();
                            } catch (error) {
                                console.error("Error deleting service:", error);
                                hideModal();
                                showModal({
                                    title: 'Error',
                                    children: <p>Gagal menghapus layanan.</p>,
                                    footer: <button onClick={hideModal} className="bg-red-600 text-white px-4 py-2 rounded-md">Tutup</button>
                                });
                            }
                        }}
                        className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                    >
                        Hapus
                    </button>
                </>
            )
        });
    };

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-700 p-4 rounded-lg shadow-md mb-6">Manajemen Layanan</h2>
            <div className="flex justify-end mb-6">
                <button onClick={() => setShowForm(true)} className="bg-indigo-600 text-white px-3 py-2 text-sm sm:px-4 rounded-md hover:bg-indigo-700 flex items-center">
                    <PlusCircle size={18} className="mr-2"/> Tambah Layanan
                </button>
            </div>
            {showForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">{editingService ? 'Edit Layanan' : 'Tambah Layanan Baru'}</h3>
                            <button onClick={resetForm}><X/></button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div><label>Nama Layanan</label><input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required/></div>
                                <div><label>Kategori</label><input type="text" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" placeholder="Contoh: Konsultasi" required/></div>
                                <div className="md:col-span-2"><label>Harga (Rp)</label><input type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required/></div>
                            </div>
                            <div className="flex space-x-4"><button type="submit" className="bg-indigo-600 text-white px-3 py-1.5 text-sm sm:px-4 sm:py-2 rounded-md">{editingService ? 'Perbarui' : 'Simpan'}</button><button type="button" onClick={resetForm} className="bg-gray-500 text-white px-3 py-1.5 text-sm sm:px-4 sm:py-2 rounded-md">Batal</button></div>
                        </form>
                    </div>
                </div>
            )}
            <div className="bg-white rounded-lg shadow overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 responsive-table">
                    <thead className="bg-cyan-200">
                        <tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Nama Layanan</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Kategori</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Harga</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Aksi</th></tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {services.map(service => (
                            <tr key={service.id}>
                                <td className="px-6 py-4 whitespace-nowrap" data-label="Nama">{service.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap" data-label="Kategori">{service.category}</td>
                                <td className="px-6 py-4 whitespace-nowrap" data-label="Harga">{formatCurrency(service.price)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" data-label="Aksi">
                                    <button onClick={() => handleEdit(service)} className="text-indigo-600 hover:text-indigo-900 mr-3"><Edit size={16}/></button>
                                    <button onClick={() => handleDelete(service.id)} className="text-red-600 hover:text-red-900"><Trash2 size={16}/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- Komponen Tombol Ekspor ---
const ExportButtons = ({ data, title, columns, scriptsReady, customPdfHandler }) => {
    const [exporting, setExporting] = useState(null);

    const handleExport = async (format) => {
        setExporting(format);
        try {
            // Gunakan custom handler untuk PDF jika tersedia
            if (format === 'pdf' && customPdfHandler) {
                customPdfHandler();
                return;
            }

            const exportData = data.map(row => {
                const newRow = {};
                columns.forEach(col => {
                    newRow[col.header] = col.accessor(row);
                });
                return newRow;
            });

            if (format === 'csv') {
                const header = columns.map(c => c.header).join(',');
                const body = exportData.map(d => Object.values(d).join(',')).join('\n');
                const csvContent = `data:text/csv;charset=utf-8,${header}\n${body}`;
                const encodedUri = encodeURI(csvContent);
                const link = document.createElement("a");
                link.setAttribute("href", encodedUri);
                link.setAttribute("download", `${title.replace(/ /g, '_')}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else if (format === 'excel') {
                if(!window.XLSX) { console.error("XLSX script not loaded!"); return; }
                const worksheet = window.XLSX.utils.json_to_sheet(exportData);
                const workbook = window.XLSX.utils.book_new();
                window.XLSX.utils.book_append_sheet(workbook, worksheet, title);
                window.XLSX.writeFile(workbook, `${title.replace(/ /g, '_')}.xlsx`);
            } else if (format === 'pdf') {
                if(!window.jspdf) { console.error("jsPDF script not loaded!"); return; }
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF();
                
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(16);
                doc.text(title, 15, 20);
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(10);
                doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`, 15, 26);
                
                doc.autoTable({
                    head: [columns.map(c => c.header)],
                    body: exportData.map(d => Object.values(d)),
                    startY: 35,
                    theme: 'grid',
                    headStyles: { fillColor: [44, 62, 80] },
                });
                doc.save(`${title.replace(/ /g, '_')}.pdf`);
            }
        } catch (error) {
            console.error(`Export to ${format} failed`, error);
        } finally {
            setExporting(null);
        }
    };

    return (
        <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => handleExport('csv')} disabled={!scriptsReady || !!exporting} className="bg-green-600 text-white px-2 py-1 text-xs sm:px-3 sm:text-sm rounded-md flex items-center disabled:bg-gray-400">
                {exporting === 'csv' ? <Loader2 size={14} className="animate-spin"/> : <Download size={14} className="mr-1"/>} CSV
            </button>
            <button onClick={() => handleExport('excel')} disabled={!scriptsReady || !!exporting} className="bg-blue-600 text-white px-2 py-1 text-xs sm:px-3 sm:text-sm rounded-md flex items-center disabled:bg-gray-400">
                {exporting === 'excel' ? <Loader2 size={14} className="animate-spin"/> : <Download size={14} className="mr-1"/>} Excel
            </button>
            <button onClick={() => handleExport('pdf')} disabled={!scriptsReady || !!exporting} className="bg-red-600 text-white px-2 py-1 text-xs sm:px-3 sm:text-sm rounded-md flex items-center disabled:bg-gray-400">
                {exporting === 'pdf' ? <Loader2 size={14} className="animate-spin"/> : <Download size={14} className="mr-1"/>} PDF/Cetak
            </button>
        </div>
    );
};

// --- Komponen Login ---
const LoginForm = ({ appSettings }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (err) {
            setError('Email atau password salah.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 sm:p-6 lg:p-8">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-2xl">
                <div>
                    <img src={appSettings.logoUrl} alt="Logo Sibiomasi" className="mx-auto h-20 w-20 rounded-full shadow-md"/>
                    <h2 className="mt-6 text-center text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-amber-600">
                        {appSettings.clinicName}
                    </h2>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="rounded-md shadow-sm">
                        <div><input id="email" name="email" type="email" required className="appearance-none rounded-t-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                        <div className="relative">
                            <input id="password" name="password" type={showPassword ? 'text' : 'password'} required className="appearance-none rounded-b-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5 text-gray-500"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>
                    {error && <div className="text-red-600 text-sm text-center">{error}</div>}
                    <div><button type="submit" disabled={loading} className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400">{loading ? <Loader2 className="animate-spin" /> : 'Login'}</button></div>
                </form>
            </div>
        </div>
    );
};

// --- Komponen Header ---
const Header = ({ currentUser, toggleSidebar, handleLogout, appSettings, setShowChangePasswordModal, branches }) => {
    const branchName = useMemo(() => {
        if (!currentUser || !currentUser.branchId || !branches) return null;
        const branch = branches.find(b => b.id === currentUser.branchId);
        return branch ? branch.name : null;
    }, [currentUser, branches]);

    const isBranchAdmin = currentUser?.role === 'staf_operasional' && branchName;

    return (
        <header className="bg-white shadow sticky top-0 z-50">
            <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center py-2">
                    <div className="flex items-center">
                        <button onClick={toggleSidebar} className="text-gray-500 hover:text-gray-900 mr-4 lg:hidden">
                            <Menu size={24} />
                        </button>
                        <img src={appSettings.logoUrl} alt="Logo Sibiomasi" className="h-10 w-10 rounded-full shadow-md mr-3"/>
                        {isBranchAdmin ? (
                            <div>
                                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-500 to-indigo-600 hidden md:block" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.1)' }}>
                                    {branchName}
                                </h1>
                                <p className="text-xs text-gray-500 hidden md:block -mt-1">Dasbor Cabang</p>
                            </div>
                        ) : (
                            <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-amber-600 hidden md:block">{appSettings.clinicName}</h1>
                        )}
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-700 hidden sm:block">
                            Selamat datang, {currentUser?.email}
                        </span>
                        <button onClick={() => setShowChangePasswordModal(true)} className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md text-sm font-medium flex items-center">
                            <Lock size={16} className="mr-2"/> Ubah Password
                        </button>
                        <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center">
                            <LogOut size={16} className="mr-2"/> Logout
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

// --- [BARU] Komponen Header Pasien ---
const PatientHeader = ({ currentUser, handleLogout, appSettings }) => {
    return (
        <header className="bg-white shadow sticky top-0 z-50">
            <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center py-2">
                    <div className="flex items-center">
                        <img src={appSettings.logoUrl} alt="Logo Sibiomasi" className="h-10 w-10 rounded-full shadow-md mr-3"/>
                        <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-amber-600">{appSettings.clinicName}</h1>
                    </div>
                    <div className="flex items-center space-x-2">
                         <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center">
                            <LogOut size={16} className="mr-2"/> Logout
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

// --- Komponen Manajemen Pengguna ---
const UserManagement = ({ users, branches, showModal, hideModal, scriptsReady, currentUser }) => {
    const [activeTab, setActiveTab] = useState('list');
    const [showForm, setShowForm] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({ name: '', email: '', role: '', phone: '', branchId: '', photoUrl: '', address: '' });
    const [grantLoginAccess, setGrantLoginAccess] = useState(true);
    const [password, setPassword] = useState('');
    const [photoFile, setPhotoFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    const resetForm = () => {
        setFormData({ name: '', email: '', role: '', phone: '', branchId: '', photoUrl: '', address: '' });
        setEditingUser(null);
        setShowForm(false);
        setPhotoFile(null);
        setPassword('');
        setGrantLoginAccess(true);
    };

    const handleEdit = (user) => {
        setEditingUser(user);
        setFormData({
            name: user.name || '',
            email: user.email || '',
            role: user.role || '',
            phone: user.phone || '',
            branchId: user.branchId || '',
            photoUrl: user.photoUrl || '',
            address: user.address || ''
        });
        setGrantLoginAccess(!!user.email);
        setShowForm(true);
        setPhotoFile(null);
    };

    // Efek untuk otomatis mengisi cabang untuk admin cabang
    useEffect(() => {
        if (showForm && !editingUser && currentUser.role === 'staf_operasional') {
            setFormData(prev => ({ ...prev, branchId: currentUser.branchId }));
        }
    }, [showForm, editingUser, currentUser]);

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            const file = e.target.files[0];
            setPhotoFile(file);
            const previewUrl = URL.createObjectURL(file);
            setFormData({...formData, photoUrl: previewUrl});
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // --- Validations ---
        if (grantLoginAccess && !formData.email) {
            showModal({ title: 'Error', children: <p>Email diperlukan untuk memberikan akses login.</p> });
            return;
        }
        if (grantLoginAccess && !editingUser && !password) {
            showModal({ title: 'Error', children: <p>Password diperlukan untuk membuat akun login baru.</p> });
            return;
        }
        // Prevent granting login access to an existing non-login user, as it's complex and can lead to data inconsistency.
        if (editingUser && grantLoginAccess && !editingUser.email) {
            showModal({ title: 'Operasi Tidak Didukung', children: <p>Tidak dapat memberikan akses login kepada karyawan yang sudah ada. Harap hapus dan buat ulang sebagai karyawan dengan akses login.</p> });
            return;
        }

        setIsUploading(true);
        
        try {
            let photoURL = editingUser?.photoUrl || formData.photoUrl || '';
            if (photoFile) {
                const storageRef = ref(storage, `user-photos/${Date.now()}-${photoFile.name}`);
                await uploadBytes(storageRef, photoFile);
                photoURL = await getDownloadURL(storageRef);
            }

            const userData = {
                name: formData.name,
                phone: formData.phone,
                role: formData.role,
                branchId: formData.branchId,
                address: formData.address,
                photoUrl: photoURL,
                email: grantLoginAccess ? formData.email : '',
            };

            if (editingUser) {
                // Logic for updating an existing user
                await updateDoc(doc(db, 'users', editingUser.id), userData);
            } else {
                // Logic for creating a new user
                if (grantLoginAccess) {
                    const userCredential = await createUserWithEmailAndPassword(auth, formData.email, password);
                    await setDoc(doc(db, 'users', userCredential.user.uid), userData);
                } else {
                    await addDoc(collection(db, 'users'), userData);
                }
            }

            resetForm();
            showModal({ title: 'Sukses', children: <p>Data karyawan berhasil disimpan.</p> });

        } catch (error) {
            console.error("Error saving user:", error);
            let errorMessage = 'Gagal menyimpan data pengguna.';
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = 'Email ini sudah digunakan oleh akun lain. Silakan gunakan email yang berbeda.';
            } else if (error.code === 'auth/weak-password') {
                errorMessage = 'Password terlalu lemah. Harap gunakan minimal 6 karakter.';
            }
            showModal({ title: 'Error', children: <p>{errorMessage}</p> });
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = (userId) => {
        showModal({ title: 'Konfirmasi Hapus', children: <p>Apakah Anda yakin ingin menghapus pengguna ini?</p>, footer: <><button onClick={hideModal} className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md">Batal</button><button onClick={async () => { try { await deleteDoc(doc(db, "users", userId)); hideModal(); } catch (error) { console.error("Error deleting user:", error); } }} className="bg-red-600 text-white px-4 py-2 rounded-md">Hapus</button></> });
    };
    
    const getBranchName = (branchId) => branches.find(b => b.id === branchId)?.name || 'Pusat';
    
    const EmployeeList = () => (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 responsive-table">
                <thead className="bg-blue-200">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Nama</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Jabatan</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Cabang</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Aksi</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {users.filter(u => u.role?.toLowerCase() !== 'pasien').map(user => (
                        <tr key={user.id}>
                            <td className="px-6 py-4 whitespace-nowrap" data-label="Nama">
                                <div className="flex items-center"><div className="flex-shrink-0 h-10 w-10"><img className="h-10 w-10 rounded-full object-cover" src={user.photoUrl || `https://ui-avatars.com/api/?name=${user.name.split(' ').join('+')}&background=random`} alt="" /></div><div className="ml-4"><div className="text-sm font-medium text-gray-900">{user.name}</div><div className="text-sm text-gray-500">{user.email}</div></div></div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap" data-label="Jabatan"><span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">{user.role}</span></td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" data-label="Cabang">{getBranchName(user.branchId)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" data-label="Aksi">
                                <button onClick={() => handleEdit(user)} className="text-indigo-600 hover:text-indigo-900 mr-3"><Edit size={16}/></button>
                                <button onClick={() => handleDelete(user.id)} className="text-red-600 hover:text-red-900"><Trash2 size={16}/></button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    const EmployeeLedger = () => {
        const groupedEmployees = useMemo(() => {
            return users.filter(u => u.role?.toLowerCase() !== 'pasien').reduce((acc, user) => {
                const role = user.role || 'Lainnya';
                if (!acc[role]) acc[role] = [];
                acc[role].push(user);
                return acc;
            }, {});
        }, [users]);

        const exportColumns = [
            { header: 'Nama', accessor: r => r.name || '' },
            { header: 'Email', accessor: r => r.email || '' },
            { header: 'Telepon', accessor: r => r.phone || '' },
            { header: 'Alamat', accessor: r => r.address || '' },
            { header: 'Cabang', accessor: r => getBranchName(r.branchId) },
        ];

        return (
            <div className="space-y-8">
                {Object.entries(groupedEmployees).map(([role, employees]) => (
                    <div key={role}>
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-xl font-semibold capitalize text-gray-700">{role.replace(/_/g, ' ')}</h3>
                            <ExportButtons 
                                data={employees}
                                title={`Data_Karyawan_${role}`}
                                columns={exportColumns}
                                scriptsReady={scriptsReady}
                            />
                        </div>
                        <div className="bg-white rounded-lg shadow overflow-x-auto">
                           <table className="min-w-full divide-y divide-gray-200"><thead className="bg-blue-200"><tr><th className="px-6 py-3 text-left text-gray-700 font-medium">Nama</th><th className="px-6 py-3 text-left text-gray-700 font-medium">Kontak</th><th className="px-6 py-3 text-left text-gray-700 font-medium">Alamat</th><th className="px-6 py-3 text-left text-gray-700 font-medium">Cabang</th></tr></thead><tbody className="bg-white divide-y divide-gray-200">{employees.map(user => (<tr key={user.id}><td className="px-6 py-4"><div className="font-medium">{user.name}</div></td><td className="px-6 py-4">{user.email}<br/>{user.phone}</td><td className="px-6 py-4">{user.address}</td><td className="px-6 py-4">{getBranchName(user.branchId)}</td></tr>))}</tbody></table>
                        </div>
                    </div>
                ))}
            </div>
        );
    };
    
    const AccessControlTab = () => {
        const [userRoles, setUserRoles] = useState({});
        const [isSaving, setIsSaving] = useState(false);
        
        const staff = useMemo(() => users.filter(u => u.role?.toLowerCase() !== 'pasien'), [users]);
        const availableRoles = ['manajemen', 'doctor_expert', 'doctor', 'staf_operasional', 'perawat', 'cleaning_service'];

        useEffect(() => {
            const initialRoles = {};
            staff.forEach(user => {
                initialRoles[user.id] = user.role;
            });
            setUserRoles(initialRoles);
        }, [staff]);

        const handleRoleChange = (userId, newRole) => {
            setUserRoles(prev => ({ ...prev, [userId]: newRole }));
        };

        const handleSaveChanges = async () => {
            setIsSaving(true);
            try {
                const updatePromises = Object.keys(userRoles).map(userId => {
                    const newRole = userRoles[userId];
                    const originalUser = staff.find(u => u.id === userId);
                    if (originalUser && originalUser.role !== newRole) {
                        return updateDoc(doc(db, 'users', userId), { role: newRole });
                    }
                    return null;
                }).filter(Boolean);

                await Promise.all(updatePromises);
                showModal({ title: 'Sukses', children: <p>Peran pengguna berhasil diperbarui.</p> });
            } catch (error) {
                console.error("Error updating roles:", error);
                showModal({ title: 'Error', children: <p>Gagal memperbarui peran pengguna.</p> });
            } finally {
                setIsSaving(false);
            }
        };

        return (
            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-bold mb-4">Ubah Hak Akses & Peran Pengguna</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="px-4 py-2 text-left text-gray-700 font-medium">Nama Pengguna</th>
                                <th className="px-4 py-2 text-left text-gray-700 font-medium">Peran Saat Ini</th>
                                <th className="px-4 py-2 text-left text-gray-700 font-medium">Ubah Peran Ke</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {staff.map(user => (
                                <tr key={user.id}>
                                    <td className="px-4 py-2">{user.name}</td>
                                    <td className="px-4 py-2 capitalize">{user.role?.replace(/_/g, ' ')}</td>
                                    <td className="px-4 py-2">
                                        <select 
                                            value={userRoles[user.id] || ''} 
                                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                            className="p-1 border rounded-md"
                                        >
                                            {availableRoles.map(role => (
                                                <option key={role} value={role}>{role.replace(/_/g, ' ')}</option>
                                            ))}
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="mt-6 flex justify-end">
                    <button 
                        onClick={handleSaveChanges} 
                        disabled={isSaving}
                        className="bg-indigo-600 text-white font-bold py-2 px-6 rounded-md hover:bg-indigo-700 disabled:bg-gray-400"
                    >
                        {isSaving ? <Loader2 className="animate-spin"/> : 'Simpan Perubahan'}
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-700 p-4 rounded-lg shadow-md mb-6">Manajemen Staf & Karyawan</h2>
            <div className="flex justify-end mb-6">
                <button onClick={() => { resetForm(); setShowForm(true); }} className="bg-indigo-600 text-white px-3 py-2 text-sm sm:px-4 rounded-md hover:bg-indigo-700 flex items-center"><PlusCircle size={18} className="mr-2"/> Tambah Karyawan</button>
            </div>
            
            <div className="mb-6 border-b border-gray-200">
                <nav className="flex space-x-4" aria-label="Tabs">
                    <button onClick={() => setActiveTab('list')} className={`px-3 py-2 font-medium text-sm rounded-t-lg ${activeTab === 'list' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>Daftar Karyawan</button>
                    <button onClick={() => setActiveTab('ledger')} className={`px-3 py-2 font-medium text-sm rounded-t-lg ${activeTab === 'ledger' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>Buku Induk Karyawan</button>
                    {currentUser.role === 'manajemen' && (
                        <button onClick={() => setActiveTab('access_control')} className={`px-3 py-2 font-medium text-sm rounded-t-lg ${activeTab === 'access_control' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>Kontrol Akses</button>
                    )}
                </nav>
            </div>

            {activeTab === 'list' && <EmployeeList />}
            {activeTab === 'ledger' && <EmployeeLedger />}
            {activeTab === 'access_control' && <AccessControlTab />}

            {showForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl">
                        <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-semibold">{editingUser ? 'Edit Karyawan' : 'Tambah Karyawan Baru'}</h3><button onClick={resetForm}><X/></button></div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="flex flex-col md:flex-row gap-6">
                                <div className="flex-shrink-0 flex flex-col items-center gap-2"><img src={formData.photoUrl || `https://ui-avatars.com/api/?name=${formData.name || '?'}&background=random`} alt="Profile" className="h-24 w-24 rounded-full object-cover"/><label htmlFor="user-photo-upload" className="cursor-pointer bg-white py-1 px-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"><span>Unggah Foto</span><input id="user-photo-upload" name="user-photo-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/*"/></label></div>
                                <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div><label className="block text-sm font-medium text-gray-700">Nama</label><input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required /></div>
                                    <div><label className="block text-sm font-medium text-gray-700">Telepon</label><input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" /></div>
                                    <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700">Jabatan (Role)</label>
                                        <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required>
                                            <option value="">Pilih Jabatan</option>
                                            {currentUser.role === 'manajemen' && <option value="manajemen">Manajemen</option>}
                                            <option value="doctor_expert">Dokter Ahli</option>
                                            <option value="doctor">Dokter</option>
                                            {currentUser.role === 'manajemen' && <option value="staf_operasional">Staf Operasional</option>}
                                            <option value="perawat">Perawat</option>
                                            <option value="cleaning_service">Cleaning Service</option>
                                            <option value="pasien">Pasien</option>
                                        </select>
                                    </div>
                                    <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700">Alamat Lengkap</label><textarea value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" rows="2" /></div>
                                    <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700">Cabang</label><select value={formData.branchId} onChange={e => setFormData({...formData, branchId: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" disabled={currentUser.role === 'staf_operasional'}><option value="">Pusat</option>{branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
                                    <div className="md:col-span-2 pt-2"><div className="flex items-start"><div className="flex items-center h-5"><input id="grant-access" type="checkbox" checked={grantLoginAccess} onChange={(e) => setGrantLoginAccess(e.target.checked)} className="h-4 w-4 text-indigo-600 border-gray-300 rounded"/></div><div className="ml-3 text-sm"><label htmlFor="grant-access" className="font-medium text-gray-700">Berikan Akses Login ke Aplikasi</label><p className="text-gray-500">Karyawan akan dapat login dengan email dan password.</p></div></div></div>
                                    {grantLoginAccess && <><div><label className="block text-sm font-medium text-gray-700">Email</label><input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required={grantLoginAccess} /></div>{!editingUser && <div><label className="block text-sm font-medium text-gray-700">Password</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required={grantLoginAccess && !editingUser} /></div>}</>}
                                </div>
                            </div>
                            <div className="flex space-x-4 justify-end pt-4"><button type="submit" disabled={isUploading} className="bg-indigo-600 text-white px-3 py-1.5 text-sm sm:px-4 sm:py-2 rounded-md disabled:bg-indigo-400">{isUploading ? 'Menyimpan...' : (editingUser ? 'Perbarui' : 'Simpan')}</button><button type="button" onClick={resetForm} className="bg-gray-500 text-white px-3 py-1.5 text-sm sm:px-4 sm:py-2 rounded-md">Batal</button></div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Komponen Manajemen Cabang ---
const BranchManagement = ({ branches, showModal, hideModal, currentUser }) => {
    const [showForm, setShowForm] = useState(false);
    const [editingBranch, setEditingBranch] = useState(null);
    const [formData, setFormData] = useState({ 
        name: '', 
        address: '', 
        phone: '',
        // State baru untuk admin cabang
        adminName: '', 
        adminEmail: '', 
        adminPassword: '' 
    });

    const isManager = currentUser?.role === 'manajemen';

    const displayedBranches = useMemo(() => {
        if (isManager) {
            return branches;
        }
        if (currentUser?.branchId) {
            return branches.filter(b => b.id === currentUser.branchId);
        }
        return [];
    }, [branches, currentUser, isManager]);

    const resetForm = () => {
        setFormData({ name: '', address: '', phone: '', adminName: '', adminEmail: '', adminPassword: '' });
        setEditingBranch(null);
        setShowForm(false);
    };

    const handleEdit = (branch) => {
        setEditingBranch(branch);
        // Pastikan data admin tidak tercampur saat mengedit
        setFormData({ name: branch.name, address: branch.address, phone: branch.phone, adminName: '', adminEmail: '', adminPassword: '' });
        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingBranch) {
                // Logika hanya untuk memperbarui detail cabang
                const branchData = { name: formData.name, address: formData.address, phone: formData.phone };
                await updateDoc(doc(db, 'branches', editingBranch.id), branchData);
                resetForm();
                showModal({ title: 'Sukses', children: <p>Data cabang berhasil diperbarui.</p> });
            } else {
                // Logika baru yang terisolasi untuk membuat admin cabang
                let secondaryApp;
                try {
                    // 1. Buat instance Firebase sementara untuk menghindari logout otomatis
                    secondaryApp = initializeApp(firebaseConfig, `secondary-auth-${Date.now()}`);
                    const secondaryAuth = getAuth(secondaryApp);

                    // 2. Buat pengguna otentikasi menggunakan instance sementara
                    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, formData.adminEmail, formData.adminPassword);
                    const newAdminUser = userCredential.user;

                    // 3. Buat dokumen cabang di database utama
                    const branchData = { name: formData.name, address: formData.address, phone: formData.phone };
                    const branchDocRef = await addDoc(collection(db, 'branches'), branchData);

                    // 4. Buat profil pengguna untuk admin di koleksi 'users' database utama
                    const adminProfileData = {
                        name: formData.adminName,
                        email: formData.adminEmail,
                        phone: '',
                        role: 'staf_operasional',
                        branchId: branchDocRef.id,
                        photoUrl: '',
                        address: ''
                    };
                    // Gunakan UID dari pengguna yang baru dibuat untuk nama dokumen
                    await setDoc(doc(db, 'users', newAdminUser.uid), adminProfileData);

                    resetForm();
                    showModal({ title: 'Sukses', children: <p>Cabang baru dan akun admin berhasil dibuat. Admin cabang sekarang dapat login.</p> });

                } catch (error) {
                    console.error("Gagal membuat cabang dan admin:", error);
                    let errorMessage = 'Gagal membuat cabang baru. Silakan coba lagi.';
                    if (error.code === 'auth/email-already-in-use') {
                        errorMessage = 'Email ini sudah digunakan untuk admin lain. Harap gunakan email yang berbeda.';
                    } else if (error.code === 'auth/weak-password') {
                        errorMessage = 'Password terlalu lemah. Harap gunakan minimal 6 karakter.';
                    }
                    showModal({ title: 'Error', children: <p>{errorMessage}</p> });
                } finally {
                    // 5. Hapus instance Firebase sementara setelah selesai
                    if (secondaryApp) {
                        await deleteApp(secondaryApp);
                    }
                }
            }
        } catch (error) {
            // Blok catch ini sekarang hanya untuk error saat mengedit cabang
            console.error("Error updating branch:", error);
            showModal({ title: 'Error', children: <p>Gagal memperbarui data cabang.</p> });
        }
    };

    const handleDelete = (branchId) => {
        showModal({
            title: 'Konfirmasi Hapus Cabang',
            children: <p>Apakah Anda yakin ingin menghapus cabang ini? Semua data terkait (pengguna, transaksi, dll.) mungkin akan terpengaruh.</p>,
            footer: (
                <>
                    <button onClick={hideModal} className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-400">Batal</button>
                    <button
                        onClick={async () => {
                            try {
                                await deleteDoc(doc(db, "branches", branchId));
                                hideModal();
                            } catch (error) {
                                console.error("Error deleting branch:", error);
                                hideModal();
                                showModal({
                                    title: 'Error',
                                    children: <p>Gagal menghapus cabang. Silakan coba lagi.</p>,
                                    footer: <button onClick={hideModal} className="bg-red-600 text-white px-4 py-2 rounded-md">Tutup</button>
                                });
                            }
                        }}
                        className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                    >
                        Hapus
                    </button>
                </>
            )
        });
    };

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-700 p-4 rounded-lg shadow-md mb-6">Manajemen Cabang</h2>
            {isManager && (
                <div className="flex justify-end mb-6">
                    <button onClick={() => setShowForm(true)} className="bg-indigo-600 text-white px-3 py-2 text-sm sm:px-4 rounded-md hover:bg-indigo-700 flex items-center">
                        <PlusCircle size={18} className="mr-2"/> Tambah Cabang
                    </button>
                </div>
            )}
            {showForm && isManager && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">{editingBranch ? 'Edit Cabang' : 'Tambah Cabang Baru'}</h3>
                            <button onClick={resetForm}><X/></button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-4">
                                <h4 className="font-semibold text-gray-800 border-b pb-2">Detail Cabang</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div><label>Nama Cabang</label><input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="mt-1 block w-full rounded-md" required/></div>
                                    <div><label>Telepon</label><input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="mt-1 block w-full rounded-md" required/></div>
                                    <div className="md:col-span-2"><label>Alamat</label><input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="mt-1 block w-full rounded-md" required/></div>
                                </div>

                                {!editingBranch && (
                                    <div className="pt-4 space-y-4">
                                        <h4 className="font-semibold text-gray-800 border-b pb-2">Buat Akun Admin Cabang</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div><label>Nama Admin</label><input type="text" value={formData.adminName} onChange={e => setFormData({...formData, adminName: e.target.value})} className="mt-1 block w-full rounded-md" required={!editingBranch}/></div>
                                            <div><label>Email Admin</label><input type="email" value={formData.adminEmail} onChange={e => setFormData({...formData, adminEmail: e.target.value})} className="mt-1 block w-full rounded-md" required={!editingBranch}/></div>
                                            <div className="md:col-span-2"><label>Password Awal</label><input type="password" value={formData.adminPassword} onChange={e => setFormData({...formData, adminPassword: e.target.value})} className="mt-1 block w-full rounded-md" required={!editingBranch}/></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-end space-x-4 pt-4"><button type="submit" className="bg-indigo-600 text-white px-3 py-1.5 text-sm sm:px-4 sm:py-2 rounded-md">{editingBranch ? 'Perbarui' : 'Simpan'}</button><button type="button" onClick={resetForm} className="bg-gray-500 text-white px-3 py-1.5 text-sm sm:px-4 sm:py-2 rounded-md">Batal</button></div>
                        </form>
                    </div>
                </div>
            )}
            <div className="bg-white rounded-lg shadow overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 responsive-table">
                    <thead className="bg-green-200">
                        <tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Nama</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Alamat</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Telepon</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Aksi</th></tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {displayedBranches.map(branch => (
                            <tr key={branch.id}>
                                <td className="px-6 py-4 whitespace-nowrap" data-label="Nama">{branch.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap" data-label="Alamat">{branch.address}</td>
                                <td className="px-6 py-4 whitespace-nowrap" data-label="Telepon">{branch.phone}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" data-label="Aksi">
                                    {isManager && (
                                        <>
                                            <button onClick={() => handleEdit(branch)} className="text-indigo-600 hover:text-indigo-900 mr-3"><Edit size={16}/></button>
                                            <button onClick={() => handleDelete(branch.id)} className="text-red-600 hover:text-red-900"><Trash2 size={16}/></button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- [BARU] Helper dan Hook untuk Logika Keuangan ---

// 1. Chart of Accounts (Daftar Akun) Sederhana
const chartOfAccounts = {
  // Aset
  CASH: 'Kas',
  INVENTORY: 'Persediaan Barang',
  // Liabilitas
  ACCOUNTS_PAYABLE: 'Utang Usaha',
  TAX_PAYABLE: 'Utang Pajak',
  // Ekuitas
  OWNERS_EQUITY: 'Modal Pemilik',
  RETAINED_EARNINGS: 'Laba Ditahan',
  // Pendapatan
  SERVICE_REVENUE: 'Pendapatan Jasa',
  // Beban
  UTILITIES_EXPENSE: 'Beban Utilitas',
  SALARY_EXPENSE: 'Beban Gaji',
  RENT_EXPENSE: 'Beban Sewa',
  OTHER_EXPENSE: 'Beban Lain-lain',
};

// 2. Custom Hook untuk memproses semua data keuangan
const useFinancialData = (payments, expenses, inventory, branches, dateRange, branchId) => {
  return useMemo(() => {
    // Tahap 1: Filter data mentah (payments, expenses) berdasarkan rentang tanggal dan cabang yang dipilih.
    const filterByDate = (item) => {
      const itemDate = item.createdAt && typeof item.createdAt.toDate === 'function' 
        ? item.createdAt.toDate() 
        : new Date(item.date);
      if (isNaN(itemDate.getTime())) return false;

      const startDate = new Date(dateRange.startDate);
      const endDate = new Date(dateRange.endDate);
      endDate.setHours(23, 59, 59, 999);

      return itemDate >= startDate && itemDate <= endDate;
    };

    const filteredPayments = payments.filter(item => {
        if (!filterByDate(item)) return false;
        return branchId === 'all' || item.branchId === branchId;
    });

    const filteredExpenses = expenses.filter(item => {
        if (!filterByDate(item)) return false;
        return branchId === 'all' || item.branchId === branchId;
    });
    const filteredInventory = inventory.filter(i => branchId === 'all' || i.branchId === branchId);

    // Tahap 2: Membuat Jurnal Umum (Journal Entries) dari data yang sudah difilter.
    // Ini adalah langkah dasar akuntansi di mana setiap transaksi dipecah menjadi debit dan kredit.
    const journalEntries = [];
    filteredPayments.forEach(p => {
        const paymentDate = p.createdAt && typeof p.createdAt.toDate === 'function'
            ? p.createdAt.toDate().toISOString().slice(0, 10)
            : p.date;

        if (!paymentDate) return; 
        
        const totalAmount = p.total || p.amount;

        // Entri untuk penerimaan kas (Debit)
        journalEntries.push({ date: paymentDate, description: `Penjualan Tunai/Kartu`, account: chartOfAccounts.CASH, debit: totalAmount, credit: 0, id: `p-cash-deb-${p.id}` });
        
        // Entri untuk pendapatan jasa/produk (Kredit)
        if (p.items && Array.isArray(p.items) && p.items.length > 0) {
            p.items.forEach((item, index) => {
                const itemTotal = item.price * item.quantity;
                journalEntries.push({ date: paymentDate, description: `Pendapatan: ${item.name}`, account: chartOfAccounts.SERVICE_REVENUE, debit: 0, credit: itemTotal, id: `p-${p.id}-item-cred-${index}` });
            });
            // Entri untuk utang pajak jika ada (Kredit)
            if (p.tax > 0) {
                journalEntries.push({ date: paymentDate, description: `Pajak Penjualan`, account: chartOfAccounts.TAX_PAYABLE, debit: 0, credit: p.tax, id: `p-${p.id}-tax-cred` });
            }
        } else if (totalAmount) { // Fallback untuk struktur data lama
            const description = p.serviceName ? `Pendapatan: ${p.serviceName}` : 'Pendapatan Umum';
            journalEntries.push({ date: paymentDate, description, account: chartOfAccounts.SERVICE_REVENUE, debit: 0, credit: totalAmount, id: `p-cred-${p.id}` });
        }
    });

    filteredExpenses.forEach(e => {
      const expenseAccount = chartOfAccounts[(e.category?.toUpperCase() || 'OTHER') + '_EXPENSE'] || chartOfAccounts.OTHER_EXPENSE;
      // Entri untuk beban (Debit) dan pengurangan kas (Kredit)
      journalEntries.push({ date: e.date, description: `Beban: ${e.description}`, account: expenseAccount, debit: e.amount, credit: 0, id: `e-deb-${e.id}` });
      journalEntries.push({ date: e.date, description: `Beban: ${e.description}`, account: chartOfAccounts.CASH, debit: 0, credit: e.amount, id: `e-cred-${e.id}` });
    });
    
    journalEntries.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Tahap 3: Memproses Jurnal menjadi Buku Besar (General Ledger).
    // Mengelompokkan semua entri berdasarkan akun untuk mendapatkan saldo akhir setiap akun.
    const generalLedger = journalEntries.reduce((acc, entry) => {
      if (!acc[entry.account]) {
        acc[entry.account] = { entries: [], balance: 0, runningBalance: 0 };
      }
      acc[entry.account].entries.push(entry);
      acc[entry.account].balance += entry.debit - entry.credit; // Saldo = Total Debit - Total Kredit
      return acc;
    }, {});

    // Tahap 4: Menyusun Laporan Keuangan dari data Buku Besar.

    // --- C. Laporan Laba Rugi (Income Statement) ---
    // Kalkulasi ini meringkas pendapatan dan beban untuk menemukan laba bersih.
    const totalRevenue = filteredPayments.reduce((sum, p) => sum + (p.total || p.amount || 0), 0);

    const expenseAccounts = Object.entries(generalLedger)
        .filter(([accountName, _]) => accountName.includes('Beban'));

    const totalExpenses = expenseAccounts.reduce((sum, [_, accountData]) => sum + accountData.balance, 0);
    
    const netIncome = totalRevenue - totalExpenses;

    const incomeStatement = {
      revenue: totalRevenue,
      expenses: totalExpenses,
      netIncome: netIncome,
      // Rincian setiap beban untuk ditampilkan di diagram.
      breakdown: expenseAccounts.map(([accountName, accountData]) => ({ name: accountName, value: accountData.balance }))
    };

    // --- D. Laporan Neraca (Balance Sheet) ---
    // Menunjukkan posisi keuangan (Aset = Liabilitas + Ekuitas) pada akhir periode.
    const cashBalance = generalLedger[chartOfAccounts.CASH]?.balance || 0;
    const inventoryValue = filteredInventory.reduce((sum, item) => sum + (item.stock || 0) * (item.price || 0), 0);
    const totalAssets = cashBalance + inventoryValue;
    
    const taxPayable = (generalLedger[chartOfAccounts.TAX_PAYABLE]?.balance || 0) * -1; // Liabilitas punya saldo kredit, jadi dinegasikan.
    const accountsPayable = (generalLedger[chartOfAccounts.ACCOUNTS_PAYABLE]?.balance || 0) * -1;
    const totalLiabilities = taxPayable + accountsPayable;

    // Ekuitas dihitung untuk menyeimbangkan neraca.
    const retainedEarnings = netIncome; // Laba ditahan adalah laba bersih periode ini (disederhanakan).
    const ownersEquity = totalAssets - totalLiabilities - retainedEarnings; // Modal pemilik sebagai penyeimbang.
    const totalEquity = ownersEquity + retainedEarnings;

    const balanceSheet = {
        assets: { cash: cashBalance, inventory: inventoryValue, total: totalAssets },
        liabilities: { accountsPayable: accountsPayable, taxPayable: taxPayable, total: totalLiabilities },
        equity: { ownersEquity, retainedEarnings, total: totalEquity },
        totalLiabilitiesAndEquity: totalLiabilities + totalEquity, // Harus sama dengan Total Aset.
    };

    // --- E. Laporan Arus Kas (Cash Flow Statement) ---
    // Metode Langsung (disederhanakan): hanya melihat total kas masuk dan keluar dari operasional.
    const cashFromOperations = (generalLedger[chartOfAccounts.CASH]?.entries || [])
        .reduce((sum, entry) => sum + entry.debit - entry.credit, 0);

    const cashFlowStatement = {
        operations: cashFromOperations,
        investing: 0, // Placeholder
        financing: 0, // Placeholder
        netChangeInCash: cashFromOperations,
    };

    // Mengembalikan semua data yang sudah diproses untuk digunakan oleh komponen UI.
    return { journalEntries, generalLedger, incomeStatement, balanceSheet, cashFlowStatement };
  }, [payments, expenses, inventory, dateRange, branchId]);
};

// --- Helper & Komponen UI untuk Laporan ---
const formatCurrency = (value) => `Rp ${new Intl.NumberFormat('id-ID').format(value || 0)}`;

const ReportCard = ({ title, value, icon, color }) => {
    const valueStr = String(value);
    let sizeClass = 'text-2xl lg:text-3xl';
    if (valueStr.length > 15) {
        sizeClass = 'text-xl lg:text-2xl';
    }
    if (valueStr.length > 20) {
        sizeClass = 'text-lg lg:text-xl';
    }

    return (
        <div className={`${color} p-4 rounded-2xl shadow-lg flex items-center text-white`}>
            <div className="p-3 bg-white bg-opacity-30 rounded-xl mr-3">
                {icon}
            </div>
            <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium opacity-90 truncate">{title}</p>
                <p className={`${sizeClass} font-bold break-words`}>{value}</p>
            </div>
        </div>
    );
};

const InfoCard = ({ icon, title, children, color, iconColor }) => (
    <div className={`bg-white p-6 rounded-2xl shadow-lg ${color}`}>
        <div className="flex items-start">
            <div className={`w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-xl mr-4 ${iconColor} text-white shadow-lg`} style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.2))' }}>
                {icon}
            </div>
            <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-800">{title}</h3>
                <div className="mt-2 text-sm text-gray-600">
                    {children}
                </div>
            </div>
        </div>
    </div>
);

// --- [BARU] Komponen Dasbor Analitik Cerdas ---
const AnalyticsDashboardTab = ({ data }) => {
    const { incomeStatement } = data;

    // Siapkan data untuk diagram lingkaran, pastikan nilai positif
    const expenseData = incomeStatement.breakdown
        .map(item => ({
            name: item.name.replace('Beban ', ''), // Nama yang lebih pendek
            value: Math.abs(item.value) // Ambil nilai absolut untuk diagram
        }))
        .filter(item => item.value > 0); // Hanya tampilkan beban yang memiliki nilai

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF4560', '#F9A3A4', '#9C27B0'];

    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
        const RADIAN = Math.PI / 180;
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        if (percent * 100 < 5) return null; // Sembunyikan label untuk potongan yang sangat kecil

        return (
            <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        );
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <InfoCard icon={<DollarSign size={24}/>} title="Total Pendapatan" color="border-l-4 border-green-500" iconColor="bg-gradient-to-br from-green-400 to-green-600">
                    <p className="text-3xl font-bold text-gray-800">{formatCurrency(incomeStatement.revenue)}</p>
                    <p className="text-sm text-gray-500 mt-1">Seluruh pendapatan dari penjualan.</p>
                </InfoCard>
                <InfoCard icon={<TrendingUp size={24}/>} title="Total Beban" color="border-l-4 border-red-500" iconColor="bg-gradient-to-br from-red-400 to-red-600">
                     <p className="text-3xl font-bold text-gray-800">{formatCurrency(incomeStatement.expenses)}</p>
                     <p className="text-sm text-gray-500 mt-1">Seluruh biaya operasional.</p>
                </InfoCard>
                <InfoCard icon={<CircleDollarSign size={24}/>} title="Laba Bersih" color="border-l-4 border-blue-500" iconColor="bg-gradient-to-br from-blue-400 to-blue-600">
                    <p className="text-3xl font-bold text-gray-800">{formatCurrency(incomeStatement.netIncome)}</p>
                    <p className="text-sm text-gray-500 mt-1">Pendapatan setelah dikurangi beban.</p>
                </InfoCard>
            </div>

            {/* Visualisasi Beban */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-lg">
                    <h3 className="text-lg font-bold text-white bg-gradient-to-r from-teal-500 to-cyan-600 p-3 rounded-t-lg shadow-md mb-4">Komposisi Beban (Persentase)</h3>
                    {expenseData.length > 0 ? (
                        <div style={{ height: '300px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={expenseData} cx="50%" cy="50%" labelLine={false} label={renderCustomizedLabel} outerRadius={120} fill="#8884d8" dataKey="value">
                                        {expenseData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => formatCurrency(value)} />
                                    <Legend iconSize={12} wrapperStyle={{fontSize: "14px"}}/>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-500"><p>Tidak ada data beban untuk ditampilkan.</p></div>
                    )}
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-lg">
                    <h3 className="text-lg font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-600 p-3 rounded-t-lg shadow-md mb-4">Rincian Beban (Nominal)</h3>
                    {expenseData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={expenseData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" tickFormatter={(value) => `Rp${value/1000}k`} />
                                <YAxis dataKey="name" type="category" width={80} />
                                <Tooltip formatter={(value) => formatCurrency(value)} cursor={{fill: 'rgba(239, 246, 255, 0.5)'}} />
                                <Bar dataKey="value" name="Total Beban">
                                    {expenseData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="text-center py-12 text-gray-500"><p>Tidak ada data beban untuk ditampilkan.</p></div>
                    )}
                </div>
            </div>
        </div>
    );
};

const LedgerTab = ({ data, scriptsReady }) => {
    const [selectedAccount, setSelectedAccount] = useState(Object.keys(data)[0] || '');
    const accountData = data[selectedAccount];
    
    const exportColumns = [
        { header: 'Tanggal', accessor: row => row.date },
        { header: 'Deskripsi', accessor: row => row.description },
        { header: 'Debit', accessor: row => row.debit > 0 ? row.debit : '' },
        { header: 'Kredit', accessor: row => row.credit > 0 ? row.credit : '' },
    ];

    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Pilih Akun</label>
                    <select value={selectedAccount} onChange={e => setSelectedAccount(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                        {Object.keys(data).map(account => <option key={account} value={account}>{account}</option>)}
                    </select>
                </div>
                {accountData && <ExportButtons data={accountData.entries} title={`Buku_Besar_${selectedAccount}`} columns={exportColumns} scriptsReady={scriptsReady} />}
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-yellow-200">
                        <tr>
                            <th className="px-4 py-2 text-left text-gray-700 font-medium">Tanggal</th>
                            <th className="px-4 py-2 text-left text-gray-700 font-medium">Deskripsi</th>
                            <th className="px-4 py-2 text-right text-gray-700 font-medium">Debit</th>
                            <th className="px-4 py-2 text-right text-gray-700 font-medium">Kredit</th>
                            <th className="px-4 py-2 text-right text-gray-700 font-medium">Saldo</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {(() => {
                            let runningBalance = 0;
                            return accountData?.entries.map(entry => {
                                runningBalance += entry.debit - entry.credit;
                                return (
                                    <tr key={entry.id}>
                                        <td className="px-4 py-2">{entry.date}</td>
                                        <td className="px-4 py-2">{entry.description}</td>
                                        <td className="px-4 py-2 text-right">{entry.debit > 0 ? formatCurrency(entry.debit) : '-'}</td>
                                        <td className="px-4 py-2 text-right">{entry.credit > 0 ? formatCurrency(entry.credit) : '-'}</td>
                                        <td className="px-4 py-2 text-right">{formatCurrency(runningBalance)}</td>
                                    </tr>
                                );
                            });
                        })()}
                    </tbody>
                    <tfoot className="bg-gray-100 font-bold">
                        <tr>
                            <td colSpan="4" className="px-4 py-2 text-right">Total Saldo Akun</td>
                            <td className="px-4 py-2 text-right">{formatCurrency(accountData?.balance)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
};

const FinancialStatement = ({ title, children, exportData, exportCols, scriptsReady, dateRange }) => (
    <div className="bg-white rounded-lg shadow">
        <div className="flex justify-between items-center p-3 rounded-t-lg bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-md">
            <h3 className="text-xl font-bold">{title}</h3>
            <ExportButtons data={exportData} title={title} columns={exportCols} scriptsReady={scriptsReady} />
        </div>
        <div className="p-6">
            <p className="text-sm text-gray-500 text-center mb-4">Untuk periode {dateRange.startDate} hingga {dateRange.endDate}</p>
            <div className="space-y-4">{children}</div>
        </div>
    </div>
);

const StatementRow = ({ label, value, isTotal = false, indent = false, isHeader = false }) => (
    <div className={`flex justify-between py-1 border-b ${isTotal ? 'font-bold border-t-2 pt-2' : ''} ${indent ? 'pl-4' : ''} ${isHeader ? 'font-bold text-lg mt-2' : ''}`}>
        <span>{label}</span>
        <span>{value}</span>
    </div>
);

const IncomeStatementTab = ({ data, scriptsReady, dateRange }) => {
    const exportData = [
        { label: "Pendapatan Jasa", value: formatCurrency(data.revenue) },
        ...data.breakdown.map(item => ({ label: item.name, value: formatCurrency(item.value) })),
        { label: "Total Beban", value: formatCurrency(data.expenses) },
        { label: "Laba Bersih", value: formatCurrency(data.netIncome) },
    ];
    const exportCols = [{header: 'Keterangan', accessor: r => r.label}, {header: 'Jumlah', accessor: r => r.value}];

    return (
        <FinancialStatement title="Laporan Laba Rugi" exportData={exportData} exportCols={exportCols} scriptsReady={scriptsReady} dateRange={dateRange}>
            <StatementRow label="Pendapatan Jasa" value={formatCurrency(data.revenue)} />
            <div className="pt-2">
                <h4 className="font-bold mb-1">Beban-Beban</h4>
                {data.breakdown.map(item => <StatementRow key={item.name} label={item.name} value={formatCurrency(item.value)} indent/>)}
                <StatementRow label="Total Beban" value={formatCurrency(data.expenses)} isTotal/>
            </div>
            <StatementRow label="Laba Bersih" value={formatCurrency(data.netIncome)} isTotal/>
        </FinancialStatement>
    );
};

const BalanceSheetTab = ({ data, scriptsReady, dateRange }) => {
    const exportData = [
        { label: "Kas", value: formatCurrency(data.assets.cash) },
        { label: "Persediaan Barang", value: formatCurrency(data.assets.inventory) },
        { label: "Total Aset", value: formatCurrency(data.assets.total) },
        { label: "Utang Usaha", value: formatCurrency(data.liabilities.accountsPayable) },
        { label: "Utang Pajak", value: formatCurrency(data.liabilities.taxPayable) },
        { label: "Total Liabilitas", value: formatCurrency(data.liabilities.total) },
        { label: "Modal Pemilik", value: formatCurrency(data.equity.ownersEquity) },
        { label: "Laba Ditahan", value: formatCurrency(data.equity.retainedEarnings) },
        { label: "Total Ekuitas", value: formatCurrency(data.equity.total) },
        { label: "Total Liabilitas dan Ekuitas", value: formatCurrency(data.totalLiabilitiesAndEquity) },
    ];
    const exportCols = [{header: 'Akun', accessor: r => r.label}, {header: 'Jumlah', accessor: r => r.value}];

    return (
        <FinancialStatement title="Laporan Neraca" exportData={exportData} exportCols={exportCols} scriptsReady={scriptsReady} dateRange={dateRange}>
            <div>
                <StatementRow label="Aset" isHeader />
                <StatementRow label="Kas" value={formatCurrency(data.assets.cash)} indent/>
                <StatementRow label="Persediaan Barang" value={formatCurrency(data.assets.inventory)} indent/>
                <StatementRow label="Total Aset" value={formatCurrency(data.assets.total)} isTotal/>
            </div>
            <div>
                <StatementRow label="Liabilitas dan Ekuitas" isHeader />
                <StatementRow label="Utang Usaha" value={formatCurrency(data.liabilities.accountsPayable)} indent/>
                <StatementRow label="Utang Pajak" value={formatCurrency(data.liabilities.taxPayable)} indent/>
                <StatementRow label="Total Liabilitas" value={formatCurrency(data.liabilities.total)} isTotal/>
                <StatementRow label="Modal Pemilik" value={formatCurrency(data.equity.ownersEquity)} indent className="mt-2"/>
                <StatementRow label="Laba Ditahan" value={formatCurrency(data.equity.retainedEarnings)} indent/>
                <StatementRow label="Total Ekuitas" value={formatCurrency(data.equity.total)} isTotal/>
                <StatementRow label="Total Liabilitas dan Ekuitas" value={formatCurrency(data.totalLiabilitiesAndEquity)} isTotal/>
            </div>
        </FinancialStatement>
    );
};

const CashFlowTab = ({ data, scriptsReady, dateRange }) => {
    const exportData = [
        { label: "Arus Kas Bersih dari Aktivitas Operasi", value: formatCurrency(data.operations) },
        { label: "Perubahan Bersih dalam Kas", value: formatCurrency(data.netChangeInCash) },
    ];
    const exportCols = [{header: 'Keterangan', accessor: r => r.label}, {header: 'Jumlah', accessor: r => r.value}];

    return (
        <FinancialStatement title="Laporan Arus Kas" exportData={exportData} exportCols={exportCols} scriptsReady={scriptsReady} dateRange={dateRange}>
            <div>
                <StatementRow label="Arus Kas dari Aktivitas Operasi" isHeader/>
                <StatementRow label="Penerimaan dari Pelanggan" value={formatCurrency(data.operations)} indent/>
                <StatementRow label="Arus Kas Bersih dari Aktivitas Operasi" value={formatCurrency(data.operations)} isTotal/>
            </div>
            <StatementRow label="Perubahan Bersih dalam Kas" value={formatCurrency(data.netChangeInCash)} isTotal/>
        </FinancialStatement>
    );
};

// --- [BARU] Komponen Laporan Keuangan Modern ---
const FinancialManagement = ({ payments, expenses, inventory, branches, showModal, hideModal, scriptsReady, currentUser }) => {
    const [activeTab, setActiveTab] = useState('analytics_dashboard');
    const [branchId, setBranchId] = useState(currentUser.role === 'manajemen' ? 'all' : currentUser.branchId);

    // Secara otomatis mengatur filter cabang jika pengguna bukan manajemen
    useEffect(() => {
        if (currentUser.role !== 'manajemen') {
            setBranchId(currentUser.branchId);
        }
    }, [currentUser]);

    const today = new Date();
    const thirtyDaysAgo = new Date(new Date().setDate(today.getDate() - 30));
    const [dateRange, setDateRange] = useState({
        startDate: thirtyDaysAgo.toISOString().slice(0, 10),
        endDate: today.toISOString().slice(0, 10),
    });

    const handleDateChange = (newDateRange) => setDateRange(newDateRange);
    
    const financialData = useFinancialData(payments, expenses, inventory, branches, dateRange, branchId);

    const DateRangePicker = ({ onDateChange, initialStartDate, initialEndDate }) => {
        const [startDate, setStartDate] = useState(initialStartDate);
        const [endDate, setEndDate] = useState(initialEndDate);
        const handleApply = () => onDateChange({ startDate, endDate });

        return (
            <div className="flex items-center gap-2">
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-1.5 border border-gray-300 rounded-md text-sm"/>
                <span className="text-gray-500">-</span>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full p-1.5 border border-gray-300 rounded-md text-sm"/>
                <button onClick={handleApply} className="bg-indigo-600 text-white px-3 py-1.5 rounded-md text-sm">Terapkan</button>
            </div>
        );
    };

    const tabs = [
        { id: 'analytics_dashboard', label: 'Dasbor Analitik' },
        { id: 'ledger', label: 'Buku Besar' },
        { id: 'income_statement', label: 'Laba Rugi' },
        { id: 'balance_sheet', label: 'Neraca' },
        { id: 'cash_flow', label: 'Arus Kas' },
    ];

    const renderContent = () => {
        if (!financialData) return <Loader2 className="animate-spin mx-auto text-indigo-600" />;
        
        switch (activeTab) {
            case 'analytics_dashboard': return <AnalyticsDashboardTab data={financialData} />;
            case 'ledger': return <LedgerTab data={financialData.generalLedger} scriptsReady={scriptsReady} />;
            case 'income_statement': return <IncomeStatementTab data={financialData.incomeStatement} scriptsReady={scriptsReady} dateRange={dateRange} />;
            case 'balance_sheet': return <BalanceSheetTab data={financialData.balanceSheet} scriptsReady={scriptsReady} dateRange={dateRange} />;
            case 'cash_flow': return <CashFlowTab data={financialData.cashFlowStatement} scriptsReady={scriptsReady} dateRange={dateRange} />;
            default: return null;
        }
    };

    return (
        <div className="p-2 sm:p-6 bg-gray-50 min-h-screen">
            <h2 className="text-2xl font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-700 p-4 rounded-lg shadow-md mb-6">Laporan Keuangan Profesional</h2>
            <div className="bg-white p-4 rounded-xl shadow-md mb-6">
                <div className={`grid grid-cols-1 ${currentUser.role === 'manajemen' ? 'md:grid-cols-2' : 'md:grid-cols-1'} gap-4`}>
                    {currentUser.role === 'manajemen' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Cabang</label>
                            <select onChange={(e) => setBranchId(e.target.value)} value={branchId} className="w-full p-2 border border-gray-300 rounded-md">
                                <option value="all">Semua Cabang</option>
                                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Rentang Tanggal</label>
                        <DateRangePicker onDateChange={handleDateChange} initialStartDate={dateRange.startDate} initialEndDate={dateRange.endDate} />
                    </div>
                </div>
            </div>
            <div className="mb-6">
                <nav className="flex space-x-2 sm:space-x-4 overflow-x-auto" aria-label="Tabs">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`${
                                activeTab === tab.id
                                    ? 'bg-indigo-600 text-white shadow-md'
                                    : 'bg-white text-gray-600 hover:bg-gray-100'
                            } whitespace-nowrap py-3 px-4 rounded-t-lg font-semibold text-sm transition-all duration-200 ease-in-out`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>
            <div>{renderContent()}</div>
        </div>
    );
};



// --- Komponen Monitoring Laboratorium ---
const LaboratoryManagement = ({ labResults, users, branches, showModal, hideModal, currentUser }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBranch, setSelectedBranch] = useState(currentUser.role === 'manajemen' ? 'all' : currentUser.branchId);
    const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
    const [showAddForm, setShowAddForm] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [newResultData, setNewResultData] = useState({
        patientId: '',
        practitionerId: '',
        branchId: '',
        date: new Date().toISOString().slice(0, 10),
        testName: '',
        result: '',
        unit: ''
    });
    const [fileToUpload, setFileToUpload] = useState(null);

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setFileToUpload(e.target.files[0]);
        }
    };

    const resetForm = () => {
        setShowAddForm(false);
        setNewResultData({ patientId: '', practitionerId: '', branchId: '', date: new Date().toISOString().slice(0, 10), testName: '', result: '', unit: '' });
        setFileToUpload(null);
        setIsUploading(false);
    };

    const handleAddResult = async (e) => {
        e.preventDefault();
        if (!newResultData.patientId || !newResultData.practitionerId || !newResultData.branchId) {
            showModal({
                title: 'Data Tidak Lengkap',
                children: <p>Silakan lengkapi informasi pasien, dokter, dan cabang.</p>,
                footer: <button onClick={hideModal} className="bg-red-600 text-white px-4 py-2 rounded-md">Tutup</button>
            });
            return;
        }
        setIsUploading(true);
        try {
            let fileUrl = '';
            let fileName = '';

            if (fileToUpload) {
                const fileRef = ref(storage, `lab-results/${Date.now()}-${fileToUpload.name}`);
                await uploadBytes(fileRef, fileToUpload);
                fileUrl = await getDownloadURL(fileRef);
                fileName = fileToUpload.name;
            }

            await addDoc(collection(db, 'labResults'), {
                ...newResultData,
                fileUrl,
                fileName
            });

            resetForm();
            showModal({
                title: 'Sukses',
                children: <p>Hasil lab berhasil ditambahkan.</p>,
                footer: <button onClick={hideModal} className="bg-indigo-600 text-white px-4 py-2 rounded-md">OK</button>
            });
        } catch (error) {
            console.error("Gagal menambah hasil makmal:", error);
            showModal({
                title: 'Error',
                children: <p>Gagal menyimpan data. Silakan coba lagi.</p>,
                footer: <button onClick={hideModal} className="bg-red-600 text-white px-4 py-2 rounded-md">Tutup</button>
            });
            setIsUploading(false);
        }
    };

    const getPatientName = (patientId) => users.find(u => u.id === patientId)?.name || 'N/A';
    const getDoctorName = (practitionerId) => users.find(u => u.id === practitionerId)?.name || 'N/A';
    const getBranchName = (branchId) => branches.find(b => b.id === branchId)?.name || 'Pusat';

    const filteredResults = useMemo(() => {
        return labResults.filter(result => {
            const patientName = getPatientName(result.patientId)?.toLowerCase();
            const testName = result.testName?.toLowerCase();
            const searchTermLower = searchTerm.toLowerCase();

            const branchMatch = selectedBranch === 'all' || result.branchId === selectedBranch;
            const startDateMatch = !dateRange.startDate || new Date(result.date) >= new Date(dateRange.startDate);
            const endDateMatch = !dateRange.endDate || new Date(result.date) <= new Date(dateRange.endDate);
            const searchMatch = (patientName && patientName.includes(searchTermLower)) || (testName && testName.includes(searchTermLower));

            return branchMatch && startDateMatch && endDateMatch && searchMatch;
        });
    }, [labResults, searchTerm, selectedBranch, dateRange, users]);


    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-700 p-4 rounded-lg shadow-md mb-6">Laporan Hasil Laboratorium</h2>
            <div className="flex justify-end mb-6">
                <button onClick={() => setShowAddForm(true)} className="bg-indigo-600 text-white px-3 py-2 text-sm sm:px-4 rounded-md hover:bg-indigo-700 flex items-center">
                    <PlusCircle size={18} className="mr-2"/> Tambah Hasil Lab
                </button>
            </div>

            {/* Modal Tambah Hasil Lab */}
            {showAddForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl">
                        <h3 className="text-lg font-semibold mb-4">Formulir Hasil Lab Baru</h3>
                        <form onSubmit={handleAddResult} className="space-y-4">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div><label>Pasien</label><select value={newResultData.patientId} onChange={e => setNewResultData({...newResultData, patientId: e.target.value})} className="mt-1 block w-full rounded-md" required><option value="">Pilih Pasien</option>{users.filter(u=>u.role?.toLowerCase()==='pasien').map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
                                <div><label>Dokter</label><select value={newResultData.practitionerId} onChange={e => setNewResultData({...newResultData, practitionerId: e.target.value})} className="mt-1 block w-full rounded-md" required><option value="">Pilih Dokter</option>{users.filter(u=>u.role==='doctor').map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
                                <div><label>Cabang</label><select value={newResultData.branchId} onChange={e => setNewResultData({...newResultData, branchId: e.target.value})} className="mt-1 block w-full rounded-md" required><option value="">Pilih Cabang</option>{branches.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
                                <div><label>Tanggal</label><input type="date" value={newResultData.date} onChange={e => setNewResultData({...newResultData, date: e.target.value})} className="mt-1 block w-full rounded-md" required/></div>
                                <div><label>Nama Tes</label><input type="text" value={newResultData.testName} onChange={e => setNewResultData({...newResultData, testName: e.target.value})} className="mt-1 block w-full rounded-md" required/></div>
                                <div><label>Hasil</label><input type="text" value={newResultData.result} onChange={e => setNewResultData({...newResultData, result: e.target.value})} className="mt-1 block w-full rounded-md" required/></div>
                                <div><label>Unit</label><input type="text" value={newResultData.unit} onChange={e => setNewResultData({...newResultData, unit: e.target.value})} className="mt-1 block w-full rounded-md"/></div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">Unggah File (Gambar/PDF)</label>
                                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                                        <div className="space-y-1 text-center">
                                            {fileToUpload ? <FileText className="mx-auto h-12 w-12 text-green-500" /> : <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />}
                                            <div className="flex text-sm text-gray-600">
                                                <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500"><span>Pilih file</span><input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange}/></label>
                                            </div>
                                            <p className="text-xs text-gray-500">{fileToUpload ? fileToUpload.name : 'PNG, JPG, PDF'}</p>
                                        </div>
                                    </div>
                                </div>
                             </div>
                             <div className="flex space-x-4"><button type="submit" disabled={isUploading} className="bg-indigo-600 text-white px-4 py-2 rounded-md disabled:bg-indigo-300">{isUploading ? 'Mengunggah...' : 'Simpan'}</button><button type="button" onClick={resetForm} className="bg-gray-500 text-white px-4 py-2 rounded-md">Batal</button></div>
                        </form>
                    </div>
                </div>
            )}

            <div className="bg-white p-4 rounded-lg shadow mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cari Pasien / Tes</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input type="text" placeholder="Ketik untuk mencari..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md"/>
                        </div>
                    </div>
                    {currentUser.role === 'manajemen' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Filter Cabang</label>
                            <select value={selectedBranch} onChange={e => setSelectedBranch(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md">
                                <option value="all">Semua Cabang</option>
                                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                        </div>
                    )}
                     <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Filter Tanggal</label>
                            <div className="flex items-center space-x-2">
                                <input type="date" value={dateRange.startDate} onChange={e => setDateRange({...dateRange, startDate: e.target.value})} className="w-full p-1.5 border border-gray-300 rounded-md"/>
                                <span className="text-gray-500">-</span>
                                <input type="date" value={dateRange.endDate} onChange={e => setDateRange({...dateRange, endDate: e.target.value})} className="w-full p-1.5 border border-gray-300 rounded-md"/>
                             </div>
                     </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 responsive-table">
                    <thead className="bg-purple-200">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Tanggal</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Pasien</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Nama Tes</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Hasil</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">File</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Dokter</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredResults.map((result) => (
                            <tr key={result.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" data-label="Tanggal">{result.date}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900" data-label="Pasien">{getPatientName(result.patientId)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700" data-label="Nama Tes">{result.testName}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700" data-label="Hasil">{result.result} {result.unit}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" data-label="File">
                                    {result.fileUrl && <a href={result.fileUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">Lihat File</a>}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" data-label="Dokter">{getDoctorName(result.practitionerId)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- Komponen Konsultasi Ahli ---
const ExpertConsultationModule = ({ medicalRecords, users, branches, labResults, expertConsultations, currentUser, showModal, hideModal }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBranch, setSelectedBranch] = useState('all');
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [consultationNotes, setConsultationNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const getPatientName = (patientId) => users.find(u => u.id === patientId)?.name || 'N/A';
    const getDoctorName = (doctorId) => users.find(u => u.id === doctorId)?.name || 'N/A';
    const getBranchName = (branchId) => branches.find(b => b.id === branchId)?.name || 'Pusat';

    const recordsWithDetails = useMemo(() => {
        return medicalRecords.map(record => {
            const consultations = expertConsultations.filter(c => c.medicalRecordId === record.id);
            return {
                ...record,
                patientName: getPatientName(record.patientId),
                doctorName: getDoctorName(record.practitionerId),
                ownerId: record.ownerId, // Include ownerId
                branchName: getBranchName(record.branchId),
                consultationCount: consultations.length,
            };
        });
    }, [medicalRecords, expertConsultations, users, branches]);

    const filteredRecords = useMemo(() => {
        return recordsWithDetails.filter(record => {
            const branchMatch = selectedBranch === 'all' || record.branchId === selectedBranch;
            const searchMatch = record.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) || (record.assessment && record.assessment.toLowerCase().includes(searchTerm.toLowerCase()));
            return branchMatch && searchMatch;
        });
    }, [recordsWithDetails, searchTerm, selectedBranch]);

    const handleOpenModal = (record) => {
        setSelectedRecord(record);
        setConsultationNotes('');
    };

    const handleCloseModal = () => {
        setSelectedRecord(null);
    };

    const handleSubmitConsultation = async () => {
        if (!consultationNotes.trim()) {
            showModal({
                title: 'Peringatan',
                children: <p>Harap isi catatan konsultasi sebelum menyimpan.</p>,
                footer: <button onClick={hideModal} className="bg-red-600 text-white px-4 py-2 rounded-md">Tutup</button>
            });
            return;
        }
        setIsSubmitting(true);
        try {
            await addDoc(collection(db, 'expertConsultations'), {
                medicalRecordId: selectedRecord.id,
                expertId: currentUser.uid,
                expertEmail: currentUser.email,
                notes: consultationNotes,
                createdAt: serverTimestamp()
            });
            handleCloseModal();
        } catch (error) {
            console.error("Error submitting consultation: ", error);
            showModal({
                title: 'Error',
                children: <p>Gagal menyimpan konsultasi. Silakan coba lagi.</p>,
                footer: <button onClick={hideModal} className="bg-red-600 text-white px-4 py-2 rounded-md">Tutup</button>
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const recordLabResults = selectedRecord ? labResults.filter(lr => lr.medicalRecordId === selectedRecord.id) : [];
    const recordExpertConsultations = selectedRecord ? expertConsultations.filter(c => c.medicalRecordId === selectedRecord.id) : [];

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-700 p-4 rounded-lg shadow-md mb-6">Tim Ahli Pusat</h2>
            {/* Filter UI */}
            <div className="bg-white p-4 rounded-lg shadow mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Cari Pasien / Assessment</label>
                          <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                              <input type="text" placeholder="Ketik untuk mencari..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md"/>
                          </div>
                     </div>
                     <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Filter Cabang</label>
                             <select value={selectedBranch} onChange={e => setSelectedBranch(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md">
                                 <option value="all">Semua Cabang</option>
                                 {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                             </select>
                     </div>
                </div>
            </div>

            {/* Table of Medical Records */}
            <div className="bg-white rounded-lg shadow overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 responsive-table">
                    <thead className="bg-pink-200">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Tanggal</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Pasien</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Assessment</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Cabang</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Jml Konsultasi</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredRecords.map(record => (
                            <tr key={record.id}>
                                <td className="px-6 py-4 whitespace-nowrap" data-label="Tanggal">{record.date}</td>
                                <td className="px-6 py-4 whitespace-nowrap font-medium" data-label="Pasien">{record.patientName}</td>
                                <td className="px-6 py-4 whitespace-nowrap" data-label="Assessment">{record.assessment}</td>
                                <td className="px-6 py-4 whitespace-nowrap" data-label="Cabang">{record.branchName}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-center" data-label="Jml Konsultasi">
                                    <span className={`px-2 py-1 text-xs rounded-full ${record.consultationCount > 0 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}>
                                        {record.consultationCount}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap" data-label="Aksi">
                                    <button onClick={() => handleOpenModal(record)} className="text-indigo-600 hover:text-indigo-900">Lihat & Konsultasi</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Consultation Modal */}
            {selectedRecord && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-start p-4 overflow-y-auto">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl my-8">
                        <div className="p-6 border-b flex justify-between items-center">
                            <h3 className="text-xl font-bold">Detail Kasus & Konsultasi Ahli</h3>
                            <button onClick={handleCloseModal}><X/></button>
                        </div>
                        <div className="p-6 max-h-[70vh] overflow-y-auto">
                            {/* Record Details */}
                            <div className="mb-6">
                                 <h4 className="font-bold text-lg mb-2">Rekam Medis: {selectedRecord.patientName}</h4>
                                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm p-4 bg-gray-50 rounded-lg">
                                     <div><p className="font-semibold">Tanggal:</p><p>{selectedRecord.date}</p></div>
                                     <div><p className="font-semibold">Pasien:</p><p>{selectedRecord.patientName}</p></div>
                                     <div><p className="font-semibold">Dokter Cabang:</p><p>{selectedRecord.doctorName}</p></div>
                                     <div><p className="font-semibold">Cabang:</p><p>{selectedRecord.branchName}</p></div>
                                     <div className="col-span-2"><p className="font-semibold">Subjective:</p><p>{selectedRecord.subjective}</p></div>
                                     <div className="col-span-2"><p className="font-semibold">Objective:</p><p>{selectedRecord.objective}</p></div>
                                     <div className="col-span-2"><p className="font-semibold">Assessment:</p><p>{selectedRecord.assessment}</p></div>
                                     <div className="col-span-2"><p className="font-semibold">Plan:</p><p>{selectedRecord.plan}</p></div>
                                 </div>
                            </div>

                            {/* Existing Consultations */}
                            <div className="mb-6">
                                 <h4 className="font-bold text-lg mb-2">Riwayat Konsultasi Ahli</h4>
                                 {recordExpertConsultations.length > 0 ? (
                                     <div className="space-y-4">
                                         {recordExpertConsultations.map(consult => (
                                         <div key={consult.id} className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                                             <p className="font-semibold text-blue-800">{consult.expertEmail}</p>
                                             <p className="text-sm text-gray-500 mb-2">
                                                 {consult.createdAt?.toDate().toLocaleString('id-ID') || 'Baru saja'}
                                             </p>
                                             <p className="text-gray-700 whitespace-pre-wrap">{consult.notes}</p>
                                         </div>
                                         ))}
                                     </div>
                                 ) : <p className="text-gray-500 italic">Belum ada konsultasi untuk kasus ini.</p>}
                            </div>

                             {/* New Consultation Form */}
                             <div>
                                  <h4 className="font-bold text-lg mb-2">Beri Konsultasi Baru</h4>
                                  <textarea
                                      value={consultationNotes}
                                      onChange={(e) => setConsultationNotes(e.target.value)}
                                      rows="5"
                                      className="w-full p-2 border border-gray-300 rounded-md"
                                      placeholder="Tuliskan analisis, saran, atau diagnosis banding Anda di sini..."
                                  />
                             </div>
                        </div>
                        <div className="p-4 bg-gray-50 border-t flex justify-end">
                              <button onClick={handleCloseModal} className="bg-gray-500 text-white px-4 py-2 rounded-md mr-2">Tutup</button>
                              <button onClick={handleSubmitConsultation} disabled={isSubmitting} className="bg-indigo-600 text-white px-4 py-2 rounded-md disabled:bg-indigo-400">
                                   {isSubmitting ? <Loader2 className="animate-spin"/> : 'Simpan Konsultasi'}
                              </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Komponen Struk Pembayaran ---
const Receipt = ({ transaction, onClose, currentUser, users, branches, appSettings, scriptsReady }) => {
    const printReceipt = () => window.print();
    
    const branchDetails = branches.find(b => b.id === transaction.branchId) || {
        name: appSettings.clinicName || 'Klinik Sibiomasi',
        address: 'Jl. Kesehatan No. 1, Jakarta',
        phone: ''
    };
    
    const receiptExportData = [
        ...transaction.items.map(item => ({
            'Nama Item': item.name,
            'Jumlah': item.quantity,
            'Harga Satuan': item.price,
            'Total': item.price * item.quantity,
        })),
        { 'Nama Item': 'Subtotal', 'Total': transaction.subtotal },
        { 'Nama Item': 'Pajak (11%)', 'Total': transaction.tax },
        { 'Nama Item': 'Grand Total', 'Total': transaction.total },
    ];
    const receiptExportCols = [
        { header: 'Nama Item', accessor: r => r['Nama Item'] || '' },
        { header: 'Jumlah', accessor: r => r['Jumlah'] || '' },
        { header: 'Harga Satuan', accessor: r => r['Harga Satuan'] ? formatCurrency(r['Harga Satuan']) : '' },
        { header: 'Total', accessor: r => r['Total'] ? formatCurrency(r['Total']) : '' },
    ];

    return (
        <>
            <style>{`
                @media print {
                    body * { visibility: hidden; }
                    #receipt-to-print, #receipt-to-print * { visibility: visible; }
                    #receipt-to-print {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        font-family: 'Courier New', monospace;
                        font-size: 10pt;
                    }
                    .print-only { display: block !important; }
                    .no-print { display: none !important; }
                }
            `}</style>
            <div id="receipt-to-print">
                <div className="text-sm text-gray-800 w-[300px] mx-auto">
                    <div className="text-center mb-4">
                        <h3 className="text-lg font-bold">{branchDetails.name}</h3>
                        <p>{branchDetails.address}</p>
                        {branchDetails.phone && <p>Telp: {branchDetails.phone}</p>}
                    </div>
                    <hr className="border-dashed border-black"/>
                    <div className="my-2">
                        <p>No: {transaction.id.substring(0, 8)}</p>
                        <p>Tanggal: {transaction.createdAt.toLocaleDateString('id-ID')} {transaction.createdAt.toLocaleTimeString('id-ID')}</p>
                        <p>Kasir: {currentUser.name}</p>
                        <p>Pasien: {users.find(u => u.id === transaction.patientId)?.name || 'N/A'}</p>
                    </div>
                    <hr className="border-dashed border-black"/>
                    <div className="my-2">
                        {transaction.items.map(item => (
                            <div key={item.id} className="flex justify-between">
                                <div className="flex-1 pr-2">
                                    <p>{item.name}</p>
                                    <p className="pl-2">{item.quantity} x {formatCurrency(item.price)}</p>
                                </div>
                                <p className="text-right">{formatCurrency(item.quantity * item.price)}</p>
                            </div>
                        ))}
                    </div>
                    <hr className="border-dashed border-black"/>
                    <div className="my-2 space-y-1">
                        <div className="flex justify-between"><p>Subtotal:</p> <p>{formatCurrency(transaction.subtotal)}</p></div>
                        <div className="flex justify-between"><p>Pajak (11%):</p> <p>{formatCurrency(transaction.tax)}</p></div>
                        <div className="flex justify-between font-bold text-base"><p>Total:</p> <p>{formatCurrency(transaction.total)}</p></div>
                        <div className="flex justify-between"><p>Metode:</p> <p>{transaction.paymentMethod}</p></div>
                    </div>
                    <hr className="border-dashed border-black"/>
                    <p className="text-center mt-4">Terima kasih atas kunjungan Anda!</p>
                </div>
            </div>
            <div className="no-print flex justify-end gap-2 mt-6 flex-wrap">
                <ExportButtons
                    data={receiptExportData}
                    title={`Struk_${transaction.id.substring(0,5)}`}
                    columns={receiptExportCols}
                    scriptsReady={scriptsReady}
                />
                <button onClick={onClose} className="bg-gray-200 text-gray-800 px-3 py-1.5 text-xs sm:px-4 sm:py-2 rounded-md">Tutup</button>
                <button onClick={printReceipt} className="bg-indigo-600 text-white px-3 py-1.5 text-xs sm:px-4 sm:py-2 rounded-md">Cetak Struk</button>
            </div>
        </>
    );
};

// --- Komponen Kasir ---
const CashierModule = ({ users, inventory, services, currentUser, showModal, hideModal, payments, branches, appSettings, scriptsReady }) => {
    const [cart, setCart] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('QRIS');
    const [searchTerm, setSearchTerm] = useState('');
    const [manualItem, setManualItem] = useState({ name: '', price: '' });

    const patients = useMemo(() => users.filter(u => u.role?.toLowerCase() === 'pasien'), [users]);
    
    const sellableItems = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();

        // Gabungkan produk dan layanan menjadi satu daftar
        const products = inventory
            .filter(item => item.name && typeof item.stock === 'number' && item.stock >= 0) // [FIX] Filter out invalid items
            .map(item => ({ ...item, type: 'product', stock: item.stock || 0 }));
        const serviceItems = services.map(item => ({ ...item, type: 'service' }));
        const allItems = [...products, ...serviceItems];
        
        // Filter berdasarkan cabang (jika berlaku)
        const branchFilteredItems = allItems.filter(item => {
            if (item.type === 'service') return true; // Layanan selalu ditampilkan

            // Logika baru untuk peran manajemen
            if (currentUser.role === 'manajemen') {
                // Hanya tampilkan produk dari pusat (item tanpa branchId)
                return !item.branchId;
            }
            
            // Logika untuk staf cabang: tampilkan produk dari cabang mereka ATAU dari pusat
            return item.branchId === currentUser.branchId || !item.branchId;
        });

        if (term === '') {
            return branchFilteredItems;
        }
    
        return branchFilteredItems.filter(item =>
            item.name && item.name.toLowerCase().includes(term)
        );
    }, [inventory, services, searchTerm, currentUser.branchId, currentUser.role]);

    const subtotal = useMemo(() => cart.reduce((sum, item) => sum + (item.price * item.quantity), 0), [cart]);
    const tax = subtotal * 0.11; // Example tax 11%
    const total = subtotal + tax;

    const addToCart = (itemToAdd) => {
        setCart(prevCart => {
            const existingItem = prevCart.find(item => item.id === itemToAdd.id);
            if (existingItem) {
                return prevCart.map(item =>
                    item.id === itemToAdd.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            return [...prevCart, { ...itemToAdd, quantity: 1 }];
        });
    };

    const removeFromCart = (itemId) => {
        setCart(prevCart => prevCart.filter(item => item.id !== itemId));
    };

    const handleManualItemAdd = () => {
        if (!manualItem.name || !manualItem.price || isNaN(parseFloat(manualItem.price))) {
            showModal({ title: 'Input Tidak Valid', children: <p>Nama dan harga item manual harus diisi dengan benar.</p> });
            return;
        }
        const newItem = {
            id: `manual-${Date.now()}`,
            name: manualItem.name,
            price: parseFloat(manualItem.price),
            isManual: true,
        };
        addToCart(newItem);
        setManualItem({ name: '', price: '' });
    };

    const handleProcessPayment = async () => {
        if (!selectedPatient || cart.length === 0) {
            showModal({ title: 'Error', children: <p>Silakan pilih pasien dan tambahkan item ke keranjang terlebih dahulu.</p> });
            return;
        }

        // [FIX] Add explicit validation for items in cart before processing
        for (const item of cart) {
            if (!item || !item.id || !item.name) {
                showModal({ title: 'Error Item Tidak Valid', children: <p>Terdapat item yang tidak valid di keranjang Anda. Harap hapus item tersebut dan coba lagi.</p> });
                return;
            }
        }

    const batch = writeBatch(db);

        try {
        // --- Stock Validation & Update Step ---
        // WORKAROUND: Skip inventory check/update for 'manajemen' role.
        // This is because the 'manajemen' role does not have write permissions to the inventory collection,
        // which causes the transaction to fail. This will lead to stock data inconsistency for sales
        // made by management, but it allows them to complete the transaction.
        if (currentUser.role !== 'manajemen') {
            const stockIssues = [];
            const inventoryUpdates = [];

            for (const cartItem of cart) {
                if (cartItem.isManual || cartItem.type === 'service') continue;

                const inventoryItemRef = doc(db, 'inventory', cartItem.id);
                const inventoryItemSnap = await getDoc(inventoryItemRef);

                if (!inventoryItemSnap.exists()) {
                    stockIssues.push(`${cartItem.name} tidak lagi tersedia.`);
                } else {
                    const currentStock = inventoryItemSnap.data().stock;
                    if (currentStock < cartItem.quantity) {
                        stockIssues.push(`Stok untuk ${cartItem.name} tidak mencukupi (tersisa ${currentStock}).`);
                    } else {
                        inventoryUpdates.push({ ref: inventoryItemRef, change: -cartItem.quantity });
                    }
                }
            }

            if (stockIssues.length > 0) {
                showModal({ 
                    title: 'Masalah Stok', 
                    children: (
                        <div>
                            <p>Tidak dapat melanjutkan transaksi karena masalah berikut:</p>
                            <ul className="list-disc list-inside mt-2 text-red-600">
                                {stockIssues.map((issue, i) => <li key={i}>{issue}</li>)}
                            </ul>
                        </div>
                    )
                });
                return;
            }

            // --- Update inventory in the same batch ---
            inventoryUpdates.forEach(update => {
                batch.update(update.ref, { stock: increment(update.change) });
            });
        }
        
        // --- Process payment using a batch ---
        const paymentData = {
            patientId: selectedPatient,
            cashierId: currentUser.id,
            branchId: currentUser.role === 'manajemen' ? null : (currentUser.branchId || null),
            items: cart,
            subtotal,
            tax,
            total,
            paymentMethod,
            createdAt: serverTimestamp(),
            status: 'Completed'
        };
        
        const paymentDocRef = doc(collection(db, 'payments'));
        batch.set(paymentDocRef, paymentData);

        // --- Update inventory in the same batch ---
        inventoryUpdates.forEach(update => {
            batch.update(update.ref, { stock: increment(update.change) });
        });
        
        await batch.commit();

        // --- Show receipt on success ---
        const finalTransaction = { ...paymentData, id: paymentDocRef.id, createdAt: new Date() };

            showModal({ 
            title: `Struk Transaksi #${paymentDocRef.id.substring(0, 5).toUpperCase()}`,
                children: <Receipt 
                            transaction={finalTransaction} 
                            onClose={hideModal} 
                            currentUser={currentUser}
                            users={users}
                            branches={branches}
                            appSettings={appSettings}
                        scriptsReady={scriptsReady}
                          />,
                footer: null
            });

        // Reset state after successful transaction
            setCart([]);
            setSelectedPatient(null);
            setSearchTerm('');

        } catch (error) {
        console.error("Error processing atomic payment: ", error);
        showModal({ title: 'Error Transaksi', children: <p>Terjadi kesalahan kritis saat memproses pembayaran. Data tidak disimpan. Silakan coba lagi. Error: ${error.message}</p> });
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
                <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-700 p-4 rounded-lg shadow-md mb-4">Pilih Produk & Layanan</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label htmlFor="patient-select" className="block text-sm font-medium text-gray-700 mb-1">Pilih Pasien</label>
                            <select id="patient-select" value={selectedPatient || ''} onChange={(e) => setSelectedPatient(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500">
                                <option value="" disabled>-- Pilih Pasien --</option>
                                {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.phone})</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="search-item" className="block text-sm font-medium text-gray-700 mb-1">Cari Produk/Layanan</label>
                            <input id="search-item" type="text" placeholder="Ketik untuk mencari..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" />
                        </div>
                    </div>
                    <div className="h-72 overflow-y-auto border rounded-md">
                        <table className="min-w-full">
                            <tbody className="divide-y">
                                {sellableItems.length > 0 ? (
                                    sellableItems.map(item => (
                                        <tr key={item.id} className="hover:bg-gray-50">
                                            <td className="p-3">
                                                <div className="flex items-center">
                                                    <span className={`mr-2 text-xs font-semibold px-2 py-0.5 rounded-full ${item.type === 'product' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                                                        {item.type === 'product' ? 'Produk' : 'Layanan'}
                                                    </span>
                                                    <div>
                                                        <p className="font-semibold text-gray-700">{item.name}</p>
                                                        <p className="text-sm text-gray-500">{formatCurrency(item.price)}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-3 text-right">
                                                <button onClick={() => addToCart(item)} className="bg-indigo-500 text-white px-4 py-1.5 rounded-md text-sm font-semibold hover:bg-indigo-600 transition-colors">Tambah</button>
                                            </td>
                                        </tr>
                                    ))
                                ) : searchTerm.trim() ? (
                                    <tr>
                                        <td colSpan="2" className="text-center text-gray-500 py-4">
                                            Produk atau layanan tidak ditemukan.
                                        </td>
                                    </tr>
                                ) : (
                                    <tr>
                                        <td colSpan="2" className="text-center text-gray-500 py-4">
                                            Tidak ada produk atau layanan yang tersedia saat ini.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="mt-6 pt-4 border-t">
                        <h4 className="font-semibold mb-2 text-gray-800">Tambah Item Manual</h4>
                        <div className="flex flex-col sm:flex-row gap-2">
                             <input type="text" placeholder="Nama Item" value={manualItem.name} onChange={e => setManualItem({...manualItem, name: e.target.value})} className="p-2 border rounded-md w-full focus:ring-indigo-500 focus:border-indigo-500" />
                             <input type="number" placeholder="Harga" value={manualItem.price} onChange={e => setManualItem({...manualItem, price: e.target.value})} className="p-2 border rounded-md w-full sm:w-1/2 focus:ring-indigo-500 focus:border-indigo-500" />
                             <button onClick={handleManualItemAdd} className="bg-green-500 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-green-600 transition-colors">Tambah Manual</button>
                        </div>
                    </div>
                </div>
                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-lg shadow-md sticky top-6">
                        <h3 className="text-xl font-semibold mb-4 border-b pb-3 text-gray-800">Keranjang</h3>
                        <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                            {cart.length === 0 ? (
                                <p className="text-gray-500 text-center py-8">Keranjang masih kosong</p>
                            ) : (
                                cart.map(item => (
                                    <div key={item.id} className="flex justify-between items-center text-sm">
                                        <div>
                                            <p className="font-medium text-gray-800">{item.name}</p>
                                            <p className="text-gray-500">{formatCurrency(item.price)} x {item.quantity}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <p className="font-semibold text-gray-800">{formatCurrency(item.price * item.quantity)}</p>
                                            <button onClick={() => removeFromCart(item.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16}/></button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="border-t mt-4 pt-4 space-y-2 text-sm">
                             <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                             <div className="flex justify-between text-gray-600"><span>Pajak (11%)</span><span>{formatCurrency(tax)}</span></div>
                             <div className="flex justify-between font-bold text-lg text-gray-800 mt-2"><span>Total</span><span>{formatCurrency(total)}</span></div>
                        </div>
                        <div className="mt-6">
                            <h4 className="font-semibold mb-2 text-gray-800">Metode Pembayaran</h4>
                            <div className="flex gap-2">
                                {['QRIS', 'Tunai', 'Transfer'].map(method => (
                                    <button key={method} onClick={() => setPaymentMethod(method)} className={`flex-1 p-2 rounded-md border text-sm font-semibold transition-colors ${paymentMethod === method ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white hover:bg-gray-100'}`}>
                                        {method}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="mt-6">
                            <button onClick={handleProcessPayment} className="w-full bg-green-600 text-white p-3 rounded-md font-bold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors" disabled={cart.length === 0 || !selectedPatient}>
                                Proses Pembayaran
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- [BARU] Komponen Live Chat ---
const LiveChatModule = ({ currentUser, users, showModal, hideModal, scriptsReady }) => {
    const [conversations, setConversations] = useState([]);
    const [activeConversationId, setActiveConversationId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [showNewChatModal, setShowNewChatModal] = useState(false);
    const [showNewGroupModal, setShowNewGroupModal] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    const getUserName = (senderId) => users.find(u => u.id === senderId)?.name || 'Pengguna Tidak Dikenal';

    const formattedMessagesForExport = useMemo(() => {
        if (!messages) return [];
        return messages.map(msg => ({
            'Waktu': msg.timestamp ? msg.timestamp.toDate().toLocaleString('id-ID') : 'N/A',
            'Pengirim': getUserName(msg.senderId),
            'Pesan': msg.text || `File: ${msg.fileName || 'Lampiran'}`
        }));
    }, [messages, users]);

    const handleExportChatPdf = () => {
        const activeConversation = conversations.find(c => c.id === activeConversationId);
        if (!activeConversation || !window.jspdf) return;
        
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const chatTitle = otherParticipantName(activeConversation);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.text(`Riwayat Chat: ${chatTitle}`, 15, 20);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`, 15, 26);
        
        const exportData = formattedMessagesForExport.map(msg => [msg.Waktu, msg.Pengirim, msg.Pesan]);

        doc.autoTable({
            head: [['Waktu', 'Pengirim', 'Pesan']],
            body: exportData,
            startY: 35,
            theme: 'striped',
            headStyles: { fillColor: [44, 62, 80] },
        });

        doc.save(`Chat_${chatTitle.replace(/ /g, '_')}.pdf`);
    };

    const isUserOnline = (user) => {
        if (user.status === 'online' && user.last_seen) {
            const lastSeen = user.last_seen.toDate();
            const now = new Date();
            return (now.getTime() - lastSeen.getTime()) < 2 * 60 * 1000;
        }
        return false;
    };

    // Fetch conversations for the current user
    useEffect(() => {
        if (!currentUser) return;
        const q = query(collection(db, 'conversations'), where('participantIds', 'array-contains', currentUser.id), orderBy('lastTimestamp', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setConversations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
    }, [currentUser]);

    // Fetch messages and handle read receipts
    useEffect(() => {
        if (!activeConversationId) {
            setMessages([]);
            return;
        }
        const messagesRef = collection(db, 'conversations', activeConversationId, 'messages');
        const q = query(messagesRef, orderBy('timestamp', 'asc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setMessages(msgs);

            // Mark messages as read
            const activeConvo = conversations.find(c => c.id === activeConversationId);
            if (activeConvo) {
                snapshot.docs.forEach(doc => {
                    const message = doc.data();
                    if (message.senderId !== currentUser.id && (!message.readBy || !message.readBy.includes(currentUser.id))) {
                        updateDoc(doc.ref, {
                            readBy: [...(message.readBy || []), currentUser.id]
                        });
                    }
                });
            }
        });

        return () => unsubscribe();
    }, [activeConversationId, conversations, currentUser.id]);

    // Scroll to the bottom of the messages list when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeConversationId) return;
        setIsSending(true);
        const text = newMessage;
        setNewMessage('');
        try {
            const messagesRef = collection(db, 'conversations', activeConversationId, 'messages');
            await addDoc(messagesRef, { senderId: currentUser.id, text: text, timestamp: serverTimestamp(), readBy: [currentUser.id] });
            const convoRef = doc(db, 'conversations', activeConversationId);
            await updateDoc(convoRef, { lastMessage: text, lastTimestamp: serverTimestamp() });
        } catch (error) {
            console.error("Error sending message:", error);
            showModal({ title: 'Error', children: 'Gagal mengirim pesan.' });
        } finally {
            setIsSending(false);
        }
    };
    
    const handleFileUpload = async (file) => {
        if (!file || !activeConversationId) return;
        setIsSending(true);
        try {
            const fileRef = ref(storage, `chat-files/${activeConversationId}/${Date.now()}-${file.name}`);
            await uploadBytes(fileRef, file);
            const fileUrl = await getDownloadURL(fileRef);
            const messagesRef = collection(db, 'conversations', activeConversationId, 'messages');
            await addDoc(messagesRef, { senderId: currentUser.id, fileUrl: fileUrl, fileName: file.name, fileType: file.type, timestamp: serverTimestamp(), readBy: [currentUser.id] });
            const convoRef = doc(db, 'conversations', activeConversationId);
            await updateDoc(convoRef, { lastMessage: `File: ${file.name}`, lastTimestamp: serverTimestamp() });
        } catch (error) {
            console.error("Error uploading file:", error);
            showModal({ title: 'Error', children: 'Gagal mengunggah file.' });
        } finally {
            setIsSending(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const startNewConversation = async (otherUser) => {
        setShowNewChatModal(false);
        if (otherUser.id === currentUser.id) return;
        const participantIds = [currentUser.id, otherUser.id].sort();
        const q = query(collection(db, 'conversations'), where('participantIds', '==', participantIds), where('type', '==', 'private'));
        try {
            const existingConvo = await getDocs(q);
            if (!existingConvo.empty) {
                setActiveConversationId(existingConvo.docs[0].id);
            } else {
                const newConvoRef = await addDoc(collection(db, 'conversations'), {
                    participantIds: participantIds,
                    participantNames: { [currentUser.id]: currentUser.name, [otherUser.id]: otherUser.name },
                    lastMessage: 'Percakapan dimulai.',
                    lastTimestamp: serverTimestamp(),
                    type: 'private'
                });
                setActiveConversationId(newConvoRef.id);
            }
        } catch (error) {
            console.error("Error starting new conversation:", error);
            showModal({ title: 'Error', children: 'Gagal memulai percakapan baru.' });
        }
    };

    const createGroupConversation = async (participants, groupName) => {
        const participantIds = [currentUser.id, ...participants.map(p => p.id)];
        const participantNames = participantIds.reduce((acc, id) => {
            const user = users.find(u => u.id === id) || (id === currentUser.id ? currentUser : null);
            if (user) acc[id] = user.name;
            return acc;
        }, {});
        try {
            const newConvoRef = await addDoc(collection(db, 'conversations'), {
                participantIds, participantNames, groupName, type: 'group', createdBy: currentUser.id,
                lastMessage: `Grup "${groupName}" telah dibuat.`,
                lastTimestamp: serverTimestamp(),
            });
            setActiveConversationId(newConvoRef.id);
        } catch (error) {
            console.error("Error creating group conversation:", error);
            showModal({ title: 'Error', children: 'Gagal membuat grup baru.' });
        }
    };

    const handleUserSelection = (userId) => {
        setSelectedUsers(prev =>
            prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
        );
    };

    const handleCreateGroup = (e) => {
        e.preventDefault();
        if (!newGroupName.trim() || selectedUsers.length === 0) {
            showModal({ title: 'Input Tidak Valid', children: <p>Nama grup dan minimal satu peserta lain harus dipilih.</p> });
            return;
        }
        const participantObjects = users.filter(u => selectedUsers.includes(u.id));
        createGroupConversation(participantObjects, newGroupName);
        setShowNewGroupModal(false);
        setNewGroupName('');
        setSelectedUsers([]);
    };

    const activeConversation = conversations.find(c => c.id === activeConversationId);
    const [view, setView] = useState('list');
    useEffect(() => { setView(activeConversationId ? 'chat' : 'list'); }, [activeConversationId]);

    const otherParticipantName = (convo) => {
        if (!convo) return '';
        if (convo.type === 'group') return convo.groupName || 'Grup Tanpa Nama';
        const otherId = convo.participantIds.find(id => id !== currentUser.id);
        return convo.participantNames[otherId] || 'Pengguna Dihapus';
    };

    return (
        <div className="flex flex-col h-[calc(100vh-120px)] bg-white rounded-lg shadow-xl overflow-hidden">
            <div className="flex flex-1 overflow-hidden">
                <div className={`w-full md:w-1/3 lg:w-1/4 border-r border-gray-200 flex-col ${view === 'list' || !activeConversationId ? 'flex' : 'hidden md:flex'}`}>
                    <div className="p-4 border-b bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold">Percakapan</h2>
                            <div className="flex items-center">
                                <button onClick={() => setShowNewGroupModal(true)} title="Buat Grup Baru" className="p-2 rounded-full hover:bg-white/20"><Users2 size={20} /></button>
                                <button onClick={() => setShowNewChatModal(true)} title="Mulai Chat Baru" className="p-2 rounded-full hover:bg-white/20"><PlusCircle size={20} /></button>
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {conversations.map(convo => (
                            <div key={convo.id} onClick={() => setActiveConversationId(convo.id)} className={`p-4 cursor-pointer border-l-4 ${activeConversationId === convo.id ? 'bg-indigo-50 border-indigo-500' : 'hover:bg-gray-50 border-transparent'}`}>
                                <p className="font-semibold flex items-center">
                                    {convo.type === 'group' && <Users2 size={16} className="mr-2 flex-shrink-0" />}
                                    <span className="truncate">{otherParticipantName(convo)}</span>
                                    {convo.type === 'group' && <span className="text-xs text-gray-500 ml-2">({convo.participantIds.length})</span>}
                                </p>
                                <p className="text-sm text-gray-500 truncate">{convo.lastMessage}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className={`flex-1 flex-col ${view === 'chat' && activeConversationId ? 'flex' : 'hidden md:flex'}`}>
                    {activeConversation ? (
                        <>
                            <div className="p-4 border-b flex items-center justify-between bg-indigo-200">
                                <div className="flex items-center">
                                    <button onClick={() => setActiveConversationId(null)} className="mr-4 md:hidden text-gray-600"><X size={20} /></button>
                                    <h3 className="font-semibold text-gray-800">{otherParticipantName(activeConversation)}</h3>
                                </div>
                                <ExportButtons
                                    data={formattedMessagesForExport}
                                    title={`Chat_${otherParticipantName(activeConversation)}`}
                                    columns={[
                                        { header: 'Waktu', accessor: r => r['Waktu'] },
                                        { header: 'Pengirim', accessor: r => r['Pengirim'] },
                                        { header: 'Pesan', accessor: r => r['Pesan'] },
                                    ]}
                                    scriptsReady={scriptsReady}
                                    customPdfHandler={handleExportChatPdf}
                                />
                            </div>
                            <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
                                {messages.map(msg => {
                                    const isSender = msg.senderId === currentUser.id;
                                    return (
                                        <div key={msg.id} className={`flex flex-col ${isSender ? 'items-end' : 'items-start'} mb-4`}>
                                            <div className={`max-w-xs lg:max-w-md p-3 rounded-lg ${isSender ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
                                                {msg.text && <p className="whitespace-pre-wrap">{msg.text}</p>}
                                                {msg.fileUrl && (
                                                    msg.fileType?.startsWith('image/') ?
                                                    <img src={msg.fileUrl} alt={msg.fileName} className="rounded-md max-w-full h-auto my-2" /> :
                                                    <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center underline text-current"><FileText size={16} className="mr-2 flex-shrink-0" /> <span className="truncate">{msg.fileName}</span></a>
                                                )}
                                            </div>
                                            <div className={`text-xs mt-1 flex items-center ${isSender ? 'text-gray-500' : 'text-gray-400'}`}>
                                                <span>{msg.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                {isSender && (() => {
                                                    if (!activeConversation) return null;
                                                    const otherParticipantIds = activeConversation.participantIds.filter(id => id !== currentUser.id);
                                                    const readByAllOthers = otherParticipantIds.every(id => msg.readBy?.includes(id));
                                                    if (readByAllOthers) {
                                                        return <CheckCheck size={16} className="ml-1 text-blue-500" />;
                                                    }
                                                    return <Check size={16} className="ml-1 text-gray-400" />;
                                                })()}
                                            </div>
                                        </div>
                                    )
                                })}
                                <div ref={messagesEndRef} />
                            </div>
                            <div className="p-4 border-t bg-white">
                                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                                    <input type="file" id="chat-file-upload" ref={fileInputRef} className="hidden" onChange={(e) => e.target.files[0] && handleFileUpload(e.target.files[0])} />
                                    <label htmlFor="chat-file-upload" className="p-2 text-gray-500 hover:text-indigo-600 cursor-pointer">
                                        <UploadCloud size={20} />
                                    </label>
                                    <div className="flex-1 relative">
                                        <input
                                            type="text"
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            placeholder="Ketik pesan..."
                                            className="w-full px-4 py-2 pr-12 border rounded-full focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                        />
                                        <button
                                            type="submit"
                                            disabled={!newMessage.trim() || isSending}
                                            className="absolute inset-y-0 right-0 flex items-center justify-center w-12 text-gray-500 hover:text-indigo-600 disabled:text-gray-300 disabled:cursor-not-allowed"
                                        >
                                            {isSending ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 hidden md:flex items-center justify-center text-gray-500"><p>Pilih percakapan untuk memulai.</p></div>
                    )}
                </div>
            </div>

            {showNewChatModal && (
                <CustomModal show={showNewChatModal} onClose={() => setShowNewChatModal(false)} title="Mulai Percakapan Pribadi">
                    <div className="max-h-96 overflow-y-auto">
                        {users.filter(u => u.id !== currentUser.id && ['manajemen', 'doctor', 'staf_operasional'].includes(u.role)).map(user => (
                            <div key={user.id} onClick={() => startNewConversation(user)} className="p-3 hover:bg-gray-100 cursor-pointer rounded-md flex justify-between items-center">
                                <div>
                                    <p className="font-semibold">{user.name}</p>
                                    <p className="text-sm text-gray-500">{user.role}</p>
                                </div>
                                <span className={`h-3 w-3 rounded-full ${isUserOnline(user) ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                            </div>
                        ))}
                    </div>
                </CustomModal>
            )}

            {showNewGroupModal && (
                <CustomModal show={showNewGroupModal} onClose={() => setShowNewGroupModal(false)} title="Buat Grup Baru">
                    <form onSubmit={handleCreateGroup}>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="group-name" className="block text-sm font-medium text-gray-700">Nama Grup</label>
                                <input type="text" id="group-name" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required />
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-gray-700">Pilih Peserta</h4>
                                <div className="mt-2 max-h-60 overflow-y-auto border border-gray-200 rounded-md p-2">
                                    {users.filter(u => u.id !== currentUser.id && ['manajemen', 'doctor', 'staf_operasional'].includes(u.role)).map(user => (
                                        <div key={user.id} className="flex items-center p-2 rounded-md hover:bg-gray-50">
                                            <input
                                                id={`user-${user.id}`}
                                                type="checkbox"
                                                checked={selectedUsers.includes(user.id)}
                                                onChange={() => handleUserSelection(user.id)}
                                                className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                                            />
                                            <label htmlFor={`user-${user.id}`} className="ml-3 block text-sm font-medium text-gray-700 flex items-center">
                                                <span className={`h-2.5 w-2.5 rounded-full mr-2 ${isUserOnline(user) ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                                                {user.name} <span className="text-gray-500 ml-1">({user.role})</span>
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end space-x-2 pt-6">
                            <button type="button" onClick={() => setShowNewGroupModal(false)} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md">Batal</button>
                            <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-md">Buat Grup</button>
                        </div>
                    </form>
                </CustomModal>
            )}
        </div>
    );
};

// --- [BARU] Komponen Modul Peracikan ---
const CompoundingModule = ({ currentUser, showModal, hideModal }) => {
    const [activeTab, setActiveTab] = useState('ingredients');
    const [ingredients, setIngredients] = useState([]);
    const [formulas, setFormulas] = useState([]);
    const [loading, setLoading] = useState(true);

    // Listener untuk bahan baku
    useEffect(() => {
        setLoading(true);
        const q = query(collection(db, 'compoundingIngredients'), orderBy('name'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setIngredients(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        }, (error) => {
            console.error("Error fetching ingredients:", error);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // Listener untuk formula
    useEffect(() => {
        const q = query(collection(db, "compoundingFormulas"), orderBy("name"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setFormulas(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }, (error) => {
            console.error("Error fetching formulas:", error);
        });
        return () => unsubscribe();
    }, []);

    const IngredientsManagement = () => {
        const [showForm, setShowForm] = useState(false);
        const [editingIngredient, setEditingIngredient] = useState(null);
        const [formData, setFormData] = useState({ name: '', supplier: '', stock: 0, unit: 'gram', price: 0, expiryDate: '' });

        const resetForm = () => {
            setFormData({ name: '', supplier: '', stock: 0, unit: 'gram', price: 0, expiryDate: '' });
            setEditingIngredient(null);
            setShowForm(false);
        };

        const handleEdit = (ingredient) => {
            setEditingIngredient(ingredient);
            setFormData({
                name: ingredient.name || '',
                supplier: ingredient.supplier || '',
                stock: ingredient.stock || 0,
                unit: ingredient.unit || 'gram',
                price: ingredient.price || 0,
                expiryDate: ingredient.expiryDate || ''
            });
            setShowForm(true);
        };

        const handleSubmit = async (e) => {
            e.preventDefault();
            try {
                const dataToSave = { ...formData, stock: Number(formData.stock), price: Number(formData.price) };
                if (editingIngredient) {
                    await updateDoc(doc(db, 'compoundingIngredients', editingIngredient.id), dataToSave);
                } else {
                    await addDoc(collection(db, 'compoundingIngredients'), dataToSave);
                }
                resetForm();
            } catch (error) {
                console.error("Error saving ingredient:", error);
                showModal({ title: 'Error', children: 'Gagal menyimpan data bahan.'});
            }
        };

        const handleDelete = (id) => {
            showModal({
                title: 'Konfirmasi Hapus',
                children: 'Anda yakin ingin menghapus bahan baku ini?',
                footer: (
                    <>
                        <button onClick={hideModal} className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md">Batal</button>
                        <button onClick={async () => {
                            try {
                                await deleteDoc(doc(db, 'compoundingIngredients', id));
                                hideModal();
                            } catch (error) {
                                console.error("Error deleting ingredient:", error);
                            }
                        }} className="bg-red-600 text-white px-4 py-2 rounded-md">Hapus</button>
                    </>
                )
            });
        };

        return (
            <div>
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4 p-3 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-md">
                    <h3 className="text-xl font-bold">Daftar Bahan Baku</h3>
                    <button onClick={() => { resetForm(); setShowForm(true); }} className="bg-white text-teal-600 px-4 py-1 rounded-md hover:bg-gray-100 flex items-center text-sm font-semibold self-start sm:self-center">
                        <PlusCircle size={16} className="mr-2"/> Tambah Bahan
                    </button>
                </div>

                {showForm && (
                    <CustomModal show={showForm} onClose={resetForm} title={editingIngredient ? 'Edit Bahan Baku' : 'Tambah Bahan Baku'}>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div><label>Nama Bahan</label><input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="mt-1 block w-full rounded-md" required/></div>
                                <div><label>Pemasok</label><input type="text" value={formData.supplier} onChange={e => setFormData({...formData, supplier: e.target.value})} className="mt-1 block w-full rounded-md"/></div>
                                <div><label>Stok</label><input type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} className="mt-1 block w-full rounded-md" required/></div>
                                <div><label>Satuan</label><select value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} className="mt-1 block w-full rounded-md"><option>gram</option><option>mg</option><option>ml</option><option>pcs</option></select></div>
                                <div><label>Harga (per satuan)</label><input type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="mt-1 block w-full rounded-md" required/></div>
                                <div><label>Tgl Kedaluwarsa</label><input type="date" value={formData.expiryDate} onChange={e => setFormData({...formData, expiryDate: e.target.value})} className="mt-1 block w-full rounded-md"/></div>
                            </div>
                            <div className="flex justify-end space-x-2 pt-4">
                                <button type="button" onClick={resetForm} className="bg-gray-500 text-white px-3 py-1.5 text-sm sm:px-4 sm:py-2 rounded-md">Batal</button>
                                <button type="submit" className="bg-indigo-600 text-white px-3 py-1.5 text-sm sm:px-4 sm:py-2 rounded-md">{editingIngredient ? 'Perbarui' : 'Simpan'}</button>
                            </div>
                        </form>
                    </CustomModal>
                )}

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-red-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-gray-700 font-medium">Nama</th>
                                <th className="px-6 py-3 text-left text-gray-700 font-medium">Pemasok</th>
                                <th className="px-6 py-3 text-left text-gray-700 font-medium">Stok</th>
                                <th className="px-6 py-3 text-left text-gray-700 font-medium">Harga</th>
                                <th className="px-6 py-3 text-left text-gray-700 font-medium">Kedaluwarsa</th>
                                <th className="px-6 py-3 text-left text-gray-700 font-medium">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr><td colSpan="6" className="text-center py-4"><Loader2 className="animate-spin mx-auto"/></td></tr>
                            ) : ingredients.map(ing => (
                                <tr key={ing.id}>
                                    <td className="px-6 py-4">{ing.name}</td>
                                    <td className="px-6 py-4">{ing.supplier}</td>
                                    <td className="px-6 py-4">{ing.stock} {ing.unit}</td>
                                    <td className="px-6 py-4">{formatCurrency(ing.price)}</td>
                                    <td className="px-6 py-4">{ing.expiryDate}</td>
                                    <td className="px-6 py-4">
                                        <button onClick={() => handleEdit(ing)} className="text-indigo-600 hover:text-indigo-900 mr-3"><Edit size={16}/></button>
                                        <button onClick={() => handleDelete(ing.id)} className="text-red-600 hover:text-red-900"><Trash2 size={16}/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const FormulasManagement = ({ ingredients, formulas }) => {
        const [showForm, setShowForm] = useState(false);
        const [editingFormula, setEditingFormula] = useState(null);
        const [formData, setFormData] = useState({ name: '', description: '', ingredients: [] });

        const resetForm = () => {
            setFormData({ name: '', description: '', ingredients: [] });
            setEditingFormula(null);
            setShowForm(false);
        };

        const handleEdit = (formula) => {
            setEditingFormula(formula);
            setFormData({
                name: formula.name || '',
                description: formula.description || '',
                ingredients: formula.ingredients || []
            });
            setShowForm(true);
        };
        
        const handleFormIngredientChange = (index, field, value) => {
            const newIngredients = [...formData.ingredients];
            if (field === 'ingredientId') {
                const selected = ingredients.find(i => i.id === value);
                // Menambahkan kode pengaman untuk mencegah error jika bahan tidak ditemukan
                if (selected) {
                    newIngredients[index] = { ...newIngredients[index], ingredientId: value, name: selected.name, unit: selected.unit };
                } else {
                    newIngredients[index] = { ...newIngredients[index], ingredientId: value, name: '', unit: '' };
                }
            } else {
                newIngredients[index] = { ...newIngredients[index], [field]: value };
            }
            setFormData({ ...formData, ingredients: newIngredients });
        };

        const addIngredientToForm = () => {
            setFormData({ ...formData, ingredients: [...formData.ingredients, { ingredientId: '', name: '', quantity: 1, unit: '' }] });
        };

        const removeIngredientFromForm = (index) => {
            const newIngredients = formData.ingredients.filter((_, i) => i !== index);
            setFormData({ ...formData, ingredients: newIngredients });
        };

        const handleSubmit = async (e) => {
            e.preventDefault();
            try {
                const dataToSave = { ...formData, ingredients: formData.ingredients.map(i => ({...i, quantity: Number(i.quantity)})) };
                if (editingFormula) {
                    await updateDoc(doc(db, 'compoundingFormulas', editingFormula.id), dataToSave);
                } else {
                    await addDoc(collection(db, 'compoundingFormulas'), dataToSave);
                }
                resetForm();
            } catch (error) {
                console.error("Error saving formula:", error);
                showModal({ title: 'Error', children: 'Gagal menyimpan formula.' });
            }
        };

        const handleDelete = (id) => {
            showModal({
                title: 'Konfirmasi Hapus',
                children: 'Anda yakin ingin menghapus formula ini?',
                footer: (
                    <>
                        <button onClick={hideModal} className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md">Batal</button>
                        <button onClick={async () => {
                            try {
                                await deleteDoc(doc(db, 'compoundingFormulas', id));
                                hideModal();
                            } catch (error) { console.error("Error deleting formula:", error); }
                        }} className="bg-red-600 text-white px-4 py-2 rounded-md">Hapus</button>
                    </>
                )
            });
        };

        return (
            <div>
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4 p-3 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-md">
                    <h3 className="text-xl font-bold">Daftar Formula</h3>
                    <button onClick={() => { resetForm(); setShowForm(true); }} className="bg-white text-teal-600 px-4 py-1 rounded-md hover:bg-gray-100 flex items-center text-sm font-semibold self-start sm:self-center">
                        <PlusCircle size={16} className="mr-2"/> Tambah Formula
                    </button>
                </div>

                {showForm && (
                    <CustomModal show={showForm} onClose={resetForm} title={editingFormula ? 'Edit Formula' : 'Tambah Formula Baru'}>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div><label>Nama Formula</label><input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="mt-1 block w-full rounded-md" required/></div>
                            <div><label>Deskripsi/Instruksi</label><textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="mt-1 block w-full rounded-md"/></div>
                            
                            <h4 className="font-semibold pt-2">Bahan-bahan</h4>
                            <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                                {formData.ingredients.map((ing, index) => (
                                    <div key={index} className="grid grid-cols-12 gap-2 items-center">
                                        <select value={ing.ingredientId} onChange={e => handleFormIngredientChange(index, 'ingredientId', e.target.value)} className="col-span-5 block w-full rounded-md text-sm" required>
                                            <option value="">Pilih Bahan</option>
                                            {ingredients.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                                        </select>
                                        <input type="number" placeholder="Jml" value={ing.quantity} onChange={e => handleFormIngredientChange(index, 'quantity', e.target.value)} className="col-span-3 block w-full rounded-md text-sm" required/>
                                        <span className="col-span-3 text-sm text-gray-500">{ing.unit}</span>
                                        <button type="button" onClick={() => removeIngredientFromForm(index)} className="col-span-1 text-red-500 hover:text-red-700"><Trash2 size={16}/></button>
                                    </div>
                                ))}
                            </div>
                            <button type="button" onClick={addIngredientToForm} className="text-sm text-indigo-600 hover:text-indigo-800">+ Tambah Bahan</button>
                            
                            <div className="flex justify-end space-x-2 pt-4">
                                <button type="button" onClick={resetForm} className="bg-gray-500 text-white px-3 py-1.5 text-sm sm:px-4 sm:py-2 rounded-md">Batal</button>
                                <button type="submit" className="bg-indigo-600 text-white px-3 py-1.5 text-sm sm:px-4 sm:py-2 rounded-md">{editingFormula ? 'Perbarui' : 'Simpan'}</button>
                            </div>
                        </form>
                    </CustomModal>
                )}

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-red-200">
                            <tr><th className="px-6 py-3 text-left text-gray-700 font-medium">Nama Formula</th><th className="px-6 py-3 text-left text-gray-700 font-medium">Deskripsi</th><th className="px-6 py-3 text-left text-gray-700 font-medium">Aksi</th></tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {formulas.map(form => (
                                <tr key={form.id}>
                                    <td className="px-6 py-4 font-semibold">{form.name}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{form.description}</td>
                                    <td className="px-6 py-4">
                                        <button onClick={() => handleEdit(form)} className="text-indigo-600 hover:text-indigo-900 mr-3"><Edit size={16}/></button>
                                        <button onClick={() => handleDelete(form.id)} className="text-red-600 hover:text-red-900"><Trash2 size={16}/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'ingredients':
                return <IngredientsManagement />;
            case 'formulas':
                return <FormulasManagement ingredients={ingredients} formulas={formulas} />;
            default:
                return null;
        }
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <h2 className="text-2xl font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-700 p-4 rounded-lg shadow-md mb-6">Modul Tim Peracik Cabang</h2>
            <div className="mb-6">
                <nav className="flex space-x-2 sm:space-x-4" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('ingredients')}
                        className={`${
                            activeTab === 'ingredients'
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'bg-white text-gray-600 hover:bg-gray-100'
                        } whitespace-nowrap py-3 px-4 rounded-md font-semibold text-sm transition-all duration-200 ease-in-out`}
                    >
                        Manajemen Bahan
                    </button>
                    <button
                        onClick={() => setActiveTab('formulas')}
                        className={`${
                            activeTab === 'formulas'
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'bg-white text-gray-600 hover:bg-gray-100'
                        } whitespace-nowrap py-3 px-4 rounded-md font-semibold text-sm transition-all duration-200 ease-in-out`}
                    >
                        Manajemen Formula
                    </button>
                </nav>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
                {renderContent()}
            </div>
        </div>
    );
};

// --- [BARU] Komponen Panduan Aplikasi ---
const ApplicationGuide = () => {
    const Section = ({ title, children, icon }) => (
        <section className="mb-8">
            <h2 className="text-2xl font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-700 p-4 rounded-lg shadow-md mb-4 flex items-center">
                {icon && React.cloneElement(icon, { className: "mr-3" })}
                {title}
            </h2>
            <div className="bg-white p-6 rounded-lg shadow space-y-4">
                {children}
            </div>
        </section>
    );

    const Step = ({ number, title, children }) => (
        <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">{number}</div>
            <div className="flex-1">
                <h4 className="text-lg font-semibold text-gray-800">{title}</h4>
                <div className="text-gray-600">{children}</div>
            </div>
        </div>
    );

    const RoleCard = ({ role, description, modules }) => (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 transform hover:scale-105 transition-transform duration-300">
            <h3 className="text-xl font-semibold text-indigo-700">{role}</h3>
            <p className="text-gray-600 mt-1 mb-3">{description}</p>
            <h4 className="font-semibold text-gray-800">Modul yang Dapat Diakses:</h4>
            <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 mt-2">
                {modules.map(mod => <li key={mod}>{mod}</li>)}
            </ul>
        </div>
    );

    return (
        <div className="p-2 sm:p-6 bg-gray-100 font-sans">
            <header className="mb-8">
                <h1 className="text-4xl font-extrabold text-gray-800">Panduan Operasional Sibiomasi</h1>
                <p className="text-lg text-gray-500 mt-2">Panduan lengkap untuk memulai dan menjalankan operasional klinik Anda.</p>
            </header>

            <Section title="Memahami Peran Pengguna" icon={<Users2 size={24}/>}>
                <p>Setiap pengguna memiliki peran yang berbeda dengan hak akses ke modul tertentu. Berikut adalah rinciannya:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    <RoleCard 
                        role="Manajemen"
                        description="Memiliki akses penuh ke seluruh sistem untuk pemantauan, pengelolaan, dan pengambilan keputusan strategis."
                        modules={['Semua Modul Termasuk Laporan Keuangan, Penggajian, dan Pengaturan Sistem']}
                    />
                    <RoleCard 
                        role="Dokter / Dokter Ahli"
                        description="Fokus pada manajemen pasien, jadwal konsultasi, dan analisis data medis."
                        modules={['Manajemen Pasien', 'Jadwal Konsultasi', 'Laboratorium', 'Tim Ahli Pusat', 'Program Lifestyle', 'Terapi HBOT']}
                    />
                    <RoleCard 
                        role="Staf Operasional"
                        description="Bertugas untuk operasional harian klinik, termasuk pendaftaran, kasir, dan administrasi."
                        modules={['Kasir', 'Manajemen Pasien', 'Jadwal Konsultasi', 'Manajemen Staf & Cabang', 'Laporan Keuangan', 'Pengaturan']}
                    />
                     <RoleCard 
                        role="Perawat"
                        description="Membantu dokter dalam manajemen pasien dan pelaksanaan program terapi."
                        modules={['Manajemen Pasien', 'Jadwal Konsultasi', 'Laboratorium', 'Program Lifestyle', 'Terapi HBOT']}
                    />
                    <RoleCard 
                        role="Pasien"
                        description="Akses terbatas untuk melihat data pribadi, jadwal, dan riwayat kesehatan mereka."
                        modules={['Dasbor Pasien (Jadwal, Hasil Lab, Riwayat Transaksi)', 'Edit Profil']}
                    />
                </div>
            </Section>

            <Section title="Alur Kerja: Memulai Operasional Klinik" icon={<Truck size={24}/>}>
                <p className="text-md mb-6">Ikuti langkah-langkah berikut untuk menyiapkan dan memulai operasional harian klinik Anda dari awal.</p>
                <div className="space-y-6">
                    <Step number="1" title="Input Data Master">
                        <p>Sebelum memulai transaksi, pastikan semua data dasar telah diinput.</p>
                        <ul className="list-disc list-inside mt-2 space-y-1">
                            <li><strong>Tambah Staf & Dokter:</strong> Buka modul <strong>Manajemen Staf</strong>, klik "Tambah Karyawan", dan isi data untuk setiap peran (manajemen, dokter, staf, perawat).</li>
                            <li><strong>Tambah Layanan:</strong> Buka modul <strong>Manajemen Layanan</strong>, klik "Tambah Layanan", dan masukkan semua layanan yang disediakan klinik beserta harganya.</li>
                            <li><strong>Tambah Produk:</strong> Buka modul <strong>Manajemen Inventaris</strong>, klik "Tambah Item", dan masukkan semua produk fisik yang dijual beserta stok awal dan harganya.</li>
                        </ul>
                    </Step>
                    <Step number="2" title="Pendaftaran Pasien & Janji Temu">
                        <p>Setelah data master siap, Anda dapat mulai mendaftarkan pasien.</p>
                        <ul className="list-disc list-inside mt-2 space-y-1">
                            <li><strong>Daftarkan Pasien Baru:</strong> Buka modul <strong>Manajemen Pasien</strong>, klik "Tambah Pasien", dan isi data lengkap pasien.</li>
                            <li><strong>Buat Janji Temu:</strong> Buka modul <strong>Jadwal Konsultasi</strong>, klik "Tambah Jadwal", lalu pilih pasien, dokter, layanan, serta tanggal dan waktu konsultasi.</li>
                        </ul>
                    </Step>
                    <Step number="3" title="Proses Transaksi di Kasir">
                        <p>Ketika pasien selesai melakukan konsultasi atau membeli produk, proses pembayarannya melalui kasir.</p>
                         <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Buka modul <strong>Kasir</strong>.</li>
                            <li>Pilih nama pasien dari daftar dropdown.</li>
                            <li>Cari dan tambahkan layanan atau produk yang dibeli pasien ke keranjang.</li>
                            <li>Pilih metode pembayaran (QRIS, Tunai, dll.), lalu klik <strong>"Proses Pembayaran"</strong>. Struk akan muncul dan siap dicetak.</li>
                        </ul>
                    </Step>
                     <Step number="4" title="Pemantauan & Laporan">
                        <p>Gunakan dasbor dan modul laporan untuk memantau kinerja klinik.</p>
                         <ul className="list-disc list-inside mt-2 space-y-1">
                            <li><strong>Dashboard:</strong> Lihat ringkasan pendapatan, jumlah pasien, dan jadwal mendatang secara real-time.</li>
                            <li><strong>Laporan Keuangan:</strong> Analisis Laba Rugi, Neraca, dan Arus Kas secara mendalam. Filter berdasarkan cabang dan tanggal untuk mendapatkan wawasan spesifik.</li>
                        </ul>
                    </Step>
                </div>
            </Section>

            <Section title="Panduan Cepat per Modul" icon={<BookCopy size={24}/>}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-bold text-indigo-700">Manajemen Pasien</h4>
                        <p className="text-sm text-gray-600">Gunakan modul ini untuk menambah, mengedit, atau menghapus data pasien. Anda juga dapat mengelola dokumen pasien (seperti hasil lab eksternal) dengan mengklik ikon dokumen.</p>
                    </div>
                     <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-bold text-indigo-700">Kasir</h4>
                        <p className="text-sm text-gray-600">Pilih pasien, lalu tambahkan item (produk/layanan) ke keranjang. Sistem akan otomatis menghitung total beserta pajak. Setelah pembayaran, stok produk akan berkurang secara otomatis.</p>
                    </div>
                     <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-bold text-indigo-700">Jadwal Konsultasi</h4>
                        <p className="text-sm text-gray-600">Atur semua janji temu di sini. Anda dapat memfilter jadwal berdasarkan tanggal, status, atau cabang. Klik tombol "Edit" untuk mengubah status janji temu (misal, dari 'pending' menjadi 'confirmed').</p>
                    </div>
                     <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-bold text-indigo-700">Laporan Keuangan</h4>
                        <p className="text-sm text-gray-600">Modul ini secara otomatis menarik data dari transaksi kasir dan biaya operasional untuk menghasilkan laporan keuangan standar (Laba Rugi, Neraca, Arus Kas). Gunakan filter untuk analisis yang lebih spesifik.</p>
                    </div>
                </div>
            </Section>
        </div>
    );
};

// --- [BARU] Komponen Modul Pengaturan ---
const SettingsModule = ({ showModal }) => {
    // General Settings State
    const [settings, setSettings] = useState({ clinicName: '', logoUrl: '', paymentAccountNumber: '' });
    const [logoFile, setLogoFile] = useState(null);
    
    // Admin Profile State
    const [adminProfile, setAdminProfile] = useState({ name: '', address: '', phone: '', photoUrl: '' });
    const [adminPhotoFile, setAdminPhotoFile] = useState(null);

    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const settingsDocRef = doc(db, 'app_settings', 'general');
    const adminProfileDocRef = doc(db, 'app_settings', 'admin_profile');

    // Fetch all settings on mount
    useEffect(() => {
        const fetchAllSettings = async () => {
            setLoading(true);
            try {
                const settingsSnap = await getDoc(settingsDocRef);
                if (settingsSnap.exists()) {
                    setSettings(settingsSnap.data());
                }
                const adminSnap = await getDoc(adminProfileDocRef);
                if (adminSnap.exists()) {
                    setAdminProfile(adminSnap.data());
                }
            } catch (error) {
                console.error("Error fetching settings:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAllSettings();
    }, []);

    // Handler for general logo change
    const handleLogoFileChange = (e) => {
        if (e.target.files[0]) {
            const file = e.target.files[0];
            setLogoFile(file);
            setSettings(prev => ({ ...prev, logoUrl: URL.createObjectURL(file) }));
        }
    };
    
    // Handler for admin photo change
    const handleAdminPhotoFileChange = (e) => {
        if (e.target.files[0]) {
            const file = e.target.files[0];
            setAdminPhotoFile(file);
            setAdminProfile(prev => ({ ...prev, photoUrl: URL.createObjectURL(file) }));
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            // Save general settings
            let updatedSettings = { ...settings };
            if (logoFile) {
                const logoStorageRef = ref(storage, `branding/logo-${Date.now()}-${logoFile.name}`);
                await uploadBytes(logoStorageRef, logoFile);
                updatedSettings.logoUrl = await getDownloadURL(logoStorageRef);
            }
            await setDoc(settingsDocRef, updatedSettings, { merge: true });

            // Save admin profile settings
            let updatedAdminProfile = { ...adminProfile };
            if (adminPhotoFile) {
                const adminPhotoStorageRef = ref(storage, `admin/profile-${Date.now()}-${adminPhotoFile.name}`);
                await uploadBytes(adminPhotoStorageRef, adminPhotoFile);
                updatedAdminProfile.photoUrl = await getDownloadURL(adminPhotoStorageRef);
            }
            await setDoc(adminProfileDocRef, updatedAdminProfile, { merge: true });

            setLogoFile(null);
            setAdminPhotoFile(null);
            showModal({ title: 'Sukses', children: <p>Pengaturan berhasil disimpan.</p> });
        } catch (error) {
            console.error("Error saving settings:", error);
            showModal({ title: 'Error', children: <p>Gagal menyimpan pengaturan.</p> });
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) return <div className="p-6"><Loader2 className="animate-spin text-indigo-500 h-8 w-8" /></div>;

    return (
        <div className="p-6 bg-white rounded-lg shadow">
            <h2 className="text-2xl font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-700 p-4 rounded-lg shadow-md mb-6">Pengaturan Aplikasi</h2>
            <form onSubmit={handleSave} className="space-y-12">
                {/* Section 1: Branding */}
                <div className="p-6 border rounded-lg bg-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Branding & Umum</h3>
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Klinik / Judul Aplikasi</label>
                            <input type="text" value={settings.clinicName || ''} onChange={(e) => setSettings(prev => ({ ...prev, clinicName: e.target.value }))} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Logo Aplikasi</label>
                            <div className="mt-2 flex items-center gap-4">
                                <img src={settings.logoUrl || 'https://via.placeholder.com/150'} alt="Logo preview" className="h-20 w-20 rounded-full object-cover bg-gray-100 border"/>
                                <label htmlFor="logo-upload" className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">
                                    <span>Ganti Logo</span>
                                    <input id="logo-upload" name="logo-upload" type="file" className="sr-only" onChange={handleLogoFileChange} accept="image/*"/>
                                </label>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nomor Rekening Pembayaran (Kasir)</label>
                            <input type="text" value={settings.paymentAccountNumber || ''} onChange={(e) => setSettings(prev => ({ ...prev, paymentAccountNumber: e.target.value }))} placeholder="Contoh: BCA 1234567890 a/n Klinik" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"/>
                        </div>
                    </div>
                </div>

                {/* Section 2: Admin Profile */}
                <div className="p-6 border rounded-lg bg-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Profil Admin Penanggung Jawab</h3>
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Foto Profil Admin</label>
                            <div className="mt-2 flex items-center gap-4">
                                <img src={adminProfile.photoUrl || 'https://via.placeholder.com/150'} alt="Admin profile preview" className="h-20 w-20 rounded-full object-cover bg-gray-100 border"/>
                                <label htmlFor="admin-photo-upload" className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">
                                    <span>Ganti Foto</span>
                                    <input id="admin-photo-upload" name="admin-photo-upload" type="file" className="sr-only" onChange={handleAdminPhotoFileChange} accept="image/*"/>
                                </label>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Admin</label>
                            <input type="text" value={adminProfile.name || ''} onChange={(e) => setAdminProfile(prev => ({ ...prev, name: e.target.value }))} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">No. Telepon Admin</label>
                            <input type="tel" value={adminProfile.phone || ''} onChange={(e) => setAdminProfile(prev => ({ ...prev, phone: e.target.value }))} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Alamat Admin</label>
                            <textarea value={adminProfile.address || ''} onChange={(e) => setAdminProfile(prev => ({ ...prev, address: e.target.value }))} rows="2" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-start pt-4">
                    <button type="submit" disabled={isSaving} className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 disabled:bg-indigo-400 flex items-center">
                        {isSaving && <Loader2 className="animate-spin mr-2" />}
                        {isSaving ? 'Menyimpan...' : 'Simpan Semua Pengaturan'}
                    </button>
                </div>
            </form>
        </div>
    );
};

// --- [BARU] Komponen Manajemen Inventaris Terpusat ---
const CentralInventoryManagement = ({ inventory, branches, db, showModal, hideModal }) => {
    const [showTransferForm, setShowTransferForm] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [addItemForm, setAddItemForm] = useState({ name: '', stock: 0, price: 0, supplier: '', branchId: ''});
    const [transferData, setTransferData] = useState({
        itemId: '',
        fromBranchId: '',
        toBranchId: '',
        quantity: 0
    });
    const [transferItemName, setTransferItemName] = useState('');
    const [transferLoading, setTransferLoading] = useState(false);
    const [addLoading, setAddLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [detailViewItem, setDetailViewItem] = useState(null);

    const getBranchName = (branchId) => branches.find(b => b.id === branchId)?.name || 'Pusat';

    const aggregatedInventory = useMemo(() => {
        const aggregation = {};
        inventory.forEach(item => {
            if (!item.name) return; // Skip items with no name
            if (!aggregation[item.name]) {
                aggregation[item.name] = {
                    name: item.name,
                    totalStock: 0,
                    price: item.price,
                    supplier: item.supplier,
                    id: item.id
                };
            }
            aggregation[item.name].totalStock += (item.stock || 0);
        });
        return Object.values(aggregation);
    }, [inventory]);

    const handleOpenTransfer = (item) => {
        setTransferItemName(item.name);
        setTransferData({
            itemId: '',
            fromBranchId: '',
            toBranchId: '',
            quantity: 0
        });
        setShowTransferForm(true);
    };

    const handleTransfer = async (e) => {
        e.preventDefault();
        setTransferLoading(true);
        try {
            const transferQuantity = Number(transferData.quantity);
            const fromItem = inventory.find(i => i.id === transferData.itemId);

            if (!fromItem || (fromItem.stock || 0) < transferQuantity) {
                showModal({
                    title: 'Peringatan',
                    children: <p>Stok tidak mencukupi atau item tidak ditemukan.</p>,
                    footer: <button onClick={hideModal} className="bg-red-600 text-white px-4 py-2 rounded-md">Tutup</button>
                });
                setTransferLoading(false);
                return;
            }

            // Update stok cabang asal
            await updateDoc(doc(db, 'inventory', fromItem.id), {
                stock: (fromItem.stock || 0) - transferQuantity
            });

            // Update atau tambahkan stok di cabang tujuan
            const toBranchItem = inventory.find(
                i => i.name === fromItem.name && i.branchId === transferData.toBranchId
            );

            if (toBranchItem) {
                await updateDoc(doc(db, 'inventory', toBranchItem.id), {
                    stock: (toBranchItem.stock || 0) + transferQuantity
                });
            } else {
                await addDoc(collection(db, 'inventory'), {
                    name: fromItem.name,
                    stock: transferQuantity,
                    price: fromItem.price,
                    branchId: transferData.toBranchId,
                    supplier: fromItem.supplier,
                });
            }

            setShowTransferForm(false);
            showModal({
                title: 'Sukses',
                children: <p>Transfer stok berhasil dilakukan.</p>,
                footer: <button onClick={hideModal} className="bg-indigo-600 text-white px-4 py-2 rounded-md">OK</button>
            });
        } catch (error) {
            console.error("Gagal melakukan transfer stok:", error);
            showModal({
                title: 'Error',
                children: <p>Terjadi kesalahan saat transfer. Silakan coba lagi.</p>,
                footer: <button onClick={hideModal} className="bg-red-600 text-white px-4 py-2 rounded-md">Tutup</button>
            });
        } finally {
            setTransferLoading(false);
        }
    };

    const handleAddOrUpdateItem = async (e) => {
        e.preventDefault();
        setAddLoading(true);
        try {
            if (editingItem) {
                await updateDoc(doc(db, 'inventory', editingItem.id), {
                    name: addItemForm.name,
                    stock: Number(addItemForm.stock),
                    price: Number(addItemForm.price),
                    supplier: addItemForm.supplier,
                    branchId: addItemForm.branchId
                });
            } else {
                await addDoc(collection(db, 'inventory'), {
                    name: addItemForm.name,
                    stock: Number(addItemForm.stock),
                    price: Number(addItemForm.price),
                    supplier: addItemForm.supplier,
                    branchId: addItemForm.branchId
                });
            }
            resetAddForm();
        } catch (error) {
            console.error("Error saving inventory item:", error);
        } finally {
            setAddLoading(false);
        }
    };

    const handleEditItem = (item) => {
        setEditingItem(item);
        setAddItemForm({
            name: item.name,
            stock: item.stock,
            price: item.price,
            supplier: item.supplier,
            branchId: item.branchId
        });
        setShowAddForm(true);
    };

    const handleDeleteItem = (item) => {
        showModal({
            title: 'Konfirmasi Hapus Item',
            children: <p>Apakah Anda yakin ingin menghapus item '{item.name}' dari cabang '{getBranchName(item.branchId)}'?</p>,
            footer: (
                <>
                    <button onClick={hideModal} className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-400">Batal</button>
                    <button
                        onClick={async () => {
                            try {
                                await deleteDoc(doc(db, "inventory", item.id));
                                hideModal();
                            } catch (error) {
                                console.error("Error deleting item:", error);
                                hideModal();
                                showModal({
                                    title: 'Error',
                                    children: <p>Gagal menghapus item.</p>,
                                    footer: <button onClick={hideModal} className="bg-red-600 text-white px-4 py-2 rounded-md">Tutup</button>
                                });
                            }
                        }}
                        className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                    >
                        Hapus
                    </button>
                </>
            )
        });
    };

    const resetAddForm = () => {
        setAddItemForm({ name: '', stock: 0, price: 0, supplier: '', branchId: ''});
        setEditingItem(null);
        setShowAddForm(false);
    };

    const filteredAggregatedInventory = aggregatedInventory.filter(item =>
        item.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredDetailedInventory = inventory.filter(item =>
        item.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-700 p-4 rounded-lg shadow-md mb-6">Manajemen Inventaris Terpusat</h2>
            <div className="flex justify-end mb-6">
                <button onClick={() => setShowAddForm(true)} className="bg-indigo-600 text-white px-3 py-2 text-sm sm:px-4 rounded-md hover:bg-indigo-700 flex items-center">
                    <PlusCircle size={18} className="mr-2"/> Tambah Item
                </button>
            </div>
            <div className="bg-white p-4 rounded-lg shadow mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input type="text" placeholder="Cari nama item..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md"/>
                </div>
            </div>

            {/* Global Stock View */}
            <h3 className="text-xl font-bold text-white bg-gradient-to-r from-teal-500 to-cyan-600 p-3 rounded-lg shadow-md mb-4">Ringkasan Stok Global</h3>
            <div className="bg-white rounded-lg shadow overflow-x-auto mb-8">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-teal-200">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Nama Item</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Total Stok</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Harga/Unit</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Supplier</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredAggregatedInventory.map((item, index) => (
                            <tr key={index}>
                                <td className="px-6 py-4 whitespace-nowrap">{item.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{item.totalStock}</td>
                                <td className="px-6 py-4 whitespace-nowrap">Rp {item.price.toLocaleString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{item.supplier}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Rincian Stok Per Cabang */}
            <h3 className="text-xl font-bold text-white bg-gradient-to-r from-teal-500 to-cyan-600 p-3 rounded-lg shadow-md mb-4">Rincian Stok per Cabang</h3>
            <div className="bg-white rounded-lg shadow overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-teal-200">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Nama Item</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Cabang</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Stok</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredDetailedInventory.map(item => (
                            <tr key={item.id}>
                                <td className="px-6 py-4 whitespace-nowrap">{item.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{getBranchName(item.branchId)}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{item.stock}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <button onClick={() => handleEditItem(item)} className="text-indigo-600 hover:text-indigo-900 mr-3"><Edit size={16}/></button>
                                    <button onClick={() => handleDeleteItem(item)} className="text-red-600 hover:text-red-900"><Trash2 size={16}/></button>
                                    <button onClick={() => handleOpenTransfer(item)} className="text-green-600 hover:text-green-900 ml-3"><Truck size={16}/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal Transfer Stok */}
            {showTransferForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Transfer Stok: {transferItemName}</h3>
                            <button onClick={() => setShowTransferForm(false)} className="text-gray-500 hover:text-gray-900"><X/></button>
                        </div>
                        <form onSubmit={handleTransfer} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Cabang Asal</label>
                                <select value={transferData.fromBranchId} onChange={e => setTransferData({...transferData, fromBranchId: e.target.value, itemId: inventory.find(i => i.branchId === e.target.value && i.name === transferItemName)?.id || ''})} className="mt-1 block w-full rounded-md" required>
                                    <option value="">Pilih Cabang</option>
                                    {inventory.filter(i => i.name === transferItemName).map(i => (
                                        <option key={i.id} value={i.branchId}>{getBranchName(i.branchId)} (Stok: {i.stock})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Cabang Tujuan</label>
                                <select value={transferData.toBranchId} onChange={e => setTransferData({...transferData, toBranchId: e.target.value})} className="mt-1 block w-full rounded-md" required>
                                    <option value="">Pilih Cabang</option>
                                    {branches.filter(b => b.id !== transferData.fromBranchId).map(b => (
                                        <option key={b.id} value={b.id}>{b.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Jumlah Transfer</label>
                                <input type="number" value={transferData.quantity} onChange={e => setTransferData({...transferData, quantity: e.target.value})} className="mt-1 block w-full rounded-md" min="1" max={transferData.itemId ? inventory.find(i => i.id === transferData.itemId)?.stock : 0} required />
                            </div>
                            <div className="flex justify-end space-x-2">
                                <button type="button" onClick={() => setShowTransferForm(false)} className="bg-gray-500 text-white px-4 py-2 rounded-md">Batal</button>
                                <button type="submit" disabled={transferLoading} className="bg-indigo-600 text-white px-4 py-2 rounded-md disabled:bg-indigo-400">
                                    {transferLoading ? <Loader2 className="animate-spin"/> : 'Transfer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Modal Tambah/Edit Item */}
            {showAddForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">{editingItem ? 'Edit Item Inventaris' : 'Tambah Item Baru'}</h3>
                            <button onClick={resetAddForm} className="text-gray-500 hover:text-gray-900"><X/></button>
                        </div>
                        <form onSubmit={handleAddOrUpdateItem} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Nama Item</label>
                                    <input type="text" value={addItemForm.name} onChange={e => setAddItemForm({...addItemForm, name: e.target.value})} className="mt-1 block w-full rounded-md" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Jumlah Stok</label>
                                    <input type="number" value={addItemForm.stock} onChange={e => setAddItemForm({...addItemForm, stock: e.target.value})} className="mt-1 block w-full rounded-md" min="0" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Harga/Unit (Rp)</label>
                                    <input type="number" value={addItemForm.price} onChange={e => setAddItemForm({...addItemForm, price: e.target.value})} className="mt-1 block w-full rounded-md" min="0" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Supplier</label>
                                    <input type="text" value={addItemForm.supplier} onChange={e => setAddItemForm({...addItemForm, supplier: e.target.value})} className="mt-1 block w-full rounded-md" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Cabang</label>
                                    <select value={addItemForm.branchId} onChange={e => setAddItemForm({...addItemForm, branchId: e.target.value})} className="mt-1 block w-full rounded-md" required>
                                        <option value="">Pilih Cabang</option>
                                        {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end space-x-2 mt-4">
                                <button type="button" onClick={resetAddForm} className="bg-gray-500 text-white px-4 py-2 rounded-md">Batal</button>
                                <button type="submit" disabled={addLoading} className="bg-indigo-600 text-white px-4 py-2 rounded-md disabled:bg-indigo-400">
                                    {addLoading ? <Loader2 className="animate-spin"/> : 'Simpan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};


// --- [BARU] Komponen Rekam Medis (SOAP) ---
const MedicalRecordManagement = ({ users, medicalRecords, currentUser, branches, showModal, hideModal }) => {
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [patientRecords, setPatientRecords] = useState([]);
    const [showNewRecordForm, setShowNewRecordForm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newRecordData, setNewRecordData] = useState({
        subjective: '',
        objective: '',
        assessment: '',
        plan: ''
    });
    const [searchTerm, setSearchTerm] = useState('');

    const patients = useMemo(() => users.filter(u => u.role?.toLowerCase() === 'pasien'), [users]);
    const filteredPatients = useMemo(() => {
        if (!searchTerm) return patients;
        return patients.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [patients, searchTerm]);

    const handleSelectPatient = (patient) => {
        setSelectedPatient(patient);
        const records = medicalRecords
            .filter(r => r.patientId === patient.id)
            .sort((a, b) => new Date(b.date) - new Date(a.date));
        setPatientRecords(records);
        setShowNewRecordForm(false); // Hide form when switching patients
    };

    const resetNewRecordForm = () => {
        setNewRecordData({ subjective: '', objective: '', assessment: '', plan: '' });
        setShowNewRecordForm(false);
    };

    const handleSubmitNewRecord = async (e) => {
        e.preventDefault();
        if (!selectedPatient) return;
        setIsSubmitting(true);
        try {
            await addDoc(collection(db, 'medicalRecords'), {
                ...newRecordData,
                patientId: selectedPatient.id,
                practitionerId: currentUser.id,
                practitionerName: currentUser.name,
                branchId: currentUser.branchId || null,
                date: new Date().toISOString().slice(0, 10),
                createdAt: serverTimestamp()
            });
            resetNewRecordForm();
            showModal({ title: 'Sukses', children: <p>Rekam medis baru berhasil disimpan.</p> });
        } catch (error) {
            console.error("Error saving medical record:", error);
            showModal({ title: 'Error', children: <p>Gagal menyimpan rekam medis.</p> });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const getDoctorName = (doctorId) => users.find(u => u.id === doctorId)?.name || 'N/A';
    const getBranchName = (branchId) => branches.find(b => b.id === branchId)?.name || 'Pusat';

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <h2 className="text-2xl font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-700 p-4 rounded-lg shadow-md mb-6">Rekam Medis Elektronik (SOAP)</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Patient List */}
                <div className="lg:col-span-1 bg-white p-4 rounded-lg shadow-md">
                    <h3 className="text-lg font-bold mb-4">Daftar Pasien</h3>
                    <div className="relative mb-4">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Cari pasien..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded-md"
                        />
                    </div>
                    <div className="max-h-[60vh] overflow-y-auto">
                        {filteredPatients.map(p => (
                            <div
                                key={p.id}
                                onClick={() => handleSelectPatient(p)}
                                className={`p-3 rounded-md cursor-pointer ${selectedPatient?.id === p.id ? 'bg-indigo-100' : 'hover:bg-gray-50'}`}
                            >
                                <p className="font-semibold">{p.name}</p>
                                <p className="text-sm text-gray-500">{p.phone || p.email}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Medical Record Details */}
                <div className="lg:col-span-2">
                    {selectedPatient ? (
                        <div className="bg-white p-6 rounded-lg shadow-md">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800">{selectedPatient.name}</h3>
                                    <p className="text-gray-500">Riwayat Rekam Medis</p>
                                </div>
                                <button
                                    onClick={() => setShowNewRecordForm(true)}
                                    className="bg-indigo-600 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-indigo-700"
                                >
                                    <PlusCircle size={18} /> Buat Catatan Baru
                                </button>
                            </div>

                            {/* New Record Form */}
                            {showNewRecordForm && (
                                <form onSubmit={handleSubmitNewRecord} className="mb-8 p-4 border rounded-lg bg-gray-50 space-y-4">
                                    <h4 className="text-lg font-semibold">Catatan SOAP Baru</h4>
                                    <div>
                                        <label className="font-semibold text-gray-700">S (Subjective)</label>
                                        <textarea value={newRecordData.subjective} onChange={e => setNewRecordData({...newRecordData, subjective: e.target.value})} rows="3" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" placeholder="Keluhan pasien, riwayat penyakit..."></textarea>
                                    </div>
                                    <div>
                                        <label className="font-semibold text-gray-700">O (Objective)</label>
                                        <textarea value={newRecordData.objective} onChange={e => setNewRecordData({...newRecordData, objective: e.target.value})} rows="3" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" placeholder="Hasil pemeriksaan fisik, tanda vital, hasil lab relevan..."></textarea>
                                    </div>
                                    <div>
                                        <label className="font-semibold text-gray-700">A (Assessment)</label>
                                        <textarea value={newRecordData.assessment} onChange={e => setNewRecordData({...newRecordData, assessment: e.target.value})} rows="2" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" placeholder="Diagnosis kerja atau masalah..."></textarea>
                                    </div>
                                    <div>
                                        <label className="font-semibold text-gray-700">P (Plan)</label>
                                        <textarea value={newRecordData.plan} onChange={e => setNewRecordData({...newRecordData, plan: e.target.value})} rows="3" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" placeholder="Rencana terapi, resep, edukasi, rujukan..."></textarea>
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <button type="button" onClick={resetNewRecordForm} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md">Batal</button>
                                        <button type="submit" disabled={isSubmitting} className="bg-green-600 text-white px-4 py-2 rounded-md disabled:bg-green-400">
                                            {isSubmitting ? <Loader2 className="animate-spin"/> : 'Simpan Catatan'}
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* Past Records */}
                            <div className="space-y-6">
                                {patientRecords.length > 0 ? patientRecords.map(rec => (
                                    <div key={rec.id} className="border-b pb-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <p className="font-bold">{rec.date}</p>
                                            <p className="text-sm text-gray-500">Oleh: Dr. {rec.practitionerName || getDoctorName(rec.practitionerId)}</p>
                                        </div>
                                        <div className="space-y-2 text-sm">
                                            <p><strong className="text-blue-600">S:</strong> {rec.subjective}</p>
                                            <p><strong className="text-blue-600">O:</strong> {rec.objective}</p>
                                            <p><strong className="text-blue-600">A:</strong> {rec.assessment}</p>
                                            <p><strong className="text-blue-600">P:</strong> {rec.plan}</p>
                                        </div>
                                    </div>
                                )) : (
                                    <p className="text-center text-gray-500 italic py-8">Belum ada rekam medis untuk pasien ini.</p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full bg-white p-6 rounded-lg shadow-md">
                            <p className="text-gray-500 text-lg">Pilih seorang pasien dari daftar untuk melihat rekam medisnya.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};


// --- Komponen Utama Aplikasi ---
export default function App() {
    // --- [CUSTOM CSS FOR RESPONSIVE TABLES] ---
    const responsiveTableStyle = `
      @media (max-width: 768px) {
        .responsive-table thead {
          display: none;
        }
        .responsive-table tr {
          display: block;
          margin-bottom: 1rem;
          border: 1px solid #e2e8f0;
          border-radius: 0.5rem;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
        }
        .responsive-table td {
          display: block;
          text-align: right;
          border-bottom: 1px solid #edf2f7;
          position: relative;
          padding-left: 50%;
        }
        .responsive-table td:last-child {
          border-bottom: 0;
        }
        .responsive-table td:before {
          content: attr(data-label);
          position: absolute;
          left: 0;
          width: 45%;
          padding-left: 0.75rem;
          font-weight: 600;
          text-align: left;
          white-space: nowrap;
        }
      }
    `;

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('dark');
    }, []);

    const [currentUser, setCurrentUser] = useState(null);
    const [firebaseUser, setFirebaseUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [scriptsReady, setScriptsReady] = useState(false);
    const [users, setUsers] = useState([]);
    const [branches, setBranches] = useState([]);
    const [payments, setPayments] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [services, setServices] = useState([]); // <-- State baru untuk layanan
    const [labResults, setLabResults] = useState([]);
    const [medicalRecords, setMedicalRecords] = useState([]);
    const [expertConsultations, setExpertConsultations] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [lifestylePrograms, setLifestylePrograms] = useState([]);
    const [hbotSessions, setHbotSessions] = useState([]);
    const [attendance, setAttendance] = useState([]);
    const [salaryStructures, setSalaryStructures] = useState([]);
    const [payrollHistory, setPayrollHistory] = useState([]);
    const [modal, setModal] = useState({ show: false, title: '', children: null, footer: null });
    const [appSettings, setAppSettings] = useState({
        clinicName: 'Sistem Klinik Sibiomasi',
        logoUrl: 'https://astinhomeliving.com/wp-content/uploads/2025/08/logo-sibiomasi.jpg',
        paymentAccountNumber: ''
    });
    const [adminProfile, setAdminProfile] = useState({ name: 'Admin', photoUrl: '', address: '', phone: '' });

    const showModal = (config) => setModal({ ...config, show: true });
    const hideModal = () => setModal({ show: false, title: '', children: null, footer: null });

    const managementIframeRef = useRef(null);

    // Listener untuk App Settings & Admin Profile
    useEffect(() => {
        const settingsDocRef = doc(db, 'app_settings', 'general');
        const adminProfileDocRef = doc(db, 'app_settings', 'admin_profile');

        const unsubSettings = onSnapshot(settingsDocRef, (doc) => {
            if (doc.exists()) {
                setAppSettings(doc.data());
            }
        });
        
        const unsubAdmin = onSnapshot(adminProfileDocRef, (doc) => {
            if (doc.exists()) {
                setAdminProfile(doc.data());
            }
        });

        return () => {
            unsubSettings();
            unsubAdmin();
        };
    }, []);

    const handleLogout = async () => {
        if (auth.currentUser) {
            const userStatusRef = doc(db, 'users', auth.currentUser.uid);
            try {
                await updateDoc(userStatusRef, { status: 'offline', last_seen: serverTimestamp() });
            } catch (error) {
                console.error("Error setting user status to offline:", error);
            }
        }
        await signOut(auth);
    };

    // Efek untuk memuat skrip eksternal untuk ekspor secara sekuensial
    useEffect(() => {
        const scriptsToLoad = [
            'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
            'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
            'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js',
            'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
        ];

        const loadScript = (index) => {
            if (index >= scriptsToLoad.length) {
                setScriptsReady(true);
                return;
            }
            
            const src = scriptsToLoad[index];
            if (document.querySelector(`script[src="${src}"]`)) {
                loadScript(index + 1); // Already loaded, move to next
                return;
            }

            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            script.onload = () => loadScript(index + 1);
            script.onerror = () => {
                console.error(`Failed to load script: ${src}`);
                // Optionally, handle the error, e.g., by not setting scriptsReady to true
            };
            document.body.appendChild(script);
        };

        loadScript(0);
    }, []);

    // Listener untuk status autentikasi & data Firestore
    useEffect(() => {
        let presenceInterval = null;
        let dataUnsubscribers = [];

        const cleanup = () => {
            if (presenceInterval) clearInterval(presenceInterval);
            dataUnsubscribers.forEach(unsub => unsub());
            dataUnsubscribers = [];
        };

        const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
            cleanup(); // Bersihkan listener lama setiap kali status auth berubah

            if (user) {
                setLoading(true);
                const userDocRef = doc(db, 'users', user.uid);

                try {
                    // 1. Ambil profil pengguna terlebih dahulu untuk mendapatkan peran
                    const userDocSnap = await getDoc(userDocRef);
                    if (!userDocSnap.exists()) {
                        console.error("User profile not found in Firestore. Logging out.");
                        handleLogout();
                        return;
                    }
                    
                    const userData = userDocSnap.data();
                    const fullCurrentUser = { ...user, ...userData, id: user.uid };
                    setCurrentUser(fullCurrentUser);

                    // 2. Set status online
                    await updateDoc(userDocRef, { status: 'online', last_seen: serverTimestamp() });
                    presenceInterval = setInterval(() => {
                        if (auth.currentUser) {
                            updateDoc(userDocRef, { last_seen: serverTimestamp() }).catch(err => console.error("Failed to update presence:", err));
                        }
                    }, 60000);

                    // 3. Tentukan koleksi yang akan didengarkan berdasarkan peran
                    if (userData.role?.toLowerCase() === 'pasien') {
                        // --- PATIENT-SPECIFIC DATA FETCHING ---
                        const patientId = user.uid;
                        const unsubscribes = [];

                        // Fetch data specific to the patient
                        unsubscribes.push(onSnapshot(query(collection(db, 'appointments'), where('patientId', '==', patientId)), (snap) => setAppointments(snap.docs.map(d => ({ id: d.id, ...d.data() })))));
                        unsubscribes.push(onSnapshot(query(collection(db, 'labResults'), where('patientId', '==', patientId)), (snap) => setLabResults(snap.docs.map(d => ({ id: d.id, ...d.data() })))));
                        unsubscribes.push(onSnapshot(query(collection(db, 'payments'), where('patientId', '==', patientId)), (snap) => setPayments(snap.docs.map(d => ({ id: d.id, ...d.data() })))));
                        unsubscribes.push(onSnapshot(query(collection(db, 'medicalRecords'), where('patientId', '==', patientId)), (snap) => setMedicalRecords(snap.docs.map(d => ({ id: d.id, ...d.data() })))));

                        // Fetch all doctors and staff for name display, plus the current user
                        unsubscribes.push(onSnapshot(query(collection(db, 'users'), where('role', 'in', ['doctor', 'doctor_expert', 'staf_operasional'])), (snap) => {
                            const staffUsers = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                             setUsers([...staffUsers, { ...userData, id: user.uid }]);
                        }));
                        
                        // [FIX] Also fetch services for patients so they can book appointments
                        unsubscribes.push(onSnapshot(collection(db, 'services'), (snap) => setServices(snap.docs.map(d => ({ id: d.id, ...d.data() })))));

                        dataUnsubscribers = unsubscribes;
                    } else {
                        // --- STAFF & MANAGEMENT DATA FETCHING (REFACTORED FOR BRANCH ISOLATION) ---
                        const collectionMap = {
                            users: { setter: setUsers, filter: true },
                            branches: { setter: setBranches, filter: false }, // Global
                            appointments: { setter: setAppointments, filter: true },
                            labResults: { setter: setLabResults, filter: true },
                            attendance: { setter: setAttendance, filter: false }, // Attendance is filtered by userId, not branchId in most views
                            payments: { setter: setPayments, filter: true },
                            expenses: { setter: setExpenses, filter: true },
                            inventory: { setter: setInventory, filter: true },
                            medicalRecords: { setter: setMedicalRecords, filter: true },
                            expertConsultations: { setter: setExpertConsultations, filter: false }, // Global for experts
                            lifestylePrograms: { setter: setLifestylePrograms, filter: true },
                            hbotSessions: { setter: setHbotSessions, filter: true },
                            salaryStructures: { setter: setSalaryStructures, filter: false }, // Global
                            payrollHistory: { setter: setPayrollHistory, filter: false }, // Global
                            services: { setter: setServices, filter: false }, // Global
                        };

                        const isManajemen = userData.role === 'manajemen';
                        const branchId = userData.branchId;

                        Object.entries(collectionMap).forEach(([name, config]) => {
                            let q = collection(db, name);
                            
                            // Apply branch filter if user is not 'manajemen' and the collection is marked for filtering
                            if (!isManajemen && branchId && config.filter) {
                                q = query(q, where('branchId', '==', branchId));
                            }
                            
                            const unsubscribe = onSnapshot(q, 
                                (snapshot) => {
                                    const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
                                    config.setter(data);
                                },
                                (error) => console.error(`Error fetching ${name}:`, error)
                            );
                            dataUnsubscribers.push(unsubscribe);
                        });
                    }
                    
                } catch (error) {
                    console.error("Error during authentication state change:", error);
                    handleLogout();
                } finally {
                    setLoading(false);
                }

            } else {
                // Pengguna logout
                setCurrentUser(null);
                setUsers([]); setBranches([]); setPayments([]); setExpenses([]); setInventory([]); setLabResults([]); setMedicalRecords([]); setExpertConsultations([]); setAppointments([]); setLifestylePrograms([]); setHbotSessions([]); setAttendance([]); setSalaryStructures([]); setPayrollHistory([]);
                setLoading(false);
            }
        });
        
        return () => {
            unsubscribeAuth();
            cleanup();
        };
    }, []);

    const [activeTab, setActiveTab] = useState('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
    const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);


    const ChangePasswordModal = () => {
        const [oldPassword, setOldPassword] = useState('');
        const [newPassword, setNewPassword] = useState('');
        const [confirmPassword, setConfirmPassword] = useState('');
        const [isProcessing, setIsProcessing] = useState(false);

        const handleChangePassword = async (e) => {
            e.preventDefault();
            if (newPassword !== confirmPassword) {
                showModal({ title: 'Error', children: <p>Password baru tidak cocok dengan konfirmasi.</p> });
                return;
            }
            if (newPassword.length < 6) {
                showModal({ title: 'Error', children: <p>Password baru harus terdiri dari minimal 6 karakter.</p> });
                return;
            }

            setIsProcessing(true);
            try {
                const user = auth.currentUser;
                const credential = EmailAuthProvider.credential(user.email, oldPassword);
                
                // Re-authenticate for security
                await reauthenticateWithCredential(user, credential);
                
                // Update password
                await updatePassword(user, newPassword);

                setShowChangePasswordModal(false);
                showModal({ title: 'Sukses', children: <p>Password Anda telah berhasil diubah. Silakan login kembali dengan password baru Anda pada sesi berikutnya.</p> });
            } catch (error) {
                console.error("Error changing password:", error);
                let errorMessage = 'Gagal mengubah password.';
                if (error.code === 'auth/wrong-password') {
                    errorMessage = 'Password lama yang Anda masukkan salah.';
                }
                showModal({ title: 'Error', children: <p>{errorMessage}</p> });
            } finally {
                setIsProcessing(false);
            }
        };

        return (
            <CustomModal show={showChangePasswordModal} onClose={() => setShowChangePasswordModal(false)} title="Ubah Password">
                <form onSubmit={handleChangePassword} className="space-y-4">
                    <div><label>Password Lama</label><input type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} className="mt-1 block w-full rounded-md" required/></div>
                    <div><label>Password Baru</label><input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="mt-1 block w-full rounded-md" required/></div>
                    <div><label>Konfirmasi Password Baru</label><input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="mt-1 block w-full rounded-md" required/></div>
                    <div className="flex justify-end space-x-2 pt-4">
                        <button type="button" onClick={() => setShowChangePasswordModal(false)} className="bg-gray-500 text-white px-4 py-2 rounded-md">Batal</button>
                        <button type="submit" disabled={isProcessing} className="bg-indigo-600 text-white px-4 py-2 rounded-md disabled:bg-indigo-400">
                            {isProcessing ? <Loader2 className="animate-spin"/> : 'Ubah Password'}
                        </button>
                    </div>
                </form>
            </CustomModal>
        );
    };

    const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'from-blue-500 to-indigo-600' },
    { id: 'cashier', label: 'Kasir', icon: DollarSign, color: 'from-green-500 to-teal-600' },
    { id: 'patient', label: 'Manajemen Pasien', icon: Stethoscope, color: 'from-pink-500 to-rose-500' },
    { id: 'medical-record', label: 'Rekam Medis', icon: FileText, color: 'from-cyan-500 to-teal-500' },
    { id: 'doctor', label: 'Manajemen Dokter', icon: UserPlus, color: 'from-sky-400 to-cyan-400' },
    { id: 'users', label: 'Manajemen Staf', icon: Users2, color: 'from-purple-500 to-violet-600' },
    { id: 'branches', label: 'Manajemen Cabang', icon: Building, color: 'from-amber-500 to-orange-600' },
    { id: 'appointments', label: 'Jadwal Konsultasi', icon: Calendar, color: 'from-red-500 to-red-600' },
    { id: 'lifestyle', label: 'Program Lifestyle', icon: HeartPulse, color: 'from-rose-500 to-pink-600' },
    { id: 'hbot', label: 'Terapi HBOT', icon: LifeBuoy, color: 'from-cyan-500 to-blue-500' },
    { id: 'attendance', label: 'Absensi', icon: Camera, color: 'from-gray-500 to-gray-600' },
    { id: 'payroll', label: 'Penggajian', icon: CircleDollarSign, color: 'from-emerald-500 to-green-600' },
    { id: 'reports', label: 'Laporan Keuangan', icon: BarChartHorizontal, color: 'from-indigo-500 to-purple-600' },
    { id: 'laboratory', label: 'Laboratorium', icon: FlaskConical, color: 'from-yellow-400 to-amber-500' },
    { id: 'expert-team', label: 'Tim Ahli Pusat', icon: Stethoscope, color: 'from-fuchsia-500 to-pink-600' },
    { id: 'inventory-management', label: 'Manajemen Inventaris', icon: Package, color: 'from-orange-500 to-red-600' },
    { id: 'service-management', label: 'Manajemen Layanan', icon: BookHeart, color: 'from-pink-500 to-purple-600' },
    { id: 'live-chat', label: 'Live Chat', icon: MessageSquare, color: 'from-teal-400 to-emerald-500' },
    { id: 'compounding', label: 'Tim Peracik Cabang', icon: FlaskConical, color: 'from-lime-500 to-green-600' },
    { id: 'application-guide', label: 'Panduan Aplikasi', icon: BookCopy, color: 'from-cyan-500 to-blue-500' },
    { id: 'settings', label: 'Pengaturan', icon: Settings, color: 'from-slate-500 to-slate-700' }
    ];

    const userRole = currentUser?.role;
    const isManagement = userRole === 'manajemen';

    const filteredMenuItems = useMemo(() => {
        if (isManagement) {
            return menuItems; // Management sees everything
        }

        // Base permissions for all logged-in users, including the application guide
        let allowed = ['dashboard', 'live-chat', 'attendance', 'application-guide'];

        if (userRole === 'doctor' || userRole === 'doctor_expert') {
            allowed.push('patient', 'appointments', 'laboratory', 'expert-team', 'lifestyle', 'hbot', 'medical-record');
        } else if (userRole === 'staf_operasional') {
            allowed.push('cashier', 'patient', 'appointments', 'reports', 'journal', 'lifestyle', 'hbot', 'users', 'branches', 'laboratory', 'settings', 'medical-record');
        } else if (userRole === 'perawat') {
            allowed.push('patient', 'appointments', 'laboratory', 'lifestyle', 'hbot', 'medical-record');
        }

        return menuItems.filter(item => allowed.includes(item.id));
    }, [userRole]);

    useEffect(() => {
        if (!filteredMenuItems.find(item => item.id === activeTab)) {
            setActiveTab(filteredMenuItems[0]?.id || 'dashboard');
        }
    }, [activeTab, filteredMenuItems]);


    const totalUsers = users.length;
    const totalBranches = branches.length;
    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

// --- [BARU] Komponen Dasbor Staf Umum ---
const GenericStaffDashboard = ({ payments, appointments, users, branches }) => {
    const today = new Date().toISOString().slice(0, 10);
    const todayPayments = payments.filter(p => p.date === today);
    const totalTodayRevenue = todayPayments.reduce((sum, p) => sum + p.amount, 0);
    const recentAppointments = appointments.filter(app => new Date(app.date) >= new Date()).sort((a,b) => new Date(`${a.date} ${a.time}`) - new Date(`${b.date} ${b.time}`)).slice(0, 5);
    
    return (
        <div className="p-6 space-y-6">
            <h2 className="text-2xl font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-700 p-4 rounded-lg shadow-md">Ringkasan Dasbor</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <ReportCard title="Pendapatan Hari Ini" value={formatCurrency(totalTodayRevenue)} icon={<DollarSign size={20}/>} color="bg-green-500" />
                <ReportCard title="Total Pasien" value={users.filter(u=>u.role?.toLowerCase() === 'pasien').length} icon={<Users2 size={20}/>} color="bg-blue-500" />
                <ReportCard title="Jadwal Mendatang" value={recentAppointments.length} icon={<Calendar size={20}/>} color="bg-purple-500" />
                <ReportCard title="Total Cabang" value={branches.length} icon={<Building size={20}/>} color="bg-teal-500" />
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-lg">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Jadwal Konsultasi Mendatang</h3>
                <div className="space-y-3 max-h-72 overflow-y-auto">
                    {recentAppointments.length > 0 ? (
                        recentAppointments.map(app => (
                            <div key={app.id} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                <p className="font-semibold">{users.find(u => u.id === app.patientId)?.name}</p>
                                <p className="text-sm text-gray-600">{app.date} pukul {app.time} dengan Dr. {users.find(u => u.id === app.practitionerId)?.name}</p>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-500 italic">Tidak ada jadwal konsultasi mendatang.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

    const renderContent = () => {
        const commonProps = {
            users,
            branches,
            currentUser,
            scriptsReady,
            db,
            showModal,
            hideModal,
        };

        switch (activeTab) {
            case 'dashboard':
                // Role-based dashboards
                if (isManagement) {
                    return <ManagementDashboard 
                                users={users} 
                                branches={branches}
                                payments={payments}
                                expenses={expenses}
                                inventory={inventory}
                                appointments={appointments}
                                attendance={attendance}
                           />;
                }
                if (currentUser.role === 'doctor' || currentUser.role === 'doctor_expert') {
                    return <DoctorDashboard
                                currentUser={currentUser}
                                appointments={appointments}
                                users={users}
                                labResults={labResults}
                           />;
                }
                return <GenericStaffDashboard payments={payments} appointments={appointments} users={users} branches={branches} />;
            case 'cashier':
                return <CashierModule {...commonProps} inventory={inventory} services={services} payments={payments} appSettings={appSettings} />;
            case 'patient':
                return <PatientManagement {...commonProps} />;
            case 'medical-record':
                return <MedicalRecordManagement {...commonProps} medicalRecords={medicalRecords} />;
            case 'doctor':
                return <DoctorManagement {...commonProps} />;
            case 'users':
                return <UserManagement {...commonProps} />;
            case 'branches':
                return <BranchManagement {...commonProps} currentUser={currentUser} />;
            case 'appointments':
            return <AppointmentManagement {...commonProps} appointments={appointments} services={services} />;
            case 'lifestyle':
                return <LifestyleProgramManagement {...commonProps} lifestylePrograms={lifestylePrograms} />;
            case 'hbot':
                return <HBOTManagement {...commonProps} hbotSessions={hbotSessions} />;
            case 'reports':
                return <FinancialManagement {...commonProps} payments={payments} expenses={expenses} inventory={inventory} />;
            case 'laboratory':
                return <LaboratoryManagement {...commonProps} labResults={labResults} />;
            case 'expert-team':
                return <ExpertConsultationModule {...commonProps} medicalRecords={medicalRecords} labResults={labResults} expertConsultations={expertConsultations} />;
            case 'inventory-management':
                return <CentralInventoryManagement {...commonProps} inventory={inventory} />;
            case 'service-management':
                return <ServiceManagement {...commonProps} services={services} />;
            case 'live-chat':
                return <LiveChatModule {...commonProps} />;
            case 'compounding':
                return <CompoundingModule {...commonProps} />;
        case 'application-guide':
            return <ApplicationGuide />;
            case 'attendance':
                return <AttendanceModule {...commonProps} />;
            case 'payroll':
                return <PayrollModule {...commonProps} attendance={attendance} salaryStructures={salaryStructures} payrollHistory={payrollHistory} appSettings={appSettings} />;
            case 'settings':
                return <SettingsModule {...commonProps} />;
            default:
                return <div>Pilih menu</div>;
        }
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    // Tampilkan form login jika tidak ada pengguna yang login
    if (!currentUser) {
        return <LoginForm appSettings={appSettings} />;
    }
    
    // Tampilkan dasbor pasien jika peran pengguna adalah 'pasien'
    if (currentUser && currentUser.role && currentUser.role.toLowerCase() === 'pasien') {
        return (
            <div className="min-h-screen bg-gray-100 font-sans">
                 <PatientHeader 
                    currentUser={currentUser} 
                    handleLogout={handleLogout} 
                    appSettings={appSettings} 
                />
                <PatientDashboard 
                    currentUser={currentUser}
                    appointments={appointments}
                    labResults={labResults}
                    payments={payments}
                    medicalRecords={medicalRecords}
                    users={users}
                    services={services}
                    showModal={showModal}
                    hideModal={hideModal}
                    db={db}
                    storage={storage}
                />
                 <CustomModal
                    show={modal.show}
                    onClose={hideModal}
                    title={modal.title}
                    footer={modal.footer}
                >
                    {modal.children}
                </CustomModal>
            </div>
        );
    }


    // Tampilan default untuk staf, dokter, dan manajemen
    return (
        <div className="flex min-h-screen bg-gray-100 font-sans">
            <style>{responsiveTableStyle}</style>
            {/* Overlay untuk tampilan seluler */}
            <div onClick={toggleSidebar} className={`fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}></div>

            {/* Sidebar */}
            <div className={`fixed inset-y-0 left-0 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 w-64 bg-gradient-to-b from-blue-700 to-indigo-900 text-white p-4 z-50 flex flex-col`}>
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <img src={appSettings.logoUrl} alt="Logo Sibiomasi" className="h-12 w-12 rounded-full shadow-md"/>
                        <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-amber-600">sibiomasi sistem</span>
                    </div>
                    <button onClick={toggleSidebar} className="text-white lg:hidden"><X size={24} /></button>
                </div>
<nav className="flex-1 space-y-2 overflow-y-auto pr-2">
                    {filteredMenuItems.map(item => (
        <button key={item.id} onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }} className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center transition-all duration-200 ${activeTab === item.id ? 'bg-white/20 shadow-inner' : 'text-gray-300 hover:bg-white/10'}`}>
            <div className={`w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-lg mr-3 bg-gradient-to-br ${item.color} text-white shadow-md`} style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.2))' }}>
                <item.icon size={16} />
            </div>
            <span className="font-semibold">{item.label}</span>
                        </button>
                    ))}
                </nav>
                
                {/* Kunjungi Situs Button */}
                <div className="my-4">
                    <a href="https://sibiomasi.com/" target="_blank" rel="noopener noreferrer" className="w-full text-center px-4 py-3 rounded-md flex items-center justify-center transition-colors bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-bold hover:from-yellow-500 hover:to-amber-600 shadow-lg">
                        <ExternalLink size={20} className="mr-3" />
                        <span>Kunjungi Situs</span>
                    </a>
                </div>

                {/* Admin Profile Section */}
                <div className="mt-auto pt-6 border-t border-gray-700">
                    <div className="flex items-center gap-3">
                        <img src={adminProfile.photoUrl || 'https://via.placeholder.com/150'} alt="Admin" className="h-10 w-10 rounded-full object-cover"/>
                        <div>
                            <p className="font-semibold text-sm">{adminProfile.name || 'Nama Admin'}</p>
                            <p className="text-xs text-gray-400">Penanggung Jawab</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-1 overflow-x-hidden">
                <Header currentUser={currentUser} toggleSidebar={toggleSidebar} handleLogout={handleLogout} appSettings={appSettings} setShowChangePasswordModal={setShowChangePasswordModal} branches={branches} />
                <div className="p-2 sm:p-6 lg:p-8">
                    {renderContent()}
                </div>
            </main>

            <ChangePasswordModal />
            <CustomModal
                show={modal.show}
                onClose={hideModal}
                title={modal.title}
                footer={modal.footer}
            >
                {modal.children}
            </CustomModal>
        </div>
    );
};

// --- Komponen Manajemen Pasien ---
const PatientManagement = ({ users, branches, currentUser, showModal, hideModal }) => {
    const [showForm, setShowForm] = useState(false);
    const [editingPatient, setEditingPatient] = useState(null);
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', address: '', dob: '', branchId: '', photoUrl: '' });
    const [photoFile, setPhotoFile] = useState(null);
    const [documentModalPatient, setDocumentModalPatient] = useState(null);
    const [patientDocuments, setPatientDocuments] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);

    const isManagerOrStaf = currentUser?.role === 'manajemen' || currentUser?.role === 'staf_operasional';

    const patientUsers = useMemo(() => users.filter(u => u.role?.toLowerCase() === 'pasien'), [users]);

    const resetForm = () => {
    setFormData({ name: '', email: '', phone: '', address: '', dob: '', branchId: '', photoUrl: '' });
        setEditingPatient(null);
        setShowForm(false);
    setPhotoFile(null);
    };

    const handleEdit = (patient) => {
        setEditingPatient(patient);
        setFormData({
            name: patient.name || '',
            email: patient.email || '',
            phone: patient.phone || '',
            address: patient.address || '',
            dob: patient.dob || '',
        branchId: patient.branchId || '',
        photoUrl: patient.photoUrl || ''
        });
        setShowForm(true);
    setPhotoFile(null);
};

const handlePhotoFileChange = (e) => {
    if (e.target.files[0]) {
        const file = e.target.files[0];
        setPhotoFile(file);
        setFormData(prev => ({ ...prev, photoUrl: URL.createObjectURL(file) }));
    }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
    setIsUploading(true);
        try {
        let photoURL = editingPatient?.photoUrl || '';
        if (photoFile) {
            const storageRef = ref(storage, `user-photos/${Date.now()}-${photoFile.name}`);
            await uploadBytes(storageRef, photoFile);
            photoURL = await getDownloadURL(storageRef);
        }

        const patientData = { 
            ...formData, 
            photoUrl: photoURL, 
            role: 'pasien', 
            branchId: formData.branchId || null 
        };

            if (editingPatient) {
                await updateDoc(doc(db, 'users', editingPatient.id), patientData);
            } else {
                await addDoc(collection(db, 'users'), patientData);
            }
        
            resetForm();
            showModal({
                title: 'Sukses',
                children: <p>Data pasien berhasil disimpan.</p>,
                footer: <button onClick={hideModal} className="bg-indigo-600 text-white px-4 py-2 rounded-md">OK</button>
            });
        } catch (error) {
            console.error("Error saving patient:", error);
            showModal({
                title: 'Error',
                children: <p>Gagal menyimpan data pasien. Silakan coba lagi.</p>,
                footer: <button onClick={hideModal} className="bg-red-600 text-white px-4 py-2 rounded-md">Tutup</button>
            });
    } finally {
        setIsUploading(false);
        }
    };

    const handleDelete = (patientId) => {
        showModal({
            title: 'Konfirmasi Hapus Pasien',
            children: <p>Apakah Anda yakin ingin menghapus data pasien ini? Semua dokumen terkait akan ikut terhapus.</p>,
            footer: (
                <>
                    <button onClick={hideModal} className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-400">Batal</button>
                    <button
                        onClick={async () => {
                            try {
                                // TODO: Delete subcollections if necessary
                                await deleteDoc(doc(db, "users", patientId));
                                hideModal();
                            } catch (error) {
                                console.error("Error deleting patient:", error);
                                hideModal();
                                showModal({
                                    title: 'Error',
                                    children: <p>Gagal menghapus pasien. Silakan coba lagi.</p>,
                                    footer: <button onClick={hideModal} className="bg-red-600 text-white px-4 py-2 rounded-md">Tutup</button>
                                });
                            }
                        }}
                        className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                    >
                        Hapus
                    </button>
                </>
            )
        });
    };

    const openDocumentModal = async (patient) => {
        setDocumentModalPatient(patient);
        const docsRef = collection(db, 'users', patient.id, 'documents');
        const q = query(docsRef, orderBy('uploadedAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setPatientDocuments(docs);
        });
        // Store unsubscribe function to call it on modal close
        setDocumentModalPatient(p => ({ ...p, unsubscribe }));
    };

    const closeDocumentModal = () => {
        if (documentModalPatient && documentModalPatient.unsubscribe) {
            documentModalPatient.unsubscribe();
        }
        setDocumentModalPatient(null);
        setPatientDocuments([]);
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !documentModalPatient) return;

        setIsUploading(true);
        try {
            const storageRef = ref(storage, `patient-documents/${documentModalPatient.id}/${Date.now()}-${file.name}`);
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);

            await addDoc(collection(db, 'users', documentModalPatient.id, 'documents'), {
                fileName: file.name,
                fileType: file.type,
                url: downloadURL,
                uploadedAt: serverTimestamp()
            });
        } catch (error) {
            console.error("Error uploading document:", error);
            showModal({ title: 'Error', children: 'Gagal mengunggah dokumen.' });
        } finally {
            setIsUploading(false);
            if(fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleDeleteDocument = async (docId) => {
        showModal({
            title: 'Konfirmasi Hapus Dokumen',
            children: <p>Yakin ingin menghapus dokumen ini?</p>,
            footer: (
                <>
                    <button onClick={hideModal} className="bg-gray-300 px-4 py-2 rounded-md">Batal</button>
                    <button onClick={async () => {
                        try {
                            await deleteDoc(doc(db, 'users', documentModalPatient.id, 'documents', docId));
                            // Optionally delete from storage as well
                            hideModal();
                        } catch (error) {
                            console.error("Error deleting document:", error);
                        }
                    }} className="bg-red-600 text-white px-4 py-2 rounded-md">Hapus</button>
                </>
            )
        });
    };

    const getBranchName = (branchId) => branches.find(b => b.id === branchId)?.name || 'Pusat';

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-700 p-4 rounded-lg shadow-md mb-6">Manajemen Pasien</h2>
            {isManagerOrStaf && (
                <div className="flex justify-end mb-6">
                    <button onClick={() => { resetForm(); setShowForm(true); }} className="bg-indigo-600 text-white px-3 py-2 text-sm sm:px-4 rounded-md hover:bg-indigo-700 flex items-center">
                        <PlusCircle size={18} className="mr-2"/> Tambah Pasien
                    </button>
                </div>
            )}

            {showForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4">
    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl">
                        <h3 className="text-lg font-semibold mb-4">{editingPatient ? 'Edit Data Pasien' : 'Tambah Pasien Baru'}</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-shrink-0 flex flex-col items-center gap-2">
                    <img src={formData.photoUrl || `https://ui-avatars.com/api/?name=${formData.name || '?'}&background=random`} alt="Profile" className="h-24 w-24 rounded-full object-cover shadow-md"/>
                    <label htmlFor="patient-photo-upload" className="cursor-pointer bg-white py-1 px-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">
                        <span>Unggah Foto</span>
                        <input id="patient-photo-upload" name="patient-photo-upload" type="file" className="sr-only" onChange={handlePhotoFileChange} accept="image/*"/>
                    </label>
                </div>
                <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium text-gray-700">Nama Lengkap</label><input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required /></div>
                    <div><label className="block text-sm font-medium text-gray-700">Email</label><input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" /></div>
                    <div><label className="block text-sm font-medium text-gray-700">Telepon</label><input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" /></div>
                    <div><label className="block text-sm font-medium text-gray-700">Tanggal Lahir</label><input type="date" value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" /></div>
                    <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700">Alamat</label><textarea value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} rows="2" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" /></div>
                    <div><label className="block text-sm font-medium text-gray-700">Cabang</label><select value={formData.branchId} onChange={e => setFormData({...formData, branchId: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"><option value="">Pusat</option>{branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
                </div>
            </div>
            <div className="flex justify-end space-x-4 pt-4">
                <button type="button" onClick={resetForm} className="bg-gray-500 text-white px-3 py-1.5 text-sm sm:px-4 sm:py-2 rounded-md">Batal</button>
                <button type="submit" disabled={isUploading} className="bg-indigo-600 text-white px-3 py-1.5 text-sm sm:px-4 sm:py-2 rounded-md disabled:bg-indigo-400">
                    {isUploading ? 'Menyimpan...' : (editingPatient ? 'Perbarui' : 'Simpan')}
                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {documentModalPatient && (
                <CustomModal show={!!documentModalPatient} onClose={closeDocumentModal} title={`Dokumen Pasien: ${documentModalPatient.name}`}>
                    <div>
                        <div className="mb-4">
                            <label htmlFor="patient-doc-upload" className="w-full text-center cursor-pointer bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center justify-center">
                                {isUploading ? <Loader2 className="animate-spin" /> : <><UploadCloud size={18} className="mr-2" /> Unggah Dokumen Baru</>}
                            </label>
                            <input id="patient-doc-upload" type="file" ref={fileInputRef} className="sr-only" onChange={handleFileUpload} disabled={isUploading}/>
                        </div>
                        <div className="space-y-2 max-h-80 overflow-y-auto">
                            {patientDocuments.length > 0 ? patientDocuments.map(doc => (
                                <div key={doc.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                                    <a href={doc.url} target="_blank" rel="noopener noreferrer" className="flex items-center text-indigo-600 hover:underline truncate">
                                        <FileText size={16} className="mr-2 flex-shrink-0" />
                                        <span className="truncate">{doc.fileName}</span>
                                    </a>
                                    <button onClick={() => handleDeleteDocument(doc.id)} className="text-red-500 hover:text-red-700 p-1"><Trash2 size={16}/></button>
                                </div>
                            )) : <p className="text-center text-gray-500 italic">Belum ada dokumen.</p>}
                        </div>
                    </div>
                </CustomModal>
            )}

            <div className="bg-white rounded-lg shadow overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 responsive-table">
                    <thead className="bg-cyan-200">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Nama</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Kontak</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Cabang</th>
                            {isManagerOrStaf && <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Aksi</th>}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {patientUsers.map(patient => (
                            <tr key={patient.id}>
                                <td className="px-6 py-4 whitespace-nowrap font-medium" data-label="Nama">{patient.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap" data-label="Kontak">{patient.email}<br/>{patient.phone}</td>
                                <td className="px-6 py-4 whitespace-nowrap" data-label="Cabang">{getBranchName(patient.branchId)}</td>
                                {isManagerOrStaf && (
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" data-label="Aksi">
                                        <button onClick={() => openDocumentModal(patient)} className="text-blue-600 hover:text-blue-900 mr-3" title="Kelola Dokumen"><FileText size={16}/></button>
                                        <button onClick={() => handleEdit(patient)} className="text-indigo-600 hover:text-indigo-900 mr-3" title="Edit Pasien"><Edit size={16}/></button>
                                        <button onClick={() => handleDelete(patient.id)} className="text-red-600 hover:text-red-900" title="Hapus Pasien"><Trash2 size={16}/></button>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- Komponen Manajemen Dokter ---
const DoctorManagement = ({ users, branches, currentUser, showModal, hideModal }) => {
    const [showForm, setShowForm] = useState(false);
    const [editingDoctor, setEditingDoctor] = useState(null);
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', role: 'doctor', branchId: '', specialization: '' });
    const isManager = currentUser?.role === 'manajemen';

    // Filter for users who are doctors or doctor_experts
    const doctorUsers = useMemo(() => users.filter(u => u.role === 'doctor' || u.role === 'doctor_expert'), [users]);

    const getBranchName = (branchId) => branches.find(b => b.id === branchId)?.name || 'Pusat';

    const resetForm = () => {
        setFormData({ name: '', email: '', phone: '', role: 'doctor', branchId: '', specialization: '' });
        setEditingDoctor(null);
        setShowForm(false);
    };

    const handleEdit = (doctor) => {
        setEditingDoctor(doctor);
        setFormData({
            name: doctor.name || '',
            email: doctor.email || '',
            phone: doctor.phone || '',
            role: doctor.role || 'doctor',
            branchId: doctor.branchId || '',
            specialization: doctor.specialization || ''
        });
        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        // Ensure role is either 'doctor' or 'doctor_expert'
        const doctorData = { ...formData, role: formData.role === 'doctor_expert' ? 'doctor_expert' : 'doctor' };
        try {
            if (editingDoctor) {
                await updateDoc(doc(db, 'users', editingDoctor.id), doctorData);
            } else {
                // This only adds a user to the collection, it does not create a Firebase Auth user.
                await addDoc(collection(db, 'users'), doctorData);
            }
            resetForm();
            showModal({
                title: 'Sukses',
                children: <p>Data dokter berhasil disimpan.</p>,
                footer: <button onClick={hideModal} className="bg-indigo-600 text-white px-4 py-2 rounded-md">OK</button>
            });
        } catch (error) {
            console.error("Error saving doctor:", error);
            showModal({
                title: 'Error',
                children: <p>Gagal menyimpan data dokter. Silakan coba lagi.</p>,
                footer: <button onClick={hideModal} className="bg-red-600 text-white px-4 py-2 rounded-md">Tutup</button>
            });
        }
    };

    const handleDelete = (doctorId) => {
        showModal({
            title: 'Konfirmasi Hapus Dokter',
            children: <p>Apakah Anda yakin ingin menghapus data dokter ini? Ini hanya akan menghapus profil mereka dari daftar.</p>,
            footer: (
                <>
                    <button onClick={hideModal} className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-400">Batal</button>
                    <button
                        onClick={async () => {
                            try {
                                await deleteDoc(doc(db, "users", doctorId));
                                hideModal();
                            } catch (error) {
                                console.error("Error deleting doctor:", error);
                                hideModal();
                                showModal({
                                    title: 'Error',
                                    children: <p>Gagal menghapus dokter. Silakan coba lagi.</p>,
                                    footer: <button onClick={hideModal} className="bg-red-600 text-white px-4 py-2 rounded-md">Tutup</button>
                                });
                            }
                        }}
                        className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                    >
                        Hapus
                    </button>
                </>
            )
        });
    };

    return (
        <div className="p-6">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-700 p-4 rounded-lg shadow-md">Manajemen Dokter</h2>
            </div>
            {isManager && (
                <div className="flex justify-end mb-6">
                    <button onClick={() => setShowForm(true)} className="bg-indigo-600 text-white px-3 py-2 text-sm sm:px-4 rounded-md hover:bg-indigo-700 flex items-center">
                        <UserPlus size={18} className="mr-2"/> Tambah Dokter
                    </button>
                </div>
            )}

            {showForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">{editingDoctor ? 'Edit Data Dokter' : 'Tambah Dokter Baru'}</h3>
                            <button onClick={resetForm}><X/></button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div><label className="block text-sm font-medium text-gray-700">Nama Lengkap</label><input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required /></div>
                                <div><label className="block text-sm font-medium text-gray-700">Email</label><input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required /></div>
                                <div><label className="block text-sm font-medium text-gray-700">Telepon</label><input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" /></div>
                                <div><label className="block text-sm font-medium text-gray-700">Spesialisasi</label><input type="text" value={formData.specialization} onChange={e => setFormData({...formData, specialization: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" placeholder="Contoh: Kardiologi" /></div>
                                <div><label className="block text-sm font-medium text-gray-700">Role</label><select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"><option value="doctor">Dokter</option><option value="doctor_expert">Dokter Ahli</option></select></div>
                                <div><label className="block text-sm font-medium text-gray-700">Cabang</label><select value={formData.branchId} onChange={e => setFormData({...formData, branchId: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"><option value="">Pusat</option>{branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
                            </div>
                            <div className="flex space-x-4 pt-2"><button type="submit" className="bg-indigo-600 text-white px-3 py-1.5 text-sm sm:px-4 sm:py-2 rounded-md">{editingDoctor ? 'Perbarui' : 'Simpan'}</button><button type="button" onClick={resetForm} className="bg-gray-500 text-white px-3 py-1.5 text-sm sm:px-4 sm:py-2 rounded-md">Batal</button></div>
                        </form>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-lg shadow overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 responsive-table">
                    <thead className="bg-lime-200">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Nama</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Spesialisasi</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Role</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Cabang</th>
                            {isManager && <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Aksi</th>}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {doctorUsers.map(doctor => (
                            <tr key={doctor.id}>
                                <td className="px-6 py-4 whitespace-nowrap" data-label="Nama">{doctor.name}<br/><span className="text-sm text-gray-500">{doctor.email}</span></td>
                                <td className="px-6 py-4 whitespace-nowrap" data-label="Spesialisasi">{doctor.specialization || '-'}</td>
                                <td className="px-6 py-4 whitespace-nowrap" data-label="Role">{doctor.role}</td>
                                <td className="px-6 py-4 whitespace-nowrap" data-label="Cabang">{getBranchName(doctor.branchId)}</td>
                                {isManager && 
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" data-label="Aksi">
                                        <button onClick={() => handleEdit(doctor)} className="text-indigo-600 hover:text-indigo-900 mr-3"><Edit size={16}/></button>
                                        <button onClick={() => handleDelete(doctor.id)} className="text-red-600 hover:text-red-900"><Trash2 size={16}/></button>
                                    </td>
                                }
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- [BARU] Komponen Dasbor Dokter ---
const DoctorDashboard = ({ currentUser, appointments, users, labResults }) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Filter appointments for the current doctor that are today or in the future
    const upcomingAppointments = useMemo(() => {
        return appointments
            .filter(app => {
                const appDate = new Date(app.date);
                return app.practitionerId === currentUser.id && appDate >= today;
            })
            .sort((a, b) => new Date(`${a.date} ${a.time}`) - new Date(`${b.date} ${b.time}`))
            .slice(0, 5); // Show next 5
    }, [appointments, currentUser.id]);

    // Filter lab results that need the doctor's review (example logic: practitioner is the current user)
    const recentLabResults = useMemo(() => {
        return labResults
            .filter(res => res.practitionerId === currentUser.id)
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5); // Show last 5
    }, [labResults, currentUser.id]);

    // Get the list of patients assigned to this doctor
    const myPatients = useMemo(() => {
        const patientIds = new Set(appointments.filter(a => a.practitionerId === currentUser.id).map(a => a.patientId));
        return users.filter(u => patientIds.has(u.id));
    }, [appointments, users, currentUser.id]);

    const getPatientName = (patientId) => users.find(u => u.id === patientId)?.name || 'N/A';

    return (
        <div className="p-6 space-y-8 bg-gray-50">
            <h2 className="text-2xl font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-700 p-4 rounded-lg shadow-md">Dasbor Dokter</h2>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <ReportCard 
                    title="Konsultasi Mendatang" 
                    value={upcomingAppointments.length} 
                    icon={<Calendar size={20} className="text-white"/>} 
                    color="bg-blue-500"
                />
                <ReportCard 
                    title="Hasil Lab Terbaru" 
                    value={recentLabResults.length} 
                    icon={<FlaskConical size={20} className="text-white"/>} 
                    color="bg-purple-500"
                />
                <ReportCard 
                    title="Total Pasien Saya" 
                    value={myPatients.length} 
                    icon={<Users2 size={20} className="text-white"/>} 
                    color="bg-green-500"
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Upcoming Appointments */}
                <div className="bg-white p-6 rounded-2xl shadow-lg">
                    <h3 className="text-lg font-bold text-white bg-gradient-to-r from-teal-500 to-cyan-600 p-3 rounded-t-lg shadow-md mb-4 flex items-center">
                        <Calendar className="mr-2" /> Jadwal Konsultasi Mendatang
                    </h3>
                    <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                        {upcomingAppointments.length > 0 ? (
                            upcomingAppointments.map(app => (
                                <div key={app.id} className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                                    <p className="font-semibold text-blue-900">{getPatientName(app.patientId)}</p>
                                    <p className="text-sm text-gray-600">
                                        {new Date(app.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                    </p>
                                    <p className="text-sm text-gray-600">Pukul {app.time}</p>
                                    <span className={`mt-2 inline-block px-2 py-1 text-xs font-semibold rounded-full capitalize ${app.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                        {app.status}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 italic text-center py-8">Tidak ada jadwal konsultasi mendatang.</p>
                        )}
                    </div>
                </div>

                {/* Recent Lab Results */}
                <div className="bg-white p-6 rounded-2xl shadow-lg">
                    <h3 className="text-lg font-bold text-white bg-gradient-to-r from-teal-500 to-cyan-600 p-3 rounded-t-lg shadow-md mb-4 flex items-center">
                        <FileText className="mr-2" /> Laporan Hasil Lab Terbaru
                    </h3>
                    <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                        {recentLabResults.length > 0 ? (
                            recentLabResults.map(result => (
                                <div key={result.id} className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-semibold text-purple-900">{result.testName}</p>
                                            <p className="text-sm text-gray-700">Pasien: {getPatientName(result.patientId)}</p>
                                            <p className="text-sm text-gray-600">Tanggal: {result.date}</p>
                                        </div>
                                        {result.fileUrl && <a href={result.fileUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline text-sm">Lihat File</a>}
                                    </div>
                                    <p className="mt-2 font-mono bg-white p-2 rounded text-sm">Hasil: {result.result} {result.unit}</p>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 italic text-center py-8">Tidak ada hasil lab terbaru.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- [BARU] Komponen Dasbor Dokter ---
const PatientDashboard = ({ currentUser, appointments, labResults, payments, medicalRecords, users, services, showModal, hideModal, db, storage }) => {

const [isEditModalOpen, setIsEditModalOpen] = useState(false);
const [profileData, setProfileData] = useState({
    name: currentUser.name || '',
    phone: currentUser.phone || '',
    dob: currentUser.dob || '',
    address: currentUser.address || '',
    photoUrl: currentUser.photoUrl || ''
});
const [profilePhotoFile, setProfilePhotoFile] = useState(null);
const [isUploading, setIsUploading] = useState(false);

const handleFileChange = (e) => {
    if (e.target.files[0]) {
        const file = e.target.files[0];
        setProfilePhotoFile(file);
        setProfileData(prev => ({...prev, photoUrl: URL.createObjectURL(file)}));
    }
};

const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsUploading(true);
    try {
        let photoURL = currentUser.photoUrl;
        if (profilePhotoFile) {
            const storageRef = ref(storage, `user-photos/${currentUser.id}/${profilePhotoFile.name}`);
            await uploadBytes(storageRef, profilePhotoFile);
            photoURL = await getDownloadURL(storageRef);
        }
        
        const updatedData = {
            name: profileData.name,
            phone: profileData.phone,
            dob: profileData.dob,
            address: profileData.address,
            photoUrl: photoURL,
        };

        await updateDoc(doc(db, 'users', currentUser.id), updatedData);
        
        setIsEditModalOpen(false);
        setProfilePhotoFile(null);
        showModal({ title: 'Sukses', children: 'Profil Anda telah berhasil diperbarui.' });

    } catch (error) {
        console.error("Error updating profile: ", error);
        showModal({ title: 'Error', children: `Gagal memperbarui profil: ${error.message}` });
    } finally {
        setIsUploading(false);
    }
};

// Filter data khusus untuk pasien yang login
const myAppointments = useMemo(() => {
    return appointments
        .filter(app => app.patientId === currentUser.id)
        .sort((a, b) => new Date(`${a.date} ${a.time}`) - new Date(`${b.date} ${b.time}`));
}, [appointments, currentUser.id]);

const upcomingAppointments = myAppointments.filter(app => new Date(app.date) >= new Date());

const myLabResults = useMemo(() => {
    return labResults
        .filter(res => res.patientId === currentUser.id)
        .sort((a, b) => new Date(b.date) - new Date(a.date));
}, [labResults, currentUser.id]);

const myPayments = useMemo(() => {
    return payments
        .filter(p => p.patientId === currentUser.id)
        .sort((a, b) => (b.createdAt?.toDate() || 0) - (a.createdAt?.toDate() || 0));
}, [payments, currentUser.id]);

const lastMedicalRecord = useMemo(() => {
    if (!medicalRecords || medicalRecords.length === 0) return null;
    return medicalRecords.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
}, [medicalRecords]);

const getDoctorName = (doctorId) => users.find(u => u.id === doctorId)?.name || 'N/A';

const [newAppointmentData, setNewAppointmentData] = useState({
    practitionerId: '',
    serviceId: '',
    serviceName: '',
    date: '',
    complaint: ''
});
const [isSubmittingAppointment, setIsSubmittingAppointment] = useState(false);

const handleNewAppointment = async (e) => {
    e.preventDefault();
    if (!newAppointmentData.practitionerId || !newAppointmentData.serviceId || !newAppointmentData.date || !newAppointmentData.complaint) {
        showModal({ title: 'Peringatan', children: 'Harap lengkapi semua kolom pendaftaran, termasuk memilih layanan.' });
        return;
    }
    setIsSubmittingAppointment(true);
    try {
        const appointmentDateTime = new Date(newAppointmentData.date);
        const time = appointmentDateTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        
        await addDoc(collection(db, 'appointments'), {
            patientId: currentUser.id,
            practitionerId: newAppointmentData.practitionerId,
            serviceId: newAppointmentData.serviceId,
            serviceName: newAppointmentData.serviceName,
            date: newAppointmentData.date,
            time: time, // Defaulting time for now, can be improved
            status: 'pending',
            notes: newAppointmentData.complaint,
            branchId: currentUser.branchId || null
        });

        setNewAppointmentData({ practitionerId: '', serviceId: '', serviceName: '', date: '', complaint: '' });
        showModal({ title: 'Sukses', children: 'Pendaftaran kunjungan Anda telah berhasil. Silakan tunggu konfirmasi dari staf kami.' });

    } catch (error) {
        console.error("Error creating appointment: ", error);
        showModal({ title: 'Error', children: `Gagal membuat janji temu: ${error.message}` });
    } finally {
        setIsSubmittingAppointment(false);
    }
};

return (
    <div className="p-2 sm:p-6 space-y-6 bg-gray-50 min-h-screen">
        {/* Modal Edit Profil */}
        <CustomModal show={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Profil Anda">
            <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="flex flex-col items-center gap-4">
                    <img src={profileData.photoUrl || `https://ui-avatars.com/api/?name=${profileData.name}&background=random`} alt="Profile Preview" className="h-24 w-24 rounded-full object-cover shadow-md"/>
                    <label htmlFor="photo-upload" className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">
                        <Camera size={16} className="inline-block mr-2" />
                        Ganti Foto Profil
                    </label>
                    <input id="photo-upload" name="photo-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/*"/>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Nama Lengkap</label>
                        <input type="text" value={profileData.name} onChange={e => setProfileData({...profileData, name: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Telepon</label>
                        <input type="tel" value={profileData.phone} onChange={e => setProfileData({...profileData, phone: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Tanggal Lahir</label>
                        <input type="date" value={profileData.dob} onChange={e => setProfileData({...profileData, dob: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Alamat</label>
                        <textarea value={profileData.address} onChange={e => setProfileData({...profileData, address: e.target.value})} rows="3" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                    </div>
                </div>
                <div className="flex justify-end items-center gap-2 pt-4">
                    <button type="button" onClick={() => setIsEditModalOpen(false)} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300">Batal</button>
                    <button type="submit" disabled={isUploading} className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:bg-indigo-400 flex items-center">
                        {isUploading && <Loader2 className="animate-spin mr-2"/>}
                        Simpan Perubahan
                    </button>
                </div>
            </form>
        </CustomModal>

        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-8 rounded-2xl shadow-xl">
            <h1 className="text-3xl font-bold">Selamat Datang, {currentUser.name}!</h1>
            <p className="mt-2 text-blue-100">Ini adalah ringkasan kesehatan dan jadwal Anda. Semoga hari Anda menyenangkan.</p>
        </div>

        {/* Pendaftaran Kunjungan Baru */}
        <InfoCard icon={<PlusCircle size={24}/>} title="Daftar Kunjungan Baru" iconColor="bg-gradient-to-br from-indigo-500 to-purple-600">
             <form onSubmit={handleNewAppointment} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Pilih Dokter</label>
                        <select 
                            value={newAppointmentData.practitionerId} 
                            onChange={e => setNewAppointmentData({...newAppointmentData, practitionerId: e.target.value})} 
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" 
                            required
                        >
                            <option value="">-- Pilih salah satu dokter --</option>
                            {users.filter(u => u.role.includes('doctor')).map(doctor => (
                                <option key={doctor.id} value={doctor.id}>{doctor.name}</option>
                            ))}
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700">Pilih Layanan</label>
                        <select 
                            value={newAppointmentData.serviceId} 
                            onChange={(e) => {
                                const selectedService = services.find(s => s.id === e.target.value);
                                setNewAppointmentData({
                                    ...newAppointmentData, 
                                    serviceId: e.target.value,
                                    serviceName: selectedService ? selectedService.name : ''
                                });
                            }}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" 
                            required
                        >
                            <option value="">-- Pilih jenis layanan --</option>
                            {services.map(service => (
                                <option key={service.id} value={service.id}>{service.name} ({formatCurrency(service.price)})</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Pilih Tanggal Kunjungan</label>
                        <input 
                            type="date" 
                            value={newAppointmentData.date} 
                            onChange={e => setNewAppointmentData({...newAppointmentData, date: e.target.value})}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" 
                            required 
                            min={new Date().toISOString().split("T")[0]} // Prevent past dates
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Keluhan Anda</label>
                        <textarea 
                            value={newAppointmentData.complaint} 
                            onChange={e => setNewAppointmentData({...newAppointmentData, complaint: e.target.value})} 
                            rows="3" 
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" 
                            placeholder="Jelaskan keluhan utama Anda..." 
                            required
                        />
                    </div>
                </div>
                <div className="flex justify-end">
                    <button type="submit" disabled={isSubmittingAppointment} className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 disabled:bg-indigo-400 flex items-center">
                        {isSubmittingAppointment && <Loader2 className="animate-spin mr-2"/>}
                        Ambil Nomor Antrian
                    </button>
                </div>
             </form>
        </InfoCard>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Kolom Kiri: Profil & Kunjungan */}
            <div className="lg:col-span-1 space-y-6">
                <InfoCard icon={<User size={24}/>} title="Profil Saya" iconColor="bg-gradient-to-br from-teal-500 to-cyan-500">
                    <div className="flex items-center space-x-4">
                        <img src={profileData.photoUrl || `https://ui-avatars.com/api/?name=${profileData.name}&background=random`} alt="Profile" className="h-20 w-20 rounded-full object-cover shadow-sm"/>
                        <div className="text-sm">
                            <p className="font-bold text-lg">{profileData.name}</p>
                            <p>{currentUser.email}</p>
                        </div>
                    </div>
                    <div className="mt-4 text-sm space-y-1">
                        <p><strong>Telepon:</strong> {profileData.phone || 'Belum diisi'}</p>
                        <p><strong>Tgl. Lahir:</strong> {profileData.dob || 'Belum diisi'}</p>
                        <p><strong>Alamat:</strong> {profileData.address || 'Belum diisi'}</p>
                    </div>
                    <button onClick={() => setIsEditModalOpen(true)} className="w-full text-center mt-4 bg-teal-500 text-white px-4 py-2 rounded-md hover:bg-teal-600 transition-colors font-semibold">
                        Edit Profil
                    </button>
                </InfoCard>
                 <InfoCard icon={<DollarSign size={24}/>} title="Riwayat Kunjungan" iconColor="bg-gradient-to-br from-green-500 to-emerald-500">
                     {myPayments.length > 0 ? (
                        myPayments.slice(0, 3).map(p => (
                            <div key={p.id} className="text-sm border-b pb-2 mb-2">
                               <p className="font-semibold">{p.items.map(i => i.name).join(', ')}</p>
                               <div className="flex justify-between">
                                   <span className="text-gray-500">{p.createdAt?.toDate().toLocaleDateString('id-ID')}</span>
                                   <span className="font-semibold">{formatCurrency(p.total)}</span>
                               </div>
                            </div>
                        ))
                    ) : (
                         <p className="text-gray-500 italic">Tidak ada riwayat kunjungan.</p>
                    )}
                </InfoCard>
            </div>

            {/* Kolom Kanan: Info Medis & Jadwal */}
            <div className="lg:col-span-2 space-y-6">
               <InfoCard icon={<HeartPulse size={24}/>} title="Riwayat Penanganan Terakhir" iconColor="bg-gradient-to-br from-red-500 to-orange-500">
                    {lastMedicalRecord ? (
                        <div className="text-sm space-y-2">
                            <p><strong>Tanggal:</strong> {lastMedicalRecord.date}</p>
                            <p><strong>Assessment:</strong> {lastMedicalRecord.assessment}</p>
                            <p><strong>Rencana:</strong> {lastMedicalRecord.plan}</p>
                        </div>
                    ) : (
                        <p className="text-gray-500 italic">
                            Belum ada riwayat penanganan yang tercatat.
                        </p>
                    )}
                </InfoCard>
                
                <InfoCard icon={<Calendar size={24}/>} title="Jadwal Konsultasi Anda" iconColor="bg-gradient-to-br from-blue-500 to-sky-500">
                    {upcomingAppointments.length > 0 ? (
                        upcomingAppointments.slice(0, 2).map(app => (
                            <div key={app.id} className="bg-blue-50 p-3 rounded-lg border-l-4 border-blue-500">
                                <p className="font-semibold">Konsultasi dengan Dr. {getDoctorName(app.practitionerId)}</p>
                                <p className="text-sm text-gray-600">
                                    {new Date(app.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
                                    , pukul {app.time}
                                </p>
                                <span className={`mt-1 inline-block px-2 py-0.5 text-xs rounded-full capitalize ${app.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                    Status: {app.status}
                                </span>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-500 italic">Tidak ada jadwal konsultasi mendatang.</p>
                    )}
                </InfoCard>

                <InfoCard icon={<FlaskConical size={24}/>} title="Hasil Laboratorium Terbaru" iconColor="bg-gradient-to-br from-purple-500 to-fuchsia-500">
                     {myLabResults.length > 0 ? (
                        myLabResults.slice(0, 2).map(res => (
                            <div key={res.id} className="bg-purple-50 p-3 rounded-lg border-l-4 border-purple-500 flex justify-between items-center">
                                <div>
                                    <p className="font-semibold">{res.testName}</p>
                                    <p className="text-sm text-gray-600">Tanggal: {res.date}</p>
                                </div>
                                {res.fileUrl ? (
                                     <a href={res.fileUrl} target="_blank" rel="noopener noreferrer" className="bg-purple-600 text-white px-3 py-1 text-xs rounded-md hover:bg-purple-700">Lihat File</a>
                                ) : (
                                     <p className="text-sm font-mono bg-white px-2 py-1 rounded">{res.result} {res.unit}</p>
                                )}
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-500 italic">Belum ada hasil laboratorium.</p>
                    )}
                </InfoCard>
            </div>
        </div>
    </div>
);
};


// --- [BARU] Komponen Dasbor Manajemen ---
const ManagementDashboard = ({ users, branches, payments, expenses, inventory, appointments, attendance }) => {
    const todayStr = new Date().toISOString().slice(0, 10);

    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
        const RADIAN = Math.PI / 180;
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        if (percent * 100 < 5) return null;

        return (
            <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize="12">
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        );
    };

    const formatAxisCurrency = (value) => {
        if (value >= 1000000) {
            return `Rp ${(value / 1000000).toFixed(1)} Jt`;
        }
        if (value >= 1000) {
            return `Rp ${(value / 1000).toFixed(0)} Rb`;
        }
        return `Rp ${value}`;
    };

    const { totalRevenue, totalExpenses, netProfit, revenueByBranch } = useMemo(() => {
        const totalRevenue = payments.reduce((sum, p) => sum + (p.total || p.amount || 0), 0);
        const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
        const netProfit = totalRevenue - totalExpenses;
        
        const revenueByBranch = branches.map(branch => {
            const branchPayments = payments.filter(p => p.branchId === branch.id);
            const revenue = branchPayments.reduce((sum, p) => sum + (p.total || p.amount || 0), 0);
            return { name: branch.name, Pendapatan: revenue };
        });

        // Menambahkan pendapatan "Pusat" (yang tidak memiliki branchId)
        const centralRevenue = payments
            .filter(p => !p.branchId)
            .reduce((sum, p) => sum + (p.total || p.amount || 0), 0);

        if (centralRevenue > 0) {
            revenueByBranch.push({ name: 'Pusat', Pendapatan: centralRevenue });
        }
        
        return { totalRevenue, totalExpenses, netProfit, revenueByBranch };
    }, [payments, expenses, branches]);

    const { maxRevenue, minRevenue } = useMemo(() => {
        if (revenueByBranch.length === 0) return { maxRevenue: 0, minRevenue: 0 };
        const revenues = revenueByBranch.map(item => item.Pendapatan);
        return {
            maxRevenue: Math.max(...revenues),
            minRevenue: Math.min(...revenues)
        };
    }, [revenueByBranch]);

    const getBarColor = (value) => {
        if (revenueByBranch.length <= 1) return '#8884d8';
        if (value === maxRevenue) return '#22c55e'; // green-500
        if (value === minRevenue) return '#ef4444'; // red-500
        return '#f9b208'; // amber-500
    };

    const { attendanceByBranch } = useMemo(() => {
        const todayAttendance = attendance.filter(a => a.date === todayStr);
        const attendanceByBranch = branches.map(branch => {
            const branchEmployees = users.filter(u => u.branchId === branch.id && u.role !== 'pasien');
            const presentEmployees = todayAttendance.filter(a => branchEmployees.some(e => e.id === a.userId));
            return {
                id: branch.id,
                name: branch.name,
                present: presentEmployees.length,
                total: branchEmployees.length,
            };
        });
        return { attendanceByBranch };
    }, [attendance, users, branches, todayStr]);

    const lowStockItems = useMemo(() => {
        return inventory.filter(item => (item.stock || 0) < 10).slice(0, 5);
    }, [inventory]);
    
    const getBranchName = (branchId) => branches.find(b => b.id === branchId)?.name || 'Pusat';
    
    const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'];

    return (
        <div className="p-2 sm:p-6 space-y-6 bg-gray-50">
            <h2 className="text-2xl font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-700 p-4 rounded-lg shadow-md">Dasbor Manajemen Terpadu</h2>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <ReportCard title="Total Pendapatan" value={formatCurrency(totalRevenue)} icon={<DollarSign size={20}/>} color="bg-green-500" />
                <ReportCard title="Total Beban" value={formatCurrency(totalExpenses)} icon={<TrendingUp size={20}/>} color="bg-red-500" />
                <ReportCard title="Laba Bersih" value={formatCurrency(netProfit)} icon={<CircleDollarSign size={20}/>} color="bg-blue-500" />
                <ReportCard title="Jumlah Pasien" value={users.filter(u => u.role?.toLowerCase() === 'pasien').length} icon={<Users2 size={20}/>} color="bg-purple-500" />
            </div>
            
            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 bg-white p-6 rounded-2xl filter drop-shadow-xl">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Perbandingan Pendapatan Antar Cabang</h3>
                     <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={revenueByBranch} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis tickFormatter={formatAxisCurrency} />
                            <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(5px)' }} formatter={(value) => formatCurrency(value)} />
                            <Legend />
                            <Bar dataKey="Pendapatan">
                                {revenueByBranch.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={getBarColor(entry.Pendapatan)} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl filter drop-shadow-xl">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Distribusi Pendapatan</h3>
                    {revenueByBranch && revenueByBranch.length > 0 ? (
                        <div className="relative" style={{ height: '300px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={revenueByBranch}
                                        dataKey="Pendapatan"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={100}
                                        innerRadius={70}
                                        labelLine={false}
                                        label={renderCustomizedLabel}
                                        isAnimationActive={true}
                                        animationDuration={800}
                                    >
                                        {revenueByBranch.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} stroke="none" />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value) => formatCurrency(value)}
                                        contentStyle={{ background: 'rgba(0, 0, 0, 0.7)', border: 'none', borderRadius: '10px', color: 'white' }}
                                    />
                                    <Legend iconSize={12} wrapperStyle={{fontSize: "14px"}}/>
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                                <p className="text-sm text-gray-500">Total Pendapatan</p>
                                <p className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.1)' }}>
                                    {formatCurrency(totalRevenue)}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-[300px] text-center text-gray-500">
                            <p>Tidak ada data pendapatan untuk ditampilkan.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Branch Performance & Other Snippets */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Kehadiran Staf & Stok Rendah</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h4 className="font-semibold mb-2">Kehadiran Hari Ini</h4>
                             <ul className="space-y-2 text-sm">
                                {attendanceByBranch.map(branch => (
                                    <li key={branch.id} className="flex justify-between border-b pb-1">
                                        <span>{branch.name}</span>
                                        <span className={`font-bold ${branch.present === branch.total ? 'text-green-600' : 'text-yellow-600'}`}>{branch.present} / {branch.total}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                             <h4 className="font-semibold mb-2">Stok Hampir Habis</h4>
                             <ul className="space-y-2">
                                {lowStockItems.length > 0 ? lowStockItems.map(item => (
                                    <li key={item.id} className="flex justify-between text-sm border-b pb-1">
                                        <span>{item.name} <span className="text-xs text-gray-500">({getBranchName(item.branchId)})</span></span>
                                        <span className="font-bold text-red-600">Sisa: {item.stock}</span>
                                    </li>
                                )) : <p className="text-gray-500 italic text-xs">Tidak ada item dengan stok rendah.</p>}
                            </ul>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Jadwal Konsultasi Mendatang</h3>
                     <div className="space-y-3 max-h-48 overflow-y-auto">
                        {appointments.filter(app => new Date(app.date) >= new Date()).slice(0, 5).map(app => (
                            <div key={app.id} className="bg-gray-50 p-3 rounded-lg text-sm">
                                <p className="font-semibold">{users.find(u => u.id === app.patientId)?.name}</p>
                                <p className="text-xs text-gray-600">{app.date} @ {app.time} - Dr. {users.find(u => u.id === app.practitionerId)?.name} ({getBranchName(app.branchId)})</p>
                            </div>
                        ))}
                         {appointments.filter(app => new Date(app.date) >= new Date()).length === 0 && <p className="text-gray-500 italic text-sm">Tidak ada jadwal mendatang.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};


// --- [BARU] Komponen Pemantauan Janji Temu ---
const AppointmentManagement = ({ appointments, users, branches, services, currentUser, showModal, hideModal }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBranch, setSelectedBranch] = useState('all');
    const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
    const [statusFilter, setStatusFilter] = useState('all');
    const [showForm, setShowForm] = useState(false);
    const [editingAppointment, setEditingAppointment] = useState(null);
    const [formData, setFormData] = useState({
        patientId: '', practitionerId: '', serviceId: '', serviceName: '', date: '', time: '', branchId: '', status: 'pending'
    });

    const getPatientName = (patientId) => users.find(u => u.id === patientId)?.name || 'N/A';
    const getDoctorName = (doctorId) => users.find(u => u.id === doctorId)?.name || 'N/A';
    const getBranchName = (branchId) => branches.find(b => b.id === branchId)?.name || 'Pusat';
    const isManager = currentUser?.role === 'manajemen';

    const handleEdit = (appointment) => {
        setEditingAppointment(appointment);
        setFormData({ ...appointment });
        setShowForm(true);
    };

    const handleDelete = (id) => {
        showModal({
            title: 'Konfirmasi Hapus Jadwal',
            children: <p>Apakah Anda yakin ingin menghapus jadwal konsultasi ini?</p>,
            footer: (
                <>
                    <button onClick={hideModal} className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-400">Batal</button>
                    <button
                        onClick={async () => {
                            try {
                                await deleteDoc(doc(db, "appointments", id));
                                hideModal();
                            } catch (error) {
                                console.error("Gagal menghapus jadwal:", error);
                                hideModal();
                                showModal({
                                    title: 'Error',
                                    children: <p>Gagal menghapus jadwal. Silakan coba lagi.</p>,
                                    footer: <button onClick={hideModal} className="bg-red-600 text-white px-4 py-2 rounded-md">Tutup</button>
                                });
                            }
                        }}
                        className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                    >
                        Hapus
                    </button>
                </>
            )
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingAppointment) {
                await updateDoc(doc(db, 'appointments', editingAppointment.id), formData);
            } else {
                await addDoc(collection(db, 'appointments'), { ...formData, branchId: currentUser.branchId || null });
            }
            resetForm();
        } catch (error) {
            console.error("Gagal menyimpan jadwal:", error);
            showModal({
                title: 'Error',
                children: <p>Gagal menyimpan jadwal. Silakan coba lagi.</p>,
                footer: <button onClick={hideModal} className="bg-red-600 text-white px-4 py-2 rounded-md">Tutup</button>
            });
        }
    };

    const resetForm = () => {
        setFormData({ patientId: '', practitionerId: '', date: '', time: '', branchId: '', status: 'pending' });
        setEditingAppointment(null);
        setShowForm(false);
    };

    const filteredAppointments = useMemo(() => {
        return appointments
            .filter(app => {
                const patientName = getPatientName(app.patientId)?.toLowerCase();
                const doctorName = getDoctorName(app.practitionerId)?.toLowerCase();
                const searchTermLower = searchTerm.toLowerCase();

                const searchMatch = (patientName && patientName.includes(searchTermLower)) || (doctorName && doctorName.includes(searchTermLower));
                const branchMatch = isManager || app.branchId === currentUser.branchId || !currentUser.branchId;
                const statusMatch = statusFilter === 'all' || app.status === statusFilter;
                const startDateMatch = !dateRange.startDate || new Date(app.date) >= new Date(dateRange.startDate);
                const endDateMatch = !dateRange.endDate || new Date(app.date) <= new Date(dateRange.endDate);

                return searchMatch && branchMatch && statusMatch && startDateMatch && endDateMatch;
            })
            .sort((a, b) => new Date(`${b.date} ${b.time}`) - new Date(`${a.date} ${a.time}`));
    }, [appointments, users, branches, searchTerm, selectedBranch, dateRange, statusFilter, currentUser]);

    const statusColors = {
        pending: 'bg-yellow-100 text-yellow-800',
        confirmed: 'bg-green-100 text-green-800',
        completed: 'bg-blue-100 text-blue-800',
        cancelled: 'bg-red-100 text-red-800',
    };

    const availablePatients = users.filter(u => u.role?.toLowerCase() === 'pasien' && (isManager || u.branchId === currentUser.branchId));
    const availableDoctors = users.filter(u => u.role.includes('doctor') && (isManager || u.branchId === currentUser.branchId));

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-700 p-4 rounded-lg shadow-md mb-6">Pemantauan Jadwal Konsultasi</h2>
            <div className="flex justify-end mb-6">
                <button onClick={() => setShowForm(true)} className="bg-indigo-600 text-white px-3 py-2 text-sm sm:px-4 rounded-md hover:bg-indigo-700 flex items-center">
                    <PlusCircle size={18} className="mr-2"/> Tambah Jadwal
                </button>
            </div>

            {showForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
                        <h3 className="text-lg font-semibold mb-4">{editingAppointment ? 'Edit Jadwal Konsultasi' : 'Tambah Jadwal Baru'}</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div><label>Pasien</label><select value={formData.patientId} onChange={e => setFormData({...formData, patientId: e.target.value})} className="mt-1 block w-full rounded-md" required><option value="">Pilih Pasien</option>{availablePatients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
                                <div><label>Dokter</label><select value={formData.practitionerId} onChange={e => setFormData({...formData, practitionerId: e.target.value})} className="mt-1 block w-full rounded-md" required><option value="">Pilih Dokter</option>{availableDoctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
                                <div className="md:col-span-2"><label>Layanan</label>
                                    <select 
                                        value={formData.serviceId} 
                                        onChange={(e) => {
                                            const selectedService = services.find(s => s.id === e.target.value);
                                            setFormData({
                                                ...formData, 
                                                serviceId: e.target.value,
                                                serviceName: selectedService ? selectedService.name : ''
                                            });
                                        }}
                                        className="mt-1 block w-full rounded-md" 
                                        required
                                    >
                                        <option value="">Pilih Layanan</option>
                                        {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div><label>Tanggal</label><input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="mt-1 block w-full rounded-md" required/></div>
                                <div><label>Waktu</label><input type="time" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} className="mt-1 block w-full rounded-md" required/></div>
                                <div><label>Status</label><select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="mt-1 block w-full rounded-md" required><option value="pending">Pending</option><option value="confirmed">Confirmed</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></div>
                            </div>
                            <div className="flex space-x-4"><button type="submit" className="bg-indigo-600 text-white px-3 py-1.5 text-sm sm:px-4 sm:py-2 rounded-md">{editingAppointment ? 'Perbarui' : 'Simpan'}</button><button type="button" onClick={resetForm} className="bg-gray-500 text-white px-3 py-1.5 text-sm sm:px-4 sm:py-2 rounded-md">Batal</button></div>
                        </form>
                    </div>
                </div>
            )}

            <div className="bg-white p-4 rounded-lg shadow mb-6">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cari Pasien / Dokter</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input type="text" placeholder="Ketik untuk mencari..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md"/>
                        </div>
                    </div>
                     <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Filter Tanggal</label>
                            <div className="flex items-center space-x-2">
                                <input type="date" value={dateRange.startDate} onChange={e => setDateRange({...dateRange, startDate: e.target.value})} className="w-full p-1.5 border border-gray-300 rounded-md"/>
                                <span className="text-gray-500">-</span>
                                <input type="date" value={dateRange.endDate} onChange={e => setDateRange({...dateRange, endDate: e.target.value})} className="w-full p-1.5 border border-gray-300 rounded-md"/>
                             </div>
                     </div>
                    {isManager && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Filter Cabang</label>
                            <select value={selectedBranch} onChange={e => setSelectedBranch(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md">
                                <option value="all">Semua Cabang</option>
                                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Filter Status</label>
                        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md">
                            <option value="all">Semua Status</option>
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 responsive-table">
                    <thead className="bg-amber-200">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Waktu Konsultasi</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Pasien</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Dokter</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Layanan</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Cabang</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase">Status</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredAppointments.map(app => (
                        <tr key={app.id}>
                            <td className="px-6 py-4 whitespace-nowrap" data-label="Waktu"><div className="text-sm font-medium text-gray-900">{app.date}</div><div className="text-sm text-gray-500">{app.time}</div></td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900" data-label="Pasien">{getPatientName(app.patientId)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700" data-label="Dokter">{getDoctorName(app.practitionerId)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700" data-label="Layanan">{app.serviceName || '-'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" data-label="Cabang">{getBranchName(app.branchId)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-center" data-label="Status">
                                <span className={`px-2.5 py-1.5 text-xs font-medium rounded-full capitalize ${statusColors[app.status] || 'bg-gray-100 text-gray-800'}`}>
                                    {app.status}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium" data-label="Aksi">
                                <button onClick={() => handleEdit(app)} className="text-indigo-600 hover:text-indigo-900 mr-3">
                                    <Edit size={16}/>
                                </button>
                                <button onClick={() => handleDelete(app.id)} className="text-red-600 hover:text-red-900">
                                    <Trash2 size={16}/>
                                </button>
                            </td>
                        </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- [BARU] Komponen Pemantauan Program Lifestyle ---
const LifestyleProgramManagement = ({ lifestylePrograms, users, branches, currentUser, showModal, hideModal }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBranch, setSelectedBranch] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [showForm, setShowForm] = useState(false);
    const [editingProgram, setEditingProgram] = useState(null);
    const [formData, setFormData] = useState({
        patientId: '', title: '', type: '', startDate: '', endDate: '', branchId: '', status: 'pending'
    });

    const isManager = currentUser?.role === 'manajemen';

    const getPatientName = (patientId) => users.find(u => u.id === patientId)?.name || 'N/A';
    const getBranchName = (branchId) => branches.find(b => b.id === branchId)?.name || 'Pusat';

    const handleEdit = (program) => {
        setEditingProgram(program);
        setFormData({ ...program });
        setShowForm(true);
    };

    const handleDelete = (id) => {
        showModal({
            title: 'Konfirmasi Hapus Program',
            children: <p>Apakah Anda yakin ingin menghapus program lifestyle ini?</p>,
            footer: (
                <>
                    <button onClick={hideModal} className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-400">Batal</button>
                    <button
                        onClick={async () => {
                            try {
                                await deleteDoc(doc(db, "lifestylePrograms", id));
                                hideModal();
                            } catch (error) {
                                console.error("Gagal menghapus program:", error);
                                hideModal();
                                showModal({
                                    title: 'Error',
                                    children: <p>Gagal menghapus program. Silakan coba lagi.</p>,
                                    footer: <button onClick={hideModal} className="bg-red-600 text-white px-4 py-2 rounded-md">Tutup</button>
                                });
                            }
                        }}
                        className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                    >
                        Hapus
                    </button>
                </>
            )
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingProgram) {
                await updateDoc(doc(db, 'lifestylePrograms', editingProgram.id), formData);
            } else {
                await addDoc(collection(db, 'lifestylePrograms'), { ...formData, branchId: currentUser.branchId || null });
            }
            resetForm();
        } catch (error) {
            console.error("Gagal menyimpan program:", error);
            showModal({
                title: 'Error',
                children: <p>Gagal menyimpan program. Silakan coba lagi.</p>,
                footer: <button onClick={hideModal} className="bg-red-600 text-white px-4 py-2 rounded-md">Tutup</button>
            });
        }
    };

    const resetForm = () => {
        setFormData({ patientId: '', title: '', type: '', startDate: '', endDate: '', branchId: '', status: 'pending' });
        setEditingProgram(null);
        setShowForm(false);
    };

    const filteredPrograms = useMemo(() => {
        return lifestylePrograms.filter(program => {
            const patientName = getPatientName(program.patientId)?.toLowerCase();
            const searchTermLower = searchTerm.toLowerCase();

            const searchMatch = (patientName && patientName.includes(searchTermLower)) || (program.title?.toLowerCase().includes(searchTermLower));
            const branchMatch = isManager || program.branchId === currentUser.branchId || !currentUser.branchId;
            const statusMatch = statusFilter === 'all' || program.status === statusFilter;
            const typeMatch = typeFilter === 'all' || program.type === typeFilter;

            return searchMatch && branchMatch && statusMatch && typeMatch;
        });
    }, [lifestylePrograms, users, branches, searchTerm, selectedBranch, statusFilter, typeFilter, currentUser]);

    const statusColors = {
        active: 'bg-green-100 text-green-800',
        completed: 'bg-blue-100 text-blue-800',
        pending: 'bg-yellow-100 text-yellow-800',
    };

    const availablePatients = users.filter(u => u.role?.toLowerCase() === 'pasien' && (isManager || u.branchId === currentUser.branchId));

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-700 p-4 rounded-lg shadow-md mb-6">Pemantauan Program Lifestyle</h2>
            <div className="flex justify-end mb-6">
                <button onClick={() => setShowForm(true)} className="bg-indigo-600 text-white px-3 py-2 text-sm sm:px-4 rounded-md hover:bg-indigo-700 flex items-center">
                    <PlusCircle size={18} className="mr-2"/> Tambah Program
                </button>
            </div>

            {showForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
                        <h3 className="text-lg font-semibold mb-4">{editingProgram ? 'Edit Program Lifestyle' : 'Tambah Program Baru'}</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div><label>Pasien</label><select value={formData.patientId} onChange={e => setFormData({...formData, patientId: e.target.value})} className="mt-1 block w-full rounded-md" required><option value="">Pilih Pasien</option>{availablePatients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
                                <div><label>Judul Program</label><input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="mt-1 block w-full rounded-md" required/></div>
                                <div><label>Tipe Program</label><select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="mt-1 block w-full rounded-md" required><option value="">Pilih Tipe</option><option value="diet">Diet</option><option value="exercise">Olahraga</option><option value="wellness">Wellness</option></select></div>
                                <div><label>Tanggal Mulai</label><input type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className="mt-1 block w-full rounded-md" required/></div>
                                <div><label>Tanggal Selesai</label><input type="date" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} className="mt-1 block w-full rounded-md" required/></div>
                                <div><label>Status</label><select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="mt-1 block w-full rounded-md" required><option value="pending">Pending</option><option value="active">Aktif</option><option value="completed">Selesai</option></select></div>
                            </div>
                            <div className="flex space-x-4"><button type="submit" className="bg-indigo-600 text-white px-3 py-1.5 text-sm sm:px-4 sm:py-2 rounded-md">{editingProgram ? 'Perbarui' : 'Simpan'}</button><button type="button" onClick={resetForm} className="bg-gray-500 text-white px-3 py-1.5 text-sm sm:px-4 sm:py-2 rounded-md">Batal</button></div>
                        </form>
                    </div>
                </div>
            )}

            <div className="bg-white p-4 rounded-lg shadow mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cari Pasien / Program</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input type="text" placeholder="Ketik untuk mencari..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md"/>
                        </div>
                    </div>
                     <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Filter Tipe</label>
                             <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md">
                                 <option value="all">Semua Tipe</option>
                                 <option value="diet">Diet</option>
                                 <option value="exercise">Olahraga</option>
                                 <option value="wellness">Wellness</option>
                             </select>
                     </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Filter Status</label>
                        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md">
                            <option value="all">Semua Status</option>
                            <option value="active">Aktif</option>
                            <option value="completed">Selesai</option>
                            <option value="pending">Pending</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 responsive-table">
                    <thead className="bg-emerald-200">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Pasien</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Judul Program</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Tipe</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Periode</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Cabang</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase">Status</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredPrograms.map(program => (
                        <tr key={program.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900" data-label="Pasien">{getPatientName(program.patientId)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700" data-label="Program">{program.title}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize" data-label="Tipe">{program.type}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" data-label="Periode">{program.startDate} - {program.endDate}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" data-label="Cabang">{getBranchName(program.branchId)}</td>
                             <td className="px-6 py-4 whitespace-nowrap text-center" data-label="Status">
                                  <span className={`px-2.5 py-1.5 text-xs font-medium rounded-full capitalize ${statusColors[program.status] || 'bg-gray-100 text-gray-800'}`}>
                                       {program.status}
                                  </span>
                             </td>
                             <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium" data-label="Aksi">
                                  <button onClick={() => handleEdit(program)} className="text-indigo-600 hover:text-indigo-900 mr-3">
                                       <Edit size={16}/>
                                  </button>
                                  <button onClick={() => handleDelete(program.id)} className="text-red-600 hover:text-red-900">
                                       <Trash2 size={16}/>
                                  </button>
                             </td>
                        </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- [BARU] Komponen Modul Absensi ---
const AttendanceModule = ({ currentUser, showModal, hideModal, scriptsReady }) => {
    const [activeTab, setActiveTab] = useState('personal'); // 'personal' or 'journal'
    const [attendanceHistory, setAttendanceHistory] = useState([]);
    const [allAttendance, setAllAttendance] = useState([]);
    const [todayAttendance, setTodayAttendance] = useState(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [location, setLocation] = useState(null);
    const [error, setError] = useState('');
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [selfie, setSelfie] = useState(null);
    const [clockInType, setClockInType] = useState(null); // 'in' or 'out'
    const [isProcessing, setIsProcessing] = useState(false);

    // Fetch user's attendance history
    useEffect(() => {
        if (!currentUser) return;

        const q = query(
            collection(db, 'attendance'), 
            where('userId', '==', currentUser.id)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const history = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            history.sort((a, b) => new Date(b.date) - new Date(a.date)); // Manual sort
            setAttendanceHistory(history);

            const todayStr = new Date().toISOString().slice(0, 10);
            const todayRecord = history.find(rec => rec.date === todayStr);
            setTodayAttendance(todayRecord || null);
        }, (err) => {
            console.error("Error fetching attendance: ", err);
            setError("Gagal memuat riwayat absensi.");
        });

        return () => unsubscribe();
    }, [currentUser]);

    // Fetch all attendance data for admin view
    useEffect(() => {
        if (currentUser.role !== 'manajemen') return;

        const q = query(collection(db, 'attendance'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const allRecords = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            allRecords.sort((a, b) => new Date(b.date) - new Date(a.date)); // Manual sort
            setAllAttendance(allRecords);
        }, (err) => {
            console.error("Error fetching all attendance: ", err);
            setError("Gagal memuat jurnal absensi.");
        });

        return () => unsubscribe();
    }, [currentUser.role]);

    const groupedAttendance = useMemo(() => {
        if (currentUser.role !== 'manajemen') return {};
        return allAttendance.reduce((acc, record) => {
            const role = record.userRole || 'Lainnya';
            if (!acc[role]) {
                acc[role] = [];
            }
            acc[role].push(record);
            return acc;
        }, {});
    }, [allAttendance, currentUser.role]);


    const openCamera = async (type) => {
        setClockInType(type);
        setSelfie(null);
        setError('');
        
        // Get Location First
        if (!navigator.geolocation) {
            setError("Geolocation tidak didukung oleh browser Anda.");
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                });
            },
            () => {
                setError("Tidak dapat mengakses lokasi. Pastikan Anda memberikan izin.");
            }
        );

        // Then open camera
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
                setIsCameraOpen(true);
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (err) {
                console.error("Error accessing camera:", err);
                setError("Tidak dapat mengakses kamera. Pastikan Anda memberikan izin.");
            }
        } else {
            setError("Kamera tidak didukung oleh browser Anda.");
        }
    };

    const takeSelfie = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
            setSelfie(canvas.toDataURL('image/png'));
            closeCameraStream();
        }
    };
    
    const closeCameraStream = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(track => track.stop());
        }
    };

    const handleClockIn = async () => {
        setIsProcessing(true);
        try {
            await addDoc(collection(db, 'attendance'), {
                userId: currentUser.id,
                userName: currentUser.name,
                userRole: currentUser.role,
                date: new Date().toISOString().slice(0, 10),
                clockInTime: serverTimestamp(),
                clockInLocation: location,
                clockOutTime: null,
                clockOutLocation: null,
            });
            showModal({ title: 'Sukses', children: <p>Berhasil melakukan clock in.</p> });
        } catch (e) {
            console.error("Error clocking in: ", e);
            setError("Gagal melakukan clock in.");
            showModal({ title: 'Error', children: <p>Gagal melakukan clock in.</p> });
        } finally {
            setIsProcessing(false);
            setIsCameraOpen(false);
            setSelfie(null);
            closeCameraStream();
        }
    };

    const handleClockOut = async () => {
        if (!todayAttendance) {
            showModal({ title: 'Peringatan', children: <p>Anda harus clock in terlebih dahulu sebelum clock out.</p> });
            return;
        }
        setIsProcessing(true);
        try {
            const attendanceDocRef = doc(db, 'attendance', todayAttendance.id);
            await updateDoc(attendanceDocRef, {
                clockOutTime: serverTimestamp(),
                clockOutLocation: location,
            });
            showModal({ title: 'Sukses', children: <p>Berhasil melakukan clock out.</p> });
        } catch (e) {
            console.error("Error clocking out: ", e);
            setError("Gagal melakukan clock out.");
            showModal({ title: 'Error', children: <p>Gagal melakukan clock out.</p> });
        } finally {
            setIsProcessing(false);
            setIsCameraOpen(false);
            setSelfie(null);
            closeCameraStream();
        }
    };

    const handleConfirmAttendance = async () => {
        if (!location) {
             showModal({ title: 'Error', children: <p>Lokasi tidak terdeteksi. Tidak bisa melanjutkan absensi.</p> });
             return;
        }
        
        if (clockInType === 'in') {
            await handleClockIn();
        } else if (clockInType === 'out') {
            await handleClockOut();
        }
    };

    const CameraModal = () => (
        <CustomModal show={isCameraOpen} onClose={() => { setIsCameraOpen(false); closeCameraStream(); }} title={`Absen - Ambil Foto Selfie`}>
            <div>
                {error && <p className="text-red-500 mb-2">{error}</p>}
                <div className="relative bg-black rounded-md overflow-hidden">
                    {selfie ? (
                        <img src={selfie} alt="Selfie" className="w-full h-auto" />
                    ) : (
                        <video ref={videoRef} autoPlay playsInline className="w-full h-auto"></video>
                    )}
                    <canvas ref={canvasRef} className="hidden"></canvas>
                </div>
                <div className="mt-4 flex justify-between items-center">
                    <div>
                        <p className="text-sm font-semibold flex items-center"><MapPin size={14} className="mr-1"/> Lokasi Terdeteksi</p>
                        {location ? <p className="text-xs">{location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}</p> : <p className="text-xs text-gray-500">Mencari lokasi...</p>}
                    </div>
                    {selfie ? (
                        <div className="space-x-2">
                           <button onClick={() => openCamera(clockInType)} className="bg-gray-500 text-white px-4 py-2 rounded-md">Ulangi</button>
                           <button onClick={handleConfirmAttendance} disabled={isProcessing} className="bg-indigo-600 text-white px-4 py-2 rounded-md disabled:bg-indigo-400">{isProcessing ? <Loader2 className="animate-spin"/> : 'Konfirmasi Absen'}</button>
                        </div>
                    ) : (
                        <button onClick={takeSelfie} className="bg-blue-500 text-white px-4 py-2 rounded-md flex items-center gap-2"><Camera size={16}/> Ambil Gambar</button>
                    )}
                </div>
            </div>
        </CustomModal>
    );

    const PersonalView = () => (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="font-bold text-lg mb-4">Absen Hari Ini</h3>
                    <div className="flex space-x-4">
                        <button 
                            onClick={() => openCamera('in')} 
                            className="flex-1 bg-green-500 text-white font-bold py-3 rounded-lg hover:bg-green-600 flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                            disabled={!!todayAttendance || isProcessing}
                        >
                            {isProcessing && clockInType === 'in' ? <Loader2 className="animate-spin" /> : <Camera size={20}/>} Clock In
                        </button>
                        <button 
                            onClick={() => openCamera('out')} 
                            className="flex-1 bg-red-500 text-white font-bold py-3 rounded-lg hover:bg-red-600 flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                            disabled={!todayAttendance || !!todayAttendance?.clockOutTime || isProcessing}
                        >
                            {isProcessing && clockInType === 'out' ? <Loader2 className="animate-spin" /> : <Camera size={20}/>} Clock Out
                        </button>
                    </div>
                    <div className="mt-4 text-center text-gray-600">
                        <p>Status: <span className="font-semibold text-gray-800">
                            {!todayAttendance ? 'Belum Absen' : (todayAttendance.clockOutTime ? 'Selesai Absen' : 'Sudah Clock In')}
                        </span></p>
                        <p>Jam Masuk: {todayAttendance?.clockInTime ? todayAttendance.clockInTime.toDate().toLocaleTimeString('id-ID') : '-'}</p>
                        <p>Jam Keluar: {todayAttendance?.clockOutTime ? todayAttendance.clockOutTime.toDate().toLocaleTimeString('id-ID') : '-'}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                     <h3 className="font-bold text-lg mb-4">Informasi Lokasi</h3>
                     <div className="h-40 bg-gray-200 rounded-lg flex items-center justify-center">
                        <p className="text-gray-500">Peta akan ditampilkan di sini</p>
                     </div>
                     <p className="text-sm text-gray-500 mt-2">Lokasi Terdeteksi: {location ? `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}` : '-'}</p>
                </div>
            </div>

            <div>
                <h3 className="font-bold text-lg mb-4">Riwayat Absensi Saya</h3>
                <div className="bg-white rounded-lg shadow overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-sky-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-gray-700 font-medium">Tanggal</th>
                                <th className="px-6 py-3 text-left text-gray-700 font-medium">Jam Masuk</th>
                                <th className="px-6 py-3 text-left text-gray-700 font-medium">Lokasi Masuk</th>
                                <th className="px-6 py-3 text-left text-gray-700 font-medium">Jam Keluar</th>
                                <th className="px-6 py-3 text-left text-gray-700 font-medium">Lokasi Keluar</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {attendanceHistory.length > 0 ? attendanceHistory.map(rec => (
                                <tr key={rec.id}>
                                    <td className="px-6 py-4">{rec.date}</td>
                                    <td className="px-6 py-4">{rec.clockInTime?.toDate().toLocaleTimeString('id-ID')}</td>
                                    <td className="px-6 py-4 text-xs">{rec.clockInLocation ? `${rec.clockInLocation.latitude.toFixed(4)}, ${rec.clockInLocation.longitude.toFixed(4)}` : '-'}</td>
                                    <td className="px-6 py-4">{rec.clockOutTime?.toDate().toLocaleTimeString('id-ID') || '-'}</td>
                                    <td className="px-6 py-4 text-xs">{rec.clockOutLocation ? `${rec.clockOutLocation.latitude.toFixed(4)}, ${rec.clockOutLocation.longitude.toFixed(4)}` : '-'}</td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="5" className="text-center py-4 text-gray-500">Belum ada riwayat absensi.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );

    const JournalView = () => {
        const exportColumns = [
            { header: 'Nama Karyawan', accessor: r => r.userName },
            { header: 'Tanggal', accessor: r => r.date },
            { header: 'Jam Masuk', accessor: r => r.clockInTime?.toDate().toLocaleTimeString('id-ID') || '' },
            { header: 'Lokasi Masuk', accessor: r => r.clockInLocation ? `${r.clockInLocation.latitude}, ${r.clockInLocation.longitude}`: '' },
            { header: 'Jam Keluar', accessor: r => r.clockOutTime?.toDate().toLocaleTimeString('id-ID') || '' },
            { header: 'Lokasi Keluar', accessor: r => r.clockOutLocation ? `${r.clockOutLocation.latitude}, ${r.clockOutLocation.longitude}`: '' },
        ];
        
        return (
            <div className="space-y-8">
                {Object.entries(groupedAttendance).map(([role, records]) => (
                    <div key={role}>
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-xl font-semibold capitalize text-gray-700">{role.replace(/_/g, ' ')}</h3>
                            <ExportButtons 
                                data={records}
                                title={`Jurnal_Absensi_${role}`}
                                columns={exportColumns}
                                scriptsReady={scriptsReady}
                            />
                        </div>
                        <div className="bg-white rounded-lg shadow overflow-x-auto">
                           <table className="min-w-full divide-y divide-gray-200">
                               <thead className="bg-sky-200">
                                   <tr>
                                       <th className="px-6 py-3 text-left text-gray-700 font-medium">Nama</th>
                                       <th className="px-6 py-3 text-left text-gray-700 font-medium">Tanggal</th>
                                       <th className="px-6 py-3 text-left text-gray-700 font-medium">Jam Masuk</th>
                                       <th className="px-6 py-3 text-left text-gray-700 font-medium">Jam Keluar</th>
                                   </tr>
                               </thead>
                               <tbody className="bg-white divide-y divide-gray-200">
                                   {records.map(rec => (
                                       <tr key={rec.id}>
                                           <td className="px-6 py-4">{rec.userName}</td>
                                           <td className="px-6 py-4">{rec.date}</td>
                                           <td className="px-6 py-4">{rec.clockInTime?.toDate().toLocaleTimeString('id-ID')}</td>
                                           <td className="px-6 py-4">{rec.clockOutTime?.toDate().toLocaleTimeString('id-ID') || '-'}</td>
                                       </tr>
                                   ))}
                               </tbody>
                           </table>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="p-6">
            <CameraModal />
            <h2 className="text-2xl font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-700 p-4 rounded-lg shadow-md mb-6">Absensi Kehadiran</h2>
            
            {currentUser.role === 'manajemen' && (
                 <div className="mb-6 border-b border-gray-200">
                    <nav className="flex space-x-4" aria-label="Tabs">
                        <button onClick={() => setActiveTab('personal')} className={`px-3 py-2 font-medium text-sm rounded-t-lg ${activeTab === 'personal' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>Absensi Saya</button>
                        <button onClick={() => setActiveTab('journal')} className={`px-3 py-2 font-medium text-sm rounded-t-lg ${activeTab === 'journal' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>Jurnal Absensi Karyawan</button>
                    </nav>
                </div>
            )}
            
            {activeTab === 'personal' ? <PersonalView /> : <JournalView />}
        </div>
    );
};


// --- [BARU] Komponen Modul Penggajian ---
const PayrollModule = ({ currentUser, users, branches, attendance, salaryStructures, payrollHistory, showModal, hideModal, scriptsReady, appSettings }) => {
    const [activeTab, setActiveTab] = useState('dashboard');

    // ##### TAB 1: DASHBOARD #####
    const DashboardTab = () => (
        <div>
            <h3 className="text-xl font-bold mb-4">Ringkasan Penggajian</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg shadow"><h4 className="text-gray-500">Total Karyawan</h4><p className="text-2xl font-bold">{users.filter(u => u.role !== 'pasien').length}</p></div>
                <div className="bg-white p-4 rounded-lg shadow"><h4 className="text-gray-500">Total Gaji (Bulan Lalu)</h4><p className="text-2xl font-bold">{formatCurrency(payrollHistory[0]?.totalAmount || 0)}</p></div>
                <div className="bg-white p-4 rounded-lg shadow"><h4 className="text-gray-500">Payroll Berikutnya</h4><p className="text-2xl font-bold">30 September 2025</p></div>
            </div>
        </div>
    );

    // ##### TAB 2: SALARY STRUCTURE MANAGEMENT #####
    const SalaryStructureTab = () => {
        const [showForm, setShowForm] = useState(false);
        const [editingStructure, setEditingStructure] = useState(null);
        const [formData, setFormData] = useState({ role: '', baseSalary: 0, transportAllowance: 0, mealAllowance: 0 });

        const employeeRoles = ['manajemen', 'doctor_expert', 'doctor', 'staf_operasional', 'perawat', 'cleaning_service'];
        const existingRoles = salaryStructures.map(s => s.id);
        const availableRoles = employeeRoles.filter(r => !existingRoles.includes(r));

        const resetForm = () => {
            setFormData({ role: '', baseSalary: 0, transportAllowance: 0, mealAllowance: 0 });
            setEditingStructure(null);
            setShowForm(false);
        };

        const handleEdit = (structure) => {
            setEditingStructure(structure);
            setFormData({
                role: structure.id,
                baseSalary: structure.baseSalary || 0,
                transportAllowance: structure.transportAllowance || 0,
                mealAllowance: structure.mealAllowance || 0,
            });
            setShowForm(true);
        };
        
        const handleSubmit = async (e) => {
            e.preventDefault();
            const dataToSave = {
                baseSalary: Number(formData.baseSalary),
                transportAllowance: Number(formData.transportAllowance),
                mealAllowance: Number(formData.mealAllowance),
            };
            try {
                await setDoc(doc(db, 'salaryStructures', formData.role), dataToSave);
                resetForm();
                showModal({title: 'Sukses', children: <p>Struktur gaji berhasil disimpan.</p>});
            } catch (error) {
                console.error("Error saving salary structure:", error);
                showModal({title: 'Error', children: <p>Gagal menyimpan struktur gaji.</p>});
            }
        };

        const handleDelete = (roleId) => {
            showModal({
                title: 'Konfirmasi Hapus',
                children: `Anda yakin ingin menghapus struktur gaji untuk role "${roleId}"?`,
                footer: (
                    <>
                        <button onClick={hideModal} className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md">Batal</button>
                        <button onClick={async () => {
                            try {
                                await deleteDoc(doc(db, 'salaryStructures', roleId));
                                hideModal();
                            } catch (error) { console.error("Error deleting salary structure:", error); }
                        }} className="bg-red-600 text-white px-4 py-2 rounded-md">Hapus</button>
                    </>
                )
            });
        };

        return (
            <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
                    <h3 className="text-xl font-bold">Pengaturan Struktur Gaji per Jabatan</h3>
                    <div className="flex items-center gap-2 flex-wrap">
                        <ExportButtons 
                            data={salaryStructures}
                            title="Struktur_Gaji"
                            columns={[
                                { header: 'Jabatan', accessor: s => s.id.replace(/_/g, ' ') },
                                { header: 'Gaji Pokok', accessor: s => s.baseSalary || 0 },
                                { header: 'Tunjangan Transportasi', accessor: s => s.transportAllowance || 0 },
                                { header: 'Tunjangan Makan', accessor: s => s.mealAllowance || 0 },
                            ]}
                            scriptsReady={scriptsReady}
                        />
                        <button onClick={() => { resetForm(); setShowForm(true); }} className="bg-indigo-600 text-white px-4 py-2 rounded-md flex items-center"><PlusCircle size={16} className="mr-2"/> Tambah Struktur</button>
                    </div>
                </div>

                {showForm && (
                    <CustomModal show={showForm} onClose={resetForm} title={editingStructure ? `Edit Struktur: ${editingStructure.id}` : 'Tambah Struktur Gaji Baru'}>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label>Jabatan (Role)</label>
                                <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="mt-1 block w-full rounded-md" required disabled={!!editingStructure}>
                                    <option value="">Pilih Jabatan</option>
                                    {editingStructure && <option value={editingStructure.id}>{editingStructure.id}</option>}
                                    {availableRoles.map(r => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
                                </select>
                            </div>
                            <div><label>Gaji Pokok</label><input type="number" value={formData.baseSalary} onChange={e => setFormData({...formData, baseSalary: e.target.value})} className="mt-1 block w-full" required/></div>
                            <div><label>Tunjangan Transportasi</label><input type="number" value={formData.transportAllowance} onChange={e => setFormData({...formData, transportAllowance: e.target.value})} className="mt-1 block w-full"/></div>
                            <div><label>Tunjangan Makan</label><input type="number" value={formData.mealAllowance} onChange={e => setFormData({...formData, mealAllowance: e.target.value})} className="mt-1 block w-full"/></div>
                            <div className="flex justify-end space-x-2 pt-4">
                                <button type="button" onClick={resetForm} className="bg-gray-500 text-white px-4 py-2 rounded-md">Batal</button>
                                <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-md">Simpan</button>
                            </div>
                        </form>
                    </CustomModal>
                )}

                <div className="overflow-x-auto"><table className="min-w-full divide-y responsive-table"><thead className="bg-violet-200"><tr><th className="px-4 py-2 text-left text-gray-700 font-medium">Jabatan</th><th className="px-4 py-2 text-right text-gray-700 font-medium">Gaji Pokok</th><th className="px-4 py-2 text-right text-gray-700 font-medium">Tunj. Transport</th><th className="px-4 py-2 text-right text-gray-700 font-medium">Tunj. Makan</th><th className="px-4 py-2 text-center text-gray-700 font-medium">Aksi</th></tr></thead><tbody className="bg-white divide-y">{salaryStructures.map(s => (<tr key={s.id}><td className="px-4 py-2 font-medium capitalize" data-label="Jabatan">{s.id.replace(/_/g, ' ')}</td><td className="px-4 py-2 text-right" data-label="Gaji Pokok">{formatCurrency(s.baseSalary)}</td><td className="px-4 py-2 text-right" data-label="Tunj. Transport">{formatCurrency(s.transportAllowance)}</td><td className="px-4 py-2 text-right" data-label="Tunj. Makan">{formatCurrency(s.mealAllowance)}</td><td className="px-4 py-2 text-center" data-label="Aksi"><button onClick={() => handleEdit(s)} className="text-indigo-600 mr-3"><Edit size={16}/></button><button onClick={() => handleDelete(s.id)} className="text-red-600"><Trash2 size={16}/></button></td></tr>))}</tbody></table></div>
            </div>
        );
    };

    // ##### TAB 3: PROCESS PAYROLL #####
    const ProcessPayrollTab = () => {
        const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));
        const [isProcessing, setIsProcessing] = useState(false);
        
        const payrollData = useMemo(() => {
            const [year, month] = period.split('-').map(Number);
            const employees = users.filter(u => u.role?.toLowerCase() !== 'pasien');
            return employees.map(employee => {
                const structure = salaryStructures.find(s => s.id === employee.role) || { baseSalary: 0, transportAllowance: 0, mealAllowance: 0 };
                const employeeAttendance = attendance.filter(a => a.userId === employee.id && a.date.startsWith(period));
                const daysPresent = employeeAttendance.length;
                const workingDays = 22; 
                const daysAbsent = Math.max(0, workingDays - daysPresent);
                const dailyRate = (structure.baseSalary || 0) / workingDays;
                const deductions = daysAbsent * dailyRate;
                const grossSalary = (structure.baseSalary || 0) + (structure.transportAllowance || 0) + (structure.mealAllowance || 0);
                const netSalary = grossSalary - deductions;
                return { ...employee, ...structure, daysPresent, daysAbsent, deductions, grossSalary, netSalary };
            });
        }, [period, users, salaryStructures, attendance]);

        const totalNetSalary = useMemo(() => payrollData.reduce((sum, emp) => sum + emp.netSalary, 0), [payrollData]);

        const handleRunPayroll = async () => {
            setIsProcessing(true);
            try {
                const historyDocRef = doc(db, 'payrollHistory', period);
                const historyDoc = await getDoc(historyDocRef);
                if (historyDoc.exists()) {
                    showModal({title: 'Peringatan', children: <p>Penggajian untuk periode {period} sudah pernah dijalankan.</p>});
                    setIsProcessing(false);
                    return;
                }
                await setDoc(historyDocRef, { period: period, processedAt: serverTimestamp(), processedBy: currentUser.email, totalAmount: totalNetSalary, employeeData: payrollData });
                await addDoc(collection(db, 'expenses'), { date: new Date().toISOString().slice(0, 10), description: `Biaya Gaji Karyawan - Periode ${period}`, amount: totalNetSalary, category: 'SALARY', branchId: 'pusat' });
                showModal({title: 'Sukses', children: <p>Penggajian untuk periode {period} berhasil dijalankan dan dicatat sebagai beban.</p>});
            } catch (error) {
                console.error("Error running payroll:", error);
                showModal({title: 'Error', children: <p>Terjadi kesalahan saat menjalankan penggajian.</p>});
            } finally {
                setIsProcessing(false);
            }
        };
        
        const exportColumns = [
            { header: 'Nama Karyawan', accessor: r => r.name || '' },
            { header: 'Jabatan', accessor: r => (r.role || '').replace(/_/g, ' ') },
            { header: 'Hari Hadir', accessor: r => r.daysPresent || 0 },
            { header: 'Gaji Pokok', accessor: r => r.baseSalary || 0 },
            { header: 'Tunjangan', accessor: r => (r.transportAllowance || 0) + (r.mealAllowance || 0) },
            { header: 'Potongan Absensi', accessor: r => r.deductions || 0 },
            { header: 'Gaji Bersih', accessor: r => r.netSalary || 0 },
        ];

        return (
            <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                    <h3 className="text-xl font-bold">Proses Penggajian</h3>
                    <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-2">
                            <label htmlFor="payroll-period">Periode:</label>
                            <input type="month" id="payroll-period" value={period} onChange={e => setPeriod(e.target.value)} className="p-2 border rounded-md"/>
                        </div>
                        <ExportButtons 
                            data={payrollData}
                            title={`Proses_Gaji_${period}`}
                            columns={exportColumns}
                            scriptsReady={scriptsReady}
                        />
                    </div>
                </div>
                <div className="overflow-x-auto"><table className="min-w-full divide-y responsive-table"><thead className="bg-violet-200"><tr><th className="px-4 py-2 text-left text-gray-700 font-medium">Nama</th><th className="px-4 py-2 text-right text-gray-700 font-medium">Gaji Pokok</th><th className="px-4 py-2 text-right text-gray-700 font-medium">Tunjangan</th><th className="px-4 py-2 text-right text-gray-700 font-medium">Potongan</th><th className="px-4 py-2 text-right text-gray-700 font-medium">Gaji Bersih</th></tr></thead><tbody className="bg-white divide-y">{payrollData.map(emp => (<tr key={emp.id}><td className="px-4 py-2" data-label="Nama"><p className="font-medium">{emp.name}</p><p className="text-sm text-gray-500 capitalize">{emp.role.replace(/_/g, ' ')}</p></td><td className="px-4 py-2 text-right" data-label="Gaji Pokok">{formatCurrency(emp.baseSalary)}</td><td className="px-4 py-2 text-right" data-label="Tunjangan">{formatCurrency(emp.transportAllowance + emp.mealAllowance)}</td><td className="px-4 py-2 text-right text-red-600" data-label="Potongan">{formatCurrency(emp.deductions)}</td><td className="px-4 py-2 text-right font-bold" data-label="Gaji Bersih">{formatCurrency(emp.netSalary)}</td></tr>))}</tbody><tfoot className="bg-gray-100 font-bold"><tr><td colSpan="4" className="px-4 py-2 text-right">Total Gaji Bersih</td><td className="px-4 py-2 text-right">{formatCurrency(totalNetSalary)}</td></tr></tfoot></table></div>
                <div className="mt-6 flex justify-end"><button onClick={handleRunPayroll} disabled={isProcessing} className="bg-green-600 text-white font-bold py-2 px-6 rounded-md hover:bg-green-700 disabled:bg-gray-400">{isProcessing ? <Loader2 className="animate-spin"/> : 'Jalankan & Catat Penggajian'}</button></div>
            </div>
        );
    };

    // ##### TAB 4: REPORTS & PAYSLIPS #####
    const ReportsTab = () => {
        const [selectedPeriod, setSelectedPeriod] = useState('');
        const [selectedEmployee, setSelectedEmployee] = useState(null);

        useEffect(() => {
            if (payrollHistory.length > 0 && !selectedPeriod) {
                setSelectedPeriod(payrollHistory[0].id);
            }
        }, [payrollHistory, selectedPeriod]);

        const periodData = useMemo(() => {
            if (!selectedPeriod) return null;
            return payrollHistory.find(p => p.id === selectedPeriod);
        }, [selectedPeriod, payrollHistory]);

        const Payslip = ({ employeeData, period }) => {
            const payslipRef = useRef(null);

            const handleExportPdf = () => {
                if (!window.jspdf) {
                    showModal({ title: 'Error', children: 'Library untuk PDF belum siap.' });
                    return;
                }
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF();

                // Header
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(20);
                doc.text('SLIP GAJI', 15, 20);
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(12);
                doc.text(`Periode: ${period}`, 15, 30);

                doc.setFontSize(10);
                doc.text(`${appSettings.clinicName || "Klinik Sibiomasi"}`, 15, 45);
                doc.text(`Karyawan: ${employeeData.name}`, 15, 55);
                doc.text(`Jabatan: ${(employeeData.role || '').replace(/_/g, ' ')}`, 15, 65);

                // Table
                const tableData = [
                    [{ content: 'Pendapatan', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [230, 230, 230] } }],
                    ['Gaji Pokok', formatCurrency(employeeData.baseSalary)],
                    ['Tunjangan Transportasi', formatCurrency(employeeData.transportAllowance)],
                    ['Tunjangan Makan', formatCurrency(employeeData.mealAllowance)],
                    [{ content: 'Total Pendapatan', styles: { fontStyle: 'bold' } }, { content: formatCurrency(employeeData.grossSalary), styles: { fontStyle: 'bold' } }],
                    [{ content: 'Potongan', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [230, 230, 230] } }],
                    [`Potongan Absensi (${employeeData.daysAbsent} hari)`, `(${formatCurrency(employeeData.deductions)})`],
                    [{ content: 'Total Potongan', styles: { fontStyle: 'bold' } }, { content: `(${formatCurrency(employeeData.deductions)})`, styles: { fontStyle: 'bold' } }],
                ];

                doc.autoTable({
                    startY: 80,
                    head: [['Deskripsi', 'Jumlah']],
                    body: tableData,
                    theme: 'striped',
                    headStyles: { fillColor: [44, 62, 80] },
                });

                // Footer / Total
                const finalY = doc.lastAutoTable.finalY + 20;
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.text('Gaji Bersih (Take Home Pay)', 15, finalY);
                doc.text(formatCurrency(employeeData.netSalary), 195, finalY, { align: 'right' });

                doc.save(`Slip_Gaji_${employeeData.name.replace(/ /g, '_')}_${period}.pdf`);
            };

            const handleShareWhatsApp = () => {
                const text = `*Slip Gaji Periode: ${period}*\n\n` +
                             `*Karyawan:* ${employeeData.name}\n` +
                             `*Jabatan:* ${(employeeData.role || '').replace(/_/g, ' ')}\n\n` +
                             `*Gaji Pokok:* ${formatCurrency(employeeData.baseSalary)}\n` +
                             `*Tunjangan:* ${formatCurrency((employeeData.transportAllowance || 0) + (employeeData.mealAllowance || 0))}\n` +
                             `*Potongan:* ${formatCurrency(employeeData.deductions)}\n` +
                             `--------------------------\n` +
                             `*Gaji Bersih:* *${formatCurrency(employeeData.netSalary)}*\n\n` +
                             `_Ini adalah pemberitahuan otomatis dari sistem penggajian._`;
                const encodedText = encodeURIComponent(text);
                window.open(`https://wa.me/?text=${encodedText}`, '_blank');
            };
            
            const printPayslip = () => {
                if (!payslipRef.current) return;
                const printContents = payslipRef.current.innerHTML;
                const originalContents = document.body.innerHTML;
                document.body.innerHTML = `<style>@media print { body { -webkit-print-color-adjust: exact; } #payslip-to-print { padding: 0 !important; } }</style>${printContents}`;
                window.print();
                document.body.innerHTML = originalContents;
                window.location.reload();
            };
            
            const payslipExportData = [
                { item: 'Gaji Pokok', type: 'Pendapatan', amount: employeeData.baseSalary || 0 },
                { item: 'Tunjangan Transportasi', type: 'Pendapatan', amount: employeeData.transportAllowance || 0 },
                { item: 'Tunjangan Makan', type: 'Pendapatan', amount: employeeData.mealAllowance || 0 },
                { item: `Potongan Absensi (${employeeData.daysAbsent} hari)`, type: 'Potongan', amount: -(employeeData.deductions || 0) },
                { item: 'Total Gaji Bersih', type: 'Total', amount: employeeData.netSalary || 0 },
            ];

            return (
                <div>
                     <div id="payslip-to-print" ref={payslipRef} className="font-sans text-sm bg-white p-4">
                        <div className="p-2 border-b-4 border-indigo-600">
                            <h2 className="text-2xl font-bold text-indigo-600">SLIP GAJI</h2>
                            <p className="text-gray-500">Periode: {period}</p>
                        </div>
                        <div className="p-2 grid grid-cols-2 gap-4 mt-2">
                            <div><h3 className="font-bold">{appSettings.clinicName || "Klinik Sibiomasi"}</h3><p>Jl. Kesehatan No. 123</p></div>
                            <div className="text-right"><h3 className="font-bold">{employeeData.name}</h3><p className="capitalize">{employeeData.role.replace(/_/g, ' ')}</p></div>
                        </div>
                        <div className="p-2">
                            <table className="w-full text-xs">
                                <thead className="bg-gray-100"><tr><th className="p-1 text-left">Deskripsi</th><th className="p-1 text-right">Jumlah</th></tr></thead>
                                <tbody>
                                    <tr className="border-b"><td className="p-1 font-semibold text-green-700" colSpan="2">Pendapatan</td></tr>
                                    <tr className="border-b"><td className="p-1 pl-2">Gaji Pokok</td><td className="p-1 text-right">{formatCurrency(employeeData.baseSalary)}</td></tr>
                                    <tr className="border-b"><td className="p-1 pl-2">Tunjangan Transportasi</td><td className="p-1 text-right">{formatCurrency(employeeData.transportAllowance)}</td></tr>
                                    <tr className="border-b"><td className="p-1 pl-2">Tunjangan Makan</td><td className="p-1 text-right">{formatCurrency(employeeData.mealAllowance)}</td></tr>
                                    <tr className="border-b bg-gray-50"><td className="p-1 font-semibold">Total Pendapatan</td><td className="p-1 text-right font-semibold">{formatCurrency(employeeData.grossSalary)}</td></tr>
                                    
                                    <tr className="border-b"><td className="p-1 font-semibold text-red-700" colSpan="2">Potongan</td></tr>
                                    <tr className="border-b"><td className="p-1 pl-2">Potongan Absensi ({employeeData.daysAbsent} hari)</td><td className="p-1 text-right">({formatCurrency(employeeData.deductions)})</td></tr>
                                    <tr className="border-b bg-gray-50"><td className="p-1 font-semibold">Total Potongan</td><td className="p-1 text-right font-semibold">({formatCurrency(employeeData.deductions)})</td></tr>
                                </tbody>
                                <tfoot className="bg-indigo-50 font-bold">
                                    <tr><td className="p-2">Gaji Bersih (Take Home Pay)</td><td className="p-2 text-right">{formatCurrency(employeeData.netSalary)}</td></tr>
                                </tfoot>
                            </table>
                        </div>
                     </div>
                     <div className="flex justify-end p-4 bg-gray-100 rounded-b-lg gap-2 flex-wrap">
                        <ExportButtons 
                            data={payslipExportData}
                            title={`Slip_Gaji_${employeeData.name.replace(/ /g, '_')}_${period}`}
                            columns={[
                                { header: 'Deskripsi', accessor: r => r.item },
                                { header: 'Tipe', accessor: r => r.type },
                                { header: 'Jumlah', accessor: r => r.amount },
                            ]}
                            scriptsReady={scriptsReady}
                            customPdfHandler={handleExportPdf}
                        />
                        <button onClick={handleShareWhatsApp} className="bg-green-500 text-white px-3 py-2 rounded-md text-sm flex items-center gap-1"><MessageSquare size={14}/> Bagikan WA</button>
                        <button onClick={printPayslip} className="bg-indigo-600 text-white px-3 py-2 rounded-md text-sm">Cetak</button>
                     </div>
                </div>
            )
        };

        return (
            <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">Laporan & Slip Gaji</h3>
                    <select value={selectedPeriod} onChange={e => setSelectedPeriod(e.target.value)} className="p-2 border rounded-md">
                        <option value="">Pilih Periode</option>
                        {payrollHistory.map(p => <option key={p.id} value={p.id}>{p.id}</option>)}
                    </select>
                </div>

                {periodData ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y responsive-table">
                            <thead className="bg-violet-200"><tr><th className="px-4 py-2 text-left text-gray-700 font-medium">Nama</th><th className="px-4 py-2 text-right text-gray-700 font-medium">Gaji Bersih</th><th className="px-4 py-2 text-center text-gray-700 font-medium">Aksi</th></tr></thead>
                            <tbody className="bg-white divide-y">
                                {periodData.employeeData.map(emp => (
                                    <tr key={emp.id}>
                                        <td className="px-4 py-2" data-label="Nama">{emp.name}</td>
                                        <td className="px-4 py-2 text-right" data-label="Gaji Bersih">{formatCurrency(emp.netSalary)}</td>
                                        <td className="px-4 py-2 text-center" data-label="Aksi"><button onClick={() => setSelectedEmployee(emp)} className="text-indigo-600 hover:underline text-sm">Lihat Slip</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : <p>Pilih periode untuk melihat laporan.</p>}
                
                {selectedEmployee && (
                    <CustomModal show={!!selectedEmployee} onClose={() => setSelectedEmployee(null)} title={`Slip Gaji: ${selectedEmployee.name}`}>
                        <Payslip employeeData={selectedEmployee} period={selectedPeriod} />
                    </CustomModal>
                )}
            </div>
        );
    };

    // ##### MAIN RENDER #####
    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard': return <DashboardTab />;
            case 'salary_structure': return <SalaryStructureTab />;
            case 'process': return <ProcessPayrollTab />;
            case 'reports': return <ReportsTab />;
            default: return <DashboardTab />;
        }
    };
    
    if (currentUser.role !== 'manajemen') {
        return <div className="p-6 text-center text-gray-500 italic">Modul ini hanya dapat diakses oleh Manajemen.</div>;
    }

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <h2 className="text-2xl font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-700 p-4 rounded-lg shadow-md mb-6">Manajemen Penggajian</h2>
            <div className="mb-6">
                <nav className="flex space-x-2 sm:space-x-4" aria-label="Tabs">
                    <button onClick={() => setActiveTab('dashboard')} className={`${activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-100'} whitespace-nowrap py-3 px-4 rounded-md font-semibold text-sm`}>Dasbor</button>
                    <button onClick={() => setActiveTab('salary_structure')} className={`${activeTab === 'salary_structure' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-100'} whitespace-nowrap py-3 px-4 rounded-md font-semibold text-sm`}>Struktur Gaji</button>
                    <button onClick={() => setActiveTab('process')} className={`${activeTab === 'process' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-100'} whitespace-nowrap py-3 px-4 rounded-md font-semibold text-sm`}>Proses Gaji</button>
                    <button onClick={() => setActiveTab('reports')} className={`${activeTab === 'reports' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-100'} whitespace-nowrap py-3 px-4 rounded-md font-semibold text-sm`}>Laporan & Slip Gaji</button>
                </nav>
            </div>
            <div>
                {renderContent()}
            </div>
        </div>
    );
};


// --- [BARU] Komponen Pemantauan Terapi HBOT ---
const HBOTManagement = ({ hbotSessions, users, branches, currentUser, showModal, hideModal }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBranch, setSelectedBranch] = useState('all');
    const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
    const [showForm, setShowForm] = useState(false);
    const [editingSession, setEditingSession] = useState(null);
    const [formData, setFormData] = useState({
        patientId: '', date: '', sessionNumber: 1, duration: 60, pressure: 1.5, branchId: '', status: 'scheduled'
    });

    const isManager = currentUser?.role === 'manajemen';

    const getPatientName = (patientId) => users.find(u => u.id === patientId)?.name || 'N/A';
    const getBranchName = (branchId) => branches.find(b => b.id === branchId)?.name || 'Pusat';

    const handleEdit = (session) => {
        setEditingSession(session);
        setFormData({ ...session });
        setShowForm(true);
    };

    const handleDelete = (id) => {
        showModal({
            title: 'Konfirmasi Hapus Sesi',
            children: <p>Apakah Anda yakin ingin menghapus sesi HBOT ini?</p>,
            footer: (
                <>
                    <button onClick={hideModal} className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-400">Batal</button>
                    <button
                        onClick={async () => {
                            try {
                                await deleteDoc(doc(db, "hbotSessions", id));
                                hideModal();
                            } catch (error) {
                                console.error("Gagal menghapus sesi:", error);
                                hideModal();
                                showModal({
                                    title: 'Error',
                                    children: <p>Gagal menghapus sesi. Mohon gunakan UI modal kustom di sini.</p>,
                                    footer: <button onClick={hideModal} className="bg-red-600 text-white px-4 py-2 rounded-md">Tutup</button>
                                });
                            }
                        }}
                        className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                    >
                        Hapus
                    </button>
                </>
            )
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingSession) {
                await updateDoc(doc(db, 'hbotSessions', editingSession.id), { ...formData, pressure: parseFloat(formData.pressure) });
            } else {
                await addDoc(collection(db, 'hbotSessions'), { ...formData, branchId: currentUser.branchId || null, pressure: parseFloat(formData.pressure) });
            }
            resetForm();
        } catch (error) {
            console.error("Gagal menyimpan sesi:", error);
            showModal({
                title: 'Error',
                children: <p>Gagal menyimpan sesi. Silakan coba lagi.</p>,
                footer: <button onClick={hideModal} className="bg-red-600 text-white px-4 py-2 rounded-md">Tutup</button>
            });
        }
    };

    const resetForm = () => {
        setFormData({ patientId: '', date: '', sessionNumber: 1, duration: 60, pressure: 1.5, branchId: '', status: 'scheduled' });
        setEditingSession(null);
        setShowForm(false);
    };

    const filteredSessions = useMemo(() => {
        return hbotSessions.filter(session => {
            const patientName = getPatientName(session.patientId)?.toLowerCase();
            const searchMatch = (patientName && patientName.includes(searchTerm.toLowerCase()));
            const branchMatch = isManager || session.branchId === currentUser.branchId || !currentUser.branchId;
            const startDateMatch = !dateRange.startDate || new Date(session.date) >= new Date(dateRange.startDate);
            const endDateMatch = !dateRange.endDate || new Date(session.date) <= new Date(dateRange.endDate);
            return searchMatch && branchMatch && startDateMatch && endDateMatch;
        });
    }, [hbotSessions, users, branches, searchTerm, selectedBranch, dateRange, currentUser]);

    const statusColors = {
        completed: 'bg-blue-100 text-blue-800',
        scheduled: 'bg-gray-100 text-gray-800',
    };

    const availablePatients = users.filter(u => u.role?.toLowerCase() === 'pasien' && (isManager || u.branchId === currentUser.branchId));

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-700 p-4 rounded-lg shadow-md mb-6">Pemantauan Terapi HBOT</h2>
            <div className="flex justify-end mb-6">
                <button onClick={() => setShowForm(true)} className="bg-indigo-600 text-white px-3 py-2 text-sm sm:px-4 rounded-md hover:bg-indigo-700 flex items-center">
                    <PlusCircle size={18} className="mr-2"/> Tambah Sesi
                </button>
            </div>

            {showForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
                        <h3 className="text-lg font-semibold mb-4">{editingSession ? 'Edit Sesi HBOT' : 'Tambah Sesi HBOT Baru'}</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div><label>Pasien</label><select value={formData.patientId} onChange={e => setFormData({...formData, patientId: e.target.value})} className="mt-1 block w-full rounded-md" required><option value="">Pilih Pasien</option>{availablePatients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
                                <div><label>Tanggal</label><input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="mt-1 block w-full rounded-md" required/></div>
                                <div><label>Sesi Ke-#</label><input type="number" value={formData.sessionNumber} onChange={e => setFormData({...formData, sessionNumber: e.target.value})} className="mt-1 block w-full rounded-md" min="1" required/></div>
                                <div><label>Durasi (Menit)</label><input type="number" value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} className="mt-1 block w-full rounded-md" min="1" required/></div>
                                <div><label>Tekanan (ATA)</label><input type="number" step="0.1" value={formData.pressure} onChange={e => setFormData({...formData, pressure: e.target.value})} className="mt-1 block w-full rounded-md" min="1" required/></div>
                                <div><label>Status</label><select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="mt-1 block w-full rounded-md" required><option value="scheduled">Scheduled</option><option value="completed">Completed</option></select></div>
                            </div>
                            <div className="flex space-x-4"><button type="submit" className="bg-indigo-600 text-white px-3 py-1.5 text-sm sm:px-4 sm:py-2 rounded-md">{editingSession ? 'Perbarui' : 'Simpan'}</button><button type="button" onClick={resetForm} className="bg-gray-500 text-white px-3 py-1.5 text-sm sm:px-4 sm:py-2 rounded-md">Batal</button></div>
                        </form>
                    </div>
                </div>
            )}

             <div className="bg-white p-4 rounded-lg shadow mb-6">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div>
                             <label className="block text-sm font-medium text-gray-700 mb-1">Cari Pasien</label>
                              <div className="relative">
                                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                   <input type="text" placeholder="Ketik nama pasien..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md"/>
                              </div>
                     </div>
                     {isManager && (
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Filter Cabang</label>
                              <select value={selectedBranch} onChange={e => setSelectedBranch(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md">
                                   <option value="all">Semua Cabang</option>
                                   {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                              </select>
                          </div>
                     )}
                     <div>
                             <label className="block text-sm font-medium text-gray-700 mb-1">Filter Tanggal Sesi</label>
                              <div className="flex items-center space-x-2">
                                  <input type="date" value={dateRange.startDate} onChange={e => setDateRange({...dateRange, startDate: e.target.value})} className="w-full p-1.5 border border-gray-300 rounded-md"/>
                                  <span className="text-gray-500">-</span>
                                  <input type="date" value={dateRange.endDate} onChange={e => setDateRange({...dateRange, endDate: e.target.value})} className="w-full p-1.5 border border-gray-300 rounded-md"/>
                              </div>
                     </div>
                    </div>
                 </div>

            <div className="bg-white rounded-lg shadow overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 responsive-table">
                    <thead className="bg-rose-200">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Tanggal</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Pasien</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Sesi Ke-#</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Durasi (Menit)</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Tekanan (ATA)</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Cabang</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase">Status</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredSessions.map(session => (
                            <tr key={session.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" data-label="Tanggal">{session.date}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900" data-label="Pasien">{getPatientName(session.patientId)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700" data-label="Sesi #">{session.sessionNumber}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700" data-label="Durasi">{session.duration}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700" data-label="Tekanan">{session.pressure}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" data-label="Cabang">{getBranchName(session.branchId)}</td>
                                 <td className="px-6 py-4 whitespace-nowrap text-center" data-label="Status">
                                      <span className={`px-2.5 py-1.5 text-xs font-medium rounded-full capitalize ${statusColors[session.status] || 'bg-gray-100 text-gray-800'}`}>
                                           {session.status}
                                      </span>
                                 </td>
                                 <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium" data-label="Aksi">
                                      <button onClick={() => handleEdit(session)} className="text-indigo-600 hover:text-indigo-900 mr-3">
                                           <Edit size={16}/>
                                      </button>
                                      <button onClick={() => handleDelete(session.id)} className="text-red-600 hover:text-red-900">
                                           <Trash2 size={16}/>
                                      </button>
                                 </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
