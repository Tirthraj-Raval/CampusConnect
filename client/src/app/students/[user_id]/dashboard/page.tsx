'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  User, 
  Calendar, 
  Award, 
  Search, 
  Settings, 
  Activity,
  Users,
  Star,
  MessageSquare,
  TrendingUp,
  Clock,
  MapPin,
  Bookmark,
  Home,
  BarChart3,
  PieChart as PieChartIcon,
  Target,
  Zap,
  Heart,
  CheckCircle,
  AlertCircle,
  XCircle,
  Plus,
  Minus,
  Eye,
  Edit,
  Trash2,
  Filter,
  Download,
  Share2,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  Menu,
  X,
  ArrowLeft,
  Info
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Types
type EventCapacity = {
  eventId: number;
  title: string;
  maxCapacity: number;
  currentCount: number;
};

type Notification = {
  id: number;
  event_id: number;
  club_id: string;
  event_title: string;
  message: string;
  notify_at: string;
  sent: boolean;
  read_at: string | null;
};

type ClubSearchResult = {
  id: string;
  name: string;
  logo_url: string;
  description: string;
};

type StudentSearchResult = {
  id: string;
  name: string;
  email: string;
};

type EventSearchResult = {
  id: string;
  title: string;
  description: string;
  event_date: string;
  location: string;
  club_name: string;
};

type Club = {
  id: string;
  name: string;
  description: string;
  logo_url: string;
  about_html?: string;
};

type Event = {
  id: string;
  title: string;
  description: string;
  date: string;
  status: string;
  location?: string;
  event_date?: string;
  club_name?: string;
  capacity?: number;
  custom_html?: string;
};

type EventDetails = Event & {
  location: string;
  created_by: string;
  capacity: number;
  custom_html: string;
};

export default function StudentDashboard() {
  // State Management
  const [student, setStudent] = useState<any>(null);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [rsvps, setRsvps] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<any | null>(null);
  const [updateName, setUpdateName] = useState('');
  const [updatePic, setUpdatePic] = useState('');
  const [newClubId, setNewClubId] = useState('');
  const [newEventId, setNewEventId] = useState('');
  const [feedbackEventId, setFeedbackEventId] = useState('');
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [getFeedbackEventId, setGetFeedbackEventId] = useState('');
  const [allEvents, setAllEvents] = useState<any[]>([]);
  const [subscribedEvents, setSubscribedEvents] = useState<any[]>([]);
  const [events, setEvents] = useState<EventCapacity[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [activityStatus, setActivityStatus] = useState<'Active' | 'Inactive'>('Inactive');
  const [searchQuery, setSearchQuery] = useState('');
  const [eventSearchQuery, setEventSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{
    clubs: ClubSearchResult[];
    students: StudentSearchResult[];
    events: EventSearchResult[];
  }>({
    clubs: [],
    students: [],
    events: []
  });

  const [clubs, setClubs] = useState<Club[]>([]);
  const [selectedClubId, setSelectedClubId] = useState<string | null>(null);
  const [clubEvents, setClubEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventDetails | null>(null);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(false);

  // UI State
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [floatingNotifications, setFloatingNotifications] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [eventsPerPage] = useState(6);
  const [eventSearchResults, setEventSearchResults] = useState<any[]>([]);
  
  // View states
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [showClubDetails, setShowClubDetails] = useState(false);

  // Added by me
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 100
      }
    }
  };

  const cardVariants = {
    hover: {
      y: -8,
      scale: 1.02,
      transition: {
        type: "spring" as const,
        stiffness: 300
      }
    }
  };

  // Sidebar menu items
  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, color: 'from-emerald-500 to-sky-500' },
    { id: 'profile', label: 'Profile', icon: User, color: 'from-purple-500 to-pink-500' },
    { id: 'events', label: 'Events', icon: Calendar, color: 'from-orange-500 to-red-500' },
    { id: 'clubs', label: 'Clubs', icon: Users, color: 'from-blue-500 to-indigo-500' },
    { id: 'rsvps', label: 'My RSVPs', icon: Bookmark, color: 'from-green-500 to-emerald-500' },
    { id: 'certificates', label: 'Certificates', icon: Award, color: 'from-yellow-500 to-orange-500' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, color: 'from-teal-500 to-cyan-500' },
    { id: 'notifications', label: 'Notifications', icon: Bell, color: 'from-rose-500 to-pink-500' },
    { id: 'search', label: 'Search', icon: Search, color: 'from-violet-500 to-purple-500' }
  ];

  // Initialize WebSocket and fetch initial data
  useEffect(() => {
    fetchStudent();
    fetchSubscriptions();
    fetchRsvps();
    fetchCertificates();
    fetchAllEvents();
    fetchSubscribedEvents();
    fetchNotifications();
    fetchActivityStatus();
    fetchClubs();
    
    // Show initial floating notifications after data loads
    setTimeout(() => {
      showInitialFloatingNotifications();
    }, 2000);
  }, []);

  // Added by me
  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      const res = await fetch('http://localhost:5000/auth/logout', {
        method: 'GET',
        credentials: 'include',
      });

      if (res.ok) {
        window.location.href = '/student-login'; // redirect to login page after logout
      } else {
        alert('Logout failed');
      }
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Show meaningful floating notifications based on data
  const showInitialFloatingNotifications = () => {
    const newNotifications = [];
    
    // Show unread notifications count
    const unreadCount = notifications.filter(n => !n.read_at).length;
    if (unreadCount > 0) {
      newNotifications.push({
        id: 'initial-notifications',
        message: `${unreadCount} new notification${unreadCount > 1 ? 's' : ''}!`,
        type: 'info',
        emoji: '🔔',
        timestamp: new Date().toISOString()
      });
    }

    // Show upcoming events count  
    const upcomingEvents = rsvps.filter(rsvp => new Date(rsvp.event_date) > new Date()).length;
    if (upcomingEvents > 0) {
      newNotifications.push({
        id: 'initial-events',
        message: `${upcomingEvents} upcoming event${upcomingEvents > 1 ? 's' : ''}!`,
        type: 'success',
        emoji: '🎯',
        timestamp: new Date().toISOString()
      });
    }

    // Show recently joined clubs
    if (subscriptions.length > 0) {
      newNotifications.push({
        id: 'initial-clubs',
        message: `Connected to ${subscriptions.length} club${subscriptions.length > 1 ? 's' : ''}!`,
        type: 'success',
        emoji: '🎉',
        timestamp: new Date().toISOString()
      });
    }

    // Show certificates earned
    if (certificates.length > 0) {
      newNotifications.push({
        id: 'initial-certificates',
        message: `${certificates.length} certificate${certificates.length > 1 ? 's' : ''} earned!`,
        type: 'success',
        emoji: '🏆',
        timestamp: new Date().toISOString()
      });
    }

    setFloatingNotifications(newNotifications);

    // Remove them after 5 seconds each
    newNotifications.forEach((notif, index) => {
      setTimeout(() => {
        setFloatingNotifications(prev => prev.filter(n => n.id !== notif.id));
      }, 5000 + (index * 1000));
    });
  };

  // Socket initialization
  useEffect(() => {
    if (!socketRef.current) {
      const socket = io('http://localhost:5000', {
        transports: ['websocket'],
        withCredentials: true,
      });
      socketRef.current = socket;
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  // Socket event handlers
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    let joinedRooms: string[] = [];

    const fetchAndSubscribe = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/student/event-capacity', {
          credentials: 'include',
        });
        const data = await res.json();
        setEvents(data);

        data.forEach((event: EventCapacity) => {
          const room = `event_${event.eventId}`;
          socket.emit('join_event_room', room);
          joinedRooms.push(room);
        });
      } catch (err) {
        console.error('Failed to fetch event capacities:', err);
      }
    };

    fetchAndSubscribe();

    const rsvpHandler = (data: { eventId: number; currentCount: number }) => {
      console.log('📡 RSVP Update Received:', data);
      setEvents((prev) =>
        prev.map((ev) =>
          ev.eventId === data.eventId
            ? { ...ev, currentCount: data.currentCount }
            : ev
        )
      );
    };

    const notificationHandler = (notification: any) => {
      console.log('🔔 New Notification received:', notification);
      setNotifications(prev => [notification, ...prev]);
      setFloatingNotifications(prev => [...prev, {
        ...notification,
        id: `notif-${Date.now()}`,
        type: 'notification',
        emoji: '🔔',
        timestamp: new Date().toISOString()
      }]);
      
      // Remove floating notification after 5 seconds
      setTimeout(() => {
        setFloatingNotifications(prev => prev.filter(n => n.id !== `notif-${notification.id}`));
      }, 5000);
    };

    socket.on('rsvp_update', rsvpHandler);
    socket.on('new_notification', notificationHandler);

    return () => {
      socket.off('rsvp_update', rsvpHandler);
      socket.off('new_notification', notificationHandler);
      joinedRooms.forEach((room) => {
        socket.emit('leave_event_room', room);
      });
    };
  }, []);

  // Search functionality
  const fetchSearchResults = async (query: string) => {
    if (!query.trim()) {
      setSearchResults({ clubs: [], students: [], events: [] });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/student/search?query=${encodeURIComponent(query.trim())}`, {
        credentials: 'include',
      });
      const data = await res.json();
      setSearchResults(data);
    } catch (err) {
      console.error('Search error:', err);
      setSearchResults({ clubs: [], students: [], events: [] });
    }
    setLoading(false);
  };

  const fetchEventSearchResults = async (query: string) => {
    if (!query.trim()) {
      setEventSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/club/events/search?query=${encodeURIComponent(query.trim())}`, {
        credentials: 'include',
      });
      const data = await res.json();
      setEventSearchResults(data);
    } catch (err) {
      console.error('Event search error:', err);
      setEventSearchResults([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchSearchResults(searchQuery);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchEventSearchResults(eventSearchQuery);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [eventSearchQuery]);

  // API Functions
  const fetchStudent = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/student/me', { credentials: 'include' });
      const data = await res.json();
      setStudent(data);
      setUpdateName(data.name || '');
      setUpdatePic(data.profile_pic || '');
    } catch (err) {
      console.error('Failed to fetch student:', err);
    }
  };

  const updateStudent = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/student/me', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: updateName, profile_pic: updatePic }),
      });
      const data = await res.json();
      setStudent(data);
      showSuccessToast('Profile updated successfully!');
    } catch (err) {
      console.error('Failed to update student:', err);
      showErrorToast('Failed to update profile');
    }
  };

  const deleteStudent = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }
    
    try {
      const res = await fetch('http://localhost:5000/api/student/me', {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      showSuccessToast(data.message);
    } catch (err) {
      console.error('Failed to delete student:', err);
      showErrorToast('Failed to delete account');
    }
  };

  const fetchSubscriptions = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/student/subscriptions', { credentials: 'include' });
      const data = await res.json();
      setSubscriptions(data);
    } catch (err) {
      console.error('Failed to fetch subscriptions:', err);
    }
  };

  const subscribeClub = async (clubId: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/student/subscriptions/${clubId}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ club_id: clubId }),
      });
      const data = await res.json();
      if (res.ok) {
        showSuccessToast(data.message);
        fetchSubscriptions();
      } else {
        showErrorToast(data.error || 'Failed to subscribe');
      }
    } catch (err) {
      console.error('Failed to subscribe to club:', err);
      showErrorToast('Failed to subscribe to club');
    }
  };

  const unsubscribeClub = async (clubId: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/student/subscriptions/${clubId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok) {
        showSuccessToast(data.message);
        fetchSubscriptions();
      } else {
        showErrorToast(data.error || 'Failed to unsubscribe');
      }
    } catch (err) {
      console.error('Failed to unsubscribe from club:', err);
      showErrorToast('Failed to unsubscribe from club');
    }
  };

  const fetchRsvps = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/student/rsvps', { credentials: 'include' });
      const data = await res.json();
      setRsvps(data);
    } catch (err) {
      console.error('Failed to fetch RSVPs:', err);
    }
  };

  const rsvpEvent = async (eventId: string) => {
    try {
      const res = await fetch('http://localhost:5000/api/student/rsvps', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: Number(eventId) }),
      });

      const data = await res.json();

      if (!res.ok) {
        showErrorToast(data.error || 'RSVP failed');
      } else {
        showSuccessToast('RSVP successful!');
        fetchRsvps();
        setEvents(prev =>
          prev.map(event =>
            event.eventId === Number(eventId)
              ? { ...event, currentCount: event.currentCount + 1 }
              : event
          )
        );
      }
    } catch (err) {
      console.error('Failed to RSVP to event:', err);
      showErrorToast('Failed to RSVP to event');
    }
  };

  const cancelRsvp = async (eventId: number) => {
    try {
      const res = await fetch(`http://localhost:5000/api/student/rsvps/${eventId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok) {
        showSuccessToast(data.message);
        fetchRsvps();
        setEvents(prev =>
          prev.map(event =>
            event.eventId === eventId
              ? { ...event, currentCount: event.currentCount - 1 }
              : event
          )
        );
      } else {
        showErrorToast(data.error || 'Failed to cancel RSVP');
      }
    } catch (err) {
      console.error('Failed to cancel RSVP:', err);
      showErrorToast('Failed to cancel RSVP');
    }
  };

  const submitFeedback = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/student/feedback', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: Number(feedbackEventId),
          rating: feedbackRating,
          comment: feedbackComment,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showSuccessToast(data.message);
        setFeedbackEventId('');
        setFeedbackRating(5);
        setFeedbackComment('');
      } else {
        showErrorToast(data.error || 'Failed to submit feedback');
      }
    } catch (err) {
      console.error('Failed to submit feedback:', err);
      showErrorToast('Failed to submit feedback');
    }
  };

  const getFeedback = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/student/feedback/${getFeedbackEventId}`, {
        credentials: 'include',
      });
      const data = await res.json();
      setFeedback(data);
    } catch (err) {
      console.error('Failed to get feedback:', err);
      showErrorToast('Failed to get feedback');
    }
  };

  const fetchCertificates = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/student/certificates', {
        credentials: 'include',
      });
      const data = await res.json();
      setCertificates(data);
    } catch (err) {
      console.error('Failed to fetch certificates:', err);
    }
  };

  const fetchAllEvents = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/club/events/all');
      const data = await res.json();
      setAllEvents(data);
    } catch (err) {
      console.error('Failed to fetch all events:', err);
    }
  };

  const fetchEventDetails = async (eventId: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/club/events/${eventId}`, {
        credentials: 'include',
      });
      const data = await res.json();
      setSelectedEvent(data);
      setShowEventDetails(true);
    } catch (err) {
      console.error('Failed to fetch event details:', err);
      showErrorToast('Failed to fetch event details');
    }
  };

  const fetchSubscribedEvents = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/student/subscriptions/events', {
        credentials: 'include',
      });
      const data = await res.json();
      setSubscribedEvents(data);
    } catch (err) {
      console.error('Failed to fetch subscribed events:', err);
    }
  };

  const fetchActivityStatus = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/student/activity-status', {
        credentials: 'include',
      });
      const data = await res.json();
      setActivityStatus(data.active ? "Active" : "Inactive");
    } catch (err) {
      console.error('Failed to fetch activity status:', err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/student/notifications', {
        credentials: 'include',
      });
      const data: Notification[] = await res.json();
      setNotifications(data);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  const markAsRead = async (notificationId: number, clubId: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/student/notifications/${notificationId}/read`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clubId }),
      });

      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n
          )
        );
        showSuccessToast('Notification marked as read');
      } else {
        showErrorToast('Failed to mark notification as read');
      }
    } catch (err) {
      console.error('Error in markAsRead:', err);
      showErrorToast('Error marking notification as read');
    }
  };

  const fetchClubs = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/club/', {
        credentials: 'include',
      });
      const data = await res.json();
      setClubs(data.clubs || data);
    } catch (err) {
      console.error('Error fetching clubs:', err);
    }
  };

  const handleSelectClub = async (clubId: string) => {
    setSelectedClubId(clubId);
    try {
      const res = await fetch(`http://localhost:5000/api/club/${clubId}/events/`, {
        credentials: 'include',
      });
      const data = await res.json();
      setClubEvents(data);
    } catch (err) {
      console.error(`Error fetching events of club ${clubId}:`, err);
    }
  };

  const handleSelectEvent = async (eventId: string) => {
    if (!selectedClubId) return;

    try {
      const res = await fetch(`http://localhost:5000/api/club/${selectedClubId}/events/${eventId}`, {
        credentials: 'include',
      });
      const data = await res.json();
      setSelectedEvent(data);
    } catch (err) {
      console.error(`Error fetching event ${eventId}:`, err);
    }
  };

  const handleExploreClub = (club: Club) => {
    setSelectedClub(club);
    setShowClubDetails(true);
  };

  // Toast notifications
  const [toasts, setToasts] = useState<any[]>([]);

  const showSuccessToast = (message: string) => {
    const id = Date.now();
    const toast = { id, message, type: 'success' };
    setToasts(prev => [...prev, toast]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const showErrorToast = (message: string) => {
    const id = Date.now();
    const toast = { id, message, type: 'error' };
    setToasts(prev => [...prev, toast]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  // Statistics calculations
  const getStats = () => {
    const totalEvents = allEvents.length;
    const myRsvps = rsvps.length;
    const mySubscriptions = subscriptions.length;
    const myCertificates = certificates.length;
    const unreadNotifications = notifications.filter(n => !n.read_at).length;
    
    return {
      totalEvents,
      myRsvps,
      mySubscriptions,
      myCertificates,
      unreadNotifications
    };
  };

  // Chart data preparation
  const getEventsByMonth = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthCounts = new Array(12).fill(0);
    allEvents.forEach(event => {
      const month = new Date(event.event_date).getMonth();
      monthCounts[month]++;
    });
    return monthCounts.map((count, index) => ({
      month: months[index],
      events: count
    }));
  };

  const getRSVPByStatus = () => {
    const upcoming = rsvps.filter(rsvp => new Date(rsvp.event_date) > new Date()).length;
    const completed = rsvps.filter(rsvp => new Date(rsvp.event_date) <= new Date()).length;
    
    return [
      { name: 'Upcoming', value: upcoming, color: '#10b981' },
      { name: 'Completed', value: completed, color: '#3b82f6' },
      { name: 'Available', value: Math.max(0, allEvents.length - rsvps.length), color: '#f59e0b' }
    ];
  };

  // Helper functions
  const isEventRSVPed = (eventId: string) => {
    return rsvps.some(rsvp => rsvp.id.toString() === eventId);
  };

  const isClubSubscribed = (clubId: string) => {
    return subscriptions.some(sub => sub.id === clubId);
  };

  const getEventStatus = (event: any) => {
    const eventDate = new Date(event.event_date || event.date);
    const now = new Date();
    const isRsvped = isEventRSVPed(event.id);
    
    if (eventDate > now) {
      return isRsvped ? 'registered' : 'available';
    } else {
      return isRsvped ? 'attended' : 'missed';
    }
  };

  // Pagination
  const getCurrentPageEvents = () => {
    const eventsToShow = eventSearchQuery ? eventSearchResults : allEvents;
    const startIndex = (currentPage - 1) * eventsPerPage;
    const endIndex = startIndex + eventsPerPage;
    return eventsToShow.slice(startIndex, endIndex);
  };

  const getTotalPages = () => {
    const eventsToShow = eventSearchQuery ? eventSearchResults : allEvents;
    return Math.ceil(eventsToShow.length / eventsPerPage);
  };

  // Render functions for different sections
  const renderDashboard = () => (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Welcome Header */}
      <motion.div variants={itemVariants} className="relative overflow-hidden">
        <div className="bg-gradient-to-br from-emerald-500 via-sky-500 to-purple-600 rounded-3xl p-8 text-white shadow-2xl">
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <motion.div 
                  className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30"
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                  <span className="text-3xl font-bold">CC</span>
                </motion.div>
                <div>
                  <h1 className="text-4xl font-bold mb-2">Welcome back, {student?.name || 'Student'}!</h1>
                  <p className="text-xl text-white/80 font-medium">Ready to explore what's happening today?</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className={`flex items-center space-x-2 px-4 py-2 rounded-full ${
                  activityStatus === 'Active' 
                    ? 'bg-green-500/20 border border-green-300/30' 
                    : 'bg-gray-500/20 border border-gray-300/30'
                }`}>
                  <motion.div 
                    className={`w-3 h-3 rounded-full ${
                      activityStatus === 'Active' ? 'bg-green-400' : 'bg-gray-400'
                    }`}
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <span className="text-sm font-medium">{activityStatus}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-white/20 to-transparent rounded-full -translate-y-48 translate-x-48"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-white/20 to-transparent rounded-full translate-y-32 -translate-x-32"></div>
          </div>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {[
          { 
            label: 'Total Events', 
            value: getStats().totalEvents, 
            icon: Calendar, 
            color: 'from-emerald-500 to-emerald-600',
            bgColor: 'bg-emerald-50',
            textColor: 'text-emerald-700'
          },
          { 
            label: 'My RSVPs', 
            value: getStats().myRsvps, 
            icon: Bookmark, 
            color: 'from-sky-500 to-sky-600',
            bgColor: 'bg-sky-50',
            textColor: 'text-sky-700'
          },
          { 
            label: 'Subscriptions', 
            value: getStats().mySubscriptions, 
            icon: Users, 
            color: 'from-purple-500 to-purple-600',
            bgColor: 'bg-purple-50',
            textColor: 'text-purple-700'
          },
          { 
            label: 'Certificates', 
            value: getStats().myCertificates, 
            icon: Award, 
            color: 'from-orange-500 to-orange-600',
            bgColor: 'bg-orange-50',
            textColor: 'text-orange-700'
          },
          { 
            label: 'Notifications', 
            value: getStats().unreadNotifications, 
            icon: Bell, 
            color: 'from-rose-500 to-rose-600',
            bgColor: 'bg-rose-50',
            textColor: 'text-rose-700'
          }
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            variants={cardVariants}
            whileHover="hover"
            className={`${stat.bgColor} rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-semibold ${stat.textColor} mb-1`}>{stat.label}</p>
                <p className={`text-3xl font-bold ${stat.textColor}`}>{stat.value}</p>
              </div>
              <motion.div 
                className={`w-14 h-14 bg-gradient-to-r ${stat.color} rounded-xl flex items-center justify-center shadow-lg`}
                whileHover={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 0.5 }}
              >
                <stat.icon className="w-7 h-7 text-white" />
              </motion.div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Event Capacity Monitoring */}
      <motion.div variants={itemVariants} className="bg-white rounded-3xl p-8 shadow-2xl border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <Activity className="w-8 h-8 text-emerald-500 mr-3" />
            Live Event Capacity
          </h2>
          <motion.div 
            className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-semibold"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Real-time Updates
          </motion.div>
        </div>
        {events.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No events with capacity tracking available</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => {
              const availableSeats = event.maxCapacity - event.currentCount;
              const occupancyPercentage = (event.currentCount / event.maxCapacity) * 100;
              
              return (
                <motion.div
                  key={event.eventId}
                  variants={cardVariants}
                  whileHover="hover"
                  className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 cursor-pointer"
                  onClick={() => fetchEventDetails(event.eventId.toString())}
                >
                  <h3 className="font-bold text-gray-800 mb-4 text-lg">{event.title}</h3>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Available Seats</span>
                      <span className={`font-bold text-lg ${
                        availableSeats > 10 ? 'text-green-600' : 
                        availableSeats > 5 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {availableSeats}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Occupancy</span>
                        <span>{event.currentCount}/{event.maxCapacity}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <motion.div 
                          className={`h-3 rounded-full ${
                            occupancyPercentage >= 90 ? 'bg-gradient-to-r from-red-500 to-red-600' :
                            occupancyPercentage >= 70 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
                            'bg-gradient-to-r from-green-500 to-green-600'
                          }`}
                          initial={{ width: 0 }}
                          animate={{ width: `${occupancyPercentage}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 text-center">{occupancyPercentage.toFixed(1)}% full</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Recent Events */}
      <motion.div variants={itemVariants} className="bg-white rounded-3xl p-8 shadow-2xl border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
          <Star className="w-8 h-8 text-yellow-500 mr-3" />
          Upcoming Events
        </h2>
        {subscribedEvents.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No upcoming events from your subscribed clubs</p>
            <button 
              onClick={() => setActiveSection('clubs')}
              className="mt-4 px-6 py-3 bg-gradient-to-r from-emerald-500 to-sky-500 text-white rounded-full font-semibold hover:shadow-lg transition-all duration-300"
            >
              Explore Clubs
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subscribedEvents.slice(0, 6).map((event, index) => (
              <motion.div
                key={event.id}
                variants={cardVariants}
                whileHover="hover"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 cursor-pointer"
                onClick={() => fetchEventDetails(event.id)}
              >
                <div className="flex items-start justify-between mb-4">
                  <motion.div 
                    className="w-14 h-14 bg-gradient-to-r from-emerald-500 to-sky-500 rounded-xl flex items-center justify-center text-white text-2xl shadow-lg"
                    whileHover={{ rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 0.5 }}
                  >
                    🎯
                  </motion.div>
                  <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-3 py-1 rounded-full">
                    {new Date(event.event_date).toLocaleDateString()}
                  </span>
                </div>
                
                <h3 className="font-bold text-gray-800 mb-2 text-lg">{event.title}</h3>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{event.club_name}</p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-500">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span className="truncate">{event.location}</span>
                  </div>
                  <motion.button 
                    className="text-sm bg-gradient-to-r from-emerald-500 to-sky-500 text-white px-4 py-2 rounded-full font-bold shadow-md hover:shadow-lg transition-all duration-300"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    View
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );

  const renderProfile = () => (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      <motion.div variants={itemVariants} className="bg-white rounded-3xl p-8 shadow-2xl border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
          <User className="w-8 h-8 text-purple-500 mr-3" />
          My Profile
        </h2>
        
        {student && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex items-center space-x-6">
                <motion.img 
                  src={student.profile_pic || '/placeholder.svg'} 
                  alt="Profile" 
                  className="w-24 h-24 rounded-full object-cover border-4 border-purple-200 shadow-lg"
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.3 }}
                />
                <div>
                  <h3 className="text-2xl font-bold text-gray-800">{student.name}</h3>
                  <p className="text-gray-600">{student.email}</p>
                  <p className="text-sm text-gray-500">ID: {student.university_id}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Club Subscriptions', value: subscriptions.length, color: 'text-blue-600' },
                  { label: 'Event RSVPs', value: rsvps.length, color: 'text-green-600' },
                  { label: 'Certificates', value: certificates.length, color: 'text-yellow-600' },
                  { label: 'Activity Status', value: activityStatus, color: activityStatus === 'Active' ? 'text-green-600' : 'text-gray-600' }
                ].map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    variants={itemVariants}
                    className="bg-gray-50 rounded-xl p-4 text-center"
                  >
                    <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                    <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                  </motion.div>
                ))}
              </div>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Update Name</label>
                <input 
                  value={updateName} 
                  onChange={(e) => setUpdateName(e.target.value)} 
                  placeholder="Enter new name" 
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Profile Picture URL</label>
                <input 
                  value={updatePic} 
                  onChange={(e) => setUpdatePic(e.target.value)} 
                  placeholder="Enter new profile picture URL" 
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300"
                />
              </div>
              
              <div className="flex space-x-4">
                <motion.button 
                  onClick={updateStudent} 
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Update Profile
                </motion.button>
                
                <motion.button 
                  onClick={deleteStudent} 
                  className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Delete Account
                </motion.button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );

  const renderEvents = () => (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      <motion.div variants={itemVariants} className="bg-white rounded-3xl p-8 shadow-2xl border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <Calendar className="w-8 h-8 text-orange-500 mr-3" />
            All Events
          </h2>
          
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={eventSearchQuery}
                onChange={(e) => setEventSearchQuery(e.target.value)}
                placeholder="Search events..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300"
              />
            </div>
          </div>
        </div>
        
        {getCurrentPageEvents().length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No events found</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {getCurrentPageEvents().map((event, index) => {
                const status = getEventStatus(event);
                const statusConfig = {
                  registered: { 
                    bg: 'bg-green-50 border-green-200', 
                    text: 'text-green-700', 
                    badge: 'bg-green-100 text-green-700', 
                    label: 'Registered' 
                  },
                  available: { 
                    bg: 'bg-blue-50 border-blue-200', 
                    text: 'text-blue-700', 
                    badge: 'bg-blue-100 text-blue-700', 
                    label: 'Available' 
                  },
                  attended: { 
                    bg: 'bg-emerald-50 border-emerald-200', 
                    text: 'text-emerald-700', 
                    badge: 'bg-emerald-100 text-emerald-700', 
                    label: 'Attended' 
                  },
                  missed: { 
                    bg: 'bg-gray-50 border-gray-200', 
                    text: 'text-gray-700', 
                    badge: 'bg-gray-100 text-gray-700', 
                    label: 'Missed' 
                  }
                };
                
                const config = statusConfig[status as keyof typeof statusConfig];
                
                return (
                  <motion.div
                    key={event.id}
                    variants={cardVariants}
                    whileHover="hover"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className={`${config.bg} rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border cursor-pointer`}
                    onClick={() => fetchEventDetails(event.id)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <motion.div 
                        className="w-14 h-14 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center text-white text-2xl shadow-lg"
                        whileHover={{ rotate: [0, -10, 10, 0] }}
                        transition={{ duration: 0.5 }}
                      >
                        📅
                      </motion.div>
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${config.badge}`}>
                        {config.label}
                      </span>
                    </div>
                    
                    <h3 className={`font-bold mb-2 text-lg ${config.text}`}>{event.title}</h3>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{event.description}</p>
                    
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>{new Date(event.event_date || event.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <MapPin className="w-4 h-4 mr-2" />
                        <span className="truncate">{event.location}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Users className="w-4 h-4 mr-2" />
                        <span>{event.club_name}</span>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex justify-between items-center">
                      <motion.button 
                        className="text-sm bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-full font-bold shadow-md hover:shadow-lg transition-all duration-300"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          fetchEventDetails(event.id);
                        }}
                      >
                        View Details
                      </motion.button>
                      
                      {status === 'available' && (
                        <motion.button 
                          className="text-sm bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-full font-bold shadow-md hover:shadow-lg transition-all duration-300"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            rsvpEvent(event.id);
                          }}
                        >
                          RSVP
                        </motion.button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
            
            {/* Pagination */}
            {getTotalPages() > 1 && (
              <div className="flex justify-center items-center space-x-4">
                <motion.button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ scale: currentPage === 1 ? 1 : 1.05 }}
                  whileTap={{ scale: currentPage === 1 ? 1 : 0.95 }}
                >
                  Previous
                </motion.button>
                
                <span className="text-gray-600 font-medium">
                  Page {currentPage} of {getTotalPages()}
                </span>
                
                <motion.button
                  onClick={() => setCurrentPage(prev => Math.min(getTotalPages(), prev + 1))}
                  disabled={currentPage === getTotalPages()}
                  className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ scale: currentPage === getTotalPages() ? 1 : 1.05 }}
                  whileTap={{ scale: currentPage === getTotalPages() ? 1 : 0.95 }}
                >
                  Next
                </motion.button>
              </div>
            )}
          </>
        )}
      </motion.div>
    </motion.div>
  );

  const renderClubs = () => (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      <motion.div variants={itemVariants} className="bg-white rounded-3xl p-8 shadow-2xl border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
          <Users className="w-8 h-8 text-blue-500 mr-3" />
          Clubs & Communities
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clubs.map((club, index) => {
            const isSubscribed = isClubSubscribed(club.id);
            
            return (
              <motion.div
                key={club.id}
                variants={cardVariants}
                whileHover="hover"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`${isSubscribed ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'} rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border`}
              >
                <div className="flex items-start justify-between mb-4">
                  <motion.img 
                    src={club.logo_url || '/placeholder.svg'} 
                    alt={club.name} 
                    className="w-16 h-16 object-contain rounded-xl shadow-md"
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.3 }}
                  />
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                    isSubscribed ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {isSubscribed ? 'Subscribed' : 'Available'}
                  </span>
                </div>
                
                <h3 className="font-bold text-gray-800 mb-2 text-lg">{club.name}</h3>
                <p className="text-sm text-gray-600 mb-4 line-clamp-3">{club.description}</p>
                
                <div className="flex justify-between items-center">
                  <motion.button 
                    onClick={() => handleExploreClub(club)}
                    className="text-sm bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-2 rounded-full font-bold shadow-md hover:shadow-lg transition-all duration-300"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Explore
                  </motion.button>
                  
                  {isSubscribed ? (
                    <motion.button 
                      onClick={() => unsubscribeClub(club.id)}
                      className="text-sm bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-full font-bold shadow-md hover:shadow-lg transition-all duration-300"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Unsubscribe
                    </motion.button>
                  ) : (
                    <motion.button 
                      onClick={() => subscribeClub(club.id)}
                      className="text-sm bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-full font-bold shadow-md hover:shadow-lg transition-all duration-300"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Subscribe
                    </motion.button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );

  const renderRSVPs = () => (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      <motion.div variants={itemVariants} className="bg-white rounded-3xl p-8 shadow-2xl border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
          <Bookmark className="w-8 h-8 text-green-500 mr-3" />
          My RSVPs
        </h2>
        
        {rsvps.length === 0 ? (
          <div className="text-center py-12">
            <Bookmark className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No RSVPs found</p>
            <button 
              onClick={() => setActiveSection('events')}
              className="mt-4 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full font-semibold hover:shadow-lg transition-all duration-300"
            >
              Browse Events
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rsvps.map((rsvp, index) => {
              const eventDate = new Date(rsvp.event_date);
              const now = new Date();
              const isUpcoming = eventDate > now;
              
              return (
                <motion.div
                  key={rsvp.id}
                  variants={cardVariants}
                  whileHover="hover"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className={`${isUpcoming ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'} rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border cursor-pointer`}
                  onClick={() => fetchEventDetails(rsvp.id.toString())}
                >
                  <div className="flex items-start justify-between mb-4">
                    <motion.div 
                      className={`w-14 h-14 bg-gradient-to-r ${isUpcoming ? 'from-green-500 to-emerald-500' : 'from-gray-500 to-gray-600'} rounded-xl flex items-center justify-center text-white text-2xl shadow-lg`}
                      whileHover={{ rotate: [0, -10, 10, 0] }}
                      transition={{ duration: 0.5 }}
                    >
                      {isUpcoming ? '🎯' : '✅'}
                    </motion.div>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                      isUpcoming ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {isUpcoming ? 'Upcoming' : 'Completed'}
                    </span>
                  </div>
                  
                  <h3 className="font-bold text-gray-800 mb-2 text-lg">{rsvp.title}</h3>
                  <p className="text-sm text-gray-600 mb-4">{rsvp.description}</p>
                  
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>{eventDate.toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="w-4 h-4 mr-2" />
                      <span>{eventDate.toLocaleTimeString()}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span>{rsvp.location}</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex justify-between items-center">
                    <motion.button 
                      className="text-sm bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-full font-bold shadow-md hover:shadow-lg transition-all duration-300"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        fetchEventDetails(rsvp.id.toString());
                      }}
                    >
                      View Details
                    </motion.button>
                    
                    {isUpcoming && (
                      <motion.button 
                        onClick={(e) => {
                          e.stopPropagation();
                          cancelRsvp(rsvp.id);
                        }}
                        className="text-sm bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-full font-bold shadow-md hover:shadow-lg transition-all duration-300"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Cancel
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
        
        {/* Feedback Section */}
        <motion.div variants={itemVariants} className="mt-8 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <MessageSquare className="w-6 h-6 text-purple-500 mr-2" />
            Event Feedback
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-700">Submit Feedback</h4>
              <input 
                value={feedbackEventId} 
                onChange={(e) => setFeedbackEventId(e.target.value)} 
                placeholder="Event ID" 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
              <input 
                type="number" 
                value={feedbackRating} 
                onChange={(e) => setFeedbackRating(Number(e.target.value))} 
                min={1} 
                max={5} 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="Rating (1-5)"
              />
              <textarea 
                value={feedbackComment} 
                onChange={(e) => setFeedbackComment(e.target.value)} 
                placeholder="Your feedback..." 
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
              <motion.button 
                onClick={submitFeedback} 
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all duration-300"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Submit Feedback
              </motion.button>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-700">View Feedback</h4>
              <input 
                value={getFeedbackEventId} 
                onChange={(e) => setGetFeedbackEventId(e.target.value)} 
                placeholder="Event ID to view feedback" 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
              <motion.button 
                onClick={getFeedback} 
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-2 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all duration-300"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Get Feedback
              </motion.button>
              {feedback && (
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`w-5 h-5 ${i < feedback.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                      />
                    ))}
                    <span className="ml-2 text-sm text-gray-600">({feedback.rating}/5)</span>
                  </div>
                  <p className="text-gray-700">{feedback.comment}</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );

  const renderCertificates = () => (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      <motion.div variants={itemVariants} className="bg-white rounded-3xl p-8 shadow-2xl border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
          <Award className="w-8 h-8 text-yellow-500 mr-3" />
          My Certificates
        </h2>
        
        {certificates.length === 0 ? (
          <div className="text-center py-12">
            <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No certificates earned yet</p>
            <p className="text-gray-400 text-sm mt-2">Complete events to earn certificates!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {certificates.map((cert, index) => (
              <motion.div
                key={cert.event_id}
                variants={cardVariants}
                whileHover="hover"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-yellow-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <motion.div 
                    className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center text-white text-3xl shadow-lg"
                    whileHover={{ rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 0.5 }}
                  >
                    🏆
                  </motion.div>
                  <span className="text-xs text-yellow-600 font-bold bg-yellow-100 px-3 py-1 rounded-full">
                    Certificate
                  </span>
                </div>
                
                <h3 className="font-bold text-gray-800 mb-2 text-lg">{cert.title}</h3>
                <p className="text-sm text-gray-600 mb-4">Event ID: {cert.event_id}</p>
                
                <motion.a 
                  href={cert.certificate_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-3 rounded-xl font-bold shadow-md hover:shadow-lg transition-all duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Download className="w-5 h-5 mr-2" />
                  Download Certificate
                </motion.a>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );

  const renderAnalytics = () => (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      <motion.div variants={itemVariants} className="bg-white rounded-3xl p-8 shadow-2xl border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
          <BarChart3 className="w-8 h-8 text-teal-500 mr-3" />
          Analytics Dashboard
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Events by Month Bar Chart */}
          <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl p-6 border border-teal-200">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <BarChart3 className="w-6 h-6 text-teal-500 mr-2" />
              Events by Month
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getEventsByMonth()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="events" fill="#0d9488" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* RSVP Status Pie Chart */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <PieChart className="w-6 h-6 text-purple-500 mr-2" />
              RSVP Distribution
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={getRSVPByStatus()}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {getRSVPByStatus().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        
        {/* Additional Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          {/* Club Subscriptions Bar Chart */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-200">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <Users className="w-6 h-6 text-indigo-500 mr-2" />
              Club Engagement
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { name: 'Subscriptions', count: subscriptions.length },
                  { name: 'RSVPs', count: rsvps.length },
                  { name: 'Certificates', count: certificates.length },
                  { name: 'Notifications', count: notifications.length }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#6366f1" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Activity Status Pie Chart */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-200">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <Activity className="w-6 h-6 text-emerald-500 mr-2" />
              Activity Breakdown
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Events Attended', value: rsvps.filter(r => new Date(r.event_date) <= new Date()).length, color: '#10b981' },
                      { name: 'Upcoming Events', value: rsvps.filter(r => new Date(r.event_date) > new Date()).length, color: '#3b82f6' },
                      { name: 'Club Subscriptions', value: subscriptions.length, color: '#8b5cf6' },
                      { name: 'Certificates', value: certificates.length, color: '#f59e0b' }
                    ]}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value = 0 }) => value > 0 ? `${name}: ${value}` : ''}
                  >
                    {[
                      { name: 'Events Attended', value: rsvps.filter(r => new Date(r.event_date) <= new Date()).length, color: '#10b981' },
                      { name: 'Upcoming Events', value: rsvps.filter(r => new Date(r.event_date) > new Date()).length, color: '#3b82f6' },
                      { name: 'Club Subscriptions', value: subscriptions.length, color: '#8b5cf6' },
                      { name: 'Certificates', value: certificates.length, color: '#f59e0b' }
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Analytics Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
          {[
            { 
              label: 'Event Completion Rate', 
              value: `${rsvps.length > 0 ? Math.round((rsvps.filter(r => new Date(r.event_date) <= new Date()).length / rsvps.length) * 100) : 0}%`, 
              icon: Target,
              color: 'from-green-500 to-emerald-500',
              bgColor: 'bg-green-50',
              textColor: 'text-green-700'
            },
            { 
              label: 'Engagement Score', 
              value: Math.min(100, (rsvps.length * 10) + (subscriptions.length * 5) + (certificates.length * 20)), 
              icon: TrendingUp,
              color: 'from-blue-500 to-indigo-500',
              bgColor: 'bg-blue-50',
              textColor: 'text-blue-700'
            },
            { 
              label: 'Active Subscriptions', 
              value: subscriptions.length, 
              icon: Heart,
              color: 'from-pink-500 to-rose-500',
              bgColor: 'bg-pink-50',
              textColor: 'text-pink-700'
            },
            { 
              label: 'Achievement Level', 
              value: certificates.length > 10 ? 'Expert' : certificates.length > 5 ? 'Advanced' : certificates.length > 0 ? 'Beginner' : 'Starter',
              icon: Zap,
              color: 'from-purple-500 to-violet-500',
              bgColor: 'bg-purple-50',
              textColor: 'text-purple-700'
            }
          ].map((metric, index) => (
            <motion.div
              key={metric.label}
              variants={itemVariants}
              className={`${metric.bgColor} rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-semibold ${metric.textColor} mb-1`}>{metric.label}</p>
                  <p className={`text-2xl font-bold ${metric.textColor}`}>{metric.value}</p>
                </div>
                <motion.div 
                  className={`w-12 h-12 bg-gradient-to-r ${metric.color} rounded-xl flex items-center justify-center shadow-lg`}
                  whileHover={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 0.5 }}
                >
                  <metric.icon className="w-6 h-6 text-white" />
                </motion.div>
              </div>
            </motion.div>
          ))}
        </div>
        
        {/* Activity Timeline */}
        <div className="mt-8 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <Clock className="w-6 h-6 text-gray-500 mr-2" />
            Recent Activity Timeline
          </h3>
          <div className="space-y-4">
            {rsvps.slice(0, 5).map((rsvp, index) => {
              const eventDate = new Date(rsvp.event_date);
              const isUpcoming = eventDate > new Date();
              
              return (
                <motion.div
                  key={rsvp.id}
                  variants={itemVariants}
                  className="flex items-center space-x-4 p-4 bg-white rounded-xl border border-gray-200"
                >
                  <div className={`w-3 h-3 rounded-full ${isUpcoming ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{rsvp.title}</p>
                    <p className="text-sm text-gray-500">{eventDate.toLocaleDateString()}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    isUpcoming ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {isUpcoming ? 'Upcoming' : 'Completed'}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );

  const renderNotifications = () => (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      <motion.div variants={itemVariants} className="bg-white rounded-3xl p-8 shadow-2xl border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
          <Bell className="w-8 h-8 text-rose-500 mr-3" />
          Notifications Center
        </h2>
        
        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No notifications yet</p>
            <p className="text-gray-400 text-sm mt-2">You'll see notifications for events and club updates here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification, index) => (
              <motion.div
                key={notification.id}
                variants={itemVariants}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className={`${
                  notification.read_at ? 'bg-gray-50 border-gray-200' : 'bg-rose-50 border-rose-200'
                } rounded-2xl p-6 border transition-all duration-300 hover:shadow-lg cursor-pointer`}
                onClick={() => markAsRead(notification.id, notification.club_id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <motion.div 
                      className={`w-12 h-12 ${
                        notification.read_at ? 'bg-gray-200' : 'bg-rose-200'
                      } rounded-xl flex items-center justify-center shadow-md`}
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Bell className={`w-6 h-6 ${
                        notification.read_at ? 'text-gray-500' : 'text-rose-500'
                      }`} />
                    </motion.div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-800 mb-1">{notification.event_title}</h3>
                      <p className="text-gray-600 mb-2">{notification.message}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>Event ID: {notification.event_id}</span>
                        <span>Club ID: {notification.club_id}</span>
                        <span>{new Date(notification.notify_at).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {notification.read_at ? (
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full flex items-center">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Read
                      </span>
                    ) : (
                      <span className="text-xs text-rose-600 bg-rose-100 px-2 py-1 rounded-full flex items-center">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Unread
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );

  const renderSearch = () => (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      <motion.div variants={itemVariants} className="bg-white rounded-3xl p-8 shadow-2xl border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
          <Search className="w-8 h-8 text-violet-500 mr-3" />
          Global Search
        </h2>
        
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search clubs, students, events..."
            className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all duration-300 text-lg"
          />
        </div>

        {loading && (
          <div className="text-center py-8">
            <motion.div 
              className="w-8 h-8 border-4 border-violet-200 border-t-violet-500 rounded-full mx-auto"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <p className="text-gray-500 mt-2">Searching...</p>
          </div>
        )}

        {!loading && searchQuery && (
          <div className="space-y-8">
            {/* Clubs Results */}
            {searchResults.clubs.length > 0 && (
              <div>
                <h3 className="text-xl font-bold text-blue-700 mb-4 flex items-center">
                  <Users className="w-6 h-6 mr-2" />
                  Clubs ({searchResults.clubs.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {searchResults.clubs.map((club, index) => (
                    <motion.div
                      key={club.id}
                      variants={itemVariants}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="bg-blue-50 border border-blue-200 rounded-xl p-4 hover:shadow-lg transition-all duration-300"
                    >
                      <div className="flex items-start space-x-3">
                        <img src={club.logo_url || '/placeholder.svg'} alt={club.name} className="w-12 h-12 object-contain rounded-lg" />
                        <div className="flex-1">
                          <h4 className="font-bold text-blue-900">{club.name}</h4>
                          <p className="text-sm text-blue-700 line-clamp-2">{club.description}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Students Results */}
            {searchResults.students.length > 0 && (
              <div>
                <h3 className="text-xl font-bold text-green-700 mb-4 flex items-center">
                  <User className="w-6 h-6 mr-2" />
                  Students ({searchResults.students.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {searchResults.students.map((student, index) => (
                    <motion.div
                      key={student.id}
                      variants={itemVariants}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="bg-green-50 border border-green-200 rounded-xl p-4 hover:shadow-lg transition-all duration-300"
                    >
                      <h4 className="font-bold text-green-900">{student.name}</h4>
                      <p className="text-sm text-green-700">{student.email}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Events Results */}
            {searchResults.events.length > 0 && (
              <div>
                <h3 className="text-xl font-bold text-purple-700 mb-4 flex items-center">
                  <Calendar className="w-6 h-6 mr-2" />
                  Events ({searchResults.events.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {searchResults.events.map((event, index) => (
                    <motion.div
                      key={event.id}
                      variants={itemVariants}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="bg-purple-50 border border-purple-200 rounded-xl p-4 hover:shadow-lg transition-all duration-300 cursor-pointer"
                      onClick={() => fetchEventDetails(event.id)}
                    >
                      <h4 className="font-bold text-purple-900">{event.title}</h4>
                      <p className="text-sm text-purple-700 line-clamp-2 mb-2">{event.description}</p>
                      <div className="space-y-1 text-xs text-purple-600">
                        <div className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          <span>{new Date(event.event_date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center">
                          <MapPin className="w-3 h-3 mr-1" />
                          <span>{event.location}</span>
                        </div>
                        <div className="flex items-center">
                          <Users className="w-3 h-3 mr-1" />
                          <span>{event.club_name}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* No Results */}
            {searchResults.clubs.length === 0 &&
              searchResults.students.length === 0 &&
              searchResults.events.length === 0 && (
                <div className="text-center py-12">
                  <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No results found for "{searchQuery}"</p>
                  <p className="text-gray-400 text-sm mt-2">Try different keywords or check your spelling</p>
                </div>
            )}
          </div>
        )}

        {!searchQuery && (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Start typing to search</p>
            <p className="text-gray-400 text-sm mt-2">Search across clubs, students, and events</p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );

  const renderEventDetails = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ y: 50 }}
        animate={{ y: 0 }}
        className="bg-white rounded-3xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-gray-800">{selectedEvent?.title}</h2>
          <motion.button
            onClick={() => setShowEventDetails(false)}
            className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <X className="w-5 h-5 text-gray-600" />
          </motion.button>
        </div>

        {selectedEvent && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Description</h3>
                  <p className="text-gray-600">{selectedEvent.description}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-1">Date</h4>
                    <p className="text-gray-600">{selectedEvent.date || selectedEvent.event_date ? new Date(selectedEvent.date ?? selectedEvent.event_date ?? '').toLocaleDateString() : 'N/A'}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-1">Time</h4>
                    <p className="text-gray-600">{new Date(selectedEvent.date ?? selectedEvent.event_date ?? '').toLocaleTimeString()}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-1">Location</h4>
                    <p className="text-gray-600">{selectedEvent.location}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-1">Capacity</h4>
                    <p className="text-gray-600">{selectedEvent.capacity}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-700 mb-1">Created By</h4>
                  <p className="text-gray-600">{selectedEvent.created_by}</p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-700 mb-1">Status</h4>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    selectedEvent.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {selectedEvent.status}
                  </span>
                </div>
              </div>
              
              <div className="space-y-4">
                <motion.button
                  onClick={() => rsvpEvent(selectedEvent.id)}
                  className="w-full bg-gradient-to-r from-emerald-500 to-sky-500 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  RSVP to Event
                </motion.button>
                
                <motion.button
                  onClick={() => {
                    setShowEventDetails(false);
                    // Show custom HTML in next section
                    setTimeout(() => {
                      setShowEventDetails(true);
                    }, 100);
                  }}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Info className="w-5 h-5 mr-2" />
                  More Info
                </motion.button>
              </div>
            </div>

            {selectedEvent.custom_html && (
              <div className="mt-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-800">Event Details</h3>
                  <motion.button
                    onClick={() => setShowEventDetails(false)}
                    className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Dashboard
                  </motion.button>
                </div>
                <div 
                  className="bg-gray-50 rounded-2xl p-6 border border-gray-200"
                  dangerouslySetInnerHTML={{ __html: selectedEvent.custom_html }}
                />
              </div>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );

  const renderClubDetails = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ y: 50 }}
        animate={{ y: 0 }}
        className="bg-white rounded-3xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-gray-800">{selectedClub?.name}</h2>
          <motion.button
            onClick={() => setShowClubDetails(false)}
            className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <X className="w-5 h-5 text-gray-600" />
          </motion.button>
        </div>

        {selectedClub && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <img 
                    src={selectedClub.logo_url || '/placeholder.svg'} 
                    alt={selectedClub.name} 
                    className="w-20 h-20 object-contain rounded-xl shadow-lg"
                  />
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800">{selectedClub.name}</h3>
                    <p className="text-gray-600">{selectedClub.description}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                {isClubSubscribed(selectedClub.id) ? (
                  <motion.button
                    onClick={() => unsubscribeClub(selectedClub.id)}
                    className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Unsubscribe from Club
                  </motion.button>
                ) : (
                  <motion.button
                    onClick={() => subscribeClub(selectedClub.id)}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Subscribe to Club
                  </motion.button>
                )}
                
                <motion.button
                  onClick={() => setShowClubDetails(false)}
                  className="w-full bg-gradient-to-r from-gray-500 to-gray-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back to Dashboard
                </motion.button>
              </div>
            </div>

            {/* More Info Section with Custom HTML */}
            {selectedClub.about_html && (
              <div className="mt-8">
                <motion.button
                  onClick={() => {
                    const moreInfoSection = document.getElementById('club-more-info-section');
                    if (moreInfoSection) {
                      moreInfoSection.style.display = moreInfoSection.style.display === 'none' ? 'block' : 'none';
                    }
                  }}
                  className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 mb-4"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  More Info About This Club
                </motion.button>
                
                <div id="club-more-info-section" style={{ display: 'none' }} className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                  <div 
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: selectedClub.about_html }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );

  // Main render function
  const renderActiveSection = () => {
    switch (activeSection) {
      case 'dashboard': return renderDashboard();
      case 'profile': return renderProfile();
      case 'events': return renderEvents();
      case 'clubs': return renderClubs();
      case 'rsvps': return renderRSVPs();
      case 'certificates': return renderCertificates();
      case 'analytics': return renderAnalytics();
      case 'notifications': return renderNotifications();
      case 'search': return renderSearch();
      default: return renderDashboard();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Sidebar */}
      <motion.div 
        initial={{ x: -300 }}
        animate={{ x: sidebarOpen ? 0 : -300 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="fixed left-0 top-0 h-full w-80 bg-white/90 backdrop-blur-xl border-r border-gray-200 shadow-2xl z-40"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <motion.div 
              className="flex items-center space-x-3"
              whileHover={{ scale: 1.05 }}
            >
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-sky-500 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">CC</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Campus Connect</h1>
                <p className="text-sm text-gray-600">Student Portal</p>
              </div>
            </motion.div>
            
            <motion.button
              onClick={() => setSidebarOpen(false)}
              className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors lg:hidden"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X className="w-4 h-4 text-gray-600" />
            </motion.button>
          </div>
          
          <nav className="space-y-2">
            {sidebarItems.map((item, index) => (
              <motion.button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center space-x-4 px-4 py-3 rounded-xl transition-all duration-300 ${
                  activeSection === item.id
                    ? 'bg-gradient-to-r from-white to-gray-50 shadow-lg border border-gray-200'
                    : 'hover:bg-gray-50'
                }`}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: index * 0.1 }}
                whileHover={{ x: 4 }}
              >
                <motion.div 
                  className={`w-10 h-10 bg-gradient-to-r ${item.color} rounded-lg flex items-center justify-center shadow-md`}
                  whileHover={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 0.5 }}
                >
                  <item.icon className="w-5 h-5 text-white" />
                </motion.div>
                <span className={`font-semibold ${
                  activeSection === item.id ? 'text-gray-800' : 'text-gray-600'
                }`}>
                  {item.label}
                </span>
                {item.id === 'notifications' && getStats().unreadNotifications > 0 && (
                  <motion.span 
                    className="bg-red-500 text-white text-xs rounded-full px-2 py-1 ml-auto"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    {getStats().unreadNotifications}
                  </motion.span>
                )}
              </motion.button>
            ))}
          </nav>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-80' : 'ml-0'}`}>
        {/* Top Bar */}
        <motion.header 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white/80 backdrop-blur-xl border-b border-gray-200 px-6 py-4 sticky top-0 z-30"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <motion.button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Menu className="w-5 h-5 text-gray-600" />
              </motion.button>
              
              <div>
                <h2 className="text-xl font-bold text-gray-800 capitalize">
                  {activeSection === 'rsvps' ? 'My RSVPs' : activeSection}
                </h2>
                <p className="text-sm text-gray-600">
                  {activeSection === 'dashboard' && `Welcome back, ${student?.name || 'Student'}!`}
                  {activeSection === 'profile' && 'Manage your profile information'}
                  {activeSection === 'events' && 'Discover and join events'}
                  {activeSection === 'clubs' && 'Explore clubs and communities'}
                  {activeSection === 'rsvps' && 'Your event registrations'}
                  {activeSection === 'certificates' && 'Your achievements and certificates'}
                  {activeSection === 'analytics' && 'Your activity insights'}
                  {activeSection === 'notifications' && 'Stay updated with notifications'}
                  {activeSection === 'search' && 'Search across the platform'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className={`flex items-center space-x-2 px-3 py-2 rounded-full ${
                activityStatus === 'Active' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-gray-100 text-gray-700'
              }`}>
                <motion.div 
                  className={`w-2 h-2 rounded-full ${
                    activityStatus === 'Active' ? 'bg-green-500' : 'bg-gray-500'
                  }`}
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <span className="text-sm font-medium">{activityStatus}</span>
              </div>
              
              <motion.div
              className="relative inline-block text-left"
              whileHover={{ scale: 1.05 }}
              ref={dropdownRef}
            >
              <div
                className="flex items-center space-x-2 cursor-pointer"
                onClick={() => setOpen((prev) => !prev)}
              >
                <img
                  src={student?.profile_pic}
                  alt="Profile"
                  className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                />
                <div className="hidden md:block">
                  <p className="text-sm font-semibold text-gray-800">{student?.name || 'Student'}</p>
                  <p className="text-xs text-gray-600">{student?.email}</p>
                </div>
              </div>

              {open && (
                <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-sm text-left text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    🚪 Logout
                  </button>
                </div>
              )}
            </motion.div>
            </div>
          </div>
        </motion.header>

        {/* Page Content */}
        <main className="p-6">
          {renderActiveSection()}
        </main>
      </div>

      {/* Floating Notifications */}
      <AnimatePresence>
        {floatingNotifications.map((notification, index) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 400, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 400, scale: 0.8 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className="fixed top-6 right-6 bg-gradient-to-r from-emerald-500 to-sky-500 text-white px-6 py-4 rounded-2xl shadow-xl flex items-center space-x-3 z-50 max-w-sm"
            style={{ top: `${24 + index * 80}px` }}
          >
            <motion.div 
              className="w-3 h-3 bg-white rounded-full"
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <span className="text-sm font-bold flex-1">{notification.message}</span>
            <motion.div
              animate={{ 
                y: [0, -3, 0],
                rotate: [0, 10, -10, 0]
              }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              {notification.emoji}
            </motion.div>
            <motion.button
              onClick={() => setFloatingNotifications(prev => prev.filter(n => n.id !== notification.id))}
              className="w-6 h-6 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X className="w-3 h-3" />
            </motion.button>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Additional floating notification like preview */}
      <AnimatePresence>
        {floatingNotifications.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: -400 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -400 }}
            transition={{ duration: 0.6, delay: 1 }}
            className="fixed bottom-6 left-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-4 rounded-2xl shadow-xl flex items-center space-x-3 z-50"
          >
            <motion.div 
              className="w-3 h-3 bg-white rounded-full"
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
            />
            <span className="text-sm font-bold">
              {subscriptions.length} club{subscriptions.length !== 1 ? 's' : ''} subscribed!
            </span>
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              🎉
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Event Details Modal */}
      <AnimatePresence>
        {showEventDetails && selectedEvent && renderEventDetails()}
      </AnimatePresence>

      {/* Club Details Modal */}
      <AnimatePresence>
        {showClubDetails && selectedClub && renderClubDetails()}
      </AnimatePresence>

      {/* Toast Notifications */}
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.8 }}
            className={`fixed bottom-6 right-6 px-6 py-4 rounded-2xl shadow-xl text-white font-semibold z-50 ${
              toast.type === 'success' 
                ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                : 'bg-gradient-to-r from-red-500 to-red-600'
            }`}
          >
            <div className="flex items-center space-x-2">
              {toast.type === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <XCircle className="w-5 h-5" />
              )}
              <span>{toast.message}</span>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 lg:hidden"
          />
        )}
      </AnimatePresence>
    </div>
  );
}