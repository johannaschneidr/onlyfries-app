import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';
import PrimaryButton from './PrimaryButton';
import SecondaryButton from './SecondaryButton';

export default function LoginModal({ isOpen, onClose }) {
  const { signInWithGoogle } = useAuth();
  const router = useRouter();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 relative" style={{ borderWidth: '3px', borderStyle: 'solid', borderColor: 'black' }}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
          aria-label="Close modal"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <h3 className="text-4xl font-bold mb-3 font-rouge-script" style={{ color: 'var(--red-custom)' }}>Oops!</h3>
        <p className="text-lg mb-6 font-baloo2 text-gray-700">
          Please log in or create an account to react to this post.
        </p>
        <div className="flex flex-col gap-3">
          <PrimaryButton
            onClick={() => router.push('/login')}
            className="w-full"
          >
            Log in or Sign up
          </PrimaryButton>
          <SecondaryButton
          onClick={onClose}
            className="w-full"
        >
          Cancel
          </SecondaryButton>
        </div>
      </div>
    </div>
  );
} 