import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { MOCK_USERS } from '../data/mockData.js';

const AuthContext = createContext(null);

const STORAGE_KEY = 'lodz_auth';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Re-hydrate from mock users to get latest data
        const freshUser = MOCK_USERS.find(u => u.id === parsed.id);
        return freshUser || parsed;
      }
    } catch (e) { /* ignore */ }
    return null;
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [user]);

  const login = useCallback(async (email, password) => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(r => setTimeout(r, 800));

    const found = MOCK_USERS.find(u => u.email === email && u.passwordHash === password);
    if (!found) {
      setIsLoading(false);
      throw new Error('Email ou senha inválidos');
    }

    setUser(found);
    setIsLoading(false);
    return found;
  }, []);

  const register = useCallback(async (name, email, password) => {
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 800));

    const exists = MOCK_USERS.find(u => u.email === email);
    if (exists) {
      setIsLoading(false);
      throw new Error('Email já cadastrado');
    }

    const newUser = {
      id: 'usr_' + Date.now(),
      name,
      email,
      passwordHash: password,
      avatarUrl: null,
      role: 'trial',
      planId: 'starter',
      subscriptionStatus: 'trial',
      stripeCustomerId: null,
      whatsappPhone: '',
      whatsappRemindersEnabled: false,
      onboardingCompleted: false,
      creditWallet: { baseCredits: 50, purchasedCredits: 0 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    MOCK_USERS.push(newUser);
    setUser(newUser);
    setIsLoading(false);
    return newUser;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const updateUser = useCallback((updates) => {
    setUser(prev => {
      const updated = { ...prev, ...updates, updatedAt: new Date().toISOString() };
      // Also update in MOCK_USERS
      const idx = MOCK_USERS.findIndex(u => u.id === prev.id);
      if (idx !== -1) MOCK_USERS[idx] = updated;
      return updated;
    });
  }, []);

  const isAdmin = user?.role === 'admin';
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAuthenticated,
      isAdmin,
      login,
      register,
      logout,
      updateUser,
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
