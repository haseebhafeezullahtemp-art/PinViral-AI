import React, { useState } from 'react';
import { Card, Button } from './ui';
import { 
  TrendingUp, 
  BarChart3, 
  Users, 
  MessageCircle, 
  Mail, 
  AlertCircle,
  X,
  Maximize2,
  Zap,
  Check,
  ArrowRight,
  Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function WorkWithUs() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [currentFbImageIndex, setCurrentFbImageIndex] = useState(0);

  const fbPerformanceImages = [
    'input_file_0.png',
    'input_file_1.png',
    'input_file_2.png',
    'input_file_3.png',
    'input_file_4.png',
    'input_file_5.png',
    'input_file_6.png',
    'input_file_7.png',
    'input_file_8.png',
    'input_file_9.png',
  ];

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentFbImageIndex((prev) => (prev + 1) % fbPerformanceImages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [fbPerformanceImages.length]);

  return (
    <div className="max-w-6xl mx-auto py-6 sm:py-12 px-4 scrollbar-hide">
      {/* Hero Section */}
      <section className="text-center mb-12 sm:mb-20">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-primary/10 text-accent-primary text-[10px] font-bold uppercase tracking-widest mb-4"
        >
          <Zap size={12} />
          Partnership Program
        </motion.div>
        <h2 className="text-3xl sm:text-5xl font-black text-text-primary tracking-tight mb-4 leading-tight">
          Scale Your Reach to <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-primary to-success">
            Hundreds of Millions
          </span>
        </h2>
        <p className="text-text-secondary text-sm sm:text-lg max-w-2xl mx-auto">
          Partner with us to scale your social media presence and digital business using our proven viral growth strategies.
        </p>
      </section>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12 sm:mb-20">
        {[
          { label: 'FB Reach', value: '350M+', icon: BarChart3, color: 'text-accent-primary', bg: 'bg-accent-primary/10' },
          { label: 'TikTok Views', value: '150M+', icon: TrendingUp, color: 'text-success', bg: 'bg-success/10' },
          { label: 'Active Users', value: '50K+', icon: Users, color: 'text-warning', bg: 'bg-warning/10' },
          { label: 'Daily Growth', value: '1.2M+', icon: Zap, color: 'text-error', bg: 'bg-error/10' },
        ].map((stat, idx) => (
          <Card key={idx} className="p-4 sm:p-6 text-center border-border-primary hover:border-accent-primary/30 transition-colors">
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4 ${stat.bg} ${stat.color}`}>
              <stat.icon size={20} className="sm:w-6 sm:h-6" />
            </div>
            <p className="text-xl sm:text-2xl font-black text-text-primary tracking-tighter">{stat.value}</p>
            <p className="text-[10px] sm:text-xs text-text-secondary uppercase font-bold tracking-widest mt-1">{stat.label}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12 sm:mb-20">
        {/* Facebook Performance */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-bold text-text-primary flex items-center gap-2">
              <Globe size={18} className="text-accent-primary" />
              Facebook Performance
            </h3>
            <span className="text-[10px] text-text-secondary uppercase font-bold tracking-widest bg-surface-bg px-2 py-1 rounded-md border border-border-primary">Live Data</span>
          </div>
          <div 
            className="aspect-video bg-surface-bg rounded-2xl border border-border-primary overflow-hidden relative group cursor-pointer shadow-lg"
            onClick={() => setSelectedImage(fbPerformanceImages[currentFbImageIndex])}
          >
            <AnimatePresence mode="wait">
              <motion.img 
                key={currentFbImageIndex}
                src={fbPerformanceImages[currentFbImageIndex]} 
                alt="Facebook Performance" 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </AnimatePresence>
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Maximize2 className="text-white" size={24} />
            </div>
          </div>
        </div>

        {/* TikTok Performance */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-bold text-text-primary flex items-center gap-2">
              <Zap size={18} className="text-success" />
              TikTok Performance
            </h3>
            <span className="text-[10px] text-text-secondary uppercase font-bold tracking-widest bg-surface-bg px-2 py-1 rounded-md border border-border-primary">Viral Engine</span>
          </div>
          <Card className="aspect-video bg-surface-bg border-border-primary rounded-2xl flex flex-col items-center justify-center p-6 text-center shadow-lg">
            <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center text-success mb-3">
              <TrendingUp size={24} />
            </div>
            <h4 className="text-lg font-black text-text-primary mb-1">Viral Content Engine</h4>
            <p className="text-text-secondary text-xs leading-relaxed max-w-xs">
              Our TikTok strategies focus on high-engagement hooks and trending audio integration.
            </p>
            <div className="mt-4 flex gap-6">
              <div className="text-center">
                <p className="text-lg font-bold text-text-primary">85%</p>
                <p className="text-[9px] text-text-secondary uppercase font-bold">Retention</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-text-primary">12k+</p>
                <p className="text-[9px] text-text-secondary uppercase font-bold">Shares/Day</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Contact & Protocol */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6 sm:p-8 bg-surface-bg border-border-primary">
          <h3 className="text-lg font-bold text-text-primary mb-6 flex items-center gap-2">
            <Mail size={20} className="text-accent-primary" />
            Get in Touch
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-4 p-4 bg-main-bg rounded-xl border border-border-primary">
              <MessageCircle size={20} className="text-accent-primary" />
              <div className="flex flex-col">
                <span className="text-[10px] text-text-secondary uppercase font-bold">WhatsApp</span>
                <span className="font-bold text-text-primary text-sm">+92 335 1446206</span>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-main-bg rounded-xl border border-border-primary">
              <Mail size={20} className="text-success" />
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] text-text-secondary uppercase font-bold">Email</span>
                <span className="font-bold text-text-primary text-[10px] sm:text-sm break-all">automationchampsofficial@gmail.com</span>
              </div>
            </div>
          </div>
        </Card>

        <div className="p-6 bg-error/5 border border-error/20 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-2 opacity-20">
            <AlertCircle size={40} className="text-error" />
          </div>
          <h4 className="text-sm font-black text-error uppercase tracking-widest mb-3 flex items-center gap-2">
            <AlertCircle size={16} />
            Protocol
          </h4>
          <p className="text-xs text-error/90 leading-relaxed font-medium">
            Text messages or voice notes only. <span className="font-black underline">DO NOT CALL</span>. Calls will result in an immediate block.
          </p>
          <div className="mt-4 pt-4 border-t border-error/10">
            <p className="text-[10px] text-error/60 uppercase font-bold">Response Time: &lt; 24 Hours</p>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
            onClick={() => setSelectedImage(null)}
          >
            <button 
              className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors"
              onClick={() => setSelectedImage(null)}
            >
              <X size={32} />
            </button>
            <motion.img 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              src={selectedImage}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
