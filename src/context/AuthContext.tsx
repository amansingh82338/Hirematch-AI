import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Organization } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  organization: Organization | null;
  isAuthenticated: boolean;
  availableUsers: User[];
  organizations: Organization[];
  isGeminiConfigured: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, organizationName?: string) => Promise<void>;
  logout: () => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<{ success: boolean; message?: string }>;
  updateProfile: (updates: { name?: string; title?: string; department?: string; avatar?: string }) => Promise<void>;
  switchUser: (userId?: string, organizationId?: string) => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  organization: null,
  isAuthenticated: false,
  availableUsers: [],
  organizations: [],
  isGeminiConfigured: false,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  changePassword: async () => ({ success: false }),
  updateProfile: async () => {},
  switchUser: async () => {},
  refreshAuth: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isGeminiConfigured, setIsGeminiConfigured] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchAuth = useCallback(async () => {
    try {
      const data = await api.getAuth();
      if (data && data.user) {
        setUser(data.user);
        setOrganization(data.organization);
        setAvailableUsers(data.availableUsers || []);
        setOrganizations(data.organizations || []);
        setIsGeminiConfigured(Boolean(data.isGeminiConfigured));
      } else {
        setUser(null);
        setOrganization(null);
      }
    } catch (e) {
      console.error('Failed to load auth session:', e);
      setUser(null);
      setOrganization(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAuth();
  }, [fetchAuth]);

  const handleLogin = async (email: string, password: string) => {
    const res = await api.login(email, password);
    setUser(res.user);
    setOrganization(res.organization);
    await fetchAuth();
  };

  const handleRegister = async (name: string, email: string, password: string, organizationName?: string) => {
    const res = await api.register(name, email, password, organizationName);
    setUser(res.user);
    setOrganization(res.organization);
    await fetchAuth();
  };

  const handleLogout = async () => {
    await api.logout();
    setUser(null);
    setOrganization(null);
    await fetchAuth();
  };

  const handleChangePassword = async (oldPass: string, newPass: string) => {
    return api.changePassword(oldPass, newPass);
  };

  const handleUpdateProfile = async (updates: { name?: string; title?: string; department?: string; avatar?: string }) => {
    const res = await api.updateProfile(updates);
    if (res.user) {
      setUser(res.user);
    }
  };

  const handleSwitchUser = async (userId?: string, organizationId?: string) => {
    try {
      const result = await api.switchUser(userId, organizationId);
      if (result.success) {
        setUser(result.user);
        await fetchAuth();
      }
    } catch (e) {
      console.error('Failed to switch user:', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        organization,
        isAuthenticated: Boolean(user),
        availableUsers,
        organizations,
        isGeminiConfigured,
        loading,
        login: handleLogin,
        register: handleRegister,
        logout: handleLogout,
        changePassword: handleChangePassword,
        updateProfile: handleUpdateProfile,
        switchUser: handleSwitchUser,
        refreshAuth: fetchAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
