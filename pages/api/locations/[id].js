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
    const posts = await getPosts();
    console.log('Looking for location with slug:', id);

    const locationPosts = posts.filter(post => {
      if (!post.locationName) return false;
      const postSlug = createLocationSlug(post.locationName);
      return postSlug === id;
    });

    console.log('Found posts:', locationPosts);

    if (locationPosts.length === 0) {
      return res.status(404).json({ message: 'Location not found' });
    }

    const locationName = locationPosts[0].locationName;
    const totalPosts = locationPosts.length;

    // Calculate averages
    const averages = {
      overall: calculateAverage(locationPosts, 'overall'),
      length: calculateAverage(locationPosts, 'length'),
      thickness: calculateAverage(locationPosts, 'thickness'),
      crispiness: calculateAverage(locationPosts, 'crispiness'),
      crunchiness: calculateAverage(locationPosts, 'crunchiness'),
      saltiness: calculateAverage(locationPosts, 'saltiness'),
      darkness: calculateAverage(locationPosts, 'darkness'),
    };

    // Get recent posts (last 5)
    const recentPosts = locationPosts
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    const responseData = {
      name: locationName,
      totalPosts,
      ...averages,
      recentPosts
    };

    console.log('Sending response:', responseData);
    res.status(200).json(responseData);
  } catch (error) {
    console.error('Error in location API:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
}

function calculateAverage(posts, field) {
  const validPosts = posts.filter(post => post[field] !== undefined && post[field] !== null);
  if (validPosts.length === 0) return null;
  
  const sum = validPosts.reduce((acc, post) => acc + post[field], 0);
  return sum / validPosts.length;
} 