import React, { useState } from 'react';
import { AppData, TabId } from '../types';
import { ChevronRight, Sparkles, Send, Calendar, Clock } from 'lucide-react';

interface DashboardProps {
  data: AppData;
  setActiveTab: (tab: TabId) => void;
  onMagicInput: (text: string) => Promise<string>;
}

const StatCard = ({ value, label, accent, delay }: { value: number; label: string; accent?: boolean, delay: string }) => (
  <div 
    style={{ animationDelay: delay }}
    className={`p-6 rounded-3xl border border-white/40 backdrop-blur-md transition-all duration-500 hover:-translate-y-1 animate-fade-in-up ${
    accent 
      ? 'bg-clay/90 text-white shadow-lg shadow-clay/20' 
      : 'bg-white/60 text-ink shadow-apple-card hover:shadow-apple-hover'
  }`}>
    <div className={`text-5xl font-serif font-bold mb-3 tracking-tight ${accent ? 'text-white' : 'text-clay'}`}>
      {value}
    </div>
    <div className={`text-[10px] font-bold tracking-[0.2em] uppercase ${accent ? 'text-white/80' : 'text-subtle'}`}>
      {label}
    </div>
  </div>
);

export const Dashboard: React.FC<DashboardProps> = ({ data, setActiveTab, onMagicInput }) => {
  const [magicInput, setMagicInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [magicStatus, setMagicStatus] = useState<string | null>(null);

  const today = new Date().toISOString().split('T')[0];
  
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const upcomingMeetings = data.meetings
    .filter(m => m.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3);

  const needsAttention = data.actionItems
    .filter(a => a.status !== 'completed')
    .sort((a, b) => {
      if (a.dueDate && a.dueDate < today) return -1;
      if (b.dueDate && b.dueDate < today) return 1;
      return (a.dueDate || 'z').localeCompare(b.dueDate || 'z');
    })
    .slice(0, 4);

  const recentCorrespondence = data.correspondence
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 3);

  const stats = {
    upcoming: data.meetings.filter(m => m.date >= today).length,
    pending: data.actionItems.filter(a => a.status !== 'completed').length,
    overdue: data.actionItems.filter(a => a.status !== 'completed' && a.dueDate && a.dueDate < today).length,
    thisWeek: data.correspondence.filter(c => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(c.date) >= weekAgo;
    }).length,
  };

  const handleMagicSubmit = async () => {
    if (!magicInput.trim()) return;
    setIsProcessing(true);
    setMagicStatus(null);
    const result = await onMagicInput(magicInput);
    setMagicStatus(result);
    setIsProcessing(false);
    if (!result.startsWith('Error')) {
      setMagicInput('');
    }
  };

  return (
    <div className="space-y-12 pb-12">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 pb-6 animate-fade-in-up">
        <div>
          <h1 className="text-5xl md:text-6xl font-serif font-bold text-ink mb-4 tracking-tight drop-shadow-sm">
            {getGreeting()}.
          </h1>
          <p className="text-lg text-subtle font-serif italic pl-1 opacity-80">
            Overview for {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-4">
          <button 
             onClick={() => setActiveTab('actionItems')}
             className="bg-white/50 backdrop-blur-sm border border-white/60 px-6 py-3 rounded-2xl text-sm font-semibold text-ink shadow-sm hover:shadow-apple-hover hover:scale-105 transition-all duration-300"
          >
            + Quick Task
          </button>
          <button 
             onClick={() => setActiveTab('correspondence')}
             className="bg-clay text-white px-6 py-3 rounded-2xl text-sm font-semibold shadow-lg shadow-clay/30 hover:shadow-clay/50 hover:scale-105 transition-all duration-300"
          >
            Log Activity
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard value={stats.upcoming} label="Meetings" accent={true} delay="0.1s" />
        <StatCard value={stats.pending} label="Pending Tasks" delay="0.2s" />
        <StatCard value={stats.overdue} label="Overdue" delay="0.3s" />
        <StatCard value={stats.thisWeek} label="Items Logged" delay="0.4s" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Content Column */}
        <div className="lg:col-span-8 space-y-8">
           
           {/* Needs Attention Section */}
          <div className="bg-white/70 backdrop-blur-xl rounded-3xl border border-white/50 shadow-apple-card overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
            <div className="p-8 border-b border-sand/30 flex justify-between items-center bg-gradient-to-b from-white/50 to-transparent">
              <div className="flex items-center gap-4">
                 <div className="w-2 h-2 bg-red-400 rounded-full shadow-[0_0_10px_rgba(248,113,113,0.5)]"></div>
                 <h3 className="text-lg font-serif font-bold text-ink">Priority Items</h3>
              </div>
              <button onClick={() => setActiveTab('actionItems')} className="text-clay text-sm font-semibold hover:text-clay/80 transition-colors">View List</button>
            </div>
            {needsAttention.length > 0 ? (
              <div className="divide-y divide-sand/30">
                {needsAttention.map((item) => (
                  <div key={item.id} className="p-6 flex items-center gap-5 hover:bg-white/60 transition-colors cursor-pointer group" onClick={() => setActiveTab('actionItems')}>
                    <div className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${item.dueDate && item.dueDate < today ? 'border-red-400 bg-red-400 shadow-sm' : 'border-clay/40 bg-transparent group-hover:border-clay'}`} />
                    <div className="flex-1">
                      <div className={`font-medium text-ink text-lg ${item.status === 'completed' ? 'line-through text-subtle' : ''}`}>{item.title}</div>
                      <div className="text-xs text-subtle mt-1 font-bold uppercase tracking-wider opacity-70">
                         {item.dueDate && item.dueDate < today ? <span className="text-red-500">Overdue</span> : `Due ${item.dueDate || 'Soon'}`}
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-sand group-hover:text-clay transition-all group-hover:translate-x-1" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-subtle/60 italic font-serif">No urgent items. Enjoy the calm.</div>
            )}
          </div>

          {/* Recent Activity Feed */}
          <div className="bg-white/70 backdrop-blur-xl rounded-3xl border border-white/50 shadow-apple-card overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
             <div className="p-8 border-b border-sand/30 flex justify-between items-center bg-gradient-to-b from-white/50 to-transparent">
                <h3 className="text-lg font-serif font-bold text-ink">Recent Logs</h3>
                <button onClick={() => setActiveTab('correspondence')} className="text-clay text-sm font-semibold hover:text-clay/80 transition-colors">View All</button>
             </div>
             {recentCorrespondence.length > 0 ? (
               <div className="divide-y divide-sand/30">
                 {recentCorrespondence.map((item) => (
                   <div key={item.id} className="p-6 hover:bg-white/60 transition-colors cursor-pointer group" onClick={() => setActiveTab('correspondence')}>
                     <div className="flex justify-between items-center mb-2">
                       <span className={`text-[10px] font-bold uppercase tracking-widest py-1 px-3 rounded-full ${
                         item.direction === 'incoming' ? 'bg-green-100/50 text-green-700' : 'bg-clay/10 text-clay'
                       }`}>
                         {item.direction}
                       </span>
                       <span className="text-xs text-subtle font-serif italic opacity-70">{new Date(item.date).toLocaleDateString()}</span>
                     </div>
                     <h4 className="font-bold text-ink mb-1 text-lg group-hover:text-clay transition-colors">{item.subject}</h4>
                     <p className="text-sm text-subtle line-clamp-2 leading-relaxed opacity-80">{item.content}</p>
                   </div>
                 ))}
               </div>
             ) : (
               <div className="p-12 text-center text-subtle/60 italic font-serif">No recent activity.</div>
             )}
          </div>
        </div>

        {/* Sidebar / Tools Column */}
        <div className="lg:col-span-4 space-y-8 animate-fade-in-up" style={{ animationDelay: '0.7s' }}>
          
          {/* THE IN-TRAY (AI Magic Input) */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/60 shadow-apple-card overflow-hidden relative group transition-all duration-500 hover:shadow-apple-hover">
             {/* Subtle gradient top border */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-clay/40 via-clay to-clay/40 opacity-50" />
            
            <div className="p-6 border-b border-sand/30 bg-taupe/20 flex items-center gap-3">
              <div className="p-2 bg-white rounded-full shadow-sm text-clay">
                <Sparkles size={16} fill="currentColor" className="opacity-50" />
              </div>
              <h3 className="text-lg font-serif font-bold text-ink">The In-Tray</h3>
            </div>
            
            <div className="p-6">
              <p className="text-sm text-subtle/80 mb-4 leading-relaxed font-medium">
                Type freely. I'll handle the filing.
              </p>
              
              <div className="group bg-paper/50 focus-within:bg-white border border-sand/50 focus-within:border-clay/30 focus-within:shadow-sm rounded-2xl overflow-hidden transition-all duration-300">
                <textarea 
                  className="w-full bg-transparent border-none p-4 text-ink text-sm min-h-[160px] focus:outline-none focus:ring-0 resize-none placeholder-sand/70 font-medium"
                  placeholder="e.g., 'Lunch with Sarah (Treasurer) next Friday at 1pm...'"
                  value={magicInput}
                  onChange={(e) => setMagicInput(e.target.value)}
                  disabled={isProcessing}
                />
              </div>
              
              <div className={`mt-4 overflow-hidden transition-all duration-300 ${magicStatus ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'}`}>
                 {magicStatus && (
                    <div className={`text-xs font-semibold p-3 rounded-xl border ${magicStatus.startsWith('Error') ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-700 border-green-100'}`}>
                        {magicStatus}
                    </div>
                 )}
              </div>

              <div className="mt-4 flex justify-end">
                <button 
                  onClick={handleMagicSubmit}
                  disabled={!magicInput.trim() || isProcessing}
                  className="flex items-center gap-2 bg-ink text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-clay hover:scale-105 disabled:opacity-30 disabled:hover:scale-100 disabled:hover:bg-ink transition-all duration-300 shadow-md"
                >
                  {isProcessing ? (
                    <>
                      <Sparkles size={14} className="animate-spin" /> Processing
                    </>
                  ) : (
                    <>
                      <Send size={14} /> Process
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Mini Calendar / Upcoming */}
          <div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-white/40 shadow-apple-card p-8 hover:bg-white/80 transition-colors duration-500">
            <div className="flex items-center gap-3 mb-6">
               <Calendar size={18} className="text-clay opacity-70" />
               <h3 className="text-lg font-serif font-bold text-ink">Agenda</h3>
            </div>
            <div className="space-y-6">
               {upcomingMeetings.length > 0 ? upcomingMeetings.map((m, i) => (
                 <div key={m.id} className="flex gap-4 items-start group" style={{ animationDelay: `${i * 0.1}s` }}>
                    <div className="text-center min-w-[45px] p-2 bg-white rounded-xl shadow-sm border border-sand/20 group-hover:border-clay/30 transition-colors">
                       <div className="text-[10px] font-bold uppercase text-subtle">{new Date(m.date).toLocaleDateString(undefined, {weekday: 'short'})}</div>
                       <div className="text-xl font-serif font-bold text-ink">{new Date(m.date).getDate()}</div>
                    </div>
                    <div className="pt-1">
                       <div className="text-sm font-bold text-ink group-hover:text-clay transition-colors">{m.title}</div>
                       <div className="text-xs text-subtle mt-1 flex items-center gap-1">
                          <Clock size={10} /> {m.time} • {m.location}
                       </div>
                    </div>
                 </div>
               )) : (
                 <div className="text-sm text-subtle italic text-center py-4">No upcoming meetings.</div>
               )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};