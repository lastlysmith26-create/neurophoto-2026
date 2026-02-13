import { motion } from 'framer-motion';
import { ShaderAnimation } from './ui/shader-animation';

const Layout = ({ children }) => {
    return (
        <div className="min-h-screen bg-background text-foreground flex overflow-hidden relative">
            {/* Shader Background */}
            <div className="fixed inset-0 z-0 opacity-40">
                <ShaderAnimation />
            </div>

            {/* Dark overlay for readability */}
            <div className="fixed inset-0 z-[1] bg-gradient-to-br from-background/70 via-background/50 to-background/70 pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex-1 h-screen overflow-auto relative z-10"
            >
                <div className="max-w-7xl mx-auto p-8">
                    {children}
                </div>
            </motion.div>
        </div>
    );
};

export default Layout;
