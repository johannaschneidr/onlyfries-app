import { useState, useEffect, useRef, useMemo } from 'react';
import PrimaryButton from './PrimaryButton';
import SecondaryButton from './SecondaryButton';
import TertiaryButton from './TertiaryButton';
import { storage, db } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, query, where, getDocs, updateDoc, arrayUnion, onSnapshot, doc } from 'firebase/firestore';
import { useRouter } from 'next/router';
import { useGoogleMaps } from '../hooks/useGoogleMaps';
import { useAuth } from '../contexts/AuthContext';
import MessageAlert from './MessageAlert';

export default function PostForm() {
  // Add ratingDescriptors at the top level
  const ratingDescriptors = {
    1: "Yikes",
    2: "Meh",
    3: "Solid",
    4: "Crack",
    5: "Slaying"
  };

  const [currentPage, setCurrentPage] = useState(1);
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [showModerationModal, setShowModerationModal] = useState(false);
  const [showNavigationWarning, setShowNavigationWarning] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);
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
    overall: 0,
    locationPlaceId: null,
    locationLat: null,
    locationLng: null
  });
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showMaxLimitError, setShowMaxLimitError] = useState(false);
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
      const filtered = allFryTypes
        .filter(type => 
          type.label.toLowerCase().includes(value.toLowerCase()) &&
          !formData.types.includes(type.value)
        )
        .sort((a, b) => a.label.localeCompare(b.label));
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      // Show all available options if input is empty
      const filtered = allFryTypes
        .filter(type => !formData.types.includes(type.value))
        .sort((a, b) => a.label.localeCompare(b.label));
      setSuggestions(filtered);
      setShowSuggestions(true);
    }
  };

  // Add a tag
  const addTag = (type) => {
    if (!formData.types.includes(type.value)) {
      if (formData.types.length >= 4) {
        // Don't add if already at limit, show error
        setShowMaxLimitError(true);
        setTimeout(() => setShowMaxLimitError(false), 3000); // Clear after 3 seconds
        return;
      }
      setFormData(prev => ({
        ...prev,
        types: [...prev.types, type.value]
      }));
      setShowMaxLimitError(false); // Clear error if successfully added
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
    setShowMaxLimitError(false); // Clear error when removing a tag
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
    <div className="relative h-[60px]" style={{ borderBottom: '3px solid black' }}>
      <div id="location-container" className="w-full h-full px-4 sm:px-6" />
      {formData.locationName && (
        <button
          type="button"
          onClick={() => {
            updateFormData({ locationName: '' });
            if (inputElementRef.current) {
              inputElementRef.current.value = '';
            }
          }}
          className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 text-gray-800 hover:text-gray-600"
          aria-label="Clear location"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  ), [formData.locationName]);

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
        input.className = 'w-full h-full py-4 pr-10 sm:pr-12 text-base bg-transparent outline-none';
        input.placeholder = 'Type to search';
        input.style.boxShadow = 'none';
        inputElementRef.current = input;
      }

      const input = inputElementRef.current;
      input.className = 'w-full h-full py-4 pr-10 sm:pr-12 text-base bg-transparent outline-none';
      input.placeholder = 'Type to search';
      if (formData.locationName) {
        input.value = formData.locationName;
      } else {
        input.value = '';
      }

      if (!container.contains(input)) {
        container.innerHTML = '';
        container.appendChild(input);
      }

      if (!autocompleteRef.current) {
        const autocomplete = new window.google.maps.places.Autocomplete(input, {
          componentRestrictions: { country: 'us' },
          fields: ['name', 'formatted_address', 'geometry', 'place_id'],
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
            border: 3px solid black !important;
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
            
            // Extract coordinates from place geometry
            const lat = place.geometry?.location?.lat();
            const lng = place.geometry?.location?.lng();
            const placeId = place.place_id;
            
            setFormData(prev => ({ 
              ...prev, 
              locationName,
              locationPlaceId: placeId || null,
              locationLat: lat || null,
              locationLng: lng || null
            }));
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
        input.className = 'w-full h-full py-4 pr-10 sm:pr-12 text-base bg-transparent outline-none';
        input.placeholder = 'Type to search';
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
        setError("Oops - something's missing");
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

  const resetForm = () => {
    setShowModerationModal(false);
    setCurrentPage(1);
    setImage(null);
    setPreview('');
    setError('');
    setFormSubmitted(false);
    setFormData({
      locationName: '',
      menuName: '',
      types: [],
      description: '',
      length: 0,
      thickness: 0,
      crispiness: 0,
      saltiness: 0,
      darkness: 0,
      overall: 0,
      locationPlaceId: null,
      locationLat: null,
      locationLng: null
    });
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
      setError("Oops - something's missing");
      return;
    }

    if (!user) {
      handleLoginRedirect();
      return;
    }

    await submitPost();
  };

  const submitPost = async () => {
    setLoading(true);
    setError('');

    try {
      const imageUrl = await uploadImage(image);
      const postData = {
        ...formData,
        imageUrl,
        createdAt: new Date().toISOString(),
        username: user?.displayName || 'Anonymous',
        userId: user?.uid || 'anonymous'
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
        
        // If coordinates aren't available, try to geocode the location name
        let finalLat = formData.locationLat;
        let finalLng = formData.locationLng;
        let finalPlaceId = formData.locationPlaceId;

        if ((!finalLat || !finalLng) && isGoogleMapsLoaded && window.google?.maps?.Geocoder) {
          try {
            const geocoder = new window.google.maps.Geocoder();
            const geocodeResult = await new Promise((resolve, reject) => {
              geocoder.geocode({ address: formData.locationName }, (results, status) => {
                if (status === 'OK' && results[0]) {
                  resolve(results[0]);
                } else {
                  resolve(null);
                }
              });
            });

            if (geocodeResult) {
              finalLat = geocodeResult.geometry.location.lat();
              finalLng = geocodeResult.geometry.location.lng();
              finalPlaceId = geocodeResult.place_id;
            }
          } catch (geocodeError) {
            console.error('Error geocoding location:', geocodeError);
          }
        }

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
          lastUpdated: new Date().toISOString(),
          ...(finalLat && finalLng && {
            latitude: finalLat,
            longitude: finalLng,
            placeId: finalPlaceId
          })
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

        // Add coordinates if they don't exist
        if (!locationData.latitude || !locationData.longitude) {
          let finalLat = formData.locationLat;
          let finalLng = formData.locationLng;
          let finalPlaceId = formData.locationPlaceId;

          // If coordinates aren't in form data, try to geocode
          if ((!finalLat || !finalLng) && isGoogleMapsLoaded && window.google?.maps?.Geocoder) {
            try {
              const geocoder = new window.google.maps.Geocoder();
              const geocodeResult = await new Promise((resolve, reject) => {
                geocoder.geocode({ address: formData.locationName }, (results, status) => {
                  if (status === 'OK' && results[0]) {
                    resolve(results[0]);
                  } else {
                    resolve(null);
                  }
                });
              });

              if (geocodeResult) {
                finalLat = geocodeResult.geometry.location.lat();
                finalLng = geocodeResult.geometry.location.lng();
                finalPlaceId = geocodeResult.place_id;
              }
            } catch (geocodeError) {
              console.error('Error geocoding location:', geocodeError);
            }
          }

          if (finalLat && finalLng) {
            updateData.latitude = finalLat;
            updateData.longitude = finalLng;
            if (finalPlaceId) {
              updateData.placeId = finalPlaceId;
            }
          }
        }
        console.log('Location update data:', updateData);
        try {
          await updateDoc(locationDoc.ref, updateData);
          console.log('Location document updated successfully');
        } catch (error) {
          console.error('Error updating location document:', error);
          throw error;
        }
      }

      // Watch for moderation deletion before navigating away.
      // If the Cloud Function flags and removes the post, show the modal.
      // If the post survives 12s, it passed — navigate home.
      const unsubscribe = onSnapshot(doc(db, 'posts', postDoc.id), (snapshot) => {
        if (!snapshot.exists()) {
          clearTimeout(moderationTimeout);
          unsubscribe();
          setLoading(false);
          setShowModerationModal(true);
        }
      });
      const moderationTimeout = setTimeout(() => {
        unsubscribe();
        setLoading(false);
        router.push('/');
      }, 12000);

    } catch (error) {
      console.error('Error in handleSubmit:', error);
      setError('Error submitting post. Please try again.');
      setLoading(false);
    }
    // Note: setLoading(false) is handled by the moderation snapshot/timeout above
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
                  className={`w-8 h-8 ${star <= value ? '' : 'text-gray-300'}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  style={star <= value ? { color: 'var(--yellow-custom)' } : {}}
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </button>
            ))}
          </div>
          {/* Descriptor removed per request */}
        </div>
      </div>
    );
  };

  // Rating Scale Component
  const RatingScale = ({ label, value, onChange, isFirst = false, displayTitle }) => {
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
      <div>
        <h3 className={`text-lg font-bold mb-0 px-4 sm:px-6 font-baloo2 ${isFirst ? 'pt-4' : ''}`}>{displayTitle || label}</h3>
        <div className="relative h-[60px]">
          <div className="absolute inset-x-0 top-0 bottom-0 flex items-center pl-4 sm:pl-6 pr-4 sm:pr-6">
            <div className="flex items-center gap-2 flex-1">
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleClick(num)}
                  className="focus:outline-none"
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors
                      ${value === num 
                        ? 'text-white' 
                        : 'bg-gray-100 text-gray-700'
                      }`}
                    style={value === num ? { backgroundColor: 'var(--blue-custom)' } : {}}
                  />
                </button>
              ))}
            </div>
            {value > 0 && (
              <span className="text-lg font-medium text-black ml-4 text-right font-baloo2 uppercase whitespace-nowrap">
                {ratingDescriptors[label.toLowerCase()][value]}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Add effect to close suggestions on outside click
  useEffect(() => {
    if (!showSuggestions) return;
    function handleClickOutside(event) {
      if (!tagInputContainerRef.current) return;
      
      const clickedElement = event.target;
      const container = tagInputContainerRef.current;
      
      // Check if click is on the title (h3 element) or its children
      const title = container.querySelector('h3');
      const clickedOnTitle = title && (title === clickedElement || title.contains(clickedElement));
      
      // Check if click is inside the input field or dropdown
      const isInsideInput = container.querySelector('input') === clickedElement || 
                           container.querySelector('input')?.contains(clickedElement);
      const isInsideDropdown = container.querySelector('[class*="absolute z-20"]')?.contains(clickedElement);
      
      // Close if clicked outside container, or on title, but not if clicked on input or dropdown
      if (!container.contains(clickedElement) || (clickedOnTitle && !isInsideInput && !isInsideDropdown)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSuggestions]);

  // Save form data to localStorage before redirecting to login
  const handleLoginRedirect = () => {
    // Save the current form state
    localStorage.setItem('pendingPost', JSON.stringify({
      image: preview,
      formData,
      currentPage
    }));
    // Redirect to login page
    router.push('/login?redirect=new');
  };

  // Check for pending post data on component mount
  useEffect(() => {
    const pendingPost = localStorage.getItem('pendingPost');
    if (pendingPost && user) {
      const { image: savedImage, formData: savedFormData, currentPage: savedPage } = JSON.parse(pendingPost);
      setPreview(savedImage);
      setFormData(savedFormData);
      setCurrentPage(savedPage);
      // Convert data URL to File object
      fetch(savedImage)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], 'temp-image.jpg', { type: 'image/jpeg' });
          setImage(file);
        });
      // Clear the pending post data
      localStorage.removeItem('pendingPost');
    }
  }, [user]);

  // Function to check if form has any data
  const hasFormData = () => {
    return !!(
      image ||
      preview ||
      formData.locationName ||
      formData.menuName ||
      formData.types.length > 0 ||
      formData.description ||
      formData.length ||
      formData.thickness ||
      formData.crispiness ||
      formData.saltiness ||
      formData.darkness ||
      formData.overall
    );
  };

  // Intercept navigation attempts
  useEffect(() => {
    if (formSubmitted || !hasFormData()) {
      return;
    }

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };

    const handleRouteChangeStart = (url) => {
      // Don't intercept if navigating to same page
      if (url === router.asPath) {
        return;
      }

      // Prevent navigation and show warning
      window.history.pushState(null, '', router.asPath);
      setPendingNavigation(url);
      setShowNavigationWarning(true);
      throw 'Navigation intercepted';
    };

    const handlePopState = (e) => {
      if (hasFormData() && !formSubmitted) {
        window.history.pushState(null, '', router.asPath);
        setPendingNavigation(router.asPath);
        setShowNavigationWarning(true);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.history.pushState(null, '', router.asPath);
    window.addEventListener('popstate', handlePopState);
    router.events.on('routeChangeStart', handleRouteChangeStart);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
      router.events.off('routeChangeStart', handleRouteChangeStart);
    };
  }, [router, formSubmitted, image, preview, formData]);

  const handleNavigationConfirm = () => {
    setShowNavigationWarning(false);
    setFormSubmitted(true); // Prevent further warnings
    if (pendingNavigation) {
      router.push(pendingNavigation);
      setPendingNavigation(null);
    }
  };

  const handleNavigationCancel = () => {
    setShowNavigationWarning(false);
    setPendingNavigation(null);
  };

  const handleDiscard = () => {
    // Clear all form data
    setImage(null);
    setPreview('');
    setFormData({
      locationName: '',
      menuName: '',
      types: [],
      description: '',
      length: 0,
      thickness: 0,
      crispiness: 0,
      saltiness: 0,
      darkness: 0,
      overall: 0,
      locationPlaceId: null,
      locationLat: null,
      locationLng: null
    });
    setError('');
    setFormSubmitted(true);
    // Navigate to home
    router.push('/');
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto p-0 sm:p-6" noValidate>
      <MessageAlert 
        type="error" 
        message={error} 
        className="mb-4" 
        onOutsideClick={() => setError('')} 
      />

      {/* Navigation Warning Modal */}
      {showNavigationWarning && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 relative" style={{ borderWidth: '3px', borderStyle: 'solid', borderColor: 'black' }}>
            <button
              onClick={handleNavigationCancel}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h3 className="text-4xl font-bold mb-3 font-rouge-script" style={{ color: 'black' }}>You sure?</h3>
            <p className="text-lg mb-6 font-baloo2 text-gray-700">
              If you leave now, your review details will be gone. Want to finish your masterpiece first?
            </p>
            <div className="flex flex-col gap-3">
                    <PrimaryButton
                      onClick={handleNavigationCancel}
                      className="w-full"
                    >
                      Complete review
                    </PrimaryButton>
              <SecondaryButton
                onClick={handleNavigationConfirm}
                className="w-full"
              >
                Leave anyway
              </SecondaryButton>
            </div>
          </div>
        </div>
      )}

      {/* Moderation Modal */}
      {showModerationModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 relative" style={{ borderWidth: '3px', borderStyle: 'solid', borderColor: 'black' }}>
            <button
              onClick={resetForm}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h3 className="text-4xl font-bold mb-3 font-rouge-script" style={{ color: 'var(--red-custom)' }}>Oops!</h3>
            <p className="text-lg mb-6 font-baloo2 text-gray-700">
              That didn&apos;t quite look like fries to us. Only fry pics allowed here — give it another shot!
            </p>
            <PrimaryButton
              onClick={resetForm}
              className="w-full"
            >
              Try again
            </PrimaryButton>
          </div>
        </div>
      )}

      <div className="relative">
        {currentPage === 1 && (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="w-full max-w-md">
              <div
                className="rounded-xl p-4 mb-6"
                style={{
                  borderWidth: '3px',
                  borderStyle: 'solid',
                  borderColor: 'black',
                  backgroundColor: '#DFEEFF'
                }}
              >
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
                      className="border-dashed rounded-md p-8 text-center cursor-pointer"
                      style={{ borderWidth: '3px', borderColor: 'var(--blue-custom)' }}
                    >
                      <div className="flex flex-col items-center justify-center">
                        <div className="relative mb-4">
                          <div className="absolute inset-0 rounded-full blur-lg" style={{ backgroundColor: 'var(--yellow-custom)', opacity: 0.1 }} />
                          <svg
                            className="w-20 h-20 relative z-10"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                            style={{ color: 'black' }}
                          >
                            <path d="M4 4H8L10 6H14L16 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4ZM12 17C14.76 17 17 14.76 17 12S14.76 7 12 7S7 9.24 7 12S9.24 17 12 17ZM12 9C13.66 9 15 10.34 15 12S13.66 15 12 15S9 13.66 9 12S10.34 9 12 9ZM18 8H20V6H18V8Z" />
                          </svg>
                        </div>
                        <div
                          className="inline-block px-10 py-2 rounded-full mt-2"
                          style={{
                            borderWidth: '3px',
                            borderStyle: 'solid',
                            borderColor: 'var(--red-custom)',
                            backgroundColor: 'var(--yellow-custom)'
                          }}
                        >
                          <p className="text-2xl font-medium font-quattrocento underline whitespace-nowrap" style={{ color: 'var(--red-custom)' }}>
                            RATE YOUR FRIES
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="relative">
                        <img
                          src={preview}
                          alt="Preview"
                          className="w-full h-64 object-cover rounded-md"
                          style={{ borderWidth: '3px', borderStyle: 'solid', borderColor: 'black' }}
                        />
                        <button
                          type="button"
                          onClick={removeImage}
                          className="absolute top-3 right-3 bg-white hover:bg-gray-100 text-gray-800 rounded-full p-3 shadow-lg"
                          style={{ borderWidth: '2px', borderStyle: 'solid', borderColor: 'black' }}
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                      <PrimaryButton onClick={handleNext} className="w-full">Looks hottt</PrimaryButton>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {currentPage === 2 && (
          <div className="space-y-0">
            <div 
              className="rounded-t-xl rounded-b-none"
              style={{ borderWidth: '3px', borderStyle: 'solid', borderColor: 'black', backgroundColor: 'var(--yellow-custom)', borderBottom: 'none' }}
            >
              <div className="px-4 py-2 sm:px-6">
                <h1 className="text-lg font-bold font-baloo2" style={{ color: 'black' }}>Step 1: The Gist</h1>
              </div>
            </div>
            <div className="bg-white rounded-b-xl rounded-t-none" style={{ borderWidth: '3px', borderStyle: 'solid', borderColor: 'black' }}>
              <div className="p-0">
            {/* Overall rating moved to top and simplified styling */}
            <h3 className="text-lg font-bold mb-0 px-4 sm:px-6 font-baloo2 pt-4 pb-0">Overall Rating *</h3>
            {/* Container: pt-2 (8px top), pb-2 (8px bottom), h-[60px] total height */}
            <div className="relative h-[60px]">
                  {/* Inner padding: pl-4 (16px left), pr-0 (no right padding) */}
                  <div className="absolute inset-x-0 top-0 bottom-0 flex items-center justify-start pl-4 pr-0">
                    <div className="flex items-center gap-0">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => updateFormData({ overall: star })}
                      className="focus:outline-none"
                    >
                          <svg
                            className={`w-12 h-12`}
                            fill={star <= formData.overall ? "currentColor" : "white"}
                            stroke={star <= formData.overall ? "none" : "black"}
                            strokeWidth={star <= formData.overall ? undefined : 1}
                        viewBox="0 0 20 20"
                        style={star <= formData.overall ? { color: 'var(--yellow-custom)' } : {}}
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </button>
                  ))}
                </div>
                {/* Descriptor removed per request */}
              </div>
            </div>
            <div className="relative mt-0">
              <div className="w-full h-[3px] bg-black mb-3"></div>
              <h3 className="text-lg font-bold mb-0 px-4 sm:px-6 font-baloo2">Location *</h3>
              {LocationInput}
            </div>
            <div className="relative mt-4">
              <h3 className="text-lg font-bold mb-0 px-4 sm:px-6 font-baloo2">Name on Menu (if applicable)</h3>
              <div className="relative h-[60px]">
                <input
                  key="menu-name-input"
                  type="text"
                  value={formData.menuName}
                  onChange={handleMenuNameChange}
                  className="w-full h-full p-4 text-base bg-transparent outline-none"
                  placeholder="Enter"
                />
              </div>
              <div className="w-full h-[3px] bg-black"></div>
            </div>

            <div className="relative mt-4 px-4 sm:px-6">
              <div ref={tagInputContainerRef}>
                <h3 className="text-lg font-bold mb-2 font-baloo2">Category *</h3>
                {showMaxLimitError && (
                  <p className="text-sm text-gray-600 mb-2">Can't add more than 4 categories</p>
                )}
                <div className="relative bg-white rounded-full h-[60px]" style={{ borderWidth: '3px', borderStyle: 'solid', borderColor: '#9CA3AF' }}>
                  <div className="p-4 h-full">
                    <div className="flex items-center h-full">
                      <input
                        key="tag-input"
                        ref={tagInputRef}
                        type="text"
                        value={tagInput}
                        onChange={handleTagInputChange}
                        onKeyDown={handleKeyDown}
                        onFocus={() => {
                          if (!tagInput) {
                            const filtered = allFryTypes
                              .filter(type => !formData.types.includes(type.value))
                              .sort((a, b) => a.label.localeCompare(b.label));
                            setSuggestions(filtered);
                          }
                          setShowSuggestions(true);
                        }}
                        className="flex-1 min-w-[150px] outline-none text-base bg-transparent"
                        placeholder={"Type to search"}
                      />
                    </div>
                  </div>
                </div>
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute z-20 left-4 sm:left-6 w-80 max-w-full mt-1.5 bg-white rounded-md" style={{ borderWidth: '3px', borderStyle: 'solid', borderColor: 'black' }}>
                    {suggestions.map((type) => (
                      <div
                        key={type.value}
                        onClick={() => addTag(type)}
                        className="flex items-center px-4 py-3 hover:bg-white/50 cursor-pointer text-base border-b border-gray-300 last:border-b-0"
                      >
                        {type.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {/* Selected tags displayed below search bar */}
              {formData.types.length > 0 && (
                <>
                  <div className="mt-3 flex flex-wrap gap-2 mb-2">
                    {formData.types.map(type => {
                      const typeInfo = allFryTypes.find(t => t.value === type);
                      return (
                        <span
                          key={type}
                          className="inline-flex items-center px-4 py-2 text-base rounded-full"
                          style={{ backgroundColor: 'var(--red-custom)', color: 'var(--yellow-custom)', borderWidth: '3px', borderStyle: 'solid', borderColor: 'var(--red-custom)' }}
                        >
                          {typeInfo?.label}
                          <button
                            type="button"
                            onClick={() => removeTag(type)}
                            className="ml-3"
                            style={{ color: 'var(--yellow-custom)' }}
                            aria-label="Remove type"
                          >
                            ×
                          </button>
                        </span>
                      );
                    })}
                  </div>
                </>
              )}
              {/* Removed suggested quick tags below the search bar per request */}
            </div>

            
            
            <div className="mt-2 px-4 sm:px-6 pb-6">
              <div className="flex flex-col gap-3">
                <PrimaryButton onClick={handleNext} className="mt-4 w-full block">Add some details</PrimaryButton>
                <TertiaryButton onClick={handleDiscard} className="w-full">Discard</TertiaryButton>
              </div>
            </div>
              </div>
            </div>
          </div>
        )}

        {currentPage === 3 && (
          <div className="space-y-0">
            <div 
              className="rounded-t-xl rounded-b-none"
              style={{ borderWidth: '3px', borderStyle: 'solid', borderColor: 'black', backgroundColor: 'var(--yellow-custom)', borderBottom: 'none' }}
            >
              <div className="px-4 py-2 sm:px-6">
                <h1 className="text-lg font-bold font-baloo2" style={{ color: 'black' }}>Step 2: The Details</h1>
              </div>
            </div>
            <div className="bg-white rounded-b-xl rounded-t-none" style={{ borderWidth: '3px', borderStyle: 'solid', borderColor: 'black' }}>
              <div className="p-0">
                <div>
                  <RatingScale
                    label="Length"
                    value={formData.length}
                    onChange={(value) => updateFormData({ length: value })}
                    isFirst={true}
                  />
                  <div className="w-full h-[3px] bg-black"></div>
                </div>

                <div className="mt-4">
                  <RatingScale
                    label="Thickness"
                    value={formData.thickness}
                    onChange={(value) => updateFormData({ thickness: value })}
                  />
                  <div className="w-full h-[3px] bg-black"></div>
                </div>

                <div className="mt-4">
                  <RatingScale
                    label="Crispiness"
                    value={formData.crispiness}
                    onChange={(value) => updateFormData({ crispiness: value })}
                  />
                  <div className="w-full h-[3px] bg-black"></div>
                </div>

                <div className="mt-4">
                  <RatingScale
                    label="Saltiness"
                    value={formData.saltiness}
                    onChange={(value) => updateFormData({ saltiness: value })}
                  />
                  <div className="w-full h-[3px] bg-black"></div>
                </div>

                <div className="mt-4">
                  <RatingScale
                    label="Darkness"
                    displayTitle="Color"
                    value={formData.darkness}
                    onChange={(value) => updateFormData({ darkness: value })}
                  />
                </div>

                <div className="mt-2 px-4 sm:px-6 pb-6">
                  <div className="flex flex-col gap-3">
                    <PrimaryButton 
                      onClick={handleNext} 
                      className="mt-4 w-full block"
                    >
                      {formData.length || formData.thickness || formData.crispiness || formData.saltiness || formData.darkness ? 'Next' : 'Skip'}
                    </PrimaryButton>
                    <TertiaryButton 
                      onClick={handleBack} 
                      className="w-full"
                    >
                      Go Back
                    </TertiaryButton>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {currentPage === 4 && (
          <div className="space-y-0">
            <div 
              className="rounded-t-xl rounded-b-none"
              style={{ borderWidth: '3px', borderStyle: 'solid', borderColor: 'black', backgroundColor: 'var(--yellow-custom)', borderBottom: 'none' }}
            >
              <div className="px-4 py-2 sm:px-6">
                <h1 className="text-lg font-bold font-baloo2" style={{ color: 'black' }}>Step 3: The Finishing Touch</h1>
              </div>
            </div>
            <div className="bg-white rounded-b-xl rounded-t-none" style={{ borderWidth: '3px', borderStyle: 'solid', borderColor: 'black' }}>
              <div className="p-0">
                <h3 className="text-lg font-bold mb-0 px-4 sm:px-6 font-baloo2 pt-4">Spill The Tea...</h3>
                <div className="relative bg-white rounded-md mx-4 sm:mx-6 mt-2" style={{ borderWidth: '3px', borderStyle: 'solid', borderColor: 'black' }}>
                  <textarea
                    value={formData.description}
                    onChange={handleDescriptionChange}
                    className="w-full p-4 text-base bg-transparent outline-none"
                    rows="8"
                    placeholder="Highly encouraged!"
                  />
                </div>

                <div className="mt-4 px-4 sm:px-6 pb-6">
                  <div className="flex flex-col gap-3">
                    <PrimaryButton
                      type="button"
                      onClick={handleSubmit}
                      disabled={loading}
                      className="mt-4 w-full block"
                    >
                      {loading ? 'Submitting...' : (
                        formData.length || formData.thickness || formData.crispiness || 
                        formData.saltiness || formData.darkness || formData.description
                          ? 'Submit'
                          : 'Submit without details'
                      )}
                    </PrimaryButton>
                    <TertiaryButton 
                      onClick={handleBack} 
                      className="w-full"
                    >
                      Go Back
                    </TertiaryButton>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </form>
  );
}
