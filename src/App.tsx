import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { SchoolBrandingProvider, useSchoolBranding } from './contexts/SchoolBrandingContext';
import { Layout } from './components/Layout/Layout';
import { validateSubdomainAccess, getSubdomainErrorMessage } from './utils/subdomainAccessControl';
import { UnauthorizedSubdomainAccess } from './components/Auth/UnauthorizedSubdomainAccess';
import { EmailVerificationPending } from './components/Auth/EmailVerificationPending';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { Home } from './pages/Home';
import { LandingPage } from './pages/LandingPage';
import { PendingActivationPage } from './pages/PendingActivationPage';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { TermsOfUse } from './pages/TermsOfUse';
import i18n from './i18n';
import { SummerProgramEnrollment } from './pages/SummerProgramEnrollment';
import { ClasseraCallback } from './pages/auth/ClasseraCallback';
import { ClasseraLogin } from './pages/auth/ClasseraLogin';
import { AuthActionHandler } from './pages/AuthActionHandler';

const StudentDashboard = lazy(() => import('./pages/student/StudentDashboard').then(m => ({ default: m.StudentDashboard })));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const ConsultantDashboard = lazy(() => import('./pages/consultant/ConsultantDashboard').then(m => ({ default: m.ConsultantDashboard })));
const Projects = lazy(() => import('./pages/Projects').then(m => ({ default: m.Projects })));
const ProjectDetails = lazy(() => import('./pages/ProjectDetails'));
const CreateProject = lazy(() => import('./pages/CreateProject').then(m => ({ default: m.CreateProject })));
const ProjectIdeas = lazy(() => import('./pages/ProjectIdeas').then(m => ({ default: m.ProjectIdeas })));

const LoadingSpinner = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
  </div>
);

const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({
  children,
  allowedRoles = []
}) => {
  const { user, loading } = useAuth();
  const { schoolId, loading: brandingLoading } = useSchoolBranding();

  console.log('🔐 ProtectedRoute: Checking route access...', {
    loading,
    brandingLoading,
    hasUser: !!user,
    userRole: user?.role,
    userStatus: user?.status,
    userSchoolId: user?.school_id,
    subdomainSchoolId: schoolId,
    allowedRoles
  });

  if (loading || brandingLoading) {
    console.log('⏳ ProtectedRoute: Auth or branding loading, showing spinner...');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    console.log('❌ ProtectedRoute: No user found, redirecting to /login');
    return <Navigate to="/login" />;
  }

  // Check if user email is verified (except for admins)
  if (user.role !== 'admin' && !user.emailVerified && user.status === 'pending_verification') {
    console.log('📧 ProtectedRoute: Email not verified, redirecting to /email-verification-pending');
    return <Navigate to="/email-verification-pending" />;
  }

  // Check if user status is pending (awaiting admin/school approval)
  if (user.status === 'pending') {
    console.log('⏸️ ProtectedRoute: User status is pending, redirecting to /pending-activation');
    return <Navigate to="/pending-activation" />;
  }

  // Validate subdomain access
  const accessResult = validateSubdomainAccess(user, schoolId);
  if (!accessResult.allowed) {
    console.log('🚫 ProtectedRoute: Subdomain access denied', {
      reason: accessResult.reason,
      userSchoolId: accessResult.userSchoolId,
      currentSubdomain: accessResult.currentSubdomain,
      suggestedAction: accessResult.suggestedAction
    });
    return (
      <UnauthorizedSubdomainAccess
        message={getSubdomainErrorMessage(accessResult)}
        userSchoolId={accessResult.userSchoolId}
        currentSubdomain={accessResult.currentSubdomain}
        suggestedAction={accessResult.suggestedAction}
      />
    );
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    console.log('🚫 ProtectedRoute: User role not allowed', {
      userRole: user.role,
      allowedRoles,
      redirectingTo: '/projects'
    });
    // Redirect to projects page - main landing page for all authenticated users
    return <Navigate to="/projects" />;
  }

  console.log('✅ ProtectedRoute: Access granted, rendering layout with children');
  return (
    <Layout>
      <Suspense fallback={<LoadingSpinner />}>
        {children}
      </Suspense>
    </Layout>
  );
};

const AppRoutes: React.FC = () => {
  const { user, loading } = useAuth();

  console.log('🗺️ AppRoutes: Rendering routes...', {
    loading,
    hasUser: !!user,
    userRole: user?.role,
    userEmail: user?.email,
    currentPath: window.location.pathname
  });

  // Show loading spinner while authentication state is being determined
  if (loading) {
    console.log('⏳ AppRoutes: Auth loading, showing spinner...');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-48 w-48 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Landing Page - accessible if not authenticated, redirects to /projects if authenticated */}
      <Route path="/" element={user ? <Navigate to="/projects" /> : <LandingPage />} />

      {/* Authentication Routes - accessible if not authenticated, redirects to /projects if authenticated */}
      <Route path="/login" element={user ? <Navigate to="/projects" /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to="/projects" /> : <RegisterPage />} />

      {/* Email verification and password reset handler */}
      <Route path="/auth/action" element={<AuthActionHandler />} />

      {/* Classera SSO Routes */}
      <Route path="/auth/classera" element={user ? <Navigate to="/projects" /> : <ClasseraLogin />} />
      <Route path="/auth/classera/callback" element={<ClasseraCallback />} />

      {/* Email Verification Pending - for users who haven't verified their email yet */}
      <Route path="/email-verification-pending" element={
        !user ? <Navigate to="/login" /> :
        (user.emailVerified || user.status !== 'pending_verification') ? <Navigate to="/projects" /> :
        <EmailVerificationPending />
      } />

      <Route path="/pending-activation" element={!user ? <Navigate to="/login" /> : user.status !== 'pending' ? <Navigate to="/" /> : <PendingActivationPage />} />
      
      {/* Summer Program Enrollment - Public Route */}
      <Route path="/summer-program-enrollment" element={<SummerProgramEnrollment />} />

      {/* Legal Pages - Public Routes */}
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/terms-of-use" element={<TermsOfUse />} />

      {/* Protected Routes - require authentication and specific roles if defined */}
      {/* Legacy home route - redirect to projects */}
      <Route path="/home" element={<Navigate to="/projects" replace />} />
      
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
      <Route path="/student-rewards" element={<ProtectedRoute allowedRoles={['student']}><StudentRewards /></ProtectedRoute>} />
      <Route path="/points-details/:studentId" element={<ProtectedRoute><PointsDetails /></ProtectedRoute>} />
      
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

      {/* Entrepreneurship route */}
      <Route path="/entrepreneurship-submissions" element={<ProtectedRoute allowedRoles={['school', 'admin']}><EntrepreneurshipSubmissions /></ProtectedRoute>} />

      {/* Dashboard routes */}
      <Route path="/student-dashboard" element={<ProtectedRoute><StudentDashboard /></ProtectedRoute>} />

      {/* Admin routes */}
      <Route path="/admin-dashboard" element={
        <ProtectedRoute allowedRoles={['admin']}>
          {(() => {
            console.log('🎯 Route: Rendering /admin-dashboard route');
            return <AdminDashboard />;
          })()}
        </ProtectedRoute>
      } />
      <Route path="/admin/manage-project-ideas" element={<ProtectedRoute allowedRoles={['admin']}><ManageProjectIdeas /></ProtectedRoute>} />
      <Route path="/admin/manage-videos" element={<ProtectedRoute allowedRoles={['admin']}><ManageVideos /></ProtectedRoute>} />
      <Route path="/admin/summer-program-registrations" element={<ProtectedRoute allowedRoles={['admin']}><SummerProgramRegistrations /></ProtectedRoute>} />
      <Route path="/admin/manage-rewards" element={<ProtectedRoute allowedRoles={['admin']}><ManageRewards /></ProtectedRoute>} />
      <Route path="/admin/manage-ai-assistant" element={<ProtectedRoute allowedRoles={['admin']}><ManageAIAssistant /></ProtectedRoute>} />
      <Route path="/admin/data-recovery" element={<ProtectedRoute allowedRoles={['admin']}><DataRecovery /></ProtectedRoute>} />
      <Route path="/admin/school-customization" element={<ProtectedRoute allowedRoles={['admin']}><ManageSchoolCustomization /></ProtectedRoute>} />
      <Route path="/admin/migrate-project-ideas" element={<ProtectedRoute allowedRoles={['admin']}><MigrateProjectIdeas /></ProtectedRoute>} />
      <Route path="/admin/fix-entrepreneurship-data" element={<ProtectedRoute allowedRoles={['admin']}><FixEntrepreneurshipData /></ProtectedRoute>} />
      <Route path="/admin/fix-tools" element={<ProtectedRoute allowedRoles={['admin']}><AdminFixTools /></ProtectedRoute>} />
      <Route path="/admin/migrate-to-dammam" element={<ProtectedRoute allowedRoles={['admin']}><MigrateToNewDatabase /></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute allowedRoles={['admin', 'school']}><Users /></ProtectedRoute>} />
      
      {/* Settings */}
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

      {/* Debug page for developers */}
      <Route path="/debug-user" element={<ProtectedRoute><DebugUser /></ProtectedRoute>} />
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
      <SchoolBrandingProvider>
        <CartProvider>
          <Router>
            <div className="min-h-screen bg-gray-50">
              <AppRoutes />
            </div>
          </Router>
        </CartProvider>
      </SchoolBrandingProvider>
    </AuthProvider>
  );
}

// Import remaining pages that aren't lazy-loaded
import { Consultations } from './pages/Consultations';
import { MyConsultations } from './pages/MyConsultations';
import { CreateConsultationRequest } from './pages/CreateConsultationRequest';
import { Settings } from './pages/Settings';
import { EditProject } from './pages/EditProject';
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
import EntrepreneurshipSubmissions from './pages/EntrepreneurshipSubmissions';
import { ConsultationRequests } from './pages/consultant/ConsultationRequests';
import { ConsultantSchedule } from './pages/consultant/ConsultantSchedule';
import { ConsultantProfile } from './pages/consultant/ConsultantProfile';
import { Reviews } from './pages/consultant/Reviews';
import ManageProjectIdeas from './pages/admin/ManageProjectIdeas';
import ManageVideos from './pages/admin/ManageVideos';
import SummerProgramRegistrations from './pages/admin/SummerProgramRegistrations';
import ManageRewards from './pages/admin/ManageRewards';
import ManageAIAssistant from './pages/admin/ManageAIAssistant';
import DataRecovery from './pages/admin/DataRecovery';
import FixEntrepreneurshipData from './pages/admin/FixEntrepreneurshipData';
import AdminFixTools from './pages/admin/AdminFixTools';
import { ManageSchoolCustomization } from './pages/admin/ManageSchoolCustomization';
import MigrateProjectIdeas from './pages/admin/MigrateProjectIdeas';
import MigrateToNewDatabase from './pages/admin/MigrateToNewDatabase';
import { SearchResultsPage } from './pages/SearchResultsPage';
import StudentRewards from './pages/StudentRewards';
import PointsDetails from './pages/PointsDetails';
import { DebugUser } from './pages/DebugUser';

export default App;