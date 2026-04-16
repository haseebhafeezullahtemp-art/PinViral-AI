import * as React from 'react';
import { useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  User 
} from 'firebase/auth';
import { auth, googleProvider, db } from './lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import CampaignForm from './components/CampaignForm';
import AccountManager from './components/AccountManager';
import Scheduler from './components/Scheduler';
import LinkManager from './components/LinkManager';
import CampaignList from './components/CampaignList';
import Analytics from './components/Analytics';
import PinManager from './components/PinManager';
import Settings from './components/Settings';
import UtilityPages from './components/UtilityPages';
import WorkWithUs from './components/WorkWithUs';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Button, Card } from './components/ui';
import { Campaign } from './types';
import { Pin, LogIn, Loader2, Sparkles, ShieldCheck, AlertCircle, Link as LinkIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    // Initialize theme from localStorage or system preference
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        // For email/password users, check if verified
        const isEmailPassword = u.providerData.some(p => p.providerId === 'password');
        if (isEmailPassword && !u.emailVerified) {
          setUser(null);
          setLoading(false);
          return;
        }

        // Ensure user document exists in Firestore
        const userDocRef = doc(db, 'users', u.uid);
        try {
          const userDoc = await getDoc(userDocRef);
          if (!userDoc.exists()) {
            await setDoc(userDocRef, {
              uid: u.uid,
              email: u.email,
              displayName: u.displayName || u.email?.split('@')[0],
              photoURL: u.photoURL,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
          }
        } catch (error) {
          console.error("Error ensuring user document exists:", error);
        }
      }
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error("Login failed", error);
      setAuthError(error.message || "Login failed");
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);

    if (!email.toLowerCase().endsWith('@gmail.com')) {
      setAuthError('Only @gmail.com email addresses are allowed.');
      setAuthLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(userCredential.user);
        setAuthError('Verification email sent! Please check your inbox before logging in.');
        // We don't automatically sign them in if we want to force verification
        // But Firebase signs them in automatically on creation.
        // We can check emailVerified in the onAuthStateChanged or here.
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        if (!userCredential.user.emailVerified) {
          setAuthError('Please verify your email before logging in. Check your inbox.');
          await auth.signOut();
        }
      }
    } catch (error: any) {
      console.error("Auth failed", error);
      setAuthError(error.message || "Authentication failed");
    } finally {
      setAuthLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-full bg-main-bg flex flex-col items-center justify-center gap-4 transition-colors duration-200">
        <div className="w-16 h-16 bg-accent-primary rounded-2xl flex items-center justify-center animate-pulse shadow-2xl shadow-accent-primary/20">
          <Pin className="text-white" size={32} />
        </div>
        <p className="text-text-secondary font-medium tracking-widest uppercase text-xs">Initializing PinViral AI...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen w-full bg-main-bg flex items-center justify-center p-6 relative overflow-hidden transition-colors duration-200">
        {/* Background Accents */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent-primary/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent-primary/5 blur-[120px] rounded-full" />
        
        <div className="max-w-md w-full relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="w-20 h-20 bg-accent-primary rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-accent-primary/30">
              <Pin className="text-white" size={40} />
            </div>
            <h1 className="text-5xl font-black text-text-primary tracking-tighter mb-4">PinViral AI</h1>
            <p className="text-text-secondary text-lg leading-relaxed">
              Automate your Pinterest growth with AI-powered viral pin generation and smart scheduling.
            </p>
          </motion.div>

          <Card className="p-8 border-border-primary bg-surface-bg/40 backdrop-blur-xl">
            <div className="space-y-6">
              <div className="flex items-center gap-3 p-4 bg-main-bg rounded-2xl border border-border-primary">
                <ShieldCheck className="text-success" size={24} />
                <div className="text-left">
                  <p className="text-sm font-bold text-text-primary">Secure Auth</p>
                  <p className="text-xs text-text-secondary">Official Google Sign-In or Email Verification.</p>
                </div>
              </div>

              <form onSubmit={handleEmailAuth} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-widest">Email Address</label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="yourname@gmail.com"
                    className="w-full bg-main-bg border border-border-primary rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-primary transition-colors"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-widest">Password</label>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-main-bg border border-border-primary rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-primary transition-colors"
                    required
                  />
                </div>

                {authError && (
                  <div className="p-3 bg-error/10 border border-error/20 rounded-xl flex items-start gap-2">
                    <AlertCircle className="text-error shrink-0" size={16} />
                    <p className="text-xs text-error">{authError}</p>
                  </div>
                )}

                <Button 
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-4 text-lg gap-3 shadow-xl shadow-accent-primary/20"
                  size="lg"
                >
                  {authLoading ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <LogIn size={20} />
                  )}
                  {isSignUp ? 'Create Account' : 'Sign In'}
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border-primary"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-surface-bg px-2 text-text-secondary font-bold tracking-widest">Or continue with</span>
                </div>
              </div>
              
              <Button 
                onClick={handleLogin} 
                variant="outline"
                className="w-full py-4 text-lg gap-3 border-border-primary hover:bg-main-bg"
                size="lg"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google
              </Button>

              <button 
                onClick={() => setIsSignUp(!isSignUp)}
                className="w-full text-xs text-text-secondary hover:text-accent-primary font-bold uppercase tracking-widest transition-colors"
              >
                {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
              </button>

              <p className="text-[10px] text-text-secondary text-center uppercase tracking-widest font-bold">
                Trusted by 10,000+ Creators
              </p>
            </div>
          </Card>

          <div className="mt-12 flex items-center justify-center gap-8 opacity-40 grayscale">
            <Sparkles size={24} className="text-text-secondary" />
            <div className="h-4 w-px bg-border-primary" />
            <Pin size={24} className="text-text-secondary" />
            <div className="h-4 w-px bg-border-primary" />
            <ShieldCheck size={24} className="text-text-secondary" />
          </div>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard setActiveTab={setActiveTab} user={user} />;
      case 'campaigns':
        if (isCreating || editingCampaign) {
          return (
            <CampaignForm 
              user={user} 
              setActiveTab={setActiveTab} 
              campaignToEdit={editingCampaign}
              onCancel={() => {
                setEditingCampaign(null);
                setIsCreating(false);
              }}
            />
          );
        }
        return (
          <CampaignList 
            user={user} 
            setActiveTab={(t) => {
              if (t === 'campaigns') setIsCreating(true);
              else setActiveTab(t);
            }} 
            onEdit={(c) => {
              setEditingCampaign(c);
            }}
          />
        );
      case 'accounts':
        return <AccountManager user={user} />;
      case 'links':
        return <LinkManager user={user} />;
      case 'scheduler':
        return <Scheduler user={user} setActiveTab={setActiveTab} />;
      case 'analytics':
        return <Analytics user={user} />;
      case 'pins':
        return <PinManager user={user} />;
      case 'utility':
        return <UtilityPages />;
      case 'work':
        return <WorkWithUs />;
      case 'settings':
        return <Settings user={user} />;
      default:
        return <Dashboard setActiveTab={setActiveTab} user={user} />;
    }
  };

  return (
    <ErrorBoundary>
      <div className="flex min-h-screen bg-main-bg text-text-primary font-sans selection:bg-accent-primary selection:text-white transition-colors duration-200 overflow-x-hidden scrollbar-hide">
        {/* Mobile Header */}
        <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-sidebar-bg border-b border-border-primary z-40 flex items-center justify-between px-6 scrollbar-hide">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-accent-primary rounded-lg flex items-center justify-center">
              <Pin className="text-white" size={18} />
            </div>
            <span className="font-bold text-lg">PinViral AI</span>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 text-text-secondary hover:text-text-primary"
          >
            {isSidebarOpen ? (
              <div className="w-6 h-6 flex items-center justify-center">✕</div>
            ) : (
              <div className="space-y-1.5">
                <div className="w-6 h-0.5 bg-current"></div>
                <div className="w-6 h-0.5 bg-current"></div>
                <div className="w-6 h-0.5 bg-current"></div>
              </div>
            )}
          </button>
        </div>

        {/* Sidebar Overlay for Mobile */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
          )}
        </AnimatePresence>

        <div className={`
          fixed lg:static inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out scrollbar-hide
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <Sidebar 
            activeTab={activeTab} 
            setActiveTab={(tab) => {
              setActiveTab(tab);
              setIsSidebarOpen(false);
            }} 
            user={user} 
          />
        </div>
        
        <main className="flex-1 p-6 lg:p-12 pt-24 lg:pt-12 overflow-y-auto overflow-x-hidden max-h-screen scrollbar-hide">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </ErrorBoundary>
  );
}
