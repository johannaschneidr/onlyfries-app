/**
 * Test to verify trending algorithm handles missing lastUpdated fields
 */

import { calculateTrendingScore, calculateCompositeScore } from './lib/bayesianRanking.js';

// Test data with locations that have and don't have lastUpdated
const testLocations = [
  { 
    name: "Location A (with lastUpdated)", 
    averageOverall: 4.5, 
    totalReviews: 50, 
    lastUpdated: new Date().toISOString() // Just now
  },
  { 
    name: "Location B (with lastUpdated)", 
    averageOverall: 4.8, 
    totalReviews: 30, 
    lastUpdated: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days ago
  },
  { 
    name: "Location C (no lastUpdated)", 
    averageOverall: 4.2, 
    totalReviews: 100, 
    lastUpdated: null
  },
  { 
    name: "Location D (no lastUpdated)", 
    averageOverall: 4.6, 
    totalReviews: 25, 
    lastUpdated: undefined
  }
];

console.log("=== Testing Trending Algorithm with Missing lastUpdated ===\n");

testLocations.forEach(location => {
  const compositeScore = calculateCompositeScore(location.averageOverall, location.totalReviews);
  const trendingScore = calculateTrendingScore(
    location.averageOverall, 
    location.totalReviews, 
    location.lastUpdated
  );
  
  console.log(`${location.name}:`);
  console.log(`  Rating: ${location.averageOverall} stars (${location.totalReviews} reviews)`);
  console.log(`  lastUpdated: ${location.lastUpdated || 'MISSING'}`);
  console.log(`  Composite Score: ${compositeScore.toFixed(3)}`);
  console.log(`  Trending Score: ${trendingScore.toFixed(3)}`);
  console.log('');
});

console.log("=== Ranking by Trending Score ===");
const ranked = testLocations
  .map(location => ({
    ...location,
    trendingScore: calculateTrendingScore(
      location.averageOverall, 
      location.totalReviews, 
      location.lastUpdated
    )
  }))
  .sort((a, b) => b.trendingScore - a.trendingScore);

ranked.forEach((location, index) => {
  console.log(`${index + 1}. ${location.name}: ${location.trendingScore.toFixed(3)}`);
}); 