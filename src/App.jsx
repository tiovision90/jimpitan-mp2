import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, doc, setDoc, getDoc,
  onSnapshot, query, deleteDoc 
} from 'firebase/firestore';
import { 
  getAuth, signInAnonymously, onAuthStateChanged, 
  signInWithCustomToken 
} from 'firebase/auth';
import { 
  Moon, Sun, CheckCircle, XCircle, FileText, 
  LogOut, Shield, Users, Calendar, DollarSign, 
  ChevronRight, Save, AlertTriangle, Share2, 
  MessageSquare, Clock, BarChart3, TrendingUp,
  AlertCircle, ChevronDown, Filter, UserPlus, Trash2, MapPin, Heart, Star, X,
  Minus, Plus
} from 'lucide-react';

// --- KONFIGURASI FIREBASE ---
// PENTING: Ganti bagian ini dengan kode dari Firebase Console Anda
const firebaseConfig = {
 apiKey: "AIzaSyBw179pWqJPTTQUg8q-XR58I0ojK88JFuA",
  authDomain: "jimpitan-mp2.firebaseapp.com",
  projectId: "jimpitan-mp2",
  storageBucket: "jimpitan-mp2.firebasestorage.app",
  messagingSenderId: "271342461715",
  appId: "1:271342461715:web:a5c7eb3b1fdce3d06a30e6",
  measurementId: "G-599R7MEPCE"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- DATA WARGA MUNA PERMAI 2 ---
const RAW_DATA = {
  "Gang Arjuno": [
    "Pak Deni", "Pak Igna", "Pak Anif", "Pak Rois", "Pak Eko", 
    "Pak Tafib", "Pak Anas", "Pak Adna", "Pak Slamet", "Pak Andri", 
    "Pak Findry", "Pak Agus", "Pak Khabib", "Pak Yarie", "Pak Dexa"
  ],
  "Gang Sadewo": [
    "Pak Noor", "Pak Hendro", "Pak Lutfi", "Pak Nafi", "Pak Riki", 
    "Pak Handi", "Pak Yoppi", "Pak Adi", "Pak Afendi", 
    "Pak Taufik" 
  ],
  "Gang Bimo & Yudhistira": [
    "Pak Riyan Hidayat", "Pak Dwi", "Ibu Zaetin", "Pak Riyan Bengkel", 
    "Pak Febri", "Pak Candra", "Pak Wawan", "Pak Susilo", 
    "Pak Rian Zulfikar", "Pak Yogo", "Pak Ali", "Pak Himawan", 
    "Pak Suekwan", 
    "Pak Andre",
    "Pak Marlan", 
    "Ibu Kustiah" 
  ]
};

const generateHouses = () => {
  const houses = [];
  let counter = 1;
  
  Object.keys(RAW_DATA).forEach(gang => {
    RAW_DATA[gang].forEach(name => {
      houses.push({
        id: `H${counter}`,
        number: `No. ${counter}`, 
        name: name,
        gang: gang,
        password: '123' 
      });
      counter++;
    });
  });
  return houses;
};

const HOUSES = generateHouses();
const TOTAL_HOUSES = HOUSES.length;
const JIMPITAN_VALUE = 500;

// --- DATA HISTORIS (12-17 JANUARI 2026) ---
const HISTORICAL_LOGS = [
  {
    date: '2026-01-12',
    totalAmount: 11000,
    missedNames: [
      "Pak Nafi", "Pak Riki", "Pak Yoppi", "Pak Taufik", "Pak Handi", "Pak Febri", 
      "Pak Susilo", "Ibu Zaetin", "Pak Riyan Hidayat", "Pak Marlan", "Pak Andre", 
      "Pak Suekwan", "Pak Ali", "Pak Yogo", "Pak Agus", "Pak Dexa", "Pak Findry", 
      "Pak Adna", "Pak Tafib"
    ],
    officers: [],
    gang: '-'
  },
  {
    date: '2026-01-13',
    totalAmount: 15500,
    missedNames: [
      "Pak Tafib", "Pak Dexa", "Pak Riki", "Ibu Kustiah", "Pak Susilo", "Ibu Zaetin",
      "Pak Rian Zulfikar", "Pak Febri", "Pak Marlan", "Pak Yogo"
    ],
    officers: [],
    gang: '-'
  },
  {
    date: '2026-01-14',
    totalAmount: 28000,
    missedNames: [
      "Pak Anif", "Pak Adna", "Pak Yarie", "Pak Dexa", "Pak Findry", "Pak Riki"
    ],
    officers: [],
    gang: '-'
  },
  {
    date: '2026-01-15',
    totalAmount: 18500,
    missedNames: [
      "Ibu Kustiah", "Ibu Zaetin", "Pak Dexa", "Pak Findry"
    ],
    officers: [],
    gang: '-'
  },
  {
    date: '2026-01-16',
    totalAmount: 17500,
    missedNames: [
      "Pak Findry", "Pak Agus", "Pak Dexa", "Pak Adna", "Pak Rian Zulfikar", 
      "Pak Susilo", "Pak Handi", "Pak Taufik"
    ],
    officers: [],
    gang: '-'
  },
  {
    date: '2026-01-17',
    totalAmount: 21000,
    missedNames: [
      "Pak Adna", "Pak Dexa", "Pak Taufik"
    ],
    officers: ["Pak Eko", "Pak Rois"], 
    gang: 'Gang Arjuno'
  }
];

// --- KOMPONEN UTAMA ---
export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login'); 
  const [loading, setLoading] = useState(true);
  
  const [logs, setLogs] = useState([]);
  const [currentPatrolData, setCurrentPatrolData] = useState({});
  const [currentPatrolNote, setCurrentPatrolNote] = useState("");
  const [currentOfficers, setCurrentOfficers] = useState([]);

  useEffect(() => {
    const initAuth = async () => {
        // Auth anonim sederhana untuk lokal
        await signInAnonymously(auth);
    };
    initAuth();
    
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    
    // Ganti 'default-jimpitan' dengan ID unik jika perlu, tapi default juga oke
    const qLogs = query(collection(db, 'artifacts', 'default-jimpitan', 'public', 'data', 'jimpitan_logs'));
    const unsubLogs = onSnapshot(qLogs, (snapshot) => {
      const loadedLogs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      loadedLogs.sort((a, b) => new Date(b.date) - new Date(a.date));
      setLogs(loadedLogs);
    });

    const seedData = async () => {
      for (const log of HISTORICAL_LOGS) {
        const docRef = doc(db, 'artifacts', 'default-jimpitan', 'public', 'data', 'jimpitan_logs', log.date);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
          const entries = {};
          HOUSES.forEach(h => {
            const isMissed = log.missedNames.some(missed => 
               h.name.toLowerCase().includes(missed.toLowerCase().replace('pak ', '').replace('ibu ', '').replace('mas ', ''))
            );
            entries[h.id] = isMissed ? 0 : 1;
          });

          await setDoc(docRef, {
            date: log.date,
            timestamp: new Date(log.date).toISOString(),
            officers: log.officers,
            officerGang: log.gang,
            entries: entries,
            totalAmount: log.totalAmount,
            missedHouses: log.missedNames,
            note: "Data Import Historis",
            houseCount: TOTAL_HOUSES
          });
        }
      }
    };
    
    seedData();

    return () => unsubLogs();
  }, [user]);

  const handleCheckIn = (officersList) => {
    setCurrentOfficers(officersList);
    setView('dashboard');
  };

  const startPatrol = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const existingLog = logs.find(l => l.date === todayStr);

    if (existingLog) {
      const normalizedEntries = {};
      HOUSES.forEach(h => {
          const val = existingLog.entries[h.id];
          if (typeof val === 'boolean') normalizedEntries[h.id] = val ? 1 : 0;
          else normalizedEntries[h.id] = val || 0;
      });
      setCurrentPatrolData(normalizedEntries);
      setCurrentPatrolNote(existingLog.note || "");
      setView('patrol');
    } else {
      const initialData = {};
      HOUSES.forEach(h => initialData[h.id] = 0);
      setCurrentPatrolData(initialData);
      setCurrentPatrolNote("");
      setView('patrol');
    }
  };

  const updateJimpitanCount = (houseId, delta) => {
    setCurrentPatrolData(prev => {
        const currentVal = prev[houseId] || 0;
        const newVal = Math.max(0, currentVal + delta);
        return { ...prev, [houseId]: newVal };
    });
  };

  const savePatrol = async () => {
    if (!user) return;
    const todayStr = new Date().toISOString().split('T')[0];
    
    const totalAmount = Object.values(currentPatrolData).reduce((sum, count) => sum + (count * JIMPITAN_VALUE), 0);
    const missedHouses = HOUSES.filter(h => !currentPatrolData[h.id] || currentPatrolData[h.id] === 0).map(h => h.name);
    const officerGang = currentOfficers.length > 0 ? currentOfficers[0].gang : '-';

    const logData = {
      date: todayStr,
      timestamp: new Date().toISOString(),
      officers: currentOfficers.map(o => o.name),
      officerGang: officerGang,
      entries: currentPatrolData,
      totalAmount: totalAmount,
      missedHouses: missedHouses,
      note: currentPatrolNote,
      houseCount: TOTAL_HOUSES
    };

    try {
      await setDoc(doc(db, 'artifacts', 'default-jimpitan', 'public', 'data', 'jimpitan_logs', todayStr), logData);
      alert('Laporan tersimpan!');
      setView('dashboard');
    } catch (e) {
      console.error(e);
      alert('Gagal menyimpan.');
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-slate-900 text-white">Memuat Sistem...</div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      {view === 'login' && <LoginPage onCheckIn={handleCheckIn} allResidents={HOUSES} />}

      {view !== 'login' && (
        <div className="max-w-md mx-auto min-h-screen bg-white shadow-xl overflow-hidden flex flex-col relative">
          <header className="bg-emerald-700 text-white p-4 flex justify-between items-center shadow-md z-10 sticky top-0">
            <div className="flex items-center gap-2">
              <Shield size={24} />
              <h1 className="font-bold text-lg">Muna Permai 2</h1>
            </div>
            <button onClick={() => setView('login')} className="text-xs bg-emerald-800 hover:bg-emerald-900 px-3 py-1 rounded-full flex items-center gap-1 transition-colors">
              <LogOut size={12} /> Keluar
            </button>
          </header>

          <main className="flex-1 overflow-y-auto bg-slate-50 pb-20">
            {view === 'dashboard' && (
              <Dashboard 
                officers={currentOfficers} 
                onStart={startPatrol} 
                onReport={() => setView('report')}
                logs={logs}
              />
            )}

            {view === 'patrol' && (
              <PatrolScreen 
                houses={HOUSES} 
                data={currentPatrolData} 
                note={currentPatrolNote}
                setNote={setCurrentPatrolNote}
                onUpdateCount={updateJimpitanCount}
                onSave={savePatrol}
                onCancel={() => setView('dashboard')}
              />
            )}

            {view === 'report' && <ReportScreen logs={logs} onBack={() => setView('dashboard')} />}
          </main>
        </div>
      )}
    </div>
  );
}

// --- SUB COMPONENTS ---

function LoginPage({ onCheckIn, allResidents }) {
  const [selectedGang, setSelectedGang] = useState('');
  const [errorMsg, setErrorMsg] = useState(''); 
  
  const [officers, setOfficers] = useState([
    { id: '', password: '' },
    { id: '', password: '' }
  ]);

  const gangs = Object.keys(RAW_DATA);

  const availableResidents = useMemo(() => {
    if (!selectedGang) return [];
    return allResidents.filter(h => h.gang === selectedGang);
  }, [selectedGang, allResidents]);

  const updateOfficer = (index, field, value) => {
    const newOfficers = [...officers];
    newOfficers[index][field] = value;
    setOfficers(newOfficers);
  };

  const addOfficerSlot = () => {
    setOfficers([...officers, { id: '', password: '' }]);
  };

  const removeOfficerSlot = (index) => {
    const newOfficers = officers.filter((_, i) => i !== index);
    setOfficers(newOfficers);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    
    if (!selectedGang) {
        setErrorMsg('Mohon pilih Wilayah / Gang terlebih dahulu.');
        return;
    }

    const validOfficers = [];
    const officerIds = new Set(); 

    for (let i = 0; i < officers.length; i++) {
        const off = officers[i];
        if (!off.id) continue;

        if (!off.password) {
            setErrorMsg(`Password untuk petugas ke-${i+1} belum diisi!`);
            return;
        }

        const resident = availableResidents.find(h => h.id === off.id);
        if (!resident) {
            setErrorMsg('Data warga tidak valid.');
            return;
        }

        if (resident.password !== off.password) {
            setErrorMsg(`Password SALAH untuk petugas "${resident.name}". \nSilakan coba lagi (Default: 123)`);
            return;
        }

        if (officerIds.has(resident.id)) {
            setErrorMsg(`Warga "${resident.name}" dipilih lebih dari satu kali.`);
            return;
        }
        officerIds.add(resident.id);

        validOfficers.push(resident);
    }

    if (validOfficers.length < 1) {
        setErrorMsg('Minimal ada 1 petugas yang check in.');
        return;
    }

    onCheckIn(validOfficers);
  };

  const handleGangChange = (gang) => {
      setSelectedGang(gang);
      setOfficers([
        { id: '', password: '' },
        { id: '', password: '' }
      ]);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-emerald-800 to-slate-900 p-4">
      {errorMsg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center relative animate-in zoom-in-95 duration-200">
             <div className="mx-auto w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mb-4">
               <XCircle size={32} className="text-rose-600" />
             </div>
             <h3 className="text-lg font-bold text-slate-800 mb-2">Login Gagal</h3>
             <p className="text-sm text-slate-600 mb-6 whitespace-pre-line leading-relaxed">{errorMsg}</p>
             <button 
               onClick={() => setErrorMsg('')}
               className="w-full py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-colors"
             >
               Tutup & Perbaiki
             </button>
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-sm relative">
        <div className="flex justify-center mb-4 text-emerald-600"><Shield size={56} /></div>
        <h2 className="text-xl font-bold text-center text-slate-800">Jimpitan Muna Permai 2</h2>
        <p className="text-center text-slate-500 mb-6 text-sm">Sistem Pencatatan Digital</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-slate-100 p-3 rounded-xl border border-slate-200">
              <label className="block text-xs font-bold text-slate-600 uppercase mb-2 flex items-center gap-1">
                  <MapPin size={12} /> PILIH GANG PETUGAS
              </label>
              <div className="relative">
                <select 
                    className="w-full p-2.5 text-sm font-semibold border border-slate-300 rounded-lg appearance-none bg-white focus:ring-2 focus:ring-emerald-500 text-slate-700"
                    value={selectedGang}
                    onChange={(e) => handleGangChange(e.target.value)}
                >
                    <option value="">-- Pilih Gang --</option>
                    {gangs.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-3 text-slate-400 pointer-events-none" />
              </div>
          </div>

          <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
             <label className="block text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                  <Users size={12} /> Anggota Regu
              </label>
            {officers.map((officer, index) => (
              <div key={index} className="flex gap-2 items-start animate-in fade-in slide-in-from-bottom-2">
                 <div className="w-8 h-10 bg-emerald-100 rounded-lg text-emerald-700 flex items-center justify-center text-sm font-bold shadow-sm shrink-0 border border-emerald-200 mt-0.5">
                    {index + 1}
                 </div>
                 <div className="flex-1 space-y-2">
                    <div className="relative">
                        <select 
                            className="w-full p-2 text-sm border border-slate-300 rounded-lg appearance-none bg-white focus:ring-1 focus:ring-emerald-500 disabled:bg-slate-50 disabled:text-slate-400"
                            value={officer.id}
                            onChange={(e) => updateOfficer(index, 'id', e.target.value)}
                            disabled={!selectedGang}
                        >
                            <option value="">{selectedGang ? "-- Pilih Nama --" : "-- Pilih Gang Dulu --"}</option>
                            {availableResidents.map(h => (
                                <option key={h.id} value={h.id}>{h.name}</option>
                            ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-3 text-slate-400 pointer-events-none" />
                    </div>
                    <input 
                        type="password"
                        placeholder="Password (123)"
                        className="w-full p-2 text-sm border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500 disabled:bg-slate-50"
                        value={officer.password}
                        onChange={(e) => updateOfficer(index, 'password', e.target.value)}
                        disabled={!officer.id}
                    />
                 </div>
                 {officers.length > 1 && (
                     <button type="button" onClick={() => removeOfficerSlot(index)} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                        <Trash2 size={16} />
                     </button>
                 )}
              </div>
            ))}
          </div>

          <button type="button" onClick={addOfficerSlot} className="w-full py-2 border-2 border-dashed border-slate-300 text-slate-500 rounded-xl hover:border-emerald-500 hover:text-emerald-600 transition-colors text-sm font-semibold flex items-center justify-center gap-2">
             <UserPlus size={16} /> Tambah Anggota
          </button>

          <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-lg transition-all flex justify-center items-center gap-2 mt-4">
            Masuk / Check In <ChevronRight size={18} />
          </button>
        </form>
        
        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-400 italic">
             <Heart size={12} className="fill-rose-400 text-rose-400 animate-pulse" />
             <span>designed by Mas Yogo with love</span>
             <Heart size={12} className="fill-rose-400 text-rose-400 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

function Dashboard({ officers, onStart, onReport, logs }) {
  const todayStr = new Date().toISOString().split('T')[0];
  const isPatrolDone = logs.some(l => l.date === todayStr);

  const todayLog = logs.find(l => l.date === todayStr);
  const todayIncome = todayLog ? todayLog.totalAmount : 0;
  
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlyLogs = logs.filter(l => {
    const d = new Date(l.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });
  const monthlyIncome = monthlyLogs.reduce((acc, curr) => acc + curr.totalAmount, 0);

  const dateOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
  const todayDateString = new Date().toLocaleDateString('id-ID', dateOptions);

  const topMissed = useMemo(() => {
    const counts = {};
    logs.forEach(log => {
        if (log.missedHouses && Array.isArray(log.missedHouses)) {
            log.missedHouses.forEach(name => {
                counts[name] = (counts[name] || 0) + 1;
            });
        }
    });
    return Object.entries(counts)
        .sort((a, b) => b[1] - a[1]) 
        .slice(0, 5);
  }, [logs]);

  return (
    <div className="p-4 space-y-6">
      <div className="bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-500 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-teal-400/20 rounded-full translate-y-1/3 -translate-x-1/3 blur-xl"></div>
        
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-4">
             <div>
                <p className="text-emerald-100 text-xs font-medium uppercase tracking-wider mb-1">Selamat Bertugas</p>
                <h2 className="text-2xl font-bold">Halo, Petugas!</h2>
             </div>
             <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md border border-white/10">
                <Shield size={24} className="text-white" />
             </div>
          </div>
          
          <div className="bg-emerald-900/20 backdrop-blur-sm rounded-xl p-3 border border-white/10 mb-4">
             <div className="flex items-center gap-2 text-emerald-100 text-xs mb-1">
                <Calendar size={12} />
                <span>{todayDateString}</span>
             </div>
             <div className="flex items-start gap-2 mt-2">
                <Users size={14} className="text-emerald-200 mt-1 shrink-0" />
                <div className="text-sm font-semibold flex flex-wrap gap-1">
                    {officers.length > 0 ? officers.map((o, idx) => (
                        <span key={idx} className="bg-emerald-800/50 px-2 py-0.5 rounded text-xs border border-emerald-500/30">
                            {o.name}
                        </span>
                    )) : <span className="text-xs text-white/50 italic">Belum Check In</span>}
                </div>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between h-28">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wide">
                <Clock size={12} className="text-emerald-500" /> Hari Ini
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800">
                  Rp {todayIncome.toLocaleString('id-ID')}
              </div>
              <div className={`text-xs mt-1 font-medium ${isPatrolDone ? 'text-emerald-600' : 'text-amber-500'}`}>
                  {isPatrolDone ? '✔ Sudah dicatat' : '⚠ Belum input'}
              </div>
            </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between h-28">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wide">
                <TrendingUp size={12} className="text-blue-500" /> Bulan Ini
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800">
                  Rp {monthlyIncome.toLocaleString('id-ID')}
              </div>
               <div className="text-xs text-slate-400 mt-1">
                  Total terkumpul
              </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button onClick={onStart} className={`p-5 rounded-3xl shadow-sm border transition-all flex flex-col items-center gap-3 ${isPatrolDone ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-100' : 'bg-white border-slate-100 hover:border-emerald-500 hover:shadow-md'}`}>
          <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-transform ${isPatrolDone ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 'bg-emerald-100 text-emerald-600'}`}>
            {isPatrolDone ? <CheckCircle size={28} /> : <Moon size={28} />}
          </div>
          <span className={`font-semibold text-center ${isPatrolDone ? 'text-emerald-700' : 'text-slate-700'}`}>
            {isPatrolDone ? 'Edit Laporan' : 'Mulai Patroli'}
          </span>
        </button>

        <button onClick={onReport} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 hover:border-blue-500 hover:shadow-md transition-all group flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <BarChart3 size={28} />
          </div>
          <span className="font-semibold text-slate-700">Analisis & Laporan</span>
        </button>
      </div>

      {topMissed.length > 0 && (
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
           <div className="flex justify-between items-center mb-4">
               <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm uppercase tracking-wide">
                  <AlertCircle size={16} className="text-rose-500" /> Warga Sering Kosong
               </h3>
               <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-1 rounded-full">Top 5</span>
           </div>
           
           <div className="space-y-3">
             {topMissed.map(([name, count], index) => (
                <div key={name} className="flex items-center justify-between border-b border-slate-50 last:border-0 pb-2 last:pb-0">
                    <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm ${index === 0 ? 'bg-rose-500' : 'bg-slate-300'}`}>
                            {index + 1}
                        </div>
                        <span className="text-sm font-semibold text-slate-700">{name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                       <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-md border border-rose-100">{count}x</span>
                       <span className="text-[10px] text-rose-400">kosong</span>
                    </div>
                </div>
             ))}
           </div>
        </div>
      )}

    </div>
  );
}

function PatrolScreen({ houses, data, note, setNote, onUpdateCount, onSave, onCancel }) {
  const currentTotal = Object.values(data).reduce((sum, count) => sum + (count * 500), 0);

  const residentsByGang = useMemo(() => {
    const grouped = {};
    houses.forEach(h => {
        if (!grouped[h.gang]) grouped[h.gang] = [];
        grouped[h.gang].push(h);
    });
    return grouped;
  }, [houses]);

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="p-4 bg-white sticky top-0 z-20 border-b border-slate-200 shadow-sm flex justify-between items-center">
        <div>
          <h2 className="font-bold text-lg text-slate-800">Form Patroli</h2>
          <p className="text-xs text-slate-500">{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <div className="text-right bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100">
           <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Terkumpul</p>
           <p className="font-bold text-emerald-700 text-lg">Rp {currentTotal.toLocaleString()}</p>
        </div>
      </div>

      <div className="p-4 space-y-6 pb-40">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 shadow-sm">
            <label className="flex items-center gap-2 text-sm font-bold text-amber-800 mb-2">
                <MessageSquare size={16} /> Catatan Kejadian
            </label>
            <textarea 
                className="w-full p-3 text-sm border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white placeholder:text-slate-400"
                rows="2"
                placeholder="Ada lampu mati? Pagar terbuka?"
                value={note}
                onChange={(e) => setNote(e.target.value)}
            />
        </div>

        {Object.entries(residentsByGang).map(([gangName, residents]) => (
            <div key={gangName} className="space-y-2">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider ml-1 mt-4 border-b border-slate-200 pb-1">{gangName}</h3>
                {residents.map((house) => {
                    const count = data[house.id] || 0;
                    const isPaid = count > 0;
                    return (
                        <div key={house.id} className={`flex items-center justify-between p-3 rounded-xl border transition-all select-none ${isPaid ? 'bg-white border-emerald-500 shadow-md shadow-emerald-100' : 'bg-slate-100 border-transparent opacity-75 hover:opacity-100 hover:bg-white hover:border-slate-300'}`}>
                        {/* Area Nama - Klik untuk +1 */}
                        <div 
                            onClick={() => onUpdateCount(house.id, 1)}
                            className="flex items-center gap-3 flex-1 cursor-pointer"
                        >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors shrink-0 ${isPaid ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                                {house.id.replace('H','')}
                            </div>
                            <div>
                                <p className={`font-semibold text-sm ${isPaid ? 'text-emerald-900' : 'text-slate-600'}`}>{house.name}</p>
                                {isPaid && (
                                    <p className="text-[10px] text-emerald-600 font-bold">
                                        Rp {(count * 500).toLocaleString()}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Kontrol Stepper */}
                        <div className="flex items-center gap-2">
                            {count > 0 && (
                                <button 
                                    onClick={() => onUpdateCount(house.id, -1)}
                                    className="w-8 h-8 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center border border-rose-200 active:scale-95 transition-transform"
                                >
                                    <Minus size={16} />
                                </button>
                            )}
                            
                            <div 
                                onClick={() => onUpdateCount(house.id, 1)}
                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-95 ${
                                    count > 1 ? 'bg-blue-500 text-white shadow-lg shadow-blue-200' :
                                    count === 1 ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 
                                    'bg-slate-300 text-white'
                                }`}
                            >
                                {count > 0 ? <span className="font-bold">{count}x</span> : <Plus size={20} />}
                            </div>
                        </div>
                        </div>
                    );
                })}
            </div>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur border-t border-slate-200 flex gap-3 max-w-md mx-auto z-20">
        <button onClick={onCancel} className="flex-1 py-3 px-4 rounded-xl border border-slate-300 text-slate-600 font-bold hover:bg-slate-50">Batal</button>
        <button onClick={onSave} className="flex-2 w-2/3 bg-emerald-600 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-emerald-200 hover:bg-emerald-700 active:scale-95 transition-all flex justify-center items-center gap-2">
          <Save size={18} /> Simpan Laporan
        </button>
      </div>
    </div>
  );
}

function ReportScreen({ logs, onBack }) {
  const [activeTab, setActiveTab] = useState('history'); 
  const [selectedMonthKey, setSelectedMonthKey] = useState('');

  const stats = useMemo(() => {
    const monthlyData = {}; 

    const sortedLogs = [...logs].sort((a, b) => new Date(b.date) - new Date(a.date));

    sortedLogs.forEach(log => {
        const date = new Date(log.date);
        const monthKey = date.toLocaleString('id-ID', { month: 'long', year: 'numeric' });
        
        if (!monthlyData[monthKey]) {
            const year = date.getFullYear();
            const month = date.getMonth();
            const daysInMonth = new Date(year, month + 1, 0).getDate();

            monthlyData[monthKey] = {
                year,
                month,
                daysInMonth,
                totalDays: 0,
                totalCollected: 0,
                totalDeficit: 0,
                residents: {},
                officerStats: {} 
            };
            
            HOUSES.forEach(h => {
                monthlyData[monthKey].residents[h.id] = {
                    name: h.name,
                    paidCount: 0,
                    missedCount: 0,
                    paidAmount: 0,
                    debtAmount: 0
                };
                monthlyData[monthKey].officerStats[h.name] = 0;
            });
        }

        monthlyData[monthKey].totalDays++;

        if (log.entries) {
            HOUSES.forEach(h => {
                let count = 0;
                if (typeof log.entries[h.id] === 'number') {
                    count = log.entries[h.id];
                } else if (typeof log.entries[h.id] === 'boolean') {
                    count = log.entries[h.id] ? 1 : 0;
                }

                const stats = monthlyData[monthKey].residents[h.id];
                
                if (count > 0) {
                    stats.paidCount += count; 
                    stats.paidAmount += (count * JIMPITAN_VALUE);
                    monthlyData[monthKey].totalCollected += (count * JIMPITAN_VALUE);
                } else {
                    stats.missedCount++;
                }
            });
        }

        if (log.officers && Array.isArray(log.officers)) {
            log.officers.forEach(officerName => {
                if (monthlyData[monthKey].officerStats[officerName] === undefined) {
                    monthlyData[monthKey].officerStats[officerName] = 0;
                }
                monthlyData[monthKey].officerStats[officerName]++;
            });
        }
    });

    Object.keys(monthlyData).forEach(key => {
        const m = monthlyData[key];
        HOUSES.forEach(h => {
            const r = m.residents[h.id];
            const expectedPaymentCount = m.totalDays; 
            const actualPaymentCount = r.paidCount; 
            
            const diff = expectedPaymentCount - actualPaymentCount;
            if (diff > 0) {
                r.debtAmount = diff * JIMPITAN_VALUE;
                m.totalDeficit += r.debtAmount;
            } else {
                r.debtAmount = 0;
            }
        });
    });

    const monthKeys = Object.keys(monthlyData);
    return { monthlyData, monthKeys };
  }, [logs]);

  useEffect(() => {
    if (stats.monthKeys.length > 0 && !selectedMonthKey) {
        setSelectedMonthKey(stats.monthKeys[0]);
    }
  }, [stats.monthKeys, selectedMonthKey]);

  const selectedStats = stats.monthlyData[selectedMonthKey];
  let monthlyTarget = 0;
  let remainingTarget = 0;

  if (selectedStats) {
      monthlyTarget = selectedStats.daysInMonth * TOTAL_HOUSES * JIMPITAN_VALUE;
      remainingTarget = monthlyTarget - selectedStats.totalCollected;
  }

  const formatWAMessage = (log) => {
    const date = new Date(log.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' });
    const missed = log.missedHouses && log.missedHouses.length > 0 
        ? log.missedHouses.join(', ') 
        : '- Nihil -';
    
    const note = log.note ? log.note : '-';

    let gangName = log.officerGang;
    if (!gangName && log.officers && log.officers.length > 0) {
        const firstOfficerName = log.officers[0];
        const foundHouse = HOUSES.find(h => h.name === firstOfficerName);
        if (foundHouse) gangName = foundHouse.gang;
    }

    return `*LAPORAN JIMPITAN POSKAMLING*

📅 ${date}
👮 Petugas: ${log.officers.join(' & ')}
📍 Dari: ${gangName || '-'}

💰 Perolehan: Rp ${log.totalAmount.toLocaleString()}

❌ Kosong : 
${missed}

📝 Catatan: ${note}

_Direkap via Aplikasi Jimpitan MP2_`;
  };

  const copyToClipboard = (text) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      alert("Teks tersalin! Silakan tempel di WhatsApp.");
    } catch (err) {
      alert("Gagal menyalin.");
    }
    document.body.removeChild(textArea);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="p-4 bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <button onClick={onBack} className="p-2 rounded-full hover:bg-slate-100"><ChevronRight size={24} className="rotate-180" /></button>
          <h2 className="text-xl font-bold text-slate-800">Laporan & Data</h2>
        </div>
        
        <div className="flex p-1 bg-slate-100 rounded-lg">
           <button 
             onClick={() => setActiveTab('history')}
             className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'history' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
           >
             Riwayat Harian
           </button>
           <button 
             onClick={() => setActiveTab('stats')}
             className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'stats' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
           >
             Analisis & Rekap
           </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        
        {activeTab === 'stats' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {stats.monthKeys.length === 0 ? (
               <div className="text-center py-10 text-slate-400">
                  <BarChart3 size={48} className="mx-auto mb-4 opacity-50" />
                  Belum ada data cukup untuk analisis.
               </div>
            ) : (
              <>
                <div className="relative">
                    <select 
                        value={selectedMonthKey}
                        onChange={(e) => setSelectedMonthKey(e.target.value)}
                        className="w-full appearance-none bg-white border border-slate-300 text-slate-700 py-3 px-4 pr-8 rounded-xl leading-tight focus:outline-none focus:bg-white focus:border-emerald-500 font-bold"
                    >
                        {stats.monthKeys.map(key => <option key={key} value={key}>{key}</option>)}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-600">
                        <ChevronDown size={16} />
                    </div>
                </div>

                {selectedStats && (
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                            <p className="text-xs text-emerald-600 font-bold uppercase">Total Masuk</p>
                            <p className="text-lg font-bold text-emerald-800">
                                Rp {selectedStats.totalCollected.toLocaleString()}
                            </p>
                        </div>
                        <div className="bg-rose-50 p-4 rounded-xl border border-rose-100">
                            <p className="text-xs text-rose-600 font-bold uppercase">Kekurangan Target</p>
                            <p className="text-lg font-bold text-rose-800">
                                Rp {remainingTarget.toLocaleString()}
                            </p>
                            <p className="text-[10px] text-rose-400 mt-1">
                                (Target Bulanan: Rp {monthlyTarget.toLocaleString()})
                            </p>
                        </div>
                    </div>
                )}

                {selectedStats && (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                       <div className="p-4 border-b border-slate-100 bg-slate-50">
                          <h3 className="font-bold text-slate-800 flex items-center gap-2">
                              <Star size={18} className="text-amber-500 fill-amber-500" /> Keaktifan Petugas Jaga
                          </h3>
                       </div>
                       <div className="max-h-60 overflow-y-auto">
                           <table className="w-full text-sm text-left">
                              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 text-xs uppercase tracking-wider sticky top-0">
                                 <tr>
                                    <th className="p-3 w-2/3">Nama Warga</th>
                                    <th className="p-3 text-center">Jumlah Jaga</th>
                                 </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                 {Object.entries(selectedStats.officerStats)
                                    .sort((a, b) => b[1] - a[1]) // Sort: Paling sering jaga di atas
                                    .map(([name, count], idx) => (
                                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                       <td className="p-3 font-medium text-slate-700">
                                          {idx < 3 && count > 0 && (
                                              <span className="inline-block mr-2 text-amber-500">👑</span>
                                          )}
                                          {name}
                                       </td>
                                       <td className="p-3 text-center">
                                          {count > 0 ? (
                                              <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs">
                                                {count}x
                                              </span>
                                          ) : (
                                              <span className="text-slate-300 text-xs">0x</span>
                                          )}
                                       </td>
                                    </tr>
                                 ))}
                              </tbody>
                           </table>
                       </div>
                    </div>
                )}

                {selectedStats && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                   <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                      <h3 className="font-bold text-slate-800 flex items-center gap-2">
                          <Users size={18} className="text-slate-500" /> Rincian Jimpitan
                      </h3>
                      <span className="text-xs font-medium text-slate-500 bg-white px-2 py-1 rounded border border-slate-200">
                        {selectedStats.totalDays} Hari
                      </span>
                   </div>
                   <div className="max-h-80 overflow-y-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 text-xs uppercase tracking-wider sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th className="p-3 w-1/3">Warga</th>
                                    <th className="p-3 text-center">Isi</th>
                                    <th className="p-3 text-right">Kurang</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {Object.values(selectedStats.residents)
                                    .sort((a, b) => b.debtAmount - a.debtAmount)
                                    .map((resident, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-3 font-medium text-slate-700">
                                        {resident.name}
                                        {resident.debtAmount > 0 && (
                                            <div className="text-[10px] text-rose-500 font-normal">Kosong {resident.missedCount}x</div>
                                        )}
                                    </td>
                                    <td className="p-3 text-center">
                                        <div className="font-bold text-emerald-600">Rp {resident.paidAmount.toLocaleString()}</div>
                                        <div className="text-[10px] text-slate-400">{resident.paidCount}x</div>
                                    </td>
                                    <td className="p-3 text-right">
                                        {resident.debtAmount > 0 ? (
                                            <span className="text-rose-600 font-bold bg-rose-50 px-2 py-1 rounded">
                                                - {resident.debtAmount.toLocaleString()}
                                            </span>
                                        ) : (
                                            <span className="text-slate-300 text-xs">Lunas</span>
                                        )}
                                    </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                   </div>
                </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {logs.length === 0 ? (
              <div className="text-center py-20 text-slate-400">
                <FileText size={48} className="mx-auto mb-4 opacity-50" />
                <p>Belum ada data patroli tersimpan.</p>
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="bg-slate-50 p-3 border-b border-slate-100 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                       <Calendar size={14} className="text-slate-500" />
                       <span className="text-sm font-semibold text-slate-700">{new Date(log.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}</span>
                    </div>
                    <span className="text-emerald-600 font-bold text-sm">+ Rp {log.totalAmount.toLocaleString()}</span>
                  </div>
                  
                  <div className="p-4">
                    <div className="flex justify-between text-xs text-slate-500 mb-2">
                      <span>Petugas: {log.officers.join(', ')}</span>
                    </div>
                    
                    {log.note && (
                        <div className="mb-3 p-2 bg-amber-50 text-amber-800 text-xs rounded border border-amber-100 italic">
                            "{log.note}"
                        </div>
                    )}

                    {log.missedHouses && log.missedHouses.length > 0 ? (
                      <div className="mt-2 text-xs text-rose-600 bg-rose-50 p-2 rounded border border-rose-100">
                        <span className="font-bold block mb-1">Warga Kosong:</span> {log.missedHouses.join(', ')}
                      </div>
                    ) : (
                      <div className="mt-2 text-xs text-emerald-600 font-medium flex items-center gap-1"><CheckCircle size={12} /> Semua lengkap!</div>
                    )}

                    <button 
                        onClick={() => copyToClipboard(formatWAMessage(log))}
                        className="mt-4 w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                    >
                        <Share2 size={14} /> Salin Laporan WA
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}