import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, Upload, Sparkles, Image as ImageIcon, Download, Trash2, Plus, RefreshCw, Send, X, ChevronLeft, ChevronRight, Maximize2, ZoomIn } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { modelsApi, generateApi } from '../api/client';
import Combobox from './ui/Combobox';

const GENERATION_TIME_ESTIMATE = 33;
const VARIATIONS_TIME_ESTIMATE = 300;
const EXTRA_5_TIME_ESTIMATE = 150;
const CUSTOM_TIME_ESTIMATE = 70;

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
    { value: 'urban street style, city bokeh', label: 'Город (Улица)' },
    { value: 'modern loft interior, daylight', label: 'Лофт интерьер' },
    { value: 'nature park sunny day', label: 'Природа (Парк)' },
    { value: 'luxury boutique interior', label: 'Бутик' },
    { value: 'beach sunset warm light', label: 'Пляж' },
    { value: 'neon city night vibes', label: 'Неон (Ночь)' },
];

const POSES = [
    { value: 'chest-level portrait shot, from chest up, looking at camera', label: 'По грудь' },
    { value: 'waist-level shot, upper body visible, natural pose', label: 'По пояс' },
    { value: 'knee-level shot, three quarter body visible', label: 'По колено' },
    { value: 'full body shot, head to toe, full length', label: 'В полный рост' },
];

const ASPECT_RATIOS = [
    { value: '1:1', label: '1:1 — Квадрат' },
    { value: '3:4', label: '3:4 — Портрет' },
    { value: '4:3', label: '4:3 — Горизонтальный' },
    { value: '9:16', label: '9:16 — Stories / Reels' },
    { value: '16:9', label: '16:9 — Широкоформатный' },
];

const IMAGE_SIZES = [
    { value: '1K', label: '1K — Стандарт' },
    { value: '2K', label: '2K — Высокое' },
    { value: '4K', label: '4K — Максимум' },
];

const ProgressTimer = ({ isActive, estimatedSeconds, label }) => {
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        if (!isActive) { setElapsed(0); return; }
        const interval = setInterval(() => setElapsed(prev => prev + 0.1), 100);
        return () => clearInterval(interval);
    }, [isActive]);

    if (!isActive) return null;

    const progress = Math.min((elapsed / estimatedSeconds) * 100, 95);
    const remaining = Math.max(0, Math.ceil(estimatedSeconds - elapsed));
    const formatTime = (sec) => sec >= 60 ? `${Math.floor(sec / 60)} мин. ${sec % 60} сек.` : `${sec} сек.`;

    return (
        <div className="space-y-3 px-1">
            <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2" style={{ color: 'hsl(220, 10%, 55%)' }}>
                    <div
                        className="w-4 h-4 rounded-full animate-spin"
                        style={{ border: '2px solid hsla(175, 85%, 50%, 0.2)', borderTopColor: 'hsl(175, 85%, 50%)' }}
                    />
                    {label || 'Генерация...'}
                </span>
                <span className="font-mono font-bold" style={{ color: 'hsl(175, 85%, 55%)' }}>{Math.round(progress)}%</span>
            </div>
            <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'hsla(220, 15%, 14%, 0.6)' }}>
                <motion.div
                    className="h-full rounded-full"
                    style={{ background: 'linear-gradient(90deg, hsl(175, 85%, 50%), hsl(265, 80%, 60%))' }}
                    initial={{ width: '0%' }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                />
            </div>
            <p className="text-xs text-center" style={{ color: 'hsl(220, 10%, 45%)' }}>
                Примерно {remaining > 0 ? formatTime(remaining) : 'почти готово...'}
            </p>
        </div>
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
    const [selectedModel, setSelectedModel] = useState(null);
    const [productImages, setProductImages] = useState([]);
    const [backgroundRefImage, setBackgroundRefImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [loadingVariations, setLoadingVariations] = useState(false);
    const [loadingExtra, setLoadingExtra] = useState(false);
    const [result, setResult] = useState(null);
    const [generatedImages, setGeneratedImages] = useState([]);
    const [customPrompt, setCustomPrompt] = useState('');
    const [fullscreenIndex, setFullscreenIndex] = useState(null);
    const resultsEndRef = useRef(null);

    const [settings, setSettings] = useState({
        productType: '',
        background: '',
        pose: '',
        aspectRatio: '3:4',
        imageSize: '1K',
    });

    useEffect(() => { loadModels(); }, []);
    useEffect(() => {
        if (generatedImages.length > 0) resultsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [generatedImages.length]);

    const loadModels = async () => {
        try {
            const response = await modelsApi.getAll();
            setModels(response.data);
        } catch (error) { console.error('Error loading models:', error); }
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
        if (backgroundRefImage?.file) formData.append('backgroundImage', backgroundRefImage.file);
        Object.entries(extraFields).forEach(([key, val]) => formData.append(key, val));
        return formData;
    };

    const handleGenerate = async () => {
        if (!selectedModel || productImages.length === 0) return;
        setLoading(true); setResult(null); setGeneratedImages([]);
        try {
            const formData = buildFormData({ pose: settings.pose || 'standing pose' });
            const response = await generateApi.generateImage(formData);
            setResult(response.data);
        } catch (error) { console.error('Generation failed:', error); alert('Ошибка генерации'); }
        finally { setLoading(false); }
    };

    const handleGenerateVariations = async () => {
        if (!selectedModel || productImages.length === 0) return;
        setLoadingVariations(true);
        try {
            const formData = buildFormData({ count: '10' });
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
        } catch (error) { console.error('Variations failed:', error); alert('Ошибка генерации вариаций'); }
        finally { setLoadingVariations(false); }
    };

    const handleGenerateExtra5 = async () => {
        if (!selectedModel || productImages.length === 0) return;
        setLoadingExtra(true);
        try {
            const formData = buildFormData({ count: '5' });
            const response = await generateApi.generateVariations(formData);
            if (response.data.images?.length > 0) {
                const newImages = response.data.images.map(img => ({
                    url: img.image,
                    id: img.historyEntry?.id,
                    filename: img.historyEntry?.filename,
                }));
                setGeneratedImages(prev => [...prev, ...newImages]);
            }
        } catch (error) { console.error('Extra generation failed:', error); alert('Ошибка генерации'); }
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
        } catch (error) { console.error('Custom generation failed:', error); alert('Ошибка генерации'); }
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
        } catch (error) { alert('Ошибка скачивания'); }
    };

    const allViewerImages = (() => {
        if (generatedImages.length > 0) return generatedImages;
        if (result) return [{ url: result.image, filename: result.image?.split('/').pop(), id: 'single' }];
        return [];
    })();

    const isReady = selectedModel && productImages.length > 0;

    return (
        <div className="max-w-7xl mx-auto h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-6">

            {/* Fullscreen Viewer */}
            <AnimatePresence>
                {fullscreenIndex !== null && allViewerImages.length > 0 && (
                    <FullscreenViewer
                        images={allViewerImages}
                        currentIndex={fullscreenIndex}
                        onClose={() => setFullscreenIndex(null)}
                        onDownload={handleDownload}
                    />
                )}
            </AnimatePresence>

            {/* Left Column: Settings */}
            <div className="w-full lg:w-[400px] flex flex-col h-full glass-card-strong p-1">
                <div className="shrink-0 p-4 pb-2">
                    <h1 className="text-2xl font-bold text-gradient">Фотосессия</h1>
                    <p className="text-sm mt-0.5" style={{ color: 'hsl(220, 10%, 55%)' }}>Настройка параметров съемки</p>
                </div>

                <div className="flex-1 overflow-y-auto px-4 space-y-6">
                    {/* 1. Model Selection */}
                    <div className="space-y-3">
                        <label className="text-xs font-medium uppercase tracking-wider" style={{ color: 'hsl(175, 85%, 55%)' }}>1. Модель</label>
                        <div className="grid grid-cols-2 gap-3">
                            {models.map(model => (
                                <div
                                    key={model.id}
                                    className="relative group p-3 rounded-xl text-left transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                                    style={selectedModel?.id === model.id ? {
                                        background: 'linear-gradient(135deg, hsla(175, 85%, 50%, 0.1), hsla(175, 85%, 40%, 0.05))',
                                        border: '1px solid hsla(175, 85%, 50%, 0.3)',
                                        boxShadow: '0 0 20px -5px hsla(175, 85%, 50%, 0.15)',
                                    } : {
                                        background: 'hsla(220, 20%, 8%, 0.5)',
                                        border: '1px solid hsla(175, 40%, 30%, 0.1)',
                                    }}
                                    onClick={() => setSelectedModel(selectedModel?.id === model.id ? null : model)}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full overflow-hidden shrink-0" style={{ background: 'hsla(220, 15%, 14%, 0.8)' }}>
                                            {model.photos?.[0] ? (
                                                <img src={`data:image/jpeg;base64,${model.photos[0].image}`} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full" style={{ background: 'hsla(175, 85%, 50%, 0.1)' }} />
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-medium truncate" style={{ color: selectedModel?.id === model.id ? 'hsl(175, 85%, 60%)' : 'hsl(210, 40%, 90%)' }}>{model.name}</p>
                                            <p className="text-xs capitalize" style={{ color: 'hsl(220, 10%, 50%)' }}>{model.gender === 'female' ? 'Жен.' : 'Муж.'}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {models.length === 0 && (
                                <div className="col-span-2 text-center p-4 rounded-xl text-sm"
                                    style={{ border: '2px dashed hsla(175, 40%, 30%, 0.15)', color: 'hsl(220, 10%, 50%)' }}>
                                    Сначала создайте модель
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 2. Product Upload */}
                    <div className="space-y-3">
                        <label className="text-xs font-medium uppercase tracking-wider" style={{ color: 'hsl(175, 85%, 55%)' }}>2. Товар</label>

                        {productImages.length > 0 && (
                            <div className="grid grid-cols-3 gap-2">
                                {productImages.map((img, index) => (
                                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden group"
                                        style={{ border: '1px solid hsla(175, 40%, 30%, 0.15)' }}>
                                        <img src={img.preview} className="w-full h-full object-cover" />
                                        <button
                                            onClick={() => handleRemoveProductImage(index)}
                                            className="absolute top-1 right-1 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                                            style={{ background: 'hsla(0, 65%, 50%, 0.8)', color: 'white' }}>
                                            <Trash2 size={12} />
                                        </button>
                                        {index === 0 && (
                                            <span className="absolute bottom-1 left-1 text-[10px] px-1.5 py-0.5 rounded-md font-medium"
                                                style={{ background: 'hsla(175, 85%, 50%, 0.8)', color: 'hsl(220, 15%, 4%)' }}>
                                                Основное
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {productImages.length < 4 && (
                            <div className={`relative rounded-xl transition-all overflow-hidden ${productImages.length === 0 ? 'aspect-video' : 'py-4'}`}
                                style={{ border: '2px dashed hsla(175, 40%, 30%, 0.15)' }}>
                                <label className={`flex flex-col items-center justify-center cursor-pointer ${productImages.length === 0 ? 'absolute inset-0' : ''}`}
                                    style={{ color: 'hsl(220, 10%, 50%)' }}>
                                    <Upload size={productImages.length === 0 ? 32 : 20} className={`${productImages.length === 0 ? 'mb-2' : 'mb-1'} opacity-50`} />
                                    <span className="text-sm font-medium">{productImages.length === 0 ? 'Загрузить фото' : 'Добавить ещё'}</span>
                                    {productImages.length === 0 && <span className="text-xs opacity-50 mt-1">PNG, JPG до 10MB</span>}
                                    <input type="file" onChange={handleImageUpload} className="hidden" accept="image/*" />
                                </label>
                            </div>
                        )}
                    </div>

                    {/* 3. Settings */}
                    <div className="space-y-4">
                        <label className="text-xs font-medium uppercase tracking-wider" style={{ color: 'hsl(175, 85%, 55%)' }}>3. Настройки сцены</label>

                        <Combobox label="Тип товара" placeholder="Выберите или введите..." options={PRODUCT_TYPES}
                            value={settings.productType} onChange={(val) => setSettings({ ...settings, productType: val })} />

                        <Combobox label="Фон на фотографии" placeholder="Где снимаем?" options={BACKGROUNDS}
                            value={settings.background} onChange={(val) => setSettings({ ...settings, background: val })} />

                        <div className="space-y-2">
                            <label className="text-xs font-medium ml-1" style={{ color: 'hsl(220, 10%, 55%)' }}>Или загрузите своё фото фона</label>
                            {backgroundRefImage ? (
                                <div className="relative rounded-xl overflow-hidden aspect-video"
                                    style={{ border: '1px solid hsla(175, 40%, 30%, 0.15)' }}>
                                    <img src={backgroundRefImage.preview} className="w-full h-full object-cover" />
                                    <button onClick={() => setBackgroundRefImage(null)}
                                        className="absolute top-2 right-2 p-1.5 rounded-lg transition-colors"
                                        style={{ background: 'hsla(0, 65%, 50%, 0.7)', color: 'white' }}>
                                        <X size={14} />
                                    </button>
                                    <span className="absolute bottom-2 left-2 text-[10px] px-2 py-1 rounded-md font-medium"
                                        style={{ background: 'hsla(0, 0%, 0%, 0.6)', color: 'white' }}>
                                        Ref-фото фона
                                    </span>
                                </div>
                            ) : (
                                <label className="flex items-center gap-2 p-3 rounded-xl transition-all cursor-pointer text-sm"
                                    style={{ border: '1px dashed hsla(175, 40%, 30%, 0.15)', color: 'hsl(220, 10%, 50%)' }}>
                                    <Upload size={16} className="opacity-50" />
                                    <span>Загрузить референс фона</span>
                                    <input type="file" onChange={handleBackgroundImageUpload} className="hidden" accept="image/*" />
                                </label>
                            )}
                        </div>

                        <Combobox label="Ракурс" placeholder="Кадрирование модели" options={POSES}
                            value={settings.pose} onChange={(val) => setSettings({ ...settings, pose: val })} />
                    </div>

                    {/* 4. Format & Resolution */}
                    <div className="space-y-4 pb-4">
                        <label className="text-xs font-medium uppercase tracking-wider" style={{ color: 'hsl(175, 85%, 55%)' }}>4. Формат фото</label>

                        <div className="space-y-2">
                            <label className="text-xs font-medium ml-1" style={{ color: 'hsl(220, 10%, 55%)' }}>Соотношение сторон</label>
                            <div className="grid grid-cols-5 gap-1.5">
                                {ASPECT_RATIOS.map(ar => (
                                    <button
                                        key={ar.value}
                                        onClick={() => setSettings({ ...settings, aspectRatio: ar.value })}
                                        className={`pill-btn text-center ${settings.aspectRatio === ar.value ? 'pill-btn-active' : 'pill-btn-inactive'}`}
                                    >
                                        {ar.value}
                                    </button>
                                ))}
                            </div>
                            <p className="text-[10px] ml-1" style={{ color: 'hsl(220, 10%, 45%)' }}>
                                {ASPECT_RATIOS.find(a => a.value === settings.aspectRatio)?.label}
                            </p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-medium ml-1" style={{ color: 'hsl(220, 10%, 55%)' }}>Разрешение</label>
                            <div className="grid grid-cols-3 gap-2">
                                {IMAGE_SIZES.map(size => (
                                    <button
                                        key={size.value}
                                        onClick={() => setSettings({ ...settings, imageSize: size.value })}
                                        className={`pill-btn py-2.5 text-sm text-center ${settings.imageSize === size.value ? 'pill-btn-active' : 'pill-btn-inactive'}`}
                                    >
                                        {size.value}
                                        <span className="block text-[10px] opacity-70 font-normal mt-0.5">
                                            {size.value === '1K' ? 'Стандарт' : size.value === '2K' ? 'Высокое' : 'Максимум'}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Button */}
                <div className="shrink-0 p-4 pt-2 space-y-3" style={{ borderTop: '1px solid hsla(175, 40%, 30%, 0.08)' }}>
                    <ProgressTimer isActive={loading} estimatedSeconds={GENERATION_TIME_ESTIMATE} label="Генерация фото..." />

                    <button
                        onClick={handleGenerate}
                        disabled={!isReady || loading}
                        className={`glow-btn w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 ${!isReady || loading ? 'opacity-40 cursor-not-allowed' : ''}`}
                    >
                        {loading ? (
                            <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full animate-spin"
                                    style={{ border: '2px solid hsla(220, 15%, 4%, 0.3)', borderTopColor: 'hsl(220, 15%, 4%)' }} />
                                <span>Генерация...</span>
                            </div>
                        ) : (
                            <>
                                <Sparkles size={20} />
                                <span>Генерировать</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Right Column: Preview / Results */}
            <div className="flex-1 glass-card flex flex-col overflow-hidden relative">
                {/* Dot pattern bg */}
                <div className="absolute inset-0 opacity-[0.02]"
                    style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, hsl(175, 85%, 50%) 1px, transparent 0)', backgroundSize: '24px 24px' }} />

                <div className="flex-1 overflow-y-auto relative">
                    {/* Single result */}
                    {result && generatedImages.length === 0 && (
                        <div className="flex flex-col h-full">
                            <div className="flex-1 p-6 flex items-center justify-center relative group">
                                <img src={result.image} alt="Generated Result"
                                    className="max-h-full max-w-full rounded-lg object-contain cursor-pointer hover:opacity-95 transition-opacity"
                                    style={{ boxShadow: '0 0 40px -10px hsla(175, 85%, 50%, 0.1)' }}
                                    onClick={() => setFullscreenIndex(0)} />

                                <div className="absolute top-4 right-4 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                    style={{ background: 'hsla(0, 0%, 0%, 0.4)', color: 'hsla(175, 85%, 60%, 0.7)' }}>
                                    <ZoomIn size={18} />
                                </div>

                                <div className="absolute bottom-8 flex gap-3 opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0">
                                    <button onClick={() => setFullscreenIndex(0)}
                                        className="glow-btn px-6 py-3 rounded-xl font-medium flex items-center gap-2">
                                        <Maximize2 size={18} /> На весь экран
                                    </button>
                                    <button onClick={() => handleDownload(result.image, result.image.split('/').pop())}
                                        className="glow-btn-secondary glow-btn px-6 py-3 rounded-xl font-medium flex items-center gap-2">
                                        <Download size={18} /> Скачать
                                    </button>
                                    <button onClick={() => setResult(null)}
                                        className="px-6 py-3 rounded-xl font-medium transition-colors"
                                        style={{ background: 'hsla(0, 0%, 0%, 0.5)', color: 'white' }}>
                                        Закрыть
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Grid of generated images */}
                    {generatedImages.length > 0 && (
                        <div className="p-6 space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold text-gradient">
                                    Сгенерировано: {generatedImages.length} фото
                                </h3>
                                <button onClick={() => { setGeneratedImages([]); setResult(null); }}
                                    className="text-sm transition-colors" style={{ color: 'hsl(220, 10%, 50%)' }}>
                                    Очистить
                                </button>
                            </div>

                            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {generatedImages.map((img, index) => (
                                    <motion.div
                                        key={img.id || index}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="group relative aspect-[3/4] rounded-xl overflow-hidden transition-all duration-300 cursor-pointer"
                                        style={{ border: '1px solid hsla(175, 40%, 30%, 0.1)' }}
                                        onClick={() => setFullscreenIndex(index)}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.borderColor = 'hsla(175, 85%, 50%, 0.25)';
                                            e.currentTarget.style.boxShadow = '0 0 25px -5px hsla(175, 85%, 50%, 0.12)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.borderColor = 'hsla(175, 40%, 30%, 0.1)';
                                            e.currentTarget.style.boxShadow = 'none';
                                        }}
                                    >
                                        <img src={img.url} alt={`Generated ${index + 1}`} className="w-full h-full object-cover" loading="lazy" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-all flex items-end justify-center pb-3">
                                            <div className="flex gap-2">
                                                <button onClick={(e) => { e.stopPropagation(); setFullscreenIndex(index); }}
                                                    className="px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
                                                    style={{ background: 'hsla(175, 85%, 50%, 0.2)', color: 'hsl(175, 85%, 65%)' }}>
                                                    <ZoomIn size={12} />
                                                </button>
                                                <button onClick={(e) => { e.stopPropagation(); handleDownload(img.url, img.filename); }}
                                                    className="px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
                                                    style={{ background: 'hsla(175, 85%, 50%, 0.2)', color: 'hsl(175, 85%, 65%)' }}>
                                                    <Download size={12} />
                                                </button>
                                            </div>
                                        </div>
                                        <span className="absolute top-2 left-2 text-[10px] px-1.5 py-0.5 rounded-md font-mono"
                                            style={{ background: 'hsla(0, 0%, 0%, 0.6)', color: 'hsl(175, 85%, 60%)' }}>
                                            #{index + 1}
                                        </span>
                                    </motion.div>
                                ))}
                            </div>
                            <div ref={resultsEndRef} />
                        </div>
                    )}

                    {/* Empty state */}
                    {!result && generatedImages.length === 0 && !loading && !loadingVariations && (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 min-h-[400px]" style={{ color: 'hsl(220, 10%, 50%)' }}>
                            <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
                                style={{ background: 'hsla(175, 85%, 50%, 0.05)', border: '1px solid hsla(175, 85%, 50%, 0.1)' }}>
                                <ImageIcon size={48} style={{ color: 'hsla(175, 85%, 50%, 0.3)' }} />
                            </div>
                            <h3 className="text-xl font-medium mb-2" style={{ color: 'hsl(210, 40%, 80%)' }}>Здесь появится результат</h3>
                            <p className="max-w-md text-center opacity-60">
                                Выберите модель, загрузите фото товара и настройте параметры съемки для получения профессионального результата
                            </p>
                        </div>
                    )}

                    {/* Loading states */}
                    {(loadingVariations || (loadingExtra && generatedImages.length > 0)) && (
                        <div className="p-6 space-y-4">
                            <ProgressTimer isActive={loadingVariations} estimatedSeconds={VARIATIONS_TIME_ESTIMATE} label="Генерация 10 фото (~5 минут)..." />
                            <ProgressTimer isActive={loadingExtra && !loadingVariations} estimatedSeconds={generatedImages.length > 0 ? EXTRA_5_TIME_ESTIMATE : CUSTOM_TIME_ESTIMATE} label="Генерация дополнительных фото..." />
                        </div>
                    )}
                </div>

                {/* Bottom panel */}
                <div className="shrink-0 relative z-10" style={{ borderTop: '1px solid hsla(175, 40%, 30%, 0.08)', background: 'hsla(220, 20%, 6%, 0.6)' }}>
                    {(result || generatedImages.length === 0) && !loadingVariations && (
                        <div className="p-4">
                            <button onClick={handleGenerateVariations}
                                disabled={loadingVariations || !isReady}
                                className="glow-btn-secondary glow-btn w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
                                <RefreshCw size={18} />
                                <span>Сгенерировать 10 рандомных поз</span>
                            </button>
                        </div>
                    )}

                    {generatedImages.length > 0 && !loadingVariations && !loadingExtra && (
                        <div className="p-4 space-y-3">
                            <div className="flex gap-3">
                                <button onClick={handleGenerateExtra5} disabled={loadingExtra || !isReady}
                                    className="glow-btn-secondary glow-btn flex-1 py-3 rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
                                    <Plus size={18} /> Ещё 5 рандомных
                                </button>
                                <button onClick={handleGenerateVariations} disabled={loadingVariations || !isReady}
                                    className="glow-btn-secondary glow-btn flex-1 py-3 rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
                                    <RefreshCw size={18} /> Ещё 10
                                </button>
                            </div>

                            <div className="flex gap-2">
                                <input type="text" value={customPrompt} onChange={(e) => setCustomPrompt(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleGenerateCustom()}
                                    placeholder="Опишите свой кадр (2 фото)..."
                                    className="glass-input flex-1 px-4 py-3 text-sm" />
                                <button onClick={handleGenerateCustom} disabled={!customPrompt.trim() || loadingExtra}
                                    className="glow-btn px-5 py-3 rounded-xl font-medium flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
                                    <Send size={16} />
                                </button>
                            </div>
                            <p className="text-xs text-center" style={{ color: 'hsl(220, 10%, 45%)' }}>
                                Опишите желаемый кадр — сгенерируем 2 варианта
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PhotoSession;
