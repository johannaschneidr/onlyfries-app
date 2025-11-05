import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function TagTypeDropdown({
  allFryTypes,
  selectedTags,
  setSelectedTags,
  placeholder = 'Type of fries',
  className = '',
}) {
  const [tagInput, setTagInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const tagInputRef = useRef(null);
  const tagInputContainerRef = useRef(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const dropdownMenuRef = useRef(null);

  useEffect(() => {
    if (tagInput) {
      const filtered = allFryTypes.filter(type =>
        type.label.toLowerCase().includes(tagInput.toLowerCase()) &&
        !selectedTags.includes(type.value)
      );
      setSuggestions(filtered.sort((a, b) => a.label.localeCompare(b.label)));
    } else {
      const filtered = allFryTypes.filter(type => !selectedTags.includes(type.value));
      setSuggestions(filtered.sort((a, b) => a.label.localeCompare(b.label)));
    }
  }, [tagInput, allFryTypes, selectedTags]);

  useEffect(() => {
    if (!showSuggestions) return;
    function handleClickOutside(event) {
      const target = event.target;
      // Check if click is outside both the input container and the dropdown menu
      if (
        tagInputContainerRef.current &&
        !tagInputContainerRef.current.contains(target) &&
        dropdownMenuRef.current &&
        !dropdownMenuRef.current.contains(target)
      ) {
        setShowSuggestions(false);
      }
    }
    // Use capture phase to catch clicks earlier
    document.addEventListener('mousedown', handleClickOutside, true);
    document.addEventListener('touchstart', handleClickOutside, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
      document.removeEventListener('touchstart', handleClickOutside, true);
    };
  }, [showSuggestions]);

  // Position dropdown absolutely in the viewport
  useEffect(() => {
    if (showSuggestions && tagInputContainerRef.current) {
      const rect = tagInputContainerRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, [showSuggestions, selectedTags, tagInput]);

  const addTag = (type) => {
    if (!selectedTags.includes(type.value)) {
      setSelectedTags(prev => [...prev, type.value]);
    }
    setTagInput('');
    if (tagInputRef.current) tagInputRef.current.focus();
  };
  const removeTag = (typeToRemove) => {
    setSelectedTags(prev => prev.filter(type => type !== typeToRemove));
  };
  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' && tagInput && suggestions.length > 0) {
      e.preventDefault();
      addTag(suggestions[0]);
    } else if (e.key === 'Backspace' && !tagInput && selectedTags.length > 0) {
      removeTag(selectedTags[selectedTags.length - 1]);
    }
  };

  return (
    <div className={`relative ${className}`} ref={tagInputContainerRef}>
      {/* Selected tags displayed above input field */}
      {selectedTags.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {selectedTags.map(type => {
            const typeInfo = allFryTypes.find(t => t.value === type);
            return (
              <span
                key={type}
                className="inline-flex items-center px-3 py-1 text-base capitalize font-bold font-baloo2"
                style={{ color: 'var(--yellow-custom)', background: 'var(--red-custom)' }}
              >
                {typeInfo?.label || type}
                <button
                  type="button"
                  onClick={() => removeTag(type)}
                  className="ml-1 text-white hover:text-gray-200"
                >
                  ×
                </button>
              </span>
            );
          })}
        </div>
      )}
      {/* Input field matching PostForm style */}
      <div className="relative bg-white rounded-full h-[60px]" style={{ borderWidth: '3px', borderStyle: 'solid', borderColor: '#9CA3AF' }}>
        <div className="p-4 h-full">
          <div className="flex items-center h-full">
            <input
              ref={tagInputRef}
              type="text"
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              onFocus={() => setShowSuggestions(true)}
              className="flex-1 min-w-[150px] outline-none text-base bg-transparent"
              placeholder="Type to search"
            />
          </div>
        </div>
      </div>
      {/* Portal dropdown menu */}
      {showSuggestions && suggestions.length > 0 && typeof window !== 'undefined' && createPortal(
        <div
          ref={dropdownMenuRef}
          className="absolute z-30 w-full mt-1.5 bg-white rounded-md shadow-lg"
          style={{
            position: 'absolute',
            top: dropdownPos.top,
            left: dropdownPos.left,
            width: dropdownPos.width,
            zIndex: 30,
            borderWidth: '3px',
            borderStyle: 'solid',
            borderColor: 'black'
          }}
        >
          {suggestions.map((type) => (
            <div
              key={type.value}
              onClick={() => addTag(type)}
              className="flex items-center px-4 py-3 hover:bg-white/50 cursor-pointer text-base border-b border-gray-300 last:border-b-0"
            >
              {type.label}
            </div>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
} 