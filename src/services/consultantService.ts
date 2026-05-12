import { db } from '../lib/firebase';
import { collection, getDocs, query, where, doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

export interface ConsultantData {
  id: string;
  name: string;
  email: string;
  role: string;
  title: string | null;
  specializations: string[];
  rating: number;
  reviews_count: number;
  experience_years: number | null;
  avatar_url: string | null;
  hourly_rate: number | null;
  availability: string | null;
  languages: string[];
  location: string | null;
  bio: string | null;
  phone: string | null;
}

export interface ConsultantDisplay {
  id: string;
  name: string;
  title: string;
  specialties: string[];
  rating: number;
  reviews: number;
  experience: string | null;
  avatar: string | null;
  hourlyRate: number | null;
  availability: string | null;
  languages: string[];
  location: string | null;
}

export interface ConsultantUpdateData {
  name?: string;
  bio?: string;
  phone?: string;
  specializations?: string[];
  experience_years?: number | null;
  hourly_rate?: number | null;
  languages?: string[];
  location?: string | null;
  avatar_url?: string | null;
  availability?: string | null;
}

export const getConsultants = async (): Promise<ConsultantDisplay[]> => {
  try {
    const consultantsQuery = query(
      collection(db, 'users'),
      where('role', '==', 'consultant')
    );
    const consultantsSnapshot = await getDocs(consultantsQuery);

    console.log('📊 Fetched consultants from Firebase:', consultantsSnapshot.size);

    const consultants = consultantsSnapshot.docs.map(doc => {
      const data = doc.data() as Omit<ConsultantData, 'id'>;

      const missingFields: string[] = [];
      if (data.hourly_rate === undefined || data.hourly_rate === null) missingFields.push('hourly_rate');
      if (!data.experience_years) missingFields.push('experience_years');
      if (!data.specializations || data.specializations.length === 0) missingFields.push('specializations');
      if (!data.languages || data.languages.length === 0) missingFields.push('languages');
      if (!data.avatar_url) missingFields.push('avatar_url');
      if (!data.location) missingFields.push('location');
      if (!data.bio) missingFields.push('bio');

      if (missingFields.length > 0) {
        console.warn(`⚠️ Consultant ${data.name || doc.id} is missing fields:`, missingFields);
      }

      const consultant: ConsultantDisplay = {
        id: doc.id,
        name: data.name || null,
        title: data.title || null,
        specialties: data.specializations || [],
        rating: typeof data.rating === 'number' ? data.rating : 0,
        reviews: typeof data.reviews_count === 'number' ? data.reviews_count : 0,
        experience: data.experience_years ? `${data.experience_years} سنوات` : null,
        avatar: data.avatar_url || null,
        hourlyRate: typeof data.hourly_rate === 'number' ? data.hourly_rate : null,
        availability: data.availability || null,
        languages: data.languages || [],
        location: data.location || null
      };

      return consultant;
    });

    console.log('✅ Processed consultants:', consultants.length);
    return consultants;
  } catch (error) {
    console.error('❌ Error fetching consultants:', error);
    throw error;
  }
};

export const getConsultantById = async (id: string): Promise<ConsultantDisplay | null> => {
  try {
    const consultantDoc = await getDoc(doc(db, 'users', id));

    if (!consultantDoc.exists()) {
      console.warn(`⚠️ Consultant with id ${id} not found`);
      return null;
    }

    const data = consultantDoc.data() as Omit<ConsultantData, 'id'>;

    if (data.role !== 'consultant') {
      console.warn(`⚠️ User ${id} is not a consultant`);
      return null;
    }

    const consultant: ConsultantDisplay = {
      id: consultantDoc.id,
      name: data.name || null,
      title: data.title || null,
      specialties: data.specializations || [],
      rating: typeof data.rating === 'number' ? data.rating : 0,
      reviews: typeof data.reviews_count === 'number' ? data.reviews_count : 0,
      experience: data.experience_years ? `${data.experience_years} سنوات` : null,
      avatar: data.avatar_url || null,
      hourlyRate: typeof data.hourly_rate === 'number' ? data.hourly_rate : null,
      availability: data.availability || null,
      languages: data.languages || [],
      location: data.location || null
    };

    return consultant;
  } catch (error) {
    console.error('❌ Error fetching consultant by id:', error);
    throw error;
  }
};

export const updateConsultant = async (id: string, updates: ConsultantUpdateData): Promise<void> => {
  try {
    const consultantRef = doc(db, 'users', id);

    const updateData: any = {
      updated_at: serverTimestamp()
    };

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.bio !== undefined) updateData.bio = updates.bio;
    if (updates.phone !== undefined) updateData.phone = updates.phone;
    if (updates.specializations !== undefined) updateData.specializations = updates.specializations;
    if (updates.experience_years !== undefined) updateData.experience_years = updates.experience_years;
    if (updates.hourly_rate !== undefined) updateData.hourly_rate = updates.hourly_rate;
    if (updates.languages !== undefined) updateData.languages = updates.languages;
    if (updates.location !== undefined) updateData.location = updates.location;
    if (updates.avatar_url !== undefined) updateData.avatar_url = updates.avatar_url;
    if (updates.availability !== undefined) updateData.availability = updates.availability;

    await updateDoc(consultantRef, updateData);
    console.log('✅ Consultant profile updated successfully:', id);
  } catch (error) {
    console.error('❌ Error updating consultant:', error);
    throw error;
  }
};

export const getConsultantCompleteness = (consultant: ConsultantDisplay): number => {
  const fields = [
    consultant.name,
    consultant.title,
    consultant.specialties.length > 0,
    consultant.experience,
    consultant.avatar,
    consultant.hourlyRate !== null,
    consultant.languages.length > 0,
    consultant.location
  ];

  const completedFields = fields.filter(field => field).length;
  return Math.round((completedFields / fields.length) * 100);
};

export const validateConsultantForBooking = (consultant: ConsultantDisplay): { valid: boolean; reason?: string } => {
  if (!consultant.name) {
    return { valid: false, reason: 'اسم المستشار غير متوفر' };
  }

  if (consultant.hourlyRate === null) {
    return { valid: false, reason: 'السعر غير محدد. لا يمكن حجز استشارة في الوقت الحالي' };
  }

  if (consultant.specialties.length === 0) {
    return { valid: false, reason: 'لم يحدد المستشار تخصصاته بعد' };
  }

  if (!consultant.title) {
    return { valid: false, reason: 'المسمى الوظيفي للمستشار غير محدد' };
  }

  return { valid: true };
};
