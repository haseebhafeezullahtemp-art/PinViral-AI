import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  Search, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  ExternalLink,
  Plus,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { Card, Button, Input } from './ui';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { Campaign, PinterestAccount } from '../types';
import { motion, AnimatePresence } from 'motion/react';

export default function CampaignList({ user, setActiveTab, onEdit }: { user: any, setActiveTab: (t: string) => void, onEdit: (c: Campaign) => void }) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [accounts, setAccounts] = useState<PinterestAccount[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [deletingCampaign, setDeletingCampaign] = useState<Campaign | null>(null);

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
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user.uid]);

  const handleDelete = async (id: string) => {
    const path = `campaigns/${id}`;
    try {
      await deleteDoc(doc(db, 'campaigns', id));
      setDeletingCampaign(null);
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, path);
    }
  };

  const filteredCampaigns = campaigns.filter(c => 
    (c.niche || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="animate-spin text-accent-primary" size={48} />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-4 sm:py-8 px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-surface-bg rounded-2xl flex items-center justify-center text-text-secondary shrink-0">
            <Layers size={20} className="sm:w-6 sm:h-6" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-text-primary">Campaign Management</h2>
            <p className="text-sm sm:text-base text-text-secondary">Manage your active and draft campaigns.</p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={16} />
            <Input 
              placeholder="Search campaigns..." 
              className="pl-10 w-full sm:w-64 bg-surface-bg border-border-primary text-text-primary h-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button onClick={() => setActiveTab('campaigns')} className="gap-2 h-10">
            <Plus size={18} />
            New
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredCampaigns.length === 0 ? (
          <div className="py-20 text-center">
            <Layers className="mx-auto text-text-secondary mb-4 opacity-20" size={64} />
            <p className="text-text-secondary">No campaigns found.</p>
          </div>
        ) : (
          filteredCampaigns.map(camp => (
            <Card key={camp.id} className="group hover:border-accent-primary/50 transition-all relative overflow-hidden bg-surface-bg border-border-primary p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h4 className="text-lg sm:text-xl font-bold text-text-primary truncate">{camp.niche}</h4>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      camp.status === 'active' 
                        ? 'bg-success/10 text-success' 
                        : camp.status === 'completed'
                        ? 'bg-accent-primary/10 text-accent-primary'
                        : 'bg-main-bg text-text-secondary'
                    }`}>
                      {camp.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] sm:text-xs text-text-secondary">
                    <div className="flex items-center gap-1.5">
                      <Clock size={14} />
                      <span>{camp.numPins} pins · {camp.timeGap} gap</span>
                    </div>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <ExternalLink size={14} className="shrink-0" />
                      <span className="truncate max-w-[150px] sm:max-w-[200px]">{camp.blogUrl}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Layers size={14} />
                      <span>{(camp.accountIds || []).length} accounts</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-text-secondary hover:text-text-primary"
                    onClick={() => onEdit(camp)}
                  >
                    <Edit2 size={18} />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-text-secondary hover:text-error"
                    onClick={() => setDeletingCampaign(camp)}
                  >
                    <Trash2 size={18} />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <AnimatePresence>
        {deletingCampaign && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeletingCampaign(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-surface-bg border border-border-primary rounded-3xl p-8 shadow-2xl"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-error/10 rounded-2xl flex items-center justify-center text-error mb-6">
                  <AlertCircle size={32} />
                </div>
                <h3 className="text-2xl font-bold text-text-primary mb-2">Delete Campaign?</h3>
                <p className="text-text-secondary mb-8">
                  Are you sure you want to delete <span className="text-text-primary font-semibold">"{deletingCampaign.niche}"</span>? 
                  This action cannot be undone. Scheduled pins will remain unless deleted separately.
                </p>
                <div className="flex gap-3 w-full">
                  <Button 
                    variant="ghost" 
                    className="flex-1" 
                    onClick={() => setDeletingCampaign(null)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="danger" 
                    className="flex-1" 
                    onClick={() => handleDelete(deletingCampaign.id)}
                  >
                    Delete Campaign
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
