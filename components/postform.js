import { useState, useEffect, useRef, useMemo } from 'react';
import { storage, db } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc } from 'firebase/firestore';
import { useRouter } from 'next/router';
import { useGoogleMaps } from '../hooks/useGoogleMaps';

export default function PostForm() {
  const [currentPage, setCurrentPage] = useState(1);
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
  const autocompleteRef = useRef(null);
  const router = useRouter();
  const { isLoaded: isGoogleMapsLoaded, error: googleMapsError } = useGoogleMaps();

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

  // Initialize Google Places Autocomplete only when on page 2 and Google Maps is loaded
  useEffect(() => {
    if (currentPage !== 2 || !isGoogleMapsLoaded) {
      // Clean up if we're not on page 2 or Google Maps isn't loaded
      if (autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      }
      return;
    }

    // Only initialize if we haven't already
    if (autocompleteRef.current) {
      return;
    }

    console.log('Initializing Google Places Autocomplete for page 2...');
    
    const container = document.getElementById('location-container');
    if (container) {
      try {
        console.log('Creating PlaceAutocompleteElement...');
        const autocomplete = new window.google.maps.places.PlaceAutocompleteElement({
          inputElement: document.createElement('input'),
          componentRestrictions: { country: 'us' },
          locationBias: {
            north: 40.9176,
            south: 40.4774,
            east: -73.7004,
            west: -74.2591
          },
          types: ['establishment']
        });

        // Style the autocomplete element
        autocomplete.style.display = 'block';
        autocomplete.style.width = '100%';

        // Style the input inside the autocomplete element
        const input = autocomplete.querySelector('input');
        if (input) {
          input.className = 'w-full p-4 text-base border rounded-lg';
          input.placeholder = 'Type to search';
        }

        // Clear the container and append the new element
        container.innerHTML = '';
        container.appendChild(autocomplete);

        console.log('PlaceAutocompleteElement instance created:', autocomplete);
        autocompleteRef.current = autocomplete;

        // Handle place selection
        autocomplete.addEventListener('place_changed', () => {
          console.log('Place changed event triggered');
          const place = autocomplete.getPlace();
          console.log('Selected place:', place);
          if (place.name) {
            setFormData(prev => ({ ...prev, locationName: place.name }));
          }
        });

        console.log('Added place_changed event listener');
      } catch (error) {
        console.error('Error initializing Google Places Autocomplete:', error);
      }
    }

    // Cleanup function
    return () => {
      console.log('Cleaning up autocomplete for page 2');
      if (autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      }
      const container = document.getElementById('location-container');
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [currentPage, isGoogleMapsLoaded]);

  // Handle location input changes
  const handleLocationChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, locationName: value }));
  };

  // Memoize the location input to prevent unnecessary re-renders
  const LocationInput = useMemo(() => (
    <div className="relative">
      <div 
        id="location-container" 
        className="w-full"
      />
    </div>
  ), []);

  // Update the form data state
  const updateFormData = (updates) => {
    setFormData(prev => {
      const newData = { ...prev, ...updates };
      return newData;
    });
  };

  // Handle menu name changes
  const handleMenuNameChange = (e) => {
    const value = e.target.value;
    updateFormData({ menuName: value });
  };

  // Handle description changes
  const handleDescriptionChange = (e) => {
    const value = e.target.value;
    updateFormData({ description: value });
  };

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

  const handleNext = () => {
    if (currentPage === 1 && !image) {
      setError('Please upload an image first');
      return;
    }
    setError('');
    setCurrentPage(currentPage + 1);
  };

  const handleBack = () => {
    setError('');
    setCurrentPage(currentPage - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitted(true);

    if (!image) {
      setError('Please upload an image');
      return;
    }

    if (!formData.locationName || formData.types.length === 0 || formData.overall === 0) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const imageUrl = await uploadImage(image);
      const postData = {
        ...formData,
        imageUrl,
        createdAt: new Date().toISOString()
      };

      const postsRef = collection(db, 'posts');
      await addDoc(postsRef, postData);
      router.push('/');
    } catch (error) {
      console.error('Error submitting post:', error);
      setError('Error submitting post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Star Rating Component
  const StarRating = ({ label, value, onChange }) => {
    const ratingDescriptors = {
      1: "Yikes",
      2: "Meh",
      3: "Solid",
      4: "Crack",
      5: "F***in Slaying"
    };

    return (
      <div className="mb-4">
        <label className="block text-base font-medium mb-2">
          {label}
        </label>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => onChange(star)}
                className="focus:outline-none"
              >
                <svg
                  className={`w-8 h-8 ${star <= value ? 'text-yellow-500' : 'text-gray-300'}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </button>
            ))}
          </div>
          {value > 0 && (
            <span className="text-lg font-medium text-gray-700">
              {ratingDescriptors[value]}
            </span>
          )}
        </div>
        {formSubmitted && value === 0 && (
          <p className="text-sm text-red-500 mt-1">Please select a rating</p>
        )}
      </div>
    );
  };

  // Rating Scale Component
  const RatingScale = ({ label, value, onChange }) => {
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

    return (
      <div className="mb-4">
        <label className="block text-base font-medium mb-2">
          {label}
        </label>
        <div className="flex items-center gap-4">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => onChange(num)}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors
                  ${value === num 
                    ? 'bg-yellow-500 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              />
            ))}
          </div>
          {value > 0 && (
            <span className="text-lg font-medium text-gray-700">
              {ratingDescriptors[label.toLowerCase()][value]}
            </span>
          )}
        </div>
        {formSubmitted && value === 0 && (
          <p className="text-sm text-red-500 mt-1">Please select a rating</p>
        )}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto p-4 sm:p-6" noValidate>
      {error && (
        <div className="mb-8 p-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="relative">
        {currentPage === 1 && (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="w-full max-w-md">
              <div className="relative">
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  required
                />
                {!preview ? (
                  <div 
                    onClick={() => imageInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-yellow-500 transition-colors"
                  >
                    <div className="flex flex-col items-center justify-center">
                      <svg className="w-20 h-20 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <p className="text-lg text-gray-600">Tap to take a photo or choose from library</p>
                      <p className="text-sm text-gray-500 mt-2">PNG, JPG up to 5MB</p>
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
                      className="absolute top-3 right-3 bg-white/80 hover:bg-white text-gray-800 rounded-full p-3 shadow-lg"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={handleNext}
              disabled={!preview}
              className="mt-8 w-full max-w-md bg-yellow-500 text-white py-4 px-6 rounded-lg text-lg font-medium hover:bg-yellow-600 disabled:opacity-50"
            >
              Rate
            </button>
          </div>
        )}

        {currentPage === 2 && (
          <div className="space-y-8">
            <div>
              <StarRating
                label="Rating"
                value={formData.overall}
                onChange={(value) => updateFormData({ overall: value })}
              />
            </div>

            <div className="relative">
              <label className="block text-base font-medium mb-3">
                Location Name
              </label>
              <div 
                id="location-container" 
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-base font-medium mb-3">
                Type
              </label>
              <div className="flex flex-wrap gap-2 p-3 border rounded-lg min-h-[52px]">
                {formData.types.map(type => {
                  const typeInfo = allFryTypes.find(t => t.value === type);
                  return (
                    <span
                      key={type}
                      className="flex items-center gap-1 px-3 py-2 bg-yellow-100 text-yellow-800 rounded-full text-base"
                    >
                      {typeInfo?.label}
                      <button
                        type="button"
                        onClick={() => removeTag(type)}
                        className="ml-1 text-yellow-600 hover:text-yellow-800 text-lg"
                      >
                        ×
                      </button>
                    </span>
                  );
                })}
                <div className="relative flex-1">
                  <input
                    key="tag-input"
                    ref={tagInputRef}
                    type="text"
                    value={tagInput}
                    onChange={handleTagInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setShowSuggestions(true)}
                    className="w-full outline-none text-base"
                    placeholder={formData.types.length === 0 ? "Type to select tags" : ""}
                  />
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg">
                      {suggestions.map((type) => (
                        <div
                          key={type.value}
                          onClick={() => addTag(type)}
                          className="px-4 py-3 hover:bg-gray-100 cursor-pointer text-base"
                        >
                          {type.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-2">
                <div className="flex flex-wrap gap-2 mt-1">
                  {allFryTypes.slice(0, 5).map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => addTag(type)}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200"
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-base font-medium mb-3">Name on Menu (Optional)</label>
              <input
                key="menu-name-input"
                type="text"
                value={formData.menuName}
                onChange={handleMenuNameChange}
                className="w-full p-4 text-base border rounded-lg"
                placeholder="Crazy loaded truffle fries"
              />
            </div>

            <div className="flex gap-4 mt-8">
              <button
                type="button"
                onClick={handleNext}
                className="flex-1 bg-yellow-500 text-white py-4 px-6 rounded-lg text-lg font-medium hover:bg-yellow-600"
              >
                Submit
              </button>
            </div>
          </div>
        )}

        {currentPage === 3 && (
          <div className="space-y-8">
            <h2 className="text-base font-medium mb-6">Want to give some extra details?</h2>
            <div className="space-y-8">
              <RatingScale
                label="Length"
                value={formData.length}
                onChange={(value) => updateFormData({ length: value })}
              />

              <RatingScale
                label="Thickness"
                value={formData.thickness}
                onChange={(value) => updateFormData({ thickness: value })}
              />

              <RatingScale
                label="Crispiness"
                value={formData.crispiness}
                onChange={(value) => updateFormData({ crispiness: value })}
              />

              <RatingScale
                label="Saltiness"
                value={formData.saltiness}
                onChange={(value) => updateFormData({ saltiness: value })}
              />

              <RatingScale
                label="Darkness"
                value={formData.darkness}
                onChange={(value) => updateFormData({ darkness: value })}
              />
            </div>

            <div>
              <label className="block text-base font-medium mb-3">Comment (Optional)</label>
              <textarea
                value={formData.description}
                onChange={handleDescriptionChange}
                className="w-full p-4 text-base border rounded-lg"
                rows="4"
                placeholder="Describe the fries, any special seasonings, etc."
              />
            </div>

            <div className="flex gap-4 mt-8">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 bg-yellow-500 text-white py-4 px-6 rounded-lg text-lg font-medium hover:bg-yellow-600 disabled:opacity-50"
              >
                {loading ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>
        )}
      </div>
    </form>
  );
}
