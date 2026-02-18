import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { historyApi } from '../api/client';
import { Trash2, Download, ZoomIn, X, ChevronLeft, ChevronRight, ImageIcon, AlertTriangle, Check } from 'lucide-react';
import { Image as LucideImage } from 'lucide-react';

// Toast notification
const Toast = ({ message, type = 'success', onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-4 right-4 z-50 flex items-center gap-2 px-5 py-3 rounded-xl shadow-2xl text-sm font-medium"
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

// Delete confirmation modal
const DeleteConfirm = ({ onConfirm, onCancel }) => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ background: 'hsla(220, 15%, 3%, 0.8)', backdropFilter: 'blur(8px)' }}
        onClick={onCancel}
    >
        <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="glass-card-strong p-6 rounded-2xl max-w-sm w-full mx-4 space-y-4"
            onClick={(e) => e.stopPropagation()}
        >
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'hsla(0, 65%, 50%, 0.15)' }}>
                    <AlertTriangle size={20} style={{ color: 'hsl(0, 70%, 65%)' }} />
                </div>
                <div>
                    <h3 className="font-bold text-white">Удалить фото?</h3>
                    <p className="text-sm" style={{ color: 'hsl(220, 10%, 55%)' }}>Это действие нельзя отменить</p>
                </div>
            </div>
            <div className="flex gap-3">
                <button onClick={onCancel}
                    className="flex-1 py-2.5 rounded-xl font-medium transition-all"
                    style={{ background: 'hsla(220, 15%, 14%, 0.6)', color: 'hsl(220, 10%, 70%)', border: '1px solid hsla(175, 40%, 30%, 0.1)' }}>
                    Отмена
                </button>
                <button onClick={onConfirm}
                    className="flex-1 py-2.5 rounded-xl font-bold transition-all"
                    style={{ background: 'hsla(0, 65%, 50%, 0.8)', color: 'white' }}>
                    Удалить
                </button>
            </div>
        </motion.div>
    </motion.div>
);

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
    const [toast, setToast] = useState(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        try {
            const response = await historyApi.getAll();
            setImages(response.data);
        } catch (error) {
            console.error('Failed to load history:', error);
            setToast({ message: 'Ошибка загрузки истории', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteRequest = (id, e) => {
        e?.stopPropagation();
        setDeleteConfirmId(id);
    };

    const confirmDelete = async () => {
        if (!deleteConfirmId) return;
        const id = deleteConfirmId;
        setDeleteConfirmId(null);
        try {
            await historyApi.delete(id);
            setImages(prev => prev.filter(img => img.id !== id));
            if (fullscreenIndex !== null) setFullscreenIndex(null);
            setToast({ message: 'Фото удалено', type: 'success' });
        } catch (error) {
            setToast({ message: 'Ошибка удаления', type: 'error' });
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
            setToast({ message: 'Ошибка скачивания', type: 'error' });
        }
    };

    return (
        <div className="space-y-8">
            {/* Toast */}
            <AnimatePresence>
                {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            </AnimatePresence>

            {/* Delete confirm */}
            <AnimatePresence>
                {deleteConfirmId && (
                    <DeleteConfirm
                        onConfirm={confirmDelete}
                        onCancel={() => setDeleteConfirmId(null)}
                    />
                )}
            </AnimatePresence>

            {/* Fullscreen */}
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
                    {!loading && images.length > 0 ? `${images.length} сгенерированных фото` : 'Ваши сгенерированные изображения'}
                </p>
            </header>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="aspect-[3/4] rounded-2xl animate-pulse"
                            style={{ background: 'hsla(220, 20%, 8%, 0.5)', border: '1px solid hsla(175, 40%, 30%, 0.06)' }} />
                    ))}
                </div>
            ) : images.length === 0 ? (
                <div className="text-center py-20 flex flex-col items-center" style={{ color: 'hsl(220, 10%, 55%)' }}>
                    <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
                        style={{ background: 'hsla(220, 20%, 8%, 0.5)' }}>
                        <LucideImage size={48} className="opacity-30" />
                    </div>
                    <h3 className="text-xl font-medium mb-2" style={{ color: 'hsl(210, 40%, 90%)' }}>Пока нет изображений</h3>
                    <p>Создайте свою первую генерацию!</p>
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
                                        onClick={(e) => handleDeleteRequest(item.id, e)}
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
