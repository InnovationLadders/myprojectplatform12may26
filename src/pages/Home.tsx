import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * Legacy Home component - now redirects all users to /projects
 * This component is kept for backward compatibility with any direct links
 */
export const Home: React.FC = () => {
  return <Navigate to="/projects" replace />;
};
