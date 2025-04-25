import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { getLocationData } from '../../lib/api';
import LocationProfile from '../../components/LocationProfile';
import Navbar from '../../components/navbar';

export default function LocationPage() {
  const router = useRouter();
  const { id } = router.query;
  const [locationData, setLocationData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      const fetchLocationData = async () => {
        try {
          const data = await getLocationData(id);
          setLocationData(data);
        } catch (error) {
          console.error('Error fetching location data:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchLocationData();
    }
  }, [id]);

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="max-w-4xl mx-auto p-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="space-y-4">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </main>
      </>
    );
  }

  if (!locationData) {
    return (
      <>
        <Navbar />
        <main className="max-w-4xl mx-auto p-4">
          <div className="text-center py-12">
            <h1 className="text-2xl font-semibold text-gray-900">Location not found</h1>
            <p className="mt-2 text-gray-600">The location you're looking for doesn't exist or has been removed.</p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto p-4">
        <LocationProfile locationData={locationData} />
      </main>
    </>
  );
} 