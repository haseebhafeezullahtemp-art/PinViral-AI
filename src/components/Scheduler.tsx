import React, { useState, useEffect, useRef } from 'react';
import { 
  Calendar, 
  Clock, 
  Play, 
  Save, 
  Loader2, 
  CheckCircle2, 
  ChevronRight,
  LayoutGrid,
  List,
  Pin,
  Users,
  Globe,
  Image as ImageIcon,
  Sparkles,
  AlertCircle,
  MousePointer2,
  Plus,
  Minus,
  X,
  XCircle
} from 'lucide-react';
import { Button, Card } from './ui';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, onSnapshot, doc, getDoc, addDoc, serverTimestamp, updateDoc, getDocs, orderBy, limit } from 'firebase/firestore';
import { Campaign, PinterestAccount, PinIdea, ScheduledPin, Link } from '../types';
import { generatePinIdeas, generatePinImage } from '../lib/gemini';
import { motion, AnimatePresence } from 'motion/react';
import { format, addMinutes, addHours, isBefore, subDays } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function Scheduler({ user, setActiveTab }: { user: any, setActiveTab: (t: string) => void }) {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [allAccounts, setAllAccounts] = useState<PinterestAccount[]>([]);
  const [activeHour, setActiveHour] = useState<number | null>(null);
  const [links, setLinks] = useState<Link[]>([]);
  const [scheduledPins, setScheduledPins] = useState<ScheduledPin[]>([]);
  const [numPins, setNumPins] = useState(10);
  const [pinsPerEvent, setPinsPerEvent] = useState(1);
  const [timeGap, setTimeGap] = useState('1h');
  const [hourlySchedule, setHourlySchedule] = useState<number[]>(new Array(24).fill(0));
  const [isManualMode, setIsManualMode] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<{ step: string; percent: number } | null>(null);
  const [generatedPins, setGeneratedPins] = useState<PinIdea[]>([]);
  const [pinImages, setPinImages] = useState<Record<number, string>>({});
  const [isAutomationStarted, setIsAutomationStarted] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [hasApiKey, setHasApiKey] = useState(true);
  const [isPastingKey, setIsPastingKey] = useState(false);
  const [pastedKey, setPastedKey] = useState('');
  const isCancelled = useRef(false);

  useEffect(() => {
    const checkApiKey = async () => {
      const customKey = localStorage.getItem('custom_gemini_api_key');
      if (customKey) {
        setHasApiKey(true);
        return;
      }
      if (window.aistudio?.hasSelectedApiKey) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(hasKey);
      }
    };
    checkApiKey();
  }, []);

  const handleSavePastedKey = () => {
    if (pastedKey.trim()) {
      localStorage.setItem('custom_gemini_api_key', pastedKey.trim());
      setHasApiKey(true);
      setIsPastingKey(false);
      setPastedKey('');
      addLog('Custom Gemini API key saved successfully.');
    }
  };

  const handleOpenSelectKey = async () => {
    if (window.aistudio?.openSelectKey) {
      await window.aistudio.openSelectKey();
      setHasApiKey(true);
    }
  };

  useEffect(() => {
    const campaignId = localStorage.getItem('last_campaign_id');
    if (campaignId) {
      const path = `campaigns/${campaignId}`;
      getDoc(doc(db, 'campaigns', campaignId)).then(s => {
        if (s.exists()) setCampaign({ id: s.id, ...s.data() } as Campaign);
      }).catch(e => {
        handleFirestoreError(e, OperationType.GET, path);
      });
    }

    const accountsPath = 'accounts';
    const qAcc = query(collection(db, accountsPath), where('uid', '==', user.uid));
    const unsubscribeAcc = onSnapshot(qAcc, (snapshot) => {
      setAllAccounts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PinterestAccount)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, accountsPath);
    });

    const linksPath = 'links';
    const qLinks = query(collection(db, linksPath), where('uid', '==', user.uid));
    const unsubscribeLinks = onSnapshot(qLinks, (snapshot) => {
      setLinks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Link)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, linksPath);
    });

    const scheduledPath = 'scheduledPins';
    const qScheduled = query(
      collection(db, scheduledPath),
      where('uid', '==', user.uid),
      where('status', '==', 'scheduled')
    );
    const unsubscribeScheduled = onSnapshot(qScheduled, (snapshot) => {
      setScheduledPins(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ScheduledPin)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, scheduledPath);
    });

    return () => {
      unsubscribeAcc();
      unsubscribeLinks();
      unsubscribeScheduled();
    };
  }, [user.uid]);

  const accounts = React.useMemo(() => {
    if (!campaign?.accountIds) return allAccounts;
    return allAccounts.filter(a => campaign.accountIds.includes(a.id));
  }, [allAccounts, campaign?.accountIds]);

  // Sync hourly schedule with automatic settings if not in manual mode
  useEffect(() => {
    if (isManualMode) return;

    const newSchedule = new Array(24).fill(0);
    let gapMinutes = 60;
    if (timeGap === '30min') gapMinutes = 30;
    else if (timeGap === 'random') gapMinutes = 90;
    else gapMinutes = parseInt(timeGap) * 60;

    const now = new Date();
    // Total pins to distribute
    let remainingPins = numPins;
    let eventIndex = 0;

    while (remainingPins > 0 && eventIndex < 100) { // Safety break
      const eventTime = addMinutes(now, eventIndex * gapMinutes);
      const hourDiff = Math.floor((eventTime.getTime() - now.getTime()) / 3600000);
      
      if (hourDiff >= 0 && hourDiff < 24) {
        const toAdd = Math.min(pinsPerEvent, remainingPins);
        newSchedule[hourDiff] += toAdd;
        remainingPins -= toAdd;
      } else if (hourDiff >= 24) {
        break;
      }
      eventIndex++;
    }
    setHourlySchedule(newSchedule);
  }, [numPins, timeGap, pinsPerEvent, isManualMode]);

  const addLog = (msg: string) => setLogs(prev => [msg, ...prev]);

  const getAvailableLink = (usedInCurrentBatch: Set<string>) => {
    const oneWeekAgo = subDays(new Date(), 7);
    
    // Filter links that haven't been used in the last 7 days AND not in current batch
    const available = links.filter(l => {
      if (usedInCurrentBatch.has(l.id)) return false;
      if (!l.lastUsedAt) return true;
      return isBefore(l.lastUsedAt.toDate(), oneWeekAgo);
    });

    if (available.length === 0) return null;

    // Pick the oldest used link (or never used)
    return available.sort((a, b) => {
      if (!a.lastUsedAt && b.lastUsedAt) return -1;
      if (a.lastUsedAt && !b.lastUsedAt) return 1;
      if (!a.lastUsedAt && !b.lastUsedAt) return 0;
      return a.lastUsedAt.seconds - b.lastUsedAt.seconds;
    })[0];
  };

  const cancelAutomation = () => {
    isCancelled.current = true;
    setIsGenerating(false);
    setProgress(null);
    addLog('Automation stopped by user.');
  };

  const startAutomation = async () => {
    if (!campaign || accounts.length === 0) return;
    setIsGenerating(true);
    setIsAutomationStarted(true);
    isCancelled.current = false;
    setLogs([]);
    
    try {
      const totalPinsNeeded = hourlySchedule.reduce((a, b) => a + b, 0);
      if (totalPinsNeeded === 0) {
        addLog('Error: No pins scheduled in the next 24 hours.');
        setIsGenerating(false);
        return;
      }

      addLog(`Starting sequential automation for ${totalPinsNeeded} pins...`);
      
      const path = 'scheduledPins';
      const usedLinksInBatch = new Set<string>();
      let pinIndex = 0;
      const now = new Date();

      // Flatten the schedule to process pins one by one
      const flattenedSchedule: Date[] = [];
      for (let h = 0; h < 24; h++) {
        const pinsInThisHour = hourlySchedule[h];
        if (pinsInThisHour === 0) continue;
        const hourStart = addHours(now, h);
        const subGap = Math.floor(60 / pinsInThisHour);
        for (let p = 0; p < pinsInThisHour; p++) {
          flattenedSchedule.push(addMinutes(hourStart, p * subGap));
        }
      }

      for (let i = 0; i < flattenedSchedule.length; i++) {
        if (isCancelled.current) {
          addLog('Automation stopped by user.');
          break;
        }

        const scheduledTime = flattenedSchedule[i];
        const currentPercent = Math.floor(((i) / flattenedSchedule.length) * 100);
        
        // 1. Generate Idea for this specific pin
        setProgress({ step: `Generating idea for pin ${i + 1}/${flattenedSchedule.length}...`, percent: currentPercent });
        const ideas = await generatePinIdeas(campaign.niche, campaign.pinIdeas, campaign.keywords, 1);
        const idea = ideas[0];
        if (!idea) throw new Error(`Failed to generate idea for pin ${i + 1}`);
        
        addLog(`[${i+1}] Idea generated: "${idea.title.substring(0, 30)}..."`);
        setGeneratedPins(prev => [...prev, idea]);

        if (isCancelled.current) break;

        // 2. Generate Image for this specific pin
        setProgress({ step: `Creating image for pin ${i + 1}/${flattenedSchedule.length}...`, percent: currentPercent + 5 });
        const imageUrl = await generatePinImage(idea.imagePrompt);
        setPinImages(prev => ({ ...prev, [i]: imageUrl }));
        addLog(`[${i+1}] Image created successfully.`);

        if (isCancelled.current) break;

        // 3. Schedule for each account
        setProgress({ step: `Scheduling pin ${i + 1}/${flattenedSchedule.length} for ${accounts.length} accounts...`, percent: currentPercent + 8 });
        
        const selectedLink = getAvailableLink(usedLinksInBatch);
        const finalLink = selectedLink ? selectedLink.url : campaign.blogUrl;
        
        if (selectedLink) {
          usedLinksInBatch.add(selectedLink.id);
          try {
            await updateDoc(doc(db, 'links', selectedLink.id), {
              lastUsedAt: serverTimestamp()
            });
          } catch (e) {
            console.error('Failed to update link lastUsedAt', e);
          }
        }

        for (const account of accounts) {
          try {
            await addDoc(collection(db, path), {
              uid: user.uid,
              campaignId: campaign.id,
              accountId: account.id,
              title: idea.title,
              description: `${idea.description}\n\nRead more: ${finalLink}`,
              link: finalLink,
              imageUrl: imageUrl,
              scheduledTime: scheduledTime.toISOString(),
              status: 'scheduled',
              createdAt: serverTimestamp()
            });
          } catch (e) {
            handleFirestoreError(e, OperationType.CREATE, path);
          }
        }
        
        addLog(`[${i+1}] Pin scheduled for all accounts.`);
        pinIndex++;

        // Small delay between pins to avoid rate limits and allow cancellation UI to breathe
        await new Promise(r => setTimeout(r, 1500));
      }

      if (!isCancelled.current) {
        const campaignPath = `campaigns/${campaign.id}`;
        try {
          await updateDoc(doc(db, 'campaigns', campaign.id), { status: 'active' });
        } catch (e) {
          handleFirestoreError(e, OperationType.UPDATE, campaignPath);
        }
        addLog(`Successfully scheduled ${pinIndex * accounts.length} pins.`);
        setProgress({ step: 'Automation completed!', percent: 100 });
      }
    } catch (e: any) {
      if (e.message === 'CANCELLED') {
        addLog('Automation cancelled.');
      } else {
        console.error(e);
        const errorMsg = e.message || String(e);
        if (errorMsg.includes('403') || errorMsg.includes('permission') || errorMsg.includes('PERMISSION_DENIED')) {
          addLog('Error: Gemini API Permission Denied. Please select a valid API key.');
          setHasApiKey(false);
        } else {
          addLog('Error: Failed to complete automation workflow.');
        }
      }
    } finally {
      setIsGenerating(false);
      setProgress(null);
    }
  };

  const chartData = React.useMemo(() => {
    const data = Array.from({ length: 24 }).map((_, i) => {
      const hourDate = addHours(new Date(), i);
      return {
        hour: format(hourDate, 'HH:00'),
        pins: hourlySchedule[i],
        existingPins: 0,
        timestamp: hourDate.getTime(),
        index: i
      };
    });

    // Add actual scheduled pins to the visualization
    scheduledPins.forEach(pin => {
      const pinTime = new Date(pin.scheduledTime);
      const pinTimestamp = pinTime.getTime();
      const hourIndex = data.findIndex((d, idx) => {
        const nextHourTimestamp = idx < 23 ? data[idx + 1].timestamp : d.timestamp + 3600000;
        return pinTimestamp >= d.timestamp && pinTimestamp < nextHourTimestamp;
      });
      if (hourIndex !== -1) {
        data[hourIndex].existingPins += 1;
      }
    });

    return data;
  }, [hourlySchedule, scheduledPins]);

  const handleBarClick = (data: any) => {
    if (!data || data.index === undefined) return;
    setActiveHour(data.index === activeHour ? null : data.index);
  };

  const adjustHour = (index: number, delta: number) => {
    setIsManualMode(true);
    const newSchedule = [...hourlySchedule];
    newSchedule[index] = Math.max(0, Math.min(20, newSchedule[index] + delta));
    setHourlySchedule(newSchedule);
  };

  const CustomTooltip = ({ active, payload, coordinate }: any) => {
    if (activeHour !== null) return null; // Hide tooltip if we have an active hour selected
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-surface-bg border border-border-primary rounded-xl p-3 shadow-2xl">
          <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1">{data.hour}</p>
          <p className="text-sm font-bold text-text-primary">{data.pins} Pins Planned</p>
          <p className="text-[10px] text-text-secondary mt-1">Click to edit</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 sm:py-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-accent-primary/10 rounded-2xl flex items-center justify-center text-accent-primary shadow-inner border border-accent-primary/20">
            <Calendar size={28} />
          </div>
          <div>
            <h2 className="text-3xl sm:text-4xl font-black text-text-primary tracking-tighter">Scheduler</h2>
            <p className="text-text-secondary text-sm font-medium">Precision automation for your Pinterest network.</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {isGenerating ? (
            <Button 
              variant="outline" 
              className="w-full sm:w-auto gap-2 border-error/50 text-error hover:bg-error/10 rounded-xl font-bold"
              onClick={cancelAutomation}
            >
              <XCircle size={18} />
              Stop Engine
            </Button>
          ) : (
            <>
              {!hasApiKey && (
                <Button 
                  variant="outline" 
                  className="w-full sm:w-auto gap-2 border-warning/50 text-warning hover:bg-warning/10 rounded-xl font-bold"
                  onClick={handleOpenSelectKey}
                >
                  <AlertCircle size={18} />
                  API Key Required
                </Button>
              )}
              <Button 
                className="w-full sm:w-auto gap-2 bg-accent-primary hover:bg-accent-hover text-white rounded-xl font-bold shadow-xl shadow-accent-primary/20" 
                size="lg"
                onClick={startAutomation}
                disabled={isGenerating || accounts.length === 0}
              >
                <Play size={18} fill="currentColor" />
                Launch Automation
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Controls & Chart */}
        <div className="lg:col-span-8 space-y-8">
          {!hasApiKey && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 bg-warning/5 border border-warning/20 rounded-2xl flex flex-col sm:flex-row items-center gap-4"
            >
              <div className="w-12 h-12 bg-warning/10 rounded-xl flex items-center justify-center text-warning shrink-0">
                <AlertCircle size={24} />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <p className="text-sm font-bold text-text-primary">Gemini API Key Missing</p>
                <p className="text-xs text-text-secondary">Required for AI image generation. Please connect your key.</p>
              </div>
              <Button 
                size="sm" 
                className="bg-warning text-black hover:bg-warning/80 font-bold rounded-lg px-6"
                onClick={handleOpenSelectKey}
              >
                Connect Now
              </Button>
            </motion.div>
          )}

          <Card className="p-6 sm:p-8 bg-surface-bg border-border-primary overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <Clock size={120} />
            </div>
            
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-main-bg flex items-center justify-center text-accent-primary border border-border-primary">
                <Clock size={20} />
              </div>
              <h3 className="text-xl font-bold text-text-primary">Posting Engine</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-text-secondary uppercase tracking-widest">Pins per Account</label>
                  <span className="text-2xl font-black text-accent-primary">{numPins}</span>
                </div>
                <div className="relative pt-1">
                  <input 
                    type="range" 
                    min="1" 
                    max="50" 
                    value={numPins}
                    onChange={(e) => setNumPins(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-main-bg rounded-full appearance-none cursor-pointer accent-accent-primary"
                  />
                  <div className="flex justify-between text-[10px] text-text-secondary font-bold mt-1">
                    <span>1</span>
                    <span>25</span>
                    <span>50</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-xs font-black text-text-secondary uppercase tracking-widest block">Burst Size</label>
                <div className="flex flex-row flex-nowrap gap-1.5 sm:gap-2 overflow-x-auto scrollbar-hide pb-1">
                  {[1, 2, 3, 5, 10].map(count => (
                    <button
                      key={count}
                      onClick={() => setPinsPerEvent(count)}
                      className={`flex-1 min-w-[40px] py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold transition-all border ${
                        pinsPerEvent === count 
                          ? 'bg-accent-primary border-accent-primary text-white shadow-lg shadow-accent-primary/20' 
                          : 'bg-main-bg border-border-primary text-text-secondary hover:border-accent-primary/50'
                      }`}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <label className="text-xs font-black text-text-secondary uppercase tracking-widest block">Time Interval</label>
              <div className="flex flex-row flex-nowrap gap-1.5 overflow-x-auto scrollbar-hide pb-1">
                {['30m', '1h', '2h', '4h', '6h', '12h', '24h', 'rnd'].map(gap => (
                  <button
                    key={gap}
                    onClick={() => setTimeGap(gap === 'rnd' ? 'random' : gap)}
                    className={`flex-1 min-w-[45px] py-2 rounded-lg text-[9px] font-black transition-all border uppercase tracking-tighter ${
                      (timeGap === 'random' ? 'rnd' : timeGap) === gap 
                        ? 'bg-accent-primary border-accent-primary text-white' 
                        : 'bg-main-bg border-border-primary text-text-secondary hover:border-accent-primary/50'
                    }`}
                  >
                    {gap}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-8 border-t border-border-primary">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h4 className="text-sm font-bold text-text-primary">Activity Heatmap</h4>
                  <p className="text-[10px] text-text-secondary uppercase font-bold tracking-widest mt-1">Next 24 Hours Distribution</p>
                </div>
                {isManualMode && (
                  <button 
                    onClick={() => setIsManualMode(false)}
                    className="text-[10px] font-black text-accent-primary bg-accent-primary/10 px-3 py-1.5 rounded-lg border border-accent-primary/20 hover:bg-accent-primary/20 transition-colors"
                  >
                    RESET TO AUTO
                  </button>
                )}
              </div>

              <div className="h-40 w-full relative group">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis dataKey="hour" hide />
                    <Tooltip 
                      content={<CustomTooltip />}
                      cursor={{ fill: 'rgba(var(--accent-primary-rgb), 0.05)' }}
                    />
                    <Bar 
                      dataKey="pins" 
                      radius={[4, 4, 0, 0]} 
                      onClick={handleBarClick}
                      className="cursor-pointer"
                    >
                      {chartData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={activeHour === index ? 'var(--color-accent-hover)' : (entry.pins > 0 ? 'var(--color-accent-primary)' : 'rgba(var(--text-secondary-rgb), 0.1)')} 
                          className="transition-all duration-300"
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>

                <AnimatePresence>
                  {activeHour !== null && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="absolute top-0 left-1/2 -translate-x-1/2 bg-surface-bg border border-accent-primary/30 rounded-2xl p-4 shadow-2xl flex items-center gap-6 z-50 backdrop-blur-xl"
                    >
                      <div className="text-left">
                        <p className="text-[10px] font-black text-accent-primary uppercase tracking-widest">{chartData[activeHour].hour}</p>
                        <p className="text-xs font-bold text-text-primary">Adjust Pins</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={() => adjustHour(activeHour, -1)}
                          className="w-10 h-10 bg-main-bg hover:bg-border-primary rounded-xl flex items-center justify-center text-text-primary transition-colors border border-border-primary"
                        >
                          <Minus size={18} />
                        </button>
                        <span className="text-2xl font-black text-text-primary min-w-[30px] text-center">{hourlySchedule[activeHour]}</span>
                        <button 
                          onClick={() => adjustHour(activeHour, 1)}
                          className="w-10 h-10 bg-accent-primary hover:bg-accent-hover rounded-xl flex items-center justify-center text-white transition-colors shadow-lg shadow-accent-primary/20"
                        >
                          <Plus size={18} />
                        </button>
                      </div>
                      <button 
                        onClick={() => setActiveHour(null)}
                        className="w-8 h-8 bg-main-bg hover:bg-border-primary rounded-lg flex items-center justify-center text-text-secondary transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-[10px] text-text-secondary font-black uppercase tracking-widest">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-accent-primary"></div>
                  <span>Planned</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-border-primary opacity-50"></div>
                  <span>Scheduled</span>
                </div>
                <div className="flex items-center gap-2">
                  <MousePointer2 size={10} />
                  <span>Click to Edit</span>
                </div>
              </div>
            </div>
          </Card>

          {isAutomationStarted && (
            <Card className="p-6 bg-surface-bg border-border-primary">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                  <Sparkles size={20} className="text-accent-primary" />
                  System Logs
                </h3>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
                  <span className="text-[10px] font-black text-success uppercase tracking-widest">Engine Online</span>
                </div>
              </div>
              <div className="bg-main-bg/50 rounded-xl p-4 h-48 overflow-y-auto font-mono text-[10px] sm:text-xs space-y-2 border border-border-primary custom-scrollbar">
                {logs.map((log, i) => (
                  <div key={i} className="flex gap-3 border-l-2 border-border-primary pl-3 py-0.5">
                    <span className="text-text-secondary opacity-40 shrink-0">{format(new Date(), 'HH:mm:ss')}</span>
                    <span className={log.startsWith('Error') ? 'text-error font-bold' : 'text-text-secondary'}>{log}</span>
                  </div>
                ))}
                {isGenerating && (
                  <div className="flex items-center gap-2 text-accent-primary animate-pulse pl-3">
                    <Loader2 size={12} className="animate-spin" />
                    <span>Awaiting next cycle...</span>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* Right Column: Summary & Preview */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="p-6 bg-surface-bg border-border-primary">
            <h3 className="text-sm font-black text-text-secondary uppercase tracking-widest mb-6">Campaign Summary</h3>
            <div className="space-y-4">
              {[
                { label: 'Niche', value: campaign?.niche || '---', icon: LayoutGrid },
                { label: 'Accounts', value: accounts.length, icon: Users },
                { label: 'Total Pins', value: numPins * accounts.length, icon: Pin },
                { label: 'Target URL', value: campaign?.blogUrl, icon: Globe, truncate: true },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <item.icon size={16} className="text-text-secondary group-hover:text-accent-primary transition-colors" />
                    <span className="text-xs text-text-secondary font-medium">{item.label}</span>
                  </div>
                  <span className={`text-xs font-bold text-text-primary ${item.truncate ? 'truncate max-w-[120px]' : ''}`}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 bg-surface-bg border-border-primary flex flex-col h-[500px]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-black text-text-secondary uppercase tracking-widest">Live Preview</h3>
              <div className="px-2 py-1 rounded bg-main-bg border border-border-primary text-[10px] font-bold text-text-secondary">
                {generatedPins.length} Generated
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
              {generatedPins.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                  <div className="w-16 h-16 rounded-full border-2 border-dashed border-text-secondary flex items-center justify-center mb-4">
                    <ImageIcon size={32} />
                  </div>
                  <p className="text-xs font-medium">Previews will populate <br />during generation.</p>
                </div>
              ) : (
                generatedPins.map((pin, i) => (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={i} 
                    className="bg-main-bg rounded-2xl overflow-hidden border border-border-primary group"
                  >
                    <div className="aspect-[2/3] bg-surface-bg relative overflow-hidden">
                      {pinImages[i] ? (
                        <img 
                          src={pinImages[i]} 
                          alt={pin.title} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Loader2 className="animate-spin text-accent-primary/30" size={32} />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="p-4">
                      <h4 className="text-xs font-bold text-text-primary line-clamp-1 mb-1">{pin.title}</h4>
                      <p className="text-[10px] text-text-secondary line-clamp-2 leading-relaxed">{pin.description}</p>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </Card>

          <div className="p-5 bg-success/5 border border-success/20 rounded-2xl flex items-start gap-4">
            <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center text-success shrink-0">
              <CheckCircle2 size={18} />
            </div>
            <p className="text-[10px] text-text-secondary leading-relaxed">
              <span className="text-success font-bold">Autonomous Mode:</span> Once launched, the engine handles generation, image creation, and scheduling across all linked accounts without further input.
            </p>
          </div>
        </div>
      </div>

      {/* Floating Progress Bar */}
      <AnimatePresence>
        {progress && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 right-6 left-6 sm:left-auto sm:w-96 bg-surface-bg border border-accent-primary/30 rounded-2xl p-5 shadow-2xl z-50 backdrop-blur-xl"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Loader2 size={14} className="animate-spin text-accent-primary" />
                <span className="text-[10px] font-black text-text-primary uppercase tracking-widest">Processing</span>
              </div>
              <span className="text-xs text-accent-primary font-black">{progress.percent}%</span>
            </div>
            <div className="w-full h-2 bg-main-bg rounded-full overflow-hidden mb-3 border border-border-primary">
              <motion.div 
                className="h-full bg-gradient-to-r from-accent-primary to-accent-hover"
                initial={{ width: 0 }}
                animate={{ width: `${progress.percent}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <p className="text-[10px] text-text-secondary font-medium truncate">{progress.step}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
