import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApiService, UserProfile } from '../services/authApiService';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadAuth() {
      try {
        const savedToken = await authApiService.initToken();
        if (savedToken) {
          setToken(savedToken);
          const userRes = await authApiService.getCurrentUser();
          if (userRes.success && userRes.data) {
            setUser(userRes.data);
          } else {
            authApiService.setToken(null);
            setToken(null);
          }
        }
      } catch {
        // Fallback unauthenticated
      } finally {
        setIsLoading(false);
      }
    }
    loadAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await authApiService.login(email, password);
      if (res.success && res.data) {
        setUser(res.data.user);
        setToken(res.data.token);
        return { success: true };
      }
      return { success: false, error: res.error || 'Login failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, displayName: string) => {
    setIsLoading(true);
    try {
      const res = await authApiService.register(email, password, displayName);
      if (res.success && res.data) {
        setUser(res.data.user);
        setToken(res.data.token);
        return { success: true };
      }
      return { success: false, error: res.error || 'Registration failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    authApiService.setToken(null);
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
