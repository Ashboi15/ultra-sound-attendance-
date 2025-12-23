import React from 'react';
import { motion } from 'framer-motion';
import { Radio, StopCircle } from 'lucide-react';
import { useSoundData } from '../hooks/useSoundData';

export const TeacherView = ({ onBack }) => {
    const { isTransmitting, startTransmission, stopTransmission } = useSoundData();

    return (
        <div className="flex flex-col items-center justify-center p-6 w-full max-w-md mx-auto relative cursor-default">
            <button
                onClick={onBack}
                className="absolute top-0 left-0 text-sm text-gray-500 hover:text-white transition-colors"
            >
                &larr; Back
            </button>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel w-full flex flex-col items-center text-center space-y-8"
            >
                <div className="space-y-2">
                    <h2 className="text-3xl title-gradient">Classroom 404</h2>
                    <p className="text-gray-400 text-sm">Ultrasonic Attendance Beacon</p>
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
                                <span className="text-xs font-bold tracking-widest">BROADCAST</span>
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
                            TRANSMITTING: 19.5kHz
                        </motion.div>
                    ) : (
                        <span className="text-gray-600 text-sm">Ready to start session</span>
                    )}
                </div>
            </motion.div>

            <p className="mt-8 text-xs text-gray-600 max-w-xs text-center leading-relaxed">
                Ensure your volume is set to maximum for optimal range. Students must be within 10 meters.
            </p>
        </div>
    );
};
