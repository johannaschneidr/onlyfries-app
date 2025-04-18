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
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    locationName: '',
    menuName: '',
    types: [],
    description: '',
    length: 0,
    thickness: 0,
    crispiness: 0,
    saltiness: 0,
    darkness: 0,
    overall: 0
  });
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const locationInputRef = useRef(null);
  const router = useRouter();

  // Fry Type Categories
  const fryTypes = {
    'Classic Styles': [
      { value: 'classic', label: 'Classic' },
      { value: 'shoestring', label: 'Shoestring' },
      { value: 'steak-cut', label: 'Steak Cut' },
      { value: 'home-style', label: 'Home Style' },
      { value: 'skin-on', label: 'Skin-On' }
    ],
    'Specialty Cuts': [
      { value: 'waffle', label: 'Waffle Style' },
      { value: 'crinkle-cut', label: 'Crinkle Cut' },
      { value: 'tornado', label: 'Tornado' },
      { value: 'curly', label: 'Curly' },
      { value: 'wavy', label: 'Wavy' }
    ],
    'Alternative Fries': [
      { value: 'sweet-potato', label: 'Sweet Potato' },
      { value: 'hash-brown', label: 'Hash Brown' },
      { value: 'non-potato', label: 'Non-Potato' },
      { value: 'tater-tots', label: 'Tater Tots' },
      { value: 'polenta', label: 'Polenta Fries' }
    ],
    'Flavor Profiles': [
      { value: 'spiced', label: 'Spiced' },
      { value: 'loaded', label: 'Loaded' },
      { value: 'seasoned', label: 'Seasoned' },
      { value: 'garlic', label: 'Garlic' },
      { value: 'truffle', label: 'Truffle' }
    ]
  };

  // Flatten all fry types for easier searching
  const allFryTypes = Object.values(fryTypes).flat();
  
  // Tag input state
  const [tagInput, setTagInput] = useState('');
  const [tagInputRef, setTagInputRef] = useState(null);

  // Handle tag input changes
  const handleTagInputChange = (e) => {
    const value = e.target.value;
    setTagInput(value);
    
    if (value) {
      const filtered = allFryTypes.filter(type => 
        type.label.toLowerCase().includes(value.toLowerCase()) &&
        !formData.types.includes(type.value)
      );
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Add a tag
  const addTag = (type) => {
    if (!formData.types.includes(type.value)) {
      setFormData(prev => ({
        ...prev,
        types: [...prev.types, type.value]
      }));
    }
    setTagInput('');
    setShowSuggestions(false);
  };

  // Remove a tag
  const removeTag = (typeToRemove) => {
    setFormData(prev => ({
      ...prev,
      types: prev.types.filter(type => type !== typeToRemove)
    }));
  };

  // Handle key events for tag input
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && tagInput && suggestions.length > 0) {
      e.preventDefault();
      addTag(suggestions[0]);
    } else if (e.key === 'Backspace' && !tagInput && formData.types.length > 0) {
      removeTag(formData.types[formData.types.length - 1]);
    }
  };

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

  const removeImage = () => {
    setImage(null);
    setPreview('');
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  const imageInputRef = useRef(null);

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
    setFormSubmitted(true);

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
        menuName: formData.menuName.trim(),
        types: formData.types.map(type => fryTypes['Classic Styles'].find(t => t.value === type) || fryTypes['Specialty Cuts'].find(t => t.value === type) || fryTypes['Alternative Fries'].find(t => t.value === type) || fryTypes['Flavor Profiles'].find(t => t.value === type)).map(t => t.value),
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
      if (!postData.locationName || 
          postData.types.length === 0 || 
          postData.length === 0 || 
          postData.thickness === 0 || 
          postData.crispiness === 0 || 
          postData.saltiness === 0 || 
          postData.darkness === 0 || 
          postData.overall === 0) {
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

  // Rating Scale Component
  const RatingScale = ({ label, value, onChange, leftLabel, rightLabel }) => (
    <div className="mb-4">
      <label className="block text-sm font-medium mb-2">
        {label} <span className="text-red-500">*</span>
      </label>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-500 w-16">{leftLabel}</span>
        <div className="flex-1 flex justify-center gap-1">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => onChange(num)}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors
                ${value === num 
                  ? 'bg-yellow-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              {num}
            </button>
          ))}
        </div>
        <span className="text-sm text-gray-500 w-16 text-right">{rightLabel}</span>
      </div>
      {formSubmitted && value === 0 && (
        <p className="text-sm text-red-500 mt-1">Please select a rating</p>
      )}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto p-4">
      {error && (
        <div className="mb-8 p-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="mb-8">
        <label className="block text-sm font-medium mb-2">
          Fries Image <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleImageChange}
            className="hidden"
            required
          />
          {!preview ? (
            <div 
              onClick={() => imageInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-yellow-500 transition-colors"
            >
              <div className="flex flex-col items-center justify-center">
                <svg className="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p className="text-sm text-gray-600">Tap to take a photo or upload an image</p>
                <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 5MB</p>
              </div>
            </div>
          ) : (
            <div className="relative">
              <img 
                src={preview} 
                alt="Preview" 
                className="w-full h-64 object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-2 right-2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-2 shadow-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="absolute bottom-2 right-2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-2 shadow-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mb-8 relative">
        <label className="block text-sm font-medium mb-2">
          Location Name <span className="text-red-500">*</span>
        </label>
        <input
          ref={locationInputRef}
          type="text"
          value={formData.locationName}
          onChange={(e) => {
            setFormData({ ...formData, locationName: e.target.value });
            setShowSuggestions(true);
          }}
          className="w-full p-2 border rounded"
          placeholder="Type to search"
          required
        />
      </div>

      <div className="mb-8">
        <label className="block text-sm font-medium mb-2">Name on Menu (Optional)</label>
        <input
          type="text"
          value={formData.menuName}
          onChange={(e) => setFormData({ ...formData, menuName: e.target.value })}
          className="w-full p-2 border rounded"
          placeholder="Crazy loaded truffle fries"
        />
        <p className="text-sm text-gray-500 mt-1">If establishment has multiple types of fries on their menu</p>
      </div>

      <div className="mb-8">
        <label className="block text-sm font-medium mb-2">
          Type <span className="text-red-500">*</span>
        </label>
        <div className="flex flex-wrap gap-2 p-2 border rounded min-h-[42px]">
          {formData.types.map(type => {
            const typeInfo = allFryTypes.find(t => t.value === type);
            return (
              <span
                key={type}
                className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm"
              >
                {typeInfo?.label}
                <button
                  type="button"
                  onClick={() => removeTag(type)}
                  className="ml-1 text-yellow-600 hover:text-yellow-800"
                >
                  ×
                </button>
              </span>
            );
          })}
          <div className="relative flex-1">
            <input
              ref={tagInputRef}
              type="text"
              value={tagInput}
              onChange={handleTagInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setShowSuggestions(true)}
              className="w-full outline-none"
              placeholder={formData.types.length === 0 ? "Type to select tags" : ""}
            />
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border rounded shadow-lg">
                {suggestions.map((type) => (
                  <div
                    key={type.value}
                    onClick={() => addTag(type)}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  >
                    {type.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <RatingScale
        label="Length"
        value={formData.length}
        onChange={(value) => setFormData({ ...formData, length: value })}
        leftLabel="Short"
        rightLabel="Long"
      />

      <RatingScale
        label="Thickness"
        value={formData.thickness}
        onChange={(value) => setFormData({ ...formData, thickness: value })}
        leftLabel="Thin"
        rightLabel="Thick"
      />

      <RatingScale
        label="Crispiness"
        value={formData.crispiness}
        onChange={(value) => setFormData({ ...formData, crispiness: value })}
        leftLabel="Soft"
        rightLabel="Crispy"
      />

      <RatingScale
        label="Saltiness"
        value={formData.saltiness}
        onChange={(value) => setFormData({ ...formData, saltiness: value })}
        leftLabel="Mild"
        rightLabel="Salty"
      />

      <RatingScale
        label="Darkness"
        value={formData.darkness}
        onChange={(value) => setFormData({ ...formData, darkness: value })}
        leftLabel="Light"
        rightLabel="Dark"
      />

      <RatingScale
        label="Overall Rating"
        value={formData.overall}
        onChange={(value) => setFormData({ ...formData, overall: value })}
        leftLabel="Poor"
        rightLabel="Excellent"
      />

      <div className="mt-12 mb-8">
        <label className="block text-sm font-medium mb-2">Comment (Optional)</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full p-2 border rounded"
          rows="3"
          placeholder="Describe the fries, any special seasonings, etc."
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-yellow-500 text-white py-3 px-4 rounded hover:bg-yellow-600 disabled:opacity-50"
      >
        {loading ? 'Submitting...' : 'Submit Post'}
      </button>
    </form>
  );
}
