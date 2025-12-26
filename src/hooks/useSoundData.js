import { useRef, useState, useCallback, useEffect } from 'react';
import { Peer } from 'peerjs';

// LONG RANGE MODE (80m Theoretical Max in open space)
const TARGET_FREQUENCY = 17000; // Lower freq = Longer range (Audible whine likely)
const DETECTION_DURATION = 500; // Faster detection (0.5s)

// Helper: Get or create persistent Device ID
const getDeviceId = () => {
    let id = localStorage.getItem('aerocheck_device_id');
    if (!id) {
        // Simple fallback UUID generator
        id = 'device_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
        localStorage.setItem('aerocheck_device_id', id);
    }
    return id;
};

export const useSoundData = () => {
    // START: PEERJS CONNECTION LOGIC
    const [peerId, setPeerId] = useState(null); // My ID
    const [connectedPeers, setConnectedPeers] = useState([]); // List of connected students (for teacher)
    const [connectionStatus, setConnectionStatus] = useState('disconnected'); // disconnected, connecting, connected, error
    const peerRef = useRef(null);
    const connectionsRef = useRef([]); // Array of active data connections
    const presenceQueue = useRef(null); // Queue data to send if not connected yet

    // Sound Refs
    const [isTransmitting, setIsTransmitting] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [detectionStatus, setDetectionStatus] = useState('idle'); // idle, listening, detected
    const [volumeLevel, setVolumeLevel] = useState(0);

    const audioContextRef = useRef(null);
    const oscillatorRef = useRef(null);
    const analyserRef = useRef(null);
    const requestRef = useRef(null);
    const detectionStartTime = useRef(null);

    // --- TEACHER: HOST A SESSION ---
    const startHosting = useCallback((roomCode) => {
        if (!roomCode || peerRef.current) return;

        const cleanCode = roomCode.toString().trim().toLowerCase();

        // Load saved list for this room
        const savedList = localStorage.getItem(`aerocheck_list_${cleanCode}`);
        if (savedList) {
            try {
                setConnectedPeers(JSON.parse(savedList));
            } catch (e) { console.error(e); }
        }

        // ID Format: aerocheck-[roomCode]
        const id = `aerocheck-${cleanCode}`;

        console.log("Attempting to host with ID:", id);

        try {
            const peer = new Peer(id);

            peer.on('open', (id) => {
                console.log('Hosting session active:', id);
                setPeerId(id);
                setConnectionStatus('connected');
            });

            peer.on('connection', (conn) => {
                console.log('New student connected:', conn.peer);

                conn.on('data', (data) => {
                    console.log('Received data:', data);
                    if (data.type === 'PRESENT') {
                        setConnectedPeers(prev => {
                            // 1. Check if this exact roll number is already present
                            const existingUser = prev.find(p => p.rollNo === data.user.rollNo);
                            if (existingUser) return prev; // Already marked

                            // 2. SECURITY CHECK: Device Fingerprint
                            // Check if this DEVICE ID has already been used by a DIFFERENT roll number
                            const proxySuspect = prev.find(p => p.deviceId && p.deviceId === data.user.deviceId);

                            const newUser = { ...data.user, timestamp: Date.now() };

                            if (proxySuspect) {
                                console.warn("PROXY DETECTED! Device already used by:", proxySuspect.name);
                                newUser.isProxy = true;
                                newUser.proxyOriginal = proxySuspect.name;
                            }

                            const newList = [...prev, newUser];
                            // Save to local storage
                            localStorage.setItem(`aerocheck_list_${cleanCode}`, JSON.stringify(newList));
                            return newList;
                        });
                    }
                });

                connectionsRef.current.push(conn);
            });

            peer.on('error', (err) => {
                console.error("PeerJS Error:", err);
                if (err.type === 'unavailable-id') {
                    // This means we refreshed and the ID is still "taken" by our previous ghost session.
                    // We can assume we are connected in spirit or just wait.
                    // Alternatively, we can try to reconnect or just show the UI.
                    setConnectionStatus('connected');
                    console.log("Recovering session...");
                } else {
                    setConnectionStatus('error');
                }
            });

            peerRef.current = peer;
        } catch (e) {
            console.error("Peer creation failed", e);
            setConnectionStatus('error');
        }
    }, []);

    const resetAttendance = useCallback((roomCode) => {
        setConnectedPeers([]);
        const cleanCode = roomCode.toString().trim().toLowerCase();
        localStorage.removeItem(`aerocheck_list_${cleanCode}`);
    }, []);

    // --- STUDENT: JOIN A SESSION ---
    const joinSession = useCallback((roomCode) => {
        if (!roomCode || peerRef.current) return;

        const peer = new Peer();

        peer.on('open', (id) => {
            setPeerId(id);
            setConnectionStatus('connecting');

            const cleanCode = roomCode.toString().trim().toLowerCase();
            const teacherId = `aerocheck-${cleanCode}`;
            console.log("Connecting to teacher:", teacherId);

            const conn = peer.connect(teacherId, {
                reliable: true
            });

            conn.on('open', () => {
                console.log('Connected to teacher');
                setConnectionStatus('connected');
                connectionsRef.current.push(conn);

                // Flush queue
                if (presenceQueue.current) {
                    console.log("Sending queued presence...");
                    conn.send(presenceQueue.current);
                    presenceQueue.current = null;
                }
            });

            conn.on('error', (err) => {
                console.error("Connection failed", err);
                setConnectionStatus('error');
            });
        });

        peer.on('error', (err) => {
            console.error(err);
            setConnectionStatus('error');
        });

        peerRef.current = peer;
    }, []);

    // --- STUDENT: SEND PRESENCE ---
    const sendPresence = useCallback((user) => {
        const deviceId = getDeviceId(); // Get persistent ID
        const payload = {
            type: 'PRESENT',
            user: { ...user, deviceId } // Attach ID
        };
        const conn = connectionsRef.current[0];

        if (conn && conn.open) {
            conn.send(payload);
            return true;
        } else {
            console.warn("Connection not ready, queuing presence...");
            presenceQueue.current = payload;
            return false;
        }
    }, []);


    // --- SOUND LOGIC ---
    const initAudio = () => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume();
        }
    };

    const startTransmission = useCallback(() => {
        initAudio();
        const ctx = audioContextRef.current;
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(TARGET_FREQUENCY, ctx.currentTime);

        // EXTREME VOLUME BOOST
        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(10.0, ctx.currentTime + 0.5); // 10x Digital Gain (Clipping expected but max range)

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.start();
        oscillatorRef.current = osc;
        setIsTransmitting(true);
        return () => {
            gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.1);
            setTimeout(() => osc.stop(), 100);
        };
    }, []);

    const stopTransmission = useCallback(() => {
        if (oscillatorRef.current) {
            oscillatorRef.current.stop();
            oscillatorRef.current.disconnect();
            oscillatorRef.current = null;
        }
        setIsTransmitting(false);
    }, []);

    const startListening = useCallback(() => {
        initAudio();
        const ctx = audioContextRef.current;
        const constraints = { audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } };

        navigator.mediaDevices.getUserMedia(constraints)
            .then(stream => {
                const source = ctx.createMediaStreamSource(stream);
                const analyser = ctx.createAnalyser();
                analyser.fftSize = 4096; // HIGH PRECISION for pinpointing freq in noise
                analyser.smoothingTimeConstant = 0.2;
                source.connect(analyser);
                analyserRef.current = analyser;
                setIsListening(true);
                setDetectionStatus('listening');

                const bufferLength = analyser.frequencyBinCount;
                const dataArray = new Uint8Array(bufferLength);

                const detect = () => {
                    if (!analyserRef.current) return;
                    analyser.getByteFrequencyData(dataArray);
                    const nyquist = ctx.sampleRate / 2;
                    const index = Math.round((TARGET_FREQUENCY / nyquist) * bufferLength);

                    // Narrow Search Range (Pinpoint accuracy)
                    const searchRange = 4;
                    let signal = 0;
                    for (let i = -searchRange; i <= searchRange; i++) {
                        if (dataArray[index + i] > signal) signal = dataArray[index + i];
                    }
                    setVolumeLevel(signal);

                    // ULTRA SENSITIVE THRESHOLD
                    const NOISE_FLOOR = 3; // Barely above silence

                    if (signal > NOISE_FLOOR) {
                        if (!detectionStartTime.current) {
                            detectionStartTime.current = Date.now();
                        } else if (Date.now() - detectionStartTime.current > DETECTION_DURATION) {
                            setDetectionStatus('detected');
                            stopListening();
                            return;
                        }
                    } else {
                        if (Date.now() - (detectionStartTime.current || 0) > 300) {
                            detectionStartTime.current = null;
                        }
                    }
                    requestRef.current = requestAnimationFrame(detect);
                };
                detect();
            })
            .catch(err => {
                console.error("Mic Error:", err);
                setDetectionStatus('error');
            });
    }, []);

    const stopListening = useCallback(() => {
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
        if (analyserRef.current) analyserRef.current = null;
        setIsListening(false);
    }, []);

    useEffect(() => {
        return () => {
            stopTransmission();
            stopListening();
            if (audioContextRef.current) audioContextRef.current.close();
            if (peerRef.current) {
                peerRef.current.destroy();
                peerRef.current = null;
            }
        };
    }, []);

    return {
        isTransmitting,
        startTransmission,
        stopTransmission,
        isListening,
        startListening,
        stopListening,
        detectionStatus,
        volumeLevel,
        resetDetection: () => setDetectionStatus('idle'),
        startHosting,
        joinSession,
        sendPresence,
        connectedPeers,
        connectionStatus,
        resetAttendance
    };
};
