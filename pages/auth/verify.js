import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, fetchSignInMethodsForEmail } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import Navbar from '../../components/navbar';
import MessageAlert from '../../components/MessageAlert';
import PrimaryButton from '../../components/PrimaryButton';
import SecondaryButton from '../../components/SecondaryButton';

export default function Verify() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [usernameAvailability, setUsernameAvailability] = useState(null); // null = not checked, true = available, false = taken
  const router = useRouter();
  const { email, isNewUser: isNewUserParam, redirect } = router.query;
  const [isNewUser, setIsNewUser] = useState(isNewUserParam === 'true');

  useEffect(() => {
    if (!email) {
      console.log('No email provided, redirecting to login');
      router.push('/login');
      return;
    }

    // Update isNewUser if the URL parameter changes
    setIsNewUser(isNewUserParam === 'true');
  }, [email, isNewUserParam, router]);

  const checkUsernameExists = useCallback(async (username) => {
    if (!username) return false;
    const usernameDoc = await getDoc(doc(db, 'usernames', username));
    return usernameDoc.exists();
  }, []);

  // Real-time validation check
  useEffect(() => {
    if (!isNewUser) return; // Only validate for new users

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
  }, [username, isNewUser, checkUsernameExists]);

  const generateRandomUsername = () => {
    const randomNum = Math.floor(Math.random() * 10000);
    return `frieslover${randomNum}`;
  };

  // Check if username is valid and available
  const isUsernameValid = () => {
    if (!username) return false;
    if (username.length < 3 || username.length > 20) return false;
    if (!/^[a-z0-9]+$/.test(username)) return false;
    return usernameAvailability === true;
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');

    if (isNewUser) {
      // Sign up flow
      if (!password || !confirmPassword || !username) {
        setError('Please fill in all fields');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters long');
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
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: username });
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          username: username,
          email: email,
          createdAt: new Date()
        });
        await setDoc(doc(db, 'usernames', username), {
          userId: userCredential.user.uid
        });
        // Redirect based on the redirect parameter
        if (redirect === 'new') {
          router.push('/new');
        } else {
          router.push('/');
        }
      } catch (error) {
        setError(error.message);
      }
    } else {
      // Login flow
      try {
        if (!password) {
          setError('Please enter your password');
          return;
        }
        await signInWithEmailAndPassword(auth, email, password);
        // Redirect based on the redirect parameter
        if (redirect === 'new') {
          router.push('/new');
        } else {
          router.push('/');
        }
      } catch (error) {
        setError(error.message);
      }
    }
  };

  if (!email) return null;

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
          <h1 className="text-4xl font-bold mb-3 font-rouge-script" style={{ color: 'var(--blue-custom)' }}>
            {isNewUser ? 'Create your account' : 'Welcome back'}
          </h1>
          <MessageAlert type="error" message={error} className="mb-4 mt-6" />
          <form onSubmit={handleAuth} className="space-y-6" noValidate>
          {isNewUser ? (
            <>
              <div>
                <label htmlFor="username" className="block text-lg font-medium text-gray-700 mb-2 font-baloo2">
                  Choose a username
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
                <p className="mt-2 text-sm text-gray-600 font-baloo2">
                  Username must be 3-20 characters and can only contain lowercase letters and numbers.
                </p>
              </div>
              <div>
                <label htmlFor="new-password" className="block text-lg font-medium text-gray-700 mb-2 font-baloo2">
                  Set up your password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="new-password"
                    name="new-password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full rounded-full border-2 border-gray-300 shadow-sm text-lg h-14 px-6 pr-14 font-baloo2 focus:outline-none"
                    style={{ borderColor: '#D1D5DB' }}
                    placeholder="••••••••"
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-500">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-500">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="confirm-password" className="block text-lg font-medium text-gray-700 mb-2 font-baloo2">
                  Confirm your password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirm-password"
                    name="confirm-password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full rounded-full border-2 border-gray-300 shadow-sm text-lg h-14 px-6 pr-14 font-baloo2 focus:outline-none"
                    style={{ borderColor: '#D1D5DB' }}
                    placeholder="••••••••"
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    {showConfirmPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-500">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-500">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-3 mt-6">
                <PrimaryButton
                  type="submit"
                  className="w-full"
                  disabled={!isUsernameValid() || isChecking}
                >
                  Create Account
                </PrimaryButton>
                <SecondaryButton
                  type="button"
                  onClick={() => router.push('/login')}
                  className="w-full"
                >
                  Cancel
                </SecondaryButton>
              </div>
            </>
          ) : (
            <>
              <div>
                <label htmlFor="current-password" className="block text-lg font-medium text-gray-700 mb-2 font-baloo2">
                  Enter your password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="current-password"
                    name="current-password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full rounded-full border-2 border-gray-300 shadow-sm text-lg h-14 px-6 pr-14 font-baloo2 focus:outline-none"
                    style={{ borderColor: '#D1D5DB' }}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-500">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-500">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </div>
                <div className="mt-3 text-left">
                  <button
                    type="button"
                    onClick={() => router.push({
                      pathname: '/auth/reset-password',
                      query: { email }
                    })}
                    className="text-sm font-baloo2 hover:underline"
                    style={{ color: 'var(--red-custom)' }}
                  >
                    Forgot password?
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-3 mt-6">
                <PrimaryButton
                  type="submit"
                  className="w-full"
                >
                  Continue
                </PrimaryButton>
                <SecondaryButton
                  type="button"
                  onClick={() => router.push('/login')}
                  className="w-full"
                >
                  Cancel
                </SecondaryButton>
              </div>
            </>
          )}
        </form>
        </div>
      </main>
    </>
  );
} 