import Image from 'next/image';
import { formatRelativeTime } from '../lib/utils';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import ReactionPicker from './ReactionPicker';
import CategoryDisplay from './CategoryDisplay';
import MyReactions from './MyReactions';

export default function MyPostCard({ post }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAllGifs, setShowAllGifs] = useState(false);
  const [reactions, setReactions] = useState([]);
  const [showReactions, setShowReactions] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const menuRef = useRef(null);
  
  const overallRatingDescriptors = {
    1: "Yikes",
    2: "Meh",
    3: "Solid",
    4: "Crack",
    5: "F***in Slaying"
  };

  const specificRatingDescriptors = {
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

  const hasSpecificRatings = post.length || post.thickness || post.crispiness || 
                           post.crunchiness || post.saltiness || post.darkness;

  const fetchReactions = async () => {
    try {
      const reactionsRef = collection(db, 'reactions');
      const q = query(
        reactionsRef, 
        where('postId', '==', post.id),
        where('type', 'in', ['emoji', 'gif'])
      );
      const snapshot = await getDocs(q);
      const reactionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt
      }));
      
      // Filter out fire reactions from the general reactions (GIFs only)
      const otherReactions = reactionsData
        .filter(r => r.type === 'gif')
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setReactions(otherReactions);
    } catch (error) {
      console.error('Error fetching reactions:', error);
    }
  };

  useEffect(() => {
    fetchReactions();
  }, [post.id]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleNewReaction = (newReaction) => {
    setReactions(prev => [newReaction, ...prev]);
  };

  const renderStars = (rating) => {
    return Array(5).fill(0).map((_, index) => (
      <svg
        key={index}
        className={`w-10 h-10 ${index < rating ? 'text-yellow-500' : 'text-gray-300'} -mr-1`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ));
  };

  const getEstablishmentName = (location) => {
    return location.split(',')[0].trim();
  };

  const createLocationSlug = (location) => {
    return getEstablishmentName(location)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const renderRatingBar = (label, value, descriptors) => {
    if (!value) return null;
    
    return (
      <div className="bg-white/60 backdrop-blur-sm rounded-md border border-white/50 h-[40px]">
        <div className="flex items-center h-full gap-2 px-3">
          <span className="text-sm text-gray-500 w-20">{label}</span>
          <div className="flex gap-1 flex-1">
            {[1, 2, 3, 4, 5].map((num) => (
              <div
                key={num}
                className={`w-full h-6 rounded-md flex items-center justify-center text-xs font-medium transition-colors
                  ${value === num 
                    ? 'bg-yellow-500 text-white' 
                    : 'bg-white text-gray-700'
                  }`}
              />
            ))}
          </div>
          <span className="text-sm font-medium text-gray-700 w-20 text-right">
            {descriptors[Math.round(value)]}
          </span>
        </div>
      </div>
    );
  };

  const visibleReactions = showAllGifs ? reactions : reactions.slice(0, 1);
  const hiddenReactionsCount = reactions.length - 1;

  const handleDeletePost = async () => {
    try {
      // Get the location document
      const locationsRef = collection(db, 'locations');
      const locationQuery = query(locationsRef, where('name', '==', post.locationName));
      const locationSnapshot = await getDocs(locationQuery);
      
      if (!locationSnapshot.empty) {
        const locationDoc = locationSnapshot.docs[0];
        const locationData = locationDoc.data();
        const newTotalReviews = locationData.totalReviews - 1;
        
        // Calculate new averages
        const calculateNewAverage = (currentAvg, currentTotal, value) => {
          if (currentTotal <= 1) return 0;
          return ((currentAvg * currentTotal) - value) / (currentTotal - 1);
        };

        // Calculate new averages for all metrics
        const updates = {
          totalReviews: newTotalReviews,
          averageOverall: calculateNewAverage(locationData.averageOverall, locationData.totalReviews, post.overall),
          averageLength: post.length ? calculateNewAverage(locationData.averageLength, locationData.totalReviews, post.length) : locationData.averageLength,
          averageThickness: post.thickness ? calculateNewAverage(locationData.averageThickness, locationData.totalReviews, post.thickness) : locationData.averageThickness,
          averageCrispiness: post.crispiness ? calculateNewAverage(locationData.averageCrispiness, locationData.totalReviews, post.crispiness) : locationData.averageCrispiness,
          averageSaltiness: post.saltiness ? calculateNewAverage(locationData.averageSaltiness, locationData.totalReviews, post.saltiness) : locationData.averageSaltiness,
          averageDarkness: post.darkness ? calculateNewAverage(locationData.averageDarkness, locationData.totalReviews, post.darkness) : locationData.averageDarkness,
          lastUpdated: new Date().toISOString()
        };

        // Update recentImages array to remove the deleted post's image
        if (locationData.recentImages) {
          updates.recentImages = locationData.recentImages.filter(img => img.imageUrl !== post.imageUrl);
        }

        // Update the location document
        await updateDoc(locationDoc.ref, updates);
      }

      // Delete the post
      await deleteDoc(doc(db, 'posts', post.id));
      
      // Close modals
      setShowDeleteModal(false);
      setShowMenu(false);
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  return (
    <>
    <div className="border rounded-xl overflow-hidden bg-white/65 backdrop-blur-sm">
      <div className="p-4">
        <div className="relative">
          <img 
            src={post.imageUrl} 
            alt={post.locationName}
            className="w-full h-64 object-cover rounded-lg"
          />
            <div className="absolute top-2 right-2">
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-2 bg-black/30 hover:bg-black/50 rounded-full transition-colors"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
                {showMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                    <button
                      onClick={() => {
                        setShowDeleteModal(true);
                        setShowMenu(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    >
                      Delete Post
                    </button>
                  </div>
                )}
              </div>
            </div>
          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent rounded-b-lg">
            <div className="flex items-center gap-2">
              <div className="flex gap-0">
                {renderStars(post.overall)}
              </div>
              <span className="text-sm font-medium text-white">
                {overallRatingDescriptors[Math.round(post.overall)]}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="px-4 pb-4">
        <div className="mt-1">
          {post.types && post.types.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {post.types.map((type, index) => (
                <span 
                  key={index}
                  className="inline-flex items-center px-3 py-1 text-sm bg-white/60 backdrop-blur-sm text-gray-700 rounded-full border border-gray-400 capitalize font-normal"
                >
                  {type}
                </span>
              ))}
            </div>
          )}
          <h2 className="text-2xl font-semibold text-gray-800">
            <Link href={`/location/${createLocationSlug(post.locationName)}`} className="hover:text-gray-600 transition-colors">
              {getEstablishmentName(post.locationName)}
            </Link>
            {post.menuName && (
              <span className="text-2xl font-light text-gray-600">
                {' - '}{post.menuName}
              </span>
            )}
          </h2>
          <p className="text-gray-600 mb-2">{post.description}</p>
        </div>

        {hasSpecificRatings && (
          <div className="space-y-1">
            <CategoryDisplay
              length={post.length}
              thickness={post.thickness}
              crispiness={post.crispiness}
              crunchiness={post.crunchiness}
              saltiness={post.saltiness}
              darkness={post.darkness}
            />
          </div>
        )}

        <div className="mt-4 flex items-center justify-between">
          {/* <ReactionPicker
            postId={post.id}
            onReactionAdded={handleNewReaction}
            hideGifButton={true}
          /> */}
        </div>

        <MyReactions 
          postId={post.id} 
          postCreatedAt={post.createdAt} 
          postAuthorId={post.userId}
        />
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Delete Post</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this post? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeletePost}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
} 