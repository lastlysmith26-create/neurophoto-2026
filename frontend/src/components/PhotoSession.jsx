import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Camera, Upload, Sparkles, Image as ImageIcon, Download, Trash2, Plus, RefreshCw, Send, X, ChevronLeft, ChevronRight, ChevronDown, Maximize2, ZoomIn, AlertTriangle, Check, SlidersHorizontal, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { modelsApi, generateApi } from '../api/client';
import Combobox from './ui/Combobox';

const GENERATION_TIME_ESTIMATE_SINGLE = 30; // 30 seconds for single photo
const GENERATION_TIME_ESTIMATE_PARALLEL = 120; // 2 minutes for 4 photos
const COLLAGE_TIME_ESTIMATE = 40;
const EXTRA_COLLAGE_TIME_ESTIMATE = 40;
const CUSTOM_TIME_ESTIMATE = 70;

const LOADING_MESSAGES = [
    "Подготовка модели...",
    "Надеваем одежду...",
    "Подготовка камеры и света...",
    "Рендеринг изображения...",
    "Финальная обработка..."
];

const PRODUCT_TYPES = [
    { value: 't-shirt on model', label: 'Футболка' },
    { value: 'hoodie on model', label: 'Худи' },
    { value: 'dress on model', label: 'Платье' },
    { value: 'sunglasses on face', label: 'Очки' },
    { value: 'jewelry necklace', label: 'Украшение (шея)' },
    { value: 'jewelry earrings', label: 'Серьги' },
    { value: 'hat on head', label: 'Головной убор' },
    { value: 'shoes on feet', label: 'Обувь' },
];

const BACKGROUNDS = [
    { value: 'white studio background, professional lighting', label: 'Студия (Белый)' },
    { value: 'grey studio background, soft shadows', label: 'Студия (Серый)' },
    { value: 'black studio background, dramatic lighting', label: 'Студия (Чёрный)' },
];

// POSES removed - auto-selected by AI

const ASPECT_RATIOS = [
    { value: '1:1', label: '1:1' },
    { value: '3:4', label: '3:4' },
    { value: '4:3', label: '4:3' },
    { value: '9:16', label: '9:16' },
    { value: '16:9', label: '16:9' },
    { value: '2:3', label: '2:3' },
    { value: '3:2', label: '3:2' },
    { value: '4:5', label: '4:5' },
    { value: '5:4', label: '5:4' },
    { value: '21:9', label: '21:9' },
];

const IMAGE_SIZES = [
    { value: '1K', label: '1K' },
    { value: '2K', label: '2K' },
    { value: '4K', label: '4K (Upscale)' },
];

const DynamicProgressTimer = ({ isActive, duration, messages = [] }) => {
    const [elapsed, setElapsed] = useState(0);
    const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

    useEffect(() => {
        if (!isActive) {
            setElapsed(0);
            setCurrentMessageIndex(0);
            return;
        }

        const interval = setInterval(() => {
            setElapsed(prev => prev + 0.1);
        }, 100);

        return () => clearInterval(interval);
    }, [isActive]);

    // Update message based on progress
    useEffect(() => {
        if (!isActive || messages.length === 0) return;

        const messageDuration = duration / messages.length;
        const newIndex = Math.min(
            Math.floor(elapsed / messageDuration),
            messages.length - 1
        );

        if (newIndex !== currentMessageIndex) {
            setCurrentMessageIndex(newIndex);
        }
    }, [elapsed, duration, messages, isActive, currentMessageIndex]);

    if (!isActive) return null;

    const progress = Math.min((elapsed / duration) * 100, 95);
    // const remaining = Math.max(0, Math.ceil(duration - elapsed)); // Not used in new UI
    // const formatTime = (sec) => sec >= 60 ? `${Math.floor(sec / 60)} мин. ${sec % 60} сек.` : `${sec} сек.`; // Not used in new UI

    return (
        <div className="space-y-4 px-4 w-full h-full flex flex-col items-center justify-center text-center">
            <div className="flex flex-col items-center gap-4">
                <div className="relative">
                    <div className="w-12 h-12 rounded-full border-2 border-white/10 border-t-primary animate-spin" />
                    <Sparkles className="absolute inset-0 m-auto text-primary animate-pulse" size={16} />
                </div>
                <div className="space-y-1">
                    <p className="text-sm font-medium text-white/90 animate-pulse">
                        {messages[currentMessageIndex] || 'Генерация...'}
                    </p>
                    <p className="text-xs text-white/50 font-mono">
                        {Math.round(progress)}%
                    </p>
                </div>
            </div>

            <div className="w-full max-w-[120px] h-1.5 rounded-full overflow-hidden bg-white/10">
                <motion.div
                    className="h-full rounded-full"
                    style={{ background: 'hsl(175, 85%, 50%)' }}
                    initial={{ width: '0%' }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                />
            </div>
        </div>
    );
};

const GenerationPlaceholder = ({ aspectRatio = '3:4', duration, messages }) => {
    return (
        <div className={`glass-card p-2 rounded-xl relative overflow-hidden bg-white/5 border border-white/10`}>
            <div className={`aspect-[${aspectRatio.replace(':', '/')}] rounded-lg overflow-hidden relative flex items-center justify-center bg-black/20`}>
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent animate-shimmer"
                    style={{ backgroundSize: '200% 100%' }} />
                <DynamicProgressTimer isActive={true} duration={duration} messages={messages} />
            </div>
        </div>
    );
};

// Toast notification
const Toast = ({ message, type = 'error', onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 4000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-4 right-4 z-50 flex items-center gap-2 px-5 py-3 rounded-xl shadow-2xl text-sm font-medium max-w-sm"
            style={{
                background: type === 'success' ? 'hsla(175, 85%, 30%, 0.95)' : 'hsla(0, 65%, 40%, 0.95)',
                color: 'white',
                backdropFilter: 'blur(12px)',
                border: `1px solid ${type === 'success' ? 'hsla(175, 85%, 50%, 0.3)' : 'hsla(0, 65%, 50%, 0.3)'}`,
            }}
        >
            {type === 'success' ? <Check size={16} /> : <AlertTriangle size={16} />}
            {message}
        </motion.div>
    );
};

const FullscreenViewer = ({ images, currentIndex, onClose, onDownload }) => {
    const [index, setIndex] = useState(currentIndex);

    const goNext = useCallback(() => setIndex(prev => (prev + 1) % images.length), [images.length]);
    const goPrev = useCallback(() => setIndex(prev => (prev - 1 + images.length) % images.length), [images.length]);

    useEffect(() => {
        const handleKey = (e) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowRight') goNext();
            if (e.key === 'ArrowLeft') goPrev();
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [onClose, goNext, goPrev]);

    const currentImage = images[index];
    if (!currentImage) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center"
            style={{ background: 'hsla(220, 15%, 3%, 0.95)', backdropFilter: 'blur(24px)' }}
            onClick={onClose}
        >
            <button onClick={onClose} className="absolute top-4 right-4 z-10 p-3 rounded-full transition-all"
                style={{ background: 'hsla(220, 15%, 18%, 0.6)', color: 'hsl(210, 40%, 90%)' }}>
                <X size={24} />
            </button>

            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 px-4 py-2 rounded-full text-sm font-mono"
                style={{ background: 'hsla(220, 15%, 18%, 0.6)', color: 'hsl(175, 85%, 60%)' }}>
                {index + 1} / {images.length}
            </div>

            <button onClick={(e) => { e.stopPropagation(); onDownload(currentImage.url, currentImage.filename); }}
                className="glow-btn absolute top-4 left-4 z-10 px-4 py-2.5 flex items-center gap-2 text-sm">
                <Download size={16} /> Скачать
            </button>

            {images.length > 1 && (
                <>
                    <button onClick={(e) => { e.stopPropagation(); goPrev(); }}
                        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full transition-all"
                        style={{ background: 'hsla(220, 15%, 18%, 0.6)', color: 'hsl(210, 40%, 90%)' }}>
                        <ChevronLeft size={28} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); goNext(); }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full transition-all"
                        style={{ background: 'hsla(220, 15%, 18%, 0.6)', color: 'hsl(210, 40%, 90%)' }}>
                        <ChevronRight size={28} />
                    </button>
                </>
            )}

            <motion.img key={index} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }} src={currentImage.url} alt={`Photo ${index + 1}`}
                className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg"
                style={{ boxShadow: '0 0 60px -10px hsla(175, 85%, 50%, 0.1)' }}
                onClick={(e) => e.stopPropagation()} />
        </motion.div>
    );
};

const PhotoSession = () => {
    const [models, setModels] = useState([]);
    const [modelsLoading, setModelsLoading] = useState(true);
    const [selectedModel, setSelectedModel] = useState(null);
    const [productImages, setProductImages] = useState([]);
    const [backgroundRefImage, setBackgroundRefImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [loadingVariations, setLoadingVariations] = useState(false);
    const [loadingParallel, setLoadingParallel] = useState(false); // New state
    const [loadingExtra, setLoadingExtra] = useState(false);
    const [result, setResult] = useState(null);
    const [generatedImages, setGeneratedImages] = useState([]);
    const [showParallelButton, setShowParallelButton] = useState(false); // New state
    const [customPrompt, setCustomPrompt] = useState('');
    const [fullscreenIndex, setFullscreenIndex] = useState(null);
    const [toast, setToast] = useState(null);
    const resultsEndRef = useRef(null);

    const [settings, setSettings] = useState({
        productType: '',
        background: '',
        pose: '', // Will be ignored/auto
        aspectRatio: '3:4',
        imageSize: '1K',
        age: '',
        clothing: '',
    });

    const [sliders, setSliders] = useState({
        similarity: 70,
        stylization: 50,
        realism: 80,
        creativity: 40,
        detail: 70,
    });

    const [showSliders, setShowSliders] = useState(false);

    // Load models on mount & on window focus
    useEffect(() => { loadModels(); }, []);
    useEffect(() => {
        const onFocus = () => loadModels();
        window.addEventListener('focus', onFocus);
        return () => window.removeEventListener('focus', onFocus);
    }, []);
    useEffect(() => {
        if (generatedImages.length > 0) resultsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [generatedImages.length]);

    const loadModels = async () => {
        setModelsLoading(true);
        try {
            const response = await modelsApi.getAll();
            setModels(response.data);
        } catch (error) { console.error('Error loading models:', error); }
        finally { setModelsLoading(false); }
    };

    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);
        files.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => setProductImages(prev => [...prev, { file, preview: reader.result }]);
            reader.readAsDataURL(file);
        });
        e.target.value = '';
    };

    const handleRemoveProductImage = (index) => setProductImages(prev => prev.filter((_, i) => i !== index));

    const handleBackgroundImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setBackgroundRefImage({ file, preview: reader.result });
            reader.readAsDataURL(file);
        }
        e.target.value = '';
    };

    const buildFormData = (extraFields = {}) => {
        const formData = new FormData();
        formData.append('modelId', selectedModel.id);
        formData.append('productImage', productImages[0].file);
        formData.append('gender', selectedModel.gender);
        formData.append('productType', settings.productType || 'product');
        formData.append('background', settings.background || 'studio background');
        if (settings.aspectRatio) formData.append('aspectRatio', settings.aspectRatio);
        if (settings.imageSize) formData.append('imageSize', settings.imageSize);
        if (settings.age) formData.append('age', settings.age);
        if (settings.clothing) formData.append('clothing', settings.clothing);
        formData.append('sliders', JSON.stringify(sliders));
        if (backgroundRefImage?.file) formData.append('backgroundImage', backgroundRefImage.file);
        Object.entries(extraFields).forEach(([key, val]) => formData.append(key, val));
        return formData;
    };

    const handleGenerate = async () => {
        if (!selectedModel || productImages.length === 0) return;
        setLoading(true);
        setResult(null);
        setGeneratedImages([]);
        setShowParallelButton(false);
        try {
            const formData = buildFormData({ pose: 'best flattering angle' }); // Auto angle
            const response = await generateApi.generateImage(formData);
            setResult(response.data);
            setShowParallelButton(true); // Enable "4 more" button
            // Scroll to results
            setTimeout(() => resultsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        } catch (error) {
            console.error('Generation failed:', error);
            setToast({ message: 'Ошибка генерации. Попробуйте ещё раз.', type: 'error' });
        }
        finally { setLoading(false); }
    };

    // Generate 4 parallel variations with streaming
    const handleGenerateParallel = async () => {
        if (!selectedModel || productImages.length === 0) return; // Added validation

        setLoadingParallel(true);
        setResult(null); // Clear single result if any
        setShowParallelButton(false); // Hide button while loading

        // Initialize 4 loading placeholders with unique temporary IDs
        const placeholders = Array(4).fill().map((_, i) => ({
            loading: true,
            id: `temp-${Date.now()}-${i}`,
            index: i
        }));
        setGeneratedImages(prev => [...placeholders, ...prev]); // Prepend new placeholders to existing list

        try {
            const formData = buildFormData({});

            await generateApi.generateParallelStream(
                formData,
                (data) => {
                    console.log("Stream received image:", data);
                    // Update specific image slot when ready
                    setGeneratedImages(prev => {
                        const next = [...prev];
                        // Find the placeholder by index
                        if (next[data.index]) {
                            next[data.index] = {
                                ...data.image,
                                loading: false,
                                url: data.image.url
                            };
                        }
                        return next;
                    });
                },
                (errorData) => {
                    console.error("Stream received error:", errorData);
                    // Handle error for specific slot
                    setGeneratedImages(prev => {
                        const next = [...prev];
                        if (next[errorData.index]) {
                            next[errorData.index] = { error: true, message: errorData.message, loading: false };
                        }
                        return next;
                    });
                },
                () => {
                    console.log("Stream complete");
                    setLoadingParallel(false);
                    setShowParallelButton(true); // Re-enable button
                }
            );
        } catch (error) {
            console.error("Parallel generation error:", error);
            // If global error, mark all remaining loading as error
            setGeneratedImages(prev => prev.map(img =>
                img.loading ? { error: true, message: "Failed", loading: false } : img
            ));
            setLoadingParallel(false);
            setShowParallelButton(true); // Re-enable button even on error
            setToast({ message: 'Ошибка стриминга. Проверьте консоль.', type: 'error' });
        }
    };

    const handleGenerateCollage = async () => {
        if (!selectedModel || productImages.length === 0) return;
        setLoadingVariations(true);
        try {
            const formData = buildFormData({});
            const response = await generateApi.generateVariations(formData);
            if (response.data.images?.length > 0) {
                const newImages = response.data.images.map(img => ({
                    url: img.image,
                    id: img.historyEntry?.id,
                    filename: img.historyEntry?.filename,
                }));
                setGeneratedImages(prev => [...prev, ...newImages]);
                setResult(null);
            }
        } catch (error) {
            console.error('Collage failed:', error);
            setToast({ message: 'Ошибка генерации коллажа. Попробуйте ещё раз.', type: 'error' });
        }
        finally { setLoadingVariations(false); }
    };

    const handleGenerateExtraCollage = async () => {
        if (!selectedModel || productImages.length === 0) return;
        setLoadingExtra(true);
        try {
            const formData = buildFormData({});
            const response = await generateApi.generateVariations(formData);
            if (response.data.images?.length > 0) {
                const newImages = response.data.images.map(img => ({
                    url: img.image,
                    id: img.historyEntry?.id,
                    filename: img.historyEntry?.filename,
                }));
                setGeneratedImages(prev => [...prev, ...newImages]);
            }
        } catch (error) {
            console.error('Extra collage failed:', error);
            setToast({ message: 'Ошибка генерации. Попробуйте ещё раз.', type: 'error' });
        }
        finally { setLoadingExtra(false); }
    };

    const handleGenerateCustom = async () => {
        if (!selectedModel || productImages.length === 0 || !customPrompt.trim()) return;
        setLoadingExtra(true);
        try {
            const formData = buildFormData({ count: '2', pose: customPrompt.trim() });
            const response = await generateApi.generateVariations(formData);
            if (response.data.images?.length > 0) {
                const newImages = response.data.images.map(img => ({
                    url: img.image,
                    id: img.historyEntry?.id,
                    filename: img.historyEntry?.filename,
                }));
                setGeneratedImages(prev => [...prev, ...newImages]);
                setCustomPrompt('');
            }
        } catch (error) {
            console.error('Custom generation failed:', error);
            setToast({ message: 'Ошибка генерации по описанию. Попробуйте ещё раз.', type: 'error' });
        }
        finally { setLoadingExtra(false); }
    };

    const handleDownload = async (url, filename) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = filename || 'photo.png';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            setToast({ message: 'Ошибка скачивания', type: 'error' });
        }
    };

    const allViewerImages = (() => {
        if (generatedImages.length > 0) return generatedImages;
        if (result) return [{ url: result.image, filename: result.image?.split('/').pop(), id: 'single' }];
        return [];
    })();

    const isReady = selectedModel && productImages.length > 0;

    // Custom Model Selector Component
    const ModelSelector = () => {
        const [isOpen, setIsOpen] = useState(false);
        const ref = useRef(null);
        const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

        // Update position when opening
        useEffect(() => {
            if (isOpen && ref.current) {
                const rect = ref.current.getBoundingClientRect();
                const spaceBelow = window.innerHeight - rect.bottom;
                const openUpwards = spaceBelow < 300; // Model list can be long

                setDropdownPosition({
                    top: openUpwards ? rect.top - 8 : rect.bottom + 8,
                    left: rect.left,
                    width: rect.width,
                    transformOrigin: openUpwards ? 'bottom' : 'top',
                    placement: openUpwards ? 'bottom' : 'top'
                });
            }
        }, [isOpen]);

        // Close on scroll/resize (simple version for now)
        useEffect(() => {
            const handleScroll = (event) => {
                if (event.target.closest && event.target.closest('.model-selector-dropdown')) return;
                if (isOpen) setIsOpen(false);
            };
            window.addEventListener('resize', handleScroll);
            window.addEventListener('scroll', handleScroll, true);
            return () => {
                window.removeEventListener('resize', handleScroll);
                window.removeEventListener('scroll', handleScroll, true);
            };
        }, [isOpen]);

        // Close click outside
        useEffect(() => {
            const handleClickOutside = (event) => {
                if (ref.current && !ref.current.contains(event.target) && !event.target.closest('.model-selector-dropdown')) {
                    setIsOpen(false);
                }
            };
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }, []);

        return (
            <div className="relative" ref={ref}>
                <label className="text-xs font-medium uppercase tracking-wider mb-2 block" style={{ color: 'hsl(175, 85%, 55%)' }}>1. Модель</label>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl transition-all border text-left group"
                    style={{
                        background: 'hsla(220, 20%, 8%, 0.6)',
                        borderColor: isOpen ? 'hsl(175, 85%, 50%)' : 'hsla(175, 40%, 30%, 0.2)'
                    }}
                >
                    {selectedModel ? (
                        <>
                            <div className="w-10 h-10 rounded-full overflow-hidden shrink-0" style={{ background: 'hsla(220, 15%, 14%, 0.8)' }}>
                                {selectedModel.photos?.[0] ? (
                                    <img src={`data:image/jpeg;base64,${selectedModel.photos[0].image}`} className="w-full h-full object-cover" />
                                ) : <div className="w-full h-full bg-white/10" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium truncate text-white">{selectedModel.name}</p>
                                <p className="text-xs text-white/50 capitalize">{selectedModel.gender === 'female' ? 'Жен.' : 'Муж.'} • {selectedModel.age || '25'} лет</p>
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center gap-3 text-white/50">
                            <div className="w-10 h-10 rounded-full bg-white/5" />
                            <span>Выберите модель...</span>
                        </div>
                    )}
                    <ChevronDown size={16} className={`text-white/50 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {isOpen && createPortal(
                    <AnimatePresence>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.1 }}
                            className="model-selector-dropdown fixed z-[9999] overflow-hidden rounded-xl shadow-2xl border border-white/10 backdrop-blur-xl"
                            style={{
                                top: dropdownPosition.placement === 'bottom' ? 'auto' : dropdownPosition.top,
                                bottom: dropdownPosition.placement === 'bottom' ? (window.innerHeight - dropdownPosition.top + 8) : 'auto',
                                left: dropdownPosition.left,
                                width: dropdownPosition.width,
                                maxHeight: '300px',
                                background: 'hsla(220, 20%, 8%, 0.95)',
                                borderColor: 'hsla(175, 40%, 30%, 0.15)',
                            }}
                        >
                            <div className="max-h-[300px] overflow-y-auto py-1 custom-scrollbar">
                                {models.map(model => (
                                    <div key={model.id}
                                        onClick={() => { setSelectedModel(model); setIsOpen(false); }}
                                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 cursor-pointer transition-colors m-1"
                                        style={selectedModel?.id === model.id ? { background: 'hsla(175, 85%, 50%, 0.1)' } : {}}
                                    >
                                        <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 bg-white/10">
                                            {model.photos?.[0] && <img src={`data:image/jpeg;base64,${model.photos[0].image}`} className="w-full h-full object-cover" />}
                                        </div>
                                        <div className="flex-1 min-w-0 text-sm">
                                            <p className="font-medium text-white truncate">{model.name}</p>
                                        </div>
                                        {selectedModel?.id === model.id && <Check size={14} className="text-primary" />}
                                    </div>
                                ))}
                                {models.length === 0 && <div className="p-4 text-center text-sm text-white/50">Список пуст</div>}
                            </div>
                        </motion.div>
                    </AnimatePresence>,
                    document.body
                )}
            </div>
        );
    };

    return (
        <div className="w-full px-4 md:px-8 space-y-8 pb-32">
            <AnimatePresence>
                {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            </AnimatePresence>
            <AnimatePresence>
                {fullscreenIndex !== null && allViewerImages.length > 0 && (
                    <FullscreenViewer images={allViewerImages} currentIndex={fullscreenIndex} onClose={() => setFullscreenIndex(null)} onDownload={handleDownload} />
                )}
            </AnimatePresence>

            {/* BLOCK 1: Main Content Grid (2x2 Layout) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-20">

                {/* COL 1: Model (Top Left) */}
                <div className="glass-card-strong p-6 rounded-2xl h-full flex flex-col">
                    <h3 className="text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2" style={{ color: 'hsl(175, 85%, 55%)' }}>
                        <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs">1</span>
                        Модель
                    </h3>
                    <div className="flex-1">
                        <ModelSelector />
                    </div>
                </div>

                {/* COL 2: Product (Top Right) */}
                <div className="glass-card-strong p-6 rounded-2xl h-full flex flex-col">
                    <h3 className="text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2" style={{ color: 'hsl(175, 85%, 55%)' }}>
                        <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs">2</span>
                        Товар
                    </h3>
                    <div className="flex-1">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {productImages.map((img, index) => (
                                <div key={index} className="relative aspect-square rounded-xl overflow-hidden border border-white/10 group bg-black/20">
                                    <img src={img.preview} className="w-full h-full object-cover" />
                                    <button onClick={() => handleRemoveProductImage(index)} className="absolute top-1 right-1 p-1 bg-red-500/80 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12} /></button>
                                </div>
                            ))}
                            {productImages.length < 4 && (
                                <label className="aspect-square rounded-xl border-2 border-dashed border-white/10 hover:border-primary/50 flex flex-col items-center justify-center cursor-pointer transition-colors text-white/30 hover:text-white/70 hover:bg-white/5">
                                    <Upload size={24} className="mb-2 opacity-50" />
                                    <span className="text-[10px] font-bold uppercase tracking-wide">Загрузить</span>
                                    <input type="file" onChange={handleImageUpload} className="hidden" accept="image/*" />
                                </label>
                            )}
                        </div>
                    </div>
                </div>

                {/* COL 3: Details (Bottom Left) */}
                <div className="glass-card-strong p-6 rounded-2xl h-full relative z-30 flex flex-col">
                    <h3 className="text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2" style={{ color: 'hsl(175, 85%, 55%)' }}>
                        <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs">3</span>
                        Детали съемки
                    </h3>
                    <div className="flex-1 space-y-4">
                        <Combobox label="Тип товара" placeholder="Футболка, худи..." options={PRODUCT_TYPES} value={settings.productType} onChange={(val) => setSettings({ ...settings, productType: val })} />
                        <Combobox label="Фон / Локация" placeholder="Выберите фон..." options={BACKGROUNDS} value={settings.background} onChange={(val) => setSettings({ ...settings, background: val })} />

                        <div className="flex items-center justify-end">
                            <label className="text-[10px] text-primary cursor-pointer hover:underline flex items-center gap-1 opacity-80 hover:opacity-100 transition-opacity">
                                <Plus size={10} /> Загрузить свой фон
                                <input type="file" onChange={handleBackgroundImageUpload} className="hidden" accept="image/*" />
                            </label>
                            {backgroundRefImage && <span className="text-[10px] text-green-400 ml-2">✓ Загружен</span>}
                        </div>
                    </div>
                </div>

                {/* COL 4: Description (Bottom Right) */}
                <div className="glass-card-strong p-6 rounded-2xl h-full flex flex-col">
                    <h3 className="text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2" style={{ color: 'hsl(175, 85%, 55%)' }}>
                        <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs">4</span>
                        Описание (Опционально)
                    </h3>
                    <div className="flex-1">
                        <textarea
                            placeholder="Опишите детали, которые важно сохранить (например: 'логотип на груди', 'красные пуговицы')..."
                            value={settings.clothing}
                            onChange={(e) => setSettings({ ...settings, clothing: e.target.value })}
                            className="glass-input w-full p-4 h-full min-h-[140px] text-sm resize-none rounded-xl"
                            style={{ background: 'hsla(220, 20%, 8%, 0.4)' }}
                        />
                    </div>
                </div>
            </div>

            {/* BLOCK 5: Format & Resolution (Separate Block) */}
            <div className="glass-card p-6 rounded-2xl relative z-10">
                <h3 className="text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2" style={{ color: 'hsl(175, 85%, 55%)' }}>
                    <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs">5</span>
                    Настройки формата
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-white/50 flex items-center gap-2">
                            <Maximize2 size={12} /> Формат изображения
                        </label>
                        <Combobox
                            options={ASPECT_RATIOS}
                            value={settings.aspectRatio || '3:4'}
                            onChange={(val) => setSettings({ ...settings, aspectRatio: val })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-white/50 flex items-center gap-2">
                            <ZoomIn size={12} /> Качество и Разрешение
                        </label>
                        <Combobox
                            options={IMAGE_SIZES}
                            value={settings.imageSize || '1K'}
                            onChange={(val) => setSettings({ ...settings, imageSize: val })}
                        />
                    </div>
                </div>
            </div>

            {/* BLOCK 6: Generate Button (Footer) */}
            <div className="sticky bottom-4 z-40">
                <button
                    onClick={handleGenerate}
                    disabled={!isReady || loading || loadingParallel}
                    className={`w-full py-5 rounded-2xl text-xl font-bold tracking-[0.2em] uppercase transition-all transform hover:translate-y-[-2px] active:translate-y-[1px] flex items-center justify-center gap-4 shadow-2xl backdrop-blur-xl border border-white/10 ${isReady ? 'bg-gradient-to-r from-primary via-teal-500 to-purple-600 text-white shadow-primary/20 hover:shadow-primary/40 cursor-pointer' : 'bg-white/5 text-white/20 cursor-not-allowed'
                        }`}
                >
                    {loading ? <><div className="animate-spin w-6 h-6 border-2 border-white/30 border-t-white rounded-full" /> Загрузка...</> : <><Sparkles size={24} className="animate-pulse" /> Генерировать (1 фото)</>}
                </button>
            </div>

            {/* BLOCK 4: Results */}
            {
                (result || generatedImages.length > 0 || loading || loadingParallel || loadingVariations) && (
                    <div className="space-y-8 pt-8 border-t border-white/5 relative z-0" ref={resultsEndRef}>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Check size={20} className="text-green-400" /> Готовые снимки
                        </h2>

                        {/* Loading State: Single */}
                        {loading && (
                            <div className="max-w-md mx-auto">
                                <GenerationPlaceholder
                                    aspectRatio={settings.aspectRatio}
                                    duration={GENERATION_TIME_ESTIMATE_SINGLE}
                                    messages={LOADING_MESSAGES}
                                />
                            </div>
                        )}



                        {/* Single Result */}
                        {result && !loading && !loadingVariations && (
                            <div className="glass-card p-2 rounded-xl group relative max-w-md mx-auto">
                                <div className="aspect-[3/4] rounded-lg overflow-hidden cursor-pointer" onClick={() => setFullscreenIndex(0)}>
                                    <img src={result.image || result.url} className="w-full h-full object-cover" />
                                </div>
                                <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleDownload(result.image || result.url, `photo_single.png`)} className="p-2 bg-black/50 text-white rounded-lg hover:bg-black/70 backdrop-blur-md"><Download size={16} /></button>
                                    <button onClick={() => setFullscreenIndex(0)} className="p-2 bg-black/50 text-white rounded-lg hover:bg-black/70 backdrop-blur-md"><Maximize2 size={16} /></button>
                                </div>
                            </div>
                        )}



                        {/* Gallery Grid (Mixed Loading/Result) */}
                        {generatedImages.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {generatedImages.map((img, idx) => (
                                    img.loading ? (
                                        <GenerationPlaceholder
                                            key={idx}
                                            aspectRatio={settings.aspectRatio}
                                            duration={GENERATION_TIME_ESTIMATE_SINGLE} // Individual time 30s
                                            messages={LOADING_MESSAGES}
                                        />
                                    ) : img.error ? (
                                        <div key={idx} className="glass-card p-6 rounded-xl flex items-center justify-center text-red-400 bg-red-500/10 border border-red-500/20 aspect-[3/4]">
                                            <div className="text-center">
                                                <AlertTriangle size={32} className="mx-auto mb-2 opacity-50" />
                                                <p className="text-xs">{img.message || "Ошибка генерации"}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div key={idx} className="glass-card p-2 rounded-xl group relative">
                                            <div className="aspect-[3/4] rounded-lg overflow-hidden cursor-pointer" onClick={() => setFullscreenIndex(idx + (result ? 1 : 0))}>
                                                <img src={img.url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                            </div>
                                            <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleDownload(img.url, `photo_${Number(idx) + 1}.png`)} className="p-2 bg-black/50 text-white rounded-lg hover:bg-black/70 backdrop-blur-md"><Download size={16} /></button>
                                                <button onClick={() => setFullscreenIndex(idx + (result ? 1 : 0))} className="p-2 bg-black/50 text-white rounded-lg hover:bg-black/70 backdrop-blur-md"><Maximize2 size={16} /></button>
                                            </div>
                                        </div>
                                    )
                                ))}
                            </div>
                        )}

                        {/* Parallel Generation Button (Moved to Bottom) */}
                        {showParallelButton && (
                            <div className="flex justify-center py-6">
                                <button
                                    onClick={handleGenerateParallel}
                                    disabled={loadingParallel}
                                    className="px-8 py-4 rounded-xl text-lg font-bold uppercase tracking-wider bg-white/10 hover:bg-white/20 border border-white/10 transition-all flex items-center gap-3"
                                >
                                    {loadingParallel ? <Loader2 className="animate-spin" size={20} /> : <RefreshCw size={20} />}
                                    Сгенерировать еще 4 ракурса
                                </button>
                            </div>
                        )}
                    </div>
                )
            }

        </div >
    );
};

export default PhotoSession;
