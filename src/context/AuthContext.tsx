import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  role: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
  loginAttempts: number;
  sessionTimeout: number | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [sessionTimeout, setSessionTimeout] = useState<number | null>(null);

  useEffect(() => {
    if (sessionTimeout) {
      const timeLeft = sessionTimeout - Date.now();
      if (timeLeft > 0) {
        const timer = setTimeout(() => {
          setIsAuthenticated(false);
          setSessionTimeout(null);
        }, timeLeft);
        return () => clearTimeout(timer);
      }
    }
  }, [sessionTimeout]);

  const login = async (password: string): Promise<boolean> => {
    if (loginAttempts >= 3) {
      return false;
    }

    if (password === 'InspectorVehicular2024!') {
      setIsAuthenticated(true);
      setSessionTimeout(Date.now() + 8 * 60 * 60 * 1000); // 8 hours
      return true;
    }

    setLoginAttempts(prev => prev + 1);
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setSessionTimeout(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, loginAttempts, sessionTimeout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;