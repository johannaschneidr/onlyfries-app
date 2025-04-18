import { useState, useEffect, useRef } from 'react';
import { storage, db } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc } from 'firebase/firestore';
import { useRouter } from 'next/router';

export default function PostForm() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    locationName: '',
    type: '',
    description: '',
    length: 5,
    thickness: 5,
    crispiness: 5,
    saltiness: 5,
    darkness: 5,
    overall: 5
  });
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const locationInputRef = useRef(null);
  const router = useRouter();

  // Initialize Google Places Autocomplete
  // This effect runs once when the component mounts
  // It creates an autocomplete instance attached to the location input
  // The autocomplete is restricted to establishments in New York City area
  useEffect(() => {
    if (typeof window !== 'undefined' && window.google) {
      // Define bounds for New York City area
      const nycBounds = new window.google.maps.LatLngBounds(
        new window.google.maps.LatLng(40.4774, -74.2591), // Southwest corner (including outer boroughs)
        new window.google.maps.LatLng(40.9176, -73.7004)  // Northeast corner
      );

      const autocomplete = new window.google.maps.places.Autocomplete(
        locationInputRef.current,
        {
          types: ['establishment'],
          bounds: nycBounds,
          strictBounds: true // This ensures results are strictly within the bounds
        }
      );

      // Handle place selection from autocomplete
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place.name) {
          setFormData(prev => ({ ...prev, locationName: place.name }));
          setShowSuggestions(false);
        }
      });
    }
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }
      setImage(file);
      setPreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const uploadImage = async (file) => {
    const timestamp = Date.now();
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_').toLowerCase();
    const storagePath = `fries/${timestamp}_${cleanFileName}`;
    
    console.log('Uploading image to:', storagePath);
    
    const imageRef = ref(storage, storagePath);
    const metadata = {
      contentType: file.type,
      customMetadata: {
        originalName: file.name,
        uploadTime: new Date().toISOString()
      }
    };

    try {
      const snapshot = await uploadBytes(imageRef, file, metadata);
      console.log('Upload successful:', snapshot);
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log('Download URL:', downloadURL);
      return downloadURL;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image) {
      setError('Please select an image');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. Upload image
      console.log('Starting upload process...');
      const imageUrl = await uploadImage(image);

      // 2. Prepare post data
      const postData = {
        locationName: formData.locationName.trim(),
        type: formData.type.trim(),
        description: formData.description.trim(),
        length: Number(formData.length),
        thickness: Number(formData.thickness),
        crispiness: Number(formData.crispiness),
        saltiness: Number(formData.saltiness),
        darkness: Number(formData.darkness),
        overall: Number(formData.overall),
        imageUrl,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // 3. Validate data
      if (!postData.locationName || !postData.type || !postData.description) {
        throw new Error('Please fill in all required fields');
      }

      // 4. Save to Firestore
      console.log('Saving to Firestore:', postData);
      try {
        // Save to Firestore using addDoc
        const postsRef = collection(db, 'posts');
        const docRef = await addDoc(postsRef, postData);
        console.log('Document written with ID:', docRef.id);
        
        // Navigate home on success
        router.push('/');
      } catch (error) {
        console.error('Firestore write error:', {
          code: error.code,
          message: error.message,
          details: error
        });
        setError('Error saving post: ' + (error.message || 'Unknown error'));
        throw error;
      }
    } catch (error) {
      console.error('Submission error:', error);
      setError(error.message || 'Error submitting post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto p-4">
      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Fries Image</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="w-full p-2 border rounded"
          required
        />
        {preview && (
          <img src={preview} alt="Preview" className="mt-2 max-h-48 rounded" />
        )}
      </div>

      {/* Google Maps Places Autocomplete Input */}
      <div className="mb-4 relative">
        <label className="block text-sm font-medium mb-2">Location Name</label>
        <input
          ref={locationInputRef}
          type="text"
          value={formData.locationName}
          onChange={(e) => {
            setFormData({ ...formData, locationName: e.target.value });
            setShowSuggestions(true);
          }}
          className="w-full p-2 border rounded"
          placeholder="Search for a restaurant/bar"
          required
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Fries Type</label>
        <input
          type="text"
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          className="w-full p-2 border rounded"
          placeholder="e.g., Shoestring, Curly, Waffle, etc."
          required
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full p-2 border rounded"
          rows="3"
          placeholder="Describe the fries, any special seasonings, etc."
          required
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Length (1-10)</label>
        <input
          type="range"
          min="1"
          max="10"
          value={formData.length}
          onChange={(e) => setFormData({ ...formData, length: parseInt(e.target.value) })}
          className="w-full"
        />
        <span className="text-sm text-gray-600">{formData.length}</span>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Thickness (1-10)</label>
        <input
          type="range"
          min="1"
          max="10"
          value={formData.thickness}
          onChange={(e) => setFormData({ ...formData, thickness: parseInt(e.target.value) })}
          className="w-full"
        />
        <span className="text-sm text-gray-600">{formData.thickness}</span>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Crispiness (1-10)</label>
        <input
          type="range"
          min="1"
          max="10"
          value={formData.crispiness}
          onChange={(e) => setFormData({ ...formData, crispiness: parseInt(e.target.value) })}
          className="w-full"
        />
        <span className="text-sm text-gray-600">{formData.crispiness}</span>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Saltiness (1-10)</label>
        <input
          type="range"
          min="1"
          max="10"
          value={formData.saltiness}
          onChange={(e) => setFormData({ ...formData, saltiness: parseInt(e.target.value) })}
          className="w-full"
        />
        <span className="text-sm text-gray-600">{formData.saltiness}</span>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Darkness (1-10)</label>
        <input
          type="range"
          min="1"
          max="10"
          value={formData.darkness}
          onChange={(e) => setFormData({ ...formData, darkness: parseInt(e.target.value) })}
          className="w-full"
        />
        <span className="text-sm text-gray-600">{formData.darkness}</span>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Overall Rating (1-10)</label>
        <input
          type="range"
          min="1"
          max="10"
          value={formData.overall}
          onChange={(e) => setFormData({ ...formData, overall: parseInt(e.target.value) })}
          className="w-full"
        />
        <span className="text-sm text-gray-600">{formData.overall}</span>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-yellow-500 text-white py-2 px-4 rounded hover:bg-yellow-600 disabled:opacity-50"
      >
        {loading ? 'Submitting...' : 'Submit Post'}
      </button>
    </form>
  );
}
