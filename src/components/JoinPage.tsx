import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { User, Layout, ArrowRight } from 'lucide-react';

const JoinPage: React.FC = () => {
  const { boardId } = useParams();
  const navigate = useNavigate();
  const [participantName, setParticipantName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [boardName, setBoardName] = useState<string>('Workspace');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchBoard() {
      if (!boardId) return;
      try {
        const { boardService } = await import('../api/board.service');
        const board = await boardService.getBoardById(boardId);
        if (board) {
          setBoardName(board.name);
        }
      } catch (err) {
        console.error('Failed to fetch board details', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchBoard();
  }, [boardId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!participantName.trim()) return;
    
    setIsSubmitting(true);
    // Redirect to the workspace with the participant name in the query string
    navigate(`/workspace/${boardId}?participant=${encodeURIComponent(participantName.trim())}`);
  };

  return (
    <div className="min-h-screen bg-[#FDFCF0] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md">
        <AnimatePresence mode="wait">
          <motion.div
            key="join-form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white p-8 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-stone-100"
          >
            <div className="mb-8">
              <div className="w-12 h-12 bg-stone-900 rounded-2xl flex items-center justify-center mb-4">
                <Layout className="text-white w-6 h-6" />
              </div>
              <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Join Workspace</h1>
              <p className="text-stone-500 text-sm mt-1">
                {isLoading ? (
                  'Loading workspace details...'
                ) : (
                  <>You've been invited to join <span className="font-bold text-stone-900">"{boardName}"</span>.</>
                )}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 ml-1">Your Display Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300" />
                  <input
                    required
                    type="text"
                    placeholder="e.g. Alex Rivera"
                    value={participantName}
                    onChange={e => setParticipantName(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-stone-50 border border-stone-100 rounded-xl focus:ring-2 focus:ring-stone-900/5 focus:bg-white transition-all outline-none text-stone-800 placeholder:text-stone-300"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !participantName.trim()}
                className="w-full py-4 bg-stone-900 text-white rounded-2xl font-bold text-sm tracking-wide flex items-center justify-center gap-2 hover:translate-y-[-2px] active:translate-y-0 transition-all shadow-lg shadow-stone-900/10 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                {isSubmitting ? 'Joining...' : 'Enter Canvas'} <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        </AnimatePresence>

        <p className="text-center mt-8 text-[10px] font-bold text-stone-300 uppercase tracking-[0.2em] pointer-events-none">
          MURA DIGITAL COLLABORATION SYSTEM
        </p>
      </div>
    </div>
  );
};

export default JoinPage;
