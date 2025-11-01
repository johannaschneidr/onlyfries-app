import React from 'react';
import { formatRelativeTime } from '../lib/utils';

export default function ImageGallery({ images, selectedIndex, onSelect }) {
  if (!images || images.length === 0) return null;
  const selected = images[selectedIndex] || images[0];
  return (
    <div>
       <div className="relative rounded-xl overflow-hidden border-black mb-4" style={{ borderWidth: '3px', borderStyle: 'solid' }}>
         <img
           src={selected.imageUrl || selected}
           alt="Recent fries from this location"
           className="w-full h-64 object-cover"
         />
         {selected.username && (
           <div className="absolute bottom-3 right-3">
             <div className="text-sm font-medium text-white font-baloo2 px-3 py-1 rounded-full" style={{ backgroundColor: 'var(--red-custom)' }}>
               {selected.username}
             </div>
           </div>
         )}
       </div>
      <div className="grid grid-cols-4 gap-3">
        {images.slice(0, 4).map((img, idx) => (
          <button
            key={idx}
            type="button"
            onClick={e => {
              e.stopPropagation();
              onSelect(idx);
            }}
            className={`relative aspect-square rounded-lg overflow-hidden transition-opacity ${
              idx === selectedIndex ? '' : 'hover:opacity-80'
            }`}
            style={{ borderWidth: '3px', borderStyle: 'solid', borderColor: 'black' }}
          >
            <img
              src={img.imageUrl || img}
              alt="Recent fries from this location"
              className="w-full h-full object-cover"
            />
            {idx === selectedIndex && (
              <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)' }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ borderWidth: '3px', borderStyle: 'solid', borderColor: 'black', backgroundColor: 'var(--blue-custom)' }}>
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20" strokeWidth="3">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" stroke="currentColor" strokeWidth="3" />
                  </svg>
                </div>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
} 