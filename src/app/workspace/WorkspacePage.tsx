/**
 * WorkspacePage.tsx  (maps to: app/(workspace)/[boardId]/page.tsx in the spec)
 *
 * Vite entry-level page. Clean composer — imports Canvas + Toolbar + overlays.
 * Manages session state (group info) and hands off to the workspace layout.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Canvas from '../../features/canvas/components/Canvas';
import Toolbar from '../../features/toolbar/components/Toolbar';
import BoardBranding from '../../features/toolbar/components/BoardBranding';
import AudioSettings from '../../components/AudioSettings';
import CollaboratorList from '../../components/CollaboratorList';
import { useWhiteboardAudio } from '../../hooks/useWhiteboardAudio';
import { useViewStore } from '../../store/useViewStore';
import IncomingCallModal from '../../components/IncomingCallModal';
import { motion, AnimatePresence } from 'motion/react';

import { useParams, useLocation, Navigate } from 'react-router-dom';
import { useBoardStore } from '@/src/store/useBoardStore';
import { socketService } from '../../api/socket';

// ── Join notification toast ───────────────────────────────────────────────────
interface JoinToast { id: number; name: string }

const WorkspacePage: React.FC = () => {
  const { boardId } = useParams();
  const location = useLocation();
  const params = new URLSearchParams(location.search);

  const participantName = params.get('participant') || params.get('leader');
  const currentUserName = participantName ? decodeURIComponent(participantName) : 'Guest';

  if (!participantName) {
    return <Navigate to={`/join/${boardId}`} replace />;
  }

  // ── Store subscriptions ─────────────────────────────────────────────────────
  const boardName    = useBoardStore(s => s.boardName);
  const participants = useBoardStore(s => s.participants);
  const boardLeaderName = useBoardStore(s => s.leaderName);

  // ── Toast state ─────────────────────────────────────────────────────────────
  const [toasts, setToasts] = useState<JoinToast[]>([]);
  const toastIdRef = useRef(0);

  const showJoinToast = useCallback((name: string) => {
    const id = ++toastIdRef.current;
    setToasts(prev => [...prev, { id, name }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  // ── Initialise board + listen for join toasts ───────────────────────────────
  useEffect(() => {
    useBoardStore.getState().initBoard(boardId || 'default', currentUserName);

    // Show toast when a new user joins
    const socket = socketService.getSocket();
    const onJoined = ({ username }: { username: string }) => {
      showJoinToast(username);
    };
    socket?.on('user-joined', onJoined);

    return () => {
      socket?.off('user-joined', onJoined);
      useBoardStore.getState().disconnect();
    };
  }, [boardId, currentUserName, showJoinToast]);

  // ── Emit cursor position (debounced via RAF) ────────────────────────────────
  const rafRef = useRef<number | null>(null);
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    if (rafRef.current) return;                      // skip if frame pending
    rafRef.current = requestAnimationFrame(() => {
      socketService.emitCursorMove(boardId || '', e.clientX, e.clientY, currentUserName);
      rafRef.current = null;
    });
  }, [boardId, currentUserName]);

  // ── Audio / view ────────────────────────────────────────────────────────────
  const [localUserId, setLocalUserId] = useState(() => socketService.getSocket()?.id || `user-${Math.random().toString(36).substr(2, 4)}`);
  
  useEffect(() => {
    const socket = socketService.getSocket();
    if (socket?.id) setLocalUserId(socket.id);
  }, []);

  const transform = useViewStore(s => s.transform);

  const { 
    isJoined, 
    isMicEnabled, 
    initAudio, 
    toggleMic, 
    speakerLevels,
    incomingCall,
    acceptCall,
    rejectCall,
    endCall
  } = useWhiteboardAudio(
    boardId || 'default',
    participants,
    { x: -transform.x / transform.scale, y: -transform.y / transform.scale },
    true
  );

  return (
    <main
      className="relative w-screen h-screen overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      {/* ── Rendering Engine (canvas layer) ──────────────────────────────── */}
      <Canvas />

      {/* ── Live Cursors ─────────────────────────────────────────────────── */}
      {participants.map(p => (
        <div
          key={p.id}
          className="pointer-events-none absolute z-40 transition-transform duration-75"
          style={{ left: p.x, top: p.y, transform: 'translate(-2px, -2px)' }}
        >
          {/* SVG cursor */}
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M2 2L17 8L10 10L8 17L2 2Z" fill="#1C1917" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
          </svg>
          {/* Name label */}
          <span
            className="absolute left-5 top-1 px-2 py-0.5 bg-stone-900 text-white text-[10px] font-bold rounded-full whitespace-nowrap"
          >
            {p.name}
          </span>
        </div>
      ))}

      {/* ── DOM UI Overlay (never re-renders canvas) ─────────────────────── */}

      {/* Branding top-left */}
      <BoardBranding groupName={boardName} leaderName={boardLeaderName || 'Loading...'} />

      {/* Audio control top-left under branding */}
      <AudioSettings
        isJoined={isJoined}
        isMicEnabled={isMicEnabled}
        onJoin={initAudio}
        onToggleMic={toggleMic}
        onEndCall={endCall}
        speakerLevels={speakerLevels}
        participants={participants}
      />

      {/* Collaborator list top-right */}
      <CollaboratorList
        localUser={{ id: localUserId, name: currentUserName }}
        participants={participants}
        leaderName={boardLeaderName || ''}
        speakerLevels={speakerLevels}
      />

      {/* ── Join Toasts ───────────────────────────────────────────────────── */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-50 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className="flex items-center gap-2 px-4 py-2 bg-stone-900/90 backdrop-blur-md text-white text-xs font-semibold rounded-full shadow-xl animate-bounce-in"
          >
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span>{t.name} joined the workspace</span>
          </div>
        ))}
      </div>

      {/* Autosave indicator */}
      <div className="absolute bottom-4 right-4 text-[10px] text-stone-400 font-mono pointer-events-none opacity-50">
        SYNCING TO SERVER
      </div>

      {/* Toolbar + zoom + panels — all bottom overlays */}
      <Toolbar />

      {/* ── Incoming Call Modal ────────────────────────────────────────────── */}
      <AnimatePresence>
        {incomingCall && (
          <IncomingCallModal
            callerName={incomingCall.name}
            onAccept={acceptCall}
            onReject={rejectCall}
          />
        )}
      </AnimatePresence>
    </main>
  );
};

export default WorkspacePage;
