import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import { EmailAuthProvider, GoogleAuthProvider, reauthenticateWithCredential, reauthenticateWithPopup, deleteUser } from 'firebase/auth';
import { doc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import Navbar from '../../components/navbar';
import MessageAlert from '../../components/MessageAlert';
import PrimaryButton from '../../components/PrimaryButton';
import SecondaryButton from '../../components/SecondaryButton';

export default function DeleteAccount() {
  const { user } = useAuth();
  const router = useRouter();
  const [deleteAccountPassword, setDeleteAccountPassword] = useState('');
  const [error, setError] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [isGoogleUser, setIsGoogleUser] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isReauthenticating, setIsReauthenticating] = useState(false);

  // Check if user is a Google user (no password)
  useEffect(() => {
    if (user) {
      const providers = user.providerData || [];
      const hasPassword = providers.some(provider => provider.providerId === 'password');
      const hasGoogle = providers.some(provider => provider.providerId === 'google.com');
      setIsGoogleUser(hasGoogle && !hasPassword);
    }
  }, [user]);

  // Prevent body scroll when confirmation is shown
  useEffect(() => {
    if (showConfirm) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showConfirm]);

  const handleGoogleReauth = async () => {
    setError('');
    setIsReauthenticating(true);
    
    try {
      const provider = new GoogleAuthProvider();
      await reauthenticateWithPopup(user, provider);
      setIsAuthenticated(true);
      setIsReauthenticating(false);
    } catch (error) {
      console.error('Re-authentication error:', error);
      if (error.code === 'auth/popup-closed-by-user') {
        setError('Authentication cancelled');
      } else {
        setError('Authentication failed: ' + error.message);
      }
      setIsReauthenticating(false);
    }
  };

  const handleDeleteClick = (e) => {
    e.preventDefault();
    setError('');

    if (isGoogleUser) {
      if (!isAuthenticated) {
        setError('Please authenticate with Google first');
        return;
      }
    } else {
      if (!deleteAccountPassword) {
        setError('Please enter your password to delete your account');
        return;
      }
    }

    setShowConfirm(true);
  };

  const handleDeleteCancel = () => {
    setShowConfirm(false);
  };

  const handleDeleteAccount = async () => {
    try {
      // Re-authenticate user before deletion if not already authenticated
      if (isGoogleUser) {
        if (!isAuthenticated) {
          // Re-authenticate one more time to ensure fresh credentials
          const provider = new GoogleAuthProvider();
          await reauthenticateWithPopup(user, provider);
        }
      } else {
        const credential = EmailAuthProvider.credential(user.email, deleteAccountPassword);
        await reauthenticateWithCredential(user, credential);
      }

      // Delete user data from Firestore
      await deleteDoc(doc(db, 'users', user.uid));
      if (user.displayName) {
        await deleteDoc(doc(db, 'usernames', user.displayName));
      }

      // Delete user account
      await deleteUser(user);
      
      // Redirect to home page
      router.push('/');
    } catch (error) {
      if (error.code === 'auth/wrong-password') {
        setError('Incorrect password');
      } else if (error.code === 'auth/popup-closed-by-user') {
        setError('Authentication cancelled');
      } else {
        setError('Failed to delete account: ' + error.message);
      }
      setShowConfirm(false);
    }
  };

  if (!user) {
    router.push('/login');
    return null;
  }

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
          <h1 className="text-4xl font-bold mb-3 font-rouge-script" style={{ color: 'var(--red-custom)' }}>Delete Account</h1>
          
          <div className="mb-6">
            <p className="text-lg font-baloo2 text-gray-700">
              This action cannot be undone.
            </p>
          </div>

          <MessageAlert type="error" message={error} className="mb-4" />

          <form onSubmit={handleDeleteClick} className="space-y-6">
            {isGoogleUser ? (
              <div>
                <p className="text-lg font-baloo2 text-gray-700 mb-4">
                  To confirm, please re-authenticate with Google. This ensures it's really you.
                </p>
                {isAuthenticated ? (
                  <div className="flex items-center gap-2 mb-4 p-3 rounded-lg" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}>
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-lg font-baloo2 text-gray-700 font-medium">Authenticated</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleGoogleReauth}
                    disabled={isReauthenticating}
                    className="w-full flex items-center justify-center py-4 border-2 border-black rounded-full bg-white text-black hover:bg-gray-50 focus:outline-none transition-colors disabled:opacity-50"
                    style={{
                      borderWidth: '3px',
                      borderStyle: 'solid',
                      borderColor: 'black'
                    }}
                  >
                    {isReauthenticating ? (
                      <span className="text-lg font-baloo2">Authenticating...</span>
                    ) : (
                      <svg className="w-6 h-6" viewBox="0 0 24 24">
                        <path
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          fill="#4285F4"
                        />
                        <path
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          fill="#34A853"
                        />
                        <path
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          fill="#FBBC05"
                        />
                        <path
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          fill="#EA4335"
                        />
                      </svg>
                    )}
                  </button>
                )}
              </div>
            ) : (
              <div>
                <label htmlFor="deleteAccountPassword" className="block text-lg font-medium text-gray-700 mb-2 font-baloo2">
                  Enter your password to confirm
                </label>
                <input
                  type="password"
                  id="deleteAccountPassword"
                  value={deleteAccountPassword}
                  onChange={(e) => setDeleteAccountPassword(e.target.value)}
                  className="block w-full rounded-full border-2 border-gray-300 shadow-sm text-lg h-14 px-6 font-baloo2 focus:outline-none"
                  style={{ borderColor: '#D1D5DB' }}
                  placeholder="••••••••"
                />
              </div>
            )}
            <div className="flex flex-col gap-3">
              <button
                type="submit"
                disabled={isGoogleUser && !isAuthenticated}
                className="inline-block px-10 py-2 rounded-full mt-2 w-full disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  borderWidth: '3px',
                  borderStyle: 'solid',
                  borderColor: 'black',
                  backgroundColor: 'var(--red-custom)',
                  color: 'var(--yellow-custom)'
                }}
              >
                <span className="text-2xl font-medium font-quattrocento underline whitespace-nowrap">
                  Delete Account
                </span>
              </button>
              <SecondaryButton
                type="button"
                onClick={() => router.push('/profile')}
                className="w-full"
              >
                Cancel
              </SecondaryButton>
            </div>
          </form>
        </div>
      </main>

      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 relative" style={{ borderWidth: '3px', borderStyle: 'solid', borderColor: 'black' }}>
            <button
              onClick={handleDeleteCancel}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h3 className="text-4xl font-bold mb-3 font-rouge-script" style={{ color: 'var(--red-custom)' }}>You sure?</h3>
            <p className="text-lg mb-6 font-baloo2 text-gray-700">
              Are you sure you want to delete your account? This action cannot be undone.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleDeleteAccount}
                className="inline-block px-10 py-2 rounded-full mt-2 w-full"
                style={{
                  borderWidth: '3px',
                  borderStyle: 'solid',
                  borderColor: 'black',
                  backgroundColor: 'var(--red-custom)',
                  color: 'var(--yellow-custom)'
                }}
              >
                <span className="text-2xl font-medium font-quattrocento underline whitespace-nowrap">
                  Delete account
                </span>
              </button>
              <SecondaryButton
                onClick={handleDeleteCancel}
                className="w-full"
              >
                Cancel
              </SecondaryButton>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 