import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { historyApi } from '../api/client';
import { Trash2, Download, ZoomIn, X, ChevronLeft, ChevronRight } from 'lucide-react';

// Fullscreen Image Viewer Modal
const FullscreenViewer = ({ images, currentIndex, onClose, onDownload }) => {
    const [index, setIndex] = useState(currentIndex);

    const goNext = useCallback(() => {
        setIndex(prev => (prev + 1) % images.length);
    }, [images.length]);

    const goPrev = useCallback(() => {
        setIndex(prev => (prev - 1 + images.length) % images.length);
    }, [images.length]);

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
            <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 p-3 rounded-full transition-all duration-200"
                style={{ background: 'hsla(220, 15%, 18%, 0.6)', color: 'hsl(210, 40%, 90%)' }}
            >
                <X size={24} />
            </button>

            <div
                className="absolute top-4 left-1/2 -translate-x-1/2 z-10 px-4 py-2 rounded-full text-sm font-mono"
                style={{ background: 'hsla(220, 15%, 18%, 0.6)', color: 'hsl(175, 85%, 60%)' }}
            >
                {index + 1} / {images.length}
            </div>

            <button
                onClick={(e) => { e.stopPropagation(); onDownload(currentImage.image_url || currentImage.url, currentImage.filename); }}
                className="glow-btn absolute top-4 left-4 z-10 px-4 py-2.5 flex items-center gap-2 text-sm"
            >
                <Download size={16} />
                Скачать
            </button>

            {images.length > 1 && (
                <>
                    <button
                        onClick={(e) => { e.stopPropagation(); goPrev(); }}
                        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full transition-all duration-200"
                        style={{ background: 'hsla(220, 15%, 18%, 0.6)', color: 'hsl(210, 40%, 90%)' }}
                    >
                        <ChevronLeft size={28} />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); goNext(); }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full transition-all duration-200"
                        style={{ background: 'hsla(220, 15%, 18%, 0.6)', color: 'hsl(210, 40%, 90%)' }}
                    >
                        <ChevronRight size={28} />
                    </button>
                </>
            )}

            <motion.img
                key={index}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
                src={currentImage.image_url || currentImage.url}
                alt={`Photo ${index + 1}`}
                className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg"
                style={{ boxShadow: '0 0 60px -10px hsla(175, 85%, 50%, 0.1)' }}
                onClick={(e) => e.stopPropagation()}
            />

            <div
                className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 px-4 py-2 rounded-xl text-xs text-center"
                style={{ background: 'hsla(220, 15%, 18%, 0.6)', color: 'hsl(220, 10%, 55%)' }}
            >
                {currentImage.productType && <span className="capitalize">{currentImage.productType}</span>}
                {currentImage.createdAt && <span> • {new Date(currentImage.createdAt).toLocaleDateString()}</span>}
            </div>
        </motion.div>
    );
};

const Gallery = () => {
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fullscreenIndex, setFullscreenIndex] = useState(null);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        try {
            const response = await historyApi.getAll();
            setImages(response.data);
        } catch (error) {
            console.error('Failed to load history:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (confirm('Удалить изображение?')) {
            try {
                await historyApi.delete(id);
                setImages(prev => prev.filter(img => img.id !== id));
                if (fullscreenIndex !== null) setFullscreenIndex(null);
            } catch (error) {
                alert('Ошибка удаления');
            }
        }
    };

    const handleDownload = async (url, filename) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = filename || 'download.png';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error('Download failed:', error);
            alert('Ошибка скачивания');
        }
    };

    return (
        <div className="space-y-8">
            <AnimatePresence>
                {fullscreenIndex !== null && images.length > 0 && (
                    <FullscreenViewer
                        images={images}
                        currentIndex={fullscreenIndex}
                        onClose={() => setFullscreenIndex(null)}
                        onDownload={handleDownload}
                    />
                )}
            </AnimatePresence>

            <header>
                <h1 className="text-3xl font-bold tracking-tight text-gradient">
                    Галерея
                </h1>
                <p className="mt-2 text-lg" style={{ color: 'hsl(220, 10%, 55%)' }}>
                    Ваши сгенерированные изображения
                </p>
            </header>

            {loading ? (
                <div className="flex justify-center p-12">
                    <div
                        className="w-8 h-8 rounded-full animate-spin"
                        style={{ border: '2px solid hsla(175, 85%, 50%, 0.2)', borderTopColor: 'hsl(175, 85%, 50%)' }}
                    />
                </div>
            ) : images.length === 0 ? (
                <div className="text-center py-20" style={{ color: 'hsl(220, 10%, 55%)' }}>
                    <p>Пока нет изображений. Создайте свою первую генерацию!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {images.map((item, index) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="group relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer transition-all duration-300"
                            style={{
                                background: 'hsla(220, 20%, 8%, 0.5)',
                                border: '1px solid hsla(175, 40%, 30%, 0.1)',
                            }}
                            onClick={() => setFullscreenIndex(index)}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = 'hsla(175, 85%, 50%, 0.25)';
                                e.currentTarget.style.boxShadow = '0 0 30px -8px hsla(175, 85%, 50%, 0.12)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = 'hsla(175, 40%, 30%, 0.1)';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            <img
                                src={item.image_url}
                                alt="Generated"
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                loading="lazy"
                            />

                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-4">
                                <div className="flex gap-2 justify-end transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setFullscreenIndex(index); }}
                                        className="p-2 rounded-lg transition-all duration-200"
                                        style={{ background: 'hsla(175, 85%, 50%, 0.15)', color: 'hsl(175, 85%, 65%)' }}
                                        title="На весь экран"
                                    >
                                        <ZoomIn size={18} />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDownload(item.image_url, item.filename); }}
                                        className="p-2 rounded-lg transition-all duration-200"
                                        style={{ background: 'hsla(175, 85%, 50%, 0.15)', color: 'hsl(175, 85%, 65%)' }}
                                        title="Скачать"
                                    >
                                        <Download size={18} />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                                        className="p-2 rounded-lg transition-all duration-200"
                                        style={{ background: 'hsla(0, 65%, 50%, 0.15)', color: 'hsl(0, 70%, 70%)' }}
                                        title="Удалить"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>

                                <div className="mt-4 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75">
                                    <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: 'hsla(175, 85%, 60%, 0.6)' }}>
                                        {new Date(item.createdAt).toLocaleDateString()}
                                    </p>
                                    <p className="text-sm text-white font-medium truncate capitalize">
                                        {item.productType} • {item.pose}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Gallery;
