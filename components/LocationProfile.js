import { formatRelativeTime } from '../lib/utils';
import PostCard from './PostCard';
import { useState } from 'react';
import CategoryAveragesDisplay from './CategoryAveragesDisplay';

export default function LocationProfile({ locationData }) {
  const {
    name,
    totalPosts,
    overall: averageOverall,
    length: averageLength,
    thickness: averageThickness,
    crispiness: averageCrispiness,
    crunchiness: averageCrunchiness,
    saltiness: averageSaltiness,
    darkness: averageDarkness,
    recentPosts
  } = locationData;

  const [displayedPosts, setDisplayedPosts] = useState(recentPosts.slice(0, 10));
  const [hasMore, setHasMore] = useState(recentPosts.length > 10);

  const loadMore = () => {
    const currentLength = displayedPosts.length;
    const nextPosts = recentPosts.slice(currentLength, currentLength + 10);
    setDisplayedPosts([...displayedPosts, ...nextPosts]);
    setHasMore(displayedPosts.length + nextPosts.length < recentPosts.length);
  };

  const renderStars = (rating) => {
    return Array(5).fill(0).map((_, index) => (
      <svg
        key={index}
        className={`w-8 h-8 ${index < rating ? 'text-yellow-500' : 'text-gray-300'}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ));
  };

  const ratingDescriptors = {
    length: {
      1: "Tiny",
      2: "Shorty",
      3: "Regular",
      4: "Long Boi",
      5: "Giraffe"
    },
    thickness: {
      1: "Paper",
      2: "Slim",
      3: "Standard",
      4: "Thicc",
      5: "Chonky"
    },
    crispiness: {
      1: "Mushy",
      2: "Soft",
      3: "Crisp",
      4: "Crunchy",
      5: "Crackling"
    },
    crunchiness: {
      1: "Soggy",
      2: "Tender",
      3: "Firm",
      4: "Crispy",
      5: "Crunchy"
    },
    saltiness: {
      1: "Bland",
      2: "Mild",
      3: "Seasoned",
      4: "Salty",
      5: "Ocean"
    },
    darkness: {
      1: "Pale",
      2: "Light",
      3: "Golden",
      4: "Toasted",
      5: "Burnt"
    }
  };

  const renderRatingBar = (label, value, descriptors) => {
    if (!value) return null;
    
    return (
      <div className="bg-white/60 backdrop-blur-sm rounded-md border border-white/50 h-[40px]">
        <div className="flex items-center h-full gap-2 px-3">
          <span className="text-sm text-gray-500 w-20">{label}</span>
          <div className="flex gap-1 flex-1">
            {[1, 2, 3, 4, 5].map((num) => (
              <div
                key={num}
                className={`w-full h-6 rounded-md flex items-center justify-center text-xs font-medium transition-colors
                  ${value === num 
                    ? 'bg-yellow-500 text-white' 
                    : 'bg-white text-gray-700'
                  }`}
              />
            ))}
          </div>
          <span className="text-sm font-medium text-gray-700 w-20 text-right">
            {descriptors[Math.round(value)]}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="border rounded-xl overflow-hidden bg-white/65 backdrop-blur-sm p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-gray-800">{name.split(',')[0]}</h1>
            <p className="mt-1 text-gray-500">{totalPosts} reviews</p>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mt-3"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              View on Google Maps
            </a>
          </div>
          <div className="flex items-center">
            <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-yellow-500 text-white text-2xl font-semibold">
              {averageOverall ? averageOverall.toFixed(1) : 'N/A'}
            </span>
          </div>
        </div>

        <div className="mt-6 space-y-2">
          <CategoryAveragesDisplay
            length={averageLength}
            thickness={averageThickness}
            crispiness={averageCrispiness}
            crunchiness={averageCrunchiness}
            saltiness={averageSaltiness}
            darkness={averageDarkness}
          />
        </div>
      </div>

      <div className="space-y-6">
        {displayedPosts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
        {hasMore && (
          <button
            onClick={loadMore}
            className="w-full py-3 text-center bg-white/60 backdrop-blur-sm text-gray-700 rounded-xl border border-gray-400 hover:bg-white/80 transition-colors"
          >
            Load More
          </button>
        )}
      </div>
    </div>
  );
} 