import { useState, useEffect, useRef, useCallback } from 'react';
import { socketService } from '../api/socket';

export interface Participant {
  id: string;
  name: string;
  x: number;
  y: number;
}

interface SpatialNode {
  gain: GainNode;
  panner: PannerNode;
  analyser: AnalyserNode;
  source: MediaStreamAudioSourceNode;
}

export const useWhiteboardAudio = (
  boardId: string,
  participants: Participant[],
  localPos: { x: number; y: number },
  isEnabled: boolean
) => {
  const [isJoined, setIsJoined] = useState(false);
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [speakerLevels, setSpeakerLevels] = useState<Record<string, number>>({});
  const [incomingCall, setIncomingCall] = useState<{ from: string; name: string } | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const spatialNodesRef = useRef<Map<string, SpatialNode>>(new Map());
  const ringtoneOscillator = useRef<OscillatorNode | null>(null);

  const MAX_DISTANCE = 3000;

  // ── Helper: Get/Create Audio Context ────────────────────────────────────────
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    return audioContextRef.current;
  }, []);

  // ── Ringing Sound Logic ─────────────────────────────────────────────────────
  const startRinging = useCallback(() => {
    try {
      const ctx = getAudioContext();
      if (ctx.state === 'suspended') return;
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      
      gain.gain.setValueAtTime(0, ctx.currentTime);
      for (let i = 0; i < 60; i += 3) {
        gain.gain.setTargetAtTime(0.2, ctx.currentTime + i, 0.1);
        gain.gain.setTargetAtTime(0.2, ctx.currentTime + i + 1.5, 0.1);
        gain.gain.setTargetAtTime(0, ctx.currentTime + i + 1.7, 0.1);
      }

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      ringtoneOscillator.current = osc;
    } catch (e) {
      console.error("Failed to start ringing sound", e);
    }
  }, [getAudioContext]);

  const stopRinging = useCallback(() => {
    if (ringtoneOscillator.current) {
      try { ringtoneOscillator.current.stop(); } catch(e) {}
      ringtoneOscillator.current = null;
    }
  }, []);

  // ── WebRTC Signaling ────────────────────────────────────────────────────────
  const setupSpatialAudio = useCallback((userId: string, stream: MediaStream) => {
    const ctx = getAudioContext();
    
    const audio = new Audio();
    audio.srcObject = stream;
    audio.muted = true; 
    audio.play().catch(e => console.error("Audio playback failed", e));

    const source = ctx.createMediaStreamSource(stream);
    const gain = ctx.createGain();
    const panner = ctx.createPanner();
    const analyser = ctx.createAnalyser();

    panner.panningModel = 'HRTF';
    panner.distanceModel = 'linear';

    source.connect(gain);
    gain.connect(panner);
    panner.connect(analyser);
    analyser.connect(ctx.destination);

    spatialNodesRef.current.set(userId, { gain, panner, analyser, source });
  }, [getAudioContext]);

  const createPeerConnection = useCallback((remoteUserId: string, isInitiator: boolean) => {
    if (peerConnections.current.has(remoteUserId)) return peerConnections.current.get(remoteUserId)!;

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketService.emitCallSignal(boardId, { type: 'candidate', candidate: event.candidate }, remoteUserId);
      }
    };

    pc.ontrack = (event) => {
      const stream = event.streams[0] || new MediaStream([event.track]);
      setupSpatialAudio(remoteUserId, stream);
    };

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    if (isInitiator) {
      pc.createOffer().then(offer => {
        pc.setLocalDescription(offer);
        socketService.emitCallSignal(boardId, { type: 'offer', offer }, remoteUserId);
      });
    }

    peerConnections.current.set(remoteUserId, pc);
    return pc;
  }, [boardId, setupSpatialAudio]);

  const startCall = useCallback(async () => {
    getAudioContext();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      setIsJoined(true);
      socketService.emitCallSignal(boardId, { type: 'incoming-call' });
    } catch (err) {
      console.error("Microphone access denied:", err);
    }
  }, [boardId, getAudioContext]);

  const acceptCall = useCallback(async () => {
    getAudioContext();
    stopRinging();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      setIsJoined(true);
      
      const callerId = incomingCall?.from;
      if (callerId) {
        createPeerConnection(callerId, true);
      }
      setIncomingCall(null);
    } catch (err) {
      console.error("Microphone access denied:", err);
    }
  }, [incomingCall, stopRinging, createPeerConnection, getAudioContext]);

  const rejectCall = useCallback(() => {
    stopRinging();
    setIncomingCall(null);
    // Notify the caller that you rejected? (Optional)
  }, [stopRinging]);

  const endCall = useCallback(() => {
    setIsJoined(false);
    socketService.emitCallSignal(boardId, { type: 'leave-call' });

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    peerConnections.current.forEach(pc => pc.close());
    peerConnections.current.clear();

    spatialNodesRef.current.forEach(node => {
      node.source.disconnect();
      node.gain.disconnect();
      node.panner.disconnect();
    });
    spatialNodesRef.current.clear();
    setSpeakerLevels({});
  }, [boardId]);

  const toggleMic = useCallback(() => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMicEnabled(audioTracks[0].enabled);
    }
  }, []);

  // ── Signaling Listeners ─────────────────────────────────────────────────────
  useEffect(() => {
    const socket = socketService.getSocket();
    if (!socket) return;

    const handleSignal = async ({ from, signal }: { from: string, signal: any }) => {
      if (signal.type === 'incoming-call' && !isJoined) {
        const caller = participants.find(p => p.id === from);
        setIncomingCall({ from, name: caller?.name || 'Someone' });
        startRinging();
      } else if (signal.type === 'leave-call') {
        // If they were calling me, stop the ringing
        if (incomingCall?.from === from) {
          stopRinging();
          setIncomingCall(null);
        }

        const pc = peerConnections.current.get(from);
        if (pc) {
          pc.close();
          peerConnections.current.delete(from);
          const node = spatialNodesRef.current.get(from);
          if (node) {
            node.source.disconnect();
            node.gain.disconnect();
            node.panner.disconnect();
            spatialNodesRef.current.delete(from);
          }
          // Update levels immediately
          setSpeakerLevels(prev => {
            const next = { ...prev };
            delete next[from];
            return next;
          });
        }
      } else if (signal.type === 'offer') {
        const pc = createPeerConnection(from, false);
        await pc.setRemoteDescription(new RTCSessionDescription(signal.offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socketService.emitCallSignal(boardId, { type: 'answer', answer }, from);
      } else if (signal.type === 'answer') {
        const pc = peerConnections.current.get(from);
        if (pc) await pc.setRemoteDescription(new RTCSessionDescription(signal.answer));
      } else if (signal.type === 'candidate') {
        const pc = peerConnections.current.get(from);
        if (pc) await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
      }
    };

    socket.on('call-signal', handleSignal);
    return () => {
      socket.off('call-signal', handleSignal);
    };
  }, [isJoined, createPeerConnection, boardId, participants, startRinging, stopRinging, incomingCall]);

  // Clean up
  useEffect(() => {
    const activeIds = new Set(participants.map(p => p.id));
    peerConnections.current.forEach((pc, id) => {
      if (!activeIds.has(id)) {
        pc.close();
        peerConnections.current.delete(id);
        const node = spatialNodesRef.current.get(id);
        if (node) {
          node.source.disconnect();
          node.gain.disconnect();
          node.panner.disconnect();
          spatialNodesRef.current.delete(id);
        }
      }
    });
  }, [participants]);

  // Spatial audio loop
  useEffect(() => {
    if (!isJoined || !audioContextRef.current || !isEnabled) return;
    const ctx = audioContextRef.current;
    participants.forEach(p => {
      const node = spatialNodesRef.current.get(p.id);
      if (node) {
        const dx = (p.x - localPos.x); 
        const dy = (p.y - localPos.y);
        const distance = Math.sqrt(dx * dx + dy * dy);
        const volume = Math.max(0, 1 - (distance / MAX_DISTANCE));
        node.gain.gain.setTargetAtTime(volume, ctx.currentTime, 0.1);
        const scale = 500; 
        node.panner.positionX.setTargetAtTime(dx / scale, ctx.currentTime, 0.1);
        node.panner.positionZ.setTargetAtTime(dy / scale, ctx.currentTime, 0.1);
      }
    });
  }, [participants, localPos, isJoined, isEnabled]);

  // Volume Monitoring
  useEffect(() => {
    if (!isJoined) return;
    const interval = setInterval(() => {
      const levels: Record<string, number> = {};
      spatialNodesRef.current.forEach((node, id) => {
        const dataArray = new Uint8Array(node.analyser.frequencyBinCount);
        node.analyser.getByteFrequencyData(dataArray);
        const sum = dataArray.reduce((a, b) => a + b, 0);
        levels[id] = sum > 0 ? (sum / dataArray.length / 255) * 100 : 0;
      });
      setSpeakerLevels(prev => {
         // Keep levels for existing nodes, merge with new ones
         return { ...levels };
      });
    }, 100);
    return () => clearInterval(interval);
  }, [isJoined]);

  return {
    isJoined,
    isMicEnabled,
    incomingCall,
    initAudio: startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMic,
    speakerLevels,
  };
};
