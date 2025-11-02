import { useState } from 'react';
import { useRouter } from 'next/router';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, updateProfile, fetchSignInMethodsForEmail } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import Navbar from '../components/navbar';
import MessageAlert from '../components/MessageAlert';

export default function Login() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const { redirect } = router.query;

  const checkEmailExists = async (email) => {
    try {
      // First check Firebase Auth sign-in methods
      const methods = await fetchSignInMethodsForEmail(auth, email);
      if (methods.length > 0) {
        return true;
      }

      // If no auth methods found, check Firestore
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email.toLowerCase()));
      const querySnapshot = await getDocs(q);
      
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error checking email:', error);
      // In case of error, assume email might exist to prevent accidental duplicate accounts
      return true;
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email) {
      setError('Please enter your email');
      return;
    }

    try {
      const emailExists = await checkEmailExists(email);
      console.log('Email exists:', emailExists);
      console.log('Routing to verify with:', { email, isNewUser: !emailExists });
      
      router.push({
        pathname: '/auth/verify',
        query: { 
          email, 
          isNewUser: !emailExists,
          redirect: redirect || undefined
        }
      });
    } catch (error) {
      console.error('Error in handleEmailSubmit:', error);
      setError(error.message);
    }
  };

  const handleGoogleAuth = async () => {
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Check if user exists in our database
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        // New user - create user document without username first
        // User will be redirected to setup username page
        await setDoc(doc(db, 'users', user.uid), {
          email: user.email,
          createdAt: new Date(),
          needsUsernameSetup: true
        });
        
        // Redirect to username setup page
        router.push({
          pathname: '/auth/setup-username',
          query: redirect ? { redirect } : {}
        });
        return;
      }
      
      // Check if existing user has a valid username
      const userData = userDoc.data();
      if (!userData.username || !/^[a-z0-9]+$/.test(userData.username)) {
        // User exists but doesn't have a valid username - redirect to setup
        router.push({
          pathname: '/auth/setup-username',
          query: redirect ? { redirect } : {}
        });
        return;
      }
      
      // User exists and has valid username - proceed normally
      // Redirect based on the redirect parameter
      if (redirect === 'new') {
        router.push('/new');
      } else {
        router.push('/');
      }
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <>
      <Navbar />
      <main className="max-w-md mx-auto p-4">
        {/* Main content section with white background */}
        <div className="bg-white rounded-xl overflow-hidden"
          style={{
            borderWidth: '3px',
            borderStyle: 'solid',
            borderColor: 'black'
          }}
        >
          <div className="px-6 pt-6">
            <h1 className="text-4xl font-bold mb-2 font-rouge-script" style={{ color: 'var(--blue-custom)' }}>Log in or sign up</h1>
          </div>
          <div className="px-6 pb-4 pt-4">
            <MessageAlert type="error" message={error} className="mb-2" />
          </div>
          <form onSubmit={handleEmailSubmit} className="noValidate">
            <div>
              <div className="relative px-4 mb-8 pt-0">
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full text-lg h-auto py-0 pl-2 font-baloo2 focus:outline-none border-0"
                  placeholder="Enter your email"
                />
                {email && (
                  <button
                    type="submit"
                    className="absolute right-4 w-10 h-10 rounded-full text-white flex items-center justify-center focus:outline-none"
                    style={{ 
                      backgroundColor: 'var(--yellow-custom)',
                      borderWidth: '3px',
                      borderStyle: 'solid',
                      borderColor: 'var(--red-custom)',
                      top: '50%',
                      transform: 'translateY(-50%)'
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2.5}
                      stroke="currentColor"
                      className="w-5 h-5"
                      style={{ color: 'var(--red-custom)' }}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                      />
                    </svg>
                  </button>
                )}
              </div>
              <div className="w-full" style={{ borderBottomWidth: '3px', borderBottomStyle: 'solid', borderBottomColor: 'black' }}></div>
            </div>
          </form>

          <div className="px-6 pb-6 pt-6">
            <h2 className="text-lg font-medium text-gray-700 mb-4 font-baloo2">Or continue with Google</h2>
            <button
              onClick={handleGoogleAuth}
              className="w-full flex items-center justify-center py-4 border-2 border-black rounded-full bg-white text-black hover:bg-gray-50 focus:outline-none transition-colors"
              style={{
                borderWidth: '3px',
                borderStyle: 'solid',
                borderColor: 'black'
              }}
            >
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
            </button>
          </div>
        </div>
      </main>
    </>
  );
} 