import { useState } from 'react';
import { useRouter } from 'next/router';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import Navbar from '../../components/navbar';
import MessageAlert from '../../components/MessageAlert';

export default function ResetPassword() {
  const router = useRouter();
  const { email } = router.query;
  const [emailInput, setEmailInput] = useState(email || '');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!emailInput) {
      setError('Please enter your email address');
      return;
    }

    try {
      await sendPasswordResetEmail(auth, emailInput);
      setSuccess('Password reset email sent! Please check your inbox.');
      
      // Redirect to login page after a short delay
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        setError('No account found with this email address');
      } else {
        setError(error.message);
      }
    }
  };

  return (
    <>
      <Navbar />
      <div className="max-w-md mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">Reset Password</h1>
        
        <MessageAlert type="error" message={error} className="mb-4" />
        <MessageAlert type="success" message={success} className="mb-4" />

        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                type="email"
                id="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 text-base h-12 px-4"
                placeholder="Enter your email"
              />
            </div>
            <div className="flex space-x-3">
              <button
                type="submit"
                className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-500 hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
              >
                Send Reset Link
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
              >
                Back
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
} 