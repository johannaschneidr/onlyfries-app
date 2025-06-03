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
  const [inputWidth, setInputWidth] = useState(2);
  const inputSizerRef = useRef(null);

  useEffect(() => {
    if (tagInput) {
      const filtered = allFryTypes.filter(type =>
        type.label.toLowerCase().includes(tagInput.toLowerCase()) &&
        !selectedTags.includes(type.value)
      );
      setSuggestions(filtered);
    } else {
      const filtered = allFryTypes.filter(type => !selectedTags.includes(type.value));
      setSuggestions(filtered);
    }
  }, [tagInput, allFryTypes, selectedTags]);

  useEffect(() => {
    if (!showSuggestions) return;
    function handleClickOutside(event) {
      if (
        tagInputContainerRef.current &&
        !tagInputContainerRef.current.contains(event.target) &&
        dropdownMenuRef.current &&
        !dropdownMenuRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
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

  useEffect(() => {
    if (inputSizerRef.current) {
      setInputWidth(inputSizerRef.current.offsetWidth + 2);
    }
  }, [tagInput]);

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
      <div className="relative bg-white rounded-md border border-white/50">
        <div className="py-2 px-4">
          <div
            className="flex flex-wrap gap-2 items-center relative min-h-[36px]"
            onClick={() => tagInputRef.current && tagInputRef.current.focus()}
            style={{ cursor: 'text' }}
          >
            {selectedTags.map(type => {
              const typeInfo = allFryTypes.find(t => t.value === type);
              return (
                <span
                  key={type}
                  className="inline-flex items-center px-3 py-1 text-sm bg-white/60 backdrop-blur-sm text-gray-700 rounded-full border border-gray-400"
                >
                  {typeInfo?.label || type}
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
            {selectedTags.length === 0 && !tagInput && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none select-none pl-1 text-base">
                Search for type
              </span>
            )}
            <input
              ref={tagInputRef}
              type="text"
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              onFocus={() => setShowSuggestions(true)}
              className="min-w-0 outline-none text-base bg-transparent"
              style={{ width: inputWidth }}
              placeholder=""
            />
            {/* Hidden span to measure input width */}
            <span
              ref={inputSizerRef}
              className="invisible absolute whitespace-pre pointer-events-none text-base"
              style={{ padding: 0, margin: 0 }}
            >
              {tagInput || ' '}
            </span>
          </div>
        </div>
      </div>
      {/* Portal dropdown menu */}
      {showSuggestions && suggestions.length > 0 && typeof window !== 'undefined' && createPortal(
        <div
          ref={dropdownMenuRef}
          className="absolute z-[9999] w-full mt-1.5 bg-white border border-white/50 rounded-md shadow-lg"
          style={{
            position: 'absolute',
            top: dropdownPos.top,
            left: dropdownPos.left,
            width: dropdownPos.width,
            zIndex: 9999,
          }}
        >
          {suggestions.map((type) => (
            <div
              key={type.value}
              onClick={() => addTag(type)}
              className="flex items-center px-4 py-2 hover:bg-gray-100 cursor-pointer text-base border-b border-white/30 last:border-b-0"
            >
              <svg className="w-4 h-4 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              {type.label}
            </div>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
} 