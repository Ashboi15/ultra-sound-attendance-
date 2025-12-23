import { useRef, useState, useCallback, useEffect } from 'react';

const TARGET_FREQUENCY = 19500; // Near-ultrasound
const THRESHOLD = 30; // Sensitivity (0-255)
const DETECTION_DURATION = 1000; // ms of sustained signal to confirm

export const useSoundData = () => {
    const [isTransmitting, setIsTransmitting] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [detectionStatus, setDetectionStatus] = useState('idle'); // idle, listening, detected
    const [volumeLevel, setVolumeLevel] = useState(0);

    const audioContextRef = useRef(null);
    const oscillatorRef = useRef(null);
    const analyserRef = useRef(null);
    const requestRef = useRef(null);
    const detectionStartTime = useRef(null);

    // Initialize AudioContext (must be user gesture triggered)
    const initAudio = () => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume();
        }
    };

    // --- TRANSMITTER (TEACHER) ---
    const startTransmission = useCallback(() => {
        initAudio();
        const ctx = audioContextRef.current;

        // Create Oscillator
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain(); // For volume control/ramp

        osc.type = 'sine';
        osc.frequency.setValueAtTime(TARGET_FREQUENCY, ctx.currentTime);

        // Smooth start to avoid clicks
        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(1, ctx.currentTime + 0.1);

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.start();
        oscillatorRef.current = osc;
        setIsTransmitting(true);

        // Cleanup on stop
        return () => {
            gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.1);
            setTimeout(() => osc.stop(), 100);
        };
    }, []);

    const stopTransmission = useCallback(() => {
        if (oscillatorRef.current) {
            // Just hard stop for now, better to ramp down if possible but scope is limited
            oscillatorRef.current.stop();
            oscillatorRef.current.disconnect();
            oscillatorRef.current = null;
        }
        setIsTransmitting(false);
    }, []);

    // --- RECEIVER (STUDENT) ---
    // --- RECEIVER (STUDENT) ---
    const startListening = useCallback(() => {
        initAudio();
        const ctx = audioContextRef.current;

        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                const source = ctx.createMediaStreamSource(stream);
                const analyser = ctx.createAnalyser();
                analyser.fftSize = 2048; // Resolution
                analyser.smoothingTimeConstant = 0.5; // Less smoothing for faster reaction
                source.connect(analyser);

                analyserRef.current = analyser;
                setIsListening(true);
                setDetectionStatus('listening');

                const bufferLength = analyser.frequencyBinCount;
                const dataArray = new Uint8Array(bufferLength);

                const detect = () => {
                    if (!analyserRef.current) return;

                    analyser.getByteFrequencyData(dataArray);

                    // Calculate index for target frequency
                    const nyquist = ctx.sampleRate / 2;
                    const index = Math.round((TARGET_FREQUENCY / nyquist) * bufferLength);

                    // Check a WIDER bandwidth (approx +/- 80Hz) to account for slight hardware variations
                    const searchRange = 3;
                    let maxIntensity = 0;
                    for (let i = -searchRange; i <= searchRange; i++) {
                        if (dataArray[index + i] > maxIntensity) {
                            maxIntensity = dataArray[index + i];
                        }
                    }

                    // Lower threshold significantly (15 out of 255 is very low but safe for high-freq background noise)
                    // High frequencies usually have very low energy in silence.
                    const DETECT_THRESHOLD = 15;

                    setVolumeLevel(maxIntensity);

                    if (maxIntensity > DETECT_THRESHOLD) {
                        if (!detectionStartTime.current) {
                            detectionStartTime.current = Date.now();
                        } else if (Date.now() - detectionStartTime.current > 1500) { // 1.5s is enough
                            setDetectionStatus('detected');
                            stopListening();
                            return;
                        }
                    } else {
                        // Only reset if signal is lost for > 500ms (debouncing)
                        if (Date.now() - (detectionStartTime.current || 0) > 500) {
                            detectionStartTime.current = null;
                        }
                    }

                    requestRef.current = requestAnimationFrame(detect);
                };

                detect();
            })
            .catch(err => {
                console.error("Microphone access denied:", err);
                setDetectionStatus('error');
            });
    }, []);

    const stopListening = useCallback(() => {
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
        if (analyserRef.current) analyserRef.current = null;
        setIsListening(false);
    }, []);

    // Cleanup
    useEffect(() => {
        return () => {
            stopTransmission();
            stopListening();
            if (audioContextRef.current) audioContextRef.current.close();
        };
    }, [stopTransmission, stopListening]);

    return {
        isTransmitting,
        startTransmission,
        stopTransmission,
        isListening,
        startListening,
        stopListening,
        detectionStatus,
        volumeLevel,
        resetDetection: () => setDetectionStatus('idle')
    };
};
