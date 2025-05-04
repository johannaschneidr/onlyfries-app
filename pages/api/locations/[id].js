import { db } from '../../../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { getPosts } from '../../../lib/api';

const createLocationSlug = (location) => {
  if (!location) return '';
  return location.split(',')[0].trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ message: 'Location ID is required' });
  }

  try {
    // First try to get data from locations collection
    const locationsRef = collection(db, 'locations');
    const locationSnapshot = await getDocs(locationsRef);

    // Find location by matching slug
    const locationDoc = locationSnapshot.docs.find(doc => {
      const locationData = doc.data();
      const locationSlug = createLocationSlug(locationData.name);
      return locationSlug === id;
    });

    if (locationDoc) {
      const locationData = locationDoc.data();

      // Get recent posts
      const posts = await getPosts();
      const recentPosts = posts
        .filter(post => {
          if (!post.locationName) return false;
          const postSlug = createLocationSlug(post.locationName);
          return postSlug === id;
        })
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

      const responseData = {
        name: locationData.name,
        totalPosts: locationData.totalReviews,
        overall: locationData.averageOverall,
        length: locationData.averageLength,
        thickness: locationData.averageThickness,
        crispiness: locationData.averageCrispiness,
        crunchiness: locationData.averageCrunchiness,
        saltiness: locationData.averageSaltiness,
        darkness: locationData.averageDarkness,
        recentPosts
      };

      console.log('Sending response from locations collection:', responseData);
      return res.status(200).json(responseData);
    }

    // If location not found in locations collection, return 404
    return res.status(404).json({ message: 'Location not found' });
  } catch (error) {
    console.error('Error in location API:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
} 