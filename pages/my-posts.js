import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import Navbar from '../components/navbar';
import MyPostCard from '../components/MyPostCard';

export default function MyPosts() {
  const { user } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      console.log('No user found, redirecting to login');
      router.push('/login');
      return;
    }

    console.log('Current user:', user.uid);

    const q = query(
      collection(db, 'posts'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log('Snapshot received:', snapshot.docs.length, 'documents');
      const postsData = snapshot.docs
        .map(doc => {
          const data = doc.data();
          console.log('Post data:', { id: doc.id, ...data });
          return {
            id: doc.id,
            ...data
          };
        })
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      console.log('Processed posts:', postsData);
      setPosts(postsData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching posts:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, router]);

  const handleDelete = async (postId) => {
    try {
      await deleteDoc(doc(db, 'posts', postId));
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="max-w-4xl mx-auto p-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-48 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto p-4 w-full">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">My Posts</h1>
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">You haven't posted any fries yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-8 relative">
            {posts.map(post => (
              <div key={post.id} className="relative">
              <MyPostCard
                post={post}
                onDelete={handleDelete}
              />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
} 