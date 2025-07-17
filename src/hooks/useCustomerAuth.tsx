import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  default_address?: string;
  preferences?: any;
  created_at: string;
  updated_at: string;
}

interface CustomerAuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, profileData: { fullName: string; phone?: string; address?: string }) => Promise<{ success: boolean; error?: string }>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>;
  isAuthenticated: boolean;
}

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(undefined);

export const useCustomerAuth = () => {
  const context = useContext(CustomerAuthContext);
  if (!context) {
    throw new Error('useCustomerAuth must be used within a CustomerAuthProvider');
  }
  return context;
};

export const CustomerAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Load user profile - OPTIMIZED with better error handling
  const loadUserProfile = useCallback(async (userId: string) => {
    try {
      console.log('🔐 [Auth] Loading user profile for:', userId);

      // Reduced timeout to prevent blocking
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Profile loading timeout')), 3000)
      );

      const profilePromise = supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      const { data, error } = await Promise.race([profilePromise, timeoutPromise]) as any;

      if (error) {
        // Check if it's a missing table error
        if (error.message?.includes('relation "user_profiles" does not exist')) {
          console.warn('🔐 [Auth] user_profiles table does not exist - creating profile in memory');
          // Return a basic profile structure
          return {
            id: userId,
            email: '',
            full_name: '',
            phone: '',
            default_address: '',
            preferences: {},
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
        }

        console.warn('🔐 [Auth] Profile loading failed, continuing without profile:', error);
        return null;
      }

      console.log('✅ [Auth] User profile loaded successfully');
      return data;
    } catch (error) {
      console.warn('🔐 [Auth] Profile loading exception, continuing without profile:', error);
      return null;
    }
  }, []);

  // Initialize auth state - OPTIMIZED to not block app loading
  useEffect(() => {
    const initializeAuth = async () => {
      console.log('🔐 [AUTH-INIT] Starting OPTIMIZED authentication initialization...');
      const startTime = Date.now();

      try {
        // Set loading to false immediately to not block app
        setLoading(false);

        console.log('🔐 [AUTH-INIT] Calling supabase.auth.getSession()...');

        // Get initial session with timeout
        const sessionPromise = supabase.auth.getSession();
        const sessionTimeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Session timeout')), 5000)
        );

        const { data: { session: initialSession }, error } = await Promise.race([
          sessionPromise,
          sessionTimeout
        ]) as any;

        const sessionTime = Date.now() - startTime;
        console.log(`🔐 [AUTH-INIT] getSession() completed in ${sessionTime}ms`);

        if (error) {
          console.error('🔐 [AUTH-INIT] Error getting session:', error);
          // Continue without auth - don't block app
        } else if (initialSession) {
          console.log('🔐 [AUTH-INIT] Initial session found, user:', initialSession.user?.email);
          setSession(initialSession);
          setUser(initialSession.user);

          // Load user profile in background - don't block app
          console.log('🔐 [AUTH-INIT] Loading user profile in background...');
          loadUserProfile(initialSession.user.id).then(userProfile => {
            const profileTime = Date.now() - startTime;
            console.log(`🔐 [AUTH-INIT] Profile loaded in ${profileTime}ms:`, userProfile ? 'SUCCESS' : 'FAILED');
            setProfile(userProfile);
          }).catch(error => {
            console.warn('🔐 [AUTH-INIT] Profile loading failed, continuing without profile:', error);
            setProfile(null);
          });
        } else {
          console.log('🔐 [AUTH-INIT] No initial session found');
        }
      } catch (error) {
        console.error('🔐 [AUTH-INIT] Error initializing auth:', error);
        // Don't block app on auth errors
      } finally {
        const totalTime = Date.now() - startTime;
        console.log(`🔐 [AUTH-INIT] Authentication initialization completed in ${totalTime}ms`);
        // Loading already set to false above
      }
    };

    initializeAuth();

    // Listen for auth changes - OPTIMIZED to not block
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`🔐 [AUTH-CHANGE] Event: ${event}, User: ${session?.user?.email || 'none'}`);
      const changeStartTime = Date.now();

      try {
        console.log('🔐 [AUTH-CHANGE] Setting session and user state...');
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          console.log('🔐 [AUTH-CHANGE] User session found, loading profile in background...');

          // Load profile in background - don't block auth state change
          loadUserProfile(session.user.id).then(userProfile => {
            const profileTime = Date.now() - changeStartTime;
            console.log(`🔐 [AUTH-CHANGE] Profile loaded in ${profileTime}ms:`, userProfile ? 'SUCCESS' : 'FAILED');
            setProfile(userProfile);
          }).catch(error => {
            console.warn('🔐 [AUTH-CHANGE] Profile loading failed:', error);
            setProfile(null);
          });
        } else {
          console.log('🔐 [AUTH-CHANGE] No user session, clearing profile');
          setProfile(null);
        }
      } catch (error) {
        console.error('🔐 [AUTH-CHANGE] Error in auth state change:', error);
      } finally {
        const totalTime = Date.now() - changeStartTime;
        console.log(`🔐 [AUTH-CHANGE] Auth state change completed in ${totalTime}ms`);
        // Don't set loading to false here - it's already false from initialization
      }
    });

    return () => subscription.unsubscribe();
  }, [loadUserProfile]); // FIXED: Added loadUserProfile dependency

  // Sign up function
  const signUp = async (email: string, password: string, profileData: { fullName: string; phone?: string; address?: string }) => {
    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: profileData.fullName,
            phone: profileData.phone,
            default_address: profileData.address,
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user && !data.session) {
        // Email confirmation required
        toast({
          title: 'Conferma la tua email',
          description: 'Ti abbiamo inviato un link di conferma. Controlla la tua email.',
        });
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Errore durante la registrazione' };
    } finally {
      setLoading(false);
    }
  };

  // Sign in function
  const signIn = async (email: string, password: string) => {
    console.log(`🔐 [SIGN-IN] Starting sign in for: ${email}`);
    const signInStartTime = Date.now();

    try {
      console.log('🔐 [SIGN-IN] Setting loading to true');
      setLoading(true);

      console.log('🔐 [SIGN-IN] Calling supabase.auth.signInWithPassword...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      const signInTime = Date.now() - signInStartTime;
      console.log(`🔐 [SIGN-IN] signInWithPassword completed in ${signInTime}ms`);

      if (error) {
        console.error('🔐 [SIGN-IN] Sign in error:', error);
        return { success: false, error: error.message };
      }

      console.log('🔐 [SIGN-IN] Sign in successful, user:', data.user?.email);

      toast({
        title: 'Accesso effettuato',
        description: 'Benvenuto!',
      });

      return { success: true };
    } catch (error) {
      console.error('🔐 [SIGN-IN] Sign in exception:', error);
      return { success: false, error: 'Errore durante l\'accesso' };
    } finally {
      const totalTime = Date.now() - signInStartTime;
      console.log(`🔐 [SIGN-IN] Sign in process completed in ${totalTime}ms, setting loading to false`);
      setLoading(false);
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();

      toast({
        title: 'Disconnesso',
        description: 'Sei stato disconnesso con successo.',
      });
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setLoading(false);
    }
  };

  // Update profile function
  const updateProfile = async (updates: Partial<UserProfile>) => {
    try {
      if (!user) {
        return { success: false, error: 'Utente non autenticato' };
      }

      const { error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) {
        return { success: false, error: error.message };
      }

      // Reload profile
      const updatedProfile = await loadUserProfile(user.id);
      setProfile(updatedProfile);

      toast({
        title: 'Profilo aggiornato',
        description: 'Le tue informazioni sono state salvate.',
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Errore durante l\'aggiornamento del profilo' };
    }
  };

  const value: CustomerAuthContextType = {
    user,
    profile,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    isAuthenticated: !!user,
  };

  return (
    <CustomerAuthContext.Provider value={value}>
      {children}
    </CustomerAuthContext.Provider>
  );
};

export default CustomerAuthProvider;
