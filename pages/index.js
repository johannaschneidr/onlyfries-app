import { useState, useEffect, useRef } from 'react';
import Navbar from '../components/navbar';
import UploadButton from '../components/uploadbutton';
import PostCard from '../components/PostCard';
import Leaderboard from '../components/Leaderboard';
import Header from '../components/Header';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, getDocs } from 'firebase/firestore';
import LoginModal from '../components/LoginModal';

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const touchStartY = useRef(0);
  const touchCurrentY = useRef(0);
  const isPulling = useRef(false);

  /* Firestore TEST
  const testFirestore = async () => {
    try {
      const docRef = await addDoc(collection(db, 'users'), {
        name: 'John Doe',
        email: 'john.doe@example.com',
        createdAt: new Date()
      });
      console.log("Document written with ID: ", docRef.id);
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  };*/

  const refreshPosts = async () => {
    setIsRefreshing(true);
    // Force a fresh fetch by getting a new snapshot
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const postsData = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setPosts(postsData);
    // Small delay for visual feedback
    setTimeout(() => {
      setIsRefreshing(false);
    }, 500);
  };

  useEffect(() => {
    // Debug: Log initial collection data
    const fetchInitialData = async () => {
      const colRef = collection(db, 'posts');
      const snapshot = await getDocs(colRef);
      console.log('Initial collection data:', snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchInitialData();

    // Real-time updates
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPosts(postsData);
    });

    return () => unsubscribe();
  }, []);

  // Pull-to-refresh functionality
  useEffect(() => {
    const handleTouchStart = (e) => {
      if (window.scrollY === 0) {
        touchStartY.current = e.touches[0].clientY;
        isPulling.current = true;
      }
    };

    const handleTouchMove = (e) => {
      if (!isPulling.current) return;
      
      touchCurrentY.current = e.touches[0].clientY;
      const distance = touchCurrentY.current - touchStartY.current;
      
      if (distance > 0 && window.scrollY === 0) {
        setPullDistance(Math.min(distance, 80));
      } else {
        isPulling.current = false;
        setPullDistance(0);
      }
    };

    const handleTouchEnd = () => {
      const currentDistance = touchCurrentY.current - touchStartY.current;
      if (currentDistance > 50 && window.scrollY === 0) {
        refreshPosts();
      }
      setPullDistance(0);
      isPulling.current = false;
    };

    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  return (
    <>
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
      <Navbar onLogoClick={refreshPosts} isRefreshing={isRefreshing} />
      <Header />
      {/* Pull-to-refresh indicator */}
      {pullDistance > 0 && (
        <div className="fixed top-0 left-0 right-0 flex justify-center items-center z-50" style={{ height: `${Math.min(pullDistance, 80)}px`, backgroundColor: 'rgba(255, 255, 255, 0.9)' }}>
          <div className="flex flex-col items-center gap-2">
            <svg 
              className={`w-6 h-6 text-gray-600 ${pullDistance > 50 ? 'animate-spin' : ''}`}
              style={{ transform: `rotate(${pullDistance * 2}deg)` }}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {pullDistance > 50 && <span className="text-sm text-gray-600 font-baloo2">Release to refresh</span>}
          </div>
        </div>
      )}
      <main className="max-w-4xl mx-auto p-4">
        <UploadButton />
        <div className="mb-12 mt-8">
          <h2 className="text-4xl font-bold mb-3 font-rouge-script" style={{ color: 'var(--yellow-custom)' }}>True and Tested</h2>
          <Leaderboard />
        </div>
        <h1 className="text-4xl font-bold mb-3 font-rouge-script" style={{ color: 'var(--yellow-custom)' }}>New to the party</h1>
        <div className="grid gap-6">
          {posts.map(post => (
            <PostCard key={post.id} post={post} openLoginModal={() => setShowLoginModal(true)} />
          ))}
        </div>
      </main>
    </>
  );
}
