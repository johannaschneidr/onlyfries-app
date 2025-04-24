import { useState, useRef } from 'react';
import { useRouter } from 'next/router';

export default function UploadButton() {
  const [preview, setPreview] = useState('');
  const imageInputRef = useRef(null);
  const router = useRouter();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        return;
      }
      setPreview(URL.createObjectURL(file));
      // Store the file in localStorage temporarily
      localStorage.setItem('tempImage', URL.createObjectURL(file));
    }
  };

  const handleProceed = () => {
    // Navigate to the new post page with a query parameter to skip the first page
    router.push('/new?page=2');
  };

  const handleRemoveImage = () => {
    setPreview('');
    localStorage.removeItem('tempImage');
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 mb-6">
      <div className="relative">
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="hidden"
        />
        {!preview ? (
          <div 
            onClick={() => imageInputRef.current?.click()}
            className="border-2 border-dashed border-white rounded-md p-8 text-center cursor-pointer"
          >
            <div className="flex flex-col items-center justify-center">
              <div className="relative mb-4">
                <div className="absolute inset-0 bg-yellow-400/10 rounded-full blur-lg" />
                <svg 
                  className="w-16 h-16 text-yellow-500 relative z-10" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <p className="text-lg font-medium text-gray-700">
                Rate your Fries!
              </p>
              <p className="text-sm text-gray-500 mt-2">
                PNG, JPG up to 5MB
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <img 
                src={preview} 
                alt="Preview" 
                className="w-full h-64 object-cover rounded-md"
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute top-3 right-3 bg-white/60 backdrop-blur-sm hover:bg-white text-gray-800 rounded-full p-3 shadow-lg"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
            <button
              type="button"
              onClick={handleProceed}
              className="w-full bg-yellow-500 text-white py-4 px-6 rounded-md text-lg font-semibold"
            >
              Rate
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 