import Image from 'next/image';
import { formatRelativeTime } from '../lib/utils';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, addDoc, deleteDoc } from 'firebase/firestore';
import ReactionPicker from './ReactionPicker';
import CategoryDisplay from './CategoryDisplay';

export default function PostCard({ post, openLoginModal }) {
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
    if (newReaction.type === 'gif') {
      setShowReactions(true);
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="absolute top-2 right-2 w-14 h-14">
        <img
          src="/assets/Star.png"
          alt="Star"
          className="w-14 h-14"
        />
        <div className="absolute inset-0 flex items-center justify-center pt-1">
          <span className="text-2xl font-bold text-black font-baloo2">{Math.round(rating)}</span>
        </div>
      </div>
    );
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

  const visibleReactions = showAllGifs ? reactions : reactions.slice(0, 1);
  const hiddenReactionsCount = reactions.length - 1;

  return (
    <div className="overflow-hidden bg-white border-black" style={{ borderWidth: '3px', borderStyle: 'solid' }}>
      <div className="flex items-center justify-between py-2 px-4 mb-4 border-black" style={{ background: 'var(--yellow-custom)', borderBottomWidth: '3px', borderBottomStyle: 'solid' }}>
        <div className="flex items-center gap-2">
          <span className="text-sm text-black font-bold font-baloo2">{post.username || 'Anonymous'}</span>
        </div>
        <span className="text-sm text-black font-baloo2">
          {formatRelativeTime(post.createdAt)}
        </span>
      </div>
      <div className="px-4 pb-4 pt-0">
        <div className="relative rounded-xl overflow-hidden border-black" style={{ borderWidth: '3px', borderStyle: 'solid' }}>
          <img 
            src={post.imageUrl} 
            alt={post.locationName}
            className="w-full h-64 object-cover"
          />
          {renderStars(post.overall)}
        </div>

        <div className="mt-1">
          <h2 className="text-3xl font-semibold text-gray-800 mb-2 mt-3 font-baloo2">
            <Link href={`/location/${createLocationSlug(post.locationName)}`} className="hover:text-gray-600 transition-colors font-baloo2">
              {getEstablishmentName(post.locationName)}
            </Link>
            {post.menuName && (
              <span className="text-2xl font-light text-gray-600 font-baloo2">
                {' - '}{post.menuName}
              </span>
            )}
          </h2>
          {post.types && post.types.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2 mt-0">
              {post.types.map((type, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 text-sm capitalize font-bold font-baloo2"
                  style={{ color: 'var(--yellow-custom)', background: 'var(--red-custom)' }}
                >
                  {type}
                </span>
              ))}
            </div>
          )}
          <p className="text-gray-600 mb-2 font-baloo2">{post.description}</p>
        </div>

        {hasSpecificRatings && (
          <div className="space-y-1">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full py-1 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors flex items-start gap-1 rounded-md font-baloo2"
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

        <div className="mt-4 flex items-center justify-between">
          <ReactionPicker
            postId={post.id}
            onReactionAdded={handleNewReaction}
            openLoginModal={openLoginModal}
          />
        </div>

          {reactions.length > 0 && (
            <div className="mt-4">
              {!showReactions ? (
                <button
                  onClick={() => setShowReactions(true)}
                  className="w-full py-2 px-3 text-sm font-medium text-gray-600 hover:text-gray-900 bg-white/0 backdrop-blur-sm border border-gray-200 flex items-center justify-center gap-1 transition-colors font-baloo2"
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
                        className="w-full object-contain"
                      />
                      <div className="flex justify-end items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 font-baloo2">
                          {reaction.username || 'User'}
                        </span>
                        <span className="text-sm text-gray-500 font-baloo2">
                          {formatRelativeTime(reaction.createdAt)}
                        </span>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => setShowReactions(false)}
                    className="w-full py-2 px-3 text-sm font-medium text-gray-600 hover:text-gray-900 bg-white/0 backdrop-blur-sm border border-gray-200 flex items-center justify-center gap-1 transition-colors font-baloo2"
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
  );
} 