import { useState } from 'react';
import Link from 'next/link';
import CategoryAveragesDisplay from './CategoryAveragesDisplay';
import ImageGallery from './ImageGallery';
import RedButton from './RedButton';

export default function SearchResult({ location, selectedCategories, createLocationSlug, images, expanded, onExpand, isLast }) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  if (!expanded && selectedImageIndex !== 0) setSelectedImageIndex(0);

  return (
    <div
      className="cursor-pointer"
      style={!isLast ? { borderBottom: '3px solid black' } : {}}
      onClick={onExpand}
    >
      <div className="px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-800 font-baloo2">
              {location.name.split(',')[0]}
            </h3>
            <p className="text-sm text-gray-500 font-baloo2 -mt-0.5">
              {location.totalPosts} review{location.totalPosts !== 1 ? 's' : ''}
            </p>
          </div>
          <span
            className="w-10 h-10 flex items-center justify-center text-lg font-semibold text-black rounded-full font-baloo2 flex-shrink-0"
            style={{ backgroundColor: 'var(--yellow-custom)' }}
          >
            {location.overall ? Math.min(location.overall, 5).toFixed(1) : 'N/A'}
          </span>
        </div>

        {expanded && (
          <>
            {selectedCategories.length > 0 && (
              <div className="mt-4">
                <CategoryAveragesDisplay
                  {...Object.fromEntries(selectedCategories.map(cat => [cat, location[cat]]))}
                />
              </div>
            )}
            <div className="flex items-center mt-4 w-full" style={{ gap: '16px' }}>
              <Link
                href={`/location/${createLocationSlug(location.name)}`}
                className="flex items-center justify-center transition-colors px-4 py-3 rounded-full flex-1 font-quattrocento font-bold underline uppercase"
                style={{
                  color: 'var(--red-custom)',
                  borderWidth: '3px',
                  borderStyle: 'solid',
                  borderColor: 'var(--red-custom)'
                }}
                onClick={e => e.stopPropagation()}
              >
                <span className="text-sm">FULL PROFILE</span>
              </Link>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.name)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1 text-black transition-colors px-4 py-3 rounded-full flex-1"
                style={{
                  backgroundColor: 'white',
                  borderWidth: '3px',
                  borderStyle: 'solid',
                  borderColor: 'black'
                }}
                onClick={e => e.stopPropagation()}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                </svg>
                <span className="text-sm font-baloo2">Google Maps</span>
              </a>
            </div>
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
    </div>
  );
}
