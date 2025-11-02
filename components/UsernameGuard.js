import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function UsernameGuard({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Don't check on auth pages or if no user or still loading
    if (loading) {
      setIsChecking(false);
      return;
    }
    
    if (!user) {
      setIsChecking(false);
      return;
    }
    
    const currentPath = router.pathname;
    const authPages = ['/login', '/auth/verify', '/auth/reset-password', '/auth/setup-username'];
    
    // Skip check if on auth pages
    if (authPages.includes(currentPath)) {
      setIsChecking(false);
      return;
    }

    const protectedPaths = ['/profile', '/new', '/my-posts'];
    const isProtectedPath = protectedPaths.some(path => currentPath.startsWith(path));

    const checkUsername = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          // Check if user has a valid username
          const hasValidUsername = userData.username && /^[a-z0-9]+$/.test(userData.username);
          
          if (!hasValidUsername && isProtectedPath) {
            // Redirect to setup page for protected routes if username is invalid
            router.push({
              pathname: '/auth/setup-username',
              query: router.query.redirect ? { redirect: router.query.redirect } : {}
            });
          }
        } else if (isProtectedPath) {
          // User document doesn't exist - redirect to setup
          router.push({
            pathname: '/auth/setup-username',
            query: router.query.redirect ? { redirect: router.query.redirect } : {}
          });
        }
      } catch (error) {
        console.error('Error checking username:', error);
      } finally {
        setIsChecking(false);
      }
    };

    checkUsername();
  }, [user, loading, router]);

  // Don't render children until check is complete to avoid flicker
  if (isChecking && user) {
    return null;
  }

  return children;
}

