import React, { useState, useEffect } from 'react';
import { 
  Link as LinkIcon, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Clock,
  AlertCircle,
  Search
} from 'lucide-react';
import { Button, Card, Input, Textarea } from './ui';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';

interface Link {
  id: string;
  url: string;
  lastUsedAt?: any;
  createdAt: any;
  uid: string;
}

export default function LinkManager({ user }: { user: any }) {
  const [links, setLinks] = useState<Link[]>([]);
  const [bulkInput, setBulkInput] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const path = 'links';
    const q = query(collection(db, path), where('uid', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setLinks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Link)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
    return () => unsubscribe();
  }, [user.uid]);

  const handleBulkAdd = async () => {
    if (!bulkInput.trim()) return;
    setIsLoading(true);
    
    const urls = bulkInput
      .split('\n')
      .map(url => url.trim())
      .filter(url => url.length > 0);

    if (urls.length === 0) {
      setIsLoading(false);
      return;
    }

    const path = 'links';
    try {
      const batch = writeBatch(db);
      urls.forEach(url => {
        const newDocRef = doc(collection(db, path));
        batch.set(newDocRef, {
          uid: user.uid,
          url,
          createdAt: serverTimestamp(),
          lastUsedAt: null
        });
      });
      await batch.commit();
      setBulkInput('');
      setIsAdding(false);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    } finally {
      setIsLoading(false);
    }
  };

  const removeLink = async (id: string) => {
    const path = `links/${id}`;
    try {
      await deleteDoc(doc(db, 'links', id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, path);
    }
  };

  const filteredLinks = links.filter(l => 
    l.url.toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => {
    // Sort by lastUsedAt (nulls first)
    if (!a.lastUsedAt && b.lastUsedAt) return -1;
    if (a.lastUsedAt && !b.lastUsedAt) return 1;
    if (!a.lastUsedAt && !b.lastUsedAt) return 0;
    return a.lastUsedAt.seconds - b.lastUsedAt.seconds;
  });

  const isAvailable = (lastUsedAt: any) => {
    if (!lastUsedAt) return true;
    const lastUsed = lastUsedAt.toDate();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return lastUsed < oneWeekAgo;
  };

  return (
    <div className="max-w-4xl mx-auto py-4 sm:py-8 px-4 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-text-primary">Link Library</h2>
          <p className="text-sm sm:text-base text-text-secondary mt-1">Manage your destination URLs for pins.</p>
        </div>
        <Button onClick={() => setIsAdding(true)} className="gap-2 h-10 w-full sm:w-auto">
          <Plus size={18} />
          Bulk Add Links
        </Button>
      </div>

      {isAdding && (
        <Card className="border-success/30 bg-success/5">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-text-primary">Add Links in Bulk</h3>
              <Button variant="ghost" size="sm" onClick={() => setIsAdding(false)}>Cancel</Button>
            </div>
            <p className="text-sm text-text-secondary">Paste your links below, one per line.</p>
            <Textarea 
              placeholder="https://example.com/post-1&#10;https://example.com/post-2"
              value={bulkInput}
              onChange={(e) => setBulkInput(e.target.value)}
              className="h-40 font-mono text-sm bg-main-bg border-border-primary text-text-primary"
            />
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsAdding(false)}>Cancel</Button>
              <Button onClick={handleBulkAdd} disabled={isLoading || !bulkInput.trim()}>
                {isLoading ? 'Adding...' : `Add ${bulkInput.split('\n').filter(l => l.trim()).length} Links`}
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="flex items-center gap-4 bg-surface-bg p-3 sm:p-4 rounded-2xl border border-border-primary">
        <Search className="text-text-secondary shrink-0" size={18} />
        <input 
          type="text" 
          placeholder="Search links..." 
          className="bg-transparent border-none outline-none text-text-primary w-full text-sm sm:text-base"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredLinks.length === 0 ? (
          <div className="col-span-full py-20 text-center">
            <LinkIcon className="mx-auto text-text-secondary mb-4 opacity-20" size={48} />
            <p className="text-text-secondary">No links found. Add some to start automating.</p>
          </div>
        ) : (
          filteredLinks.map(link => (
            <Card key={link.id} className="group relative bg-surface-bg border-border-primary p-4 sm:p-6">
              <div className="flex flex-col h-full">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 bg-main-bg rounded-lg text-text-secondary shrink-0">
                    <LinkIcon size={16} className="sm:w-[18px] sm:h-[18px]" />
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-text-secondary hover:text-error opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                    onClick={() => removeLink(link.id)}
                  >
                    <Trash2 size={14} className="sm:w-4 sm:h-4" />
                  </Button>
                </div>
                
                <p className="text-xs sm:text-sm font-medium text-text-primary truncate mb-4" title={link.url}>
                  {link.url}
                </p>

                <div className="mt-auto pt-4 border-t border-border-primary flex items-center justify-between">
                  {isAvailable(link.lastUsedAt) ? (
                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-success uppercase tracking-wider">
                      <CheckCircle2 size={12} />
                      Available
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-accent-primary uppercase tracking-wider">
                      <Clock size={12} />
                      Cooldown
                    </span>
                  )}
                  
                  <span className="text-[10px] text-text-secondary">
                    {link.lastUsedAt 
                      ? `Used ${formatDistanceToNow(link.lastUsedAt.toDate())} ago`
                      : 'Never used'}
                  </span>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <Card className="bg-accent-primary/5 border-accent-primary/20 flex items-start gap-4">
        <AlertCircle className="text-accent-primary shrink-0" size={24} />
        <div>
          <h4 className="font-bold text-accent-primary">Weekly Link Rotation</h4>
          <p className="text-sm text-text-secondary mt-1">
            To avoid spam flags, each link is only used once every 7 days. 
            The scheduler will automatically pick the oldest available link from your library.
          </p>
        </div>
      </Card>
    </div>
  );
}
