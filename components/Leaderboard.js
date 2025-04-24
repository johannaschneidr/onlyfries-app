import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

export default function Leaderboard() {
  const [topFries, setTopFries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopFries = async () => {
      try {
        // Get the start of the current week (Sunday)
        const now = new Date();
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        startOfWeek.setHours(0, 0, 0, 0);

        const friesRef = collection(db, 'posts');
        const q = query(
          friesRef,
          where('createdAt', '>=', startOfWeek.toISOString()),
          orderBy('createdAt', 'desc'),
          orderBy('overall', 'desc'),
          limit(3)
        );

        const querySnapshot = await getDocs(q);
        const fries = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setTopFries(fries);
      } catch (error) {
        console.error('Error fetching top fries:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTopFries();
  }, []);

  if (loading) {
    return (
      <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4">Loading top fries...</h2>
      </div>
    );
  }

  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4">
      <h2 className="text-xl font-semibold mb-3">Top Fries of the Week</h2>
      <div className="space-y-2">
        {topFries.map((fry, index) => (
          <div key={fry.id} className="flex flex-col gap-3 p-3 bg-white/60 backdrop-blur-sm rounded-lg">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <h3 className="font-medium">
                  {fry.locationName.split(',')[0]}
                </h3>
                <p className="text-sm text-gray-600">{fry.menuName || 'Classic Fries'}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-10 h-10 flex items-center justify-center text-lg font-semibold bg-yellow-500 text-white rounded-full p-2">
                  {fry.overall.toFixed(1)}
                </span>
              </div>
            </div>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fry.locationName)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-yellow-500 transition-colors underline"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
              </svg>
              Open in Google Maps
            </a>
          </div>
        ))}
        {topFries.length === 0 && (
          <p className="text-gray-600 text-center">No fries rated this week yet!</p>
        )}
      </div>
    </div>
  );
} 