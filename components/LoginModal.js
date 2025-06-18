import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';

export default function LoginModal({ isOpen, onClose }) {
  const { signInWithGoogle } = useAuth();
  const router = useRouter();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Oops!</h3>
        <p className="text-gray-600 mb-6">
          Please log in or create an account to react to this post.
        </p>
        <div className="space-y-3">
          <button
            onClick={() => router.push('/login')}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-yellow-500 rounded-lg hover:bg-yellow-600 transition-colors"
          >
            Log in or create an account
          </button>
        </div>
        <button
          onClick={onClose}
          className="w-full mt-4 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
} 