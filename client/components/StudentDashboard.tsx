'use client'

import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { useState, useEffect } from 'react'

interface DashboardProps {
userType: string | null
logout: () => Promise<void>
}

const PremiumStudentDashboard = ({userType, logout} : DashboardProps) => {

  const [activeTab, setActiveTab] = useState('discover')
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'event', message: 'New event: Tech Hackathon 2023', time: '2 min ago', read: false },
    { id: 2, type: 'friend', message: '5 friends joined CampusConnect', time: '10 min ago', read: false },
    { id: 3, type: 'club', message: 'Drama Club posted new content', time: '1 hour ago', read: true },
  ])
  
  const [showNotificationPanel, setShowNotificationPanel] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  // Floating logo animation
  const [logoPosition, setLogoPosition] = useState({ x: 0, y: 0 })
  const [logoRotation, setLogoRotation] = useState(0)

  useEffect(() => {
    // Animate logo position
    const interval = setInterval(() => {
      setLogoPosition({
        x: Math.random() * 20 - 10,
        y: Math.random() * 20 - 10
      })
      setLogoRotation(Math.random() * 10 - 5)
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  // Sample clubs data with premium styling
  const premiumClubs = [
    {
      id: 1,
      name: 'Tech Society',
      description: 'For tech enthusiasts and innovators pushing boundaries',
      members: 245,
      events: 12,
      logo: '/tech-club.png',
      subscribed: false,
      tags: ['AI/ML', 'Web Dev', 'Blockchain'],
      color: 'from-emerald-400 to-emerald-600',
      emoji: '💻'
    },
    {
      id: 2,
      name: 'Cultural Collective',
      description: 'Celebrating global diversity through performing arts',
      members: 180,
      events: 8,
      logo: '/cultural-club.png',
      subscribed: false,
      tags: ['Dance', 'Music', 'Theater'],
      color: 'from-sky-400 to-sky-600',
      emoji: '🎭'
    },
    {
      id: 3,
      name: 'Gourmet Society',
      description: 'For culinary artists and food science enthusiasts',
      members: 120,
      events: 6,
      logo: '/food-club.png',
      subscribed: false,
      tags: ['Baking', 'Mixology', 'Sustainability'],
      color: 'from-purple-400 to-purple-600',
      emoji: '🍕'
    },
    {
      id: 4,
      name: 'Athletic Union',
      description: 'Competitive sports and wellness programs',
      members: 210,
      events: 15,
      logo: '/sports-club.png',
      subscribed: false,
      tags: ['Fitness', 'Esports', 'Outdoors'],
      color: 'from-orange-400 to-orange-600',
      emoji: '⚽'
    },
    {
      id: 5,
      name: 'Literary Guild',
      description: 'For writers, poets, and storytelling innovators',
      members: 95,
      events: 5,
      logo: '/literary-club.png',
      subscribed: false,
      tags: ['Poetry', 'Fiction', 'Journalism'],
      color: 'from-indigo-400 to-indigo-600',
      emoji: '📚'
    },
    {
      id: 6,
      name: 'Eco Warriors',
      description: 'Sustainability initiatives and green technology',
      members: 150,
      events: 7,
      logo: '/environment-club.png',
      subscribed: false,
      tags: ['Climate', 'Renewables', 'Conservation'],
      color: 'from-green-400 to-green-600',
      emoji: '🌱'
    }
  ]

  // Premium events data
  const premiumEvents = [
    {
      id: 1,
      title: 'Hack the Future 2023',
      club: 'Tech Society',
      date: 'Tomorrow',
      time: '10:00 AM - 6:00 PM',
      location: 'CS Innovation Lab',
      description: '48-hour hackathon with $10k in prizes. Build the next big thing in AI, Web3 or IoT.',
      image: '/event-tech.png',
      registered: false,
      capacity: 100,
      registeredCount: 78,
      tags: ['Competition', 'Workshop', 'Networking'],
      color: 'from-emerald-400 to-emerald-600',
      emoji: '💻'
    },
    {
      id: 2,
      title: 'Global Rhythms Night',
      club: 'Cultural Collective',
      date: 'This Weekend',
      time: '7:00 PM - Midnight',
      location: 'Grand Auditorium',
      description: 'An electrifying evening of international performances and cultural exchange.',
      image: '/event-dance.jpg',
      registered: false,
      capacity: 300,
      registeredCount: 245,
      tags: ['Performance', 'Showcase', 'Social'],
      color: 'from-sky-400 to-sky-600',
      emoji: '🎭'
    },
    {
      id: 3,
      title: 'Epicurean Festival',
      club: 'Gourmet Society',
      date: 'Next Week',
      time: '12:00 PM - 4:00 PM',
      location: 'Central Quad',
      description: 'Taste gourmet creations from 30+ culinary artists. Vote for your favorites!',
      image: '/event-food.jpg',
      registered: false,
      capacity: 200,
      registeredCount: 189,
      tags: ['Tasting', 'Competition', 'Social'],
      color: 'from-purple-400 to-purple-600',
      emoji: '🍕'
    }
  ]

  // Mark notification as read
  const markAsRead = (id: number) => {
    setNotifications(notifications.map(n => 
      n.id === id ? {...n, read: true} : n
    ))
  }

  // Toggle subscription to a club
  const toggleSubscription = (clubId: number) => {
    console.log(`Toggled subscription for club ${clubId}`)
  }

  // Register for an event
  const registerForEvent = (eventId: number) => {
    console.log(`Registered for event ${eventId}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
      {/* Premium Dashboard Header */}
      <header className="bg-white/90 backdrop-blur-md shadow-sm fixed w-full z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            {/* Premium Logo with floating animation */}
            <motion.div 
              className="flex items-center"
              animate={{
                x: logoPosition.x,
                y: logoPosition.y,
                rotate: logoRotation
              }}
              transition={{ 
                type: 'spring',
                stiffness: 50,
                damping: 10
              }}
            >
              <motion.div 
                className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-sky-500 rounded-xl flex items-center justify-center shadow-lg mr-3"
                animate={{ rotate: [0, 360] }}
                transition={{ 
                  duration: 20, 
                  repeat: Infinity, 
                  ease: "linear",
                  delay: Math.random() * 2
                }}
              >
                <span className="text-white font-bold text-xl">CC</span>
              </motion.div>
              <h1 className="text-xl font-bold text-gray-800">CampusConnect</h1>
            </motion.div>

            {/* Premium Navigation */}
            <nav className="hidden md:flex space-x-1">
              {[
                { id: 'discover', label: 'Discover' },
                { id: 'myClubs', label: 'My Clubs' },
                { id: 'events', label: 'Events' },
                { id: 'calendar', label: 'Calendar' }
              ].map((tab) => (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.id 
                      ? 'bg-emerald-100 text-emerald-700 shadow-inner' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {tab.label}
                </motion.button>
              ))}
            </nav>

            {/* Premium Right side icons */}
            <div className="flex items-center space-x-4">
              {/* Premium Notification bell */}
              <div className="relative">
                <motion.button 
                  onClick={() => setShowNotificationPanel(!showNotificationPanel)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-1 rounded-full text-gray-500 hover:text-gray-700 focus:outline-none relative"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {notifications.some(n => !n.read) && (
                    <motion.span 
                      className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  )}
                </motion.button>

                {/* Premium Notification panel */}
                <AnimatePresence>
                  {showNotificationPanel && (
                    <motion.div
                      initial={{ opacity: 0, y: -20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -20, scale: 0.95 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                      className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl overflow-hidden z-50 border border-gray-200"
                    >
                      <div className="py-1">
                        <div className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                          <span>Notifications</span>
                          <button className="text-xs text-emerald-600 hover:text-emerald-800">Mark all as read</button>
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                          {notifications.map(notification => (
                            <motion.div 
                              key={notification.id} 
                              initial={{ opacity: 0, x: 10 }}
                              animate={{ opacity: 1, x: 0 }}
                              className={`px-4 py-3 border-b border-gray-100 ${
                                !notification.read ? 'bg-emerald-50/50' : 'bg-white'
                              }`}
                              onClick={() => markAsRead(notification.id)}
                              whileHover={{ backgroundColor: 'rgba(209, 250, 229, 0.5)' }}
                            >
                              <div className="flex items-start">
                                <div className="flex-shrink-0 pt-0.5">
                                  {notification.type === 'event' && (
                                    <div className="h-8 w-8 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 flex items-center justify-center">
                                      <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                      </svg>
                                    </div>
                                  )}
                                  {notification.type === 'friend' && (
                                    <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center">
                                      <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                      </svg>
                                    </div>
                                  )}
                                  {notification.type === 'club' && (
                                    <div className="h-8 w-8 rounded-full bg-gradient-to-r from-purple-400 to-purple-600 flex items-center justify-center">
                                      <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                      </svg>
                                    </div>
                                  )}
                                </div>
                                <div className="ml-3 flex-1">
                                  <p className="text-sm font-medium text-gray-900">{notification.message}</p>
                                  <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                                </div>
                                {!notification.read && (
                                  <div className="ml-2 flex-shrink-0">
                                    <motion.span 
                                      className="h-2 w-2 rounded-full bg-emerald-500 block"
                                      animate={{ scale: [1, 1.3, 1] }}
                                      transition={{ duration: 1.5, repeat: Infinity }}
                                    />
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          ))}
                        </div>
                        <div className="px-4 py-2 text-center text-sm font-medium text-emerald-600 bg-gray-50 hover:bg-gray-100 border-t border-gray-200">
                          View all notifications
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Premium Profile dropdown */}
              <div className="relative">
                <motion.button 
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center space-x-2 focus:outline-none"
                >
                  <motion.div 
                    className="h-8 w-8 rounded-full bg-gradient-to-r from-emerald-400 to-sky-500 flex items-center justify-center text-white font-medium shadow-md"
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    JS
                  </motion.div>
                  <span className="hidden md:inline-block text-sm font-medium text-gray-700">John Student</span>
                </motion.button>

                <AnimatePresence>
                  {showProfileMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -20, scale: 0.95 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                      className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg z-50 border border-gray-200"
                    >
                      <div className="py-1">
                        <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Your Profile</a>
                        <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Settings</a>
                        <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Help Center</a>
                        <div className="border-t border-gray-200"></div>
                        <a onClick={logout} className="block px-4 cursor-pointer py-2 text-sm text-gray-700 hover:bg-gray-100">Logout({userType})</a>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Premium Main Content */}
      <main className="pt-20 pb-16 max-w-7xl mx-auto px-6">
        {/* Premium Welcome Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-r from-emerald-500 to-sky-500 rounded-2xl shadow-2xl overflow-hidden mb-8 relative"
        >
          <div className="absolute inset-0 opacity-10">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full bg-white"
                style={{
                  width: Math.random() * 100 + 50,
                  height: Math.random() * 100 + 50,
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  x: [0, Math.random() * 40 - 20],
                  y: [0, Math.random() * 40 - 20],
                }}
                transition={{
                  duration: Math.random() * 10 + 10,
                  repeat: Infinity,
                  repeatType: 'reverse',
                }}
              />
            ))}
          </div>
          
          <div className="p-8 relative z-10">
            <div className="flex flex-col md:flex-row items-center">
              <div className="flex-1">
                <motion.h2 
                  className="text-3xl md:text-4xl font-bold text-white mb-3"
                  animate={{ x: [0, -3, 3, 0] }}
                  transition={{ duration: 5, repeat: Infinity }}
                >
                  Welcome back, John!
                </motion.h2>
                <p className="text-emerald-100 text-lg max-w-2xl mb-6">
                  Discover new clubs, register for events, and stay updated with everything happening on campus.
                </p>
                <motion.button
                  whileHover={{ y: -2, boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)' }}
                  whileTap={{ scale: 0.98 }}
                  className="px-6 py-3 bg-white text-emerald-600 font-semibold rounded-lg shadow-md hover:shadow-lg transition-all"
                >
                  Explore Clubs
                </motion.button>
              </div>
              <div className="mt-6 md:mt-0">
                <motion.div 
                  className="relative h-48 w-48"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                >
                  <Image
                    src="/student-dashboard.png"
                    alt="Student Dashboard"
                    fill
                    className="object-contain"
                  />
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Premium Dashboard Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {[
            { 
              title: 'Clubs Joined', 
              value: 0, 
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              ),
              color: 'bg-emerald-100 text-emerald-600'
            },
            { 
              title: 'Upcoming Events', 
              value: premiumEvents.length, 
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              ),
              color: 'bg-blue-100 text-blue-600'
            },
            { 
              title: 'Friends Active', 
              value: 12, 
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ),
              color: 'bg-purple-100 text-purple-600'
            },
            { 
              title: 'Achievements', 
              value: 0, 
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              ),
              color: 'bg-amber-100 text-amber-600'
            }
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className={`${stat.color} p-6 rounded-2xl shadow-md hover:shadow-lg transition-all`}
            >
              <div className="flex items-center">
                <div className="p-2 rounded-lg bg-white/80 backdrop-blur-sm mr-4 shadow-sm">
                  {stat.icon}
                </div>
                <div>
                  <p className="text-sm font-medium">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Premium Main Dashboard Content */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-white/20">
          {/* Premium Dashboard Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {[
                { id: 'discover', label: 'Discover Clubs' },
                { id: 'myClubs', label: 'My Clubs' },
                { id: 'events', label: 'Upcoming Events' },
                { id: 'calendar', label: 'Calendar' }
              ].map((tab) => (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className={`whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm transition-all ${
                    activeTab === tab.id
                      ? 'border-emerald-500 text-emerald-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </motion.button>
              ))}
            </nav>
          </div>

          {/* Premium Tab Content */}
          <div className="p-6">
            <AnimatePresence mode="wait">
              {activeTab === 'discover' && (
                <motion.div
                  key="discover"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="mb-8">
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">Discover Campus Clubs</h3>
                    <p className="text-gray-600">Join clubs that match your interests and passions</p>
                  </div>

                  {/* Premium Search and filters */}
                  <div className="mb-8">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </div>
                        <input
                          type="text"
                          className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl leading-5 bg-white/50 backdrop-blur-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm shadow-sm"
                          placeholder="Search clubs by name, interest or category..."
                        />
                      </div>
                      <div className="flex space-x-3">
                        <select
                          className="block w-full pl-3 pr-10 py-3 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-xl shadow-sm"
                        >
                          <option>All Categories</option>
                          <option>Technology</option>
                          <option>Arts & Culture</option>
                          <option>Sports & Wellness</option>
                          <option>Food & Culinary</option>
                          <option>Academic</option>
                        </select>
                        <select
                          className="block w-full pl-3 pr-10 py-3 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-xl shadow-sm"
                        >
                          <option>Sort By</option>
                          <option>Most Popular</option>
                          <option>Newest</option>
                          <option>Most Active</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Premium Clubs Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {premiumClubs.map((club, index) => (
                      <motion.div
                        key={club.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        whileHover={{ y: -8, scale: 1.02 }}
                        className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 relative overflow-hidden"
                      >
                        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-r from-gray-100 to-gray-200 opacity-20"></div>
                        <div className="relative z-10">
                          <div className="flex items-start justify-between mb-4">
                            <motion.div 
                              className={`w-14 h-14 bg-gradient-to-r ${club.color} rounded-xl flex items-center justify-center text-white text-3xl shadow-lg`}
                              whileHover={{ rotate: [0, -10, 10, 0] }}
                              transition={{ duration: 0.5 }}
                            >
                              {club.emoji}
                            </motion.div>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {club.members} members
                            </span>
                          </div>
                          <h3 className="text-lg font-bold text-gray-800 mb-2">{club.name}</h3>
                          <p className="text-sm text-gray-600 mb-4">{club.description}</p>
                          
                          <div className="flex flex-wrap gap-2 mb-5">
                            {club.tags.map((tag, i) => (
                              <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                {tag}
                              </span>
                            ))}
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <div className="text-sm text-gray-500">
                              <span className="font-medium">{club.events}</span> upcoming events
                            </div>
                            <motion.button 
                              onClick={() => toggleSubscription(club.id)}
                              className="text-sm bg-gradient-to-r from-emerald-500 to-sky-500 text-white px-4 py-2 rounded-full font-bold shadow-md hover:shadow-lg transition-all duration-300"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              Join
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'myClubs' && (
                <motion.div
                  key="myClubs"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="text-center py-12"
                >
                  <svg className="mx-auto h-16 w-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">No clubs yet</h3>
                  <p className="mt-2 text-sm text-gray-500 mb-6">You haven't joined any clubs. Discover clubs to get started!</p>
                  <motion.button
                    onClick={() => setActiveTab('discover')}
                    whileHover={{ y: -2, boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)' }}
                    whileTap={{ scale: 0.98 }}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                  >
                    <svg className="-ml-1 mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Discover Clubs
                  </motion.button>
                </motion.div>
              )}

              {activeTab === 'events' && (
                <motion.div
                  key="events"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="mb-8">
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">Upcoming Events</h3>
                    <p className="text-gray-600">Register for events from all campus clubs</p>
                  </div>

                  {/* Premium Events List */}
                  <div className="space-y-6">
                    {premiumEvents.map((event, index) => (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        whileHover={{ y: -5 }}
                        className="flex flex-col md:flex-row rounded-2xl shadow-lg overflow-hidden border border-gray-200"
                      >
                        <div className="relative h-48 md:h-auto md:w-1/3 bg-gray-100">
                          <Image
                            src={event.image}
                            alt={event.title}
                            fill
                            className="object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                          <div className="absolute bottom-0 left-0 p-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                              {event.club}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1 bg-white p-6">
                          <div className="flex flex-col h-full">
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <h3 className="text-xl font-semibold text-gray-900">{event.title}</h3>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  {event.registeredCount}/{event.capacity} spots
                                </span>
                              </div>
                              <div className="mt-2 flex items-center text-sm text-gray-500">
                                <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                {event.date} • {event.time}
                              </div>
                              <div className="mt-2 flex items-center text-sm text-gray-500">
                                <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {event.location}
                              </div>
                              <p className="mt-3 text-sm text-gray-600">{event.description}</p>
                              <div className="mt-3 flex flex-wrap gap-2">
                                {event.tags.map((tag, i) => (
                                  <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div className="mt-4 flex justify-end">
                              <motion.button
                                onClick={() => registerForEvent(event.id)}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                              >
                                {event.registered ? 'Registered' : 'Register Now'}
                              </motion.button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'calendar' && (
                <motion.div
                  key="calendar"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="text-center py-12"
                >
                  <svg className="mx-auto h-16 w-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">No events scheduled</h3>
                  <p className="mt-2 text-sm text-gray-500 mb-6">Once you register for events, they'll appear here.</p>
                  <motion.button
                    onClick={() => setActiveTab('events')}
                    whileHover={{ y: -2, boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)' }}
                    whileTap={{ scale: 0.98 }}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                  >
                    <svg className="-ml-1 mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Browse Events
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Premium Floating Notifications */}
        <motion.div
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 1.5 }}
          className="fixed top-6 right-6 bg-gradient-to-r from-emerald-500 to-sky-500 text-white px-6 py-3 rounded-2xl shadow-xl flex items-center space-x-3 z-50"
        >
          <motion.div 
            className="w-3 h-3 bg-white rounded-full"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <span className="text-sm font-bold">New event posted!</span>
          <motion.div
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            ✨
          </motion.div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, x: -100 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 2 }}
          className="fixed bottom-6 left-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-2xl shadow-xl flex items-center space-x-3 z-50"
        >
          <motion.div 
            className="w-3 h-3 bg-white rounded-full"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
          />
          <span className="text-sm font-bold">5 friends joined!</span>
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            🎉
          </motion.div>
        </motion.div>

        {/* Premium Floating Action Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="fixed bottom-6 right-6 z-50"
        >
          <motion.button
            whileHover={{ scale: 1.1, rotate: 10 }}
            whileTap={{ scale: 0.9 }}
            className="p-4 bg-gradient-to-r from-emerald-500 to-sky-500 text-white rounded-full shadow-xl hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </motion.button>
        </motion.div>
      </main>
    </div>
  )
}

export default PremiumStudentDashboard