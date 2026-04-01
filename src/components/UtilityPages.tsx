import React, { useState } from 'react';
import AboutUs from './AboutUs';
import PrivacyPolicy from './PrivacyPolicy';
import Support from './Support';
import { Sparkles, ShieldCheck, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type UtilityTab = 'about' | 'privacy' | 'support';

export default function UtilityPages() {
  const [activeSubTab, setActiveSubTab] = useState<UtilityTab>('about');

  const tabs = [
    { id: 'about', label: 'About Us', icon: Sparkles, color: 'text-accent-primary', bg: 'bg-accent-primary/10' },
    { id: 'privacy', label: 'Privacy Policy', icon: ShieldCheck, color: 'text-success', bg: 'bg-success/10' },
    { id: 'support', label: 'Support', icon: HelpCircle, color: 'text-error', bg: 'bg-error/10' },
  ];

  const renderContent = () => {
    switch (activeSubTab) {
      case 'about':
        return <AboutUs />;
      case 'privacy':
        return <PrivacyPolicy />;
      case 'support':
        return <Support />;
      default:
        return <AboutUs />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-4 sm:py-12 px-4 scrollbar-hide">
      <div className="text-center mb-10 sm:mb-16 scrollbar-hide">
        <h2 className="text-3xl sm:text-5xl font-black text-text-primary tracking-tighter mb-4 scrollbar-hide">Resources & Support</h2>
        <p className="text-text-secondary text-sm sm:text-lg max-w-2xl mx-auto scrollbar-hide">Everything you need to know about PinViral AI, our policies, and how to get help.</p>
      </div>

      <div className="flex flex-row justify-center gap-0.5 sm:gap-6 mb-10 sm:mb-20 px-0.5 sm:px-0 max-w-full overflow-x-hidden scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as UtilityTab)}
            className={`relative flex items-center gap-1 sm:gap-3 px-1.5 py-2 sm:px-5 sm:py-4 rounded-lg sm:rounded-2xl border transition-all duration-500 group overflow-hidden whitespace-nowrap flex-1 sm:flex-none min-w-0 scrollbar-hide ${
              activeSubTab === tab.id
                ? `bg-surface-bg border-accent-primary shadow-2xl shadow-accent-primary/20 scale-105 z-10`
                : 'bg-surface-bg/30 border-border-primary hover:border-accent-primary/50'
            }`}
          >
            {activeSubTab === tab.id && (
              <motion.div 
                layoutId="tab-glow"
                className="absolute inset-0 bg-gradient-to-br from-accent-primary/5 to-transparent pointer-events-none"
              />
            )}
            <div className={`w-6 h-6 sm:w-10 sm:h-10 rounded-md sm:rounded-xl flex items-center justify-center transition-all duration-500 group-hover:rotate-12 ${
              activeSubTab === tab.id ? tab.bg : 'bg-main-bg'
            } ${activeSubTab === tab.id ? tab.color : 'text-text-secondary'}`}>
              <tab.icon className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
            </div>
            <span className={`font-bold text-[9px] sm:text-base ${activeSubTab === tab.id ? 'text-text-primary' : 'text-text-secondary'}`}>
              <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </span>
          </button>
        ))}
      </div>

      <motion.div
        key={activeSubTab}
        initial={{ opacity: 0, scale: 0.98, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative scrollbar-hide"
      >
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-accent-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-success/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 scrollbar-hide">
          {renderContent()}
        </div>
      </motion.div>
    </div>
  );
}
