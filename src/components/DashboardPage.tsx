import React, { useState } from 'react';
import { Plus, LogIn, Volume2, VolumeX, LogOut, FolderOpen, Users, Trophy, ChevronRight, Clock, Copy } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/contexts/ToastContext';
import { Sounds, isSoundMuted, setSoundMuted } from '@/utils/soundEngine';
import { getProjectProgress, getProjectStatus, timeAgo, getRoleEmoji } from '@/utils/helpers';
import CreateProjectModal from './CreateProjectModal';
import JoinProjectModal from './JoinProjectModal';

interface DashboardPageProps {
  onOpenProject: (id: string) => void;
  onLogout: () => void;
}

const DashboardPage = ({ onOpenProject, onLogout }: DashboardPageProps) => {
  const { currentUser } = useAuth();
  const { projects } = useApp();
  const { addToast } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [muted, setMuted] = useState(isSoundMuted());

  const userProjects = projects.filter(p => p.members.some(m => m.userId === currentUser?.id));
  const ownedCount = userProjects.filter(p => p.ownerId === currentUser?.id).length;
  const collabCount = userProjects.length - ownedCount;
  const completedCount = userProjects.filter(p => getProjectStatus(p.items) === 'Completed').length;

  const toggleMute = () => {
    if (!muted) Sounds.click();
    setSoundMuted(!muted);
    setMuted(!muted);
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    Sounds.copy();
    addToast('success', 'Invite code copied!');
  };

  const roleBadgeClass = (role: string) => {
    switch (role) {
      case 'Miner': return 'bg-green-dim text-craft-green border border-craft-green/30';
      case 'Crafter': return 'bg-blue-dim text-craft-blue border border-craft-blue/30';
      case 'Planner': return 'bg-purple-dim text-craft-purple border border-craft-purple/30';
      default: return '';
    }
  };

  const progressColor = (pct: number) => pct > 60 ? 'bg-craft-green' : pct > 30 ? 'bg-craft-yellow' : 'bg-craft-red';
  const statusColor = (status: string) => status === 'Completed' ? 'bg-craft-green' : status === 'In Progress' ? 'bg-craft-yellow' : 'bg-craft-red';

  return (
    <div className="min-h-screen bg-void">
      {/* Navbar */}
      <nav className="min-h-16 bg-base border-b border-border px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-center justify-between sticky top-0 z-40 gap-4 sm:gap-0">
        <div className="flex items-center justify-between w-full sm:w-auto">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 bg-craft-green rounded-sm" />
            <span className="text-sm font-bold text-craft-green tracking-widest">CRAFTCHAIN</span>
            <div className="w-2 h-2 bg-craft-green rounded-full animate-pulse" />
          </div>
          <div className="flex sm:hidden items-center gap-2">
            <button onClick={toggleMute} className="text-muted-foreground p-2 rounded-lg hover:bg-elevated">
              {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <button onClick={() => { Sounds.navigate(); onLogout(); }} className="text-muted-foreground p-2 rounded-lg hover:bg-red-dim/20">
              <LogOut size={18} />
            </button>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <span className="text-sm text-muted-foreground line-clamp-1">Welcome, {currentUser?.username}</span>
          <span className={`text-[8px] px-2 py-0.5 rounded-full whitespace-nowrap ${roleBadgeClass(currentUser?.role || '')}`}>
            {getRoleEmoji(currentUser?.role || '')} {currentUser?.role}
          </span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button onClick={() => { Sounds.click(); Sounds.modalOpen(); setShowCreate(true); }}
            className="flex-1 sm:flex-none bg-craft-green text-primary-foreground text-[10px] sm:text-xs font-semibold px-3 sm:px-4 py-2 rounded-lg hover:shadow-glow-green flex items-center justify-center gap-1.5 whitespace-nowrap">
            <Plus size={16} /> NEW PROJECT
          </button>
          <button onClick={() => { Sounds.click(); setShowJoin(true); }}
            className="flex-1 sm:flex-none border border-border text-muted-foreground text-[10px] sm:text-xs px-3 sm:px-4 py-2 rounded-lg hover:border-craft-blue hover:text-craft-blue flex items-center justify-center gap-1.5 whitespace-nowrap">
            <LogIn size={16} /> JOIN
          </button>
          <div className="hidden sm:block w-px h-6 bg-border mx-1" />
          <button onClick={toggleMute} className="hidden sm:block text-muted-foreground hover:text-foreground p-2 rounded-lg hover:bg-elevated" title="Sound On/Off">
            {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <button onClick={() => { Sounds.navigate(); onLogout(); }} className="hidden sm:block text-muted-foreground hover:text-craft-red p-2 rounded-lg hover:bg-red-dim/20">
            <LogOut size={18} />
          </button>
        </div>
      </nav>

      <div className="px-4 sm:px-6 py-4">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl">
          {[
            { label: 'TOTAL PROJECTS', value: userProjects.length, icon: FolderOpen, iconBg: 'bg-blue-dim', iconColor: 'text-craft-blue' },
            { label: 'COLLABORATING', value: collabCount, icon: Users, iconBg: 'bg-purple-dim', iconColor: 'text-craft-purple' },
            { label: 'COMPLETED', value: completedCount, icon: Trophy, iconBg: 'bg-green-dim', iconColor: 'text-craft-green' },
          ].map((stat, i) => (
            <div key={i} className="bg-elevated rounded-xl p-4 border border-border flex items-center gap-4 hover:border-craft-blue transition-all duration-200">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.iconBg}`}>
                <stat.icon size={20} className={stat.iconColor} />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
                <div className={`text-2xl font-bold ${stat.label === 'COMPLETED' && stat.value > 0 ? 'text-craft-green' : 'text-foreground'}`}>{stat.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Projects Grid */}
        {userProjects.length === 0 ? (
          <div className="mt-20 flex flex-col items-center text-center animate-fade-in">
            <div className="text-8xl mb-6 animate-float">⛏️</div>
            <h2 className="text-xl text-muted-foreground mb-2">NO PROJECTS YET</h2>
            <p className="text-lg text-muted-foreground max-w-sm">Start your first crafting plan or join a team with an invite code.</p>
            <div className="flex gap-4 mt-8">
              <button onClick={() => { Sounds.click(); setShowCreate(true); }} className="bg-craft-green text-primary-foreground font-bold text-xs px-6 py-3 rounded-lg hover:shadow-glow-green">+ CREATE PROJECT</button>
              <button onClick={() => { Sounds.click(); setShowJoin(true); }} className="border border-border text-muted-foreground text-xs px-6 py-3 rounded-lg hover:border-craft-blue hover:text-craft-blue">JOIN WITH CODE</button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6 pb-6">
            {userProjects.map((project, i) => {
              const progress = getProjectProgress(project.items);
              const status = getProjectStatus(project.items);
              const isOwner = project.ownerId === currentUser?.id;
              return (
                <div key={project.id} className="bg-elevated rounded-2xl border border-border overflow-hidden hover:border-craft-blue hover:shadow-card transition-all duration-300 cursor-pointer relative animate-slide-up"
                  style={{ animationDelay: `${i * 0.05}s` }}>
                  <div className={`h-2 w-full ${statusColor(status)}`} />
                  {isOwner && <div className="absolute top-2 right-0 bg-yellow-dim text-craft-yellow text-[7px] px-2 py-0.5 rounded-bl-lg rounded-tr-xl">OWNER ★</div>}
                  <div className="p-5">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-foreground truncate">{project.name}</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${status === 'Completed' ? 'bg-green-dim text-craft-green' : status === 'In Progress' ? 'bg-yellow-dim text-craft-yellow' : 'bg-red-dim text-craft-red'}`}>{status.toUpperCase()}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">🔨 Crafting: {project.finalItem}</p>

                    <div className="mt-4">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Progress</span>
                        <span className="font-bold">{progress}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-base overflow-hidden mt-1">
                        <div className={`h-full rounded-full transition-all duration-700 ${progressColor(progress)}`} style={{ width: `${progress}%` }} />
                      </div>
                    </div>

                    <div className="mt-4 flex justify-between">
                      <span className="text-xs text-muted-foreground flex items-center gap-1"><Users size={14} /> {project.members.length} crafters</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock size={14} /> {timeAgo(project.createdAt)}</span>
                    </div>

                    {isOwner && (
                      <div className="mt-3 bg-base rounded-lg px-3 py-2 flex items-center justify-between">
                        <span className="text-xs"><span className="text-[8px] text-muted-foreground">INVITE:</span> <span className="text-craft-green font-mono">{project.inviteCode}</span></span>
                        <button onClick={(e) => { e.stopPropagation(); copyCode(project.inviteCode); }} className="text-muted-foreground hover:text-craft-blue"><Copy size={14} /></button>
                      </div>
                    )}

                    <button onClick={() => { Sounds.navigate(); onOpenProject(project.id); }}
                      className="mt-4 w-full border border-border text-muted-foreground text-xs py-2.5 rounded-lg hover:border-craft-green hover:text-craft-green text-[9px] tracking-widest flex items-center justify-center gap-1">
                      OPEN PROJECT <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showCreate && <CreateProjectModal onClose={() => setShowCreate(false)} />}
      {showJoin && <JoinProjectModal onClose={() => setShowJoin(false)} />}
    </div>
  );
};

export default DashboardPage;
