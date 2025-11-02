import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import { signOut, updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import Navbar from '../components/navbar';
import MessageAlert from '../components/MessageAlert';
import PrimaryButton from '../components/PrimaryButton';
import SecondaryButton from '../components/SecondaryButton';

export default function Profile() {
  const { user } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState(user?.displayName || '');
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const checkUsernameExists = async (username) => {
    if (username === user?.displayName) return false;
    const usernameDoc = await getDoc(doc(db, 'usernames', username));
    return usernameDoc.exists();
  };

  const handleUsernameUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

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

    const usernameExists = await checkUsernameExists(username);
    if (usernameExists) {
      setError('Username is already taken');
      return;
    }

    try {
      // Update Firebase Auth profile
      await updateProfile(user, { displayName: username });
      
      // Update Firestore documents
      await updateDoc(doc(db, 'users', user.uid), {
        username: username
      });

      // Update username mapping
      await setDoc(doc(db, 'usernames', username), {
        userId: user.uid
      });

      // Remove old username mapping
      if (user.displayName && user.displayName !== username) {
        await deleteDoc(doc(db, 'usernames', user.displayName));
      }

      setSuccess('Username updated successfully');
      setIsEditingUsername(false);
    } catch (error) {
      setError(error.message);
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
          <h1 className="text-4xl font-bold mb-3 font-rouge-script" style={{ color: 'var(--blue-custom)' }}>Profile Settings</h1>
          <MessageAlert type="error" message={error} className="mb-4 mt-6" />
          <MessageAlert type="success" message={success} className="mb-4" />
          
          <div className="space-y-6 mt-6">
            <div>
              <label className="block text-lg font-medium text-gray-700 mb-2 font-baloo2">Username</label>
              {isEditingUsername ? (
                <form onSubmit={handleUsernameUpdate} className="space-y-3">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase())}
                    className="block w-full rounded-full border-2 border-gray-300 shadow-sm text-lg h-14 px-6 font-baloo2 focus:outline-none"
                    style={{ borderColor: '#D1D5DB' }}
                    minLength={3}
                    maxLength={20}
                    pattern="[a-z0-9]+"
                    title="Username can only contain lowercase letters and numbers"
                  />
                  <p className="mt-2 text-sm text-gray-600 font-baloo2">
                    Username must be 3-20 characters long and can only contain lowercase letters and numbers
                  </p>
                  <div className="flex flex-col gap-3 mt-6">
                    <PrimaryButton
                      type="submit"
                      className="w-full"
                    >
                      Save
                    </PrimaryButton>
                    <SecondaryButton
                      type="button"
                      onClick={() => {
                        setIsEditingUsername(false);
                        setUsername(user.displayName || '');
                        setError('');
                      }}
                      className="w-full"
                    >
                      Cancel
                    </SecondaryButton>
                  </div>
                </form>
              ) : (
                <div className="mt-1 flex items-center justify-between">
                  <p className="text-lg font-baloo2">{user.displayName}</p>
                  <button
                    onClick={() => setIsEditingUsername(true)}
                    className="p-2 rounded-full hover:bg-gray-100 focus:outline-none transition-colors"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-6 h-6 text-gray-500"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                      />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-lg font-medium text-gray-700 mb-2 font-baloo2">Email</label>
              <div className="mt-1">
                <p className="text-lg font-baloo2">{user.email}</p>
              </div>
            </div>

            <div>
              <label className="block text-lg font-medium text-gray-700 mb-2 font-baloo2">Password</label>
              <div className="mt-1 flex items-center justify-between">
                <p className="text-lg font-baloo2">••••••••</p>
                <button
                  onClick={() => router.push('/profile/change-password')}
                  className="p-2 rounded-full hover:bg-gray-100 focus:outline-none transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-6 h-6 text-gray-500"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3">
            <SecondaryButton
              onClick={handleLogout}
              className="w-full"
            >
              Log Out
            </SecondaryButton>

            <button
              onClick={() => router.push('/profile/delete-account')}
              className="inline-block px-10 py-2 rounded-full mt-0 w-full"
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
          </div>
        </div>
      </main>
    </>
  );
} 