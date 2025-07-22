'use client'

import { motion, AnimatePresence, useAnimation } from 'framer-motion'
import Image from 'next/image'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { FiCalendar, FiUsers, FiAward, FiBookmark, FiBell, FiSearch, FiHome, FiMessageSquare, FiSettings, FiLogOut } from 'react-icons/fi'
import { FaUserFriends, FaRegCalendarAlt, FaTrophy, FaRegBookmark } from 'react-icons/fa'
import { IoMdNotificationsOutline } from 'react-icons/io'
import { BsEmojiSmile, BsThreeDotsVertical } from 'react-icons/bs'
import { RiLiveLine } from 'react-icons/ri'
import { TbCertificate } from 'react-icons/tb'

interface User {
  id: string
  name: string
  email: string
  avatar: string
  joinedClubs: number
  upcomingEvents: number
  activeFriends: number
  achievements: number
  friends: Friend[]
  clubs: Club[]
  notifications: Notification[]
  certificates: Certificate[]
}

interface StudentDashboardProps {
  userType: string;
  logout: () => Promise<void>;
}


interface Friend {
  id: string
  name: string
  avatar: string
  lastActivity: string
  activityType: string
  activityTarget: string
}

interface Club {
  id: string
  name: string
  description: string
  members: number
  events: number
  logo: string
  subscribed: boolean
  tags: string[]
  color: string
  emoji: string
  isNew?: boolean
}

interface Event {
  id: string
  title: string
  club: string
  date: string
  time: string
  location: string
  description: string
  image: string
  registered: boolean
  capacity: number
  registeredCount: number
  tags: string[]
  color: string
  emoji: string
  isLive?: boolean
}

interface Notification {
  id: number
  type: string
  message: string
  time: string
  read: boolean
  link?: string
}

interface Certificate {
  id: string
  title: string
  issuedBy: string
  date: string
  image: string
  description: string
}

const PremiumStudentDashboard = ({userType, logout}: StudentDashboardProps) => {
  const router = useRouter()
  const controls = useAnimation()
  const notificationPanelRef = useRef<HTMLDivElement>(null)
  const profileMenuRef = useRef<HTMLDivElement>(null)
  
  // User data state
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // UI state
  const [activeTab, setActiveTab] = useState('discover')
  const [showNotificationPanel, setShowNotificationPanel] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState('popular')
  
  // Floating logo animation
  const [logoPosition, setLogoPosition] = useState({ x: 0, y: 0 })
  const [logoRotation, setLogoRotation] = useState(0)
  
  // Mock data for clubs (would normally come from API)
  const premiumClubs: Club[] = [
    {
      id: '1',
      name: 'Tech Society',
      description: 'For tech enthusiasts and innovators pushing boundaries with cutting-edge technology and hackathons',
      members: 245,
      events: 12,
      logo: '/tech-club.png',
      subscribed: false,
      tags: ['AI/ML', 'Web Dev', 'Blockchain', 'Hackathons'],
      color: 'from-emerald-400 to-emerald-600',
      emoji: '💻',
      isNew: true
    },
    {
      id: '2',
      name: 'Cultural Collective',
      description: 'Celebrating global diversity through performing arts, music, and cultural exchange programs',
      members: 180,
      events: 8,
      logo: '/cultural-club.png',
      subscribed: false,
      tags: ['Dance', 'Music', 'Theater', 'International'],
      color: 'from-sky-400 to-sky-600',
      emoji: '🎭'
    },
    {
      id: '3',
      name: 'Gourmet Society',
      description: 'For culinary artists, food science enthusiasts, and anyone who appreciates fine dining experiences',
      members: 120,
      events: 6,
      logo: '/food-club.png',
      subscribed: false,
      tags: ['Baking', 'Mixology', 'Sustainability', 'Fine Dining'],
      color: 'from-purple-400 to-purple-600',
      emoji: '🍕'
    },
    {
      id: '4',
      name: 'Athletic Union',
      description: 'Competitive sports teams, wellness programs, and outdoor adventure activities for all skill levels',
      members: 210,
      events: 15,
      logo: '/sports-club.png',
      subscribed: false,
      tags: ['Fitness', 'Esports', 'Outdoors', 'Competitive'],
      color: 'from-orange-400 to-orange-600',
      emoji: '⚽'
    },
    {
      id: '5',
      name: 'Literary Guild',
      description: 'For writers, poets, journalists, and storytelling innovators across all genres and mediums',
      members: 95,
      events: 5,
      logo: '/literary-club.png',
      subscribed: false,
      tags: ['Poetry', 'Fiction', 'Journalism', 'Publishing'],
      color: 'from-indigo-400 to-indigo-600',
      emoji: '📚'
    },
    {
      id: '6',
      name: 'Eco Warriors',
      description: 'Sustainability initiatives, green technology research, and environmental conservation projects',
      members: 150,
      events: 7,
      logo: '/environment-club.png',
      subscribed: false,
      tags: ['Climate', 'Renewables', 'Conservation', 'Activism'],
      color: 'from-green-400 to-green-600',
      emoji: '🌱'
    },
    {
      id: '7',
      name: 'Entrepreneurship Hub',
      description: 'For future founders, startup enthusiasts, and business innovators building the next big thing',
      members: 110,
      events: 9,
      logo: '/business-club.png',
      subscribed: false,
      tags: ['Startups', 'Venture Capital', 'Pitching', 'Networking'],
      color: 'from-red-400 to-red-600',
      emoji: '💼'
    },
    {
      id: '8',
      name: 'Film & Photography',
      description: 'Cinematographers, photographers, and visual storytellers creating compelling visual content',
      members: 85,
      events: 4,
      logo: '/film-club.png',
      subscribed: false,
      tags: ['Cinematography', 'Editing', 'Photography', 'Exhibitions'],
      color: 'from-pink-400 to-pink-600',
      emoji: '🎥'
    }
  ]

  // Mock data for events
  const premiumEvents: Event[] = [
    {
      id: '1',
      title: 'Hack the Future 2023',
      club: 'Tech Society',
      date: 'Tomorrow',
      time: '10:00 AM - 6:00 PM',
      location: 'CS Innovation Lab',
      description: '48-hour intensive hackathon with $10,000 in prizes. Build innovative solutions in AI, Web3, or IoT. Workshops, mentors, and networking opportunities throughout the event.',
      image: '/event-tech.png',
      registered: false,
      capacity: 100,
      registeredCount: 78,
      tags: ['Competition', 'Workshop', 'Networking', 'Tech'],
      color: 'from-emerald-400 to-emerald-600',
      emoji: '💻',
      isLive: true
    },
    {
      id: '2',
      title: 'Global Rhythms Night',
      club: 'Cultural Collective',
      date: 'This Weekend',
      time: '7:00 PM - Midnight',
      location: 'Grand Auditorium',
      description: 'An electrifying evening of international performances featuring dance troupes, musicians, and artists from around the world. Food stalls representing different cultures will be available.',
      image: '/event-dance.jpg',
      registered: false,
      capacity: 300,
      registeredCount: 245,
      tags: ['Performance', 'Showcase', 'Social', 'Cultural'],
      color: 'from-sky-400 to-sky-600',
      emoji: '🎭'
    },
    {
      id: '3',
      title: 'Epicurean Festival',
      club: 'Gourmet Society',
      date: 'Next Week',
      time: '12:00 PM - 4:00 PM',
      location: 'Central Quad',
      description: 'Taste gourmet creations from 30+ culinary artists. Cooking demonstrations, mixology classes, and a voting competition for best dish. Dietary restrictions accommodated.',
      image: '/event-food.jpg',
      registered: false,
      capacity: 200,
      registeredCount: 189,
      tags: ['Tasting', 'Competition', 'Social', 'Food'],
      color: 'from-purple-400 to-purple-600',
      emoji: '🍕'
    },
    {
      id: '4',
      title: 'Varsity Basketball Finals',
      club: 'Athletic Union',
      date: 'Friday',
      time: '6:30 PM - 9:00 PM',
      location: 'Main Gymnasium',
      description: 'Cheer on our university team as they face their rivals in the championship game. Halftime show featuring dance teams and special performances. Free t-shirts for the first 100 students.',
      image: '/event-sports.jpg',
      registered: false,
      capacity: 500,
      registeredCount: 423,
      tags: ['Sports', 'Competition', 'School Spirit'],
      color: 'from-orange-400 to-orange-600',
      emoji: '🏀'
    },
    {
      id: '5',
      title: 'Poetry Slam & Open Mic',
      club: 'Literary Guild',
      date: 'Thursday',
      time: '7:30 PM - 10:00 PM',
      location: 'Coffeehouse Lounge',
      description: 'An evening of powerful spoken word performances and open mic sessions. Featured guest poet from the national slam poetry circuit. Sign up to perform or just enjoy the show!',
      image: '/event-poetry.jpg',
      registered: false,
      capacity: 80,
      registeredCount: 62,
      tags: ['Performance', 'Arts', 'Literature', 'Social'],
      color: 'from-indigo-400 to-indigo-600',
      emoji: '📚'
    }
  ]

  // Mock data for certificates
  const certificates: Certificate[] = [
    {
      id: '1',
      title: 'Web Development Mastery',
      issuedBy: 'Tech Society',
      date: 'May 2023',
      image: '/cert-webdev.jpg',
      description: 'Completed 12-week intensive program covering modern web development technologies including React, Node.js, and GraphQL'
    },
    {
      id: '2',
      title: 'Public Speaking Excellence',
      issuedBy: 'Debate Club',
      date: 'March 2023',
      image: '/cert-publicspeaking.jpg',
      description: 'Demonstrated exceptional public speaking skills through semester-long workshops and competitions'
    },
    {
      id: '3',
      title: 'Sustainability Leadership',
      issuedBy: 'Eco Warriors',
      date: 'April 2023',
      image: '/cert-sustainability.jpg',
      description: 'Led campus sustainability initiative that reduced waste by 35% in student union building'
    },
    {
      id: '4',
      title: 'Creative Writing Workshop',
      issuedBy: 'Literary Guild',
      date: 'February 2023',
      image: '/cert-writing.jpg',
      description: 'Completed advanced fiction writing workshop with published novelists'
    },
    {
      id: '5',
      title: 'First Aid Certification',
      issuedBy: 'Health Services',
      date: 'January 2023',
      image: '/cert-firstaid.jpg',
      description: 'Certified in CPR and emergency first aid procedures'
    }
  ]

  // Mock data for friends activity
  const friendsActivity: Friend[] = [
    {
      id: '1',
      name: 'Alex Johnson',
      avatar: '/avatar-alex.jpg',
      lastActivity: '5 min ago',
      activityType: 'joined',
      activityTarget: 'Film & Photography Club'
    },
    {
      id: '2',
      name: 'Sam Taylor',
      avatar: '/avatar-sam.jpg',
      lastActivity: '15 min ago',
      activityType: 'registered',
      activityTarget: 'Hack the Future 2023'
    },
    {
      id: '3',
      name: 'Jordan Smith',
      avatar: '/avatar-jordan.jpg',
      lastActivity: '1 hour ago',
      activityType: 'earned',
      activityTarget: 'Public Speaking Excellence'
    },
    {
      id: '4',
      name: 'Morgan Lee',
      avatar: '/avatar-morgan.jpg',
      lastActivity: '2 hours ago',
      activityType: 'attended',
      activityTarget: 'Global Rhythms Night'
    },
    {
      id: '5',
      name: 'Casey Wong',
      avatar: '/avatar-casey.jpg',
      lastActivity: '3 hours ago',
      activityType: 'posted',
      activityTarget: 'in Tech Society'
    }
  ]

  // Mock notifications
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: 1, type: 'event', message: 'New event: Tech Hackathon 2023 registration is open', time: '2 min ago', read: false, link: '/events/1' },
    { id: 2, type: 'friend', message: '5 friends joined CampusConnect this week', time: '10 min ago', read: false, link: '/friends' },
    { id: 3, type: 'club', message: 'Drama Club posted new content you might like', time: '1 hour ago', read: true, link: '/clubs/3' },
    { id: 4, type: 'achievement', message: 'You earned a new certificate: Web Development Mastery', time: '3 hours ago', read: false, link: '/achievements' },
    { id: 5, type: 'reminder', message: 'Your event registration for Poetry Slam closes today', time: '5 hours ago', read: true, link: '/events/5' },
    { id: 6, type: 'system', message: 'Complete your profile to get better recommendations', time: '1 day ago', read: true, link: '/profile' }
  ])

  // Mock user data
  useEffect(() => {
    // Simulate API fetch
    const fetchUserData = async () => {
      try {
        // In a real app, you would fetch this from your API
        const mockUser: User = {
          id: '12345',
          name: 'John Student',
          email: 'john.student@university.edu',
          avatar: '/avatar-john.jpg',
          joinedClubs: 3,
          upcomingEvents: 2,
          activeFriends: 12,
          achievements: 5,
          friends: friendsActivity,
          clubs: premiumClubs.filter((_, index) => index < 3).map(club => ({ ...club, subscribed: true })),
          notifications: notifications,
          certificates: certificates
        }
        
        setUser(mockUser)
        setLoading(false)
        
        // Animate elements in sequence
        await controls.start({
          opacity: 1,
          y: 0,
          transition: { duration: 0.5 }
        })
      } catch (err) {
        setError('Failed to load user data')
        setLoading(false)
      }
    }
    
    fetchUserData()
    
    // Animate logo position
    const interval = setInterval(() => {
      setLogoPosition({
        x: Math.random() * 20 - 10,
        y: Math.random() * 20 - 10
      })
      setLogoRotation(Math.random() * 10 - 5)
    }, 3000)

    return () => clearInterval(interval)
  }, [controls])

  // Close notification panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationPanelRef.current && !notificationPanelRef.current.contains(event.target as Node)) {
        setShowNotificationPanel(false)
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  // Mark notification as read
  const markAsRead = (id: number) => {
    setNotifications(notifications.map(n => 
      n.id === id ? {...n, read: true} : n
    ))
  }

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })))
  }

  // Toggle subscription to a club
  const toggleSubscription = (clubId: string) => {
    console.log(`Toggled subscription for club ${clubId}`)
    // In a real app, you would call an API here
  }

  // Register for an event
  const registerForEvent = (eventId: string) => {
    console.log(`Registered for event ${eventId}`)
    // In a real app, you would call an API here
  }

  // Filter clubs based on search and filters
  const filteredClubs = premiumClubs.filter(club => {
    // Search filter
    const matchesSearch = club.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         club.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         club.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    
    // Category filter
    const matchesCategory = selectedCategory === 'all' || 
                          (selectedCategory === 'tech' && club.tags.some(tag => ['AI/ML', 'Web Dev', 'Blockchain', 'Tech'].includes(tag))) ||
                          (selectedCategory === 'arts' && club.tags.some(tag => ['Dance', 'Music', 'Theater', 'Arts'].includes(tag))) ||
                          (selectedCategory === 'sports' && club.tags.some(tag => ['Fitness', 'Esports', 'Sports'].includes(tag))) ||
                          (selectedCategory === 'academic' && club.tags.some(tag => ['Journalism', 'Publishing', 'Literature'].includes(tag)))
    
    return matchesSearch && matchesCategory
  })

  // Sort clubs
  const sortedClubs = [...filteredClubs].sort((a, b) => {
    if (sortBy === 'popular') return b.members - a.members
    if (sortBy === 'newest') return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0)
    if (sortBy === 'active') return b.events - a.events
    return 0
  })

  // Loading state
  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="h-16 w-16 rounded-full border-4 border-emerald-500 border-t-transparent"
        />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-3 bg-emerald-600 text-white font-semibold rounded-lg shadow-md hover:bg-emerald-700 transition-all"
            onClick={() => window.location.reload()}
          >
            Try Again
          </motion.button>
        </div>
      </div>
    )
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

            {/* Mobile menu button */}
            <div className="md:hidden">
              <motion.button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="text-gray-600 hover:text-gray-900 focus:outline-none"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </motion.button>
            </div>

            {/* Premium Navigation - Desktop */}
            <nav className="hidden md:flex space-x-1">
              {[
                { id: 'discover', label: 'Discover', icon: <FiSearch className="mr-1" /> },
                { id: 'myClubs', label: 'My Clubs', icon: <FaRegBookmark className="mr-1" /> },
                { id: 'events', label: 'Events', icon: <FaRegCalendarAlt className="mr-1" /> },
                { id: 'calendar', label: 'Calendar', icon: <FiCalendar className="mr-1" /> }
              ].map((tab) => (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center ${
                    activeTab === tab.id 
                      ? 'bg-emerald-100 text-emerald-700 shadow-inner' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </motion.button>
              ))}
            </nav>

            {/* Premium Right side icons */}
            <div className="hidden md:flex items-center space-x-4">
              {/* Premium Notification bell */}
              <div className="relative" ref={notificationPanelRef}>
                <motion.button 
                  onClick={() => setShowNotificationPanel(!showNotificationPanel)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-1 rounded-full text-gray-500 hover:text-gray-700 focus:outline-none relative"
                >
                  <IoMdNotificationsOutline className="h-6 w-6" />
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
                          <button 
                            className="text-xs text-emerald-600 hover:text-emerald-800"
                            onClick={markAllAsRead}
                          >
                            Mark all as read
                          </button>
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                          {notifications.map(notification => (
                            <motion.div 
                              key={notification.id} 
                              initial={{ opacity: 0, x: 10 }}
                              animate={{ opacity: 1, x: 0 }}
                              className={`px-4 py-3 border-b border-gray-100 cursor-pointer ${
                                !notification.read ? 'bg-emerald-50/50' : 'bg-white'
                              }`}
                              onClick={() => {
                                markAsRead(notification.id)
                                if (notification.link) {
                                  router.push(notification.link)
                                  setShowNotificationPanel(false)
                                }
                              }}
                              whileHover={{ backgroundColor: 'rgba(209, 250, 229, 0.5)' }}
                            >
                              <div className="flex items-start">
                                <div className="flex-shrink-0 pt-0.5">
                                  {notification.type === 'event' && (
                                    <div className="h-8 w-8 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 flex items-center justify-center">
                                      <FiCalendar className="h-4 w-4 text-white" />
                                    </div>
                                  )}
                                  {notification.type === 'friend' && (
                                    <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center">
                                      <FiUsers className="h-4 w-4 text-white" />
                                    </div>
                                  )}
                                  {notification.type === 'club' && (
                                    <div className="h-8 w-8 rounded-full bg-gradient-to-r from-purple-400 to-purple-600 flex items-center justify-center">
                                      <FaRegBookmark className="h-4 w-4 text-white" />
                                    </div>
                                  )}
                                  {notification.type === 'achievement' && (
                                    <div className="h-8 w-8 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 flex items-center justify-center">
                                      <TbCertificate className="h-4 w-4 text-white" />
                                    </div>
                                  )}
                                  {notification.type === 'reminder' && (
                                    <div className="h-8 w-8 rounded-full bg-gradient-to-r from-red-400 to-red-600 flex items-center justify-center">
                                      <FiBell className="h-4 w-4 text-white" />
                                    </div>
                                  )}
                                  {notification.type === 'system' && (
                                    <div className="h-8 w-8 rounded-full bg-gradient-to-r from-gray-400 to-gray-600 flex items-center justify-center">
                                      <FiSettings className="h-4 w-4 text-white" />
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
                          {notifications.length === 0 && (
                            <div className="px-4 py-6 text-center">
                              <FiBell className="mx-auto h-8 w-8 text-gray-400" />
                              <p className="mt-2 text-sm text-gray-500">No notifications yet</p>
                            </div>
                          )}
                        </div>
                        <div 
                          className="px-4 py-2 text-center text-sm font-medium text-emerald-600 bg-gray-50 hover:bg-gray-100 border-t border-gray-200 cursor-pointer"
                          onClick={() => {
                            router.push('/notifications')
                            setShowNotificationPanel(false)
                          }}
                        >
                          View all notifications
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Premium Profile dropdown */}
              <div className="relative" ref={profileMenuRef}>
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
                    {user.name.split(' ').map(n => n[0]).join('')}
                  </motion.div>
                  <span className="hidden md:inline-block text-sm font-medium text-gray-700">{user.name}</span>
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
                        <a 
                          href="/profile" 
                          className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                          onClick={() => setShowProfileMenu(false)}
                        >
                          <FiHome className="mr-2" />
                          Your Profile
                        </a>
                        <a 
                          href="/settings" 
                          className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                          onClick={() => setShowProfileMenu(false)}
                        >
                          <FiSettings className="mr-2" />
                          Settings
                        </a>
                        <a 
                          href="/help" 
                          className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                          onClick={() => setShowProfileMenu(false)}
                        >
                          <FiMessageSquare className="mr-2" />
                          Help Center
                        </a>
                        <div className="border-t border-gray-200"></div>
                        <a 
                          className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                          onClick={(e) => {
                            e.preventDefault()
                            setShowProfileMenu(false)
                            logout() // Call your logout function here
                            // Handle logout
                          }}
                        >
                          <FiLogOut className="mr-2" />
                          Logout ({userType})
                        </a>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {showMobileMenu && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden bg-white border-t border-gray-200"
            >
              <div className="px-2 pt-2 pb-3 space-y-1">
                {[
                  { id: 'discover', label: 'Discover', icon: <FiSearch className="mr-2" /> },
                  { id: 'myClubs', label: 'My Clubs', icon: <FaRegBookmark className="mr-2" /> },
                  { id: 'events', label: 'Events', icon: <FaRegCalendarAlt className="mr-2" /> },
                  { id: 'calendar', label: 'Calendar', icon: <FiCalendar className="mr-2" /> }
                ].map((tab) => (
                  <motion.button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id)
                      setShowMobileMenu(false)
                    }}
                    whileTap={{ scale: 0.95 }}
                    className={`w-full flex items-center px-3 py-2 rounded-md text-base font-medium ${
                      activeTab === tab.id 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </motion.button>
                ))}
              </div>
              <div className="pt-4 pb-3 border-t border-gray-200">
                <div className="flex items-center px-5">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-r from-emerald-400 to-sky-500 flex items-center justify-center text-white font-medium">
                    {user.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium text-gray-800">{user.name}</div>
                    <div className="text-sm font-medium text-gray-500">{user.email}</div>
                  </div>
                </div>
                <div className="mt-3 px-2 space-y-1">
                  <a href="/profile" className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100">Your Profile</a>
                  <a href="/settings" className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100">Settings</a>
                  <a href="/api/auth/signout" className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100">Logout</a>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Premium Main Content */}
      <main className="pt-20 pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
          
          <div className="p-6 sm:p-8 relative z-10">
            <div className="flex flex-col md:flex-row items-center">
              <div className="flex-1">
                <motion.h2 
                  className="text-3xl md:text-4xl font-bold text-white mb-3"
                  animate={{ x: [0, -3, 3, 0] }}
                  transition={{ duration: 5, repeat: Infinity }}
                >
                  Welcome back, {user.name.split(' ')[0]}!
                </motion.h2>
                <p className="text-emerald-100 text-lg max-w-2xl mb-6">
                  Discover new clubs, register for events, and stay updated with everything happening on campus.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <motion.button
                    whileHover={{ y: -2, boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)' }}
                    whileTap={{ scale: 0.98 }}
                    className="px-6 py-3 bg-white text-emerald-600 font-semibold rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center"
                  >
                    <FiSearch className="mr-2" />
                    Explore Clubs
                  </motion.button>
                  <motion.button
                    whileHover={{ y: -2, boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)' }}
                    whileTap={{ scale: 0.98 }}
                    className="px-6 py-3 bg-white/10 text-white font-semibold rounded-lg shadow-md hover:bg-white/20 transition-all flex items-center justify-center"
                  >
                    <FaRegCalendarAlt className="mr-2" />
                    View Calendar
                  </motion.button>
                </div>
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
                    priority
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
              value: user.joinedClubs, 
              icon: <FaRegBookmark className="h-5 w-5" />,
              color: 'bg-emerald-100 text-emerald-600',
              trend: 'up',
              change: '+2 this month'
            },
            { 
              title: 'Upcoming Events', 
              value: user.upcomingEvents, 
              icon: <FaRegCalendarAlt className="h-5 w-5" />,
              color: 'bg-blue-100 text-blue-600',
              trend: 'up',
              change: '3 in next week'
            },
            { 
              title: 'Friends Active', 
              value: user.activeFriends, 
              icon: <FaUserFriends className="h-5 w-5" />,
              color: 'bg-purple-100 text-purple-600',
              trend: 'up',
              change: '5 online now'
            },
            { 
              title: 'Achievements', 
              value: user.achievements, 
              icon: <FaTrophy className="h-5 w-5" />,
              color: 'bg-amber-100 text-amber-600',
              trend: 'up',
              change: 'Earned 2 new'
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
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  <div className="p-2 rounded-lg bg-white/80 backdrop-blur-sm mr-4 shadow-sm">
                    {stat.icon}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                </div>
                {stat.trend && (
                  <div className="text-xs font-medium px-2 py-1 rounded-full bg-white/80">
                    {stat.change}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Main Dashboard Layout */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Sidebar - Friend Activity */}
          <div className="lg:w-1/4">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden border border-white/20"
            >
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-800 flex items-center">
                  <FaUserFriends className="mr-2 text-emerald-500" />
                  Friend Activity
                </h3>
              </div>
              <div className="divide-y divide-gray-100">
                {user.friends.slice(0, 5).map((friend, index) => (
                  <motion.div
                    key={friend.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="px-6 py-4 hover:bg-gray-50 cursor-pointer"
                  >
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-emerald-400 to-sky-500 flex items-center justify-center text-white font-medium">
                          {friend.name.split(' ').map(n => n[0]).join('')}
                        </div>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">{friend.name}</p>
                        <p className="text-xs text-gray-500">
                          {friend.activityType === 'joined' && 'Joined '}
                          {friend.activityType === 'registered' && 'Registered for '}
                          {friend.activityType === 'earned' && 'Earned '}
                          {friend.activityType === 'attended' && 'Attended '}
                          {friend.activityType === 'posted' && 'Posted in '}
                          <span className="font-medium text-emerald-600">{friend.activityTarget}</span>
                        </p>
                        <p className="text-xs text-gray-400 mt-1">{friend.lastActivity}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
                {user.friends.length === 0 && (
                  <div className="px-6 py-8 text-center">
                    <FiUsers className="mx-auto h-8 w-8 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">No recent friend activity</p>
                  </div>
                )}
                {user.friends.length > 5 && (
                  <div className="px-6 py-3 text-center bg-gray-50">
                    <a href="/friends" className="text-sm font-medium text-emerald-600 hover:text-emerald-800">
                      View all activity
                    </a>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Quick Links */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-6 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden border border-white/20"
            >
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-800">Quick Links</h3>
              </div>
              <div className="grid grid-cols-2 gap-1 p-2">
                {[
                  { icon: <FaRegBookmark className="h-5 w-5" />, label: 'My Clubs', link: '/clubs' },
                  { icon: <FaRegCalendarAlt className="h-5 w-5" />, label: 'My Events', link: '/events' },
                  { icon: <TbCertificate className="h-5 w-5" />, label: 'Achievements', link: '/achievements' },
                  { icon: <FaUserFriends className="h-5 w-5" />, label: 'Friends', link: '/friends' },
                  { icon: <FiMessageSquare className="h-5 w-5" />, label: 'Messages', link: '/messages' },
                  { icon: <FiSettings className="h-5 w-5" />, label: 'Settings', link: '/settings' }
                ].map((link, index) => (
                  <motion.a
                    key={index}
                    href={link.link}
                    whileHover={{ y: -3 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-4 flex flex-col items-center justify-center text-center hover:bg-gray-50 rounded-lg transition-all"
                  >
                    <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2">
                      {link.icon}
                    </div>
                    <span className="text-xs font-medium text-gray-700">{link.label}</span>
                  </motion.a>
                ))}
              </div>
            </motion.div>

            {/* Achievements Carousel */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-6 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden border border-white/20"
            >
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-800 flex items-center">
                  <TbCertificate className="mr-2 text-amber-500" />
                  Your Achievements
                </h3>
              </div>
              <div className="p-4">
                {user.certificates.length > 0 ? (
                  <div className="relative">
                    <div className="overflow-x-auto pb-4">
                      <div className="flex space-x-4">
                        {user.certificates.map((cert, index) => (
                          <motion.div
                            key={cert.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.1 * index }}
                            whileHover={{ y: -5 }}
                            className="flex-shrink-0 w-48 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl shadow-md overflow-hidden border border-amber-200"
                          >
                            <div className="h-32 bg-gradient-to-r from-amber-400 to-amber-500 flex items-center justify-center">
                              <TbCertificate className="h-12 w-12 text-white" />
                            </div>
                            <div className="p-4">
                              <h4 className="text-sm font-bold text-gray-800 truncate">{cert.title}</h4>
                              <p className="text-xs text-gray-600 mt-1">Issued by {cert.issuedBy}</p>
                              <p className="text-xs text-amber-600 font-medium mt-2">{cert.date}</p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                    {user.certificates.length > 1 && (
                      <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                        <button className="h-8 w-8 rounded-full bg-white shadow-md flex items-center justify-center text-amber-600 hover:bg-amber-50">
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-6 text-center">
                    <TbCertificate className="mx-auto h-8 w-8 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">No achievements yet</p>
                    <motion.button
                      onClick={() => setActiveTab('events')}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className="mt-4 px-4 py-2 bg-emerald-600 text-white text-xs font-medium rounded-lg shadow-sm"
                    >
                      Explore Events
                    </motion.button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Main Content Area */}
          <div className="lg:w-3/4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-white/20"
            >
              {/* Premium Dashboard Tabs */}
              <div className="border-b border-gray-200">
                <nav className="flex -mb-px">
                  {[
                    { id: 'discover', label: 'Discover Clubs', icon: <FiSearch className="mr-2" /> },
                    { id: 'myClubs', label: 'My Clubs', icon: <FaRegBookmark className="mr-2" /> },
                    { id: 'events', label: 'Upcoming Events', icon: <FaRegCalendarAlt className="mr-2" /> },
                    { id: 'calendar', label: 'Calendar', icon: <FiCalendar className="mr-2" /> }
                  ].map((tab) => (
                    <motion.button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      className={`whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm transition-all flex items-center ${
                        activeTab === tab.id
                          ? 'border-emerald-500 text-emerald-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {tab.icon}
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
                              <FiSearch className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                              type="text"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl leading-5 bg-white/50 backdrop-blur-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm shadow-sm"
                              placeholder="Search clubs by name, interest or category..."
                            />
                          </div>
                          <div className="flex space-x-3">
                            <select
                              value={selectedCategory}
                              onChange={(e) => setSelectedCategory(e.target.value)}
                              className="block w-full pl-3 pr-10 py-3 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-xl shadow-sm"
                            >
                              <option value="all">All Categories</option>
                              <option value="tech">Technology</option>
                              <option value="arts">Arts & Culture</option>
                              <option value="sports">Sports & Wellness</option>
                              <option value="academic">Academic</option>
                            </select>
                            <select
                              value={sortBy}
                              onChange={(e) => setSortBy(e.target.value)}
                              className="block w-full pl-3 pr-10 py-3 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-xl shadow-sm"
                            >
                              <option value="popular">Most Popular</option>
                              <option value="newest">Newest</option>
                              <option value="active">Most Active</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Premium Clubs Grid */}
                      {sortedClubs.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {sortedClubs.map((club, index) => (
                            <motion.div
                              key={club.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3, delay: index * 0.05 }}
                              whileHover={{ y: -8, scale: 1.02 }}
                              className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 relative overflow-hidden"
                            >
                              {club.isNew && (
                                <div className="absolute top-4 right-4 bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                  NEW
                                </div>
                              )}
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
                      ) : (
                        <div className="py-12 text-center">
                          <FiSearch className="mx-auto h-12 w-12 text-gray-400" />
                          <h3 className="mt-4 text-lg font-medium text-gray-900">No clubs found</h3>
                          <p className="mt-2 text-sm text-gray-500">Try adjusting your search or filters</p>
                          <motion.button
                            onClick={() => {
                              setSearchQuery('')
                              setSelectedCategory('all')
                            }}
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            className="mt-4 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg shadow-sm"
                          >
                            Clear filters
                          </motion.button>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {activeTab === 'myClubs' && (
                    <motion.div
                      key="myClubs"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3 }}
                    >
                      {user.clubs.length > 0 ? (
                        <>
                          <div className="mb-8">
                            <h3 className="text-2xl font-bold text-gray-800 mb-2">Your Clubs</h3>
                            <p className="text-gray-600">Manage your club memberships and activities</p>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {user.clubs.map((club, index) => (
                              <motion.div
                                key={club.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.05 }}
                                whileHover={{ y: -5 }}
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
                                    <div className="flex space-x-2">
                                      <motion.button 
                                        onClick={() => router.push(`/clubs/${club.id}`)}
                                        className="text-sm bg-gray-100 text-gray-800 px-3 py-1.5 rounded-full font-medium shadow-sm hover:bg-gray-200 transition-all duration-300"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                      >
                                        View
                                      </motion.button>
                                      <motion.button 
                                        onClick={() => toggleSubscription(club.id)}
                                        className="text-sm bg-gradient-to-r from-emerald-500 to-sky-500 text-white px-3 py-1.5 rounded-full font-medium shadow-sm hover:shadow-md transition-all duration-300"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                      >
                                        Manage
                                      </motion.button>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-12">
                          <FaRegBookmark className="mx-auto h-16 w-16 text-gray-300" />
                          <h3 className="mt-4 text-lg font-medium text-gray-900">No clubs yet</h3>
                          <p className="mt-2 text-sm text-gray-500 mb-6">You haven't joined any clubs. Discover clubs to get started!</p>
                          <motion.button
                            onClick={() => setActiveTab('discover')}
                            whileHover={{ y: -2, boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)' }}
                            whileTap={{ scale: 0.98 }}
                            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                          >
                            <FiSearch className="-ml-1 mr-3 h-5 w-5" />
                            Discover Clubs
                          </motion.button>
                        </div>
                      )}
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
                              {event.isLive && (
                                <div className="absolute top-4 right-4 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center">
                                  <RiLiveLine className="mr-1" />
                                  LIVE
                                </div>
                              )}
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
                                    <FiCalendar className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
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
                                    {event.registered ? (
                                      <>
                                        <FiCalendar className="mr-2" />
                                        Registered
                                      </>
                                    ) : (
                                      <>
                                        <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                        Register Now
                                      </>
                                    )}
                                  </motion.button>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                        {premiumEvents.length === 0 && (
                          <div className="py-12 text-center">
                            <FaRegCalendarAlt className="mx-auto h-16 w-16 text-gray-300" />
                            <h3 className="mt-4 text-lg font-medium text-gray-900">No upcoming events</h3>
                            <p className="mt-2 text-sm text-gray-500 mb-6">Check back later or explore clubs to find events</p>
                            <motion.button
                              onClick={() => setActiveTab('discover')}
                              whileHover={{ y: -2, boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)' }}
                              whileTap={{ scale: 0.98 }}
                              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                            >
                              <FiSearch className="-ml-1 mr-3 h-5 w-5" />
                              Explore Clubs
                            </motion.button>
                          </div>
                        )}
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
                    >
                      <div className="text-center py-12">
                        <FiCalendar className="mx-auto h-16 w-16 text-gray-300" />
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
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      {/* Premium Floating Notifications */}
      <motion.div
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 1.5 }}
        className="fixed top-6 right-6 bg-gradient-to-r from-emerald-500 to-sky-500 text-white px-6 py-3 rounded-2xl shadow-xl flex items-center space-x-3 z-50 cursor-pointer"
        onClick={() => {
          setActiveTab('events')
          setShowNotificationPanel(false)
        }}
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
        className="fixed bottom-6 left-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-2xl shadow-xl flex items-center space-x-3 z-50 cursor-pointer"
        onClick={() => {
          setActiveTab('discover')
          setShowNotificationPanel(false)
        }}
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
          onClick={() => {
            // Action for FAB - could open a create modal
            console.log('FAB clicked')
          }}
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </motion.button>
      </motion.div>
    </div>
  )
}

export default PremiumStudentDashboard