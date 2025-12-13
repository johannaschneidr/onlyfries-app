import { db } from './firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { sortLocationsByCompositeScore } from './bayesianRanking';

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
    // Fetch all locations without ordering - we'll sort them client-side
    const q = query(locationsRef);
    const snapshot = await getDocs(q);

    // Fetch all posts to aggregate tags
    const posts = await getPosts();
    // Group posts by location name and collect unique types
    const locationTagsMap = {};
    posts.forEach(post => {
      if (!post.locationName || !Array.isArray(post.types)) return;
      if (!locationTagsMap[post.locationName]) locationTagsMap[post.locationName] = new Set();
      post.types.forEach(type => locationTagsMap[post.locationName].add(type));
    });

    // Map the data first
    const locations = snapshot.docs.map(doc => {
      const data = doc.data();
      const name = data.name;
      // Find all tags for this location (by name)
      const types = Array.from(locationTagsMap[name] || []);
      return {
        id: doc.id,
        name,
        totalPosts: data.totalReviews,
        overall: data.averageOverall,
        length: data.averageLength,
        thickness: data.averageThickness,
        crispiness: data.averageCrispiness,
        crunchiness: data.averageCrunchiness,
        saltiness: data.averageSaltiness,
        darkness: data.averageDarkness,
        types,
        // Add coordinates if available
        latitude: data.latitude || null,
        longitude: data.longitude || null,
        placeId: data.placeId || null,
        // Add the fields needed for Bayesian ranking
        averageOverall: data.averageOverall,
        totalReviews: data.totalReviews,
      };
    });

    // Sort using Bayesian ranking algorithm
    const sortedLocations = sortLocationsByCompositeScore(locations);
    
    // Remove the temporary fields used for ranking
    return sortedLocations.map(({ averageOverall, totalReviews, ...location }) => location);
  } catch (error) {
    console.error('Error fetching locations:', error);
    throw error;
  }
} 