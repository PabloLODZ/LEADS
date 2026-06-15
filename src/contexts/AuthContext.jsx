import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [authUser, setAuthUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Admin Simulation States
  const [mockPlanId, setMockPlanId] = useState(null);
  const [isSimulatingUser, setIsSimulatingUser] = useState(false);

  // Fetch profile from database
  const fetchProfile = useCallback(async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Erro ao buscar perfil:', error);
      return null;
    }
    return data;
  }, []);

  // Listen for auth state changes on mount
  useEffect(() => {
    let mounted = true;

    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;

      if (session?.user) {
        setAuthUser(session.user);
        const p = await fetchProfile(session.user.id);
        if (mounted) setProfile(p);
      }
      setIsLoading(false);
    });

    // Listen for auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        if (event === 'SIGNED_IN' && session?.user) {
          setAuthUser(session.user);
          const p = await fetchProfile(session.user.id);
          if (mounted) setProfile(p);
        } else if (event === 'SIGNED_OUT') {
          setAuthUser(null);
          setProfile(null);
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          setAuthUser(session.user);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  // ---- LOGIN ----
  const login = useCallback(async (email, password) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw new Error(
          error.message === 'Invalid login credentials'
            ? 'Email ou senha inválidos'
            : error.message
        );
      }

      const p = await fetchProfile(data.user.id);
      setProfile(p);
      setAuthUser(data.user);
      return p;
    } finally {
      setIsLoading(false);
    }
  }, [fetchProfile]);

  // ---- REGISTER ----
  const register = useCallback(async (name, email, password) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
        },
      });

      if (error) {
        if (error.message.includes('already registered') || error.message.includes('already exists')) {
          throw new Error('Email já cadastrado');
        }
        throw new Error(error.message);
      }

      if (!data.user) {
        throw new Error('Erro ao criar conta. Tente novamente.');
      }

      // Disparar envio do e-mail de boas-vindas assincronamente (sem bloquear o fluxo)
      fetch('/api/send-welcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
      }).catch(err => console.error('Erro ao enviar email de boas vindas:', err));

      // Profile is auto-created by the database trigger (handle_new_user)
      // Wait a moment for the trigger to execute, then fetch
      await new Promise(r => setTimeout(r, 500));
      const p = await fetchProfile(data.user.id);
      setProfile(p);
      setAuthUser(data.user);
      return p;
    } finally {
      setIsLoading(false);
    }
  }, [fetchProfile]);

  // ---- LOGOUT ----
  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setAuthUser(null);
    setProfile(null);
  }, []);

  // ---- UPDATE PROFILE ----
  const updateUser = useCallback(async (updates) => {
    if (!authUser) return;

    // Map camelCase keys to snake_case for the database
    const dbUpdates = {};
    const keyMap = {
      name: 'name',
      avatarUrl: 'avatar_url',
      role: 'role',
      planId: 'plan_id',
      subscriptionStatus: 'subscription_status',
      stripeCustomerId: 'stripe_customer_id',
      whatsappPhone: 'whatsapp_phone',
      whatsappRemindersEnabled: 'whatsapp_reminders_enabled',
      onboardingCompleted: 'onboarding_completed',
    };

    // Handle credit wallet updates
    if (updates.creditWallet) {
      dbUpdates.base_credits = updates.creditWallet.baseCredits;
      dbUpdates.purchased_credits = updates.creditWallet.purchasedCredits;
    }

    // Map other keys
    for (const [camel, snake] of Object.entries(keyMap)) {
      if (camel in updates) {
        dbUpdates[snake] = updates[camel];
      }
    }

    // Also accept snake_case keys directly
    for (const key of Object.keys(updates)) {
      if (key.includes('_') && !(key === 'creditWallet')) {
        dbUpdates[key] = updates[key];
      }
    }

    dbUpdates.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from('profiles')
      .update(dbUpdates)
      .eq('id', authUser.id);

    if (error) {
      console.error('Erro ao atualizar perfil:', error);
      return;
    }

    // Update local state
    setProfile(prev => prev ? { ...prev, ...dbUpdates } : prev);
  }, [authUser]);

  // ---- RESET PASSWORD ----
  const resetPassword = useCallback(async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });

    if (error) {
      throw new Error('Erro ao enviar email de recuperação. Tente novamente.');
    }
  }, []);

  // Build user object that matches the interface the rest of the app expects
  const user = profile ? {
    id: profile.id,
    name: profile.name,
    email: authUser?.email || '',
    avatarUrl: profile.avatar_url,
    role: profile.role,
    planId: mockPlanId || profile.plan_id,
    realPlanId: profile.plan_id,
    subscriptionStatus: profile.subscription_status,
    stripeCustomerId: profile.stripe_customer_id,
    whatsappPhone: profile.whatsapp_phone || '',
    whatsappRemindersEnabled: profile.whatsapp_reminders_enabled || false,
    onboardingCompleted: profile.onboarding_completed || false,
    creditWallet: {
      baseCredits: profile.base_credits || 0,
      purchasedCredits: profile.purchased_credits || 0,
    },
    createdAt: profile.created_at,
    updatedAt: profile.updated_at,
  } : null;

  const isAdmin = profile?.role === 'admin' && !isSimulatingUser;
  const isRealAdmin = profile?.role === 'admin';
  const isAuthenticated = !!authUser && !!profile;

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAuthenticated,
      isAdmin,
      isRealAdmin,
      mockPlanId,
      setMockPlanId,
      isSimulatingUser,
      setIsSimulatingUser,
      login,
      register,
      logout,
      updateUser,
      resetPassword,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
