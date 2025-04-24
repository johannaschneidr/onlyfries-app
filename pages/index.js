import { useState, useEffect } from 'react';
import Navbar from '../components/navbar';
import UploadButton from '../components/uploadbutton';
import PostCard from '../components/PostCard';
import Leaderboard from '../components/Leaderboard';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, getDocs } from 'firebase/firestore';

export default function Home() {
  const [posts, setPosts] = useState([]);

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

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto p-4">
        <UploadButton />
        <div className="mb-8">
          <Leaderboard />
        </div>
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Latest Fries Posts</h1>
        <div className="grid gap-6">
          {posts.map(post => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </main>
    </>
  );
}
