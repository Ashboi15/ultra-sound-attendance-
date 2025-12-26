import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Presentation, ShieldCheck } from 'lucide-react';
import { TeacherView } from './components/TeacherView';
import { StudentView } from './components/StudentView';
import './index.css';

function App() {
  const [role, setRole] = useState(null);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const session = localStorage.getItem('aerocheck_session');
    if (session) {
      const { role, data } = JSON.parse(session);
      setRole(role);
      setUserData(data);
    }
  }, []);

  const handleLogin = (data) => {
    setUserData(data);
    localStorage.setItem('aerocheck_session', JSON.stringify({ role, data }));
  };

  const handleBack = () => {
    setRole(null);
    setUserData(null);
    localStorage.removeItem('aerocheck_session');
    localStorage.removeItem(`aerocheck_list_${userData?.roomCode}`); // Optional: Clear list on logout? Keeping it safe
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4">
      <AnimatePresence mode="wait">
        {!role ? (
          <Landingscreen key="landing" onSelectRole={setRole} />
        ) : !userData ? (
          <LoginScreen key="login" role={role} onLogin={handleLogin} onBack={handleBack} />
        ) : role === 'teacher' ? (
          <motion.div key="teacher" className="w-full" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }}>
            <TeacherView user={userData} onBack={handleBack} />
          </motion.div>
        ) : (
          <motion.div key="student" className="w-full" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }}>
            <StudentView user={userData} onBack={handleBack} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed bottom-4 text-[10px] text-gray-700 font-mono">
        v1.1.0 • AEROCHECK
      </div>
    </div>
  );
}

const Landingscreen = ({ onSelectRole }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, x: -50 }}
    className="flex flex-col items-center space-y-10 max-w-sm w-full"
  >
    <div className="text-center space-y-4">
      <div className="inline-flex items-center justify-center p-4 bg-gradient-to-br from-cyan-900/50 to-transparent rounded-2xl border border-cyan-500/20 mb-4 shadow-[0_0_30px_rgba(0,243,255,0.1)]">
        <ShieldCheck size={48} className="text-cyan-400" />
      </div>
      <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400">
        AeroCheck
      </h1>
      <p className="text-gray-500 text-sm">
        Proximity-based ultrasonic attendance verification system.
      </p>
    </div>

    <div className="w-full space-y-4">
      <RoleButton
        title="Student Portal"
        subtitle="Mark your attendance"
        icon={Users}
        onClick={() => onSelectRole('student')}
        color="cyan"
      />
      <RoleButton
        title="Teacher Console"
        subtitle="Initialize session"
        icon={Presentation}
        onClick={() => onSelectRole('teacher')}
        color="purple"
      />
    </div>
  </motion.div>
);

const LoginScreen = ({ role, onLogin, onBack }) => {
  const [name, setName] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [classStrength, setClassStrength] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !roomCode) return;
    onLogin({ name, rollNo, roomCode, classStrength: role === 'teacher' ? classStrength : null });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="glass-panel w-full max-w-md mx-auto space-y-6"
    >
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="text-gray-500 hover:text-white">&larr;</button>
        <h2 className="text-xl font-bold title-gradient">
          {role === 'teacher' ? 'Initialize Session' : 'Join Session'}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider">Full Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors"
            placeholder="Enter your name"
            required
          />
        </div>

        {role === 'teacher' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider">Room Code</label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors"
                placeholder="e.g. 101"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider">Class Size</label>
              <input
                type="number"
                value={classStrength}
                onChange={(e) => setClassStrength(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors"
                placeholder="Total"
                required
              />
            </div>
          </div>
        )}

        {role === 'student' && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider">Room Code</label>
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors"
                  placeholder="e.g. 101"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider">Roll Number</label>
                <input
                  type="text"
                  value={rollNo}
                  onChange={(e) => setRollNo(e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors"
                  placeholder="e.g. 21CS001"
                  required
                />
              </div>
            </div>

          </>
        )}

        <button
          type="submit"
          className="w-full btn-primary bg-cyan-500/10 mt-4 flex items-center justify-center gap-2"
        >
          {role === 'teacher' ? 'Create Session' : 'Enter Class'} &rarr;
        </button>
      </form>
    </motion.div>
  );
};

const RoleButton = ({ title, subtitle, icon: Icon, onClick, color }) => (
  <motion.button
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={`w-full group relative overflow-hidden glass-panel p-4 flex items-center gap-4 text-left border-neutral-800 transition-colors
      ${color === 'cyan' ? 'hover:border-cyan-500/50' : 'hover:border-purple-500/50'}
    `}
  >
    <div className={`
      p-3 rounded-xl transition-colors
      ${color === 'cyan' ? 'bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500/20' : 'bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20'}
    `}>
      <Icon size={24} />
    </div>
    <div className="flex-1">
      <div className="font-semibold text-white group-hover:text-white transition-colors">{title}</div>
      <div className="text-xs text-gray-500 group-hover:text-gray-400">{subtitle}</div>
    </div>
    <div className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400">
      &rarr;
    </div>
  </motion.button>
);

export default App;
