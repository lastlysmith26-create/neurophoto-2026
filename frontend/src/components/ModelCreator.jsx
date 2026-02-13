import React, { useState, useEffect } from 'react';
import { Upload, User, Sparkles, Check, Trash2, Plus, Edit2, Image as ImageIcon, RefreshCw, Save, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { modelsApi, generateApi } from '../api/client';

const GENERATION_TIME_ESTIMATE = 33; // seconds
const ANGLES_TIME_ESTIMATE = 130; // ~2 min for 4 angles

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

const ModelCreator = () => {
    const [activeTab, setActiveTab] = useState('create');
    const [models, setModels] = useState([]);
    const [loading, setLoading] = useState(false);
    const [generatingPreview, setGeneratingPreview] = useState(false);
    const [generatingAngles, setGeneratingAngles] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);
    const [angleImages, setAngleImages] = useState([]); // 4 angles
    const [editingModelId, setEditingModelId] = useState(null);

    const [formData, setFormData] = useState({ name: '', gender: 'female', description: '' });
    const [photos, setPhotos] = useState({});

    useEffect(() => { loadModels(); }, []);

    const loadModels = async () => {
        try {
            const response = await modelsApi.getAll();
            setModels(response.data);
        } catch (error) { console.error('Error loading models:', error); }
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
            fd.append('gender', formData.gender);
            const firstPhoto = photos.ref_1 || photos.ref_2;
            if (firstPhoto?.file) fd.append('referencePhoto', firstPhoto.file);
            const response = await generateApi.generatePreview(fd);
            setPreviewImage(`data:${response.data.mimeType};base64,${response.data.image}`);
        } catch (error) { console.error('Error:', error); alert('Ошибка генерации превью'); }
        finally { setGeneratingPreview(false); }
    };

    const handleGenerateAngles = async () => {
        setGeneratingAngles(true); setAngleImages([]);
        try {
            const fd = new FormData();
            fd.append('description', formData.description);
            fd.append('gender', formData.gender);
            const firstPhoto = photos.ref_1 || photos.ref_2;
            if (firstPhoto?.file) fd.append('referencePhoto', firstPhoto.file);
            const response = await generateApi.generateAngles(fd);
            const images = response.data.images.map(img => `data:${img.mimeType};base64,${img.image}`);
            setAngleImages(images);
        } catch (error) { console.error('Error:', error); alert('Ошибка генерации ракурсов'); }
        finally { setGeneratingAngles(false); }
    };

    const handleSaveModel = async () => {
        if (!previewImage) return;
        setLoading(true);
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

            resetForm(); loadModels(); setActiveTab('view');
        } catch (error) { console.error('Error:', error); alert('Ошибка сохранения'); }
        finally { setLoading(false); }
    };

    const handleDeleteModel = async (id, e) => {
        e?.stopPropagation();
        try { await modelsApi.delete(id); await loadModels(); }
        catch (error) { console.error('Error:', error); alert('Ошибка удаления'); }
    };

    const canGenerate = formData.name && formData.description;

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            {/* Header & Tabs */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gradient">Нейромодели</h1>
                    <p className="mt-2 text-lg" style={{ color: 'hsl(220, 10%, 55%)' }}>Управление виртуальными моделями</p>
                </div>

                <div className="p-1 rounded-xl flex gap-1" style={{ background: 'hsla(220, 20%, 8%, 0.5)', border: '1px solid hsla(175, 40%, 30%, 0.1)' }}>
                    {['create', 'view'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => { if (tab === 'create' && activeTab !== 'create') resetForm(); setActiveTab(tab); }}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab
                                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                                }`}
                        >
                            {tab === 'create' ? (editingModelId ? 'Редактирование' : 'Создать') : 'Мои модели'}
                        </button>
                    ))}
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
                                    <p className="text-[11px] leading-relaxed" style={{ color: 'hsl(220, 10%, 45%)' }}>
                                        💡 Рекомендуем указать <span className="text-primary/70 font-medium">рост</span> и <span className="text-primary/70 font-medium">параметры</span>.
                                    </p>
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
                                <ProgressTimer isActive={generatingAngles} estimatedSeconds={ANGLES_TIME_ESTIMATE} label="Генерация 4 ракурсов (~2 мин)..." />

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
                                        <button onClick={handleSaveModel} disabled={loading}
                                            className="glow-btn-secondary glow-btn flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2">
                                            {loading ? <div className="w-5 h-5 rounded-full animate-spin border-2 border-white/30 border-t-white" /> : <Save size={16} />}
                                            Сохранить
                                        </button>
                                    </div>
                                )}

                                {previewImage && !generatingAngles && angleImages.length === 0 && (
                                    <button onClick={handleGenerateAngles}
                                        className="w-full py-3 rounded-xl font-medium border border-primary/50 text-primary hover:bg-primary/10 transition-all flex items-center justify-center gap-2">
                                        <ImageIcon size={16} /> Показать 4 ракурса модели
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
                                            <ImageIcon size={18} className="text-primary" /> 4 ракурса модели
                                        </h3>
                                    </div>
                                    <div className="px-6 pb-6">
                                        <div className="grid grid-cols-2 gap-3">
                                            {generatingAngles
                                                ? ['По грудь', 'По пояс', 'По колено', 'В полный рост'].map((label, i) => (
                                                    <div key={i} className="aspect-[3/4] rounded-xl flex flex-col items-center justify-center animate-pulse"
                                                        style={{ background: 'hsla(220, 20%, 8%, 0.4)', border: '1px solid hsla(175, 40%, 30%, 0.1)' }}>
                                                        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mb-2" />
                                                        <span className="text-xs text-muted-foreground">{label}</span>
                                                    </div>
                                                ))
                                                : angleImages.map((img, i) => (
                                                    <div key={i} className="aspect-[3/4] rounded-xl overflow-hidden shadow-md"
                                                        style={{ border: '1px solid hsla(175, 40%, 30%, 0.2)' }}>
                                                        <img src={img} alt={`Ракурс ${i + 1}`} className="w-full h-full object-cover" />
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                ) : (
                    <motion.div key="view" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                        {models.length === 0 ? (
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
                                                <button onClick={(e) => handleDeleteModel(model.id, e)}
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
