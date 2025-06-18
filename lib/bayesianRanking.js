/**
 * Bayesian ranking utilities for more accurate leaderboard rankings
 * Uses Wilson score interval and Bayesian average to account for both rating and review count
 */

/**
 * Calculate Wilson score interval for a given rating
 * This provides a confidence interval that accounts for the number of reviews
 * @param {number} positive - Number of positive ratings (4-5 stars)
 * @param {number} total - Total number of ratings
 * @param {number} confidence - Confidence level (default 0.95)
 * @returns {number} Wilson score
 */
export function calculateWilsonScore(positive, total, confidence = 0.95) {
  if (total === 0) return 0;
  
  const z = 1.96; // 95% confidence interval
  const p = positive / total;
  const denominator = 1 + z * z / total;
  const centreAdjustedProbability = p + z * z / (2 * total);
  const adjustedStandardError = z * Math.sqrt((p * (1 - p) + z * z / (4 * total)) / total);
  
  const lowerBound = (centreAdjustedProbability - adjustedStandardError) / denominator;
  return Math.max(0, lowerBound);
}

/**
 * Calculate Bayesian average using a prior mean and confidence
 * This pulls ratings toward a prior mean when there are few reviews
 * @param {number} averageRating - Current average rating
 * @param {number} numReviews - Number of reviews
 * @param {number} priorMean - Prior mean rating (default 3.0)
 * @param {number} priorWeight - Weight of the prior (default 10)
 * @returns {number} Bayesian average
 */
export function calculateBayesianAverage(averageRating, numReviews, priorMean = 3.0, priorWeight = 10) {
  if (numReviews === 0) return priorMean;
  
  const totalWeight = numReviews + priorWeight;
  const weightedAverage = (averageRating * numReviews + priorMean * priorWeight) / totalWeight;
  
  return weightedAverage;
}

/**
 * Calculate a composite score that balances rating and review count
 * Uses both Wilson score and Bayesian average for a robust ranking
 * @param {number} averageRating - Current average rating
 * @param {number} numReviews - Number of reviews
 * @param {number} maxRating - Maximum possible rating (default 5)
 * @returns {number} Composite ranking score
 */
export function calculateCompositeScore(averageRating, numReviews, maxRating = 5) {
  if (numReviews === 0) return 0;
  
  // Calculate positive ratings (4-5 stars) for Wilson score
  const positiveRatings = Math.round((averageRating / maxRating) * numReviews);
  
  // Get Wilson score (0-1 scale)
  const wilsonScore = calculateWilsonScore(positiveRatings, numReviews);
  
  // Get Bayesian average
  const bayesianAverage = calculateBayesianAverage(averageRating, numReviews);
  
  // Convert Wilson score to 0-5 scale
  const wilsonScoreScaled = wilsonScore * maxRating;
  
  // Combine both scores with weights
  // Wilson score gets more weight as it's more sophisticated
  const compositeScore = (wilsonScoreScaled * 0.7) + (bayesianAverage * 0.3);
  
  return compositeScore;
}

/**
 * Calculate trending score using exponential time decay
 * Surfaces recently active locations with good ratings
 * @param {number} averageRating - Current average rating
 * @param {number} numReviews - Number of reviews
 * @param {string} lastUpdated - ISO string of last update time (can be null/undefined)
 * @param {number} maxRating - Maximum possible rating (default 5)
 * @param {number} decayConstant - Decay constant λ (default 0.15 for ~4.6 day half-life)
 * @returns {number} Trending score
 */
export function calculateTrendingScore(averageRating, numReviews, lastUpdated, maxRating = 5, decayConstant = 0.15) {
  if (numReviews === 0) return 0;
  
  // Calculate base composite score
  const baseScore = calculateCompositeScore(averageRating, numReviews, maxRating);
  
  // Calculate age in days
  let ageInDays;
  if (lastUpdated) {
    const lastUpdateTime = new Date(lastUpdated);
    const now = new Date();
    ageInDays = (now - lastUpdateTime) / (1000 * 60 * 60 * 24);
  } else {
    // For locations without lastUpdated, assume they're older (7 days)
    // This prevents them from ranking too high just because they lack the field
    ageInDays = 7;
  }
  
  // Apply exponential time decay
  const decayFactor = Math.exp(-decayConstant * ageInDays);
  
  // Trending score with time decay
  const trendingScore = baseScore * decayFactor;
  
  return trendingScore;
}

/**
 * Sort locations by composite score for leaderboard ranking
 * @param {Array} locations - Array of location objects
 * @returns {Array} Sorted locations
 */
export function sortLocationsByCompositeScore(locations) {
  return locations
    .map(location => ({
      ...location,
      compositeScore: calculateCompositeScore(
        location.averageOverall || 0,
        location.totalReviews || 0
      )
    }))
    .sort((a, b) => b.compositeScore - a.compositeScore);
}

/**
 * Sort locations by trending score for trending leaderboard
 * @param {Array} locations - Array of location objects
 * @returns {Array} Sorted locations
 */
export function sortLocationsByTrendingScore(locations) {
  return locations
    .map(location => ({
      ...location,
      trendingScore: calculateTrendingScore(
        location.averageOverall || 0,
        location.totalReviews || 0,
        location.lastUpdated || null
      )
    }))
    .sort((a, b) => b.trendingScore - a.trendingScore);
} 