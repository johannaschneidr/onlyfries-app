import { db } from './firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export async function getPosts() {
  const postsRef = collection(db, 'posts');
  const snapshot = await getDocs(postsRef);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

export async function getLocationData(locationId) {
  const response = await fetch(`/api/locations/${locationId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch location data');
  }
  return response.json();
} 