import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Trash2, 
  ExternalLink, 
  Loader2, 
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Button, Card, Input } from './ui';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { PinterestAccount } from '../types';

export default function AccountManager({ user }: { user: any }) {
  const [accounts, setAccounts] = useState<PinterestAccount[]>([]);
  const [isManualCode, setIsManualCode] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  const handleTokenExchange = async (code: string) => {
    setIsLoading(true);
    setStatusMessage("Exchanging tokens with Pinterest...");
    const path = 'accounts';
    try {
      const response = await fetch('/api/pinterest/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });
      
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || errData.message || "Token exchange failed");
      }
      
      const data = await response.json();
      setStatusMessage("Saving account to database...");

      await addDoc(collection(db, path), {
        uid: user.uid,
        username: data.username,
        niche: 'General',
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: Date.now() + (data.expires_in || 3600) * 1000,
        status: 'connected',
        createdAt: serverTimestamp()
      });

      setIsManualCode(false);
      setManualCode('');
      setStatusMessage(null);
    } catch (e) {
      console.error("Token exchange error:", e);
      setStatusMessage("Failed to connect account: " + (e instanceof Error ? e.message : String(e)));
      console.error("Token exchange error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAccount = async () => {
    console.log("Add Account button clicked");
    
    const width = 600;
    const height = 700;
    const left = window.screenX + (window.innerWidth - width) / 2;
    const top = window.screenY + (window.innerHeight - height) / 2;
    
    console.log("Attempting to open popup...");
    const popup = window.open(
      'about:blank',
      'pinterest_auth',
      `width=${width},height=${height},left=${left},top=${top}`
    );

    if (!popup) {
      console.error("Popup was blocked by the browser");
      setStatusMessage("Popup blocked! Please allow popups for this site to authorize Pinterest.");
      return;
    }

    console.log("Popup opened successfully");
    popup.focus();

    // Show a loading message in the blank popup
    popup.document.write(`
      <html>
        <head>
          <title>Connecting to Pinterest...</title>
          <style>
            body { background: #050505; color: #FFFFFF; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .loader { width: 32px; height: 32px; border: 3px solid #FF4D4D; border-top-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite; }
            @keyframes spin { to { transform: rotate(360deg); } }
          </style>
        </head>
        <body>
          <div style="text-align: center;">
            <div class="loader"></div>
            <p style="margin-top: 16px; font-size: 14px; color: #888888;">Connecting to Pinterest...</p>
          </div>
        </body>
      </html>
    `);

    setIsLoading(true);
    setStatusMessage("Preparing Pinterest authorization...");

    try {
      console.log("Fetching auth URL from server...");
      const response = await fetch('/api/auth/pinterest/url');
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      console.log("Server response for auth URL:", data);
      
      if (data.error) {
        throw new Error(data.error);
      }

      const url = data.url;
      if (!url) {
        throw new Error("No authorization URL returned from server");
      }

      // Update the popup's location with the real OAuth URL
      console.log("Redirecting popup to real URL:", url);
      popup.location.href = url;

      setStatusMessage("Waiting for Pinterest authorization...");

      const handleMessage = async (event: MessageEvent) => {
        if (event.data?.type === 'PINTEREST_AUTH_SUCCESS') {
          console.log("Auth success message received from popup");
          window.removeEventListener('message', handleMessage);
          await handleTokenExchange(event.data.code);
        }
      };

      window.addEventListener('message', handleMessage);
      
      const checkPopup = setInterval(() => {
        if (popup.closed) {
          console.log("Popup closed by user or system");
          clearInterval(checkPopup);
          setIsLoading(prev => {
            if (prev && statusMessage === "Waiting for Pinterest authorization...") {
              setStatusMessage(null);
              return false;
            }
            return prev;
          });
          setTimeout(() => window.removeEventListener('message', handleMessage), 1000);
        }
      }, 1000);

    } catch (e) {
      console.error("Add account error:", e);
      setStatusMessage("Error: " + (e instanceof Error ? e.message : String(e)));
      if (popup && !popup.closed) {
        console.log("Closing popup due to error");
        popup.close();
      }
      setIsLoading(false);
    }
  };

  const removeAccount = async (id: string) => {
    const path = `accounts/${id}`;
    try {
      await deleteDoc(doc(db, 'accounts', id));
      setDeletingId(null);
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, path);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-4 sm:py-8 px-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-surface-bg rounded-2xl flex items-center justify-center text-text-secondary shrink-0">
            <Users size={20} className="sm:w-6 sm:h-6" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-text-primary">Accounts Manager</h2>
            <p className="text-sm sm:text-base text-text-secondary">Connect and manage up to 10 Pinterest accounts.</p>
          </div>
        </div>
        <div className="flex flex-col items-stretch sm:items-end gap-2">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsManualCode(!isManualCode)} 
              className="text-text-secondary hover:text-text-primary h-10 flex-1 sm:flex-none"
            >
              Manual
            </Button>
            <Button onClick={handleAddAccount} disabled={isLoading || accounts.length >= 10} className="h-10 flex-1 sm:flex-none">
              {isLoading ? <Loader2 className="animate-spin mr-2" size={18} /> : <Plus size={18} className="mr-2" />}
              Add Account
            </Button>
          </div>
          {statusMessage && (
            <p className="text-[10px] text-error font-bold animate-pulse uppercase tracking-widest text-center sm:text-right">
              {statusMessage}
            </p>
          )}
        </div>
      </div>

      {isManualCode && (
        <Card className="mb-8 border-accent-primary/30 bg-accent-primary/5">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-text-primary">Manual Connection</h3>
              <Button variant="ghost" size="sm" onClick={() => setIsManualCode(false)}>Close</Button>
            </div>
            <p className="text-sm text-text-secondary">
              If the Pinterest authorization tab didn't close automatically, copy the 'code' from its URL and paste it here.
            </p>
            <div className="flex gap-2">
              <Input 
                placeholder="Paste authorization code here..." 
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                className="bg-main-bg border-border-primary text-text-primary"
              />
              <Button 
                onClick={() => handleTokenExchange(manualCode)} 
                disabled={isLoading || !manualCode}
                variant="success"
              >
                Connect
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {accounts.length === 0 ? (
          <div className="col-span-full py-20 text-center">
            <Users className="mx-auto text-text-secondary mb-4 opacity-20" size={64} />
            <p className="text-text-secondary">No accounts connected yet.</p>
          </div>
        ) : (
          accounts.map(acc => (
            <Card key={acc.id} className="group hover:border-accent-primary/50 transition-all relative overflow-hidden bg-surface-bg border-border-primary p-4 sm:p-6">
              {deletingId === acc.id && (
                <div className="absolute inset-0 bg-main-bg/95 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-4 sm:p-6 text-center">
                  <p className="text-text-primary font-bold mb-4 text-sm sm:text-base">Disconnect @{acc.username}?</p>
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <Button variant="danger" size="sm" onClick={() => removeAccount(acc.id)} className="w-full sm:w-auto">Yes, Disconnect</Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeletingId(null)} className="w-full sm:w-auto">Cancel</Button>
                  </div>
                </div>
              )}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-accent-primary/10 rounded-full flex items-center justify-center text-accent-primary font-bold text-lg sm:text-xl shrink-0">
                    {acc.username[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-text-primary truncate">@{acc.username}</h4>
                    <p className="text-xs sm:text-sm text-text-secondary truncate">{acc.niche}</p>
                    {acc.username.startsWith('DemoUser') && (
                      <p className="text-[9px] sm:text-[10px] text-accent-primary font-bold mt-1 flex items-center gap-1">
                        <AlertCircle size={10} />
                        DEMO MODE
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-2 py-1 rounded-full bg-success/10 text-success text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">
                    {acc.status}
                  </span>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-border-primary flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-xs text-text-secondary uppercase">Status</p>
                    <p className="font-bold text-text-primary text-xs">Active</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-text-secondary uppercase">Niche</p>
                    <p className="font-bold text-text-secondary text-xs">{acc.niche}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="text-text-secondary hover:text-text-primary">
                    <ExternalLink size={18} />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-text-secondary hover:text-error"
                    onClick={() => setDeletingId(acc.id)}
                  >
                    <Trash2 size={18} />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <div className="mt-12 p-6 bg-surface-bg rounded-2xl border border-border-primary flex items-start gap-4">
        <AlertCircle className="text-text-secondary shrink-0" size={24} />
        <div className="text-sm text-text-secondary">
          <p className="font-bold text-text-primary mb-1">About Pinterest API Access</p>
          PinViral AI uses the official Pinterest v5 API. To avoid limitations, ensure your account is a Business account and you have requested "Standard" access level in the Pinterest Developer Portal.
        </div>
      </div>
    </div>
  );
}
