import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Combobox = ({ value, onChange, options = [], placeholder, label }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const containerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const option = options.find(o => o.value === value);
        if (option) {
            setQuery(option.label);
        } else if (value) {
            setQuery(value);
        }
    }, [value, options]);

    const filteredOptions = query === ''
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
        <div className="relative group" ref={containerRef}>
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
                        onChange(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    placeholder={placeholder}
                    className="glass-input w-full py-3 pl-4 pr-10 text-sm"
                />
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 transition-colors"
                    style={{ color: isOpen ? 'hsl(175, 85%, 55%)' : 'hsl(220, 10%, 55%)' }}
                >
                    <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </button>
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 5, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 5, scale: 0.98 }}
                        transition={{ duration: 0.12 }}
                        className="absolute z-50 w-full mt-2 rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto left-0"
                        style={{
                            background: 'hsla(220, 20%, 8%, 0.92)',
                            backdropFilter: 'blur(20px)',
                            WebkitBackdropFilter: 'blur(20px)',
                            border: '1px solid hsla(175, 40%, 30%, 0.15)',
                        }}
                    >
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
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Combobox;
