import { formatRelativeTime } from '../lib/utils';
import PostCard from './PostCard';
import { useState } from 'react';
import CategoryAveragesDisplay from './CategoryAveragesDisplay';
import PrimaryButton from './PrimaryButton';

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


  return (
    <div className="space-y-6">
      <div>
        <div className="bg-white overflow-hidden px-6 pt-4 pb-2" style={{ borderWidth: '3px', borderStyle: 'solid', borderColor: 'black', borderBottom: 'none', borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-gray-800 font-baloo2">{name.split(',')[0]}</h1>
              <p className="text-sm text-gray-500 font-baloo2">{totalPosts} reviews</p>
            </div>
            <div className="flex items-center">
            <span className="inline-flex items-center justify-center w-12 h-12 rounded-full text-black text-2xl font-semibold font-baloo2" style={{ backgroundColor: 'var(--yellow-custom)' }}>
              {averageOverall ? averageOverall.toFixed(1) : 'N/A'}
            </span>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden px-6 pt-6 pb-4" style={{ borderWidth: '3px', borderStyle: 'solid', borderColor: 'black', borderTop: '3px solid black', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}>
          <div className="space-y-2">
            <CategoryAveragesDisplay
              length={averageLength}
              thickness={averageThickness}
              crispiness={averageCrispiness}
              crunchiness={averageCrunchiness}
              saltiness={averageSaltiness}
              darkness={averageDarkness}
            />
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-bold text-black mb-3 font-baloo2 uppercase">Common Tags</h3>
            <div className="flex flex-wrap gap-2">
              {(() => {
                // Extract all unique tags from recentPosts
                const allTags = recentPosts.flatMap(post => post.types || []);
                const uniqueTags = [...new Set(allTags)];
                const topTags = uniqueTags.slice(0, 5); // Show top 5 most common tags
                
                return topTags.length > 0 ? topTags.map((tag, index) => (
                  <span 
                    key={index}
                    className="inline-flex items-center px-3 py-1 text-sm capitalize font-bold font-baloo2" 
                    style={{ color: 'var(--yellow-custom)', background: 'var(--red-custom)' }}
                  >
                    {tag}
                  </span>
                )) : (
                  <span className="text-gray-500 text-sm font-baloo2">No tags available</span>
                );
              })()}
            </div>
          </div>

          <div className="w-full mt-6">
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1 text-black transition-colors px-4 py-3 rounded-full w-full"
              style={{ 
                backgroundColor: 'white',
                borderWidth: '3px', 
                borderStyle: 'solid', 
                borderColor: 'black' 
              }}
              onMouseEnter={(e) => e.target.style.color = 'var(--yellow-custom)'}
              onMouseLeave={(e) => e.target.style.color = 'black'}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
              </svg>
              <span className="text-base font-baloo2">Google Maps</span>
            </a>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-4xl font-bold mb-3 font-rouge-script" style={{ color: 'var(--yellow-custom)' }}>Recent posts</h2>
        {displayedPosts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
        {hasMore && (
          <div className="flex items-center justify-center gap-4 mt-6">
            <PrimaryButton onClick={loadMore} className="!px-6 !py-2">
              <span className="text-lg">Load more</span>
            </PrimaryButton>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="text-black font-bold underline font-quattrocento"
            >
              Go to Top
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 