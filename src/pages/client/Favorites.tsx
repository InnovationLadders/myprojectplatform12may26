import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Star, 
  Search, 
  Filter, 
  User, 
  MessageCircle, 
  Briefcase, 
  Clock, 
  Calendar,
  MapPin,
  Languages,
  DollarSign,
  Heart,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';


export const Favorites: React.FC = () => {
  const { t } = useTranslation();
  const [favorites, setFavorites] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');

  // Get unique specialties from favorites
  const specialties = ['all', ...new Set(favorites.flatMap(f => f.specialties))];

  const filteredFavorites = favorites.filter(favorite => {
    const matchesSearch = favorite.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         favorite.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         favorite.specialties.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesSpecialty = selectedSpecialty === 'all' || favorite.specialties.includes(selectedSpecialty);
    
    return matchesSearch && matchesSpecialty;
  });

  const removeFavorite = (id: string) => {
    setFavorites(prev => prev.filter(f => f.id !== id));
  };

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
            <Star className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{t('favorites.title')}</h1>
            <p className="opacity-90">{t('favorites.subtitle')}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold">{favorites.length}</div>
            <div className="text-sm opacity-80">{t('favorites.stats.favoriteConsultants')}</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{specialties.length - 1}</div>
            <div className="text-sm opacity-80">{t('favorites.stats.differentSpecialties')}</div>
          </div>
          <div>
            <div className="text-2xl font-bold">
              {Math.round(favorites.reduce((acc, f) => acc + f.rating, 0) / favorites.length * 10) / 10}
            </div>
            <div className="text-sm opacity-80">{t('favorites.stats.averageRating')}</div>
          </div>
          <div>
            <div className="text-2xl font-bold">
              {Math.round(favorites.reduce((acc, f) => acc + f.hourlyRate, 0) / favorites.length)}
            </div>
            <div className="text-sm opacity-80">{t('favorites.stats.averagePrice')}</div>
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
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={t('favorites.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-12 pl-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Categories */}
          <div>
            <h3 className="font-medium text-gray-700 mb-3">{t('favorites.specialty')}</h3>
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
                  {specialty === 'all' ? t('favorites.allSpecialties') : specialty}
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-gray-600">
          {t('favorites.showing')} {filteredFavorites.length} {t('favorites.of')} {favorites.length} {t('favorites.consultant')}
        </p>
      </div>

      {/* Favorites Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFavorites.map((favorite, index) => (
          <motion.div
            key={favorite.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300"
          >
            <div className="text-center mb-4 relative">
              <button
                onClick={() => removeFavorite(favorite.id)}
                className="absolute top-0 left-0 p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors"
              >
                <Heart className="w-5 h-5 fill-current" />
              </button>
              
              <img
                src={favorite.avatar}
                alt={favorite.name}
                className="w-24 h-24 rounded-full object-cover mx-auto mb-4"
              />
              <h3 className="text-xl font-bold text-gray-800 mb-1">{favorite.name}</h3>
              <p className="text-gray-600 mb-2">{favorite.title}</p>
              <div className="flex items-center justify-center gap-1 mb-2">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="font-medium">{favorite.rating}</span>
                <span className="text-gray-500 text-sm">({favorite.reviews} {t('favorites.reviews')})</span>
              </div>
              <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium flex items-center gap-1">
                {favorite.availability}
              </span>
            </div>

            <div className="space-y-3 mb-4">
              <div>
                <h4 className="font-medium text-gray-800 mb-2">{t('favorites.specialties')}:</h4>
                <div className="flex flex-wrap gap-1">
                  {favorite.specialties.map((specialty, idx) => (
                    <span key={idx} className="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs rounded-lg">
                      {specialty}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{t('favorites.experience')}:</span>
                <span className="font-medium">{favorite.experience}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{t('favorites.price')}:</span>
                <span className="font-medium text-emerald-600">{favorite.hourlyRate} {t('favorites.pricePerHour')}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{t('favorites.location')}:</span>
                <span className="font-medium">{favorite.location}</span>
              </div>
              
              <div>
                <span className="text-gray-600 text-sm">{t('favorites.languages')}: </span>
                <span className="text-sm">{favorite.languages.join(', ')}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Link
                to={`/consultations?consultant=${favorite.id}`}
                className="flex-1 bg-emerald-500 text-white py-2 px-4 rounded-xl hover:bg-emerald-600 transition-colors font-medium"
              >
                {t('favorites.bookConsultation')}
              </Link>
              <button className="px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">
                <MessageCircle className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {filteredFavorites.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center py-12"
        >
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Star className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">{t('favorites.noFavorites')}</h3>
          <p className="text-gray-600 mb-4">
            {favorites.length === 0 
              ? t('favorites.noFavoritesAdded') 
              : t('favorites.noFavoritesMatch')}
          </p>
          <div className="flex justify-center gap-4">
            <Link
              to="/search"
              className="px-6 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors"
            >
              {t('favorites.searchConsultants')}
            </Link>
            {favorites.length > 0 && (
              <button
                onClick={() => {
                  setSelectedSpecialty('all');
                  setSearchTerm('');
                }}
                className="px-6 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
              >
                {t('common.resetFilters')}
              </button>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};