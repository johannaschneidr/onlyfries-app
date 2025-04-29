import { useState, useEffect, useCallback } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, deleteDoc, query, where, getDocs } from 'firebase/firestore';
import { getAuth } from "firebase/auth";
import { connectAuthEmulator } from "firebase/auth";

export default function ReactionPicker({ postId, onReactionAdded }) {
  const [showGifSearch, setShowGifSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [gifs, setGifs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fireCount, setFireCount] = useState(0);
  const [hasVoted, setHasVoted] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchFireCount();
  }, [postId]);

  const fetchFireCount = async () => {
    try {
      const reactionsRef = collection(db, 'reactions');
      const q = query(
        reactionsRef,
        where('postId', '==', postId),
        where('type', '==', 'emoji'),
        where('content', '==', '🔥')
      );
      const snapshot = await getDocs(q);
      setFireCount(snapshot.size);
      setHasVoted(snapshot.size > 0);
    } catch (error) {
      console.error('Error fetching fire count:', error);
    }
  };

  const handleFireClick = async () => {
    try {
      const reactionsRef = collection(db, 'reactions');
      const q = query(
        reactionsRef,
        where('postId', '==', postId),
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
          postId: postId,
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

  const searchGifs = useCallback(async (query) => {
    if (!query) {
      setGifs([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/giphy/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch GIFs');
      }
      const data = await response.json();
      
      if (!data || !data.data) {
        throw new Error('Invalid response format');
      }

      setGifs(data.data.slice(0, 9));
    } catch (error) {
      console.error('Error searching GIFs:', error);
      setError('Failed to load GIFs. Please try again.');
      setGifs([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery) {
        searchGifs(searchQuery);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchGifs]);

  const handleGifClick = async (gif) => {
    try {
      const reactionsRef = collection(db, 'reactions');
      const docRef = await addDoc(reactionsRef, {
        postId: postId,
        type: 'gif',
        content: gif.images.original.url,
        createdAt: new Date().toISOString()
      });

      const newReaction = {
        id: docRef.id,
        postId: postId,
        type: 'gif',
        content: gif.images.original.url,
        createdAt: new Date().toISOString()
      };

      onReactionAdded(newReaction);
      setSearchQuery('');
      setGifs([]);
      setShowGifSearch(false);
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setGifs([]);
    setShowGifSearch(false);
  };

  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier('recaptcha-container', {
        size: 'invisible',
        callback: () => {},
      }, auth);
    }
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
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
        <button
          onClick={() => setShowGifSearch(!showGifSearch)}
          className="flex items-center gap-1 px-2 py-1 rounded-full border border-gray-200 bg-white/60 hover:bg-white/80 transition-colors"
        >
          <span className="text-base">🎬</span>
          <span className="text-xs font-medium">GIF</span>
        </button>
      </div>

      {showGifSearch && (
        <>
          <div className="relative flex-grow mt-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="React with a GIF..."
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex items-center">
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              ) : searchQuery ? (
                <button
                  onClick={handleClearSearch}
                  className="text-gray-400 hover:text-gray-600 transition-colors inline-flex items-center justify-center"
                  aria-label="Clear search"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              ) : null}
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center">
              {error}
            </div>
          )}

          {(searchQuery || gifs.length > 0) && (
            <div className="pt-3 pb-6">
              <div className="grid grid-cols-3 gap-2">
                {isLoading && gifs.length === 0 ? (
                  <div className="col-span-3 py-4 text-center text-gray-500">
                    Searching...
                  </div>
                ) : gifs.length > 0 ? (
                  gifs.map((gif) => (
                    <button
                      key={gif.id}
                      onClick={() => handleGifClick(gif)}
                      className="aspect-square rounded-lg overflow-hidden hover:ring-2 hover:ring-yellow-500 transition-all"
                    >
                      <img
                        src={gif.images.fixed_height.url}
                        alt={gif.title}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))
                ) : searchQuery ? (
                  <div className="col-span-3 py-4 text-center text-gray-500">
                    No GIFs found. Try a different search term.
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
} 