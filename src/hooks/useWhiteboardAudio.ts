import { useState, useEffect, useRef, useCallback } from 'react';

export interface Participant {
  id: string;
  name: string;
  x: number;
  y: number;
}

export interface AudioParticipant extends Participant {
  volume: number; // 0-100
  isSpeaking: boolean;
}

interface SpatialNode {
  gain: GainNode;
  panner: PannerNode;
  analyser: AnalyserNode;
  source: MediaStreamAudioSourceNode;
}

export const useWhiteboardAudio = (
  localUserId: string,
  participants: Participant[],
  localPos: { x: number; y: number },
  isEnabled: boolean
) => {
  const [isJoined, setIsJoined] = useState(false);
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [speakerLevels, setSpeakerLevels] = useState<Record<string, number>>({});
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const spatialNodesRef = useRef<Map<string, SpatialNode>>(new Map());

  // Max distance for audio to be heard (px)
  const MAX_DISTANCE = 3000;

  const initAudio = useCallback(async () => {
    if (audioContextRef.current) return;
    
    try {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      setIsJoined(true);
    } catch (err) {
      console.error("Failed to access microphone:", err);
    }
  }, []);

  const toggleMic = useCallback(() => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMicEnabled(audioTracks[0].enabled);
    }
  }, []);

  // Spatial audio processing loop
  useEffect(() => {
    if (!isJoined || !audioContextRef.current || !isEnabled) return;

    const ctx = audioContextRef.current;

    participants.forEach(p => {
      if (p.id === localUserId) return;

      let node = spatialNodesRef.current.get(p.id);
      
      // In a real implementation with an SDK like LiveKit, you would do:
      // if (remoteTrack && !node) {
      //   const source = ctx.createMediaStreamSource(new MediaStream([remoteTrack]));
      //   const gain = ctx.createGain();
      //   const panner = ctx.createPanner();
      //   const analyser = ctx.createAnalyser();
      //   panner.panningModel = 'HRTF';
      //   panner.distanceModel = 'linear';
      //   ... connect them ...
      // }

      if (node) {
        const dx = (p.x - localPos.x); 
        const dy = (p.y - localPos.y);
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Distance Attenuation (Gain)
        // Smoothly fade out using linear model over 3000px
        const volume = Math.max(0, 1 - (distance / MAX_DISTANCE));
        node.gain.gain.setTargetAtTime(volume, ctx.currentTime, 0.1);

        // Spatial Panning
        // We use positionX for left/right and positionZ for front/back (depth)
        // Scaling dx/dy to a range that PannerNode handles well (-5 to 5)
        const scale = 500; 
        node.panner.positionX.setTargetAtTime(dx / scale, ctx.currentTime, 0.1);
        node.panner.positionZ.setTargetAtTime(dy / scale, ctx.currentTime, 0.1);
        node.panner.positionY.setTargetAtTime(0, ctx.currentTime, 0.1); // Keep on horizontal plane
      }
    });
  }, [participants, localPos, isJoined, isEnabled, localUserId]);

  // Volume Monitoring Loop (Analysers)
  useEffect(() => {
    if (!isJoined) return;

    const interval = setInterval(() => {
      const levels: Record<string, number> = {};
      
      // Simulate remote speaker levels for demo if joined
      if (isJoined) {
        participants.forEach(p => {
          if (p.id !== localUserId) {
            // Random speaking activity simulation
            const isSpeaking = Math.random() > 0.7;
            levels[p.id] = isSpeaking ? 10 + Math.random() * 60 : 0;
          }
        });
      }

      spatialNodesRef.current.forEach((node, id) => {
        const dataArray = new Uint8Array(node.analyser.frequencyBinCount);
        node.analyser.getByteFrequencyData(dataArray);
        const sum = dataArray.reduce((a, b) => a + b, 0);
        levels[id] = sum > 0 ? (sum / dataArray.length / 255) * 100 : 0;
      });
      setSpeakerLevels(levels);
    }, 100);

    return () => clearInterval(interval);
  }, [isJoined]);

  return {
    isJoined,
    isMicEnabled,
    initAudio,
    toggleMic,
    speakerLevels,
  };
};
