'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export interface User {
  id: string;
  db_id?: string;
  name: string;
  email: string;
  avatar: string;
}

export interface AttendanceLog {
  id: string;
  date: string;
  checkIn: string;
  checkOut: string;
  hours: string;
  status: 'On Time' | 'Late' | 'Absent' | 'Overtime';
  location: string;
  checkInISO?: string;
  checkOutISO?: string;
}

export interface CurrentSession {
  id?: string;
  checkInTime: string;
  zone: string;
  verified: boolean;
}

interface AppContextType {
  user: User | null;
  currentSession: CurrentSession | null;
  logs: AttendanceLog[];
  loading: boolean;
  login: (email: string, password?: string) => Promise<boolean>;
  logout: () => void;
  register: (name: string, email: string, password?: string) => Promise<boolean>;
  checkIn: () => Promise<boolean>;
  checkOut: () => Promise<boolean>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function processLog(rawLog: any): AttendanceLog {
  const checkInISO = rawLog.checkInISO;
  const checkOutISO = rawLog.checkOutISO;
  
  if (!checkInISO || !checkOutISO) {
    return rawLog as AttendanceLog;
  }

  const checkInDate = new Date(checkInISO);
  const checkOutDate = new Date(checkOutISO);
  
  const diffMs = checkOutDate.getTime() - checkInDate.getTime();
  const totalMins = Math.floor(diffMs / 60000);
  
  const realHrs = Math.floor(totalMins / 60);
  const realMins = totalMins % 60;
  const hoursStr = `${realHrs}h ${realMins}m`;

  const options: Intl.DateTimeFormatOptions = { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', hour12: false };
  const timeStr = checkInDate.toLocaleTimeString('en-US', options); 
  const [hour, minute] = timeStr.split(':').map(Number);
  
  let status: 'On Time' | 'Late' | 'Overtime' | 'Absent' = 'On Time';
  if (hour > 8 || (hour === 8 && minute > 11)) {
    status = 'Late';
  } else if (totalMins >= 540) {
    status = 'Overtime';
  }

  return {
    ...rawLog,
    hours: hoursStr,
    status
  };
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [currentSession, setCurrentSession] = useState<CurrentSession | null>(null);
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedSession = localStorage.getItem('att_session');
      if (savedSession) {
        try {
          setCurrentSession(JSON.parse(savedSession));
        } catch (e) {
          console.error('Failed to parse saved session', e);
        }
      }
    }

    fetch('/api/auth/me')
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Not authenticated');
      })
      .then(data => {
        if (data.user) {
          setUser(data.user);

          fetch(`/api/attendance/history`)
            .then(res => res.json())
            .then(historyData => {
              if (historyData.logs) {
                const processedLogs = historyData.logs.map(processLog);
                setLogs(processedLogs);
                localStorage.setItem('att_logs', JSON.stringify(processedLogs));
              }
            })
            .catch(err => console.error('Failed to fetch logs:', err));
        }
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });


    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch((err) => {
          console.error('ServiceWorker registration failed: ', err);
        });
      });
    }
  }, []);

  const login = async (email: string, password?: string): Promise<boolean> => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (!res.ok) throw new Error('Login failed');
      const data = await res.json();

      setUser(data.user);


      if (data.user) {
        const historyRes = await fetch(`/api/attendance/history`);
        if (historyRes.ok) {
          const historyData = await historyRes.json();
          if (historyData.logs) {
            const processedLogs = historyData.logs.map(processLog);
            setLogs(processedLogs);
            localStorage.setItem('att_logs', JSON.stringify(processedLogs));
          }
        }
      }

      setLoading(false);
      return true;
    } catch (e) {
      console.error(e);
      setLoading(false);
      return false;
    }
  };

  const register = async (name: string, email: string, password?: string): Promise<boolean> => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      if (!res.ok) throw new Error('Registration failed');
      const data = await res.json();

      setUser(data.user);
      setLoading(false);
      return true;
    } catch (e) {
      console.error(e);
      setLoading(false);
      return false;
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error('Failed to call logout API', e);
    }
    setUser(null);
    setCurrentSession(null);
    localStorage.removeItem('att_session');

  };

  const getCurrentLocation = (): Promise<{ latitude: number; longitude: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser.'));
      } else {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            });
          },
          (error) => {
            console.error('Geolocation error:', error);
            reject(new Error('Unable to retrieve your real-time location.'));
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      }
    });
  };

  const checkIn = async (): Promise<boolean> => {
    if (!user || !user.db_id) return false;
    try {
      const coords = await getCurrentLocation();

      const res = await fetch('/api/attendance/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(coords)
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Check-in failed');
      }
      const data = await res.json();

      setCurrentSession(data.session);
      localStorage.setItem('att_session', JSON.stringify(data.session));
      toast.success('Berhasil absen masuk!');
      return true;
    } catch (e: any) {
      console.error(e);
      toast.error(e.message);
      return false;
    }
  };

  const checkOut = async (): Promise<boolean> => {
    if (!currentSession || !currentSession.id) return false;
    try {
      const coords = await getCurrentLocation();

      const res = await fetch('/api/attendance/check-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          logId: currentSession.id,
          ...coords
        })
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Check-out failed');
      }
      const data = await res.json();

      const processedLog = processLog(data.log);
      const updatedLogs = [processedLog, ...logs];
      setLogs(updatedLogs);
      localStorage.setItem('att_logs', JSON.stringify(updatedLogs));

      setCurrentSession(null);
      localStorage.removeItem('att_session');
      toast.success('Berhasil absen keluar!');
      return true;
    } catch (e: any) {
      console.error(e);
      toast.error(e.message);
      return false;
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        currentSession,
        logs,
        loading,
        login,
        logout,
        register,
        checkIn,
        checkOut,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
