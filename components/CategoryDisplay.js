import React from 'react';

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
    <div className="flex items-center h-full gap-2">
      <span className="text-sm text-gray-500 w-20">{label}</span>
      <div className="flex gap-1 flex-1">
        {[1, 2, 3, 4, 5].map((num) => (
          <div
            key={num}
            className={`w-full h-6 rounded-md flex items-center justify-center text-xs font-medium transition-colors
              ${value === num 
                ? 'bg-yellow-500 text-white' 
                : 'bg-gray-100 text-gray-700'
              }`}
          />
        ))}
      </div>
      <span className="text-sm font-medium text-gray-700 w-20 text-right">
        {descriptors[value]}
      </span>
    </div>
  );
};

export default function CategoryDisplay({
  length,
  thickness,
  crispiness,
  crunchiness,
  saltiness,
  darkness
}) {
  return (
    <div className="space-y-2">
      {renderRatingBar("Length", length, ratingDescriptors.length)}
      {renderRatingBar("Thickness", thickness, ratingDescriptors.thickness)}
      {renderRatingBar("Crispiness", crispiness, ratingDescriptors.crispiness)}
      {renderRatingBar("Crunchiness", crunchiness, ratingDescriptors.crunchiness)}
      {renderRatingBar("Saltiness", saltiness, ratingDescriptors.saltiness)}
      {renderRatingBar("Darkness", darkness, ratingDescriptors.darkness)}
    </div>
  );
} 