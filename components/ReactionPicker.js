import { useState, useEffect, useCallback } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, query, where, getDocs, deleteDoc } from 'firebase/firestore';

export default function ReactionPicker({ postId, onClose }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [gifs, setGifs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const searchGifs = useCallback(async (query) => {
    if (!query) {
      setGifs([]);
      return;
    }

    setLoading(true);
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

      setGifs(data.data);
    } catch (error) {
      console.error('Error searching GIFs:', error);
      setError('Failed to load GIFs. Please try again.');
      setGifs([]);
    } finally {
      setLoading(false);
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

  const handleGifClick = async (gifUrl) => {
    try {
      const reactionsRef = collection(db, 'reactions');
      await addDoc(reactionsRef, {
        postId,
        type: 'gif',
        content: gifUrl,
        createdAt: new Date().toISOString(),
        username: 'User' // This should be replaced with actual username when auth is added
      });

      setSearchQuery('');
      setGifs([]);
    } catch (error) {
      console.error('Error adding reaction:', error);
      setError('Failed to add reaction. Please try again.');
    }
  };

  return (
    <div className="space-y-3">
      <div className="relative flex-grow">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search GIFs..."
          className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-yellow-500"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
          {loading ? (
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
        </div>
      </div>

      {error && (
        <div className="text-red-500 text-sm text-center">
          {error}
        </div>
      )}

      {(searchQuery || gifs.length > 0) && (
        <div className="border-t border-gray-100 pt-3">
          <div className="grid grid-cols-3 gap-2 max-h-[240px] overflow-y-auto">
            {loading && gifs.length === 0 ? (
              <div className="col-span-3 py-4 text-center text-gray-500">
                Searching...
              </div>
            ) : gifs.length > 0 ? (
              gifs.map((gif) => (
                <button
                  key={gif.id}
                  onClick={() => handleGifClick(gif.images.fixed_height.url)}
                  className="w-full aspect-square rounded-lg overflow-hidden hover:ring-2 hover:ring-yellow-500 transition-all"
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
    </div>
  );
} 