import React, { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';

const AuthContext = createContext(null);

const getApiUrl = () => {
  const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  return rawApiUrl.endsWith('/') ? rawApiUrl.slice(0, -1) : rawApiUrl;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('crm_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('crm_token') || null;
  });

  const [loading, setLoading] = useState(true);

  // Always holds the latest token, so authFetch can stay a stable function
  const tokenRef = useRef(token);
  tokenRef.current = token;

  useEffect(() => {
    const verifySession = async () => {
      if (!token) {
        localStorage.removeItem('crm_token');
        localStorage.removeItem('crm_user');
        setUser(null);
        setLoading(false);
        return;
      }

      const apiUrl = getApiUrl();
      try {
        const response = await fetch(`${apiUrl}/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          const freshUser = {
            id: data._id,
            name: data.name,
            username: data.username,
            role: data.role,
            team: data.team
          };
          setUser(freshUser);
          localStorage.setItem('crm_token', token);
          localStorage.setItem('crm_user', JSON.stringify(freshUser));
        } else {
          setUser(null);
          setToken(null);
          localStorage.removeItem('crm_token');
          localStorage.removeItem('crm_user');
        }
      } catch (err) {
        console.error('Failed to verify session:', err);
        const savedUser = localStorage.getItem('crm_user');
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        } else {
          setUser(null);
          setToken(null);
          localStorage.removeItem('crm_token');
          localStorage.removeItem('crm_user');
        }
      } finally {
        setLoading(false);
      }
    };

    verifySession();
  }, [token]);

  const login = async (username, password, role) => {
    const apiUrl = getApiUrl();
    try {
      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password, role })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      setToken(data.token);
      setUser({
        id: data._id,
        name: data.name,
        username: data.username,
        role: data.role,
        team: data.team
      });

      return { success: true, user: data };
    } catch (error) {
      console.error('Login request error:', error.message);
      return { success: false, error: error.message };
    }
  };

  const logout = useCallback(() => {
    // Clear the ref immediately so any request fired during the sign-out
    // animation sees "signed out" instead of sending a dead token
    tokenRef.current = null;
    setUser(null);
    setToken(null);
    localStorage.removeItem('crm_token');
    localStorage.removeItem('crm_user');
  }, []);

  // Stable function (never changes identity), so components that list it in
  // their effect dependencies don't re-fetch every time auth state changes.
  const authFetch = useCallback(async (url, options = {}) => {
    const currentToken = tokenRef.current;

    // Signed out (e.g. a poll firing while the portal animates away):
    // skip the network call, so no 401 error appears in the console.
    if (!currentToken) {
      return new Response(JSON.stringify({ message: 'Not signed in' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
      'Authorization': `Bearer ${currentToken}`
    };

    const res = await fetch(`${getApiUrl()}${url}`, {
      ...options,
      headers
    });

    if (res.status === 401 && tokenRef.current === currentToken) {
      // Token expired/invalid → sign out (ignore stale responses from an older session)
      logout();
    }

    return res;
  }, [logout]);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, authFetch, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};