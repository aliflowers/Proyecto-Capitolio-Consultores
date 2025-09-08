'use client';

import { useState, useEffect } from 'react';
import { User } from '@/lib/server-auth';

export function useCurrentUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          setUser(null);
        }
      } catch (error) {
        setUser(null);
        console.error('Failed to fetch current user:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, []);

  return user;
}
