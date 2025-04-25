import Image from 'next/image';
import { formatRelativeTime } from '../lib/utils';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, addDoc, deleteDoc } from 'firebase/firestore';
import ReactionPicker from './ReactionPicker';

export default function PostCard({ post }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAllGifs, setShowAllGifs] = useState(false);
  const [reactions, setReactions] = useState([]);
  const [fireCount, setFireCount] = useState(0);
  const [hasVoted, setHasVoted] = useState(false);
  
  const hasSpecificRatings = post.length || post.thickness || post.crispiness || 
                           post.crunchiness || post.saltiness || post.darkness;

  useEffect(() => {
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
          createdAt: doc.data().createdAt // Ensure createdAt is included
        }));
        
        // Count fire emoji reactions
        const fires = reactionsData.filter(r => r.type === 'emoji' && r.content === '🔥');
        setFireCount(fires.length);
        setHasVoted(fires.length > 0);

        // Filter out fire reactions from the general reactions (GIFs only)
        const otherReactions = reactionsData
          .filter(r => r.type === 'gif')
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setReactions(otherReactions);
      } catch (error) {
        console.error('Error fetching reactions:', error);
      }
    };

    fetchReactions();
  }, [post.id]);

  const handleFireClick = async () => {
    try {
      const reactionsRef = collection(db, 'reactions');
      const q = query(
        reactionsRef,
        where('postId', '==', post.id),
        where('type', '==', 'emoji'),
        where('content', '==', '🔥')
      );
      
      const existingReaction = await getDocs(q);
      if (!existingReaction.empty) {
        await deleteDoc(existingReaction.docs[0].ref);
        setFireCount(prev => prev - 1);
        setHasVoted(false);
      } else {
        await addDoc(reactionsRef, {
          postId: post.id,
          type: 'emoji',
          content: '🔥',
          createdAt: new Date().toISOString()
        });
        setFireCount(prev => prev + 1);
        setHasVoted(true);
      }
    } catch (error) {
      console.error('Error toggling fire reaction:', error);
    }
  };

  const renderStars = (rating) => {
    return Array(5).fill(0).map((_, index) => (
      <svg
        key={index}
        className={`w-8 h-8 ${index < rating ? 'text-yellow-500' : 'text-gray-300'}`}
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

  const visibleReactions = showAllGifs ? reactions : reactions.slice(0, 2);
  const hiddenReactionsCount = reactions.length - 2;

  return (
    <div className="border rounded-xl overflow-hidden bg-white/65 backdrop-blur-sm">
      <div className="p-4">
        <img 
          src={post.imageUrl} 
          alt={post.locationName}
          className="w-full h-64 object-cover rounded-lg"
        />
      </div>
      
      <div className="px-4 pb-4">
        <div className="flex gap-0.5">
          {renderStars(post.overall)}
        </div>
        <div className="mt-1">
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
          {post.types && post.types.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-1">
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
        </div>
        <p className="text-gray-600 mb-2">{post.description}</p>

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
              {isExpanded ? 'Less' : 'More'}
            </button>
            
            {isExpanded && (
              <div className="space-y-1">
                {renderRatingBar("Length", post.length, ratingDescriptors.length)}
                {renderRatingBar("Thickness", post.thickness, ratingDescriptors.thickness)}
                {renderRatingBar("Crispiness", post.crispiness, ratingDescriptors.crispiness)}
                {renderRatingBar("Crunchiness", post.crunchiness, ratingDescriptors.crunchiness)}
                {renderRatingBar("Saltiness", post.saltiness, ratingDescriptors.saltiness)}
                {renderRatingBar("Darkness", post.darkness, ratingDescriptors.darkness)}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-gray-100">
        <div className="p-4 space-y-4">
          <div className="flex items-center">
            <button
              onClick={handleFireClick}
              className={`flex items-center gap-1 px-2 py-1 rounded-full border transition-colors ${
                hasVoted 
                  ? 'bg-yellow-50 border-yellow-200 text-yellow-600' 
                  : 'bg-white/60 hover:bg-white/80 border-gray-200'
              }`}
            >
              <span className="text-base">🔥</span>
              {fireCount > 0 && (
                <span className="text-xs font-medium">{fireCount}</span>
              )}
            </button>
            <div className="flex items-center gap-2 ml-auto mr-3">
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

          <div className="w-full">
            <ReactionPicker
              postId={post.id}
              onClose={() => {}}
            />
          </div>

          {reactions.length > 0 && (
            <div className="space-y-3">
              {visibleReactions.map((reaction) => (
                <div
                  key={reaction.id}
                  className="p-3 space-y-3"
                >
                  <div className="flex items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center">
                        <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {reaction.username || 'User'}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500 ml-auto">
                      {formatRelativeTime(reaction.createdAt)}
                    </span>
                  </div>
                  <img
                    src={reaction.content}
                    alt="Reaction GIF"
                    className="rounded-lg w-full max-h-48 object-cover"
                  />
                </div>
              ))}

              {reactions.length > 2 && (
                <button
                  onClick={() => setShowAllGifs(!showAllGifs)}
                  className="w-full py-2 px-3 text-sm font-medium text-gray-600 hover:text-gray-900 bg-white/60 backdrop-blur-sm rounded-lg border border-gray-200 flex items-center justify-center gap-1 transition-colors"
                >
                  <span>
                    {showAllGifs ? 'Show Less' : `Show ${hiddenReactionsCount} More Reaction${hiddenReactionsCount > 1 ? 's' : ''}`}
                  </span>
                  <svg
                    className={`w-4 h-4 transition-transform ${showAllGifs ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 