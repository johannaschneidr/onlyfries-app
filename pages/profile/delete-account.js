import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import { EmailAuthProvider, reauthenticateWithCredential, deleteUser } from 'firebase/auth';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import Navbar from '../../components/navbar';

export default function DeleteAccount() {
  const { user } = useAuth();
  const router = useRouter();
  const [deleteAccountPassword, setDeleteAccountPassword] = useState('');
  const [error, setError] = useState('');

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    setError('');

    if (!deleteAccountPassword) {
      setError('Please enter your password to delete your account');
      return;
    }

    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    try {
      // Re-authenticate user before deletion
      const credential = EmailAuthProvider.credential(user.email, deleteAccountPassword);
      await reauthenticateWithCredential(user, credential);

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
      } else {
        setError('Failed to delete account: ' + error.message);
      }
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
        <div className="rounded-md bg-red-50 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-red-800">Delete Account</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>This action cannot be undone. This will permanently delete your account and remove all of your data from our servers.</p>
              </div>
            </div>
          </div>
        </div>

        {error && <p className="text-red-500 mb-4">{error}</p>}

        <form onSubmit={handleDeleteAccount} className="space-y-6">
          <div>
            <label htmlFor="deleteAccountPassword" className="block text-sm font-medium text-gray-700">
              Enter your password to confirm
            </label>
            <input
              type="password"
              id="deleteAccountPassword"
              value={deleteAccountPassword}
              onChange={(e) => setDeleteAccountPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 text-base h-12 px-4"
              placeholder="••••••••"
            />
          </div>
          <div className="flex space-x-3">
            <button
              type="submit"
              className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Delete Account
            </button>
            <button
              type="button"
              onClick={() => router.push('/profile')}
              className="flex-1 flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </>
  );
} 