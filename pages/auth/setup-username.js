import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import { updateProfile, deleteUser, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import Navbar from '../../components/navbar';
import MessageAlert from '../../components/MessageAlert';
import PrimaryButton from '../../components/PrimaryButton';
import SecondaryButton from '../../components/SecondaryButton';

export default function SetupUsername() {
  const { user } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [usernameAvailability, setUsernameAvailability] = useState(null); // null = not checked, true = available, false = taken
  const [isNewGoogleUser, setIsNewGoogleUser] = useState(false);
  const isCompletedRef = useRef(false); // Track if username was successfully set
  const { redirect } = router.query;

  // Check if user is a new Google user and needs to complete setup
  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    const checkUserStatus = async () => {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      // Check if user is a Google user without password
      const providers = user.providerData || [];
      const hasPassword = providers.some(provider => provider.providerId === 'password');
      const hasGoogle = providers.some(provider => provider.providerId === 'google.com');
      const isGoogleOnly = hasGoogle && !hasPassword;

      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        // Check if user already has a valid username
        if (userData.username && /^[a-z0-9]+$/.test(userData.username)) {
          // User already has a valid username, redirect
          if (redirect === 'new') {
            router.push('/new');
          } else {
            router.push('/');
          }
          return;
        }
        
        // If new Google user (needsUsernameSetup is true) or no username exists, mark as new
        if ((userData.needsUsernameSetup || !userData.username) && isGoogleOnly) {
          setIsNewGoogleUser(true);
        }
      } else if (isGoogleOnly) {
        // User document doesn't exist but they're a Google user - new user
        setIsNewGoogleUser(true);
      }
    };
    
    checkUserStatus();
  }, [user, router, redirect]);

  // Cleanup function to delete account if new Google user leaves without completing
  const cleanupIncompleteAccount = useCallback(async () => {
    if (!user || !isNewGoogleUser || isCompletedRef.current) return;

    try {
      // Delete Firestore user document
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        // Only delete if they still don't have a valid username
        if (!userData.username || !/^[a-z0-9]+$/.test(userData.username)) {
          await deleteDoc(doc(db, 'users', user.uid));
        }
      }

      // Delete username mapping if exists
      if (user.displayName) {
        try {
          await deleteDoc(doc(db, 'usernames', user.displayName));
        } catch (error) {
          // Ignore if doesn't exist
        }
      }

      // Delete Firebase Auth account
      await deleteUser(user);
      
      // Sign out
      await signOut(auth);
    } catch (error) {
      console.error('Error cleaning up incomplete account:', error);
    }
  }, [user, isNewGoogleUser]);

  // Handle page unload/close (note: async cleanup may not complete due to browser limitations)
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isNewGoogleUser && !isCompletedRef.current) {
        // Note: Async operations in beforeunload are unreliable
        // This is best-effort cleanup
        cleanupIncompleteAccount();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isNewGoogleUser, cleanupIncompleteAccount]);

  // Cleanup on component unmount (navigation away)
  useEffect(() => {
    return () => {
      if (isNewGoogleUser && !isCompletedRef.current) {
        // Async cleanup on unmount - may not complete if navigation is fast
        cleanupIncompleteAccount();
      }
    };
  }, [isNewGoogleUser, cleanupIncompleteAccount]);

  const checkUsernameExists = useCallback(async (username) => {
    if (!username) return false;
    const usernameDoc = await getDoc(doc(db, 'usernames', username));
    return usernameDoc.exists();
  }, []);

  // Real-time validation check
  useEffect(() => {
    const validateUsername = async () => {
      // Clear previous state
      setUsernameAvailability(null);
      setError('');

      if (!username) {
        return;
      }

      // Basic validation checks
      if (username.length < 3 || username.length > 20) {
        return;
      }

      if (!/^[a-z0-9]+$/.test(username)) {
        return;
      }

      // Check if username exists
      setIsChecking(true);
      const exists = await checkUsernameExists(username);
      setIsChecking(false);
      setUsernameAvailability(!exists);
      if (exists) {
        setError('Username is already taken');
      }
    };

    // Debounce the check
    const timeoutId = setTimeout(() => {
      validateUsername();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [username, checkUsernameExists]);

  const handleUsernameSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username) {
      setError('Username cannot be empty');
      return;
    }

    if (username.length < 3 || username.length > 20) {
      setError('Username must be between 3 and 20 characters');
      return;
    }

    if (!/^[a-z0-9]+$/.test(username)) {
      setError('Username can only contain lowercase letters and numbers');
      return;
    }

    // Double-check username availability before submitting
    const usernameExists = await checkUsernameExists(username);
    if (usernameExists) {
      setError('Username is already taken');
      setUsernameAvailability(false);
      return;
    }

    // Prevent double submission
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Get existing user data to check for old username
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      let oldUsername = null;
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        oldUsername = userData.username;
      }
      
      // If user has displayName that's invalid, treat it as old username
      if (user.displayName && !/^[a-z0-9]+$/.test(user.displayName)) {
        oldUsername = user.displayName;
      }

      // Update Firebase Auth profile
      await updateProfile(user, { displayName: username });
      
      // Create or update Firestore user document
      await setDoc(doc(db, 'users', user.uid), {
        username: username,
        email: user.email,
        createdAt: userDoc.exists() ? userDoc.data().createdAt : new Date(),
        needsUsernameSetup: false
      }, { merge: true });

      // Remove old username mapping if it exists and is different
      if (oldUsername && oldUsername !== username) {
        try {
          await deleteDoc(doc(db, 'usernames', oldUsername));
        } catch (error) {
          // Ignore errors if old username doc doesn't exist
          console.log('No old username mapping to delete');
        }
      }

      // Create new username mapping
      await setDoc(doc(db, 'usernames', username), {
        userId: user.uid
      });

      // Mark as completed to prevent cleanup
      isCompletedRef.current = true;

      // Redirect based on the redirect parameter
      if (redirect === 'new') {
        router.push('/new');
      } else {
        router.push('/');
      }
    } catch (error) {
      console.error('Error setting username:', error);
      setError(error.message);
      setIsSubmitting(false);
    }
  };

  // Handle cancel/discard
  const handleCancel = async () => {
    if (isNewGoogleUser) {
      // Delete the account and redirect to login
      await cleanupIncompleteAccount();
      router.push('/login');
    } else {
      // For existing users, just go back
      router.back();
    }
  };

  // Check if username is valid and available
  const isUsernameValid = () => {
    if (!username) return false;
    if (username.length < 3 || username.length > 20) return false;
    if (!/^[a-z0-9]+$/.test(username)) return false;
    return usernameAvailability === true;
  };

  if (!user) return null;

  return (
    <>
      <Navbar />
      <main className="max-w-md mx-auto p-4">
        <div className="bg-white rounded-xl p-6"
          style={{
            borderWidth: '3px',
            borderStyle: 'solid',
            borderColor: 'black'
          }}
        >
          <h1 className="text-4xl font-bold mb-3 font-rouge-script" style={{ color: 'var(--blue-custom)' }}>Choose Your Username</h1>
          <MessageAlert type="error" message={error} className="mb-4 mt-6" />
          <p className="text-lg mb-6 font-baloo2 text-gray-700">
            Pick a username that represents you. It must be 3-20 characters and can only contain lowercase letters and numbers.
          </p>
          <form onSubmit={handleUsernameSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-lg font-medium text-gray-700 mb-2 font-baloo2">
                Username
              </label>
              <input
                type="text"
                id="username"
                name="username"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                className="block w-full rounded-full border-2 border-gray-300 shadow-sm text-lg h-14 px-6 font-baloo2 focus:outline-none"
                style={{ borderColor: '#D1D5DB' }}
                minLength={3}
                maxLength={20}
                pattern="[a-z0-9]+"
                title="Username can only contain lowercase letters and numbers"
                placeholder="Enter your username"
              />
            </div>
            <div className="flex flex-col gap-3">
              <PrimaryButton
                type="submit"
                className="w-full"
                disabled={!isUsernameValid() || isSubmitting || isChecking}
              >
                {isSubmitting ? 'Creating...' : 'Continue'}
              </PrimaryButton>
              <SecondaryButton
                type="button"
                onClick={handleCancel}
                className="w-full"
              >
                Cancel
              </SecondaryButton>
            </div>
          </form>
        </div>
      </main>
    </>
  );
}

