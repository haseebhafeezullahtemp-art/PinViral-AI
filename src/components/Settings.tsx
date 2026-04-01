import React, { useState, useEffect } from 'react';
import { 
  User, 
  Moon, 
  Sun, 
  HelpCircle, 
  Bell, 
  Shield, 
  Clock, 
  ChevronRight, 
  ExternalLink,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Pin,
  Globe,
  Briefcase,
  TrendingUp,
  MessageCircle,
  Mail,
  PhoneOff,
  BarChart3,
  Users
} from 'lucide-react';
import { Card, Button, Input } from './ui';
import { motion, AnimatePresence } from 'motion/react';

export default function Settings({ user }: { user: any }) {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    }
    return 'dark';
  });

  const [notifications, setNotifications] = useState(true);
  const [defaultGap, setDefaultGap] = useState('30');
  const [activeSection, setActiveSection] = useState('account');

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const usageSteps = [
    {
      title: "Connect Accounts",
      description: "Go to 'Accounts Manager' and link your Pinterest business accounts using OAuth.",
      icon: User,
      color: "text-accent-primary"
    },
    {
      title: "Create Campaigns",
      description: "Use 'Campaigns' to generate viral pin ideas based on your niche and keywords.",
      icon: Pin,
      color: "text-error"
    },
    {
      title: "Manage Links",
      description: "Add your blog or affiliate links in 'Link Library' to be used in your pins.",
      icon: Shield,
      color: "text-success"
    },
    {
      title: "Schedule & Automate",
      description: "Review your generated pins in 'Pins Manager' and let the 'Scheduler' handle the posting.",
      icon: Clock,
      color: "text-accent-primary"
    }
  ];

  const languages = ['English', 'Spanish', 'French', 'German', 'Urdu', 'Arabic', 'Chinese'];

  const [showMobileDetail, setShowMobileDetail] = useState(false);

  const handleSectionClick = (id: string) => {
    setActiveSection(id);
    if (window.innerWidth < 768) {
      setShowMobileDetail(true);
    }
  };

  const renderSection = () => {
    const sectionTitle = {
      account: 'Account Info',
      appearance: 'Appearance',
      preferences: 'Preferences',
      guide: 'Usage Guide'
    }[activeSection as keyof typeof sectionTitle];

    const content = (() => {
      switch (activeSection) {
        case 'account':
          return (
            <section id="account" className="space-y-6">
              <h3 className="hidden md:flex text-lg font-bold text-text-primary items-center gap-2">
                <User size={20} className="text-accent-primary" />
                Account Information
              </h3>
              <Card className="p-6 space-y-6 bg-surface-bg border-border-primary">
                <div className="flex items-center gap-4">
                  <img 
                    src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
                    alt="Profile" 
                    className="w-16 h-16 rounded-2xl border-2 border-accent-primary/20"
                  />
                  <div>
                    <p className="text-xl font-bold text-text-primary">{user.displayName}</p>
                    <p className="text-sm text-text-secondary break-all">{user.email}</p>
                    <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 bg-success/10 text-success rounded-full text-[10px] font-bold uppercase tracking-wider">
                      <CheckCircle2 size={10} />
                      Verified Account
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border-primary">
                  <div>
                    <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1 block">User ID</label>
                    <p className="text-xs font-mono text-text-secondary bg-main-bg p-2 rounded-lg truncate">
                      {user.uid}
                    </p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1 block">Joined On</label>
                    <p className="text-xs text-text-secondary bg-main-bg p-2 rounded-lg">
                      {new Date(user.metadata.creationTime).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </Card>
            </section>
          );
        case 'appearance':
          return (
            <section id="appearance" className="space-y-6">
              <h3 className="hidden md:flex text-lg font-bold text-text-primary items-center gap-2">
                <Moon size={20} className="text-accent-primary" />
                Appearance
              </h3>
              <Card className="p-6 bg-surface-bg border-border-primary">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-text-primary">Theme Mode</p>
                    <p className="text-sm text-text-secondary">Switch between light and dark interface.</p>
                  </div>
                  <button 
                    onClick={toggleTheme}
                    className="relative w-14 h-7 bg-main-bg rounded-full p-1 transition-colors border border-border-primary"
                  >
                    <motion.div 
                      animate={{ x: theme === 'dark' ? 28 : 0 }}
                      className={`w-5 h-5 rounded-full flex items-center justify-center shadow-sm ${theme === 'dark' ? 'bg-accent-primary' : 'bg-white'}`}
                    >
                      {theme === 'dark' ? <Moon size={12} className="text-white" /> : <Sun size={12} className="text-text-secondary" />}
                    </motion.div>
                  </button>
                </div>
              </Card>
            </section>
          );
        case 'preferences':
          return (
            <section id="preferences" className="space-y-6">
              <h3 className="hidden md:flex text-lg font-bold text-text-primary items-center gap-2">
                <Bell size={20} className="text-accent-primary" />
                Preferences
              </h3>
              <Card className="p-6 space-y-6 bg-surface-bg border-border-primary">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-text-primary">Email Notifications</p>
                    <p className="text-sm text-text-secondary">Receive weekly performance reports.</p>
                  </div>
                  <button 
                    onClick={() => setNotifications(!notifications)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${notifications ? 'bg-accent-primary' : 'bg-main-bg'}`}
                  >
                    <motion.div 
                      animate={{ x: notifications ? 24 : 0 }}
                      className="w-6 h-6 bg-white rounded-full shadow-sm"
                    />
                  </button>
                </div>

                <div className="pt-6 border-t border-border-primary">
                  <label className="text-sm font-bold text-text-primary mb-2 block">Default Posting Gap (Minutes)</label>
                  <div className="flex items-center gap-4">
                    <Input 
                      type="number" 
                      value={defaultGap} 
                      onChange={(e) => setDefaultGap(e.target.value)}
                      className="w-24"
                    />
                    <p className="text-xs text-text-secondary italic">Recommended: 30+ mins</p>
                  </div>
                </div>
              </Card>
            </section>
          );
        case 'guide':
          return (
            <section id="guide" className="space-y-6">
              <h3 className="hidden md:flex text-lg font-bold text-text-primary items-center gap-2">
                <BookOpen size={20} className="text-accent-primary" />
                Usage Guide
              </h3>
              <div className="space-y-4">
                {usageSteps.map((step, idx) => (
                  <Card key={idx} className="p-4 bg-surface-bg border-border-primary flex gap-4">
                    <div className={`w-10 h-10 rounded-xl bg-main-bg flex items-center justify-center shrink-0 ${step.color}`}>
                      <step.icon size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-text-primary text-sm">{step.title}</p>
                      <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          );
        default:
          return null;
      }
    })();

    return (
      <div className="flex flex-col h-full">
        {/* Mobile Header with Back Button */}
        <div className="md:hidden flex items-center gap-4 mb-6 sticky top-0 bg-main-bg z-20 py-2">
          <button 
            onClick={() => setShowMobileDetail(false)}
            className="p-2 hover:bg-surface-bg rounded-xl transition-colors"
          >
            <ChevronRight className="rotate-180 text-text-primary" size={24} />
          </button>
          <h3 className="text-xl font-bold text-text-primary">{sectionTitle}</h3>
        </div>
        {content}
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-8 relative overflow-hidden scrollbar-hide">
      {!showMobileDetail && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-text-primary tracking-tight">Settings & Preferences</h2>
            <p className="text-text-secondary mt-1">Manage your account, theme, and explore your preferences.</p>
          </div>
        </div>
      )}

      <div className="flex flex-col md:grid md:grid-cols-4 gap-6 sm:gap-8 scrollbar-hide">
        {/* Sidebar navigation - Hidden on mobile when detail is shown */}
        <div className={`${showMobileDetail ? 'hidden md:flex' : 'flex'} flex-col gap-2 md:gap-1 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide`}>
          {[
            { id: 'account', label: 'Account', icon: User },
            { id: 'appearance', label: 'Theme', icon: Moon },
            { id: 'preferences', label: 'Prefs', icon: Bell },
            { id: 'guide', label: 'Guide', icon: BookOpen },
          ].map(item => (
            <button 
              key={item.id}
              onClick={() => handleSectionClick(item.id)}
              className={`flex-shrink-0 md:w-full flex items-center justify-between px-4 py-4 md:py-3 rounded-xl transition-all text-left whitespace-nowrap text-sm md:text-sm border ${
                activeSection === item.id 
                  ? 'bg-accent-primary/10 text-accent-primary font-bold border-accent-primary/20' 
                  : 'bg-surface-bg/50 text-text-secondary hover:bg-surface-bg border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon size={18} />
                {item.label}
              </div>
              <ChevronRight size={16} className="md:hidden opacity-50" />
            </button>
          ))}
        </div>

        <AnimatePresence>
          {(showMobileDetail || (typeof window !== 'undefined' && window.innerWidth >= 768)) && (
            <motion.div 
              initial={window.innerWidth < 768 ? { x: '100%', opacity: 0 } : { opacity: 0, x: 10 }}
              animate={window.innerWidth < 768 ? { x: 0, opacity: 1 } : { opacity: 1, x: 0 }}
              exit={window.innerWidth < 768 ? { x: '100%', opacity: 0 } : { opacity: 0, x: -10 }}
              transition={window.innerWidth < 768 ? { type: 'spring', damping: 25, stiffness: 200 } : { duration: 0.2 }}
              className={`${showMobileDetail ? 'fixed inset-0 z-50 bg-main-bg p-4 overflow-y-auto scrollbar-hide' : 'hidden md:block md:col-span-3'} md:relative md:inset-auto md:p-0 md:translate-x-0 md:opacity-100`}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSection}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="h-full"
                >
                  {renderSection()}
                </motion.div>
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

