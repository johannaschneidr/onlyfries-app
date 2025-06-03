import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../components/navbar';
import { getAllLocations } from '../lib/api';
import CategoryAveragesDisplay from '../components/CategoryAveragesDisplay';
import SearchResult from '../components/SearchResult';
import { collection, query as firestoreQuery, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import TagTypeDropdown from '../components/TagTypeDropdown';

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

export default function SearchPage() {
  const router = useRouter();
  const [locations, setLocations] = useState([]);
  const [filteredLocations, setFilteredLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    length: 0,
    thickness: 0,
    crispiness: 0,
    saltiness: 0,
    darkness: 0,
  });
  const [locationImages, setLocationImages] = useState({});
  const [expandedCard, setExpandedCard] = useState(null);

  // Fry Type Categories (copied from PostForm)
  const fryTypes = {
    'Classic Styles': [
      { value: 'classic', label: 'Classic' },
      { value: 'shoestring', label: 'Shoestring' },
      { value: 'steak-cut', label: 'Steak Cut' },
      { value: 'home-style', label: 'Home Style' },
      { value: 'skin-on', label: 'Skin-On' }
    ],
    'Specialty Cuts': [
      { value: 'waffle', label: 'Waffle Style' },
      { value: 'crinkle-cut', label: 'Crinkle Cut' },
      { value: 'tornado', label: 'Tornado' },
      { value: 'curly', label: 'Curly' },
      { value: 'wavy', label: 'Wavy' }
    ],
    'Alternative Fries': [
      { value: 'sweet-potato', label: 'Sweet Potato' },
      { value: 'hash-brown', label: 'Hash Brown' },
      { value: 'non-potato', label: 'Non-Potato' },
      { value: 'tater-tots', label: 'Tater Tots' },
      { value: 'polenta', label: 'Polenta Fries' }
    ],
    'Flavor Profiles': [
      { value: 'spiced', label: 'Spiced' },
      { value: 'loaded', label: 'Loaded' },
      { value: 'seasoned', label: 'Seasoned' },
      { value: 'garlic', label: 'Garlic' },
      { value: 'truffle', label: 'Truffle' }
    ]
  };
  const allFryTypes = Object.values(fryTypes).flat();
  // Tag filter state
  const [typeTags, setTypeTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const tagInputRef = useRef(null);
  const tagInputContainerRef = useRef(null);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const data = await getAllLocations();
        setLocations(data);
        setFilteredLocations(data);
      } catch (error) {
        console.error('Error fetching locations:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLocations();
  }, []);

  // Helper to create slug from location name
  const createLocationSlug = (name) => {
    return name.split(',')[0].trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  // Helper to get only selected categories
  const selectedCategories = Object.keys(filters).filter((cat) => filters[cat] > 0);

  // Helper to calculate match score (lower is better)
  const getMatchScore = (location) => {
    let score = 0;
    selectedCategories.forEach((cat) => {
      if (location[cat]) {
        score += Math.abs(location[cat] - filters[cat]);
      } else {
        score += 5; // Penalize missing data
      }
    });
    return score;
  };

  useEffect(() => {
    let filtered = [...locations];
    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value > 0) {
        filtered = filtered.filter(location => 
          location[key] && location[key] >= value
        );
      }
    });
    // Apply fry type tags filter
    if (typeTags.length > 0) {
      filtered = filtered.filter(location =>
        Array.isArray(location.types) && typeTags.some(tag => location.types.includes(tag))
      );
    }
    // Sort by match score
    filtered.sort((a, b) => getMatchScore(a) - getMatchScore(b));
    setFilteredLocations(filtered);
  }, [filters, locations, typeTags]);

  const handleFilterChange = (category, value) => {
    setFilters(prev => ({
      ...prev,
      [category]: value === prev[category] ? 0 : value
    }));
  };

  const renderRatingSelector = (category, label) => (
    <div className="mb-4">
      <div className="flex items-center h-full gap-2">
        <span className="text-sm text-gray-500 w-20">{label}</span>
        <div className="flex gap-1 flex-1">
          {[1, 2, 3, 4, 5].map((num) => (
            <button
              key={num}
              onClick={() => handleFilterChange(category, num)}
              className={`w-full h-8 rounded-md flex items-center justify-center text-xs font-medium transition-colors
                ${filters[category] === num 
                  ? 'bg-yellow-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              aria-label={`Set ${label} to ${num}`}
            >
              {/* No number shown */}
            </button>
          ))}
        </div>
        <span className="text-sm font-medium text-gray-700 w-20 text-right">
          {filters[category] > 0 ? ratingDescriptors[category][filters[category]] : 'Any'}
        </span>
      </div>
    </div>
  );

  // Fetch recent images for a location
  const fetchLocationImages = async (locationName) => {
    try {
      const friesRef = collection(db, 'posts');
      const q = firestoreQuery(
        friesRef,
        where('locationName', '==', locationName),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      const querySnapshot = await getDocs(q);
      const images = querySnapshot.docs.map(doc => ({
        id: doc.id,
        imageUrl: doc.data().imageUrl,
        createdAt: doc.data().createdAt,
        username: doc.data().username || 'Anonymous',
      }));
      setLocationImages(prev => ({ ...prev, [locationName]: images }));
    } catch (error) {
      console.error('Error fetching location images:', error);
    }
  };

  // Tag input handlers (copied from PostForm)
  const handleTagInputChange = (e) => {
    const value = e.target.value;
    setTagInput(value);
    if (value) {
      const filtered = allFryTypes.filter(type => 
        type.label.toLowerCase().includes(value.toLowerCase()) &&
        !typeTags.includes(type.value)
      );
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      // Show all available options if input is empty
      const filtered = allFryTypes.filter(type => !typeTags.includes(type.value));
      setSuggestions(filtered);
      setShowSuggestions(true);
    }
  };
  const addTag = (type) => {
    if (!typeTags.includes(type.value)) {
      setTypeTags(prev => [...prev, type.value]);
    }
    setTagInput('');
    setShowSuggestions(false);
  };
  const removeTag = (typeToRemove) => {
    setTypeTags(prev => prev.filter(type => type !== typeToRemove));
  };
  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' && tagInput && suggestions.length > 0) {
      e.preventDefault();
      addTag(suggestions[0]);
    } else if (e.key === 'Backspace' && !tagInput && typeTags.length > 0) {
      removeTag(typeTags[typeTags.length - 1]);
    }
  };

  // Add effect to close suggestions on outside click
  useEffect(() => {
    if (!showSuggestions) return;
    function handleClickOutside(event) {
      if (
        tagInputContainerRef.current &&
        !tagInputContainerRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSuggestions]);

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="max-w-4xl mx-auto p-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="space-y-4">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto p-4">
        <h1 className="text-3xl font-semibold text-gray-800 mb-6">Find Your Perfect Fries</h1>
        {/* Filters Section - now at the top */}
        <div className="bg-white/65 backdrop-blur-sm p-4 rounded-xl border border-white/50 mb-6">
          <h2 className="text-lg font-medium text-gray-800 mb-4">Filters</h2>
          <div className="flex flex-col gap-2">
            {renderRatingSelector('length', 'Length')}
            {renderRatingSelector('thickness', 'Thickness')}
            {renderRatingSelector('crispiness', 'Crispiness')}
            {renderRatingSelector('saltiness', 'Saltiness')}
            {renderRatingSelector('darkness', 'Darkness')}
            {/* Fry type tags filter UI (moved below other filters, matches PostForm) */}
            <TagTypeDropdown
              allFryTypes={allFryTypes}
              selectedTags={typeTags}
              setSelectedTags={setTypeTags}
              placeholder="Type of fries"
              className="z-50 mt-2"
            />
            {/* End fry type tags filter UI */}
          </div>
        </div>
        {/* Results Section */}
        <div className="space-y-4 z-0 relative">
          {filteredLocations.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No locations match your filters. Try adjusting your criteria.</p>
            </div>
          ) : (
            filteredLocations.map((location) => (
              <SearchResult
                key={location.id}
                location={location}
                selectedCategories={selectedCategories}
                createLocationSlug={createLocationSlug}
                images={locationImages[location.name] || []}
                expanded={expandedCard === location.id}
                onExpand={() => {
                  setExpandedCard(expandedCard === location.id ? null : location.id);
                  if (!locationImages[location.name]) {
                    fetchLocationImages(location.name);
                  }
                }}
              />
            ))
          )}
        </div>
      </main>
    </>
  );
} 