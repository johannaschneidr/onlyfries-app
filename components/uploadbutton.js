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
                onClick={handleRemoveImage}
                className="absolute top-3 right-3 bg-white hover:bg-gray-100 text-gray-800 rounded-full p-3 shadow-lg"
                style={{ borderWidth: '2px', borderStyle: 'solid', borderColor: 'black' }}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
            <button
              type="button"
              onClick={handleProceed}
              className="w-full px-10 py-2 rounded-full text-2xl font-medium font-quattrocento underline"
              style={{ 
                backgroundColor: 'var(--yellow-custom)',
                borderWidth: '3px',
                borderStyle: 'solid',
                borderColor: 'var(--red-custom)',
                color: 'var(--red-custom)'
              }}
            >
              Looks hottt
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 