/**
 * Smart Grade Classifier Utility
 * Analyzes and classifies student grade inputs into standardized categories
 */

export interface ClassifiedGrade {
  original: string;
  normalized: string;
  category: 'elementary' | 'middle' | 'high' | 'university' | 'unclassified';
  level: number | null;
  displayName: string;
}

const arabicNumbers: { [key: string]: number } = {
  'أول': 1, 'اول': 1, 'الأول': 1, 'الاول': 1, 'أولى': 1, 'اولى': 1,
  'ثاني': 2, 'ثانى': 2, 'الثاني': 2, 'الثانى': 2, 'ثانية': 2,
  'ثالث': 3, 'الثالث': 3, 'ثالثة': 3,
  'رابع': 4, 'الرابع': 4, 'رابعة': 4,
  'خامس': 5, 'الخامس': 5, 'خامسة': 5,
  'سادس': 6, 'السادس': 6, 'سادسة': 6,
  'سابع': 7, 'السابع': 7, 'سابعة': 7,
  'ثامن': 8, 'الثامن': 8, 'ثامنة': 8,
  'تاسع': 9, 'التاسع': 9, 'تاسعة': 9,
  'عاشر': 10, 'العاشر': 10, 'عاشرة': 10,
  'حادي عشر': 11, 'الحادي عشر': 11, 'حادية عشر': 11,
  'ثاني عشر': 12, 'الثاني عشر': 12, 'ثانية عشر': 12
};

const gradeKeywords = {
  elementary: ['ابتدائي', 'الابتدائي', 'ابتدائى', 'الابتدائى', 'elementary'],
  middle: ['متوسط', 'المتوسط', 'متوسطة', 'المتوسطة', 'middle'],
  high: ['ثانوي', 'الثانوي', 'ثانوى', 'الثانوى', 'ثانوية', 'الثانوية', 'high', 'secondary'],
  university: ['جامعة', 'الجامعة', 'جامعي', 'جامعى', 'كلية', 'الكلية', 'university', 'college', 'مستوى', 'المستوى', 'سنة', 'السنة', 'level']
};

/**
 * Classifies a grade string into a standardized format
 */
export function classifyGrade(gradeInput: string | null | undefined): ClassifiedGrade {
  if (!gradeInput || typeof gradeInput !== 'string') {
    return {
      original: gradeInput || '',
      normalized: 'unclassified',
      category: 'unclassified',
      level: null,
      displayName: 'غير محدد'
    };
  }

  const input = gradeInput.trim().toLowerCase();

  if (!input) {
    return {
      original: gradeInput,
      normalized: 'unclassified',
      category: 'unclassified',
      level: null,
      displayName: 'غير محدد'
    };
  }

  // Extract numbers (both Arabic and English)
  const englishNumbers = input.match(/\d+/);
  let level: number | null = null;

  if (englishNumbers) {
    level = parseInt(englishNumbers[0]);
  } else {
    // Check for Arabic number words
    for (const [word, num] of Object.entries(arabicNumbers)) {
      if (input.includes(word)) {
        level = num;
        break;
      }
    }
  }

  // Determine category
  let category: ClassifiedGrade['category'] = 'unclassified';

  if (gradeKeywords.elementary.some(keyword => input.includes(keyword))) {
    category = 'elementary';
  } else if (gradeKeywords.middle.some(keyword => input.includes(keyword))) {
    category = 'middle';
  } else if (gradeKeywords.high.some(keyword => input.includes(keyword))) {
    category = 'high';
  } else if (gradeKeywords.university.some(keyword => input.includes(keyword))) {
    category = 'university';
  }

  // Generate display name
  let displayName = 'غير محدد';
  let normalized = 'unclassified';

  if (level !== null && category !== 'unclassified') {
    displayName = `${level}`;
    switch (category) {
      case 'elementary':
        normalized = `elementary-${level}`;
        break;
      case 'middle':
        normalized = `middle-${level}`;
        break;
      case 'high':
        normalized = `high-${level}`;
        break;
      case 'university':
        normalized = `university-${level}`;
        break;
    }
  } else if (level !== null) {
    displayName = `${level}`;
    normalized = `grade-${level}`;
  } else if (category !== 'unclassified') {
    switch (category) {
      case 'elementary':
        displayName = 'الابتدائي (مستوى غير محدد)';
        normalized = 'elementary-unknown';
        break;
      case 'middle':
        displayName = 'المتوسط (مستوى غير محدد)';
        normalized = 'middle-unknown';
        break;
      case 'high':
        displayName = 'الثانوي (مستوى غير محدد)';
        normalized = 'high-unknown';
        break;
      case 'university':
        displayName = 'الجامعة (مستوى غير محدد)';
        normalized = 'university-unknown';
        break;
    }
  }

  return {
    original: gradeInput,
    normalized,
    category,
    level,
    displayName
  };
}

/**
 * Get Arabic number word for display
 */
function getArabicNumberWord(num: number): string {
  const words: { [key: number]: string } = {
    1: 'الأول',
    2: 'الثاني',
    3: 'الثالث',
    4: 'الرابع',
    5: 'الخامس',
    6: 'السادس',
    7: 'السابع',
    8: 'الثامن',
    9: 'التاسع',
    10: 'العاشر',
    11: 'الحادي عشر',
    12: 'الثاني عشر'
  };
  return words[num] || num.toString();
}

/**
 * Get available grades from a list of students
 * Returns only grades that have at least one student
 */
export function getAvailableGrades(students: Array<{ grade: string | null }>): Array<{
  normalized: string;
  displayName: string;
  count: number;
  category: ClassifiedGrade['category'];
  level: number | null;
}> {
  const gradeMap = new Map<string, {
    displayName: string;
    count: number;
    category: ClassifiedGrade['category'];
    level: number | null;
  }>();

  // Classify all students and count
  students.forEach(student => {
    const classified = classifyGrade(student.grade);

    if (gradeMap.has(classified.normalized)) {
      const existing = gradeMap.get(classified.normalized)!;
      existing.count++;
    } else {
      gradeMap.set(classified.normalized, {
        displayName: classified.displayName,
        count: 1,
        category: classified.category,
        level: classified.level
      });
    }
  });

  // Convert to array and sort
  const grades = Array.from(gradeMap.entries()).map(([normalized, data]) => ({
    normalized,
    ...data
  }));

  // Sort by category and level
  grades.sort((a, b) => {
    const categoryOrder = { elementary: 1, middle: 2, high: 3, university: 4, unclassified: 5 };

    if (a.category !== b.category) {
      return categoryOrder[a.category] - categoryOrder[b.category];
    }

    if (a.level !== null && b.level !== null) {
      return a.level - b.level;
    }

    return a.displayName.localeCompare(b.displayName, 'ar');
  });

  return grades;
}

/**
 * Filter students by grade
 */
export function filterStudentsByGrade<T extends { grade: string | null }>(
  students: T[],
  selectedGradeNormalized: string | null
): T[] {
  if (!selectedGradeNormalized || selectedGradeNormalized === 'all') {
    return students;
  }

  return students.filter(student => {
    const classified = classifyGrade(student.grade);
    return classified.normalized === selectedGradeNormalized;
  });
}
