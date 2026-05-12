import React, { createContext, useContext, useEffect, useState } from 'react';
import { getSubdomain } from '../utils/subdomain';
import { getSchoolBySubdomain } from '../lib/firebase';

interface SchoolBranding {
  schoolId: string | null;
  schoolName: string | null;
  logoUrl: string | null;
  subdomain: string | null;
  loading: boolean;
  error: string | null;
}

interface SchoolBrandingContextType extends SchoolBranding {
  refreshBranding: () => Promise<void>;
}

const SchoolBrandingContext = createContext<SchoolBrandingContextType | undefined>(undefined);

export const useSchoolBranding = () => {
  const context = useContext(SchoolBrandingContext);
  if (context === undefined) {
    throw new Error('useSchoolBranding must be used within a SchoolBrandingProvider');
  }
  return context;
};

export const SchoolBrandingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [branding, setBranding] = useState<SchoolBranding>({
    schoolId: null,
    schoolName: null,
    logoUrl: null,
    subdomain: null,
    loading: true,
    error: null
  });

  const loadBranding = async () => {
    try {
      setBranding(prev => ({ ...prev, loading: true, error: null }));

      const subdomain = getSubdomain();

      if (!subdomain) {
        // No subdomain, use default branding
        setBranding({
          schoolId: null,
          schoolName: null,
          logoUrl: null,
          subdomain: null,
          loading: false,
          error: null
        });
        return;
      }

      console.log('🏫 Loading branding for subdomain:', subdomain);

      // Fetch school data by subdomain
      const schoolData = await getSchoolBySubdomain(subdomain);

      if (schoolData) {
        console.log('✅ School branding loaded:', schoolData.name);
        setBranding({
          schoolId: schoolData.id,
          schoolName: schoolData.name,
          logoUrl: schoolData.logo_url || null,
          subdomain: subdomain,
          loading: false,
          error: null
        });
      } else {
        console.warn('⚠️ No school found for subdomain:', subdomain);
        setBranding({
          schoolId: null,
          schoolName: null,
          logoUrl: null,
          subdomain: subdomain,
          loading: false,
          error: 'لم يتم العثور على مؤسسة تعليمية مطابقة لهذا الرابط'
        });
      }
    } catch (error: any) {
      console.error('❌ Error loading school branding:', error);
      setBranding(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'حدث خطأ أثناء تحميل بيانات المؤسسة'
      }));
    }
  };

  useEffect(() => {
    loadBranding();
  }, []);

  const refreshBranding = async () => {
    await loadBranding();
  };

  const value: SchoolBrandingContextType = {
    ...branding,
    refreshBranding
  };

  return (
    <SchoolBrandingContext.Provider value={value}>
      {children}
    </SchoolBrandingContext.Provider>
  );
};
