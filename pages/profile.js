import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import { signOut, updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import Navbar from '../components/navbar';

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
      <div className="max-w-md mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Profile</h1>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        {success && <p className="text-green-500 mb-4">{success}</p>}
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Username</label>
              {isEditingUsername ? (
                <form onSubmit={handleUsernameUpdate} className="mt-1 space-y-2">
                  <div className="flex rounded-md shadow-sm">
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase())}
                      className="flex-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 text-base h-12 px-4"
                      minLength={3}
                      maxLength={20}
                      pattern="[a-z0-9]+"
                      title="Username can only contain lowercase letters and numbers"
                    />
                    <button
                      type="submit"
                      className="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-500 hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingUsername(false);
                        setUsername(user.displayName || '');
                        setError('');
                      }}
                      className="ml-2 inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                    >
                      Cancel
                    </button>
                  </div>
                  <p className="text-sm text-gray-500">
                    Username must be 3-20 characters long and can only contain lowercase letters and numbers
                  </p>
                </form>
              ) : (
                <div className="mt-1 flex items-center">
                  <p className="text-lg">{user.displayName}</p>
                  <button
                    onClick={() => setIsEditingUsername(true)}
                    className="ml-2 p-1 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-5 h-5 text-gray-500"
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
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <div className="mt-1">
                <p className="text-lg">{user.email}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <div className="mt-1 flex items-center justify-between">
                <p className="text-lg">••••••••</p>
                <button
                  onClick={() => router.push('/profile/change-password')}
                  className="p-1 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5 text-gray-500"
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
        </div>

        <div className="space-y-4">
          <button
            onClick={handleLogout}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-500 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Log Out
          </button>

          <button
            onClick={() => router.push('/profile/delete-account')}
            className="w-full flex justify-center py-2 px-4 border border-red-600 rounded-md shadow-sm text-sm font-medium text-red-600 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Delete Account
          </button>
        </div>
      </div>
    </>
  );
} 