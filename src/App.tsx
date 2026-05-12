import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { Layout } from './components/Layout/Layout';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { Home } from './pages/Home'; // Keep Home, but it will be at /home now
import { LandingPage } from './pages/LandingPage'; // Import the new LandingPage
import { PendingActivationPage } from './pages/PendingActivationPage';
import i18n from './i18n';
import { SummerProgramEnrollment } from './pages/SummerProgramEnrollment';
import { ClasseraCallback } from './pages/auth/ClasseraCallback';
import { ClasseraLogin } from './pages/auth/ClasseraLogin';

const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({ 
  children, 
  allowedRoles = [] 
}) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }

  // Check if user status is pending
  if (user.status === 'pending') {
    return <Navigate to="/pending-activation" />;
  }
  
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate home page based on role
    return <Navigate to="/home" />;
  }

  return <Layout>{children}</Layout>;
};

const AppRoutes: React.FC = () => {
  const { user, loading } = useAuth();

  // Show loading spinner while authentication state is being determined
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-48 w-48 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Landing Page - accessible if not authenticated, redirects to /home if authenticated */}
      <Route path="/" element={user ? <Navigate to="/home" /> : <LandingPage />} />

      {/* Authentication Routes - accessible if not authenticated, redirects to /home if authenticated */}
      <Route path="/login" element={user ? <Navigate to="/home" /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to="/home" /> : <RegisterPage />} />
      
      {/* Classera SSO Routes */}
      <Route path="/auth/classera" element={user ? <Navigate to="/home" /> : <ClasseraLogin />} />
      <Route path="/auth/classera/callback" element={<ClasseraCallback />} />
      
      <Route path="/pending-activation" element={!user ? <Navigate to="/login" /> : user.status !== 'pending' ? <Navigate to="/" /> : <PendingActivationPage />} />
      
      {/* Summer Program Enrollment - Public Route */}
      <Route path="/summer-program-enrollment" element={<SummerProgramEnrollment />} />
      
      {/* Protected Routes - require authentication and specific roles if defined */}
      {/* The actual Home page for authenticated users */}
      <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
      
      {/* Search Results */}
      <Route path="/search-results" element={<ProtectedRoute><SearchResultsPage /></ProtectedRoute>} />
      
      {/* Student routes */}
      <Route path="/project-ideas" element={<ProtectedRoute><ProjectIdeas /></ProtectedRoute>} />
      <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
      <Route path="/projects/:id" element={<ProtectedRoute><ProjectDetails /></ProtectedRoute>} />
      <Route path="/projects/new" element={<ProtectedRoute><CreateProject /></ProtectedRoute>} />
      <Route path="/projects/:id/edit" element={<ProtectedRoute><EditProject /></ProtectedRoute>} />
      <Route path="/gallery" element={<ProtectedRoute><Gallery /></ProtectedRoute>} />
      <Route path="/store" element={<ProtectedRoute><Store /></ProtectedRoute>} />
      <Route path="/cart" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
      <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
      <Route path="/ai-assistant" element={<ProtectedRoute><AIAssistant /></ProtectedRoute>} />
      <Route path="/resources" element={<ProtectedRoute><Resources /></ProtectedRoute>} />
      <Route path="/intellectual-property" element={<ProtectedRoute><IntellectualProperty /></ProtectedRoute>} />
      
      {/* Consultation routes */}
      <Route path="/consultations" element={<ProtectedRoute><Consultations /></ProtectedRoute>} />
      <Route path="/my-consultations" element={<ProtectedRoute><MyConsultations /></ProtectedRoute>} />
      <Route path="/create-consultation-request" element={<ProtectedRoute><CreateConsultationRequest /></ProtectedRoute>} />
      
      {/* Consultant routes */}
      <Route path="/consultant-dashboard" element={<ProtectedRoute allowedRoles={['consultant']}><ConsultantDashboard /></ProtectedRoute>} />
      <Route path="/consultation-requests" element={<ProtectedRoute allowedRoles={['consultant']}><ConsultationRequests /></ProtectedRoute>} />
      <Route path="/consultant-schedule" element={<ProtectedRoute allowedRoles={['consultant']}><ConsultantSchedule /></ProtectedRoute>} />
      <Route path="/consultant-profile" element={<ProtectedRoute allowedRoles={['consultant']}><ConsultantProfile /></ProtectedRoute>} />
      <Route path="/reviews" element={<ProtectedRoute allowedRoles={['consultant']}><Reviews /></ProtectedRoute>} />
      
      {/* Search routes */}
      <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
      <Route path="/favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
      
      {/* Teacher routes */}
      <Route path="/students" element={<ProtectedRoute allowedRoles={['teacher', 'school', 'admin']}><Users /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute allowedRoles={['teacher', 'school', 'admin']}><Reports /></ProtectedRoute>} />
      
      {/* Admin routes */}
      <Route path="/admin-dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/manage-project-ideas" element={<ProtectedRoute allowedRoles={['admin']}><ManageProjectIdeas /></ProtectedRoute>} />
      <Route path="/admin/manage-videos" element={<ProtectedRoute allowedRoles={['admin']}><ManageVideos /></ProtectedRoute>} />
      <Route path="/admin/summer-program-registrations" element={<ProtectedRoute allowedRoles={['admin']}><SummerProgramRegistrations /></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute allowedRoles={['admin', 'school']}><Users /></ProtectedRoute>} />
      
      {/* Settings */}
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
    </Routes>
  );
};

function App() {

  // Set document direction based on language
  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <AppRoutes />
          </div>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

// Import all the pages
import { Consultations } from './pages/Consultations';
import { MyConsultations } from './pages/MyConsultations';
import { CreateConsultationRequest } from './pages/CreateConsultationRequest';
import { Settings } from './pages/Settings';
import { Projects } from './pages/Projects';
import ProjectDetails from './pages/ProjectDetails';
import { CreateProject } from './pages/CreateProject';
import { EditProject } from './pages/EditProject';
import { ProjectIdeas } from './pages/ProjectIdeas';
import { Gallery } from './pages/Gallery';
import { Store } from './pages/Store';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { AIAssistant } from './pages/AIAssistant';
import { Resources } from './pages/Resources';
import { IntellectualProperty } from './pages/IntellectualProperty';
import Users from './pages/Users';
import { Reports } from './pages/Reports';
import { Search } from './pages/Search';
import { Favorites } from './pages/client/Favorites';
import { ConsultantDashboard } from './pages/consultant/ConsultantDashboard';
import { ConsultationRequests } from './pages/consultant/ConsultationRequests';
import { ConsultantSchedule } from './pages/consultant/ConsultantSchedule';
import { ConsultantProfile } from './pages/consultant/ConsultantProfile';
import { Reviews } from './pages/consultant/Reviews';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import ManageProjectIdeas from './pages/admin/ManageProjectIdeas';
import ManageVideos from './pages/admin/ManageVideos';
import SummerProgramRegistrations from './pages/admin/SummerProgramRegistrations';
import { SearchResultsPage } from './pages/SearchResultsPage';

export default App;