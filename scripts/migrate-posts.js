const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, updateDoc, doc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function migratePosts() {
  try {
    const postsRef = collection(db, 'posts');
    const snapshot = await getDocs(postsRef);
    
    console.log(`Found ${snapshot.docs.length} posts to migrate`);
    
    for (const doc of snapshot.docs) {
      const post = doc.data();
      if (!post.userId) {
        // If no userId exists, we'll need to determine it from the username
        // For now, we'll skip these posts and log them
        console.log(`Post ${doc.id} has no userId. Username: ${post.username}`);
        continue;
      }
      
      try {
        await updateDoc(doc.ref, {
          userId: post.userId
        });
        console.log(`Updated post ${doc.id}`);
      } catch (error) {
        console.error(`Error updating post ${doc.id}:`, error);
      }
    }
    
    console.log('Migration completed');
  } catch (error) {
    console.error('Error during migration:', error);
  }
}

migratePosts(); 