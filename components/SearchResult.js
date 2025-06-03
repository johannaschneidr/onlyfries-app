import { useState } from 'react';
import Link from 'next/link';
import CategoryAveragesDisplay from './CategoryAveragesDisplay';
import ImageGallery from './ImageGallery';

export default function SearchResult({ location, selectedCategories, createLocationSlug, images, expanded, onExpand }) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Reset selected image when card is collapsed or images change
  if (!expanded && selectedImageIndex !== 0) setSelectedImageIndex(0);

  return (
    <div
      className="bg-white/65 backdrop-blur-sm p-4 rounded-xl border border-white/50 cursor-pointer hover:bg-white/80 transition-colors"
      onClick={onExpand}
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-800">
            {location.name.split(',')[0]}
          </h3>
          <p className="text-gray-500">{location.totalPosts} reviews</p>
        </div>
        <div className="flex items-center">
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-yellow-500 text-white text-lg font-semibold">
            {location.overall ? Math.min(location.overall, 5).toFixed(1) : 'N/A'}
          </span>
        </div>
      </div>
      {expanded && (
        <>
          {/* Only show selected categories in expanded view */}
          {selectedCategories.length > 0 && (
            <div className="mt-2">
              <CategoryAveragesDisplay
                {...Object.fromEntries(selectedCategories.map(cat => [cat, location[cat]]))}
              />
            </div>
          )}
          <div className="flex items-center gap-4 mt-4">
            <Link
              href={`/location/${createLocationSlug(location.name)}`}
              className="flex items-center gap-1 text-gray-500 hover:text-yellow-500 transition-colors"
              onClick={e => e.stopPropagation()}
            >
              {/* Map Pin Icon */}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 21c-4.418 0-8-4.03-8-9a8 8 0 1116 0c0 4.97-3.582 9-8 9zm0-11a2 2 0 100 4 2 2 0 000-4z" />
              </svg>
              <span className="text-sm">Full profile</span>
            </Link>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.name)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-gray-500 hover:text-yellow-500 transition-colors"
              onClick={e => e.stopPropagation()}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
              </svg>
              <span className="text-sm">Open in Google Maps</span>
            </a>
          </div>
          {/* Recent Images */}
          {images && images.length > 0 && (
            <div className="mt-4">
              <ImageGallery
                images={images}
                selectedIndex={selectedImageIndex}
                onSelect={idx => setSelectedImageIndex(idx)}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
} 