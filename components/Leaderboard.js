import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, limit, getDocs, addDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import ImageGallery from './ImageGallery';
import Link from 'next/link';
import { sortLocationsByCompositeScore, sortLocationsByTrendingScore } from '../lib/bayesianRanking';

export default function Leaderboard() {
  const [topFries, setTopFries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedCard, setExpandedCard] = useState(null);
  const [locationImages, setLocationImages] = useState({});
  const [selectedImageIndex, setSelectedImageIndex] = useState({});
  const [activeTab, setActiveTab] = useState('best-overall');

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

  const fetchLocationImages = async (locationName) => {
    try {
      const friesRef = collection(db, 'posts');
      const q = query(
        friesRef,
        where('locationName', '==', locationName),
        orderBy('createdAt', 'desc'),
        limit(5)
      );

      // Use onSnapshot instead of getDocs for real-time updates
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const images = snapshot.docs.map(doc => ({
        id: doc.id,
        imageUrl: doc.data().imageUrl,
        createdAt: doc.data().createdAt,
        username: doc.data().username || 'Anonymous'
      }));

      setLocationImages(prev => ({
        ...prev,
        [locationName]: images
      }));
      });

      // Store unsubscribe function to clean up later
      return unsubscribe;
    } catch (error) {
      console.error('Error fetching location images:', error);
    }
  };

  const fetchBestOverall = async () => {
    try {
      console.log('Fetching best overall fries...');
      const locationsRef = collection(db, 'locations');
      
      // Fetch all locations instead of using Firestore ordering
      // We'll sort them client-side using the Bayesian algorithm
      const q = query(locationsRef);
      
      const querySnapshot = await getDocs(q);
      console.log('Best overall query snapshot:', querySnapshot);
      const locations = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort locations using Bayesian ranking algorithm
      const sortedLocations = sortLocationsByCompositeScore(locations);
      
      // Take top 5
      const topLocations = sortedLocations.slice(0, 5);
      
      console.log('Best overall locations (sorted by Bayesian ranking):', topLocations);

      setTopFries(topLocations);
    } catch (error) {
      console.error('Error fetching best overall fries:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrending = async () => {
    try {
      console.log('Fetching trending fries...');
      
      const locationsRef = collection(db, 'locations');
      // Fetch all locations instead of filtering by lastUpdated
      // The trending algorithm will handle time-based ranking
      const q = query(locationsRef);

      const querySnapshot = await getDocs(q);
      console.log('Trending query snapshot:', querySnapshot);
      const locations = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort locations using trending ranking algorithm with time decay
      const sortedLocations = sortLocationsByTrendingScore(locations);
      
      // Take top 5
      const topLocations = sortedLocations.slice(0, 5);
      
      console.log('Trending locations (sorted by trending score with time decay):', topLocations);

      setTopFries(topLocations);
    } catch (error) {
      console.error('Error fetching trending fries:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMostReviewed = async () => {
    try {
      console.log('Fetching most reviewed fries...');
      const locationsRef = collection(db, 'locations');
      const q = query(
        locationsRef,
        orderBy('totalReviews', 'desc'),
        limit(5)
      );

      const querySnapshot = await getDocs(q);
      console.log('Most reviewed query snapshot:', querySnapshot);
      const locations = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('Most reviewed locations:', locations);

      setTopFries(locations);
    } catch (error) {
      console.error('Error fetching most reviewed fries:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteTestLocations = async () => {
    try {
      const locationsRef = collection(db, 'locations');
      const q = query(locationsRef, where('name', '==', 'Test Location'));
      const querySnapshot = await getDocs(q);
      
      const deletePromises = querySnapshot.docs.map(doc => {
        console.log('Deleting test location:', doc.id);
        return deleteDoc(doc.ref);
      });
      
      await Promise.all(deletePromises);
      console.log('All test locations deleted');
    } catch (error) {
      console.error('Error deleting test locations:', error);
    }
  };

  useEffect(() => {
    // Delete test locations when component mounts
    deleteTestLocations();
    
    setLoading(true);
    let unsubscribeFunctions = [];

    const setupData = async () => {
    switch (activeTab) {
      case 'best-overall':
          await fetchBestOverall();
        break;
      case 'trending':
          await fetchTrending();
        break;
      case 'most-reviewed':
          await fetchMostReviewed();
        break;
    }
    };

    setupData();

    // Cleanup function
    return () => {
      unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    };
  }, [activeTab]);

  useEffect(() => {
    if (expandedCard) {
      const location = topFries.find(fry => fry.id === expandedCard)?.locationName;
      if (location && !locationImages[location]) {
        const unsubscribe = fetchLocationImages(location);
        if (unsubscribe) {
          // Store unsubscribe function
          unsubscribeFunctions.push(unsubscribe);
        }
        setSelectedImageIndex(prev => ({
          ...prev,
          [location]: 0
        }));
      }
    }
  }, [expandedCard, topFries]);

  if (loading && topFries.length === 0) {
    return (
      <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4">Loading...</h2>
      </div>
    );
  }

  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4">
      <div className="flex gap-4 mb-4">
        <button
          onClick={() => setActiveTab('best-overall')}
          className={`text-base font-medium text-gray-700 whitespace-nowrap ${
            activeTab === 'best-overall' ? 'text-yellow-500' : 'hover:text-gray-900'
          }`}
        >
          Best Overall
        </button>
        <button
          onClick={() => setActiveTab('trending')}
          className={`text-base font-medium text-gray-700 whitespace-nowrap ${
            activeTab === 'trending' ? 'text-yellow-500' : 'hover:text-gray-900'
          }`}
        >
          Trending
        </button>
        <button
          onClick={() => setActiveTab('most-reviewed')}
          className={`text-base font-medium text-gray-700 whitespace-nowrap ${
            activeTab === 'most-reviewed' ? 'text-yellow-500' : 'hover:text-gray-900'
          }`}
        >
          Most Reviews
        </button>
      </div>
      <div className="space-y-1">
        {topFries.map((fry, index) => (
          <div 
            key={fry.id} 
            className="flex flex-col gap-2 py-2 border-b border-gray-200 last:border-b-0"
          >
            <div 
              className="flex items-start gap-3 cursor-pointer"
              onClick={() => setExpandedCard(expandedCard === fry.id ? null : fry.id)}
            >
              <div className="flex-1">
                <div className="flex flex-col gap-1">
                  <h3 className="font-medium text-base">
                    {fry.name.split(',')[0]}
                  </h3>
                  <span className="text-xs text-gray-500">
                    {fry.totalReviews} review{fry.totalReviews !== 1 ? 's' : ''}
                  </span>
                </div>
                {expandedCard === fry.id && (
                  <div className="flex items-center gap-4 mt-4">
                    <Link
                      href={`/location/${fry.name.split(',')[0].trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`}
                      className="flex items-center gap-1 text-gray-500 hover:text-yellow-500 transition-colors"
                      onClick={e => e.stopPropagation()}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 21c-4.418 0-8-4.03-8-9a8 8 0 1116 0c0 4.97-3.582 9-8 9zm0-11a2 2 0 100 4 2 2 0 000-4z" />
                      </svg>
                      <span className="text-sm">Full profile</span>
                    </Link>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fry.name)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-gray-500 hover:text-yellow-500 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                      </svg>
                      <span className="text-sm">Open in Google Maps</span>
                    </a>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex flex-col items-end">
                  <span className="w-10 h-10 flex items-center justify-center text-lg font-semibold bg-yellow-500 text-white rounded-full p-2">
                    {fry.averageOverall.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
            {expandedCard === fry.id && (
              <>
                <div className="space-y-3 mt-2">
                  {fry.averageLength || fry.averageThickness || fry.averageCrispiness || fry.averageSaltiness || fry.averageDarkness ? (
                    <>
                      {renderRatingBar("Length", Math.round(fry.averageLength), ratingDescriptors.length)}
                      {renderRatingBar("Thickness", Math.round(fry.averageThickness), ratingDescriptors.thickness)}
                      {renderRatingBar("Crispiness", Math.round(fry.averageCrispiness), ratingDescriptors.crispiness)}
                      {renderRatingBar("Saltiness", Math.round(fry.averageSaltiness), ratingDescriptors.saltiness)}
                      {renderRatingBar("Darkness", Math.round(fry.averageDarkness), ratingDescriptors.darkness)}
                    </>
                  ) : (
                    <p className="text-gray-500 text-center py-2">No Details at this time</p>
                  )}
                </div>
                {fry.recentImages && fry.recentImages.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-500 mb-3">Recent Uploads</h4>
                    <ImageGallery
                      images={fry.recentImages}
                      selectedIndex={selectedImageIndex[fry.id] || 0}
                      onSelect={idx => setSelectedImageIndex(prev => ({ ...prev, [fry.id]: idx }))}
                    />
                  </div>
                )}
                <button
                  onClick={() => setExpandedCard(null)}
                  className="flex items-center gap-2 mt-4 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                  </svg>
                  Collapse
                </button>
              </>
            )}
          </div>
        ))}
        {topFries.length === 0 && (
          <p className="text-gray-600 text-center">No fries rated yet!</p>
        )}
      </div>
    </div>
  );
} 