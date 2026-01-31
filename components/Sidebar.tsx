import React from 'react';
import { 
  LayoutDashboard, 
  Calendar, 
  Mail, 
  CheckSquare, 
  Users, 
  Activity, 
  Settings,
  LogOut
} from 'lucide-react';
import { TabId } from '../types';

interface SidebarProps {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onLogout }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'meetings', label: 'Meetings', icon: Calendar },
    { id: 'correspondence', label: 'Correspondence', icon: Mail },
    { id: 'actionItems', label: 'Action Items', icon: CheckSquare },
    { id: 'caseLog', label: 'Case Log', icon: Activity },
    { id: 'roster', label: 'Personnel', icon: Users },
  ];

  return (
    <nav className="w-64 py-8 px-6 hidden md:block sticky top-20 h-[calc(100vh-80px)] overflow-y-auto">
      <div className="space-y-1">
        <div className="px-3 pb-6">
          <h3 className="text-[11px] font-bold text-subtle/70 uppercase tracking-[0.15em]">Workspace</h3>
        </div>
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as TabId)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[14px] font-medium transition-all duration-300 ease-out group ${
                isActive 
                  ? 'bg-white shadow-apple-card text-clay scale-[1.02]' 
                  : 'text-subtle hover:bg-white/50 hover:text-ink hover:translate-x-1'
              }`}
            >
              <Icon 
                size={18} 
                className={`transition-colors duration-300 ${
                  isActive ? 'text-clay' : 'text-subtle/70 group-hover:text-ink'
                }`} 
                strokeWidth={isActive ? 2.5 : 2}
              />
              {item.label}
            </button>
          );
        })}

        <div className="pt-6">
          <div className="px-3 pb-3">
             <h3 className="text-[11px] font-bold text-subtle/70 uppercase tracking-[0.15em]">System</h3>
          </div>
          <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[14px] font-medium transition-all duration-300 ease-out group ${
                activeTab === 'settings'
                  ? 'bg-white shadow-apple-card text-clay scale-[1.02]' 
                  : 'text-subtle hover:bg-white/50 hover:text-ink hover:translate-x-1'
              }`}
            >
              <Settings
                size={18} 
                className={`transition-colors duration-300 ${
                  activeTab === 'settings' ? 'text-clay' : 'text-subtle/70 group-hover:text-ink'
                }`} 
                strokeWidth={activeTab === 'settings' ? 2.5 : 2}
              />
              Settings
          </button>
          
          <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[14px] font-medium transition-all duration-300 ease-out group text-subtle hover:bg-red-50 hover:text-red-600 hover:translate-x-1 mt-1"
            >
              <LogOut
                size={18} 
                className="text-subtle/70 group-hover:text-red-500 transition-colors duration-300" 
                strokeWidth={2}
              />
              Log Out
          </button>
        </div>
      </div>
      
      <div className="mt-12 px-2">
        <div className="p-5 bg-white/40 backdrop-blur-sm rounded-3xl border border-white/40 shadow-sm">
          <p className="text-xs text-clay/80 italic font-serif leading-relaxed opacity-90">
            "Organization is the foundation of peace."
          </p>
        </div>
      </div>
    </nav>
  );
};