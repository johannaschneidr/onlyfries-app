import React from 'react';

export default function ImageGallery({ images, selectedIndex, onSelect }) {
  if (!images || images.length === 0) return null;
  const selected = images[selectedIndex] || images[0];
  return (
    <div>
      <div className="relative aspect-[4/3] rounded-lg overflow-hidden mb-2">
        <img
          src={selected.imageUrl || selected}
          alt="Recent fries from this location"
          className="w-full h-full object-cover"
        />
        {selected.username && (
          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent">
            <span className="text-sm font-medium text-white">
              {selected.username}
            </span>
          </div>
        )}
      </div>
      <div className="grid grid-cols-5 gap-1.5">
        {images.slice(0, 5).map((img, idx) => (
          <button
            key={idx}
            type="button"
            onClick={e => {
              e.stopPropagation();
              onSelect(idx);
            }}
            className={`relative aspect-square rounded-lg overflow-hidden transition-opacity ${
              idx === selectedIndex ? 'ring-2 ring-yellow-500' : 'hover:opacity-80'
            }`}
          >
            <img
              src={img.imageUrl || img}
              alt="Recent fries from this location"
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
} 