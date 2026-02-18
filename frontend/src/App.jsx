import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import ModelCreator from './components/ModelCreator';
import PhotoSession from './components/PhotoSession';
import Gallery from './components/Gallery';
import Layout from './components/Layout';
import Login from './pages/Login';
import AuthRoute from './components/AuthRoute';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <AuthRoute>
                <div className="flex h-screen bg-background text-foreground overflow-hidden">
                  <Sidebar />
                  <Layout>
                    <Routes>
                      <Route path="/" element={<ModelCreator />} />
                      <Route path="/generate" element={<PhotoSession />} />
                      <Route path="/gallery" element={<Gallery />} />
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </Layout>
                </div>
              </AuthRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
