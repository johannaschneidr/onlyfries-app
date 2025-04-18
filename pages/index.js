import { useState, useEffect } from 'react';
import Navbar from '../components/navbar';
import { db } from '../lib/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, getDocs } from 'firebase/firestore';

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
      {/* Firestore connection test
        <button 
          onClick={testFirestore}
          className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
        >
          Test Firestore Connection
        </button>
        */}
        <h1 className="text-2xl font-bold mb-6">Latest Fries Posts</h1>
        <div className="grid gap-6">
          {posts.map(post => (
            <div key={post.id} className="border rounded-lg overflow-hidden">
              <img 
                src={post.imageUrl} 
                alt={post.locationName}
                className="w-full h-64 object-cover"
              />
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-xl font-semibold">{post.locationName}</h2>
                  <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-sm">
                    {post.type}
                  </span>
                </div>
                <p className="text-gray-600 mb-4">{post.description}</p>
                <div className="text-sm text-gray-500 mb-4">
                  Posted on {new Date(post.createdAt).toLocaleDateString()} at {new Date(post.createdAt).toLocaleTimeString()}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Length:</span> {post.length}/10
                  </div>
                  <div>
                    <span className="font-medium">Thickness:</span> {post.thickness}/10
                  </div>
                  <div>
                    <span className="font-medium">Crispiness:</span> {post.crispiness}/10
                  </div>
                  <div>
                    <span className="font-medium">Saltiness:</span> {post.saltiness}/10
                  </div>
                  <div>
                    <span className="font-medium">Darkness:</span> {post.darkness}/10
                  </div>
                  <div>
                    <span className="font-medium">Overall:</span> {post.overall}/10
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
