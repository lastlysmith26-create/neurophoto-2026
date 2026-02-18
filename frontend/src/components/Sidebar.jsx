import { useNavigate, useLocation } from 'react-router-dom';
import { Camera, Users, Image as ImageIcon, Box, Sparkles, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

const Sidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { signOut, user } = useAuth();

    const menuItems = [
        { icon: Users, label: 'Мои модели', path: '/', description: 'Управление моделями' },
        { icon: Camera, label: 'Фотосессия', path: '/generate', description: 'Генерация фото', accent: true },
        { icon: ImageIcon, label: 'Галерея', path: '/gallery', description: 'История фото' },
    ];

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    return (
        <div className="w-64 h-screen p-4 flex flex-col relative z-20 shrink-0"
            style={{
                background: 'hsla(220, 15%, 6%, 0.75)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                borderRight: '1px solid hsla(175, 40%, 30%, 0.12)',
            }}
        >
            {/* Logo */}
            <div className="flex items-center gap-3 px-4 py-6 mb-6">
                <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
                    style={{
                        background: 'linear-gradient(135deg, hsl(175, 85%, 50%), hsl(265, 80%, 55%))',
                        boxShadow: '0 4px 20px -4px hsla(175, 85%, 50%, 0.35)',
                    }}
                >
                    <Box className="text-white" size={24} />
                </div>
                <div>
                    <h1 className="font-bold text-lg leading-none">NeuroPhoto</h1>
                    <p className="text-xs mt-1" style={{ color: 'hsl(220, 10%, 55%)' }}>WB Production</p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="space-y-1.5 flex-1">
                {menuItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <motion.button
                            key={item.path}
                            whileHover={{ x: 4 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => navigate(item.path)}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300"
                            style={isActive ? {
                                background: 'linear-gradient(135deg, hsla(175, 85%, 50%, 0.12), hsla(175, 85%, 40%, 0.06))',
                                color: 'hsl(175, 85%, 60%)',
                                border: '1px solid hsla(175, 85%, 50%, 0.25)',
                                boxShadow: '0 0 20px -5px hsla(175, 85%, 50%, 0.15)',
                            } : item.accent ? {
                                background: 'hsla(265, 60%, 50%, 0.06)',
                                color: 'hsl(265, 70%, 75%)',
                                border: '1px solid hsla(265, 60%, 50%, 0.15)',
                            } : {
                                background: 'transparent',
                                color: 'hsl(220, 10%, 55%)',
                                border: '1px solid transparent',
                            }}
                        >
                            <item.icon size={20} />
                            <div className="text-left">
                                <span className="font-medium block leading-tight">{item.label}</span>
                                <span className="text-[10px] opacity-60 block leading-tight">{item.description}</span>
                            </div>
                        </motion.button>
                    );
                })}
            </nav>

            {/* Pro Tips */}
            <div
                className="p-4 rounded-xl mb-3"
                style={{
                    background: 'linear-gradient(135deg, hsla(175, 85%, 50%, 0.06), hsla(265, 80%, 55%, 0.06))',
                    border: '1px solid hsla(175, 85%, 50%, 0.12)',
                }}
            >
                <div className="flex items-center gap-2 mb-2" style={{ color: 'hsl(175, 85%, 55%)' }}>
                    <Sparkles size={16} />
                    <span className="text-sm font-bold">Pro Tips</span>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: 'hsl(220, 10%, 55%)' }}>
                    Используйте качественные фото товаров на прозрачном фоне для лучших результатов.
                </p>
            </div>

            {/* User Footer */}
            <div className="pt-3 flex items-center justify-between"
                style={{ borderTop: '1px solid hsla(175, 40%, 30%, 0.08)' }}>
                <div className="truncate">
                    <p className="text-xs font-medium truncate" style={{ color: 'hsl(210, 40%, 80%)' }}>
                        {user?.email?.split('@')[0] || 'Пользователь'}
                    </p>
                    <p className="text-[10px] truncate" style={{ color: 'hsl(220, 10%, 45%)' }}>
                        {user?.email || ''}
                    </p>
                </div>
                <button onClick={handleLogout} title="Выйти"
                    className="p-2 rounded-lg transition-colors"
                    style={{ color: 'hsl(220, 10%, 45%)' }}>
                    <LogOut size={16} />
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
