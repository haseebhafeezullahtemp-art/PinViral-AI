import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Settings, 
  LogOut, 
  Pin,
  Link as LinkIcon,
  BarChart3,
  Layers,
  Sparkles,
  ShieldCheck,
  HelpCircle,
  Briefcase,
  Folder,
  X
} from 'lucide-react';
import { Button } from './ui';
import { auth } from '../lib/firebase';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: any;
}

export default function Sidebar({ activeTab, setActiveTab, user }: SidebarProps) {
  const mainMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'campaigns', label: 'Campaigns', icon: Layers },
    { id: 'pins', label: 'Pins Manager', icon: Pin },
    { id: 'accounts', label: 'Accounts Manager', icon: Users },
    { id: 'links', label: 'Link Library', icon: LinkIcon },
    { id: 'scheduler', label: 'Scheduler', icon: Calendar },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  const utilityMenuItems = [
    { id: 'utility', label: 'Utility Pages', icon: Folder },
    { id: 'work', label: 'Work With Us', icon: Briefcase },
  ];

  const renderMenuItem = (item: any) => (
    <button
      key={item.id}
      onClick={() => setActiveTab(item.id)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
        activeTab === item.id 
          ? 'bg-accent-primary/10 text-accent-primary font-semibold' 
          : 'text-text-secondary hover:text-text-primary hover:bg-surface-bg'
      }`}
    >
      <item.icon size={20} />
      {item.label}
    </button>
  );

  return (
    <div className="w-64 bg-sidebar-bg border-r border-border-primary flex flex-col h-screen sticky top-0 transition-colors duration-200 scrollbar-hide">
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent-primary rounded-xl flex items-center justify-center shadow-lg shadow-accent-primary/20">
            <Pin className="text-white" size={24} />
          </div>
          <h1 className="text-xl font-bold text-text-primary tracking-tight">PinViral AI</h1>
        </div>
        <button 
          onClick={() => setActiveTab(activeTab)} // Parent handles closing via setActiveTab
          className="lg:hidden p-2 text-text-secondary hover:text-text-primary"
        >
          <X size={24} />
        </button>
      </div>

      <nav className="flex-1 px-4 space-y-1 mt-4 overflow-y-auto scrollbar-hide">
        {[...mainMenuItems, ...utilityMenuItems].map(renderMenuItem)}

        <div className="pt-4">
          {renderMenuItem({ id: 'settings', label: 'Settings', icon: Settings })}
        </div>
      </nav>

      <div className="p-4 border-t border-border-primary">
        <div className="flex items-center gap-3 px-4 py-3 bg-surface-bg rounded-2xl mb-4 border border-border-primary/50">
          <img 
            src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
            alt="User" 
            className="w-10 h-10 rounded-full border border-border-primary"
            referrerPolicy="no-referrer"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary truncate">{user.displayName}</p>
            <p className="text-xs text-text-secondary truncate">{user.email}</p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          className="w-full justify-start gap-3 text-text-secondary hover:text-error"
          onClick={() => auth.signOut()}
        >
          <LogOut size={18} />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
