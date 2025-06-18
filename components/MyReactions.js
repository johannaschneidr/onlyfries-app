import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, deleteDoc, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { formatRelativeTime } from '../lib/utils';

export default function MyReactions({ postId, onReactionAdded, hideGifButton = false, openLoginModal, postCreatedAt, postAuthorId }) {
  const [fireCount, setFireCount] = useState(0);
  const [gifCount, setGifCount] = useState(0);
  const [hasVoted, setHasVoted] = useState(false);
  const [showGifs, setShowGifs] = useState(false);
  const [gifs, setGifs] = useState([]);
  const { user } = useAuth();
  const isPostAuthor = user && postAuthorId === user.uid;

  useEffect(() => {
    fetchReactionCounts();
  }, [postId]);

  const fetchReactionCounts = async () => {
    try {
      const reactionsRef = collection(db, 'reactions');
      
      // Fetch fire reactions
      const fireQuery = query(
        reactionsRef,
        where('postId', '==', postId),
        where('type', '==', 'emoji'),
        where('content', '==', '🔥')
      );
      const fireSnapshot = await getDocs(fireQuery);
      setFireCount(fireSnapshot.size);
      setHasVoted(fireSnapshot.size > 0);

      // Fetch GIF reactions
      const gifQuery = query(
        reactionsRef,
        where('postId', '==', postId),
        where('type', '==', 'gif')
      );
      const gifSnapshot = await getDocs(gifQuery);
      setGifCount(gifSnapshot.size);
      setGifs(gifSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch (error) {
      console.error('Error fetching reaction counts:', error);
    }
  };

  const handleFireClick = async () => {
    if (!user) {
      openLoginModal();
      return;
    }

    if (isPostAuthor) {
      return;
    }

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
          createdAt: new Date().toISOString(),
          username: user.displayName || 'Anonymous'
        });
        setFireCount(prev => prev + 1);
        setHasVoted(true);
      }
    } catch (error) {
      console.error('Error toggling fire reaction:', error);
    }
  };

  return (
    <div className="relative w-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={handleFireClick}
            disabled={isPostAuthor}
            className={`flex items-center gap-1 px-2 py-1 rounded-full border transition-colors ${
              hasVoted 
                ? 'bg-yellow-50 border-yellow-200 text-yellow-600' 
                : isPostAuthor
                  ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-white/60 hover:bg-white/80 border-gray-200'
            }`}
          >
            <span className="text-base">🔥</span>
            {fireCount > 0 && (
              <span className="text-xs font-medium">{fireCount}</span>
            )}
          </button>
          {!hideGifButton && gifCount > 0 && (
            <button
              onClick={() => setShowGifs(!showGifs)}
              className="flex items-center gap-1 px-3 py-1 rounded-full border border-gray-200 bg-white/60 hover:bg-white/80 transition-colors"
            >
              <span className="text-base">🎬</span>
              <span className="text-xs font-medium">{gifCount}</span>
            </button>
          )}
        </div>
        <span className="text-sm text-gray-500">
          {formatRelativeTime(postCreatedAt)}
        </span>
      </div>

      {showGifs && gifs.length > 0 && (
        <div className="mt-4 space-y-4">
          {gifs.map((gif) => (
            <div
              key={gif.id}
              className="space-y-1"
            >
              <img
                src={gif.content}
                alt="Reaction GIF"
                className="rounded-lg w-full object-contain"
              />
              <div className="flex justify-end items-center gap-2">
                <span className="text-sm font-medium text-gray-900">
                  {gif.username || 'Anonymous'}
                </span>
                <span className="text-sm text-gray-500">
                  {formatRelativeTime(gif.createdAt)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 