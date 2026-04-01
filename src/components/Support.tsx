import React from 'react';
import { Card, Button } from './ui';
import { HelpCircle, MessageCircle, Mail, AlertCircle, PhoneOff } from 'lucide-react';

export default function Support() {
  return (
    <div className="max-w-4xl mx-auto py-4 sm:py-12 px-4 sm:px-6 scrollbar-hide">
      <div className="text-center mb-8 sm:mb-16">
        <h2 className="text-3xl sm:text-4xl font-black text-text-primary tracking-tight mb-4">Support Center</h2>
        <p className="text-sm sm:text-lg text-text-secondary">We're here to help you 24/7 with any questions or issues.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-8 sm:mb-16">
        <Card className="p-6 sm:p-8 bg-surface-bg border-border-primary">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-accent-primary/10 rounded-2xl flex items-center justify-center text-accent-primary mb-4 sm:mb-6">
            <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-text-primary mb-2 sm:mb-3">WhatsApp Support</h3>
          <p className="text-xs sm:text-base text-text-secondary leading-relaxed mb-4 sm:mb-6">
            Send us a message or voice note on WhatsApp for quick assistance.
          </p>
          <div className="bg-main-bg p-3 sm:p-4 rounded-xl border border-border-primary mb-4 sm:mb-6">
            <p className="text-xs sm:text-sm font-bold text-text-primary">+92 335 1446206</p>
            <p className="text-[9px] sm:text-[10px] text-text-secondary uppercase tracking-widest font-bold mt-1">WhatsApp Only</p>
          </div>
          <Button className="w-full gap-2 text-xs sm:text-sm" onClick={() => window.open('https://wa.me/923351446206', '_blank')}>
            <MessageCircle className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
            Message on WhatsApp
          </Button>
        </Card>

        <Card className="p-6 sm:p-8 bg-surface-bg border-border-primary">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-success/10 rounded-2xl flex items-center justify-center text-success mb-4 sm:mb-6">
            <Mail className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-text-primary mb-2 sm:mb-3">Email Support</h3>
          <p className="text-xs sm:text-base text-text-secondary leading-relaxed mb-4 sm:mb-6">
            For detailed inquiries, feel free to send us an email.
          </p>
          <div className="bg-main-bg p-3 sm:p-4 rounded-xl border border-border-primary mb-4 sm:mb-6">
            <p className="text-[10px] sm:text-sm font-bold text-text-primary break-all">automationchampsofficial@gmail.com</p>
            <p className="text-[9px] sm:text-[10px] text-text-secondary uppercase tracking-widest font-bold mt-1">24/7 Response</p>
          </div>
          <Button variant="outline" className="w-full gap-2 text-xs sm:text-sm" onClick={() => window.location.href = 'mailto:automationchampsofficial@gmail.com'}>
            <Mail className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
            Send Email
          </Button>
        </Card>
      </div>

      <Card className="p-4 bg-error/5 border border-error/20 rounded-2xl">
        <div className="flex items-start gap-3">
          <AlertCircle className="text-error shrink-0 mt-0.5" size={16} />
          <p className="text-[10px] sm:text-xs text-error/80 leading-relaxed">
            <span className="font-bold uppercase tracking-wider mr-2">Warning:</span>
            Text messages or voice notes only. <span className="font-black">DO NOT CALL</span>. 
            Calls will not be responded to and may result in a block.
          </p>
        </div>
      </Card>
    </div>
  );
}
