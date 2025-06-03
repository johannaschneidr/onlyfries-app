import { useState, useEffect, useRef, useMemo } from 'react';
import { storage, db } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, query, where, getDocs, updateDoc, arrayUnion } from 'firebase/firestore';
import { useRouter } from 'next/router';
import { useGoogleMaps } from '../hooks/useGoogleMaps';
import { useAuth } from '../contexts/AuthContext';

export default function PostForm() {
  // Add ratingDescriptors at the top level
  const ratingDescriptors = {
    1: "Yikes",
    2: "Meh",
    3: "Solid",
    4: "Crack",
    5: "F***in Slaying"
  };

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
  const inputElementRef = useRef(null);
  const router = useRouter();
  const { isLoaded: isGoogleMapsLoaded, error: googleMapsError } = useGoogleMaps();
  const { user } = useAuth();
  const tagInputContainerRef = useRef(null);

  // Check for temporary image in localStorage on component mount
  useEffect(() => {
    const tempImage = localStorage.getItem('tempImage');
    if (tempImage) {
      setPreview(tempImage);
      // Convert data URL to File object
      fetch(tempImage)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], 'temp-image.jpg', { type: 'image/jpeg' });
          setImage(file);
        });
      // Clear the temporary image from localStorage
      localStorage.removeItem('tempImage');
    }

    // Check for page parameter in URL
    const pageParam = router.query.page;
    if (pageParam && pageParam === '2' && image) {
      setCurrentPage(2);
    }
  }, [router.query.page, image]);

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
      // Show all available options if input is empty
      const filtered = allFryTypes.filter(type => !formData.types.includes(type.value));
      setSuggestions(filtered);
      setShowSuggestions(true);
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

  // Memoize the location input to prevent unnecessary re-renders
  const LocationInput = useMemo(() => (
    <div className="relative bg-white/60 backdrop-blur-sm rounded-md border border-white/50 h-[60px]">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
        <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </div>
      <div id="location-container" className="w-full h-full" />
    </div>
  ), []);

  // Update the useEffect for Google Places Autocomplete
  useEffect(() => {
    if (currentPage !== 2 || !isGoogleMapsLoaded) {
      if (autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      }
      return;
    }

    const container = document.getElementById('location-container');
    if (!container) return;

    try {
      if (!inputElementRef.current) {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'w-full h-full p-4 pl-12 text-base bg-transparent outline-none';
        input.placeholder = 'Search for a location';
        input.style.boxShadow = 'none';
        inputElementRef.current = input;
      }

      const input = inputElementRef.current;
      if (formData.locationName) {
        input.value = formData.locationName;
      }

      if (!container.contains(input)) {
        container.innerHTML = '';
        container.appendChild(input);
      }

      if (!autocompleteRef.current) {
        const autocomplete = new window.google.maps.places.Autocomplete(input, {
          componentRestrictions: { country: 'us' },
          fields: ['name', 'formatted_address'],
          types: ['establishment'],
          bounds: {
            north: 40.9176,
            south: 40.4774,
            east: -73.7004,
            west: -74.2591
          },
          strictBounds: false
        });

        // Add custom styles to the dropdown
        const style = document.createElement('style');
        style.textContent = `
          .pac-container {
            margin-top: 6px !important;
            background-color: white !important;
            backdrop-filter: blur(8px) !important;
            border: none !important;
            border-radius: 6px !important;
            box-shadow: none !important;
            font-family: inherit !important;
            padding: 0 !important;
          }
          .pac-item {
            padding: 8px 16px !important;
            line-height: 2 !important;
            font-size: 16px !important;
            border-bottom: 1px solid rgba(255, 255, 255, 0.3) !important;
            cursor: pointer !important;
            text-shadow: none !important;
          }
          .pac-item:last-child {
            border-bottom: none !important;
          }
          .pac-item:hover {
            background-color: rgba(255, 255, 255, 0.5) !important;
          }
          .pac-icon {
            display: none !important;
          }
          .pac-item-query {
            font-size: 16px !important;
            padding-right: 4px !important;
            text-shadow: none !important;
          }
          .pac-matched {
            font-weight: 500 !important;
            text-shadow: none !important;
          }
          .pac-item span {
            text-shadow: none !important;
          }
        `;
        document.head.appendChild(style);

        autocompleteRef.current = autocomplete;

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          if (place) {
            const locationName = place.name && place.formatted_address 
              ? `${place.name}, ${place.formatted_address}`
              : place.formatted_address || place.name || '';
            
            setFormData(prev => ({ ...prev, locationName }));
            setError('');
          }
        });

        input.addEventListener('input', (e) => {
          setFormData(prev => ({ ...prev, locationName: e.target.value }));
        });
      }

    } catch (error) {
      console.error('Error initializing Google Places Autocomplete:', error);
      if (!inputElementRef.current) {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'w-full h-full p-4 pl-12 text-base bg-transparent outline-none';
        input.placeholder = 'Enter location name';
        input.style.boxShadow = 'none';
        input.value = formData.locationName;
        input.addEventListener('input', (e) => {
          setFormData(prev => ({ ...prev, locationName: e.target.value }));
        });
        inputElementRef.current = input;
      }
      container.innerHTML = '';
      container.appendChild(inputElementRef.current);
    }

    return () => {
      if (autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      }
      if (currentPage !== 2) {
        const container = document.getElementById('location-container');
        if (container) {
          container.innerHTML = '';
        }
      }
    };
  }, [currentPage, isGoogleMapsLoaded]);

  // Handle location input changes
  const handleLocationChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, locationName: value }));
  };

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
    if (currentPage === 1) {
      if (!image) {
        setError('Please upload an image first');
        return;
      }
    } else if (currentPage === 2) {
      const missingFields = [];
      if (!formData.overall) missingFields.push('rating');
      if (!formData.locationName) missingFields.push('location name');
      if (formData.types.length === 0) missingFields.push('type of fries');

      if (missingFields.length > 0) {
        if (missingFields.length === 1) {
          setError(`Please add a ${missingFields[0]}`);
        } else {
          setError('Please provide all required information');
        }
        return;
      }
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

    const missingFields = [];
    if (!image) missingFields.push('image');
    if (!formData.overall) missingFields.push('rating');
    if (!formData.locationName) missingFields.push('location name');
    if (formData.types.length === 0) missingFields.push('type of fries');

    if (missingFields.length > 0) {
      if (missingFields.length === 1) {
        setError(`Please add a ${missingFields[0]}`);
      } else {
        setError('Please provide all required information');
      }
      return;
    }

    setLoading(true);
    setError('');

    try {
      const imageUrl = await uploadImage(image);
      const postData = {
        ...formData,
        imageUrl,
        createdAt: new Date().toISOString(),
        username: user?.displayName || 'Anonymous',
      };

      console.log('Submitting post data:', postData);

      // Add post to posts collection
      const postsRef = collection(db, 'posts');
      const postDoc = await addDoc(postsRef, postData);
      console.log('Post document created with ID:', postDoc.id);

      // Update location stats
      const locationsRef = collection(db, 'locations');
      const locationQuery = query(locationsRef, where('name', '==', formData.locationName));
      console.log('Querying locations collection for:', formData.locationName);
      
      const locationSnapshot = await getDocs(locationQuery);
      console.log('Location query result:', locationSnapshot.empty ? 'No existing location found' : 'Found existing location');

      if (locationSnapshot.empty) {
        console.log('Creating new location document for:', formData.locationName);
        const locationData = {
          name: formData.locationName,
          totalReviews: 1,
          averageOverall: formData.overall,
          averageLength: formData.length || 0,
          averageThickness: formData.thickness || 0,
          averageCrispiness: formData.crispiness || 0,
          averageSaltiness: formData.saltiness || 0,
          averageDarkness: formData.darkness || 0,
          recentImages: [{ imageUrl, username: user?.displayName || 'Anonymous' }],
          lastUpdated: new Date().toISOString()
        };
        console.log('New location data:', locationData);
        try {
          const newLocationDoc = await addDoc(locationsRef, locationData);
          console.log('New location document created with ID:', newLocationDoc.id);
        } catch (error) {
          console.error('Error creating location document:', error);
          throw error;
        }
      } else {
        console.log('Updating existing location document');
        const locationDoc = locationSnapshot.docs[0];
        const locationData = locationDoc.data();
        console.log('Existing location data:', locationData);
        
        const newTotalReviews = locationData.totalReviews + 1;

        const updateAverageField = (field) => {
          if (!formData[field]) return locationData[`average${field.charAt(0).toUpperCase() + field.slice(1)}`];
          return (locationData[`average${field.charAt(0).toUpperCase() + field.slice(1)}`] * locationData.totalReviews + formData[field]) / newTotalReviews;
        };

        let recentImages = locationData.recentImages || [];
        const newImageObj = { imageUrl, username: user?.displayName || 'Anonymous' };
        recentImages = [newImageObj, ...recentImages.filter(img => img.imageUrl !== imageUrl)].slice(0, 5);

        const updateData = {
          totalReviews: newTotalReviews,
          averageOverall: updateAverageField('overall'),
          averageLength: updateAverageField('length'),
          averageThickness: updateAverageField('thickness'),
          averageCrispiness: updateAverageField('crispiness'),
          averageSaltiness: updateAverageField('saltiness'),
          averageDarkness: updateAverageField('darkness'),
          lastUpdated: new Date().toISOString(),
          recentImages,
        };
        console.log('Location update data:', updateData);
        try {
          await updateDoc(locationDoc.ref, updateData);
          console.log('Location document updated successfully');
        } catch (error) {
          console.error('Error updating location document:', error);
          throw error;
        }
      }

      router.push('/');
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      setError('Error submitting post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Star Rating Component
  const StarRating = ({ value, onChange }) => {
    return (
      <div className="p-4 bg-white/80 backdrop-blur-sm rounded-xl">
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
          {value > 0 ? (
            <span className="text-lg font-medium text-gray-700">
              {ratingDescriptors[value]}
            </span>
          ) : (
            <span className="text-lg text-gray-500">Rating</span>
          )}
        </div>
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

    const handleClick = (num) => {
      if (value === num) {
        onChange(0); // Deselect if clicking the same value
      } else {
        onChange(num); // Select new value
      }
    };

    return (
      <div className="bg-white/60 backdrop-blur-sm rounded-md border border-white/50 h-[60px]">
        <div className="flex items-center h-full gap-1 sm:gap-2 px-2 sm:px-4">
          <span className="text-base text-gray-500 w-20 sm:w-24">{label}</span>
          <div className="flex gap-0.5 sm:gap-1.5 flex-1">
            {[1, 2, 3, 4, 5].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleClick(num)}
                className={`w-full h-8 rounded-lg flex items-center justify-center text-sm font-medium transition-colors
                  ${value === num 
                    ? 'bg-yellow-500 text-white' 
                    : 'bg-white text-gray-700'
                  }`}
              />
            ))}
          </div>
          <span className="text-base font-medium text-gray-700 w-20 sm:w-24 text-right">
            {value > 0 ? ratingDescriptors[label.toLowerCase()][value] : ''}
          </span>
        </div>
      </div>
    );
  };

  // Add effect to close suggestions on outside click
  useEffect(() => {
    if (!showSuggestions) return;
    function handleClickOutside(event) {
      if (
        tagInputContainerRef.current &&
        !tagInputContainerRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSuggestions]);

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto p-0 sm:p-6" noValidate>
      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md border border-white/50">
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
                    className="border-2 border-dashed border-gray-300 rounded-md p-8 text-center cursor-pointer hover:border-yellow-500 transition-colors bg-white/60 backdrop-blur-sm"
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
                      className="w-full h-64 object-cover rounded-md"
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
              className="mt-8 w-full max-w-md bg-yellow-500 text-white py-4 px-6 rounded-md text-lg font-semibold disabled:opacity-50"
            >
              Rate
            </button>
          </div>
        )}

        {currentPage === 2 && (
          <div className="space-y-1.5">
            <div className="relative bg-white/60 backdrop-blur-sm rounded-md border border-white/50 h-[60px]">
              <div className="absolute inset-0 flex items-center justify-between px-4">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => updateFormData({ overall: star })}
                      className="focus:outline-none"
                    >
                      <svg
                        className={`w-10 h-10 ${star <= formData.overall ? 'text-yellow-500' : 'text-white'}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </button>
                  ))}
                </div>
                {formData.overall > 0 && (
                  <span className="text-base font-medium text-gray-700">
                    {ratingDescriptors[formData.overall]}
                  </span>
                )}
              </div>
            </div>

            {LocationInput}

            <div className="relative">
              <div ref={tagInputContainerRef}>
                <div className="relative bg-white/60 backdrop-blur-sm rounded-md border border-white/50 h-[60px]">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                    <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                  <div className="p-4 pl-12 h-full">
                    <div className="flex flex-wrap gap-2 items-center h-full">
                      {formData.types.map(type => {
                        const typeInfo = allFryTypes.find(t => t.value === type);
                        return (
                          <span
                            key={type}
                            className="inline-flex items-center px-3 py-1 text-sm bg-white/60 backdrop-blur-sm text-gray-700 rounded-full border border-gray-400"
                          >
                            {typeInfo?.label}
                            <button
                              type="button"
                              onClick={() => removeTag(type)}
                              className="ml-1 text-gray-500 hover:text-gray-700"
                            >
                              ×
                            </button>
                          </span>
                        );
                      })}
                      <input
                        key="tag-input"
                        ref={tagInputRef}
                        type="text"
                        value={tagInput}
                        onChange={handleTagInputChange}
                        onKeyDown={handleKeyDown}
                        onFocus={() => {
                          if (!tagInput) {
                            const filtered = allFryTypes.filter(type => !formData.types.includes(type.value));
                            setSuggestions(filtered);
                          }
                          setShowSuggestions(true);
                        }}
                        className="flex-1 min-w-[150px] outline-none text-base bg-transparent"
                        placeholder={formData.types.length === 0 ? "Type of fries" : ""}
                      />
                    </div>
                  </div>
                </div>
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute z-20 w-full mt-1.5 bg-white/60 backdrop-blur-sm border border-white/50 rounded-md">
                    {suggestions.map((type) => (
                      <div
                        key={type.value}
                        onClick={() => addTag(type)}
                        className="flex items-center px-4 py-2 hover:bg-white/50 cursor-pointer text-base border-b border-white/30 last:border-b-0"
                      >
                        <svg className="w-4 h-4 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        {type.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="mt-1.5">
                <div className="flex flex-wrap gap-1.5">
                  {allFryTypes.slice(0, 4).map((type) => {
                    const isSelected = formData.types.includes(type.value);
                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => !isSelected && addTag(type)}
                        disabled={isSelected}
                        className={`inline-flex items-center px-3 py-1 text-sm rounded-full border border-gray-400 backdrop-blur-sm
                          ${isSelected
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'text-gray-700 hover:bg-gray-100'}
                        `}
                      >
                        <svg className={`w-3 h-3 mr-1 ${isSelected ? 'text-gray-400' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        {type.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="relative bg-white/60 backdrop-blur-sm rounded-md border border-white/50 h-[60px]">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <input
                key="menu-name-input"
                type="text"
                value={formData.menuName}
                onChange={handleMenuNameChange}
                className="w-full h-full p-4 pl-12 text-base bg-transparent outline-none"
                placeholder="Name on Menu (Optional)"
              />
            </div>

            <div className="flex gap-4 mt-4">
              <button
                type="button"
                onClick={handleNext}
                className="w-full bg-yellow-500 text-white py-4 px-6 rounded-md text-lg font-semibold"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {currentPage === 3 && (
          <div className="space-y-6">
            <h2 className="text-xl font-medium text-gray-800 mb-4">
              Want to provide some additional details?
            </h2>
            <div className="space-y-1.5">
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

            <div className="relative bg-white/60 backdrop-blur-sm rounded-md border border-white/50">
              <textarea
                value={formData.description}
                onChange={handleDescriptionChange}
                className="w-full p-4 text-base bg-transparent outline-none"
                rows="4"
                placeholder="Tell us more!"
              />
            </div>

            <div className="flex gap-4 mt-8">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-yellow-500 text-white py-4 px-6 rounded-md text-lg font-semibold"
              >
                {loading ? 'Submitting...' : (
                  formData.length || formData.thickness || formData.crispiness || 
                  formData.saltiness || formData.darkness || formData.description
                    ? 'Submit'
                    : 'Submit without details'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </form>
  );
}
