import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

const Combobox = ({ value, onChange, options = [], placeholder, label, disabled = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const containerRef = useRef(null);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

    // Initial load
    // Fix: Avoid setting state in effect. Initialize state from props instead if needed.
    // useEffect(() => {
    //     const option = options.find(o => o.value === value);
    //     if (option) {
    //         setQuery(option.label);
    //     } else if (value) {
    //         setQuery(value); // Fallback for custom values
    //     }
    // }, [value, options]);

    // Update position when opening
    useEffect(() => {
        if (isOpen && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            // Decide whether to open up or down based on space
            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;
            const openUpwards = spaceBelow < 250 && spaceAbove > spaceBelow;

            setDropdownPosition({
                top: openUpwards ? rect.top - 8 : rect.bottom + 8,
                left: rect.left,
                width: rect.width,
                transformOrigin: openUpwards ? 'bottom' : 'top',
                placement: openUpwards ? 'bottom' : 'top'
            });
        }
    }, [isOpen]);

    // Close on scroll/resize BUT allow scrolling inside the dropdown content
    useEffect(() => {
        const handleScroll = (event) => {
            // If the scroll target is the dropdown itself or inside it, do nothing (keep open)
            if (event.target.closest && event.target.closest('.portal-dropdown')) return;
            // Otherwise (scrolling the main page), close it
            if (isOpen) setIsOpen(false);
        };

        window.addEventListener('resize', handleScroll);
        window.addEventListener('scroll', handleScroll, true); // Capture phase required
        return () => {
            window.removeEventListener('resize', handleScroll);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, [isOpen]);

    // Click outside handler
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                // If clicking outside container, check if clicking inside portal using class name
                if (!event.target.closest('.portal-dropdown')) {
                    setIsOpen(false);
                }
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Filtering logic
    const selectedOption = options.find(o => o.value === value);
    const isQueryMatchingSelection = selectedOption && query === selectedOption.label;

    const filteredOptions = (query === '' || isQueryMatchingSelection)
        ? options
        : options.filter((option) =>
            option.label.toLowerCase().includes(query.toLowerCase())
        );

    const handleSelect = (option) => {
        onChange(option.value);
        setQuery(option.label);
        setIsOpen(false);
    };

    return (
        <div className="relative group w-full" ref={containerRef}>
            {label && (
                <label className="text-xs mb-2 block font-medium ml-1" style={{ color: 'hsl(220, 10%, 55%)' }}>
                    {label}
                </label>
            )}

            <div className="relative">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        onChange && onChange(e.target.value); // Allow typing custom values if parent handles it, but usually parent expects value
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    placeholder={placeholder}
                    disabled={disabled}
                    className="glass-input w-full py-3 pl-4 pr-10 text-sm"
                />
                <button
                    onClick={() => !disabled && setIsOpen(!isOpen)}
                    disabled={disabled}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 transition-colors"
                    style={{ color: isOpen ? 'hsl(175, 85%, 55%)' : 'hsl(220, 10%, 55%)' }}
                >
                    <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </button>
            </div>

            {/* Portal Dropdown */}
            {isOpen && createPortal(
                <AnimatePresence>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.1 }}
                        className="portal-dropdown fixed z-[9999] overflow-hidden rounded-xl shadow-2xl border border-white/10 backdrop-blur-xl"
                        style={{
                            top: dropdownPosition.transformOrigin === 'bottom' ? 'auto' : dropdownPosition.top,
                            bottom: dropdownPosition.transformOrigin === 'bottom' ? (window.innerHeight - dropdownPosition.top + 8) : 'auto',
                            left: dropdownPosition.left,
                            width: dropdownPosition.width,
                            maxHeight: '300px',
                            background: 'hsla(220, 20%, 8%, 0.95)',
                            borderColor: 'hsla(175, 40%, 30%, 0.15)',
                        }}
                    >
                        <div className="max-h-[300px] overflow-y-auto py-1 custom-scrollbar">
                            {filteredOptions.length > 0 ? (
                                <div className="p-1 space-y-0.5">
                                    {filteredOptions.map((option) => (
                                        <button
                                            key={option.value}
                                            onClick={() => handleSelect(option)}
                                            className="w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center justify-between transition-all duration-200"
                                            style={value === option.value ? {
                                                background: 'hsla(175, 85%, 50%, 0.1)',
                                                color: 'hsl(175, 85%, 60%)',
                                                fontWeight: 500,
                                            } : {
                                                color: 'hsl(210, 40%, 85%)',
                                            }}
                                            onMouseEnter={(e) => {
                                                if (value !== option.value) {
                                                    e.currentTarget.style.background = 'hsla(175, 40%, 30%, 0.1)';
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                if (value !== option.value) {
                                                    e.currentTarget.style.background = 'transparent';
                                                }
                                            }}
                                        >
                                            <span>{option.label}</span>
                                            {value === option.value && <Check size={14} style={{ color: 'hsl(175, 85%, 55%)' }} />}
                                        </button>
                                    ))}
                                </div>
                            ) : query && (
                                <div className="px-4 py-3 text-sm" style={{ color: 'hsl(220, 10%, 55%)' }}>
                                    Использовать свой вариант: <span style={{ color: 'hsl(175, 85%, 55%)', fontWeight: 500 }}>"{query}"</span>
                                </div>
                            )}

                            {filteredOptions.length === 0 && !query && (
                                <div className="px-4 py-8 text-sm text-center" style={{ color: 'hsl(220, 10%, 55%)' }}>
                                    Нет вариантов
                                </div>
                            )}
                        </div>
                    </motion.div>
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
};

export default Combobox;
