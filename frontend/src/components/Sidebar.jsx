import { useNavigate, useLocation } from 'react-router-dom';
import { Camera, Users, Image as ImageIcon, Box, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const Sidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const menuItems = [
        { icon: Users, label: 'Нейромодели', path: '/models' },
        { icon: Camera, label: 'Фотосессия', path: '/' },
        { icon: ImageIcon, label: 'Галерея', path: '/gallery' },
    ];

    return (
        <div className="w-64 h-screen p-4 flex flex-col relative z-20"
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
                            } : {
                                background: 'transparent',
                                color: 'hsl(220, 10%, 55%)',
                                border: '1px solid transparent',
                            }}
                        >
                            <item.icon size={20} />
                            <span className="font-medium">{item.label}</span>
                        </motion.button>
                    );
                })}
            </nav>

            {/* Pro Tips */}
            <div
                className="p-4 rounded-xl"
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
        </div>
    );
};

export default Sidebar;
