import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  X, 
  Sparkles, 
  Loader2, 
  CheckCircle2, 
  ArrowRight,
  Info,
  User,
  Edit2
} from 'lucide-react';
import { Button, Card, Input, Textarea } from './ui';
import { researchKeywords, generatePinIdeas } from '../lib/gemini';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, updateDoc, doc, serverTimestamp, query, where, onSnapshot } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { PinterestAccount, Campaign } from '../types';

export default function CampaignForm({ 
  user, 
  setActiveTab, 
  campaignToEdit,
  onCancel
}: { 
  user: any, 
  setActiveTab: (t: string) => void,
  campaignToEdit?: Campaign | null,
  onCancel?: () => void
}) {
  const [niche, setNiche] = useState(campaignToEdit?.niche || '');
  const [ideas, setIdeas] = useState(campaignToEdit?.pinIdeas || '');
  const [blogUrl, setBlogUrl] = useState(campaignToEdit?.blogUrl || '');
  const [keywords, setKeywords] = useState<string[]>(campaignToEdit?.keywords || []);
  const [newKeyword, setNewKeyword] = useState('');
  const [accounts, setAccounts] = useState<PinterestAccount[]>([]);
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>(campaignToEdit?.accountIds || []);
  const [isAdCampaign, setIsAdCampaign] = useState(campaignToEdit?.isAdCampaign || false);
  const [isResearching, setIsResearching] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    if (campaignToEdit) {
      setNiche(campaignToEdit.niche);
      setIdeas(campaignToEdit.pinIdeas);
      setBlogUrl(campaignToEdit.blogUrl);
      setKeywords(campaignToEdit.keywords);
      setSelectedAccountIds(campaignToEdit.accountIds);
    }
  }, [campaignToEdit]);

  useEffect(() => {
    const accountsPath = 'accounts';
    const qAcc = query(collection(db, accountsPath), where('uid', '==', user.uid));
    const unsubscribeAcc = onSnapshot(qAcc, (snapshot) => {
      setAccounts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PinterestAccount)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, accountsPath);
    });
    return () => unsubscribeAcc();
  }, [user.uid]);

  const toggleAccount = (id: string) => {
    setSelectedAccountIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleResearch = async () => {
    if (!niche) return;
    setIsResearching(true);
    try {
      const results = await researchKeywords(niche);
      setKeywords(prev => [...new Set([...prev, ...results])]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsResearching(false);
    }
  };

  const handleAddKeyword = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newKeyword) {
      setKeywords(prev => [...new Set([...prev, newKeyword])]);
      setNewKeyword('');
    }
  };

  const removeKeyword = (k: string) => {
    setKeywords(prev => prev.filter(i => i !== k));
  };

  const handleSubmit = async () => {
    if (!niche || !blogUrl || selectedAccountIds.length === 0) return;
    setIsGenerating(true);
    
    const path = 'campaigns';
    try {
      const campaignData = {
        uid: user.uid,
        niche,
        pinIdeas: ideas,
        keywords,
        blogUrl,
        isAdCampaign,
        numPins: campaignToEdit?.numPins || 10,
        timeGap: campaignToEdit?.timeGap || '1h',
        accountIds: selectedAccountIds,
        status: campaignToEdit?.status || 'draft',
        updatedAt: serverTimestamp(),
        ...(campaignToEdit ? {} : { createdAt: serverTimestamp() })
      };

      if (campaignToEdit) {
        await updateDoc(doc(db, path, campaignToEdit.id), campaignData);
        if (onCancel) onCancel();
        setActiveTab('campaigns');
      } else {
        const docRef = await addDoc(collection(db, path), campaignData);
        localStorage.setItem('last_campaign_id', docRef.id);
        setActiveTab('scheduler');
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, path);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-4 sm:py-8 px-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-accent-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-accent-primary/20 shrink-0">
            {campaignToEdit ? <Edit2 size={20} className="sm:w-6 sm:h-6" /> : <Plus size={20} className="sm:w-6 sm:h-6" />}
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-text-primary">{campaignToEdit ? 'Edit Campaign' : 'Create New Campaign'}</h2>
            <p className="text-sm sm:text-base text-text-secondary">{campaignToEdit ? 'Update your campaign settings.' : 'Define your niche and let AI handle the research.'}</p>
          </div>
        </div>
        {campaignToEdit && (
          <Button variant="ghost" className="sm:ml-auto w-full sm:w-auto" onClick={onCancel}>Cancel</Button>
        )}
      </div>

      <div className="space-y-8">
        <Card className="space-y-6 bg-surface-bg border-border-primary p-4 sm:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary">Niche / Topic</label>
              <Input 
                placeholder="e.g. Minimalist Home Decor" 
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                className="bg-main-bg border-border-primary text-text-primary"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary">Blog / Destination URL</label>
              <Input 
                placeholder="https://yourblog.com/post-1" 
                value={blogUrl}
                onChange={(e) => setBlogUrl(e.target.value)}
                className="bg-main-bg border-border-primary text-text-primary"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-text-secondary">Seed Keywords (Press Enter to add)</label>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-accent-primary hover:text-accent-hover gap-1"
                onClick={handleResearch}
                disabled={isResearching || !niche}
              >
                {isResearching ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />}
                AI Research
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 p-3 bg-main-bg border border-border-primary rounded-xl min-h-[100px]">
              <AnimatePresence>
                {keywords.map(k => (
                  <motion.span
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    key={k}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-surface-bg text-text-primary rounded-full text-xs font-medium border border-border-primary"
                  >
                    {k}
                    <button onClick={() => removeKeyword(k)} className="hover:text-error transition-colors">
                      <X size={12} />
                    </button>
                  </motion.span>
                ))}
              </AnimatePresence>
              <input 
                className="bg-transparent border-none outline-none text-text-primary text-xs flex-1 min-w-[120px]"
                placeholder="Add keyword..."
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                onKeyDown={handleAddKeyword}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary">Pin Ideas / Context (Optional)</label>
            <Textarea 
              placeholder="Tell us more about what you want to promote. AI will use this to generate viral titles and descriptions."
              value={ideas}
              onChange={(e) => setIdeas(e.target.value)}
              className="bg-main-bg border-border-primary text-text-primary scrollbar-hide resize-none overflow-hidden"
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = target.scrollHeight + 'px';
              }}
            />
          </div>

          <div className="space-y-4 pt-4 border-t border-border-primary">
            <div className="flex items-center justify-between p-4 bg-accent-primary/5 border border-accent-primary/20 rounded-2xl">
              <div>
                <p className="font-bold text-text-primary">Ad Campaign Mode</p>
                <p className="text-xs text-text-secondary">Optimize this campaign for Pinterest Ads / Promoted Pins.</p>
              </div>
              <button 
                onClick={() => setIsAdCampaign(!isAdCampaign)}
                className={`relative w-14 h-7 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-accent-primary/20 ${isAdCampaign ? 'bg-accent-primary' : 'bg-border-primary/50'}`}
              >
                <motion.div 
                  initial={false}
                  animate={{ x: isAdCampaign ? 30 : 4 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-md"
                />
              </button>
            </div>

            <label className="text-sm font-medium text-text-secondary block">Select Pinterest Accounts for this Campaign</label>
            {accounts.length === 0 ? (
              <div className="p-4 bg-main-bg border border-border-primary rounded-xl text-center">
                <p className="text-xs text-text-secondary">No accounts connected. Please connect accounts in Account Manager first.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {accounts.map(acc => (
                  <button
                    key={acc.id}
                    onClick={() => toggleAccount(acc.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                      selectedAccountIds.includes(acc.id)
                        ? 'bg-accent-primary/10 border-accent-primary text-text-primary'
                        : 'bg-main-bg border-border-primary text-text-secondary hover:border-accent-primary/50'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      selectedAccountIds.includes(acc.id) ? 'bg-accent-primary' : 'bg-surface-bg'
                    }`}>
                      <User size={16} className={selectedAccountIds.includes(acc.id) ? "text-white" : "text-text-secondary"} />
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold truncate max-w-[120px] text-text-primary">{acc.username}</p>
                      <p className="text-[10px] opacity-60 uppercase tracking-widest text-text-secondary">{acc.niche}</p>
                    </div>
                    {selectedAccountIds.includes(acc.id) && (
                      <CheckCircle2 size={16} className="ml-auto text-accent-primary" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </Card>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-text-secondary text-xs">
            <Info size={16} />
            <span>{selectedAccountIds.length} accounts selected.</span>
          </div>
          <Button 
            className="gap-2 px-8 w-full sm:w-auto" 
            size="lg"
            onClick={handleSubmit}
            disabled={isGenerating || !niche || !blogUrl || selectedAccountIds.length === 0}
          >
            {isGenerating ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                {campaignToEdit ? 'Updating...' : 'Initializing...'}
              </>
            ) : (
              <>
                {campaignToEdit ? 'Save Changes' : 'Continue to Scheduler'}
                <ArrowRight size={18} />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
