import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, limit, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import Image from 'next/image';

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

      const querySnapshot = await getDocs(q);
      const images = querySnapshot.docs.map(doc => ({
        id: doc.id,
        imageUrl: doc.data().imageUrl,
        createdAt: doc.data().createdAt
      }));

      setLocationImages(prev => ({
        ...prev,
        [locationName]: images
      }));
    } catch (error) {
      console.error('Error fetching location images:', error);
    }
  };

  const fetchBestOverall = async () => {
    try {
      console.log('Fetching best overall fries...');
      const locationsRef = collection(db, 'locations');
      const q = query(
        locationsRef,
        orderBy('averageOverall', 'desc'),
        orderBy('totalReviews', 'desc'),
        limit(5)
      );

      const querySnapshot = await getDocs(q);
      console.log('Best overall query snapshot:', querySnapshot);
      const locations = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('Best overall locations:', locations);

      setTopFries(locations);
    } catch (error) {
      console.error('Error fetching best overall fries:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrending = async () => {
    try {
      console.log('Fetching trending fries...');
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const locationsRef = collection(db, 'locations');
      const q = query(
        locationsRef,
        where('lastUpdated', '>=', oneWeekAgo.toISOString()),
        orderBy('lastUpdated', 'desc'),
        orderBy('averageOverall', 'desc'),
        limit(5)
      );

      const querySnapshot = await getDocs(q);
      console.log('Trending query snapshot:', querySnapshot);
      const locations = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('Trending locations:', locations);

      setTopFries(locations);
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
    switch (activeTab) {
      case 'best-overall':
        fetchBestOverall();
        break;
      case 'trending':
        fetchTrending();
        break;
      case 'most-reviewed':
        fetchMostReviewed();
        break;
    }
  }, [activeTab]);

  useEffect(() => {
    if (expandedCard) {
      const location = topFries.find(fry => fry.id === expandedCard)?.locationName;
      if (location && !locationImages[location]) {
        fetchLocationImages(location);
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
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fry.name)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-gray-500 hover:text-yellow-500 transition-colors mt-4"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                    </svg>
                    <span className="text-sm">Open in Google Maps</span>
                  </a>
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
                    <div className="space-y-3">
                      <div className="relative aspect-[4/3] rounded-lg overflow-hidden">
                        <img
                          src={fry.recentImages[selectedImageIndex[fry.id] || 0]}
                          alt="Recent fries from this location"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="grid grid-cols-5 gap-1.5">
                        {fry.recentImages.map((image, index) => (
                          <button
                            key={index}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedImageIndex(prev => ({
                                ...prev,
                                [fry.id]: index
                              }));
                            }}
                            className={`relative aspect-square rounded-lg overflow-hidden transition-opacity ${
                              index === (selectedImageIndex[fry.id] || 0) ? 'ring-2 ring-yellow-500' : 'hover:opacity-80'
                            }`}
                          >
                            <img
                              src={image}
                              alt="Recent fries from this location"
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
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