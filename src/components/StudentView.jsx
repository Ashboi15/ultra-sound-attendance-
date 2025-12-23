import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, CheckCircle, Smartphone } from 'lucide-react';
import { useSoundData } from '../hooks/useSoundData';

export const StudentView = ({ onBack }) => {
    const {
        startListening,
        stopListening,
        detectionStatus,
        volumeLevel,
        resetDetection
    } = useSoundData();

    useEffect(() => {
        // Auto-start listening on mount
        startListening();
        return () => stopListening();
    }, [startListening, stopListening]);

    return (
        <div className="flex flex-col items-center justify-center p-6 w-full max-w-md mx-auto relative">
            <button
                onClick={onBack}
                className="absolute top-0 left-0 text-sm text-gray-500 hover:text-white transition-colors"
            >
                &larr; Back
            </button>

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-panel w-full flex flex-col items-center text-center space-y-6"
            >
                {detectionStatus === 'detected' ? (
                    <SuccessView />
                ) : (
                    <ListeningView volumeLevel={volumeLevel} status={detectionStatus} />
                )}
            </motion.div>

            <p className="mt-8 text-xs text-gray-600 max-w-xs text-center leading-relaxed">
                Please verify microphone permissions. Keep app open to sign in.
            </p>
        </div>
    );
};

const ListeningView = ({ volumeLevel, status }) => (
    <motion.div
        key="listening"
        exit={{ opacity: 0 }}
        className="flex flex-col items-center space-y-6"
    >
        <div className="space-y-2">
            <h2 className="text-2xl title-gradient">Listening Mode</h2>
            <p className="text-gray-400 text-sm">Searching for class beacon...</p>
        </div>

        <div className="relative h-40 w-40 flex items-center justify-center">
            {/* Dynamic Visualizer Ring */}
            <motion.div
                className="absolute inset-0 rounded-full border-2 border-dashed border-gray-700"
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            />

            {/* Reactive Glow */}
            <motion.div
                className="absolute inset-0 rounded-full bg-cyan-500 blur-xl opacity-20"
                animate={{ scale: 1 + (volumeLevel / 100) }}
            />

            <div className="z-10 bg-gray-900 h-24 w-24 rounded-full flex items-center justify-center border border-gray-700 shadow-2xl">
                <Mic className={`text-cyan-500 ${status === 'listening' ? 'animate-pulse' : ''}`} size={32} />
            </div>
        </div>

        {/* Frequency Bars Simulation */}
        <div className="h-10 flex items-end justify-center gap-1 w-full px-8">
            {[...Array(20)].map((_, i) => (
                <motion.div
                    key={i}
                    className="w-1 bg-gradient-to-t from-cyan-900 to-cyan-400 rounded-full"
                    animate={{
                        height: Math.max(4, Math.min(40, (volumeLevel / 5) * (Math.random() + 0.5)))
                    }}
                    transition={{ duration: 0.1 }}
                />
            ))}
        </div>
    </motion.div>
);

const SuccessView = () => (
    <motion.div
        key="success"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex flex-col items-center space-y-6 py-8"
    >
        <div className="relative">
            <motion.div
                className="absolute inset-0 bg-green-500 blur-2xl opacity-40"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
            />
            <CheckCircle size={80} className="text-[#0aff0a] drop-shadow-[0_0_15px_rgba(10,255,10,0.8)]" />
        </div>

        <div className="space-y-2">
            <h2 className="text-3xl text-white font-bold">Present!</h2>
            <p className="text-gray-400">Your attendance has been recorded.</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-lg p-4 w-full flex items-center gap-4 mt-4">
            <div className="h-10 w-10 bg-gray-800 rounded-full flex items-center justify-center">
                <Smartphone size={20} className="text-gray-400" />
            </div>
            <div className="text-left">
                <div className="text-xs text-gray-500">SESSION ID</div>
                <div className="text-sm text-cyan-400 font-mono">SEC-8392-X</div>
            </div>
        </div>
    </motion.div>
);
