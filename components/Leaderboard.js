import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, limit, getDocs, addDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import ImageGallery from './ImageGallery';
import Link from 'next/link';
import RedButton from './RedButton';
import { sortLocationsByCompositeScore, sortLocationsByTrendingScore } from '../lib/bayesianRanking';
import CategoryDisplay from './CategoryDisplay';

export default function Leaderboard() {
  const [topFries, setTopFries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedCard, setExpandedCard] = useState(null);
  const [locationImages, setLocationImages] = useState({});
  const [selectedImageIndex, setSelectedImageIndex] = useState({});
  const [activeTab, setActiveTab] = useState('best-overall');

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
      <div className="bg-white rounded-xl p-6" style={{ borderWidth: '3px', borderStyle: 'solid', borderColor: 'black' }}>
        <h2 className="text-xl font-semibold mb-4 font-baloo2">Loading...</h2>
      </div>
    );
  }

  return (
    <div>
      <div className="flex">
        <button
          onClick={() => setActiveTab('best-overall')}
          className={`flex-1 text-base font-medium whitespace-nowrap px-4 py-2 font-baloo2 ${
            activeTab === 'best-overall' ? 'text-gray-800' : 'text-black'
          }`}
          style={{ 
            backgroundColor: activeTab === 'best-overall' ? 'white' : 'var(--light-blue-custom)',
            border: '3px solid black',
            borderBottom: 'none',
            marginBottom: '0px',
            borderTopLeftRadius: '12px',
            borderTopRightRadius: '12px',
            cursor: 'pointer',
            outline: 'none',
            boxSizing: 'border-box',
            height: '48px'
          }}
          onFocus={(e) => e.target.style.outline = 'none'}
        >
          Best Overall
        </button>
        <button
          onClick={() => setActiveTab('trending')}
          className={`flex-1 text-base font-medium whitespace-nowrap px-4 py-2 font-baloo2 ${
            activeTab === 'trending' ? 'text-gray-800' : 'text-black'
          }`}
          style={{ 
            backgroundColor: activeTab === 'trending' ? 'white' : 'var(--light-blue-custom)',
            border: '3px solid black',
            borderBottom: 'none',
            marginBottom: '0px',
            marginLeft: '-3px',
            borderTopLeftRadius: '12px',
            borderTopRightRadius: '12px',
            cursor: 'pointer',
            outline: 'none',
            boxSizing: 'border-box',
            height: '48px'
          }}
          onFocus={(e) => e.target.style.outline = 'none'}
        >
          Trending
        </button>
        <button
          onClick={() => setActiveTab('most-reviewed')}
          className={`flex-1 text-base font-medium whitespace-nowrap px-4 py-2 font-baloo2 ${
            activeTab === 'most-reviewed' ? 'text-gray-800' : 'text-black'
          }`}
          style={{ 
            backgroundColor: activeTab === 'most-reviewed' ? 'white' : 'var(--light-blue-custom)',
            border: '3px solid black',
            borderBottom: 'none',
            marginBottom: '0px',
            marginLeft: '-3px',
            borderTopLeftRadius: '12px',
            borderTopRightRadius: '12px',
            cursor: 'pointer',
            outline: 'none',
            boxSizing: 'border-box',
            height: '48px'
          }}
          onFocus={(e) => e.target.style.outline = 'none'}
        >
          Most Reviews
        </button>
      </div>
      <div 
        className="bg-white rounded-b-xl" 
        style={{ 
          borderWidth: '3px', 
          borderStyle: 'solid', 
          borderColor: 'black',
          borderTop: 'none'
        }}
      >
      <div>
        {topFries.map((fry, index) => (
          <div 
            key={fry.id} 
            className={`flex flex-col gap-2 px-4 pt-3 pb-2 ${index < topFries.length - 1 ? 'border-b' : ''}`}
            style={{
              ...(index < topFries.length - 1 ? { borderBottomColor: 'black', borderBottomWidth: '3px' } : {}),
              ...(index === 0 ? { borderTopColor: 'black', borderTopWidth: '3px' } : {})
            }}
          >
            <div 
              className="flex items-start gap-1 cursor-pointer"
              onClick={() => setExpandedCard(expandedCard === fry.id ? null : fry.id)}
            >
              <div className="flex-1">
                <div className="flex flex-col gap-0">
                  <h3 className="font-medium text-2xl font-baloo2">
                    {fry.name.split(',')[0]}
                  </h3>
                  <span className="text-xs text-gray-500 font-baloo2 -mt-1">
                    {fry.totalReviews} review{fry.totalReviews !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex flex-col items-end">
                  <span className="w-10 h-10 flex items-center justify-center text-lg font-semibold text-black rounded-full p-2 font-baloo2" style={{ backgroundColor: 'var(--yellow-custom)' }}>
                    {fry.averageOverall.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
            {expandedCard === fry.id && (
              <div className="flex items-center mt-2 mb-6 w-full" style={{ gap: '16px' }}>
                <Link
                  href={`/location/${fry.name.split(',')[0].trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`}
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
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fry.name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1 text-black transition-colors px-4 py-3 rounded-full flex-1"
                  style={{ borderWidth: '3px', borderStyle: 'solid', borderColor: 'black' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                  </svg>
                  <span className="text-sm font-baloo2">Google Maps</span>
                </a>
              </div>
            )}
            {expandedCard === fry.id && (
              <>
                <div className="space-y-3 mt-2">
                  {fry.averageLength || fry.averageThickness || fry.averageCrispiness || fry.averageSaltiness || fry.averageDarkness ? (
                    <>
                      <CategoryDisplay
                        length={Math.round(fry.averageLength)}
                        thickness={Math.round(fry.averageThickness)}
                        crispiness={Math.round(fry.averageCrispiness)}
                        saltiness={Math.round(fry.averageSaltiness)}
                        darkness={Math.round(fry.averageDarkness)}
                      />
                    </>
                  ) : (
                    <p className="text-gray-500 text-center py-2 font-baloo2">No Details at this time</p>
                  )}
                </div>
                {((locationImages[fry.locationName] && locationImages[fry.locationName].length > 0) || (fry.recentImages && fry.recentImages.length > 0)) && (
                  <div className="mt-4">
                    <h4 className="text-lg font-bold text-black mt-6 mb-2 font-baloo2 uppercase">Recent Uploads</h4>
                    <ImageGallery
                      images={locationImages[fry.locationName] || fry.recentImages}
                      selectedIndex={selectedImageIndex[fry.id] || 0}
                      onSelect={idx => setSelectedImageIndex(prev => ({ ...prev, [fry.id]: idx }))}
                    />
                  </div>
                )}
                <button
                  onClick={() => setExpandedCard(null)}
                  className="flex items-center gap-2 mt-4 hover:text-gray-700 transition-colors font-quattrocento underline"
                  style={{ color: 'var(--red-custom)' }}
                >
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                  </svg>
                  COLLAPSE
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
    </div>
  );
} 