import React, { useState, useCallback, useMemo } from 'react';
import {
  ChevronLeft, CheckCircle2, Clock, AlertOctagon, BarChart3, LayoutGrid, Volume2, VolumeX,
  Hammer, Users, ArrowUpCircle, AlertTriangle, TrendingDown, Trophy,
  Copy, RefreshCw, Link2, Activity, UserMinus, UserPlus, FolderPlus, Crown,
  XCircle, Info, Edit3, Sparkles
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/contexts/ToastContext';
import { Sounds, isSoundMuted, setSoundMuted } from '@/utils/soundEngine';
import { getProjectProgress, getProjectStatus, getItemStatus, timeAgo, getRoleEmoji, flattenItems, getBottleneckItems } from '@/utils/helpers';
import Confetti from './Confetti';
import DependencyTree from './DependencyTree';
import SuggestedTasks from './SuggestedTasks';
import VersionHistory from './VersionHistory';
import EditPlanModal from './EditPlanModal';

interface ProjectPageProps {
  projectId: string;
  onBack: () => void;
}

const AccessDenied = ({ onBack }: { onBack: () => void }) => (
  <div className="min-h-screen bg-void flex flex-col items-center justify-center animate-fade-in">
    <div className="bg-red-dim/30 rounded-2xl p-6 mb-6">
      <XCircle size={64} className="text-craft-red" />
    </div>
    <h1 className="text-2xl text-craft-red mt-4">ACCESS DENIED</h1>
    <p className="text-lg text-muted-foreground mt-3">You are not a member of this project.</p>
    <p className="text-base text-muted-foreground mt-2">Ask the project owner for their invite code to join.</p>
    <button onClick={() => { Sounds.navigate(); onBack(); }}
      className="mt-8 border border-border text-muted-foreground px-6 py-2.5 rounded-lg hover:border-craft-blue hover:text-craft-blue text-xs">
      ← BACK TO DASHBOARD
    </button>
  </div>
);

const ProjectPage = ({ projectId, onBack }: ProjectPageProps) => {
  const { currentUser } = useAuth();
  const { projects, contribute, removeCollaborator, regenerateInviteCode } = useApp();
  const { addToast } = useToast();
  const [analyticsView, setAnalyticsView] = useState(false);
  const [muted, setMuted] = useState(isSoundMuted());
  const [contributeAmounts, setContributeAmounts] = useState<Record<string, number>>({});
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const [confirmRegen, setConfirmRegen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [lastContribute, setLastContribute] = useState(0);
  const [showEditPlan, setShowEditPlan] = useState(false);

  const project = projects.find(p => p.id === projectId);

  const isMember = useMemo(() => project?.members.some(m => m.userId === currentUser?.id) ?? false, [project, currentUser]);
  const isOwner = project?.ownerId === currentUser?.id;
  const progress = useMemo(() => project ? getProjectProgress(project.items) : 0, [project]);
  const status = useMemo(() => project ? getProjectStatus(project.items) : 'Blocked', [project]);
  const isComplete = status === 'Completed';

  // Get the current member's role
  const currentMemberRole = useMemo(() => {
    if (!project || !currentUser) return 'Miner';
    const member = project.members.find(m => m.userId === currentUser.id);
    return member?.role || 'Miner';
  }, [project, currentUser]);

  const toggleMute = useCallback(() => {
    if (!muted) Sounds.click();
    setSoundMuted(!muted);
    setMuted(!muted);
  }, [muted]);

  const handleContribute = useCallback((itemId: string, qty: number) => {
    if (Date.now() - lastContribute < 300) return;
    setLastContribute(Date.now());
    if (!project) return;

    const result = contribute(projectId, itemId, qty, currentUser!);
    if (result.success) {
      Sounds.success();
      if (result.itemCompleted) Sounds.itemComplete();
      if (result.projectCompleted) {
        Sounds.projectComplete();
        setShowConfetti(true);
        addToast('success', '🏆 PROJECT COMPLETE! Well crafted, team!');
      } else {
        addToast('success', `Contributed ${qty} items!`);
      }
      setContributeAmounts(prev => ({ ...prev, [itemId]: 1 }));
    } else {
      Sounds.error();
      addToast('error', result.error || 'Failed to contribute');
    }
  }, [projectId, currentUser, contribute, lastContribute, addToast, project]);

  const copyCode = useCallback(() => {
    if (!project) return;
    navigator.clipboard.writeText(project.inviteCode);
    Sounds.copy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [project]);

  const handleRegen = useCallback(() => {
    const newCode = regenerateInviteCode(projectId, currentUser!.username);
    Sounds.click();
    addToast('info', `New invite code: ${newCode}`);
    setConfirmRegen(false);
  }, [projectId, currentUser, regenerateInviteCode, addToast]);

  const handleRemoveMember = useCallback((userId: string) => {
    removeCollaborator(projectId, userId, currentUser!.username);
    Sounds.error();
    addToast('warning', 'Member removed');
    setConfirmRemove(null);
  }, [projectId, currentUser, removeCollaborator, addToast]);

  // Render guards AFTER all hooks
  if (!project || !isMember) return <AccessDenied onBack={onBack} />;

  const allFlat = flattenItems(project.items);
  const blockers = getBottleneckItems(project.items);
  const incompleteItems = allFlat.filter(i => getItemStatus(i) !== 'Completed');
  const slowestItem = incompleteItems.length > 0
    ? incompleteItems.reduce((a, b) => {
      const aPct = a.quantityRequired > 0 ? a.quantityCollected / a.quantityRequired : 1;
      const bPct = b.quantityRequired > 0 ? b.quantityCollected / b.quantityRequired : 1;
      return aPct < bPct ? a : b;
    })
    : null;

  const progressColor = progress > 60 ? 'text-craft-green' : progress > 30 ? 'text-craft-yellow' : 'text-craft-red';
  const progressBarGradient = progress > 60 ? 'from-green-dim to-craft-green' : progress > 30 ? 'from-yellow-dim to-craft-yellow' : 'from-red-dim to-craft-red';

  const statusData = [
    { name: 'Completed', value: allFlat.filter(i => getItemStatus(i) === 'Completed').length },
    { name: 'In Progress', value: allFlat.filter(i => getItemStatus(i) === 'In Progress').length },
    { name: 'Blocked', value: allFlat.filter(i => getItemStatus(i) === 'Blocked').length },
    { name: 'Blocking', value: allFlat.filter(i => getItemStatus(i) === 'Blocking').length },
  ].filter(d => d.value > 0);

  const itemProgressData = allFlat.map(i => ({
    name: i.name,
    percent: i.quantityRequired > 0 ? Math.round((Math.min(i.quantityCollected, i.quantityRequired) / i.quantityRequired) * 100) : 0,
  }));

  const contributorStats: Record<string, number> = {};
  allFlat.forEach(item => {
    item.contributions.forEach(c => {
      contributorStats[c.username] = (contributorStats[c.username] || 0) + c.quantity;
    });
  });
  const contributorData = Object.entries(contributorStats).map(([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total);

  const leaderboard = project.members.map(m => ({
    ...m,
    score: contributorStats[m.username] || 0,
  })).sort((a, b) => b.score - a.score);

  const activityIcon = (type: string) => {
    switch (type) {
      case 'contribution': return <ArrowUpCircle size={14} className="text-muted-foreground shrink-0" />;
      case 'item_completed': return <CheckCircle2 size={14} className="text-craft-green shrink-0" />;
      case 'project_completed': return <Trophy size={14} className="text-craft-yellow shrink-0" />;
      case 'member_joined': return <UserPlus size={14} className="text-craft-blue shrink-0" />;
      case 'member_removed': return <UserMinus size={14} className="text-craft-red shrink-0" />;
      case 'project_created': return <FolderPlus size={14} className="text-craft-purple shrink-0" />;
      case 'code_regenerated': return <RefreshCw size={14} className="text-craft-orange shrink-0" />;
      case 'enchantment_added': return <Sparkles size={14} className="text-craft-purple shrink-0" />;
      case 'plan_updated': return <Edit3 size={14} className="text-craft-orange shrink-0" />;
      default: return <Info size={14} className="text-muted-foreground shrink-0" />;
    }
  };

  const activityBorder = (type: string) => {
    switch (type) {
      case 'item_completed': return 'border-l-2 border-l-craft-green bg-green-dim/10';
      case 'project_completed': return 'border-l-2 border-l-craft-yellow bg-yellow-dim/10';
      case 'member_joined': return 'border-l-2 border-l-craft-blue bg-blue-dim/10';
      case 'member_removed': return 'border-l-2 border-l-craft-red';
      case 'project_created': return 'border-l-2 border-l-craft-purple';
      case 'code_regenerated': return 'border-l-2 border-l-craft-orange';
      case 'enchantment_added': return 'border-l-2 border-l-craft-purple bg-purple-dim/10';
      case 'plan_updated': return 'border-l-2 border-l-craft-orange bg-orange-dim/10';
      default: return 'border-l-2 border-l-border';
    }
  };

  const roleBg = (role: string) => {
    switch (role) {
      case 'Miner': return 'bg-green-dim text-craft-green';
      case 'Crafter': return 'bg-blue-dim text-craft-blue';
      case 'Planner': return 'bg-purple-dim text-craft-purple';
      default: return 'bg-base text-muted-foreground';
    }
  };

  const CHART_COLORS = ['#39d353', '#e3b341', '#d29922', '#f85149'];

  return (
    <div className="min-h-screen bg-void flex flex-col">
      <Confetti active={showConfetti} />
      {showEditPlan && <EditPlanModal projectId={projectId} currentItems={project.items} onClose={() => setShowEditPlan(false)} />}

      <nav className="min-h-14 bg-base border-b border-border px-4 sm:px-6 py-2 flex flex-col sm:flex-row items-center justify-between shrink-0 gap-3 sm:gap-0">
        <div className="flex items-center justify-between w-full sm:w-auto">
          <button onClick={() => { Sounds.navigate(); onBack(); }} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
            <ChevronLeft size={16} /> <span className="hidden sm:inline">DASHBOARD</span>
          </button>
          <div className="flex sm:hidden items-center gap-2">
            <button onClick={toggleMute} className="text-muted-foreground p-2 rounded-lg hover:bg-elevated">
              {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground truncate max-w-[120px] sm:max-w-[200px]">{project.name}</span>
          <span className={`text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 ${status === 'Completed' ? 'bg-green-dim text-craft-green' : status === 'In Progress' ? 'bg-yellow-dim text-craft-yellow' : 'bg-red-dim text-craft-red'}`}>
            {status === 'Completed' ? <CheckCircle2 size={12} /> : status === 'In Progress' ? <Clock size={12} /> : <AlertOctagon size={12} />}
            {status.toUpperCase()}
          </span>
          <span className="text-[9px] px-2 py-0.5 rounded-full bg-orange-dim text-craft-orange">v{project.version}</span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar py-1">
          {isOwner && (
            <button onClick={() => { Sounds.click(); setShowEditPlan(true); }}
              className="flex-1 sm:flex-none border border-border text-[10px] sm:text-xs px-2 sm:px-3 py-1.5 rounded-lg flex items-center justify-center gap-1.5 text-muted-foreground hover:border-craft-orange hover:text-craft-orange transition-all whitespace-nowrap">
              <Edit3 size={14} className="sm:size-4" /> EDIT <span className="hidden sm:inline">PLAN</span>
            </button>
          )}
          <button onClick={() => { Sounds.click(); setAnalyticsView(!analyticsView); }}
            className={`flex-1 sm:flex-none border text-[10px] sm:text-xs px-2 sm:px-3 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all whitespace-nowrap ${analyticsView ? 'border-craft-purple text-craft-purple bg-purple-dim/20' : 'border-border text-muted-foreground'}`}>
            {analyticsView ? <><LayoutGrid size={14} className="sm:size-4" /> TASKS</> : <><BarChart3 size={14} className="sm:size-4" /> STATS</>}
          </button>
          <button onClick={toggleMute} className="hidden sm:block text-muted-foreground hover:text-foreground p-2 rounded-lg hover:bg-elevated">
            {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
        </div>
      </nav>

      {isComplete && (
        <div className="animate-celebration bg-gradient-to-r from-green-dim via-elevated to-green-dim border-b border-craft-green/40 px-6 py-3 flex items-center gap-3">
          <Trophy size={20} className="text-craft-yellow animate-pulse-slow" />
          <span className="text-xl text-craft-green">🏆 PROJECT COMPLETE! Well crafted, team!</span>
          {project.completedAt && <span className="text-sm text-muted-foreground ml-auto">Completed {timeAgo(project.completedAt)}</span>}
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 bg-panel">
          {/* Overview Card */}
          <div className="bg-elevated rounded-2xl border border-border p-6 mb-6 animate-slide-up">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">{project.name}</h2>
              <span className="text-xs text-muted-foreground">Created {timeAgo(project.createdAt)}</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Hammer size={16} className="text-craft-green" />
              <span className="text-sm text-muted-foreground">Crafting: {project.finalItem}</span>
            </div>
            <div className="mt-5">
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-muted-foreground">PROGRESS</span>
                <span className={`text-lg animate-count-up ${progressColor}`}>{progress}%</span>
              </div>
              <div className="h-3 bg-base rounded-full overflow-hidden mt-2 border border-border">
                <div className={`h-full rounded-full transition-all duration-700 bg-gradient-to-r ${progressBarGradient} ${!isComplete ? 'progress-shimmer' : ''}`} style={{ width: `${progress}%` }} />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-base rounded-xl p-3"><div className="flex items-center gap-1"><CheckCircle2 size={12} className="text-craft-green" /><span className="text-[10px] text-muted-foreground">Items</span></div><div className="text-sm font-bold text-foreground">{allFlat.filter(i => getItemStatus(i) === 'Completed').length}/{allFlat.length}</div></div>
              <div className="bg-base rounded-xl p-3"><div className="flex items-center gap-1"><Users size={12} className="text-craft-blue" /><span className="text-[10px] text-muted-foreground">Team</span></div><div className="text-sm font-bold text-foreground">{project.members.length}</div></div>
              <div className="bg-base rounded-xl p-3"><div className="flex items-center gap-1"><ArrowUpCircle size={12} className="text-craft-purple" /><span className="text-[10px] text-muted-foreground">Contribs</span></div><div className="text-sm font-bold text-foreground">{allFlat.reduce((s, i) => s + i.contributions.length, 0)}</div></div>
              <div className="bg-base rounded-xl p-3"><div className="flex items-center gap-1"><Sparkles size={12} className="text-craft-purple" /><span className="text-[10px] text-muted-foreground">Enchanted</span></div><div className="text-sm font-bold text-foreground">{allFlat.filter(i => i.enchantment).length}</div></div>
            </div>
          </div>

          {!analyticsView ? (
            <>
              {/* Dependency Tree */}
              <div className="bg-elevated rounded-2xl border border-border overflow-hidden mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <div className="bg-base border-b border-border px-4 py-3 flex items-center justify-between">
                  <span className="text-[9px] text-muted-foreground uppercase tracking-widest">CRAFTING DEPENDENCIES</span>
                  <span className="text-[9px] text-muted-foreground">{allFlat.filter(i => getItemStatus(i) === 'Completed').length}/{allFlat.length} items done</span>
                </div>
                <div className="p-2">
                  <DependencyTree
                    items={project.items}
                    contributeAmounts={contributeAmounts}
                    setContributeAmounts={setContributeAmounts}
                    onContribute={handleContribute}
                    isProjectComplete={isComplete}
                  />
                </div>
              </div>

              {/* Bottleneck Panel */}
              <div className={`rounded-2xl border overflow-hidden mb-6 animate-slide-up ${blockers.length > 0 ? 'border-craft-red/40 bg-red-dim/20' : 'border-craft-green/30 bg-green-dim/20'}`} style={{ animationDelay: '0.2s' }}>
                <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                  {blockers.length > 0 ? (
                    <><AlertTriangle size={16} className="text-craft-red animate-pulse-slow" /><span className="text-[9px] text-craft-red">BOTTLENECK ALERT</span></>
                  ) : (
                    <><CheckCircle2 size={16} className="text-craft-green" /><span className="text-[9px] text-craft-green">ALL CLEAR</span></>
                  )}
                </div>
                <div className="px-4 py-4 space-y-3">
                  {blockers.length > 0 ? (
                    <>
                      <div className="flex items-center gap-2"><AlertOctagon size={14} className="text-craft-red" /><span className="text-[10px] text-craft-red font-semibold">HIGH PRIORITY BLOCKERS</span></div>
                      {blockers.slice(0, 5).map(b => (
                        <div key={b.id} className="flex items-center gap-2 bg-red-dim/30 rounded-lg px-3 py-2">
                          <div className="w-2 h-2 bg-craft-red rounded-full shrink-0" />
                          <span className="text-sm text-foreground">{b.name}</span>
                          <span className="text-xs text-muted-foreground ml-auto">0 / {b.quantityRequired}</span>
                        </div>
                      ))}
                      {slowestItem && getItemStatus(slowestItem) !== 'Blocking' && (
                        <div className="mt-2">
                          <div className="flex items-center gap-2"><TrendingDown size={14} className="text-craft-orange" /><span className="text-[10px] text-craft-orange font-semibold">SLOWEST ITEM</span></div>
                          <div className="bg-orange-dim/20 rounded-lg px-3 py-3 mt-1">
                            <span className="text-sm font-medium text-foreground">{slowestItem.name}</span>
                            <p className="text-xs text-craft-orange">⚠ Only {Math.round((slowestItem.quantityCollected / slowestItem.quantityRequired) * 100)}% collected</p>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col items-center py-4">
                      <CheckCircle2 size={32} className="text-craft-green" />
                      <p className="text-lg text-muted-foreground text-center mt-2">No blockers! Everything is on track.</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-elevated rounded-2xl border border-border p-3 sm:p-5">
                <div className="flex items-center gap-2 mb-4"><Trophy size={16} className="text-craft-purple" /><span className="text-[9px] text-foreground">COMPLETION STATUS</span></div>
                <div className="flex justify-center h-[220px] w-full">
                  <PieChart width={280} height={220}>
                    <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" label>
                      {statusData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '8px', color: '#e6edf3' }} />
                    <Legend formatter={(value) => <span style={{ color: '#8b949e', fontSize: '10px' }}>{value}</span>} />
                  </PieChart>
                </div>
              </div>
              <div className="bg-elevated rounded-2xl border border-border p-3 sm:p-5 overflow-hidden">
                <div className="flex items-center gap-2 mb-4"><BarChart3 size={16} className="text-craft-blue" /><span className="text-[9px] text-foreground">ITEM COMPLETION %</span></div>
                <div className="h-[300px] w-full max-w-full overflow-x-auto">
                  <BarChart data={itemProgressData} layout="vertical" width={280} height={Math.max(250, itemProgressData.length * 30)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#21262d" horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} tick={{ fill: '#8b949e', fontSize: 10 }} />
                    <YAxis type="category" dataKey="name" tick={{ fill: '#8b949e', fontSize: 10 }} width={70} />
                    <Tooltip contentStyle={{ backgroundColor: '#161b22', border: '1px solid #30363d', color: '#e6edf3' }} />
                    <Bar dataKey="percent" radius={[0, 4, 4, 0]}>
                      {itemProgressData.map((entry, i) => <Cell key={i} fill={entry.percent === 100 ? '#39d353' : entry.percent > 0 ? '#e3b341' : '#f85149'} />)}
                    </Bar>
                  </BarChart>
                </div>
              </div>
              <div className="bg-elevated rounded-2xl border border-border p-3 sm:p-5">
                <div className="flex items-center gap-2 mb-4"><Trophy size={16} className="text-craft-purple" /><span className="text-[9px] text-foreground">CONTRIBUTOR STATS</span></div>
                <div className="h-[200px] w-full">
                  <BarChart data={contributorData} width={280} height={200}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
                    <XAxis dataKey="name" tick={{ fill: '#8b949e', fontSize: 10 }} />
                    <YAxis tick={{ fill: '#8b949e', fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#161b22', border: '1px solid #30363d', color: '#e6edf3' }} />
                    <Bar dataKey="total" fill="#bc8cff" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel */}
        <div className="w-80 bg-base border-l border-border flex flex-col overflow-y-auto shrink-0 hidden lg:flex">
          {/* Suggested Tasks */}
          <SuggestedTasks role={currentMemberRole} items={project.items} onContribute={handleContribute} />

          {/* Members */}
          <div className="border-b border-border">
            <div className="px-4 py-3 flex items-center gap-2">
              <Users size={16} className="text-craft-blue" />
              <span className="text-[9px] text-muted-foreground">TEAM MEMBERS</span>
              <span className="ml-auto bg-blue-dim text-craft-blue text-[9px] px-2 py-0.5 rounded-full">{project.members.length}</span>
            </div>
            <div className="px-3 py-2 space-y-1">
              {project.members.map(member => (
                <div key={member.userId} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-bg-hover transition-colors">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${roleBg(member.role)}`}>{member.username[0]}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground flex items-center gap-1 truncate">
                      {member.userId === project.ownerId && <Crown size={12} className="text-craft-yellow shrink-0" />}
                      {member.username}
                    </div>
                    <div className="text-xs text-muted-foreground">{getRoleEmoji(member.role)} {member.role} · {timeAgo(member.joinedAt)}</div>
                  </div>
                  {isOwner && member.userId !== currentUser?.id && (
                    confirmRemove === member.userId ? (
                      <div className="flex items-center gap-1 text-[10px]">
                        <span className="text-muted-foreground">Sure?</span>
                        <button onClick={() => handleRemoveMember(member.userId)} className="text-craft-red hover:underline">Yes</button>
                        <button onClick={() => setConfirmRemove(null)} className="text-muted-foreground hover:underline">No</button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmRemove(member.userId)} className="text-muted-foreground hover:text-craft-red hover:bg-red-dim/40 p-1.5 rounded-lg transition-all">
                        <UserMinus size={14} />
                      </button>
                    )
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Invite Code */}
          <div className="border-b border-border">
            <div className="px-4 py-3 flex items-center gap-2">
              <Link2 size={16} className="text-craft-green" />
              <span className="text-[9px] text-muted-foreground">INVITE CODE</span>
            </div>
            <div className="px-4 py-4">
              <div className="bg-base border-2 border-craft-green/30 rounded-xl p-4 text-center hover:border-craft-green/60 transition-all">
                <div className="font-mono font-black text-2xl tracking-[0.4em] text-craft-green">{project.inviteCode}</div>
                <p className="text-xs text-muted-foreground mt-2">Share this code with your team</p>
              </div>
              <div className="mt-3 flex gap-2">
                <button onClick={copyCode}
                  className={`flex-1 bg-elevated border rounded-lg py-2 flex items-center justify-center gap-2 transition-all ${copied ? 'border-craft-green text-craft-green' : 'border-border text-muted-foreground hover:text-foreground'}`}>
                  {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                  <span className="text-[8px]">{copied ? 'COPIED!' : 'COPY'}</span>
                </button>
                {isOwner && (
                  confirmRegen ? (
                    <div className="flex items-center gap-1 text-[10px] border border-border rounded-lg px-2">
                      <button onClick={handleRegen} className="text-craft-orange hover:underline">OK</button>
                      <button onClick={() => setConfirmRegen(false)} className="text-muted-foreground hover:underline">No</button>
                    </div>
                  ) : (
                    <button onClick={() => { Sounds.click(); setConfirmRegen(true); }} className="border border-border rounded-lg py-2 px-3 text-muted-foreground hover:text-craft-orange hover:border-craft-orange transition-all" title="Generate new code">
                      <RefreshCw size={14} />
                    </button>
                  )
                )}
              </div>
            </div>
          </div>

          {/* Activity Feed */}
          <div className="border-b border-border">
            <div className="px-4 py-3 flex items-center gap-2">
              <Activity size={16} className="text-craft-purple" />
              <span className="text-[9px] text-muted-foreground">ACTIVITY FEED</span>
              <div className="ml-auto flex items-center gap-1">
                <div className="w-2 h-2 bg-craft-green rounded-full animate-pulse-slow" />
                <span className="text-[7px] text-craft-green">LIVE</span>
              </div>
            </div>
            <div className="px-3 py-2 max-h-52 overflow-y-auto space-y-1">
              {project.activity.length === 0 ? (
                <p className="text-lg text-muted-foreground text-center py-4">No activity yet. Start contributing!</p>
              ) : (
                project.activity.map(act => (
                  <div key={act.id} className={`px-3 py-2.5 rounded-xl ${activityBorder(act.type)}`}>
                    <div className="flex items-start gap-2">
                      {activityIcon(act.type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground">{act.message}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{timeAgo(act.timestamp)}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Version History */}
          <VersionHistory currentVersion={project.version} history={project.versionHistory} />

          {/* Leaderboard */}
          <div>
            <div className="px-4 py-3 flex items-center gap-2">
              <Trophy size={16} className="text-craft-yellow" />
              <span className="text-[9px] text-muted-foreground">LEADERBOARD</span>
            </div>
            <div className="px-3 py-3 space-y-2">
              {leaderboard.map((entry, i) => (
                <div key={entry.userId} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ${entry.userId === currentUser?.id ? 'bg-craft-green/5 border border-craft-green/20' : ''}`}>
                  <div className="w-8 text-center">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : <span className="text-xs text-muted-foreground font-bold">{i + 1}.</span>}</div>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm ${roleBg(entry.role)}`}>{entry.username[0]}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">{entry.username} {entry.userId === currentUser?.id && <span className="text-craft-green">(You)</span>}</div>
                    <div className="text-[10px] text-muted-foreground">{entry.role}</div>
                  </div>
                  <div className="ml-auto text-right">
                    {entry.score > 0 ? <><span className="text-sm font-bold text-craft-green">{entry.score}</span><span className="text-[10px] text-muted-foreground ml-1">units</span></> : <span className="text-xs text-muted-foreground">—</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectPage;
