import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search as SearchIcon, 
  Filter, 
  User, 
  Star, 
  MessageCircle, 
  Briefcase, 
  Clock, 
  Calendar,
  MapPin,
  Languages,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { useConsultations } from '../hooks/useConsultations';
import { BookConsultationModal } from '../components/Consultations/BookConsultationModal';
import { useTranslation } from 'react-i18next';

export const Search: React.FC = () => {
  const { t } = useTranslation();
  const { consultants, loading, error } = useConsultations();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [selectedRating, setSelectedRating] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [showBookModal, setShowBookModal] = useState(false);
  const [selectedConsultant, setSelectedConsultant] = useState<string | null>(null);

  // Get unique specialties from consultants
  const specialties = ['all', ...new Set(consultants.flatMap(c => c.specialties))];

  const filteredConsultants = consultants.filter(consultant => {
    const matchesSearch = consultant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         consultant.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         consultant.specialties.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesSpecialty = selectedSpecialty === 'all' || consultant.specialties.includes(selectedSpecialty);
    const matchesRating = consultant.rating >= selectedRating;
    
    return matchesSearch && matchesSpecialty && matchesRating;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">{t('common.error')}</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 text-white"
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
            <SearchIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{t('search.title')}</h1>
            <p className="opacity-90">{t('search.subtitle')}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold">{consultants.length}</div>
            <div className="text-sm opacity-80">{t('search.stats.availableConsultants')}</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{specialties.length - 1}</div>
            <div className="text-sm opacity-80">{t('search.stats.specialties')}</div>
          </div>
          <div>
            <div className="text-2xl font-bold">24/7</div>
            <div className="text-sm opacity-80">{t('search.stats.support')}</div>
          </div>
          <div>
            <div className="text-2xl font-bold">100%</div>
            <div className="text-sm opacity-80">{t('search.stats.satisfaction')}</div>
          </div>
        </div>
      </motion.div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="bg-white rounded-2xl p-6 shadow-lg"
      >
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <SearchIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={t('search.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-12 pl-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden flex items-center gap-2 px-4 py-3 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
          >
            <Filter className="w-5 h-5" />
            {t('common.filter')}
          </button>
        </div>

        {/* Filters */}
        <div className={`mt-4 space-y-4 ${showFilters ? 'block' : 'hidden lg:block'}`}>
          {/* Specialties */}
          <div>
            <h3 className="font-medium text-gray-700 mb-3">{t('search.specialty')}</h3>
            <div className="flex flex-wrap gap-2">
              {specialties.map((specialty) => (
                <button
                  key={specialty}
                  onClick={() => setSelectedSpecialty(specialty)}
                  className={`px-4 py-2 rounded-xl transition-all ${
                    selectedSpecialty === specialty
                      ? 'bg-emerald-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {specialty === 'all' ? t('search.allSpecialties') : specialty}
                </button>
              ))}
            </div>
          </div>

          {/* Rating Filter */}
          <div>
            <h3 className="font-medium text-gray-700 mb-3">{t('search.rating')}</h3>
            <div className="flex items-center gap-2">
              {[0, 3, 3.5, 4, 4.5].map((rating) => (
                <button
                  key={rating}
                  onClick={() => setSelectedRating(rating)}
                  className={`flex items-center gap-1 px-4 py-2 rounded-xl transition-all ${
                    selectedRating === rating
                      ? 'bg-emerald-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {rating === 0 ? (
                    t('common.all')
                  ) : (
                    <>
                      <Star className="w-4 h-4" />
                      {rating}+
                    </>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-gray-600">
          {t('search.showing')} {filteredConsultants.length} {t('search.of')} {consultants.length} {t('search.consultant')}
        </p>
      </div>

      {/* Consultants Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredConsultants.map((consultant, index) => (
          <motion.div
            key={consultant.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300"
          >
            <div className="text-center mb-4">
              <img
                src={consultant.avatar}
                alt={consultant.name}
                className="w-24 h-24 rounded-full object-cover mx-auto mb-4"
              />
              <h3 className="text-xl font-bold text-gray-800 mb-1">{consultant.name}</h3>
              <p className="text-gray-600 mb-2">{consultant.title}</p>
              <div className="flex items-center justify-center gap-1 mb-2">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="font-medium">{consultant.rating}</span>
                <span className="text-gray-500 text-sm">({consultant.reviews} {t('search.reviews')})</span>
              </div>
              <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                {consultant.availability}
              </span>
            </div>

            <div className="space-y-3 mb-4">
              <div>
                <h4 className="font-medium text-gray-800 mb-2">{t('search.specialties')}:</h4>
                <div className="flex flex-wrap gap-1">
                  {consultant.specialties.map((specialty, idx) => (
                    <span key={idx} className="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs rounded-lg">
                      {specialty}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{t('search.experience')}:</span>
                <span className="font-medium">{consultant.experience}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{t('search.price')}:</span>
                <span className="font-medium text-emerald-600">{consultant.hourlyRate} {t('search.pricePerHour')}</span>
              </div>
              
              <div>
                <span className="text-gray-600 text-sm">{t('search.languages')}: </span>
                <span className="text-sm">{consultant.languages.join(', ')}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => {
                  setSelectedConsultant(consultant.id);
                  setShowBookModal(true);
                }}
                className="flex-1 bg-emerald-500 text-white py-2 px-4 rounded-xl hover:bg-emerald-600 transition-colors font-medium"
              >
                {t('search.bookConsultation')}
              </button>
              <button className="px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">
                <MessageCircle className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {filteredConsultants.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center py-12"
        >
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <SearchIcon className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">{t('search.noConsultantsFound')}</h3>
          <p className="text-gray-600 mb-4">{t('search.tryChangingFilters')}</p>
          <button
            onClick={() => {
              setSelectedSpecialty('all');
              setSelectedRating(0);
              setSearchTerm('');
            }}
            className="px-6 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors"
          >
            {t('common.resetFilters')}
          </button>
        </motion.div>
      )}

      {/* Book Consultation Modal */}
      {showBookModal && selectedConsultant && (
        <BookConsultationModal
          consultant={consultants.find(c => c.id === selectedConsultant)!}
          onClose={() => {
            setShowBookModal(false);
            setSelectedConsultant(null);
          }}
          onSubmit={(data) => {
            console.log('Booking consultation:', data);
            setShowBookModal(false);
            setSelectedConsultant(null);
          }}
        />
      )}
    </div>
  );
};