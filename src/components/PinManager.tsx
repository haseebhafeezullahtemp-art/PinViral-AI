import React, { useState, useEffect } from 'react';
import { 
  Pin, 
  Search, 
  Trash2, 
  Edit2, 
  ExternalLink, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  FileText,
  Filter,
  MoreVertical,
  Loader2,
  ChevronRight,
  X,
  Upload,
  Link as LinkIcon
} from 'lucide-react';
import { Card, Button, Input } from './ui';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, onSnapshot, deleteDoc, doc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { ScheduledPin, PinterestAccount, Campaign } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';

type PinStatus = 'all' | 'draft' | 'scheduled' | 'posted' | 'failed';

export default function PinManager({ user }: { user: any }) {
  const [pins, setPins] = useState<ScheduledPin[]>([]);
  const [accounts, setAccounts] = useState<PinterestAccount[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [search, setSearch] = useState('');
  const [activeStatus, setActiveStatus] = useState<PinStatus>('all');
  const [loading, setLoading] = useState(true);
  const [editingPin, setEditingPin] = useState<ScheduledPin | null>(null);
  const [deletingPin, setDeletingPin] = useState<ScheduledPin | null>(null);
  const [selectedPinIds, setSelectedPinIds] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [filterAccountId, setFilterAccountId] = useState('all');
  const [filterCampaignId, setFilterCampaignId] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    const path = 'accounts';
    const q = query(collection(db, path), where('uid', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAccounts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PinterestAccount)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
    return () => unsubscribe();
  }, [user.uid]);

  useEffect(() => {
    const path = 'campaigns';
    const q = query(collection(db, path), where('uid', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCampaigns(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Campaign)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
    return () => unsubscribe();
  }, [user.uid]);

  useEffect(() => {
    const path = 'scheduledPins';
    const q = query(collection(db, path), where('uid', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPins(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ScheduledPin)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user.uid]);

  const handleDelete = async (id: string) => {
    const path = `scheduledPins/${id}`;
    try {
      await deleteDoc(doc(db, 'scheduledPins', id));
      setDeletingPin(null);
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, path);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPin) return;
    const path = `scheduledPins/${editingPin.id}`;
    try {
      const { id, ...data } = editingPin;
      await updateDoc(doc(db, 'scheduledPins', id), {
        ...data,
        updatedAt: serverTimestamp()
      });
      setEditingPin(null);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, path);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editingPin) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditingPin({ ...editingPin, imageUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleSelectPin = (id: string) => {
    setSelectedPinIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedPinIds.length === filteredPins.length) {
      setSelectedPinIds([]);
    } else {
      setSelectedPinIds(filteredPins.map(p => p.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedPinIds.length === 0) return;
    setIsBulkDeleting(true);
    try {
      await Promise.all(selectedPinIds.map(id => deleteDoc(doc(db, 'scheduledPins', id))));
      setSelectedPinIds([]);
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, 'scheduledPins');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleBulkStatusUpdate = async (status: PinStatus) => {
    if (selectedPinIds.length === 0 || status === 'all') return;
    try {
      await Promise.all(selectedPinIds.map(id => 
        updateDoc(doc(db, 'scheduledPins', id), { 
          status,
          updatedAt: serverTimestamp()
        })
      ));
      setSelectedPinIds([]);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, 'scheduledPins');
    }
  };

  const filteredPins = pins.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) || 
                          p.description.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = activeStatus === 'all' || p.status === activeStatus;
    const matchesAccount = filterAccountId === 'all' || p.accountId === filterAccountId;
    const matchesCampaign = filterCampaignId === 'all' || p.campaignId === filterCampaignId;
    const matchesDate = !filterDate || p.scheduledTime.startsWith(filterDate);
    
    return matchesSearch && matchesStatus && matchesAccount && matchesCampaign && matchesDate;
  });

  const stats = {
    total: pins.length,
    draft: pins.filter(p => p.status === 'draft').length,
    scheduled: pins.filter(p => p.status === 'scheduled').length,
    posted: pins.filter(p => p.status === 'posted').length,
    failed: pins.filter(p => p.status === 'failed').length,
  };

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="animate-spin text-accent-primary" size={48} />
      </div>
    );
  }

  const toggleSelectionMode = () => {
    if (isSelectionMode) {
      setSelectedPinIds([]);
    }
    setIsSelectionMode(!isSelectionMode);
  };

  return (
    <div className="max-w-6xl mx-auto py-4 sm:py-8 px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-surface-bg rounded-2xl flex items-center justify-center text-text-secondary shrink-0">
            <Pin size={20} className="sm:w-6 sm:h-6" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-text-primary">Pins Management</h2>
            <p className="text-sm sm:text-base text-text-secondary">View and manage all your generated pins.</p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {isSelectionMode && filteredPins.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={toggleSelectAll}
              className="text-xs text-text-secondary hover:text-text-primary h-10"
            >
              {selectedPinIds.length === filteredPins.length ? 'Deselect All' : 'Select All'}
            </Button>
          )}
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={16} />
            <Input 
              placeholder="Search pins..." 
              className="pl-10 w-full sm:w-64 bg-main-bg border-border-primary h-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant={isSelectionMode ? 'primary' : 'outline'}
              size="sm"
              onClick={toggleSelectionMode}
              className="gap-2 h-10 flex-1"
            >
              <CheckCircle2 size={16} />
              {isSelectionMode ? 'Exit' : 'Select'}
            </Button>
            <Button 
              variant={showFilters ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2 h-10 flex-1"
            >
              <Filter size={16} />
              Filters
            </Button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-8"
          >
            <Card className="p-3 sm:p-6 bg-surface-bg border-border-primary">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-6">
                <div>
                  <label className="text-[10px] sm:text-xs font-bold text-text-secondary uppercase tracking-widest mb-1 sm:mb-2 block">By Account</label>
                  <select
                    value={filterAccountId}
                    onChange={(e) => setFilterAccountId(e.target.value)}
                    className="w-full bg-main-bg border border-border-primary rounded-xl px-2 sm:px-4 py-1.5 sm:py-2.5 text-[10px] sm:text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/50"
                  >
                    <option value="all">All Accounts</option>
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>@{acc.username} ({acc.niche})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] sm:text-xs font-bold text-text-secondary uppercase tracking-widest mb-1 sm:mb-2 block">By Niche / Campaign</label>
                  <select
                    value={filterCampaignId}
                    onChange={(e) => setFilterCampaignId(e.target.value)}
                    className="w-full bg-main-bg border border-border-primary rounded-xl px-2 sm:px-4 py-1.5 sm:py-2.5 text-[10px] sm:text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/50"
                  >
                    <option value="all">All Niches</option>
                    {campaigns.map(camp => (
                      <option key={camp.id} value={camp.id}>{camp.niche} - {camp.id.slice(0, 8)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] sm:text-xs font-bold text-text-secondary uppercase tracking-widest mb-1 sm:mb-2 block">By Date</label>
                  <Input 
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="w-full h-8 sm:h-10 text-[10px] sm:text-sm px-2"
                  />
                </div>
              </div>
              <div className="flex justify-end mt-3">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    setFilterAccountId('all');
                    setFilterCampaignId('all');
                    setFilterDate('');
                  }}
                  className="text-[10px] sm:text-xs text-text-secondary hover:text-text-primary h-8"
                >
                  Clear Filters
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4 mb-8">
        {[
          { id: 'all', label: 'All', count: stats.total, icon: Pin, color: 'text-text-primary' },
          { id: 'draft', label: 'Drafts', count: stats.draft, icon: FileText, color: 'text-text-secondary' },
          { id: 'scheduled', label: 'Sched', count: stats.scheduled, icon: Clock, color: 'text-accent-primary' },
          { id: 'posted', label: 'Live', count: stats.posted, icon: CheckCircle2, color: 'text-success' },
          { id: 'failed', label: 'Fail', count: stats.failed, icon: AlertCircle, color: 'text-error' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveStatus(tab.id as PinStatus)}
            className={`p-3 sm:p-4 rounded-2xl border transition-all text-left group ${
              activeStatus === tab.id 
                ? 'bg-surface-bg border-border-primary ring-2 ring-accent-primary/20' 
                : 'bg-main-bg border-border-primary hover:border-border-primary'
            }`}
          >
            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center mb-2 sm:mb-3 ${
              activeStatus === tab.id ? 'bg-accent-primary/10' : 'bg-surface-bg'
            }`}>
              <tab.icon size={16} className={tab.color} />
            </div>
            <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-0.5 sm:mb-1">{tab.label}</p>
            <p className="text-xl sm:text-2xl font-bold text-text-primary">{tab.count}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredPins.length === 0 ? (
          <div className="col-span-full py-20 text-center">
            <Pin className="mx-auto text-text-secondary mb-4 opacity-20" size={64} />
            <p className="text-text-secondary">No pins found in this category.</p>
          </div>
        ) : (
          filteredPins.map(pin => (
            <Card 
              key={pin.id} 
              className={`group p-0 overflow-hidden flex flex-col h-full hover:border-border-primary transition-all relative ${
                selectedPinIds.includes(pin.id) ? 'border-accent-primary ring-1 ring-accent-primary/50' : ''
              }`}
              onClick={() => isSelectionMode && toggleSelectPin(pin.id)}
            >
              {isSelectionMode && (
                <div 
                  className="absolute top-3 left-3 z-10"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input 
                    type="checkbox"
                    checked={selectedPinIds.includes(pin.id)}
                    onChange={() => toggleSelectPin(pin.id)}
                    className="w-5 h-5 rounded border-border-primary bg-surface-bg text-accent-primary focus:ring-accent-primary/50 focus:ring-offset-0 cursor-pointer"
                  />
                </div>
              )}
              <div className="aspect-[2/3] relative bg-surface-bg">
                <img 
                  src={pin.imageUrl} 
                  alt={pin.title} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => setEditingPin(pin)}
                    className="w-8 h-8 bg-black/60 backdrop-blur-md rounded-lg flex items-center justify-center text-text-primary hover:bg-accent-primary transition-colors"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button 
                    onClick={() => setDeletingPin(pin)}
                    className="w-8 h-8 bg-black/60 backdrop-blur-md rounded-lg flex items-center justify-center text-text-primary hover:bg-accent-primary transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="absolute bottom-3 left-3">
                  <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider backdrop-blur-md ${
                    pin.status === 'posted' ? 'bg-success/20 text-success' :
                    pin.status === 'scheduled' ? 'bg-accent-primary/20 text-accent-primary' :
                    pin.status === 'failed' ? 'bg-error/20 text-error' :
                    'bg-surface-bg/50 text-text-secondary'
                  }`}>
                    {pin.status}
                  </span>
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <h4 className="font-bold text-text-primary line-clamp-1 mb-1">{pin.title}</h4>
                <p className="text-xs text-text-secondary line-clamp-2 mb-4 flex-1">{pin.description}</p>
                
                <div className="space-y-2 pt-4 border-t border-border-primary">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-text-secondary uppercase font-bold tracking-widest">Account</span>
                    <span className="text-text-secondary">@{accounts.find(a => a.id === pin.accountId)?.username || 'Unknown'}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-text-secondary uppercase font-bold tracking-widest">Scheduled</span>
                    <span className="text-text-secondary">{format(new Date(pin.scheduledTime), 'MMM d, HH:mm')}</span>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Bulk Actions Bar */}
      <AnimatePresence>
        {selectedPinIds.length > 0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] w-full max-w-2xl px-4"
          >
            <div className="bg-surface-bg border border-border-primary rounded-2xl p-3 sm:p-4 shadow-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-accent-primary rounded-xl flex items-center justify-center text-text-primary font-bold shrink-0">
                  {selectedPinIds.length}
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-text-primary">Pins Selected</p>
                  <p className="text-[10px] sm:text-xs text-text-secondary">Apply bulk actions</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedPinIds([])}
                  className="p-2 ml-auto sm:hidden"
                >
                  <X size={16} />
                </Button>
              </div>
              
              <div className="flex flex-wrap items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleBulkStatusUpdate('draft')}
                  className="text-[10px] sm:text-xs gap-1.5 sm:gap-2 flex-1 sm:flex-none"
                >
                  <FileText size={14} />
                  Draft
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleBulkStatusUpdate('scheduled')}
                  className="text-[10px] sm:text-xs gap-1.5 sm:gap-2 flex-1 sm:flex-none"
                >
                  <Clock size={14} />
                  Schedule
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleBulkStatusUpdate('posted')}
                  className="text-[10px] sm:text-xs gap-1.5 sm:gap-2 flex-1 sm:flex-none"
                >
                  <CheckCircle2 size={14} />
                  Publish
                </Button>
                <div className="hidden sm:block w-px h-8 bg-border-primary mx-1" />
                <Button 
                  variant="danger" 
                  size="sm" 
                  onClick={handleBulkDelete}
                  disabled={isBulkDeleting}
                  className="text-[10px] sm:text-xs gap-1.5 sm:gap-2 flex-1 sm:flex-none"
                >
                  {isBulkDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  Delete
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedPinIds([])}
                  className="p-2 hidden sm:flex"
                >
                  <X size={16} />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingPin && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingPin(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-surface-bg border border-border-primary rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-border-primary flex items-center justify-between">
                <h3 className="text-xl font-bold text-text-primary">Edit Pin</h3>
                <button onClick={() => setEditingPin(null)} className="text-text-secondary hover:text-text-primary">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleUpdate} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-2 block">Title</label>
                      <Input 
                        value={editingPin.title}
                        onChange={(e) => setEditingPin({...editingPin, title: e.target.value})}
                        placeholder="Pin title"
                        className="bg-main-bg border-border-primary"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-2 block">Description</label>
                      <textarea 
                        value={editingPin.description}
                        onChange={(e) => setEditingPin({...editingPin, description: e.target.value})}
                        className="w-full h-32 bg-main-bg border border-border-primary rounded-xl p-4 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/50 transition-all resize-none scrollbar-hide"
                        placeholder="Pin description"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-2 block">Destination Link</label>
                      <Input 
                        value={editingPin.link}
                        onChange={(e) => setEditingPin({...editingPin, link: e.target.value})}
                        placeholder="https://..."
                        className="bg-main-bg border-border-primary"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-text-secondary uppercase tracking-widest block">Image Preview</label>
                      <div className="flex gap-2">
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          className="hidden" 
                          accept="image/*"
                          onChange={handleImageUpload}
                        />
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm" 
                          className="h-7 text-[10px] gap-1.5"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Upload size={12} />
                          Upload
                        </Button>
                      </div>
                    </div>
                    <div className="aspect-[2/3] rounded-2xl overflow-hidden bg-main-bg border border-border-primary relative group/img">
                      <img 
                        src={editingPin.imageUrl} 
                        alt="" 
                        className="w-full h-full object-contain" 
                        referrerPolicy="no-referrer" 
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center p-4">
                        <div className="w-full space-y-2">
                          <div className="flex items-center justify-center gap-2 mb-1">
                            <LinkIcon size={12} className="text-accent-primary" />
                            <p className="text-[10px] text-text-primary font-bold uppercase tracking-widest text-center">Update Image URL</p>
                          </div>
                          <Input 
                            value={editingPin.imageUrl}
                            onChange={(e) => setEditingPin({...editingPin, imageUrl: e.target.value})}
                            placeholder="Paste image URL..."
                            className="bg-surface-bg/80 border-border-primary h-8 text-[10px]"
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-2 block">Status</label>
                      <select
                        value={editingPin.status}
                        onChange={(e) => setEditingPin({...editingPin, status: e.target.value as any})}
                        className="w-full bg-main-bg border border-border-primary rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/50"
                      >
                        <option value="draft">Draft</option>
                        <option value="scheduled">Scheduled</option>
                        <option value="posted">Posted</option>
                        <option value="failed">Failed</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-2 block">Scheduled Time</label>
                      <Input 
                        type="datetime-local"
                        value={(() => {
                          try {
                            return new Date(editingPin.scheduledTime).toISOString().slice(0, 16);
                          } catch (e) {
                            return new Date().toISOString().slice(0, 16);
                          }
                        })()}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val) {
                            try {
                              setEditingPin({...editingPin, scheduledTime: new Date(val).toISOString()});
                            } catch (err) {
                              // Ignore invalid dates
                            }
                          }
                        }}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="ghost" className="flex-1" onClick={() => setEditingPin(null)}>Cancel</Button>
                  <Button type="submit" className="flex-1">Update Pin</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {deletingPin && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeletingPin(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-md bg-surface-bg border border-border-primary rounded-3xl p-8 shadow-2xl"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-accent-primary/10 rounded-2xl flex items-center justify-center text-accent-primary mb-6">
                  <AlertCircle size={32} />
                </div>
                <h3 className="text-2xl font-bold text-text-primary mb-2">Delete Pin?</h3>
                <p className="text-text-secondary mb-8">
                  Are you sure you want to delete <span className="text-text-primary font-semibold">"{deletingPin.title}"</span>? 
                  This action cannot be undone.
                </p>
                <div className="flex gap-3 w-full">
                  <Button variant="ghost" className="flex-1" onClick={() => setDeletingPin(null)}>Cancel</Button>
                  <Button variant="danger" className="flex-1" onClick={() => handleDelete(deletingPin.id)}>Delete Pin</Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
