import React from 'react';
import { motion } from 'framer-motion';
import { Radio, StopCircle, Users, Download } from 'lucide-react';
import { useSoundData } from '../hooks/useSoundData';

export const TeacherView = ({ user, onBack }) => {
    const {
        isTransmitting, startTransmission, stopTransmission,
        startHosting, connectedPeers, connectionStatus, resetAttendance
    } = useSoundData();

    // Start hosting via PeerJS on mount
    React.useEffect(() => {
        startHosting(user.roomCode);
    }, [startHosting, user.roomCode]);

    return (
        <div className="flex flex-col lg:flex-row items-start justify-center p-6 w-full max-w-5xl mx-auto relative cursor-default gap-8">
            <button
                onClick={onBack}
                className="absolute top-0 left-0 text-sm text-gray-500 hover:text-white transition-colors"
            >
                &larr; Exit Session
            </button>

            {/* Left Panel: Controls */}
            <div className="w-full lg:w-1/2 flex flex-col items-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-panel w-full flex flex-col items-center text-center space-y-8"
                >
                    <div className="space-y-2">
                        <h2 className="text-3xl title-gradient">Classroom {user.roomCode}</h2>
                        <p className="text-gray-400 text-sm">Instructor: <span className="text-white font-semibold">{user.name}</span></p>
                    </div>

                    <div className="relative h-48 w-48 flex items-center justify-center">
                        {/* Ripples */}
                        {isTransmitting && (
                            <>
                                {[...Array(3)].map((_, i) => (
                                    <motion.div
                                        key={i}
                                        className="absolute inset-0 rounded-full border border-cyan-500 opacity-20"
                                        animate={{ scale: [1, 2.5], opacity: [0.5, 0] }}
                                        transition={{
                                            duration: 2,
                                            repeat: Infinity,
                                            delay: i * 0.6,
                                            ease: "easeOut"
                                        }}
                                    />
                                ))}
                            </>
                        )}

                        {/* Button */}
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={isTransmitting ? stopTransmission : startTransmission}
                            className={`
                  relative z-10 h-32 w-32 rounded-full flex flex-col items-center justify-center
                  shadow-[0_0_40px_rgba(0,243,255,0.2)] transition-all duration-300
                  ${isTransmitting
                                    ? 'bg-red-500/10 border-2 border-red-500 text-red-500 hover:bg-red-500/20'
                                    : 'bg-cyan-500/10 border-2 border-cyan-500 text-cyan-500 hover:bg-cyan-500/20'
                                }
                `}
                        >
                            {isTransmitting ? (
                                <>
                                    <StopCircle size={32} className="mb-2" />
                                    <span className="text-xs font-bold tracking-widest">STOP</span>
                                </>
                            ) : (
                                <>
                                    <Radio size={32} className="mb-2" />
                                    <span className="text-xs font-bold tracking-widest">START</span>
                                </>
                            )}
                        </motion.button>
                    </div>

                    <div className="h-12 flex items-center justify-center">
                        {isTransmitting ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="px-4 py-2 bg-black/40 rounded-full border border-cyan-500/30 text-cyan-400 text-xs tracking-wider font-mono flex items-center gap-2"
                            >
                                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                                BEACON ACTIVE [18kHz]
                            </motion.div>
                        ) : (
                            <span className="text-gray-600 text-sm">Ready to initialize beacon</span>
                        )}
                    </div>
                </motion.div>

                <div className="mt-8 flex items-center gap-2 text-xs text-gray-500">
                    <div className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    {connectionStatus === 'connected' ? 'Cloud Link Active' : 'Connecting to Room...'}
                </div>
            </div>

            {/* Right Panel: Attendance List */}
            <div className="w-full lg:w-1/2 h-full min-h-[500px]">
                <div className="glass-panel h-full flex flex-col p-0 overflow-hidden">
                    <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/20">
                        <div className="flex items-center gap-4">
                            <h3 className="font-semibold text-lg text-white">Live Attendance</h3>
                            <button
                                onClick={() => {
                                    if (window.confirm('Clear all attendance data?')) {
                                        resetAttendance(user.roomCode);
                                    }
                                }}
                                className="text-[10px] bg-red-500/10 hover:bg-red-500/20 text-red-400 px-3 py-1 rounded border border-red-500/20 transition-colors"
                            >
                                RESET
                            </button>
                            <button
                                onClick={() => {
                                    if (connectedPeers.length === 0) return;

                                    const headers = "Name,Roll No,Time,Device Status\n";
                                    const rows = connectedPeers.map(p =>
                                        `${p.name},${p.rollNo},${new Date(p.timestamp).toLocaleTimeString()},${p.isProxy ? `PROXY (Orig: ${p.proxyOriginal})` : 'Verified'}`
                                    ).join("\n");

                                    const blob = new Blob([headers + rows], { type: 'text/csv' });
                                    const url = window.URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `attendance_${user.roomCode}_${new Date().toISOString().slice(0, 10)}.csv`;
                                    a.click();
                                }}
                                className="text-[10px] bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 px-3 py-1 rounded border border-cyan-500/20 transition-colors flex items-center gap-1"
                            >
                                <Download size={12} /> CSV
                            </button>
                        </div>
                        <div className="text-xs font-mono text-cyan-400 bg-cyan-900/30 px-3 py-1 rounded-full">
                            {connectedPeers.length} / {user.classStrength} Present
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {connectedPeers.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-600 space-y-2 opacity-50">
                                <Users size={40} />
                                <p className="text-sm">Waiting for students...</p>
                            </div>
                        ) : (
                            connectedPeers.map((student, idx) => (
                                <motion.div
                                    key={student.rollNo + idx}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${student.isProxy
                                        ? 'bg-red-500/10 border-red-500/50 hover:bg-red-500/20'
                                        : 'bg-white/5 border-white/5 hover:border-cyan-500/30'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${student.isProxy ? 'bg-red-600' : 'bg-gradient-to-br from-cyan-500 to-purple-600'
                                            }`}>
                                            {student.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-white">{student.name}</div>
                                            <div className="text-[10px] text-gray-400 font-mono">{student.rollNo}</div>
                                            {student.isProxy && (
                                                <div className="text-[9px] text-red-400 mt-1 uppercase font-bold tracking-wider">
                                                    ⚠ Device used by {student.proxyOriginal}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className={`text-xs font-bold px-2 py-1 rounded ${student.isProxy ? 'text-red-400 bg-red-500/10' : 'text-green-400 bg-green-500/10'
                                        }`}>
                                        {student.isProxy ? 'RISK' : 'VERIFIED'}
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
