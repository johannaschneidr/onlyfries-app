import Image from 'next/image';
import { formatRelativeTime } from '../lib/utils';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, addDoc, deleteDoc } from 'firebase/firestore';
import ReactionPicker from './ReactionPicker';
import CategoryDisplay from './CategoryDisplay';

export default function PostCard({ post }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAllGifs, setShowAllGifs] = useState(false);
  const [reactions, setReactions] = useState([]);
  const [showReactions, setShowReactions] = useState(false);
  
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

  return (
    <div className="border rounded-xl overflow-hidden bg-white/65 backdrop-blur-sm">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <span className="text-sm text-gray-600">Username</span>
          </div>
          <span className="text-sm text-gray-500">
            {formatRelativeTime(post.createdAt)}
          </span>
        </div>
        <div className="relative">
          <img 
            src={post.imageUrl} 
            alt={post.locationName}
            className="w-full h-64 object-cover rounded-lg"
          />
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
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full py-1 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors flex items-start gap-1 rounded-md"
            >
              <svg
                className={`w-4 h-4 mt-0.5 transition-transform text-gray-500 ${isExpanded ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              {isExpanded ? 'Hide' : 'Details'}
            </button>
            
            {isExpanded && (
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
          </div>
        )}

        <div className="mt-4">
          <ReactionPicker
            postId={post.id}
            onReactionAdded={handleNewReaction}
          />

          {reactions.length > 0 && (
            <div className="mt-4">
              {!showReactions ? (
                <button
                  onClick={() => setShowReactions(true)}
                  className="w-full py-2 px-3 text-sm font-medium text-gray-600 hover:text-gray-900 bg-white/60 backdrop-blur-sm rounded-lg border border-gray-200 flex items-center justify-center gap-1 transition-colors"
                >
                  <span>Show {reactions.length} Reaction{reactions.length > 1 ? 's' : ''}</span>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              ) : (
                <div className="space-y-4">
                  {reactions.map((reaction) => (
                    <div
                      key={reaction.id}
                      className="space-y-1"
                    >
                      <img
                        src={reaction.content}
                        alt="Reaction GIF"
                        className="rounded-lg w-full object-contain"
                      />
                      <div className="flex justify-end items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">
                          {reaction.username || 'User'}
                        </span>
                        <span className="text-sm text-gray-500">
                          {formatRelativeTime(reaction.createdAt)}
                        </span>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => setShowReactions(false)}
                    className="w-full py-2 px-3 text-sm font-medium text-gray-600 hover:text-gray-900 bg-white/60 backdrop-blur-sm rounded-lg border border-gray-200 flex items-center justify-center gap-1 transition-colors"
                  >
                    <span>Hide Reactions</span>
                    <svg
                      className="w-4 h-4 rotate-180"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 