import { User } from '../contexts/AuthContext';
import { getSubdomain } from './subdomain';

export interface SubdomainAccessResult {
  allowed: boolean;
  reason?: string;
  userSchoolId?: string | null;
  currentSubdomain?: string | null;
  suggestedAction?: string;
}

export const validateSubdomainAccess = (
  user: User | null,
  schoolIdFromSubdomain: string | null
): SubdomainAccessResult => {
  const currentSubdomain = getSubdomain();

  if (!user) {
    return {
      allowed: false,
      reason: 'المستخدم غير مسجل الدخول',
      currentSubdomain,
      suggestedAction: 'login'
    };
  }

  if (!currentSubdomain || !schoolIdFromSubdomain) {
    return {
      allowed: true,
      reason: 'الوصول إلى المنصة الرئيسية'
    };
  }

  if (user.role === 'admin') {
    return {
      allowed: true,
      reason: 'المسؤول لديه صلاحية الوصول إلى جميع المؤسسات'
    };
  }

  if (user.role === 'consultant') {
    return {
      allowed: true,
      reason: 'المستشار لديه صلاحية الوصول إلى جميع المؤسسات'
    };
  }

  if (!user.school_id) {
    return {
      allowed: false,
      reason: 'المستخدم غير منتسب لأي مؤسسة تعليمية',
      userSchoolId: null,
      currentSubdomain,
      suggestedAction: 'contact_admin'
    };
  }

  if (user.school_id !== schoolIdFromSubdomain) {
    return {
      allowed: false,
      reason: 'أنت تحاول الوصول إلى مؤسسة تعليمية لا تنتمي إليها',
      userSchoolId: user.school_id,
      currentSubdomain,
      suggestedAction: 'use_correct_subdomain'
    };
  }

  return {
    allowed: true,
    reason: 'المستخدم ينتمي إلى هذه المؤسسة التعليمية'
  };
};

export const getSubdomainErrorMessage = (result: SubdomainAccessResult): string => {
  switch (result.suggestedAction) {
    case 'use_correct_subdomain':
      return 'أنت تحاول الدخول إلى رابط مؤسسة تعليمية لا تنتمي إليها. يرجى استخدام الرابط الصحيح الخاص بمؤسستك التعليمية.';
    case 'contact_admin':
      return 'حسابك غير مرتبط بأي مؤسسة تعليمية. يرجى التواصل مع مسؤول المنصة في مؤسستك التعليمية.';
    case 'login':
      return 'يجب عليك تسجيل الدخول للوصول إلى هذه المؤسسة التعليمية.';
    default:
      return result.reason || 'ليس لديك صلاحية للوصول إلى هذه المؤسسة التعليمية.';
  }
};
