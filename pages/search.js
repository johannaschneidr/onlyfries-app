import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../components/navbar';
import { getAllLocations } from '../lib/api';
import CategoryAveragesDisplay from '../components/CategoryAveragesDisplay';
import SearchResult from '../components/SearchResult';
import { collection, query as firestoreQuery, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

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
    // Sort by match score
    filtered.sort((a, b) => getMatchScore(a) - getMatchScore(b));
    setFilteredLocations(filtered);
  }, [filters, locations]);

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
              className={`w-full h-6 rounded-md flex items-center justify-center text-xs font-medium transition-colors
                ${filters[category] === num 
                  ? 'bg-yellow-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            />
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
      const images = querySnapshot.docs.map(doc => doc.data().imageUrl);
      setLocationImages(prev => ({ ...prev, [locationName]: images }));
    } catch (error) {
      console.error('Error fetching location images:', error);
    }
  };

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
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Filters Section */}
          <div className="md:col-span-1 bg-white/65 backdrop-blur-sm p-4 rounded-xl border border-white/50">
            <h2 className="text-lg font-medium text-gray-800 mb-4">Filters</h2>

            {renderRatingSelector('length', 'Length')}
            {renderRatingSelector('thickness', 'Thickness')}
            {renderRatingSelector('crispiness', 'Crispiness')}
            {renderRatingSelector('saltiness', 'Saltiness')}
            {renderRatingSelector('darkness', 'Darkness')}
          </div>

          {/* Results Section */}
          <div className="md:col-span-3 space-y-4">
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
        </div>
      </main>
    </>
  );
} 