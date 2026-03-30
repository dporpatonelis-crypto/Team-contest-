/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  LayoutDashboard, 
  ListOrdered, 
  Medal, 
  Play, 
  Pause, 
  RotateCcw, 
  Plus, 
  Minus, 
  History, 
  BookOpen, 
  PenTool,
  Download,
  Award as AwardIcon,
  User,
  Settings,
  Trash2,
  FileDown,
  PlusCircle
} from 'lucide-react';
import { Team, ContestSession, ActivityLog, Award, SessionStatus } from './types';
import { INITIAL_TEAMS, INITIAL_SESSION, INITIAL_AWARDS } from './constants';
import { translations } from './translations';

const normalizeGreek = (text: string, lang: string) => {
  if (lang !== 'el') return text;
  // Remove Greek accents (tonoi) for uppercase display
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
};

export default function App() {
  const [lang, setLang] = useState<'en' | 'el'>(() => {
    const saved = localStorage.getItem('scholastic_settings');
    return saved ? JSON.parse(saved).lang : 'el';
  });
  const [bgImage, setBgImage] = useState<string>(() => {
    const saved = localStorage.getItem('scholastic_settings');
    if (saved) return JSON.parse(saved).bgImage;
    return import.meta.env.VITE_INITIAL_BG_IMAGE || '';
  });
  const [bgOpacity, setBgOpacity] = useState<number>(() => {
    const saved = localStorage.getItem('scholastic_settings');
    if (saved) return JSON.parse(saved).bgOpacity;
    const envVal = import.meta.env.VITE_INITIAL_BG_OPACITY;
    return envVal ? parseFloat(envVal) : 0.1;
  });
  const [showSettings, setShowSettings] = useState(false);
  const t = translations[lang];

  const [activeTab, setActiveTab] = useState<'teams' | 'scoreboard' | 'laurels'>('teams');
  const [teams, setTeams] = useState<Team[]>(() => {
    const saved = localStorage.getItem('scholastic_teams');
    return saved ? JSON.parse(saved) : INITIAL_TEAMS;
  });
  const [session, setSession] = useState<ContestSession>(() => {
    const saved = localStorage.getItem('scholastic_session');
    return saved ? JSON.parse(saved) : INITIAL_SESSION;
  });
  const [logs, setLogs] = useState<ActivityLog[]>(() => {
    const saved = localStorage.getItem('scholastic_logs');
    return saved ? JSON.parse(saved) : [];
  });
  const [awards] = useState<Award[]>(INITIAL_AWARDS);
  const [totalMoves, setTotalMoves] = useState(() => {
    const saved = localStorage.getItem('scholastic_total_moves');
    return saved ? parseInt(saved) : 0;
  });
  const [lastScoreChange, setLastScoreChange] = useState<{ teamId: string; amount: number } | null>(null);

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem('scholastic_settings', JSON.stringify({ lang, bgImage, bgOpacity }));
  }, [lang, bgImage, bgOpacity]);

  useEffect(() => {
    localStorage.setItem('scholastic_teams', JSON.stringify(teams));
  }, [teams]);

  useEffect(() => {
    localStorage.setItem('scholastic_session', JSON.stringify(session));
  }, [session]);

  useEffect(() => {
    localStorage.setItem('scholastic_logs', JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    localStorage.setItem('scholastic_total_moves', totalMoves.toString());
  }, [totalMoves]);

  // Stats
  const stats = useMemo(() => {
    const totalPoints = teams.reduce((acc, team) => acc + team.score, 0);
    const leader = [...teams].sort((a, b) => b.score - a.score)[0]?.name || '---';
    return {
      totalTeams: teams.length,
      totalPoints,
      leader,
      totalMoves
    };
  }, [teams, totalMoves]);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (session.status === 'active' && session.timerSeconds > 0) {
      interval = setInterval(() => {
        setSession(prev => ({
          ...prev,
          timerSeconds: prev.timerSeconds + 1 // Counting up for tournament duration
        }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [session.status, session.timerSeconds]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const sortedTeams = useMemo(() => {
    return [...teams].sort((a, b) => b.score - a.score).map((team, index) => ({
      ...team,
      rank: index + 1
    }));
  }, [teams]);

  const handleAdjustScore = (teamId: string, amount: number, reason: string = t.merit) => {
    setTeams(prev => prev.map(t => t.id === teamId ? { ...t, score: Math.max(0, t.score + amount) } : t));
    setTotalMoves(prev => prev + 1);
    setLastScoreChange({ teamId, amount });
    
    // Clear the animation state after a short delay
    setTimeout(() => setLastScoreChange(null), 1000);
    
    const team = teams.find(t => t.id === teamId);
    if (team) {
      const newLog: ActivityLog = {
        id: Math.random().toString(36).substr(2, 9),
        teamName: team.name,
        points: amount,
        reason,
        timestamp: new Date(),
      };
      setLogs(prev => [newLog, ...prev].slice(0, 10));
    }
  };

  const handleAddTeam = () => {
    const newTeam: Team = {
      id: Math.random().toString(36).substr(2, 9),
      name: `${t.newHouse} ${teams.length + 1}`,
      campus: t.satellite,
      score: 0,
      rank: teams.length + 1,
      displayId: (teams.length + 1).toString(),
      color: 'outline'
    };
    setTeams([...teams, newTeam]);
  };

  const handleDeleteTeam = (id: string) => {
    setTeams(prev => prev.filter(t => t.id !== id));
  };

  const handleUpdateTeamName = (id: string, newName: string) => {
    setTeams(prev => prev.map(t => t.id === id ? { ...t, name: newName } : t));
  };

  const exportToCSV = () => {
    const headers = ["Rank", "Team Name", "Campus", "Score"];
    const rows = sortedTeams.map(t => [t.rank, t.name, t.campus, t.score]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `tournament_results_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToJSON = () => {
    const data = {
      teams,
      logs,
      session,
      settings: { lang, bgImage, bgOpacity },
      totalMoves,
      exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `tournament_backup_${new Date().toISOString().slice(0, 10)}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleResetAll = () => {
    if (confirm(t.confirmResetAll)) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const toggleSession = () => {
    setSession(prev => ({
      ...prev,
      status: prev.status === 'active' ? 'paused' : 'active'
    }));
  };

  const resetSession = () => {
    if (confirm(t.confirmReset)) {
      setSession(prev => ({
        ...prev,
        currentQuestion: 1,
        timerSeconds: 0,
        status: 'idle'
      }));
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Background Image Layer */}
      {bgImage && (
        <div 
          className="fixed inset-0 pointer-events-none z-0 bg-cover bg-center transition-opacity duration-500"
          style={{ 
            backgroundImage: `url(${bgImage})`,
            opacity: bgOpacity 
          }}
        />
      )}

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#fff9ed] academic-card p-8 max-w-md w-full shadow-2xl"
            >
              <h2 className="font-headline text-3xl font-bold text-[#000a1e] mb-6 border-b border-[#6f5d00]/20 pb-2">
                {t.settings}
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block font-headline italic text-lg mb-2">{t.language}</label>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setLang('el')}
                      className={`flex-1 py-2 rounded-lg border-2 transition-all ${lang === 'el' ? 'border-[#800020] bg-[#f1e8cd] font-bold' : 'border-[#ebe2c8]'}`}
                    >
                      Ελληνικά
                    </button>
                    <button 
                      onClick={() => setLang('en')}
                      className={`flex-1 py-2 rounded-lg border-2 transition-all ${lang === 'en' ? 'border-[#800020] bg-[#f1e8cd] font-bold' : 'border-[#ebe2c8]'}`}
                    >
                      English
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-headline italic text-lg mb-2">{t.reset}</label>
                  <div className="flex flex-col gap-2">
                    <button 
                      onClick={() => {
                        if (confirm(t.confirmReset)) {
                          setTeams(prev => prev.map(t => ({ ...t, score: 0 })));
                          setLogs([]);
                          setTotalMoves(0);
                        }
                      }}
                      className="w-full py-2 bg-[#af2b3e] text-white font-headline rounded-lg academic-btn"
                    >
                      {t.reset}
                    </button>
                    <button 
                      onClick={handleResetAll}
                      className="w-full py-2 border-2 border-[#af2b3e] text-[#af2b3e] font-headline rounded-lg academic-btn hover:bg-[#af2b3e] hover:text-white transition-all"
                    >
                      {t.resetAll}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-headline italic text-lg mb-2">{t.exportJson}</label>
                  <button 
                    onClick={exportToJSON}
                    className="w-full py-2 bg-[#002147] text-white font-headline rounded-lg academic-btn"
                  >
                    {t.exportJson}
                  </button>
                </div>

                <div>
                  <label className="block font-headline italic text-lg mb-2">{t.bgImage}</label>
                  <input 
                    type="text"
                    value={bgImage}
                    onChange={(e) => setBgImage(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="w-full p-2 bg-[#fcf3d8] border border-[#ebe2c8] rounded-lg focus:outline-none focus:border-[#6f5d00]"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <label className="font-headline italic text-lg">{t.bgOpacity}</label>
                    <span className="font-bold">{(bgOpacity * 100).toFixed(0)}%</span>
                  </div>
                  <input 
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={bgOpacity}
                    onChange={(e) => setBgOpacity(parseFloat(e.target.value))}
                    className="w-full h-2 bg-[#ebe2c8] rounded-lg appearance-none cursor-pointer accent-[#6f5d00]"
                  />
                </div>
              </div>

              <button 
                onClick={() => setShowSettings(false)}
                className="w-full mt-8 py-3 bg-[#000a1e] text-white font-headline text-xl rounded-xl academic-btn"
              >
                {t.close}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="bg-[#fff9ed]/90 backdrop-blur-md border-b border-[#ebe2c8] sticky top-0 z-50 px-8 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 bg-[#002147] flex items-center justify-center text-white rounded-lg academic-btn">
            <BookOpen size={20} />
          </div>
          <h1 className="font-headline font-black text-2xl text-[#002147] tracking-tighter">
            {t.appName}
          </h1>
        </div>

        <nav className="hidden md:flex gap-8">
          {[
            { id: 'teams', label: t.teams, icon: LayoutDashboard },
            { id: 'scoreboard', label: t.scoreboard, icon: ListOrdered },
            { id: 'laurels', label: t.laurels, icon: Medal },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 font-headline text-lg tracking-tight uppercase italic transition-all border-b-2 px-1 pb-1 ${
                activeTab === tab.id 
                  ? 'border-[#800020] text-[#800020] font-bold' 
                  : 'border-transparent text-[#44474e] hover:text-[#002147]'
              }`}
            >
              <tab.icon size={18} />
              {normalizeGreek(tab.label, lang)}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowSettings(true)}
            className="p-2 text-[#44474e] hover:bg-[#f1e8cd] rounded-lg transition-colors"
          >
            <Settings size={20} />
          </button>
          <div className="h-10 w-10 bg-[#ebe2c8] border border-[#74777f]/10 overflow-hidden rounded-lg academic-card">
            <img 
              className="w-full h-full object-cover" 
              alt="Scholar portrait" 
              src="https://picsum.photos/seed/scholar/100/100"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-8 py-12 pb-32">
        <AnimatePresence mode="wait">
          {activeTab === 'teams' && (
            <motion.div
              key="teams"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-12 gap-10"
            >
              {/* Left Column: Team Management */}
              <div className="col-span-12 lg:col-span-8 flex flex-col gap-8">
                <header className="flex justify-between items-center">
                  <div>
                    <h2 className="text-4xl font-headline font-bold text-[#000a1e] tracking-tight">
                      {normalizeGreek(t.teams, lang)}
                    </h2>
                    <p className="text-[#44474e] italic">{session.title}</p>
                  </div>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => {
                        if (confirm(t.confirmReset)) {
                          setTeams(prev => prev.map(t => ({ ...t, score: 0 })));
                          setLogs([]);
                          setTotalMoves(0);
                        }
                      }}
                      className="px-6 py-3 border-2 border-[#af2b3e] text-[#af2b3e] font-headline text-lg flex items-center gap-2 rounded-xl academic-btn hover:bg-[#af2b3e] hover:text-white transition-all"
                    >
                      <RotateCcw size={20} />
                      {t.reset}
                    </button>
                    <button 
                      onClick={handleAddTeam}
                      className="px-6 py-3 bg-[#000a1e] text-white font-headline text-lg flex items-center gap-2 rounded-xl academic-btn shadow-lg hover:bg-[#002147]"
                    >
                      <PlusCircle size={20} />
                      {t.newTeam}
                    </button>
                  </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {teams.map((team) => (
                    <div 
                      key={team.id}
                      className="group relative bg-[#f1e8cd] p-6 rounded-xl academic-card border border-[#6f5d00]/10 hover:bg-white transition-all"
                    >
                      <button 
                        onClick={() => handleDeleteTeam(team.id)}
                        className="absolute top-4 right-4 p-2 text-[#af2b3e] opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={18} />
                      </button>

                      <div className="flex flex-col gap-4">
                        <div>
                          <h3 
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => handleUpdateTeamName(team.id, e.currentTarget.textContent || team.name)}
                            className="text-2xl font-headline font-bold text-[#000a1e] cursor-text focus:outline-none focus:ring-2 focus:ring-[#6f5d00]/20 rounded px-1 hover:bg-white/50 transition-colors"
                            title={t.editName}
                          >
                            {team.name}
                          </h3>
                          <p className="text-xs font-label uppercase tracking-widest text-[#74777f] font-bold">{normalizeGreek(team.campus, lang)}</p>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="relative">
                            <motion.div 
                              key={team.score}
                              initial={{ scale: 1.2, color: '#800020' }}
                              animate={{ scale: 1, color: '#000a1e' }}
                              className="text-4xl font-headline font-black"
                            >
                              {team.score.toLocaleString()}
                            </motion.div>
                            <AnimatePresence>
                              {lastScoreChange?.teamId === team.id && (
                                <motion.div
                                  initial={{ opacity: 0, y: 0 }}
                                  animate={{ opacity: 1, y: -40 }}
                                  exit={{ opacity: 0 }}
                                  className={`absolute top-0 left-0 font-headline font-bold text-2xl ${lastScoreChange.amount > 0 ? 'text-green-600' : 'text-red-600'}`}
                                >
                                  {lastScoreChange.amount > 0 ? `+${lastScoreChange.amount}` : lastScoreChange.amount}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                          <div className="flex gap-2">
                            {[-10, -5, 5, 10].map(val => (
                              <button
                                key={val}
                                onClick={() => handleAdjustScore(team.id, val, val > 0 ? t.quickAnswer : t.correction)}
                                className={`w-10 h-10 flex items-center justify-center rounded-lg font-bold transition-all academic-btn ${
                                  val > 0 
                                    ? 'bg-[#6f5d00] text-[#fff9ed] hover:bg-[#8e7a00]' 
                                    : 'bg-[#af2b3e] text-[#fff9ed] hover:bg-[#8e0f28]'
                                }`}
                              >
                                {val > 0 ? `+${val}` : val}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Stats & Logs */}
              <div className="col-span-12 lg:col-span-4 flex flex-col gap-8">
                {/* Stats Card */}
                <div className="bg-[#002147] text-[#fff9ed] p-8 rounded-xl academic-card">
                  <h3 className="font-headline text-2xl font-bold mb-6 border-b border-white/20 pb-4">
                    {t.tournamentParams}
                  </h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="p-4 bg-white/5 rounded-lg">
                      <p className="text-xs uppercase tracking-widest opacity-60 mb-1">{normalizeGreek(t.totalTeams, lang)}</p>
                      <p className="text-2xl font-headline font-bold">{stats.totalTeams}</p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-lg">
                      <p className="text-xs uppercase tracking-widest opacity-60 mb-1">{normalizeGreek(t.totalPoints, lang)}</p>
                      <p className="text-2xl font-headline font-bold">{stats.totalPoints}</p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                      <p className="text-xs uppercase tracking-widest opacity-60 mb-1">{normalizeGreek(t.leader, lang)}</p>
                      <p className="text-xl font-headline font-bold truncate text-[#ffe261]">{stats.leader}</p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-lg">
                      <p className="text-xs uppercase tracking-widest opacity-60 mb-1">{normalizeGreek(t.totalMoves, lang)}</p>
                      <p className="text-2xl font-headline font-bold">{stats.totalMoves}</p>
                    </div>
                  </div>
                </div>

                {/* Activity Logs */}
                <section className="academic-card p-8 border border-[#6f5d00]/10 flex-1">
                  <h2 className="text-xs uppercase tracking-[0.3em] font-bold text-[#000a1e] mb-6 flex items-center gap-2">
                    <History size={14} /> {normalizeGreek(t.recentActivity, lang)}
                  </h2>
                  <div className="space-y-6">
                    {logs.length === 0 ? (
                      <p className="text-sm italic text-[#44474e]">{t.noActivity}</p>
                    ) : (
                      logs.map(log => (
                        <div key={log.id} className="flex gap-4 items-start">
                          <div className={`mt-1 p-1 rounded ${log.points > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {log.points > 0 ? <Plus size={12} /> : <Minus size={12} />}
                          </div>
                          <div>
                            <p className="text-[#000a1e] font-bold">
                              {log.teamName} <span className="text-[#6f5d00] font-medium">{log.points > 0 ? '+' : ''}{log.points}</span>
                            </p>
                            <p className="text-sm italic text-[#44474e]">{log.reason}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </section>
              </div>
            </motion.div>
          )}

          {activeTab === 'scoreboard' && (
            <motion.div
              key="scoreboard"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-12"
            >
              {/* Podium Section */}
              <section className="flex flex-col md:flex-row items-end justify-center gap-0 mb-12">
                {/* 2nd Place */}
                <div className="w-full md:w-1/3 order-2 md:order-1">
                  <div className="bg-[#f1e8cd] p-8 text-center border-r border-[#ebe2c8] academic-card rounded-l-[12px] md:rounded-r-none">
                    <span className="text-4xl font-headline font-bold text-[#44474e] italic mb-4 block">{normalizeGreek(t.rank2, lang)}</span>
                    <h4 className="text-xl font-bold text-[#000a1e] mb-1 uppercase tracking-tighter">{normalizeGreek(sortedTeams[1]?.name || '---', lang)}</h4>
                    <div className="text-5xl font-headline font-black text-[#002147] py-4">{sortedTeams[1]?.score || 0}</div>
                  </div>
                </div>
                {/* 1st Place */}
                <div className="w-full md:w-1/3 order-1 md:order-2 z-10 scale-105 shadow-2xl">
                  <div className="bg-[#002147] text-[#fff9ed] p-10 text-center relative overflow-hidden rounded-[12px] academic-card ring-4 ring-[#ffe261]/30">
                    <div className="absolute top-0 right-0 p-4">
                      <Trophy className="text-[#ffe261] drop-shadow-[0_0_10px_rgba(255,226,97,0.5)]" size={32} fill="currentColor" />
                    </div>
                    <span className="text-5xl font-headline font-bold text-[#ffe261] italic mb-4 block drop-shadow-sm">{normalizeGreek(t.rank1, lang)}</span>
                    <h4 className="text-2xl font-bold text-white mb-1 uppercase tracking-widest">{normalizeGreek(sortedTeams[0].name, lang)}</h4>
                    <div className="text-7xl font-headline font-black text-[#ffe261] py-6 drop-shadow-md">{sortedTeams[0].score}</div>
                  </div>
                </div>
                {/* 3rd Place */}
                <div className="w-full md:w-1/3 order-3 md:order-3">
                  <div className="bg-[#f1e8cd] p-8 text-center border-l border-[#ebe2c8] academic-card rounded-r-[12px] md:rounded-l-none">
                    <span className="text-3xl font-headline font-bold text-[#44474e] italic mb-4 block">{normalizeGreek(t.rank3, lang)}</span>
                    <h4 className="text-lg font-bold text-[#000a1e] mb-1 uppercase tracking-tighter">{normalizeGreek(sortedTeams[2]?.name || '---', lang)}</h4>
                    <div className="text-4xl font-headline font-black text-[#002147] py-4">{sortedTeams[2]?.score || 0}</div>
                  </div>
                </div>
              </section>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                <div className="lg:col-span-4 space-y-12">
                  <header className="border-l-4 border-[#af2b3e] pl-6 py-2">
                    <h1 className="text-5xl font-extrabold font-headline text-[#000a1e] tracking-tighter leading-none mb-2">
                      {t.liveTally}
                    </h1>
                    <p className="text-[#af2b3e] font-semibold italic text-lg">
                      {t.sessionTitle}
                    </p>
                  </header>

                  <button 
                    onClick={exportToCSV}
                    className="w-full py-4 bg-[#6f5d00] text-white font-headline text-xl flex items-center justify-center gap-3 rounded-xl academic-btn hover:bg-[#8e7a00]"
                  >
                    <FileDown size={24} />
                    {t.exportCsv}
                  </button>

                  <div className="space-y-6">
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-sm uppercase tracking-[0.2em] text-[#74777f] font-bold mb-1">{normalizeGreek(t.sessionProgress, lang)}</p>
                        <h3 className="text-2xl font-headline italic">
                          {t.question} {session.currentQuestion} <span className="text-[#74777f]/50 font-light">{t.of} {session.totalQuestions}</span>
                        </h3>
                      </div>
                      <div className="text-right">
                        <p className="text-sm uppercase tracking-[0.2em] text-[#af2b3e] font-bold mb-1">{normalizeGreek(t.chronometer, lang)}</p>
                        <h3 className="text-2xl font-headline font-bold text-[#000a1e] tracking-widest">
                          {formatTime(session.timerSeconds)}
                        </h3>
                      </div>
                    </div>
                    <div className="relative w-full h-1 bg-[#ebe2c8] rounded-full overflow-hidden">
                      <motion.div 
                        className="absolute top-0 left-0 h-full bg-[#6f5d00]"
                        animate={{ width: `${(session.currentQuestion / session.totalQuestions) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-8">
                  <div className="academic-card bg-[#002147] p-1 pt-0">
                    <div className="flex justify-between items-center px-8 py-4 text-[#ffe261]">
                      <span className="text-xs uppercase tracking-[0.4em] font-bold">{normalizeGreek(t.rank, lang)}</span>
                      <span className="text-xs uppercase tracking-[0.4em] font-bold">{normalizeGreek(t.tally, lang)}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      {sortedTeams.map((team, idx) => (
                        <div 
                          key={team.id}
                          className="group bg-[#f1e8cd] flex items-center justify-between p-6 transition-all hover:bg-white border-b border-[#000a1e]/5"
                        >
                          <div className="flex items-center gap-8">
                            <div className="relative">
                              <div className={`w-16 h-16 rounded-lg flex items-center justify-center text-2xl font-bold italic academic-card ${
                                idx === 0 ? 'bg-[#ffe261] text-[#002147]' : 
                                idx === 1 ? 'bg-[#c0c0c0] text-[#002147]' : 
                                idx === 2 ? 'bg-[#cd7f32] text-[#002147]' : 
                                'bg-[#000a1e] text-[#ffe261]'
                              }`}>
                                {team.displayId || (idx + 1)}
                              </div>
                            </div>
                            <div>
                              <h3 className="text-2xl font-headline font-bold text-[#000a1e] tracking-tight">{team.name}</h3>
                              <div className="flex items-center gap-2 mt-1">
                                <div className="flex bg-[#ebe2c8] rounded-lg p-1 gap-1">
                                  {[-10, -5, 5, 10].map(val => (
                                    <button
                                      key={val}
                                      onClick={() => handleAdjustScore(team.id, val, val > 0 ? t.quickAnswer : t.correction)}
                                      className={`w-8 h-8 flex items-center justify-center rounded transition-all text-xs font-bold ${
                                        val > 0 
                                          ? 'hover:bg-[#6f5d00] hover:text-white' 
                                          : 'hover:bg-[#af2b3e] hover:text-white'
                                      }`}
                                    >
                                      {val > 0 ? `+${val}` : val}
                                    </button>
                                  ))}
                                </div>
                                <span className="text-xs uppercase tracking-widest text-[#74777f] font-bold ml-2">{normalizeGreek(team.campus, lang)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right flex items-center gap-4">
                            <AnimatePresence>
                              {lastScoreChange?.teamId === team.id && (
                                <motion.div
                                  initial={{ opacity: 0, x: 20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0 }}
                                  className={`font-headline font-bold text-xl ${lastScoreChange.amount > 0 ? 'text-green-600' : 'text-red-600'}`}
                                >
                                  {lastScoreChange.amount > 0 ? `+${lastScoreChange.amount}` : lastScoreChange.amount}
                                </motion.div>
                              )}
                            </AnimatePresence>
                            <span className="text-4xl font-headline font-black text-[#000a1e] tracking-tighter">
                              {team.score.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'laurels' && (
            <motion.div
              key="laurels"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="container mx-auto max-w-5xl"
            >
              <section className="text-center py-16 border-b border-[#c4c6cf]/20 mb-12">
                <p className="uppercase tracking-[0.3em] text-xs font-bold text-[#6f5d00] mb-4">{normalizeGreek(t.communique, lang)}</p>
                <h1 className="text-5xl md:text-7xl font-headline font-extrabold text-[#000a1e] italic tracking-tight mb-2">{t.grandLaurels}</h1>
                <p className="text-[#af2b3e] italic text-xl font-headline">{t.proclamation}</p>
              </section>

              <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-20 items-center">
                <div className="lg:col-span-5 order-2 lg:order-1">
                  <h2 className="text-4xl font-headline font-bold text-[#000a1e] mb-6 leading-tight">
                    {lang === 'el' ? (
                      <>Ο Δαφνοστεφής της<br/><span className="text-[#af2b3e]">Αριστείας</span></>
                    ) : (
                      <>The Laureate of<br/><span className="text-[#af2b3e]">Excellence</span></>
                    )}
                  </h2>
                  <div className="bg-[#ebe2c8] p-8 border-l-4 border-[#6f5d00] relative academic-card">
                    <span className="absolute -top-4 -left-4 text-6xl text-[#6f5d00] opacity-20 font-serif">“</span>
                    <h3 className="text-2xl font-bold text-[#000a1e] mb-2 uppercase tracking-wider">{normalizeGreek(sortedTeams[0].name, lang)}</h3>
                    <p className="text-[#44474e] leading-relaxed italic">
                      {t.laureateDesc.replace('{team}', sortedTeams[0].name)}
                    </p>
                  </div>
                </div>
                <div className="lg:col-span-7 order-1 lg:order-2 flex justify-center">
                  <div className="relative w-full max-w-md aspect-square bg-[#fcf3d8] flex items-center justify-center p-12 academic-card">
                    <img 
                      alt="golden laurel wreath" 
                      className="w-full h-full object-contain mix-blend-multiply opacity-90" 
                      src="https://picsum.photos/seed/laurels/500/500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 border-[16px] border-[#f1e8cd] pointer-events-none rounded-[12px]"></div>
                  </div>
                </div>
              </section>

              <section className="mb-24">
                <div className="flex items-baseline justify-between mb-10 border-b-2 border-[#6f5d00] pb-2">
                  <h2 className="text-2xl font-headline font-bold text-[#000a1e] italic">{t.orderMerit}</h2>
                  <span className="text-sm font-bold uppercase tracking-widest text-[#44474e]">{normalizeGreek(t.autumnTerm, lang)}</span>
                </div>
                <div className="flex flex-col md:flex-row items-end justify-center gap-0">
                  {/* 2nd Place */}
                  <div className="w-full md:w-1/3 order-2 md:order-1">
                    <div className="bg-[#f1e8cd] p-8 text-center border-r border-[#ebe2c8] academic-card rounded-l-[12px] md:rounded-r-none">
                      <span className="text-4xl font-headline font-bold text-[#44474e] italic mb-4 block">{normalizeGreek(t.rank2, lang)}</span>
                      <h4 className="text-xl font-bold text-[#000a1e] mb-1 uppercase tracking-tighter">{normalizeGreek(sortedTeams[1]?.name || '---', lang)}</h4>
                      <div className="text-5xl font-headline font-black text-[#002147] py-4">{sortedTeams[1]?.score || 0}</div>
                      <p className="text-xs uppercase tracking-widest text-[#6f5d00] font-bold">{normalizeGreek(t.pointsSecured, lang)}</p>
                    </div>
                  </div>
                  {/* 1st Place */}
                  <div className="w-full md:w-1/3 order-1 md:order-2 z-10 scale-105 shadow-2xl">
                    <div className="bg-[#002147] text-[#fff9ed] p-10 text-center relative overflow-hidden rounded-[12px] academic-card">
                      <div className="absolute top-0 right-0 p-4">
                        <Trophy className="text-[#ffe261]" size={32} fill="currentColor" />
                      </div>
                      <span className="text-5xl font-headline font-bold text-[#ffe261] italic mb-4 block">{normalizeGreek(t.rank1, lang)}</span>
                      <h4 className="text-2xl font-bold text-white mb-1 uppercase tracking-widest">{normalizeGreek(sortedTeams[0].name, lang)}</h4>
                      <div className="text-7xl font-headline font-black text-[#ffe261] py-6">{sortedTeams[0].score}</div>
                      <p className="text-xs uppercase tracking-widest text-[#ebe2c8] font-bold">{normalizeGreek(t.supremeDistinction, lang)}</p>
                    </div>
                  </div>
                  {/* 3rd Place */}
                  <div className="w-full md:w-1/3 order-3 md:order-3">
                    <div className="bg-[#f1e8cd] p-8 text-center border-l border-[#ebe2c8] academic-card rounded-r-[12px] md:rounded-l-none">
                      <span className="text-3xl font-headline font-bold text-[#44474e] italic mb-4 block">{normalizeGreek(t.rank3, lang)}</span>
                      <h4 className="text-lg font-bold text-[#000a1e] mb-1 uppercase tracking-tighter">{normalizeGreek(sortedTeams[2]?.name || '---', lang)}</h4>
                      <div className="text-4xl font-headline font-black text-[#002147] py-4">{sortedTeams[2]?.score || 0}</div>
                      <p className="text-xs uppercase tracking-widest text-[#6f5d00] font-bold">{normalizeGreek(t.pointsSecured, lang)}</p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
                <div className="col-span-full mb-4">
                  <h3 className="text-xs uppercase tracking-[0.4em] font-bold text-[#af2b3e] text-center">{normalizeGreek(t.individualCommendations, lang)}</h3>
                </div>
                {awards.map(award => (
                  <div key={award.id} className="bg-[#fcf3d8] border border-[#c4c6cf]/10 p-6 flex flex-col items-center text-center academic-card">
                    <div className="mb-4 text-[#000a1e]">
                      <AwardIcon size={32} />
                    </div>
                    <h5 className="text-lg font-bold text-[#000a1e] italic mb-2">{award.title}</h5>
                    <p className="text-sm text-[#44474e]">{award.description}</p>
                    <p className="mt-4 text-xs font-bold uppercase tracking-widest text-[#6f5d00]">{normalizeGreek(award.recipient, lang)}</p>
                  </div>
                ))}
              </section>

              <section className="flex flex-col items-center py-12 border-t border-[#c4c6cf]/30">
                <button className="group relative bg-[#000a1e] text-white px-12 py-5 font-headline font-bold text-xl tracking-tight flex items-center gap-4 hover:bg-[#002147] transition-all active:scale-95 rounded-[12px] shadow-xl">
                  <Download size={24} /> 
                  {t.downloadLedger}
                  <div className="absolute -right-6 -top-6 w-12 h-12 bg-[#af2b3e] rounded-full flex items-center justify-center shadow-lg border-2 border-[#800020] rotate-12 group-hover:rotate-0 transition-transform">
                    <span className="text-white text-xs font-black italic">AE</span>
                  </div>
                </button>
                <p className="mt-8 text-xs text-[#44474e] opacity-60 uppercase tracking-widest italic">{normalizeGreek(t.certified, lang)}</p>
              </section>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Mobile Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full flex justify-around items-center bg-[#fff9ed] border-t border-[#ebe2c8]/30 z-50 shadow-[0_-4px_12px_rgba(31,28,11,0.05)]">
        {[
          { id: 'teams', label: t.teams, icon: LayoutDashboard },
          { id: 'scoreboard', label: t.scoreboard, icon: ListOrdered },
          { id: 'laurels', label: t.laurels, icon: Medal },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex flex-col items-center justify-center pt-2 pb-4 w-full transition-all ${
              activeTab === tab.id 
                ? 'text-[#800020] border-t-4 border-[#800020] opacity-100' 
                : 'text-[#002147] opacity-50'
            }`}
          >
            <tab.icon size={20} />
            <span className="font-headline text-[10px] uppercase tracking-widest mt-1">{normalizeGreek(tab.label, lang)}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
