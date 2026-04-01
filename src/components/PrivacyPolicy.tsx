import React from 'react';
import { Card } from './ui';
import { ShieldCheck, Lock, EyeOff, Server } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto py-4 sm:py-12 px-4 sm:px-6 scrollbar-hide">
      <div className="text-center mb-8 sm:mb-16">
        <h2 className="text-3xl sm:text-4xl font-black text-text-primary tracking-tight mb-4">Privacy Policy</h2>
        <p className="text-sm sm:text-lg text-text-secondary">Your data privacy is our top priority.</p>
      </div>

      <div className="space-y-6 sm:space-y-8">
        <Card className="p-6 sm:p-8 bg-surface-bg border-border-primary">
          <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-accent-primary/10 rounded-2xl flex items-center justify-center text-accent-primary shrink-0">
              <ShieldCheck size={20} className="sm:w-6 sm:h-6" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-text-primary">How We Protect Your Data</h3>
          </div>
          <p className="text-xs sm:text-base text-text-secondary leading-relaxed mb-6">
            At PinViral AI, we use industry-standard encryption and security protocols to ensure that your 
            information remains safe and confidential. We follow strict data protection guidelines to prevent 
            unauthorized access, disclosure, or modification of your personal data.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="flex items-start gap-3">
              <Lock className="text-success shrink-0 w-4 h-4 sm:w-[18px] sm:h-[18px]" />
              <div>
                <p className="text-xs sm:text-sm font-bold text-text-primary">End-to-End Encryption</p>
                <p className="text-[10px] sm:text-xs text-text-secondary">All sensitive data is encrypted during transmission and at rest.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <EyeOff className="text-success shrink-0 w-4 h-4 sm:w-[18px] sm:h-[18px]" />
              <div>
                <p className="text-xs sm:text-sm font-bold text-text-primary">No Data Selling</p>
                <p className="text-[10px] sm:text-xs text-text-secondary">We never sell or share your personal information with third parties.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Server className="text-success shrink-0 w-4 h-4 sm:w-[18px] sm:h-[18px]" />
              <div>
                <p className="text-xs sm:text-sm font-bold text-text-primary">Secure Infrastructure</p>
                <p className="text-[10px] sm:text-xs text-text-secondary">Our servers are hosted in highly secure, world-class data centers.</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 sm:p-8 bg-surface-bg border-border-primary">
          <h3 className="text-lg sm:text-xl font-bold text-text-primary mb-3 sm:mb-4">Information We Collect</h3>
          <p className="text-xs sm:text-base text-text-secondary leading-relaxed mb-3 sm:mb-4">
            We only collect the information necessary to provide you with our services, such as your 
            Pinterest account details for automation and your email address for communication.
          </p>
          <p className="text-xs sm:text-base text-text-secondary leading-relaxed">
            By using PinViral AI, you agree to the collection and use of information in accordance with 
            this policy. We reserve the right to update our privacy policy at any time, and we will 
            notify you of any changes by posting the new policy on this page.
          </p>
        </Card>
      </div>
    </div>
  );
}
