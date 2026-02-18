import React, { useState, useEffect } from 'react';
import { Upload, User, Sparkles, Check, Trash2, Plus, Edit2, Image as ImageIcon, RefreshCw, Save, ArrowLeft, AlertTriangle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { modelsApi, generateApi } from '../api/client';

const GENERATION_TIME_ESTIMATE = 33; // seconds
const ANGLES_TIME_ESTIMATE = 40; // ~40s for single collage

const PhotoSlot = ({ label, image, onChange, onRemove }) => {
    return (
        <div className="flex flex-col gap-2">
            <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'hsl(175, 85%, 55%)' }}>{label}</span>
            <div
                className={`relative aspect-[3/4] rounded-xl transition-all group overflow-hidden ${image
                    ? 'border-primary/50 bg-background'
                    : 'bg-secondary/20 hover:bg-primary/5'
                    }`}
                style={{ border: image ? '1px solid hsla(175, 85%, 50%, 0.5)' : '1px dashed hsla(175, 40%, 30%, 0.3)' }}
            >
                {image ? (
                    <>
                        <img src={image} alt={label} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button
                                onClick={onRemove}
                                className="p-2 rounded-lg transition-colors"
                                style={{ background: 'hsla(0, 65%, 50%, 0.2)', color: 'hsl(0, 70%, 80%)' }}
                                title="Удалить"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </>
                ) : (
                    <label className="absolute inset-0 cursor-pointer flex flex-col items-center justify-center transition-colors"
                        style={{ color: 'hsl(220, 10%, 50%)' }}>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={onChange}
                            className="hidden"
                        />
                        <Plus size={24} className="mb-2 opacity-50" />
                        <span className="text-xs font-medium">Добавить</span>
                    </label>
                )}
            </div>
        </div>
    );
};

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
                    <div className="w-4 h-4 rounded-full animate-spin"
                        style={{ border: '2px solid hsla(175, 85%, 50%, 0.2)', borderTopColor: 'hsl(175, 85%, 50%)' }} />
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

// Toast notification component
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
const DeleteConfirm = ({ modelName, onConfirm, onCancel }) => (
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
                    <h3 className="font-bold text-white">Удалить модель?</h3>
                    <p className="text-sm" style={{ color: 'hsl(220, 10%, 55%)' }}>«{modelName}»</p>
                </div>
            </div>
            <p className="text-sm" style={{ color: 'hsl(220, 10%, 55%)' }}>
                Это действие нельзя отменить. Модель и все её фото будут удалены навсегда.
            </p>
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

// Loading skeleton for model cards
const ModelSkeleton = () => (
    <div className="glass-card rounded-2xl overflow-hidden animate-pulse">
        <div className="aspect-[3/4]" style={{ background: 'hsla(220, 20%, 12%, 0.6)' }} />
        <div className="p-4 space-y-3">
            <div className="h-5 rounded-lg w-2/3" style={{ background: 'hsla(220, 20%, 15%, 0.6)' }} />
            <div className="h-4 rounded-lg w-full" style={{ background: 'hsla(220, 20%, 13%, 0.4)' }} />
            <div className="h-4 rounded-lg w-1/2" style={{ background: 'hsla(220, 20%, 13%, 0.4)' }} />
        </div>
    </div>
);

const ModelCreator = () => {
    const [activeTab, setActiveTab] = useState('view');
    const [models, setModels] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modelsLoading, setModelsLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [generatingPreview, setGeneratingPreview] = useState(false);
    const [generatingAngles, setGeneratingAngles] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);
    const [angleImages, setAngleImages] = useState([]); // 4 angles
    const [editingModelId, setEditingModelId] = useState(null);
    const [toast, setToast] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null); // { id, name }

    const [formData, setFormData] = useState({ name: '', gender: 'female', description: '', age: '', height: '' });
    const [photos, setPhotos] = useState({});

    useEffect(() => { loadModels(); }, []);

    const loadModels = async () => {
        setModelsLoading(true);
        try {
            const response = await modelsApi.getAll();
            setModels(response.data);
        } catch (error) {
            console.error('Error loading models:', error);
            setToast({ message: 'Ошибка загрузки моделей', type: 'error' });
        } finally {
            setModelsLoading(false);
        }
    };

    const handlePhotoUpload = (e, type) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setPhotos(prev => ({ ...prev, [type]: { file, preview: reader.result } }));
            reader.readAsDataURL(file);
        }
    };

    const handleRemovePhoto = (type) => {
        const newPhotos = { ...photos };
        delete newPhotos[type];
        setPhotos(newPhotos);
    };

    const handleEditModel = (model) => {
        setEditingModelId(model.id);
        setFormData({
            name: model.name,
            gender: model.gender,
            description: model.description,
            age: model.age || '',
            height: model.height || '',
        });
        const previewPhoto = model.photos?.find(p => p.type === 'preview');
        if (previewPhoto) setPreviewImage(`data:image/jpeg;base64,${previewPhoto.image}`);
        const angles = model.photos?.filter(p => p.type === 'angle') || [];
        setAngleImages(angles.map(a => `data:image/jpeg;base64,${a.image}`));
        setPhotos({});
        setActiveTab('create');
    };

    const resetForm = () => {
        setFormData({ name: '', gender: 'female', description: '' });
        setPhotos({});
        setPreviewImage(null);
        setAngleImages([]);
        setEditingModelId(null);
    };

    const handleGeneratePreview = async () => {
        if (!formData.name || !formData.description) return;
        setGeneratingPreview(true); setPreviewImage(null); setAngleImages([]);
        try {
            const fd = new FormData();
            fd.append('description', formData.description);
            fd.append('description', formData.description);
            fd.append('gender', formData.gender);
            if (formData.age) fd.append('age', formData.age);
            if (formData.height) fd.append('height', formData.height);
            const firstPhoto = photos.ref_1 || photos.ref_2;
            if (firstPhoto?.file) fd.append('referencePhoto', firstPhoto.file);
            const response = await generateApi.generatePreview(fd);
            setPreviewImage(`data:${response.data.mimeType};base64,${response.data.image}`);
        } catch (error) {
            console.error('Error:', error);
            setToast({ message: 'Ошибка генерации превью', type: 'error' });
        }
        finally { setGeneratingPreview(false); }
    };

    const handleGenerateAngles = async () => {
        setGeneratingAngles(true); setAngleImages([]);
        try {
            const fd = new FormData();
            fd.append('description', formData.description);
            fd.append('gender', formData.gender);
            if (formData.age) fd.append('age', formData.age);
            if (formData.height) fd.append('height', formData.height);

            // Phase 8: Use generated preview as single source of truth
            let usedPreview = false;
            if (previewImage) {
                try {
                    const res = await fetch(previewImage);
                    const blob = await res.blob();
                    fd.append('referencePhoto', blob, 'preview.jpg');
                    usedPreview = true;
                } catch (e) {
                    console.error("Error using preview image:", e);
                }
            }

            if (!usedPreview) {
                const firstPhoto = photos.ref_1 || photos.ref_2;
                if (firstPhoto?.file) fd.append('referencePhoto', firstPhoto.file);
            }
            const response = await generateApi.generateAngles(fd);
            const images = response.data.images.map(img => `data:${img.mimeType};base64,${img.image}`);
            setAngleImages(images);
        } catch (error) {
            console.error('Error:', error);
            setToast({ message: 'Ошибка генерации ракурсов', type: 'error' });
        }
        finally { setGeneratingAngles(false); }
    };

    const handleSaveModel = async () => {
        if (!previewImage) return;
        setSaving(true);
        try {
            const photosArray = [];
            Object.entries(photos).forEach(([type, data]) => {
                photosArray.push({ type: 'reference', image: data.preview.split(',')[1] });
            });
            photosArray.push({ type: 'preview', image: previewImage.split(',')[1] });
            angleImages.forEach((img) => { photosArray.push({ type: 'angle', image: img.split(',')[1] }); });

            const payload = { ...formData, photos: photosArray };
            if (editingModelId) await modelsApi.update(editingModelId, payload);
            else await modelsApi.create(payload);

            setToast({ message: editingModelId ? 'Модель обновлена ✓' : 'Модель сохранена ✓', type: 'success' });
            resetForm(); loadModels(); setActiveTab('view');
        } catch (error) {
            console.error('Error:', error);
            setToast({ message: 'Ошибка сохранения модели', type: 'error' });
        }
        finally { setSaving(false); }
    };

    const handleDeleteModel = async (id, name, e) => {
        e?.stopPropagation();
        setDeleteConfirm({ id, name });
    };

    const confirmDelete = async () => {
        if (!deleteConfirm) return;
        const { id } = deleteConfirm;
        setDeleteConfirm(null);
        try {
            await modelsApi.delete(id);
            setToast({ message: 'Модель удалена', type: 'success' });
            await loadModels();
        } catch (error) {
            console.error('Error:', error);
            setToast({ message: 'Ошибка удаления модели', type: 'error' });
        }
    };

    const canGenerate = formData.name && formData.description;

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            {/* Toast Notification */}
            <AnimatePresence>
                {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            </AnimatePresence>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {deleteConfirm && (
                    <DeleteConfirm
                        modelName={deleteConfirm.name}
                        onConfirm={confirmDelete}
                        onCancel={() => setDeleteConfirm(null)}
                    />
                )}
            </AnimatePresence>

            {/* Header & Tabs */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gradient">Нейромодели</h1>
                    <p className="mt-2 text-lg" style={{ color: 'hsl(220, 10%, 55%)' }}>Управление виртуальными моделями</p>
                </div>

                <div className="flex items-center gap-4">
                    {activeTab === 'create' && (
                        <button
                            onClick={() => { resetForm(); setActiveTab('view'); }}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-white/5 hover:bg-white/10 text-white/70 hover:text-white"
                        >
                            <ArrowLeft size={16} />
                            Назад к списку
                        </button>
                    )}
                </div>
            </div>

            {/* Content */}
            <AnimatePresence mode="wait">
                {activeTab === 'create' ? (
                    <motion.div key="create" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Left: Form */}
                        <div className="space-y-6">
                            {editingModelId && (
                                <button onClick={() => { resetForm(); setActiveTab('view'); }}
                                    className="flex items-center gap-2 text-sm transition-colors" style={{ color: 'hsl(220, 10%, 50%)' }}>
                                    <ArrowLeft size={16} /> Назад к моделям
                                </button>
                            )}

                            <div className="glass-card-strong p-6 space-y-5">
                                <h3 className="font-semibold text-lg text-white">
                                    {editingModelId ? 'Редактирование модели' : 'Новая модель'}
                                </h3>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium" style={{ color: 'hsl(220, 10%, 55%)' }}>Имя модели</label>
                                    <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Например: Анна" className="glass-input w-full p-3" />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium" style={{ color: 'hsl(220, 10%, 55%)' }}>Пол</label>
                                    <div className="flex gap-3">
                                        {[{ value: 'female', label: 'Женский', icon: '♀' }, { value: 'male', label: 'Мужской', icon: '♂' }].map(option => (
                                            <button key={option.value} onClick={() => setFormData({ ...formData, gender: option.value })}
                                                className={`flex-1 p-3 rounded-xl border text-sm font-medium transition-all flex items-center justify-center gap-2 ${formData.gender === option.value
                                                    ? 'bg-primary/20 border-primary text-primary shadow-lg shadow-primary/10'
                                                    : 'border-border/10 text-muted-foreground hover:border-primary/50'
                                                    }`}>
                                                <span className="text-lg">{option.icon}</span>{option.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium" style={{ color: 'hsl(220, 10%, 55%)' }}>Описание внешности</label>
                                    <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Светлые длинные волосы, голубые глаза..." rows={4} className="glass-input w-full p-3 resize-none" />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium" style={{ color: 'hsl(220, 10%, 55%)' }}>Возраст (лет)</label>
                                        <input type="number" min="18" max="100" value={formData.age} onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                                            placeholder="25" className="glass-input w-full p-3" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium" style={{ color: 'hsl(220, 10%, 55%)' }}>Рост (см)</label>
                                        <input type="text" value={formData.height} onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                                            placeholder="175" className="glass-input w-full p-3" />
                                    </div>
                                </div>
                            </div>

                            <div className="glass-card-strong p-6">
                                <h3 className="font-semibold mb-1 text-white">Примеры фото</h3>
                                <p className="text-sm mb-4" style={{ color: 'hsl(220, 10%, 55%)' }}>Загрузите 1-2 реальных фото для сходства</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <PhotoSlot label="Фото 1" image={photos.ref_1?.preview} onChange={(e) => handlePhotoUpload(e, 'ref_1')} onRemove={() => handleRemovePhoto('ref_1')} />
                                    <PhotoSlot label="Фото 2" image={photos.ref_2?.preview} onChange={(e) => handlePhotoUpload(e, 'ref_2')} onRemove={() => handleRemovePhoto('ref_2')} />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <ProgressTimer isActive={generatingPreview} estimatedSeconds={GENERATION_TIME_ESTIMATE} label="Генерация превью..." />
                                <ProgressTimer isActive={generatingAngles} estimatedSeconds={ANGLES_TIME_ESTIMATE} label="Генерация коллажа ракурсов (~40 сек)..." />

                                {!previewImage && !generatingPreview && (
                                    <button onClick={handleGeneratePreview} disabled={!canGenerate || generatingPreview}
                                        className={`glow-btn w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 ${!canGenerate ? 'opacity-40 cursor-not-allowed' : ''}`}>
                                        <Sparkles size={20} /> Генерировать
                                    </button>
                                )}

                                {previewImage && !generatingPreview && !generatingAngles && (
                                    <div className="flex gap-3">
                                        <button onClick={handleGeneratePreview}
                                            className="flex-1 py-3 rounded-xl font-medium border border-border/20 text-muted-foreground hover:text-white hover:bg-white/5 transition-all flex items-center justify-center gap-2">
                                            <RefreshCw size={16} /> Перегенерировать
                                        </button>
                                        <button onClick={handleSaveModel} disabled={saving}
                                            className="glow-btn-secondary glow-btn flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2">
                                            {saving ? (
                                                <>
                                                    <Loader2 size={16} className="animate-spin" />
                                                    Сохранение...
                                                </>
                                            ) : (
                                                <>
                                                    <Save size={16} />
                                                    Сохранить
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )}

                                {previewImage && !generatingAngles && angleImages.length === 0 && (
                                    <button onClick={handleGenerateAngles}
                                        className="w-full py-3 rounded-xl font-medium border border-primary/50 text-primary hover:bg-primary/10 transition-all flex items-center justify-center gap-2">
                                        <ImageIcon size={16} /> Показать коллаж ракурсов
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Right: Preview */}
                        <div className="space-y-6">
                            <div className="glass-card overflow-hidden">
                                <div className="p-6 pb-4">
                                    <h3 className="font-semibold flex items-center gap-2 text-white">
                                        <Sparkles size={18} className="text-primary" /> Нейро-превью
                                    </h3>
                                    <p className="text-sm mt-1" style={{ color: 'hsl(220, 10%, 55%)' }}>Сгенерированный портрет модели</p>
                                </div>

                                {previewImage ? (
                                    <div className="px-6 pb-6">
                                        <div className="relative aspect-[3/4] max-w-sm mx-auto rounded-xl overflow-hidden shadow-xl"
                                            style={{ border: '1px solid hsla(175, 85%, 50%, 0.3)', boxShadow: '0 0 30px -10px hsla(175, 85%, 50%, 0.15)' }}>
                                            <img src={previewImage} alt="Превью модели" className="w-full h-full object-cover" />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-16" style={{ color: 'hsl(220, 10%, 45%)' }}>
                                        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
                                            style={{ background: 'hsla(175, 85%, 50%, 0.05)' }}>
                                            {generatingPreview ? <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /> : <User size={40} className="opacity-40" />}
                                        </div>
                                        <p className="font-medium">{generatingPreview ? 'Генерируем портрет...' : 'Здесь появится превью'}</p>
                                        <p className="text-sm opacity-60 mt-1">{generatingPreview ? 'Подождите ~30 секунд' : 'Заполните описание и нажмите «Генерировать»'}</p>
                                    </div>
                                )}
                            </div>

                            {(angleImages.length > 0 || generatingAngles) && (
                                <div className="glass-card overflow-hidden">
                                    <div className="p-6 pb-4">
                                        <h3 className="font-semibold flex items-center gap-2 text-white">
                                            <ImageIcon size={18} className="text-primary" /> Коллаж ракурсов модели
                                        </h3>
                                    </div>
                                    <div className="px-6 pb-6">
                                        {generatingAngles
                                            ? (
                                                <div className="aspect-square rounded-xl flex flex-col items-center justify-center animate-pulse"
                                                    style={{ background: 'hsla(220, 20%, 8%, 0.4)', border: '1px solid hsla(175, 40%, 30%, 0.1)' }}>
                                                    <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin mb-3" />
                                                    <span className="text-sm text-muted-foreground">Генерируем коллаж 2×2...</span>
                                                </div>
                                            )
                                            : angleImages.map((img, i) => (
                                                <div key={i} className="aspect-square rounded-xl overflow-hidden shadow-md"
                                                    style={{ border: '1px solid hsla(175, 40%, 30%, 0.2)' }}>
                                                    <img src={img} alt="Коллаж ракурсов" className="w-full h-full object-cover" />
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                ) : (
                    <motion.div key="view" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                        {modelsLoading ? (
                            /* Loading skeleton while models are being fetched */
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <ModelSkeleton />
                                <ModelSkeleton />
                                <ModelSkeleton />
                            </div>
                        ) : models.length === 0 ? (
                            <div className="text-center py-20 flex flex-col items-center" style={{ color: 'hsl(220, 10%, 50%)' }}>
                                <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6" style={{ background: 'hsla(220, 20%, 8%, 0.5)' }}>
                                    <User size={48} className="opacity-50" />
                                </div>
                                <h3 className="text-xl font-medium mb-2" style={{ color: 'hsl(210, 40%, 90%)' }}>Нет моделей</h3>
                                <p className="mb-6">Создайте свою первую виртуальную модель</p>
                                <button onClick={() => setActiveTab('create')} className="glow-btn px-6 py-3 rounded-xl font-medium">Создать модель</button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <button onClick={() => { resetForm(); setActiveTab('create'); }}
                                    className="flex flex-col items-center justify-center gap-4 rounded-2xl transition-all group min-h-[300px]"
                                    style={{ border: '2px dashed hsla(175, 40%, 30%, 0.2)', background: 'hsla(220, 20%, 8%, 0.3)' }}>
                                    <div className="w-16 h-16 rounded-full flex items-center justify-center group-hover:bg-primary/20 group-hover:text-primary transition-colors"
                                        style={{ background: 'hsla(220, 20%, 12%, 1)' }}>
                                        <Plus size={32} />
                                    </div>
                                    <span className="font-medium text-muted-foreground group-hover:text-primary">Создать новую модель</span>
                                </button>

                                {models.map((model) => (
                                    <div key={model.id} className="glass-card group relative rounded-2xl overflow-hidden flex flex-col hover:border-primary/50 transition-all shadow-sm hover:shadow-xl hover:shadow-primary/5">
                                        <div className="aspect-[3/4] relative bg-background/50">
                                            {(() => {
                                                const p = model.photos?.find(p => p.type === 'preview') || model.photos?.[0];
                                                return p ? <img src={`data:image/jpeg;base64,${p.image}`} className="w-full h-full object-cover" />
                                                    : <div className="w-full h-full flex items-center justify-center"><User size={64} className="opacity-20" /></div>;
                                            })()}
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                                <button onClick={(e) => { e.stopPropagation(); handleEditModel(model); }}
                                                    className="p-3 bg-white/10 backdrop-blur rounded-xl text-white hover:bg-white/20 transition-all translate-y-4 group-hover:translate-y-0 duration-300">
                                                    <Edit2 size={20} />
                                                </button>
                                                <button onClick={(e) => handleDeleteModel(model.id, model.name, e)}
                                                    className="p-3 bg-red-500/20 backdrop-blur rounded-xl text-red-200 hover:bg-red-500/40 transition-all translate-y-4 group-hover:translate-y-0 duration-300 delay-75">
                                                    <Trash2 size={20} />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="p-4 flex-1 flex flex-col">
                                            <div className="flex items-start justify-between mb-2">
                                                <h3 className="font-bold text-lg text-white">{model.name}</h3>
                                                <span className="text-xs px-2 py-1 rounded-full bg-secondary text-muted-foreground capitalize">
                                                    {model.gender === 'female' ? 'Жен.' : 'Муж.'}
                                                </span>
                                            </div>
                                            <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">{model.description}</p>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-3 border-t border-border/10">
                                                <ImageIcon size={14} /> <span>{model.photos?.length || 0} фото</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ModelCreator;
