import { useState } from 'react';
import { useRouter } from 'next/router';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import Navbar from '../../components/navbar';
import MessageAlert from '../../components/MessageAlert';
import PrimaryButton from '../../components/PrimaryButton';
import TertiaryButton from '../../components/TertiaryButton';

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
      <main className="max-w-md mx-auto p-4">
        <h1 className="text-6xl font-bold font-rouge-script text-center text-white mb-8" style={{ lineHeight: '1' }}>
          Reset Password
        </h1>
        <div className="bg-white rounded-xl p-6 mb-8"
          style={{
            borderWidth: '3px',
            borderStyle: 'solid',
            borderColor: 'black'
          }}
        >
          <MessageAlert type="error" message={error} className="mb-4" />
          <MessageAlert type="success" message={success} className="mb-4" />
          <form onSubmit={handleResetPassword} className="space-y-6" noValidate>
            <div>
              <label htmlFor="email" className="block text-lg font-medium text-gray-700 mb-2 font-baloo2">
                Email address
              </label>
              <input
                type="email"
                id="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="block w-full rounded-full border-2 shadow-sm text-lg h-14 px-6 font-baloo2 focus:outline-none"
                style={{ borderColor: '#D1D5DB' }}
                placeholder="Enter your email"
              />
            </div>
            <div className="flex flex-col gap-3 mt-6">
              <PrimaryButton type="submit" className="w-full">
                Send Reset Link
              </PrimaryButton>
              <TertiaryButton type="button" onClick={() => router.back()} className="w-full">
                Back
              </TertiaryButton>
            </div>
          </form>
        </div>
      </main>
    </>
  );
}
