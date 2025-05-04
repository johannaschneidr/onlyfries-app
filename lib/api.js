import { db } from './firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';

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

function calculateAverage(posts, field) {
  const validPosts = posts.filter(post => post[field] !== undefined && post[field] !== null);
  if (validPosts.length === 0) return null;
  
  const sum = validPosts.reduce((acc, post) => acc + post[field], 0);
  return sum / validPosts.length;
}

export async function getAllLocations() {
  try {
    const locationsRef = collection(db, 'locations');
    const q = query(locationsRef, orderBy('averageOverall', 'desc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      totalPosts: doc.data().totalReviews,
      overall: doc.data().averageOverall,
      length: doc.data().averageLength,
      thickness: doc.data().averageThickness,
      crispiness: doc.data().averageCrispiness,
      crunchiness: doc.data().averageCrunchiness,
      saltiness: doc.data().averageSaltiness,
      darkness: doc.data().averageDarkness
    }));
  } catch (error) {
    console.error('Error fetching locations:', error);
    throw error;
  }
} 