import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import Navbar from '../../components/navbar';
import MessageAlert from '../../components/MessageAlert';

export default function ChangePassword() {
  const { user } = useAuth();
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Please fill in all password fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      return;
    }

    try {
      // Reauthenticate user
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, newPassword);

      setSuccess('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      // Redirect back to profile after a short delay
      setTimeout(() => {
        router.push('/profile');
      }, 2000);
    } catch (error) {
      if (error.code === 'auth/wrong-password') {
        setError('Current password is incorrect');
      } else {
        setError(error.message);
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
        <h1 className="text-2xl font-bold mb-6">Change Password</h1>
        
        <MessageAlert type="error" message={error} className="mb-4" />
        <MessageAlert type="success" message={success} className="mb-4" />

        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                Current Password
              </label>
              <input
                type="password"
                id="currentPassword"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-base h-12 px-4"
                onFocus={(e) => e.target.style.borderColor = 'var(--yellow-custom)'}
                onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
                placeholder="••••••••"
              />
            </div>
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                New Password
              </label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-base h-12 px-4"
                onFocus={(e) => e.target.style.borderColor = 'var(--yellow-custom)'}
                onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
                placeholder="••••••••"
                minLength={6}
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm New Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-base h-12 px-4"
                onFocus={(e) => e.target.style.borderColor = 'var(--yellow-custom)'}
                onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
                placeholder="••••••••"
                minLength={6}
              />
            </div>
            <div className="flex space-x-3">
              <button
                type="submit"
                className="mt-4 w-full text-white py-3 px-4 rounded-md shadow-sm text-sm font-medium rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{ backgroundColor: 'var(--yellow-custom)' }}
                onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--yellow-custom)'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--yellow-custom)'}
                onFocus={(e) => e.target.style.boxShadow = '0 0 0 2px var(--yellow-custom)'}
                onBlur={(e) => e.target.style.boxShadow = ''}
              >
                Update Password
              </button>
              <button
                type="button"
                onClick={() => router.push('/profile')}
                className="flex-1 flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
} 