import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { User, Layout, Link as LinkIcon, Check, ArrowRight, Share2 } from 'lucide-react';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [formData, setFormData] = useState({
    leaderName: '',
    groupName: '',
    count: 2
  });
  const [createdBoardId, setCreatedBoardId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Create the board via backend API
      const { boardService } = await import('../api/board.service');
      const board = await boardService.createBoard(formData.groupName, formData.leaderName);
      setCreatedBoardId(board._id);
      setStep('success');
    } catch (error) {
      console.error('Failed to create board:', error);
      alert('Failed to create workspace. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const shareLink = createdBoardId ? `${window.location.origin}/join/${createdBoardId}` : '';

  const handleCopyLink = () => {
    if (!shareLink) return;
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#FDFCF0] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md">
        <AnimatePresence mode="wait">
          {step === 'form' ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white p-8 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-stone-100"
            >
              <div className="mb-8">
                <div className="w-12 h-12 bg-stone-900 rounded-2xl flex items-center justify-center mb-4">
                  <Layout className="text-white w-6 h-6" />
                </div>
                <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Create Workspace</h1>
                <p className="text-stone-500 text-sm mt-1">Set up your collaborative sprint in seconds.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 ml-1">Group Leader</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300" />
                    <input
                      required
                      type="text"
                      placeholder="e.g. Alex Rivera"
                      value={formData.leaderName}
                      onChange={e => setFormData({ ...formData, leaderName: e.target.value })}
                      className="w-full pl-11 pr-4 py-3 bg-stone-50 border border-stone-100 rounded-xl focus:ring-2 focus:ring-stone-900/5 focus:bg-white transition-all outline-none text-stone-800 placeholder:text-stone-300"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 ml-1">Workspace Name</label>
                  <div className="relative">
                    <Layout className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300" />
                    <input
                      required
                      type="text"
                      placeholder="e.g. Q4 Design Sprint"
                      value={formData.groupName}
                      onChange={e => setFormData({ ...formData, groupName: e.target.value })}
                      className="w-full pl-11 pr-4 py-3 bg-stone-50 border border-stone-100 rounded-xl focus:ring-2 focus:ring-stone-900/5 focus:bg-white transition-all outline-none text-stone-800 placeholder:text-stone-300"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 ml-1">Participants</label>
                  <div className="grid grid-cols-5 gap-2">
                    {[1, 2, 4, 8, 12].map(n => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setFormData({ ...formData, count: n })}
                        className={`py-2 rounded-lg border text-xs font-bold transition-all ${
                          formData.count === n 
                            ? 'bg-stone-900 text-white border-stone-900' 
                            : 'bg-white text-stone-400 border-stone-100 hover:border-stone-200'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-stone-900 text-white rounded-2xl font-bold text-sm tracking-wide flex items-center justify-center gap-2 hover:translate-y-[-2px] active:translate-y-0 transition-all shadow-lg shadow-stone-900/10 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                  {isSubmitting ? 'Creating Canvas...' : 'Create Canvas'} <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white p-8 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-stone-100 text-center"
            >
              <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-stone-900 tracking-tight">Group Created!</h2>
              <p className="text-stone-500 text-sm mt-2 mb-8">
                Workspace <span className="text-stone-900 font-bold">"{formData.groupName}"</span> is ready for your team.
              </p>

              <div className="space-y-4">
                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <LinkIcon className="w-4 h-4 text-stone-300 flex-shrink-0" />
                    <span className="text-[10px] font-mono text-stone-400 truncate">{shareLink}</span>
                  </div>
                  <button
                    onClick={handleCopyLink}
                    className={`flex-shrink-0 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                      copied ? 'bg-green-500 text-white' : 'bg-stone-900 text-white'
                    }`}
                  >
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button 
                     onClick={() => createdBoardId && navigate(`/workspace/${createdBoardId}?participant=${encodeURIComponent(formData.leaderName)}`)}
                     className="py-4 bg-stone-900 text-white rounded-2xl font-bold text-xs tracking-widest uppercase hover:opacity-90 transition-opacity"
                  >
                    Enter Canvas
                  </button>
                  <button 
                    onClick={() => {
                        if (navigator.share && shareLink) {
                            navigator.share({ title: formData.groupName, url: shareLink });
                        } else {
                            handleCopyLink();
                        }
                    }}
                    className="py-4 bg-white border border-stone-100 text-stone-600 rounded-2xl font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-2 hover:bg-stone-50 transition-colors"
                  >
                    <Share2 className="w-4 h-4" /> Share
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-center mt-8 text-[10px] font-bold text-stone-300 uppercase tracking-[0.2em] pointer-events-none">
          MURA DIGITAL COLLABORATION SYSTEM
        </p>
      </div>
    </div>
  );
};

export default HomePage;
