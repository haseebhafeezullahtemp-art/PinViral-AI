import React from 'react';
import { Card } from './ui';
import { Sparkles, Target, Globe, TrendingUp } from 'lucide-react';

export default function AboutUs() {
  return (
    <div className="max-w-4xl mx-auto py-4 sm:py-12 px-4 sm:px-6 scrollbar-hide">
      <div className="text-center mb-8 sm:mb-16">
        <h2 className="text-3xl sm:text-4xl font-black text-text-primary tracking-tight mb-4">About PinViral AI</h2>
        <p className="text-sm sm:text-lg text-text-secondary">Empowering creators to build sustainable passive income streams.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-8 sm:mb-16">
        <Card className="p-6 sm:p-8 bg-surface-bg border-border-primary">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-accent-primary/10 rounded-2xl flex items-center justify-center text-accent-primary mb-4 sm:mb-6">
            <Globe size={20} className="sm:w-6 sm:h-6" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-text-primary mb-2 sm:mb-3">Multi-Platform Focus</h3>
          <p className="text-xs sm:text-base text-text-secondary leading-relaxed">
            We specialize in automation and growth strategies across all major social media platforms, including 
            <span className="text-text-primary font-semibold"> TikTok, YouTube, Facebook, and Instagram</span>.
          </p>
        </Card>

        <Card className="p-6 sm:p-8 bg-surface-bg border-border-primary">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-success/10 rounded-2xl flex items-center justify-center text-success mb-4 sm:mb-6">
            <Target size={20} className="sm:w-6 sm:h-6" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-text-primary mb-2 sm:mb-3">Our Core Mission</h3>
          <p className="text-xs sm:text-base text-text-secondary leading-relaxed">
            Our main target is <span className="text-text-primary font-semibold">content creation</span> and helping 
            entrepreneurs generate a <span className="text-text-primary font-semibold">passive income stream</span> 
            from their digital business.
          </p>
        </Card>
      </div>

      <Card className="p-6 sm:p-10 bg-accent-primary/5 border border-accent-primary/20 rounded-2xl sm:rounded-3xl text-center">
        <TrendingUp className="mx-auto text-accent-primary mb-4 sm:mb-6 w-8 h-8 sm:w-12 sm:h-12" />
        <h3 className="text-xl sm:text-2xl font-bold text-text-primary mb-3 sm:mb-4">Scale Your Business</h3>
        <p className="text-xs sm:text-base text-text-secondary max-w-2xl mx-auto leading-relaxed">
          At PinViral AI, we believe that automation is the key to scaling. By leveraging AI, we help you 
          create high-quality content that resonates with your audience and drives consistent traffic, 
          turning your social media presence into a profitable asset.
        </p>
      </Card>
    </div>
  );
}
