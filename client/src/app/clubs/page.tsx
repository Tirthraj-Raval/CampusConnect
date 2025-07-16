'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

type Club = {
  id: string;
  name: string;
  description: string;
  logo_url: string;
  university_id: number;
  member_count?: number;
  category?: string;
  created_at?: string;
  upcoming_events_count?: number;
  is_featured?: boolean;
};

type FilterOptions = {
  category: string[];
  memberCount: string;
  sortBy: string;
};

const categories = [
  'Academic',
  'Arts',
  'Cultural',
  'Sports',
  'Technology',
  'Social',
  'Volunteer',
  'Business',
  'Health',
  'Other'
];

const ExploreClubsPage = () => {
  const router = useRouter();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [filteredClubs, setFilteredClubs] = useState<Club[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error' | 'info'} | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({
    category: [],
    memberCount: 'all',
    sortBy: 'popular'
  });

  // Fetch clubs data
  useEffect(() => {
    const fetchClubs = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const res = await fetch('http://localhost:5000/api/club', {
          credentials: 'include',
        });

        if (!res.ok) throw new Error('Failed to fetch clubs');
        
        const data = await res.json();
        const enrichedClubs = data.clubs.map((club: Club) => ({
          ...club,
          member_count: Math.floor(Math.random() * 500) + 50,
          upcoming_events_count: Math.floor(Math.random() * 10),
          category: categories[Math.floor(Math.random() * categories.length)],
          is_featured: Math.random() > 0.7
        }));
        
        setClubs(enrichedClubs);
        setFilteredClubs(enrichedClubs);
        
        // Show welcome notification
        setNotification({
          message: `Found ${enrichedClubs.length} clubs to explore!`,
          type: 'success'
        });
        setTimeout(() => setNotification(null), 5000);
        
      } catch (err: any) {
        console.error('Error fetching clubs:', err);
        setError(err.message || 'Failed to load clubs');
        setNotification({
          message: 'Failed to load clubs. Please try again later.',
          type: 'error'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchClubs();
  }, []);

  // Apply filters and search
  useEffect(() => {
    let result = [...clubs];
    
    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      result = result.filter(club => 
        club.name.toLowerCase().includes(query) ||
        club.description?.toLowerCase().includes(query) ||
        club.category?.toLowerCase().includes(query)
      );
    }
    
    // Apply category filters
    if (filters.category.length > 0) {
      result = result.filter(club => 
        club.category && filters.category.includes(club.category)
      );
    }
    
    // Apply member count filters
    if (filters.memberCount !== 'all') {
      const count = parseInt(filters.memberCount);
      result = result.filter(club => {
        if (!club.member_count) return false;
        if (filters.memberCount === '1000') return club.member_count > 1000;
        return club.member_count >= count && club.member_count < count + 100;
      });
    }
    
    // Apply sorting
    result.sort((a, b) => {
      if (filters.sortBy === 'popular') {
        return (b.member_count || 0) - (a.member_count || 0);
      } else if (filters.sortBy === 'newest') {
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      } else if (filters.sortBy === 'events') {
        return (b.upcoming_events_count || 0) - (a.upcoming_events_count || 0);
      } else if (filters.sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });
    
    setFilteredClubs(result);
  }, [searchQuery, filters, clubs]);

  const toggleCategory = (category: string) => {
    setFilters(prev => ({
      ...prev,
      category: prev.category.includes(category)
        ? prev.category.filter(c => c !== category)
        : [...prev.category, category]
    }));
  };

  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({
      category: [],
      memberCount: 'all',
      sortBy: 'popular'
    });
    setSearchQuery('');
  };

  const viewClubDetails = (clubId: string) => {
    router.push(`/clubs/${clubId}/about`);
  };

  // SVG Icons
  const SearchIcon = () => (
    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );

  const FilterIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
    </svg>
  );

  const CloseIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );

  const MembersIcon = ({ className = "" }: { className?: string }) => (
    <svg className={`w-4 h-4 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );

  const EventsIcon = ({ className = "" }: { className?: string }) => (
    <svg className={`w-4 h-4 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );

  const StarIcon = ({ className = "" }: { className?: string }) => (
    <svg className={`w-4 h-4 text-yellow-400 ${className}`} fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );

  const LoadingSpinner = () => (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full"
    />
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-sky-50 to-emerald-50 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-emerald-200 opacity-10"
            style={{
              width: Math.random() * 300 + 100,
              height: Math.random() * 300 + 100,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              x: [0, Math.random() * 200 - 100],
              y: [0, Math.random() * 200 - 100],
              opacity: [0.1, 0.2, 0.1],
            }}
            transition={{
              duration: Math.random() * 30 + 20,
              repeat: Infinity,
              repeatType: 'reverse',
            }}
          />
        ))}
      </div>

      {/* Notification system */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.3 }}
            className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-50 rounded-xl shadow-xl px-6 py-3 flex items-center ${
              notification.type === 'success' 
                ? 'bg-emerald-100 border-l-4 border-emerald-500 text-emerald-800'
                : notification.type === 'error'
                ? 'bg-red-100 border-l-4 border-red-500 text-red-800'
                : 'bg-blue-100 border-l-4 border-blue-500 text-blue-800'
            }`}
          >
            <span className="mr-2">
              {notification.type === 'success' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : notification.type === 'error' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </span>
            <span>{notification.message}</span>
            <button 
              onClick={() => setNotification(null)}
              className="ml-4 text-gray-500 hover:text-gray-700"
            >
              <CloseIcon />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl font-bold text-emerald-800 mb-4">
            Discover Amazing Clubs
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Join communities that match your interests and connect with like-minded people across the campus.
          </p>
        </motion.div>

        {/* Search and filter bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-12"
        >
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search input */}
            <div className="relative w-full md:w-1/2">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search clubs by name, description or category..."
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
              />
            </div>

            {/* Filter buttons */}
            <div className="flex gap-3 w-full md:w-auto">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-sm transition-all ${
                  showFilters || filters.category.length > 0 || filters.memberCount !== 'all' || filters.sortBy !== 'popular'
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                <FilterIcon />
                <span>Filters</span>
                {(filters.category.length > 0 || filters.memberCount !== 'all' || filters.sortBy !== 'popular') && (
                  <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-emerald-500 rounded-full">
                    {[filters.category.length, filters.memberCount !== 'all' ? 1 : 0, filters.sortBy !== 'popular' ? 1 : 0].reduce((a, b) => a + b, 0)}
                  </span>
                )}
              </button>

              <button
                onClick={resetFilters}
                className="px-4 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl shadow-sm hover:bg-gray-50 transition-all"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Expanded filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-4 bg-white p-6 rounded-xl shadow-md border border-gray-200"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Category filter */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Categories</h3>
                    <div className="space-y-2">
                      {categories.map(cat => (
                        <div key={cat} className="flex items-center">
                          <input
                            id={`category-${cat}`}
                            name="category"
                            type="checkbox"
                            checked={filters.category.includes(cat)}
                            onChange={() => toggleCategory(cat)}
                            className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                          />
                          <label htmlFor={`category-${cat}`} className="ml-3 text-sm text-gray-700">
                            {cat}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Member count filter */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Member Count</h3>
                    <div className="space-y-2">
                      {[
                        { value: 'all', label: 'All sizes' },
                        { value: '50', label: '50-150 members' },
                        { value: '150', label: '150-250 members' },
                        { value: '250', label: '250-500 members' },
                        { value: '500', label: '500-1000 members' },
                        { value: '1000', label: '1000+ members' }
                      ].map(option => (
                        <div key={option.value} className="flex items-center">
                          <input
                            id={`memberCount-${option.value}`}
                            name="memberCount"
                            type="radio"
                            checked={filters.memberCount === option.value}
                            onChange={() => handleFilterChange('memberCount', option.value)}
                            className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300"
                          />
                          <label htmlFor={`memberCount-${option.value}`} className="ml-3 text-sm text-gray-700">
                            {option.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sort by filter */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Sort By</h3>
                    <div className="space-y-2">
                      {[
                        { value: 'popular', label: 'Most popular' },
                        { value: 'newest', label: 'Newest' },
                        { value: 'events', label: 'Most upcoming events' },
                        { value: 'name', label: 'Alphabetical' }
                      ].map(option => (
                        <div key={option.value} className="flex items-center">
                          <input
                            id={`sortBy-${option.value}`}
                            name="sortBy"
                            type="radio"
                            checked={filters.sortBy === option.value}
                            onChange={() => handleFilterChange('sortBy', option.value)}
                            className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300"
                          />
                          <label htmlFor={`sortBy-${option.value}`} className="ml-3 text-sm text-gray-700">
                            {option.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Featured clubs banner */}
        {filteredClubs.some(c => c.is_featured) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-12"
          >
            <h2 className="text-2xl font-bold text-emerald-800 mb-6 flex items-center">
              <StarIcon className="mr-2" />
              Featured Clubs
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredClubs
                .filter(club => club.is_featured)
                .slice(0, 2)
                .map(club => (
                  <motion.div
                    key={`featured-${club.id}`}
                    whileHover={{ y: -5 }}
                    className="bg-gradient-to-r from-emerald-500 to-sky-500 rounded-2xl shadow-xl overflow-hidden"
                  >
                    <div className="p-6 flex flex-col md:flex-row items-center">
                      <div className="flex-shrink-0 mb-4 md:mb-0 md:mr-6">
                        {club.logo_url ? (
                          <img
                            src={club.logo_url}
                            alt={club.name}
                            className="w-20 h-20 rounded-full object-cover border-4 border-white shadow"
                            loading="lazy"
                            onError={(e) => (e.currentTarget.src = '/default-club-logo.png')}
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                            <svg className="w-10 h-10 text-white opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="text-center md:text-left">
                        <h3 className="text-xl font-bold text-white">{club.name}</h3>
                        <p className="text-emerald-100 mt-1 line-clamp-2">
                          {club.description || 'No description provided.'}
                        </p>
                        <div className="flex justify-center md:justify-start items-center mt-3 space-x-4">
                          <span className="inline-flex items-center text-sm text-white">
                            <MembersIcon className="mr-1" />
                            {club.member_count?.toLocaleString()} members
                          </span>
                          <span className="inline-flex items-center text-sm text-white">
                            <EventsIcon className="mr-1" />
                            {club.upcoming_events_count} upcoming events
                          </span>
                        </div>
                        <button
                          onClick={() => viewClubDetails(club.id)}
                          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-emerald-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                        >
                          Explore Club
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
            </div>
          </motion.div>
        )}

        {/* Loading state */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-center items-center py-20"
          >
            <LoadingSpinner />
            <span className="ml-3 text-gray-600">Loading clubs...</span>
          </motion.div>
        )}

        {/* Error state */}
        {error && !isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-xl shadow-md p-8 text-center"
          >
            <svg className="mx-auto h-12 w-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">Error loading clubs</h3>
            <p className="mt-1 text-sm text-gray-500">{error}</p>
            <div className="mt-6">
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
              >
                Try again
              </button>
            </div>
          </motion.div>
        )}

        {/* Clubs grid */}
        {!isLoading && !error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-emerald-800">
                {filteredClubs.length} {filteredClubs.length === 1 ? 'Club' : 'Clubs'} Found
              </h2>
              <div className="text-sm text-gray-500">
                Showing {Math.min(filteredClubs.length, 12)} of {filteredClubs.length}
              </div>
            </div>

            {filteredClubs.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredClubs.map((club, index) => (
                  <motion.div
                    key={club.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    whileHover={{ y: -5 }}
                    className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all overflow-hidden border border-gray-100"
                  >
                    <div className="p-6 flex flex-col h-full">
                      <div className="flex items-center justify-center mb-4">
                        {club.logo_url ? (
                          <img
                            src={club.logo_url}
                            alt={club.name}
                            className="w-20 h-20 rounded-full object-cover border-2 border-emerald-100 shadow"
                            loading="lazy"
                            onError={(e) => (e.currentTarget.src = '/default-club-logo.png')}
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
                            <svg className="w-10 h-10 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-grow">
                        <div className="text-center">
                          <h3 className="text-lg font-bold text-emerald-800 mb-1">{club.name}</h3>
                          {club.category && (
                            <span className="inline-block px-2 py-1 text-xs font-semibold text-emerald-700 bg-emerald-100 rounded-full mb-2">
                              {club.category}
                            </span>
                          )}
                          <p className="text-sm text-gray-600 mt-2 line-clamp-3">
                            {club.description || 'No description provided.'}
                          </p>
                        </div>
                        
                        <div className="mt-4 flex justify-center items-center space-x-4">
                          <span className="inline-flex items-center text-xs text-gray-500">
                            <MembersIcon className="mr-1" />
                            {club.member_count?.toLocaleString()}
                          </span>
                          <span className="inline-flex items-center text-xs text-gray-500">
                            <EventsIcon className="mr-1" />
                            {club.upcoming_events_count}
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-6 text-center">
                        <button
                          onClick={() => viewClubDetails(club.id)}
                          className="w-full px-4 py-2 bg-gradient-to-r from-emerald-500 to-sky-500 text-white rounded-lg shadow-sm hover:shadow-md transition-all"
                        >
                          View Club
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-xl shadow-md p-12 text-center"
              >
                <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900">No clubs found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Try adjusting your search or filter to find what you're looking for.
                </p>
                <div className="mt-6">
                  <button
                    onClick={resetFilters}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                  >
                    Reset filters
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Pagination would go here */}
        {filteredClubs.length > 12 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-12 flex justify-center"
          >
            <nav className="flex items-center space-x-2">
              <button className="px-3 py-1 rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-50">
                Previous
              </button>
              <button className="px-3 py-1 rounded-lg bg-emerald-500 text-white">
                1
              </button>
              <button className="px-3 py-1 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">
                2
              </button>
              <button className="px-3 py-1 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">
                3
              </button>
              <span className="px-2 text-gray-500">...</span>
              <button className="px-3 py-1 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">
                8
              </button>
              <button className="px-3 py-1 rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-50">
                Next
              </button>
            </nav>
          </motion.div>
        )}
      </div>

      {/* Floating action button for mobile */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="fixed bottom-6 right-6 md:hidden"
      >
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="p-4 bg-gradient-to-r from-emerald-500 to-sky-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all"
        >
          <FilterIcon />
        </button>
      </motion.div>
    </div>
  );
};

export default ExploreClubsPage;