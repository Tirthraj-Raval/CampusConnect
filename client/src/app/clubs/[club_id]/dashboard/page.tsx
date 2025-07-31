'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
  Info,
  Send,
  UserPlus,
  Shield,
  Crown,
  Mail,
  Calendar as CalendarIcon,
  Upload,
  ExternalLink
} from 'lucide-react';
import { BarChart,Legend,  Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from 'recharts';

// Types
type User = {
  id: string;
  name: string;
  email: string;
  profile_pic?: string;
  role?: 'member' | 'editor' | 'secretary';
  joined_at?: string;
  last_active?: string;
};

type Event = {
  id: string;
  title: string;
  description: string;
  event_date: string;
  time: string;
  location: string;
  poster_url?: string;
  rsvps: number;
  views: number;
  max_capacity: number;
  status: 'Draft' | 'Published' | 'Completed' | 'Cancelled';
  feedback_count: number;
  certificates_generated: number;
  created_at: string;
  custom_html?: string;
};

type Certificate = {
  id: string;
  event_id: string;
  user_id: string;
  recipient?: string;
  user_email?: string;
  event_name?: string;
  certificate_url: string;
  generated_at: string;
};

type Feedback = {
  id: string;
  event_id: string;
  user_id: string;
  user_name?: string;
  event_title?: string;
  rating: number;
  comment?: string;
  submitted_at: string;
};

type Subscription = {
  id: string;
  user_id: string;
  user_name?: string;
  user_email?: string;
  subscribed_at: string;
  status: 'active' | 'unsubscribed';
};

type Analytics = {
  total_events: number;
  total_rsvps: number;
  total_certificates: number;
  total_subscribers: number;
  monthly_views: { month: string; views: number }[];
  rsvp_trends: { date: string; count: number }[];
  feedback_pie?: { rating: number; count: number }[];
  subscriber_growth?: { month: string; count: number }[];
};

type ClubData = {
  id: string;
  name: string;
  university_id: number;
  description: string;
  logo_url?: string;
  about_html?: string;
  created_at: string;
};

type RSVP = {
  id: string;
  event_id: string;
  event_date: string;
  user_id: string;
  user_name?: string;
  user_email?: string;
  title?: string;
  max_capacity?: number;
  rsvp_time: string;
  status: 'confirmed' | 'cancelled';
};

type Toast = {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
};

export default function ClubDashboard() {
  const params = useParams();
  const clubId = params?.club_id as string;

  if (!clubId) {
    console.error('Club ID is undefined. Please check the route.');
    return <div>Error: Club ID is missing. Please check the URL.</div>;
  }
  const socketRef = useRef<Socket | null>(null);

  // State Management
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [floatingNotifications, setFloatingNotifications] = useState<any[]>([]);

  // Data State
  const [clubData, setClubData] = useState<ClubData | null>(null);
  const [committee, setCommittee] = useState<User[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [rsvps, setRsvps] = useState<RSVP[]>([]);

  // Modal State
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Form State
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedCommitteeMember, setSelectedCommitteeMember] = useState<User | null>(null);
  const [isEditingCommitteeMember, setIsEditingCommitteeMember] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [matchingUsers, setMatchingUsers] = useState<User[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [customHtml, setCustomHtml] = useState('');
  const [message, setMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [eventsPerPage] = useState(6);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'past' | 'upcoming' | 'cancelled'>('all');
  const [eventFilter, setEventFilter] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'event'>('date');
  

  // New Event Form
  const [newEvent, setNewEvent] = useState<Partial<Event>>({
    title: '',
    description: '',
    event_date: '',
    time: '',
    location: '',
    max_capacity: 0,
    status: 'Draft',
    poster_url: '',
  });

  // Club Settings Form
  const [clubSettings, setClubSettings] = useState({
    name: '',
    description: '',
    logo_url: '',
    about_html: '',
  });

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
    { id: 'committee', label: 'Committee', icon: Users, color: 'from-purple-500 to-pink-500' },
    { id: 'events', label: 'Events', icon: Calendar, color: 'from-orange-500 to-red-500' },
    { id: 'rsvps', label: 'RSVPs', icon: Bookmark, color: 'from-blue-500 to-indigo-500' },
    { id: 'certificates', label: 'Certificates', icon: Award, color: 'from-green-500 to-emerald-500' },
    { id: 'feedback', label: 'Feedback', icon: MessageSquare, color: 'from-yellow-500 to-orange-500' },
    { id: 'subscriptions', label: 'Subscriptions', icon: Bell, color: 'from-teal-500 to-cyan-500' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, color: 'from-rose-500 to-pink-500' },
    { id: 'settings', label: 'Settings', icon: Settings, color: 'from-violet-500 to-purple-500' }
  ];

  // Toast functions
  const showSuccessToast = (message: string) => {
    const id = Date.now().toString();
    const newToast = { id, message, type: 'success' as const };
    setToasts(prev => [...prev, newToast]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const showErrorToast = (message: string) => {
    const id = Date.now().toString();
    const newToast = { id, message, type: 'error' as const };
    setToasts(prev => [...prev, newToast]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const showInfoToast = (message: string) => {
    const id = Date.now().toString();
    const newToast = { id, message, type: 'info' as const };
    setToasts(prev => [...prev, newToast]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Fetch all data for the dashboard
  const fetchData = useCallback(async () => {
    console.log('Fetching data for club:', clubId);
    if (!clubId) return;
    setLoading(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';
      const [
        clubRes,
        committeeRes,
        eventsRes,
        certificatesRes,
        feedbackRes,
        subscriptionsRes,
        analyticsRes,
        rsvpsRes
      ] = await Promise.all([
        fetch(`${apiBase}/api/club/${clubId}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        }),
        fetch(`${apiBase}/api/clubs/${clubId}/committee`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        }),
        fetch(`${apiBase}/api/club/${clubId}/events`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        }),
        fetch(`${apiBase}/api/clubs/${clubId}/certificates`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        }),
        fetch(`${apiBase}/api/clubs/${clubId}/feedbacks`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        }),
        fetch(`${apiBase}/api/club/${clubId}/subscriptions`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        }),
        fetch(`${apiBase}/api/clubs/${clubId}/dashboard/analytics`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        }),
        fetch(`${apiBase}/api/clubs/${clubId}/rsvps`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        })
      ]);

      if (clubRes.ok) {
        const club = await clubRes.json();
        setClubData(club);
        setClubSettings({
          name: club.name || '',
          description: club.description || '',
          logo_url: club.logo_url || '',
          about_html: club.about_html || ''
        });
      }

      if (committeeRes.ok) {
        const committeeData = await committeeRes.json();
        setCommittee(committeeData);
      }

      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        setEvents(eventsData);
      }

      if (certificatesRes.ok) {
        const certificatesData = await certificatesRes.json();
        setCertificates(certificatesData);
      }

      if (feedbackRes.ok) {
        const feedbackData = await feedbackRes.json();
        setFeedback(feedbackData);
      }

      if (subscriptionsRes.ok) {
        const subscriptionsData = await subscriptionsRes.json();
        setSubscriptions(subscriptionsData);
      }

      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        setAnalytics(analyticsData);
      }

      if (rsvpsRes.ok) {
        const rsvpsData = await rsvpsRes.json();
        console.log('RSVPs Data:', rsvpsData);
        setRsvps(rsvpsData);
      }

    } catch (error) {
      console.error('Fetch error:', error);
      showErrorToast('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [clubId]);

  // Initialize WebSocket and fetch initial data
  useEffect(() => {
    fetchData();

    // Initialize WebSocket
    const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';
    if (!socketRef.current) {
      const socket = io(apiBase, {
        transports: ['websocket'],
        withCredentials: true,
      });
      socketRef.current = socket;

      // Join club room for real-time updates
      socket.emit('join_club_room', `club_${clubId}`);

      // Listen for real-time updates
      socket.on('rsvp_update', (data: any) => {
        console.log('📡 RSVP Update Received:', data);
        fetchData(); // Refresh data on RSVP updates
      });

      socket.on('new_subscription', (data: any) => {
        console.log('📡 New Subscription:', data);
        setFloatingNotifications(prev => [...prev, {
          id: `sub-${Date.now()}`,
          message: `New subscriber: ${data.user_name}`,
          type: 'success',
          emoji: '🎉',
          timestamp: new Date().toISOString()
        }]);
        fetchData();
      });

      socket.on('new_feedback', (data: any) => {
        console.log('📡 New Feedback:', data);
        setFloatingNotifications(prev => [...prev, {
          id: `feedback-${Date.now()}`,
          message: `New feedback for ${data.event_title}`,
          type: 'info',
          emoji: '💬',
          timestamp: new Date().toISOString()
        }]);
        fetchData();
      });
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leave_club_room', `club_${clubId}`);
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [clubId, fetchData]);

  // Remove floating notifications after timeout
  useEffect(() => {
    floatingNotifications.forEach((notif, index) => {
      setTimeout(() => {
        setFloatingNotifications(prev => prev.filter(n => n.id !== notif.id));
      }, 5000 + (index * 1000));
    });
  }, [floatingNotifications]);

  // User search functionality
  const searchUsers = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      setMatchingUsers([]);
      return;
    }

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';
      const res = await fetch(`${apiBase}/api/club/users/search?q=${encodeURIComponent(query)}&universityId=${clubData?.university_id || ''}`, {
        credentials: 'include'
      });
      
      if (res.ok) {
        const users = await res.json();
        setSuggestions(users);
        setMatchingUsers(users);
      }
    } catch (error) {
      console.error('User search error:', error);
    }
  }, [clubData?.id]);

  // Debounced user search
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      searchUsers(searchQuery);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, searchUsers]);

   useEffect(() => {
    const debounceTimer = setTimeout(() => {
      searchUsers(searchTerm);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm, searchUsers]);

  // Committee Management
  const handleAddCommitteeMember = async (userId: string, role: 'member' | 'editor' | 'secretary') => {
    try {
      console.log("User Id received:", userId);
      const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';
      const res = await fetch(`${apiBase}/api/clubs/${clubId}/committee`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId: userId, role }),
      });
      
      if (res.ok) {
        showSuccessToast('Committee member added successfully');
        fetchData();
        setIsMemberModalOpen(false);
        setSearchTerm('');
        setSuggestions([]);
        setSelectedCommitteeMember(null);
      } else {
        const error = await res.json();
        showErrorToast(error.message || 'Failed to add committee member');
      }
    } catch (error) {
      console.error('Error adding committee member:', error);
      showErrorToast('Failed to add committee member');
    }
  };

  const handleEditCommitteeMember = async (userId: string, role: 'member' | 'editor' | 'secretary') => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';
      const res = await fetch(`${apiBase}/api/clubs/${clubId}/committee/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId, role }),
      });
      
      if (res.ok) {
        showSuccessToast('Committee member updated successfully');
        fetchData();
        setIsMemberModalOpen(false);
        setIsEditingCommitteeMember(false);
        setSelectedCommitteeMember(null);
      } else {
        showErrorToast('Failed to update committee member');
      }
    } catch (error) {
      console.error('Error updating committee member:', error);
      showErrorToast('Failed to update committee member');
    }
  };

  const handleRemoveCommitteeMember = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this committee member?')) return;
    
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';
      const res = await fetch(`${apiBase}/api/clubs/${clubId}/committee/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (res.ok) {
        showSuccessToast('Committee member removed successfully');
        fetchData();
      } else {
        showErrorToast('Failed to remove committee member');
      }
    } catch (error) {
      console.error('Error removing committee member:', error);
      showErrorToast('Failed to remove committee member');
    }
  };

  // Event Management
  const handleCreateEvent = async (eventData: Partial<Event>) => {
    try {
      console.log("Event Data received:", eventData);
      const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';
      const res = await fetch(`${apiBase}/api/club/${clubId}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(eventData),
      });
      
      if (res.ok) {
        showSuccessToast('Event created successfully');
        fetchData();
        setIsEventModalOpen(false);
        setNewEvent({
          title: '',
          description: '',
          event_date: '',
          time: '',
          location: '',
          max_capacity: 0,
          status: 'Draft',
          poster_url: '',
        });
      } else {
        showErrorToast('Failed to create event');
      }
    } catch (error) {
      console.error('Error creating event:', error);
      showErrorToast('Failed to create event');
    }
  };

  const handleEditEvent = async (eventId: string, eventData: Partial<Event>) => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';
      const res = await fetch(`${apiBase}/api/club/${clubId}/events/${eventId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(eventData),
      });
      
      if (res.ok) {
        showSuccessToast('Event updated successfully');
        fetchData();
        setIsEventModalOpen(false);
        setSelectedEvent(null);
      } else {
        showErrorToast('Failed to update event');
      }
    } catch (error) {
      console.error('Error updating event:', error);
      showErrorToast('Failed to update event');
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';
      const res = await fetch(`${apiBase}/api/club/${clubId}/events/${eventId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (res.ok) {
        showSuccessToast('Event deleted successfully');
        fetchData();
      } else {
        showErrorToast('Failed to delete event');
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      showErrorToast('Failed to delete event');
    }
  };

  // Certificate Management
  const handleGenerateCertificates = async () => {
    if (!selectedEventId || selectedUserIds.length === 0) {
      showErrorToast('Please select an event and recipients');
      return;
    }

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';
      const res = await fetch(`${apiBase}/api/clubs/${clubId}/certificates/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          eventId: selectedEventId,
          userIds: selectedUserIds,
          customHtml: customHtml
        }),
      });
      
      if (res.ok) {
        showSuccessToast('Certificates generated successfully');
        fetchData();
        setIsCertModalOpen(false);
        setSelectedEventId('');
        setSelectedUserIds([]);
        setSelectedUsers([]);
        setCustomHtml('');
      } else {
        showErrorToast('Failed to generate certificates');
      }
    } catch (error) {
      console.error('Error generating certificates:', error);
      showErrorToast('Failed to generate certificates');
    }
  };

  // Send Notification
  const handleSendNotification = async () => {
    if (!selectedEventId || !message.trim()) {
      showErrorToast('Please select an event and enter a message');
      return;
    }

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';
      const res = await fetch(`${apiBase}/api/clubs/${clubId}/events/${selectedEventId}/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ eventId: selectedEventId, message }),
      });
      
      if (res.ok) {
        showSuccessToast('Notification sent successfully');
        setIsNotificationModalOpen(false);
        setMessage('');
        setSelectedEventId('');
      } else {
        showErrorToast('Failed to send notification');
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      showErrorToast('Failed to send notification');
    }
  };

  // Club Settings
  const handleUpdateClubSettings = async () => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';
      const res = await fetch(`${apiBase}/api/club/${clubId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(clubSettings),
      });
      
      if (res.ok) {
        showSuccessToast('Club settings updated successfully');
        fetchData();
        setIsSettingsModalOpen(false);
      } else {
        showErrorToast('Failed to update club settings');
      }
    } catch (error) {
      console.error('Error updating club settings:', error);
      showErrorToast('Failed to update club settings');
    }
  };

  const handleDeleteClub = async () => {
    if (!confirm('Are you sure you want to delete this club? This action cannot be undone.')) return;
    
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';
      const res = await fetch(`${apiBase}/api/club/${clubId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (res.ok) {
        showSuccessToast('Club deleted successfully');
        window.location.href = '/';
      } else {
        showErrorToast('Failed to delete club');
      }
    } catch (error) {
      console.error('Error deleting club:', error);
      showErrorToast('Failed to delete club');
    }
  };

  // Export functions
  const handleExportFeedback = async () => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';
      const res = await fetch(`${apiBase}/api/clubs/${clubId}/feedbacks/exports`, {
        credentials: 'include'
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${clubData?.name}-feedback.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      showSuccessToast('Feedback exported successfully');
    } catch (error) {
      console.error('Error exporting feedback:', error);
      showErrorToast('Failed to export feedback');
    }
  };

  //Added by me
  const handleDownloadRSVPbyEvent = async (eventId: string) => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';
      const res = await fetch(`${apiBase}/api/clubs/${clubId}/rsvps/download?eventId=${eventId}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error('Failed to download RSVP data');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${clubData?.name}-event-${eventId}-rsvps.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      showSuccessToast('RSVP data downloaded successfully');
    } catch (error) {
      console.error('Error downloading RSVP data:', error);
      showErrorToast('Failed to download RSVP data');
    }
  }

  const handleExportRSVPs = async (eventId?: string) => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';
      const url = eventId 
        ? `${apiBase}/api/clubs/${clubId}/rsvps/download?eventId=${eventId}`
        : `${apiBase}/api/clubs/${clubId}/rsvps/download/all`;

      const res = await fetch(url, { credentials: 'include' });
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = eventId 
        ? `${clubData?.name}-event-rsvps.csv`
        : `${clubData?.name}-all-rsvps.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      showSuccessToast('RSVPs exported successfully');
    } catch (error) {
      console.error('Error exporting RSVPs:', error);
      showErrorToast('Failed to export RSVPs');
    }
  };

  // Logout function
  const logout = async () => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';
      await fetch(`${apiBase}/auth/logout`, {
        method: 'GET',
        credentials: 'include' 
      });
      window.location.href = "/";
    } catch (error) {
      console.error('Logout error:', error);
      window.location.href = "/";
    }
  };

  // Utility functions
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US');
  };

  const getTimeSince = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
  };

  const getStats = () => {
    return {
      totalEvents: events.length,
      totalRSVPs: analytics?.total_rsvps || 0,
      totalCertificates: certificates.length,
      totalSubscribers: subscriptions.filter(s => s.status === 'active').length,
      upcomingEvents: events.filter(e => new Date(e.event_date) > new Date()).length,
      completedEvents: events.filter(e => e.status === 'Completed').length,
      avgRating: feedback.length > 0 ? (feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length).toFixed(1) : '0'
    };
  };

  // Chart colors
  const COLORS = ['#10B981', '#3B82F6', '#EF4444', '#F59E0B', '#8B5CF6', '#EC4899'];

  // Render functions for each section
  const renderDashboard = () => {
    const stats = getStats();
    
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-8"
      >
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Total Events', value: stats.totalEvents, icon: Calendar, color: 'from-blue-500 to-indigo-500' },
            { label: 'Total RSVPs', value: stats.totalRSVPs, icon: Users, color: 'from-green-500 to-emerald-500' },
            { label: 'Certificates Issued', value: stats.totalCertificates, icon: Award, color: 'from-yellow-500 to-orange-500' },
            { label: 'Active Subscribers', value: stats.totalSubscribers, icon: Bell, color: 'from-purple-500 to-pink-500' }
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              variants={itemVariants}
              whileHover={cardVariants.hover}
              className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
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
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* RSVP Trends Chart */}
          <motion.div 
            variants={itemVariants}
            className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
          >
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
              <TrendingUp className="w-6 h-6 mr-2 text-blue-500" />
              RSVP Trends
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analytics?.rsvp_trends || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#3B82F6" 
                  fill="#3B82F6" 
                  fillOpacity={0.2}
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Feedback Distribution Chart */}
          <motion.div 
            variants={itemVariants}
            className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
          >
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
              <Star className="w-6 h-6 mr-2 text-yellow-500" />
              Feedback Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics?.feedback_pie || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ rating, percent = 0 }) => `${rating}★ ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {(analytics?.feedback_pie || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Upcoming Events */}
        <motion.div 
          variants={itemVariants}
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-800 flex items-center">
              <Calendar className="w-6 h-6 mr-2 text-green-500" />
              Upcoming Events
            </h3>
            <motion.button
              onClick={() => {
                setSelectedEvent(null);
                setIsEventModalOpen(true);
              }}
              className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Plus className="w-4 h-4 mr-2 inline" />
              New Event
            </motion.button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events
              .filter(e => new Date(e.event_date) >= new Date())
              .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
              .slice(0, 6)
              .map(event => (
                <motion.div
                  key={event.id}
                  className="bg-gray-50 rounded-xl p-4 border border-gray-100 hover:shadow-lg transition-all duration-300"
                  whileHover={{ y: -4 }}
                >
                  <h4 className="font-semibold text-gray-800 mb-2">{event.title}</h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      {formatDate(event.event_date)}
                    </div>
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      {event.location}
                    </div>
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-2" />
                      {event.rsvps}/{event.max_capacity} RSVPs
                    </div>
                  </div>
                  <div className="mt-4 flex justify-between items-center">
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                      event.status === 'Published' ? 'bg-green-100 text-green-700' :
                      event.status === 'Draft' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {event.status}
                    </span>
                    <motion.button
                      onClick={() => {
                        setSelectedEvent(event);
                        setIsEventModalOpen(true);
                      }}
                      className="text-blue-500 hover:text-blue-700 transition-colors"
                      whileHover={{ scale: 1.1 }}
                    >
                      <Edit className="w-4 h-4" />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Feedback */}
          <motion.div 
            variants={itemVariants}
            className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
          >
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
              <MessageSquare className="w-6 h-6 mr-2 text-purple-500" />
              Recent Feedback
            </h3>
            <div className="space-y-4">
              {feedback.slice(0, 5).map(item => (
                <div key={item.id} className="border-l-4 border-purple-500 pl-4 py-2">
                  <div className="flex items-center space-x-2 mb-1">
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < item.rating ? 'fill-current' : ''}`} />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">{item.event_title}</span>
                  </div>
                  <p className="text-sm text-gray-700">{item.comment || 'No comment'}</p>
                  <p className="text-xs text-gray-500 mt-1">{getTimeSince(item.submitted_at)}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Recent Subscribers */}
          <motion.div 
            variants={itemVariants}
            className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
          >
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
              <Users className="w-6 h-6 mr-2 text-teal-500" />
              Recent Subscribers
            </h3>
            <div className="space-y-4">
              {subscriptions
                .sort((a, b) => new Date(b.subscribed_at).getTime() - new Date(a.subscribed_at).getTime())
                .slice(0, 5)
                .map(sub => (
                  <div key={sub.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{sub.user_name || 'Unknown User'}</p>
                      <p className="text-xs text-gray-600">{sub.user_email}</p>
                    </div>
                    <span className="text-xs text-gray-500">{getTimeSince(sub.subscribed_at)}</span>
                  </div>
                ))}
            </div>
          </motion.div>
        </div>
      </motion.div>
    );
  };

  const renderCommittee = () => (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Committee Management</h2>
        <motion.button
          onClick={() => {
            setIsMemberModalOpen(true);
            setIsEditingCommitteeMember(false);
            setSelectedCommitteeMember(null);
            setSearchTerm('');
          }}
          className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <UserPlus className="w-5 h-5 mr-2 inline" />
          Add Member
        </motion.button>
      </div>

      <motion.div 
        variants={itemVariants}
        className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Member</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Role</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Joined</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Last Active</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {committee.map(member => (
                <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <img 
                        src={member.profile_pic} 
                        alt={member.name} 
                        className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                      />
                      <div>
                        <p className="font-semibold text-gray-800">{member.name}</p>
                        <p className="text-sm text-gray-600">{member.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
                      member.role === 'secretary' ? 'bg-purple-100 text-purple-700' :
                      member.role === 'editor' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {member.role === 'secretary' && <Crown className="w-4 h-4 inline mr-1" />}
                      {member.role === 'editor' && <Shield className="w-4 h-4 inline mr-1" />}
                      {member.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {member.joined_at ? formatDate(member.joined_at) : 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {member.last_active ? getTimeSince(member.last_active) : 'N/A'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <motion.button
                        onClick={() => {
                          setSelectedCommitteeMember(member);
                          setIsMemberModalOpen(true);
                          setIsEditingCommitteeMember(true);
                          setSearchTerm(`${member.name} (${member.email})`);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        whileHover={{ scale: 1.1 }}
                      >
                        <Edit className="w-4 h-4" />
                      </motion.button>
                      <motion.button
                        onClick={() => handleRemoveCommitteeMember(member.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        whileHover={{ scale: 1.1 }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );

  const renderEvents = () => {
    const filteredEvents = events.filter(event =>
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.location.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const indexOfLastEvent = currentPage * eventsPerPage;
    const indexOfFirstEvent = indexOfLastEvent - eventsPerPage;
    const currentEvents = filteredEvents.slice(indexOfFirstEvent, indexOfLastEvent);
    const totalPages = Math.ceil(filteredEvents.length / eventsPerPage);

    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-2xl font-bold text-gray-800">Event Management</h2>
          
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search events..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <motion.button
              onClick={() => {
                setSelectedEvent(null);
                setIsEventModalOpen(true);
              }}
              className="px-6 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Plus className="w-5 h-5 mr-2 inline" />
              New Event
            </motion.button>
          </div>
        </div>

        <motion.div 
          variants={itemVariants}
          className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Event</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Date & Time</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">RSVPs</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Feedback</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentEvents.map(event => (
                  <tr key={event.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-gray-800">{event.title}</p>
                        <p className="text-sm text-gray-600 flex items-center mt-1">
                          <MapPin className="w-4 h-4 mr-1" />
                          {event.location}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <p className="text-gray-800">{formatDate(event.event_date)}</p>
                        <p className="text-gray-600">{event.time}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
                        event.status === 'Published' ? 'bg-green-100 text-green-700' :
                        event.status === 'Completed' ? 'bg-blue-100 text-blue-700' :
                        event.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {event.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <p className="text-gray-800 font-medium">{event.rsvps}/{event.max_capacity}</p>
                        <div className="w-16 bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className="bg-blue-500 h-2 rounded-full" 
                            style={{ width: `${(event.rsvps / event.max_capacity) * 100}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <p className="text-gray-800 font-medium">{event.feedback_count}</p>
                        <p className="text-gray-600">reviews</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <motion.button
                          onClick={() => {
                            setSelectedEvent(event);
                            setIsEventModalOpen(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          whileHover={{ scale: 1.1 }}
                        >
                          <Edit className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          onClick={() => handleDeleteEvent(event.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          whileHover={{ scale: 1.1 }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          onClick={() => handleExportRSVPs(event.id)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          whileHover={{ scale: 1.1 }}
                        >
                          <Download className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center space-x-2">
            <motion.button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className={`p-2 rounded-lg ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
              whileHover={{ scale: currentPage === 1 ? 1 : 1.1 }}
            >
              <ChevronLeft className="w-5 h-5" />
            </motion.button>
            
            {[...Array(totalPages)].map((_, index) => (
              <motion.button
                key={index}
                onClick={() => setCurrentPage(index + 1)}
                className={`px-3 py-1 rounded-lg ${
                  currentPage === index + 1 
                    ? 'bg-blue-500 text-white' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                whileHover={{ scale: 1.1 }}
              >
                {index + 1}
              </motion.button>
            ))}
            
            <motion.button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className={`p-2 rounded-lg ${currentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
              whileHover={{ scale: currentPage === totalPages ? 1 : 1.1 }}
            >
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          </div>
        )}
      </motion.div>
    );
  };

  const renderRSVPs = () => {
  // Filter RSVPs based on selected filters
  const filteredRSVPs = rsvps.filter(rsvp => {
    const event = events.find(e => e.id === rsvp.event_id);
    if (!event) return false;
    
    // Apply status filter
    if (filter === 'past' && new Date(event.event_date) >= new Date()) return false;
    if (filter === 'upcoming' && new Date(event.event_date) < new Date()) return false;
    if (filter === 'cancelled' && rsvp.status !== 'cancelled') return false;
    
    // Apply event name filter
    if (eventFilter && !event.title.toLowerCase().includes(eventFilter.toLowerCase())) {
      return false;
    }
    
    return true;
  }).sort((a, b) => {
    const eventA = events.find(e => e.id === a.event_id);
    const eventB = events.find(e => e.id === b.event_id);
    
    // Apply sorting
    switch (sortBy) {
      case 'date':
        return new Date(a.rsvp_time).getTime() - new Date(b.rsvp_time).getTime();
      case 'name':
        return (a.user_name || '').localeCompare(b.user_name || '');
      case 'event':
        return (eventA?.title || '').localeCompare(eventB?.title || '');
      default:
        return 0;
    }
  });

  // Get unique event names for filter dropdown
  const eventNames = [...new Set(events.map(event => event.title))];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-800">RSVP Management</h2>
        <div className="flex flex-col md:flex-row gap-4">
          <motion.button
            onClick={() => handleExportRSVPs()}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Download className="w-5 h-5 mr-2 inline" />
            Export All RSVPs
          </motion.button>
        </div>
      </div>

      {/* Filter Controls */}
      <motion.div 
        variants={itemVariants}
        className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Time Filter</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All RSVPs</option>
              <option value="upcoming">Upcoming Events</option>
              <option value="past">Past Events</option>
              <option value="cancelled">Cancelled RSVPs</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Event Filter</label>
            <select
              value={eventFilter}
              onChange={(e) => setEventFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Events</option>
              {eventNames.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="date">RSVP Date</option>
              <option value="name">Attendee Name</option>
              <option value="event">Event Name</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* RSVPs Table */}
      <motion.div 
        variants={itemVariants}
        className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Attendee</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Event</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Event Date</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">RSVP Date</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
                {filteredRSVPs.length > 0 ? (
                filteredRSVPs
                  .filter((rsvp) => rsvp.user_email && rsvp.user_id && rsvp.user_name)
                  .map((rsvp, index) => {
                  const event = events.find((e) => e.id === rsvp.event_id);
                  return (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                      <p className="font-semibold text-gray-800">{rsvp.user_name || 'Unknown User'}</p>
                      <p className="text-sm text-gray-600">{rsvp.user_email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-800">{event?.title || 'Event not found'}</p>
                      <p className="text-xs text-gray-500">{event?.location}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {event ? formatDate(event.event_date) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(rsvp.rsvp_time)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
                      rsvp.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                      {rsvp.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <motion.button
                      onClick={() => handleDownloadRSVPbyEvent(rsvp.event_id)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      whileHover={{ scale: 1.1 }}
                      >
                      <Download className="w-4 h-4" />
                      </motion.button>
                    </td>
                    </tr>
                  );
                  })
                ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  No RSVPs found matching your filters
                  </td>
                </tr>
                )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* RSVP Stats */}
      <motion.div 
        variants={itemVariants}
        className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
      >
        <h3 className="text-xl font-bold text-gray-800 mb-6">RSVP Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-xl font-bold text-white">{rsvps.length}</span>
            </div>
            <h4 className="font-semibold text-gray-800">Total RSVPs</h4>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-xl font-bold text-white">
                {rsvps.filter(r => r.status === 'confirmed').length}
              </span>
            </div>
            <h4 className="font-semibold text-gray-800">Confirmed</h4>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-xl font-bold text-white">
                {rsvps.filter(r => r.status === 'cancelled').length}
              </span>
            </div>
            <h4 className="font-semibold text-gray-800">Cancelled</h4>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

  const renderCertificates = () => (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Certificate Management</h2>
        <motion.button
          onClick={() => setIsCertModalOpen(true)}
          className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Award className="w-5 h-5 mr-2 inline" />
          Generate Certificates
        </motion.button>
      </div>

      <motion.div 
        variants={itemVariants}
        className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Event</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Recipient</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Issued On</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {certificates.map(cert => (
                <tr key={cert.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-gray-800">{cert.event_name || 'General Certificate'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-semibold text-gray-800">{cert.recipient || 'Unknown User'}</p>
                      <p className="text-sm text-gray-600">{cert.user_email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {formatDate(cert.generated_at)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <motion.a
                        href={cert.certificate_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        whileHover={{ scale: 1.1 }}
                      >
                        <Eye className="w-4 h-4" />
                      </motion.a>
                      <motion.a
                        href={cert.certificate_url}
                        download
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        whileHover={{ scale: 1.1 }}
                      >
                        <Download className="w-4 h-4" />
                      </motion.a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );

  const renderFeedback = () => (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Event Feedback</h2>
        <motion.button
          onClick={handleExportFeedback}
          className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Download className="w-5 h-5 mr-2 inline" />
          Export Feedback
        </motion.button>
      </div>

      {/* Feedback Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          variants={itemVariants}
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
        >
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Total Feedback</h3>
            <p className="text-3xl font-bold text-blue-500">{feedback.length}</p>
          </div>
        </motion.div>
        
        <motion.div 
          variants={itemVariants}
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
        >
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Average Rating</h3>
            <p className="text-3xl font-bold text-yellow-500">{getStats().avgRating}★</p>
          </div>
        </motion.div>
        
        <motion.div 
          variants={itemVariants}
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
        >
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Response Rate</h3>
            <p className="text-3xl font-bold text-green-500">
              {events.length > 0 ? Math.round((feedback.length / events.length) * 100) : 0}%
            </p>
          </div>
        </motion.div>
      </div>

      {/* Feedback List */}
      <motion.div 
        variants={itemVariants}
        className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
      >
        <h3 className="text-xl font-bold text-gray-800 mb-6">Recent Feedback</h3>
        <div className="space-y-6">
          {feedback.slice(0, 10).map(item => (
            <div key={item.id} className="border-l-4 border-yellow-500 pl-6 py-4 bg-gray-50 rounded-r-xl">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-gray-800">{item.event_title}</h4>
                  <p className="text-sm text-gray-600">{item.user_name || 'Anonymous'}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < item.rating ? 'fill-current' : ''}`} />
                    ))}
                  </div>
                  <span className="text-sm text-gray-500">{getTimeSince(item.submitted_at)}</span>
                </div>
              </div>
              {item.comment && (
                <p className="text-gray-700 italic">"{item.comment}"</p>
              )}
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );

  const renderSubscriptions = () => (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Club Subscriptions</h2>
        <motion.button
          onClick={() => setIsNotificationModalOpen(true)}
          className="px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Send className="w-5 h-5 mr-2 inline" />
          Send Notification
        </motion.button>
      </div>

      {/* Subscription Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div 
          variants={itemVariants}
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Subscription Stats</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Subscribers:</span>
              <span className="font-bold text-gray-800">{subscriptions.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Active Subscribers:</span>
              <span className="font-bold text-green-600">{subscriptions.filter(s => s.status === 'active').length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Unsubscribed:</span>
              <span className="font-bold text-red-600">{subscriptions.filter(s => s.status === 'unsubscribed').length}</span>
            </div>
          </div>
        </motion.div>

        {/* Subscriber Growth Chart */}
        <motion.div 
          variants={itemVariants}
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Subscriber Growth</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={analytics?.subscriber_growth || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="count" 
                stroke="#14B8A6" 
                strokeWidth={3}
                dot={{ fill: '#14B8A6', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Subscribers List */}
      <motion.div 
        variants={itemVariants}
        className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Subscriber</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Subscribed Since</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {subscriptions.map(sub => (
                <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-semibold text-gray-800">{sub.user_name || 'Unknown User'}</p>
                      <p className="text-sm text-gray-600">{sub.user_email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {formatDate(sub.subscribed_at)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
                      sub.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                        {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
      <h2 className="text-2xl font-bold text-gray-800">Analytics Dashboard</h2>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Events', value: analytics?.total_events || 0, icon: Calendar, color: 'from-blue-500 to-indigo-500', change: '+12%' },
          { label: 'Total RSVPs', value: analytics?.total_rsvps || 0, icon: Users, color: 'from-green-500 to-emerald-500', change: '+8%' },
          { label: 'Certificates', value: analytics?.total_certificates || 0, icon: Award, color: 'from-yellow-500 to-orange-500', change: '+15%' },
          { label: 'Subscribers', value: analytics?.total_subscribers || 0, icon: Bell, color: 'from-purple-500 to-pink-500', change: '+22%' }
        ].map((metric, index) => (
          <motion.div
            key={metric.label}
            variants={itemVariants}
            whileHover={cardVariants.hover}
            className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
          >
            <div className="flex items-center justify-between mb-4">
              <motion.div 
                className={`w-12 h-12 bg-gradient-to-r ${metric.color} rounded-xl flex items-center justify-center shadow-lg`}
                whileHover={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 0.5 }}
              >
                <metric.icon className="w-6 h-6 text-white" />
              </motion.div>
              <span className="text-green-500 text-sm font-semibold">{metric.change}</span>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">{metric.label}</h3>
            <p className="text-3xl font-bold text-gray-900">{metric.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Event Engagement Comparison Chart */}
        <motion.div 
            variants={itemVariants}
            className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
          >
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
              <BarChart className="w-6 h-6 mr-2 text-indigo-500" />
              Event Engagement Comparison
            </h3>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart
                data={events.map(event => ({
                  name: event.title.length > 12 ? `${event.title.substring(0, 12)}...` : event.title,
                  feedbackCount: feedback.filter(f => f.event_id === event.id).length,
                  avgRating: feedback.filter(f => f.event_id === event.id).reduce((acc, curr) => acc + curr.rating, 0) / 
                            (feedback.filter(f => f.event_id === event.id).length || 1),
                  certificates: certificates.filter(c => c.event_id === event.id).length
                })).sort((a, b) => b.feedbackCount - a.feedbackCount).slice(0, 8)}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end" 
                  height={70}
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                />
                <YAxis yAxisId="left" orientation="left" stroke="#4F46E5" />
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  stroke="#10B981" 
                  domain={[0, 5]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value, name) => {
                    if (name === 'Avg Rating' && typeof value === 'number') return [value.toFixed(1), name];
                    return [value, name];
                  }}
                />
                <Legend />
                <Bar 
                  yAxisId="left"
                  dataKey="feedbackCount" 
                  name="Feedback Received"
                  fill="#4F46E5" 
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  yAxisId="left"
                  dataKey="certificates" 
                  name="Certificates Issued"
                  fill="#6366F1" 
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  yAxisId="right"
                  dataKey="avgRating" 
                  name="Avg Rating"
                  fill="#10B981" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-sm text-gray-500 mt-2">
              Compares engagement metrics across events - feedback volume, certificates issued, and average ratings
            </p>
          </motion.div>

        {/* RSVP Trends Chart */}
        <motion.div 
          variants={itemVariants}
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
        >
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
            <TrendingUp className="w-6 h-6 mr-2 text-green-500" />
            RSVP Trends
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={analytics?.rsvp_trends || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="count" 
                stroke="#10B981" 
                fill="#10B981" 
                fillOpacity={0.2}
                strokeWidth={3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Feedback Distribution */}
        <motion.div 
          variants={itemVariants}
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
        >
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
            <Star className="w-6 h-6 mr-2 text-yellow-500" />
            Feedback Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analytics?.feedback_pie || []}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ rating, percent }) => `${rating}★ ${((percent ?? 0) * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {(analytics?.feedback_pie || []).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Subscriber Growth */}
        <motion.div 
          variants={itemVariants}
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
        >
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
            <Users className="w-6 h-6 mr-2 text-purple-500" />
            Subscriber Growth
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics?.subscriber_growth || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="count" 
                stroke="#8B5CF6" 
                strokeWidth={3}
                dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Performance Summary */}
      <motion.div 
        variants={itemVariants}
        className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
      >
        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
          <Target className="w-6 h-6 mr-2 text-green-500" />
          Performance Summary
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-white">{getStats().completedEvents}</span>
            </div>
            <h4 className="font-semibold text-gray-800">Completed Events</h4>
            <p className="text-sm text-gray-600">Successfully organized</p>
          </div>
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-white">{getStats().avgRating}</span>
            </div>
            <h4 className="font-semibold text-gray-800">Average Rating</h4>
            <p className="text-sm text-gray-600">Event satisfaction</p>
          </div>
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-white">{getStats().upcomingEvents}</span>
            </div>
            <h4 className="font-semibold text-gray-800">Upcoming Events</h4>
            <p className="text-sm text-gray-600">Scheduled ahead</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );

  const renderSettings = () => (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <h2 className="text-2xl font-bold text-gray-800">Club Settings</h2>

      {/* Club Stats */}
      <motion.div 
        variants={itemVariants}
        className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
      >
        <h3 className="text-xl font-bold text-gray-800 mb-6">Club Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-500">{events.length}</p>
            <p className="text-sm text-gray-600">Total Events</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-500">{committee.length}</p>
            <p className="text-sm text-gray-600">Committee Members</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-500">{subscriptions.filter(s => s.status === 'active').length}</p>
            <p className="text-sm text-gray-600">Active Subscribers</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-500">{certificates.length}</p>
            <p className="text-sm text-gray-600">Certificates Issued</p>
          </div>
        </div>
      </motion.div>

      {/* Club Information */}
      <motion.div 
        variants={itemVariants}
        className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
      >
        <h3 className="text-xl font-bold text-gray-800 mb-6">Club Information</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Club Name</label>
            <input
              type="text"
              value={clubSettings.name}
              onChange={(e) => setClubSettings({ ...clubSettings, name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
            <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={clubSettings.description}
              onChange={(e) => setClubSettings({ ...clubSettings, description: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            </div>

            <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Logo URL</label>
            <input
              type="url"
              value={clubSettings.logo_url}
              onChange={(e) => setClubSettings({ ...clubSettings, logo_url: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

            <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">About (HTML)</label>
            <textarea
              value={clubSettings.about_html}
              onChange={(e) => setClubSettings({ ...clubSettings, about_html: e.target.value })}
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            />
            <div className="mt-4 p-4 border border-gray-300 rounded-lg bg-gray-50">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Preview:</h4>
              <div
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: clubSettings.about_html }}
              />
            </div>
            </div>
          
          <motion.button
            onClick={handleUpdateClubSettings}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Save Changes
          </motion.button>
        </div>
      </motion.div>

      

      {/* Account Actions */}
      <motion.div 
        variants={itemVariants}
        className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
      >
        <h3 className="text-xl font-bold text-gray-800 mb-6">Account Actions</h3>
        <div className="space-y-4">
          <motion.button
            onClick={logout}
            className="w-full px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Logout
          </motion.button>
        </div>
      </motion.div>

      {/* Danger Zone */}
      <motion.div 
        variants={itemVariants}
        className="bg-red-50 border border-red-200 rounded-2xl p-6 shadow-lg"
      >
        <h3 className="text-xl font-bold text-red-800 mb-4">Danger Zone</h3>
        <p className="text-red-700 mb-4">
          Once you delete your club, there is no going back. Please be certain.
        </p>
        <motion.button
          onClick={handleDeleteClub}
          className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Delete Club
        </motion.button>
      </motion.div>
    </motion.div>
  );

  // Main render function
  const renderActiveSection = () => {
    switch (activeSection) {
      case 'dashboard': return renderDashboard();
      case 'committee': return renderCommittee();
      case 'events': return renderEvents();
      case 'rsvps': return renderRSVPs();
      case 'certificates': return renderCertificates();
      case 'feedback': return renderFeedback();
      case 'subscriptions': return renderSubscriptions();
      case 'analytics': return renderAnalytics();
      case 'settings': return renderSettings();
      default: return renderDashboard();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!clubData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Club Not Found</h2>
          <p className="text-gray-600">The club you're looking for doesn't exist or you don't have access to it.</p>
        </div>
      </div>
    );
  }

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
              <img 
                src={clubData.logo_url || '/placeholder.svg'} 
                alt={clubData.name}
                className="w-12 h-12 rounded-xl object-cover shadow-lg"
              />
              <div>
                <h1 className="text-xl font-bold text-gray-800">{clubData.name}</h1>
                <p className="text-sm text-gray-600">Club Dashboard</p>
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
                {item.id === 'committee' && committee.length > 0 && (
                  <span className="bg-blue-100 text-blue-700 text-xs rounded-full px-2 py-1 ml-auto">
                    {committee.length}
                  </span>
                )}
                {item.id === 'events' && events.length > 0 && (
                  <span className="bg-orange-100 text-orange-700 text-xs rounded-full px-2 py-1 ml-auto">
                    {events.length}
                  </span>
                )}
                {item.id === 'subscriptions' && subscriptions.filter(s => s.status === 'active').length > 0 && (
                  <span className="bg-teal-100 text-teal-700 text-xs rounded-full px-2 py-1 ml-auto">
                    {subscriptions.filter(s => s.status === 'active').length}
                  </span>
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
                  {activeSection}
                </h2>
                <p className="text-sm text-gray-600">
                  {activeSection === 'dashboard' && `Manage ${clubData.name}`}
                  {activeSection === 'committee' && 'Manage committee members'}
                  {activeSection === 'events' && 'Create and manage events'}
                  {activeSection === 'rsvps' && 'View event registrations'}
                  {activeSection === 'certificates' && 'Generate and manage certificates'}
                  {activeSection === 'feedback' && 'Monitor event feedback'}
                  {activeSection === 'subscriptions' && 'Manage club subscribers'}
                  {activeSection === 'analytics' && 'View club performance'}
                  {activeSection === 'settings' && 'Configure club settings'}
                </p>
              </div>
            </div>
            
            <div className="relative">
              <motion.div 
              className="flex items-center space-x-2 cursor-pointer"
              whileHover={{ scale: 1.05 }}
              onClick={() => setLogoutOpen(!logoutOpen)}
              >
              <img 
                src={clubData.logo_url || '/placeholder.svg'} 
                alt={clubData.name}
                className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
              />
              <div className="hidden md:block">
                <p className="text-sm font-semibold text-gray-800">{clubData.name}</p>
                <p className="text-xs text-gray-600">Club Admin</p>
              </div>
              </motion.div>

              {logoutOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
              >
                <div className="py-2">
                <motion.button
                  onClick={logout}
                  className="w-full px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-red-500 to-red-600 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Logout
                </motion.button>
                </div>
              </motion.div>
              )}
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
                : toast.type === 'error'
                ? 'bg-gradient-to-r from-red-500 to-red-600'
                : 'bg-gradient-to-r from-blue-500 to-indigo-500'
            }`}
          >
            <div className="flex items-center space-x-2">
              {toast.type === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : toast.type === 'error' ? (
                <XCircle className="w-5 h-5" />
              ) : (
                <Info className="w-5 h-5" />
              )}
              <span>{toast.message}</span>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Event Modal */}
      <AnimatePresence>
        {isEventModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setIsEventModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <h3 className="text-2xl font-bold text-gray-800 mb-6">
                {selectedEvent ? 'Edit Event' : 'Create New Event'}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Event Title</label>
                  <input
                    type="text"
                    value={selectedEvent ? selectedEvent.title : newEvent.title}
                    onChange={(e) => {
                      if (selectedEvent) {
                        setSelectedEvent({ ...selectedEvent, title: e.target.value });
                      } else {
                        setNewEvent({ ...newEvent, title: e.target.value });
                      }
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={selectedEvent ? selectedEvent.description : newEvent.description}
                    onChange={(e) => {
                      if (selectedEvent) {
                        setSelectedEvent({ ...selectedEvent, description: e.target.value });
                      } else {
                        setNewEvent({ ...newEvent, description: e.target.value });
                      }
                    }}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                    <input
                      type="date"
                      value={selectedEvent ? selectedEvent.event_date : newEvent.event_date}
                      onChange={(e) => {
                        if (selectedEvent) {
                          setSelectedEvent({ ...selectedEvent, event_date: e.target.value });
                        } else {
                          setNewEvent({ ...newEvent, event_date: e.target.value });
                        }
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                    <input
                      type="time"
                      value={selectedEvent ? selectedEvent.time : newEvent.time}
                      onChange={(e) => {
                        if (selectedEvent) {
                          setSelectedEvent({ ...selectedEvent, time: e.target.value });
                        } else {
                          setNewEvent({ ...newEvent, time: e.target.value });
                        }
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <input
                    type="text"
                    value={selectedEvent ? selectedEvent.location : newEvent.location}
                    onChange={(e) => {
                      if (selectedEvent) {
                        setSelectedEvent({ ...selectedEvent, location: e.target.value });
                      } else {
                        setNewEvent({ ...newEvent, location: e.target.value });
                      }
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Max Capacity</label>
                    <input
                      type="number"
                      value={selectedEvent ? selectedEvent.max_capacity : newEvent.max_capacity}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0;
                        if (selectedEvent) {
                          setSelectedEvent({ ...selectedEvent, max_capacity: value });
                        } else {
                          setNewEvent({ ...newEvent, max_capacity: value });
                        }
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                      value={selectedEvent ? selectedEvent.status : newEvent.status}
                      onChange={(e) => {
                        const value = e.target.value as 'Draft' | 'Published' | 'Completed' | 'Cancelled';
                        if (selectedEvent) {
                          setSelectedEvent({ ...selectedEvent, status: value });
                        } else {
                          setNewEvent({ ...newEvent, status: value });
                        }
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Draft">Draft</option>
                      <option value="Published">Published</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Poster URL</label>
                  <input
                    type="url"
                    value={selectedEvent ? selectedEvent.poster_url || '' : newEvent.poster_url || ''}
                    onChange={(e) => {
                      if (selectedEvent) {
                        setSelectedEvent({ ...selectedEvent, poster_url: e.target.value });
                      } else {
                        setNewEvent({ ...newEvent, poster_url: e.target.value });
                      }
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Custom HTML</label>
                  <textarea
                    rows={6}
                    placeholder="Paste custom HTML here..."
                    value={selectedEvent ? selectedEvent.custom_html || '' : newEvent.custom_html || ''}
                    onChange={(e) => {
                      if (selectedEvent) {
                        setSelectedEvent({ ...selectedEvent, custom_html: e.target.value });
                      } else {
                        setNewEvent({ ...newEvent, custom_html: e.target.value });
                      }
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  />
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Live HTML Preview</label>
                  <div className="border border-gray-300 rounded-lg p-4 bg-white">
                    <div
                      className="prose max-w-none"
                      dangerouslySetInnerHTML={{
                        __html: selectedEvent ? selectedEvent.custom_html || '' : newEvent.custom_html || ''
                      }}
                    />
                  </div>
                </div>


                <div className="flex space-x-4 pt-4">
                  <motion.button
                    onClick={() => setIsEventModalOpen(false)}
                    className="flex-1 px-6 py-3 bg-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    onClick={() => {
                      if (selectedEvent) {
                        handleEditEvent(selectedEvent.id, {
                          title: selectedEvent.title,
                          description: selectedEvent.description,
                          event_date: selectedEvent.event_date,
                          time: selectedEvent.time,
                          location: selectedEvent.location,
                          max_capacity: selectedEvent.max_capacity,
                          status: selectedEvent.status,
                          poster_url: selectedEvent.poster_url,
                          custom_html: selectedEvent.custom_html
                        });
                      } else {
                        handleCreateEvent(newEvent);
                      }
                    }}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {selectedEvent ? 'Update Event' : 'Create Event'}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Member Modal */}
      <AnimatePresence>
        {isMemberModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => {
              setIsMemberModalOpen(false);
              setSearchTerm('');
              setSuggestions([]);
              setSelectedCommitteeMember(null);
              setIsEditingCommitteeMember(false);
            }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 w-full max-w-lg"
            >
              <h3 className="text-2xl font-bold text-gray-800 mb-6">
                {isEditingCommitteeMember ? 'Edit Committee Member' : 'Add Committee Member'}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search Members</label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      if (!isEditingCommitteeMember) {
                        setSelectedCommitteeMember(null);
                      }
                    }}
                    placeholder="Type name or email..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />

                  {suggestions.length > 0 && !isEditingCommitteeMember && (
                    <div className="mt-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
                      {suggestions.map((user) => (
                        <div
                          key={user.id}
                          onClick={() => {
                            setSelectedCommitteeMember(user);
                            setSearchTerm(`${user.name} (${user.email})`);
                            setSuggestions([]);
                          }}
                          className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0"
                        >
                          <p className="font-medium text-gray-800">{user.name}</p>
                          <p className="text-sm text-gray-600">{user.email}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                  <select
                    value={selectedCommitteeMember?.role || 'member'}
                    onChange={(e) => {
                      if (selectedCommitteeMember) {
                        setSelectedCommitteeMember({
                          ...selectedCommitteeMember,
                          role: e.target.value as 'member' | 'editor' | 'secretary',
                        });
                      }
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="member">Member</option>
                    <option value="editor">Editor</option>
                    <option value="secretary">Secretary</option>
                  </select>
                </div>

                {selectedCommitteeMember && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-800">{selectedCommitteeMember.name}</h4>
                    <p className="text-sm text-gray-600">{selectedCommitteeMember.email}</p>
                  </div>
                )}

                <div className="flex space-x-4 pt-4">
                  <motion.button
                    onClick={() => {
                      setIsMemberModalOpen(false);
                      setSearchTerm('');
                      setSuggestions([]);
                      setSelectedCommitteeMember(null);
                      setIsEditingCommitteeMember(false);
                    }}
                    className="flex-1 px-6 py-3 bg-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    onClick={() => {
                      if (selectedCommitteeMember) {
                        if (isEditingCommitteeMember) {
                          handleEditCommitteeMember(
                            selectedCommitteeMember.id,
                            selectedCommitteeMember.role || 'member'
                          );
                        } else {
                          handleAddCommitteeMember(
                            selectedCommitteeMember.id,
                            selectedCommitteeMember.role || 'member'
                          );
                        }
                      }
                    }}
                    disabled={!selectedCommitteeMember}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    whileHover={{ scale: selectedCommitteeMember ? 1.02 : 1 }}
                    whileTap={{ scale: selectedCommitteeMember ? 0.98 : 1 }}
                  >
                    {isEditingCommitteeMember ? 'Update Member' : 'Add Member'}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Certificate Modal */}
      <AnimatePresence>
        {isCertModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setIsCertModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Generate Certificates</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Event</label>
                  <select
                    value={selectedEventId}
                    onChange={(e) => setSelectedEventId(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">-- Choose an event --</option>
                    {events.map((event) => (
                      <option key={event.id} value={event.id}>{event.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Recipients</label>
                  <input
                    type="text"
                    placeholder="Type email to search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />

                  {searchQuery && matchingUsers.length > 0 && (
                    <div className="mt-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
                      {matchingUsers
                        .filter((user) => !selectedUserIds.includes(user.id))
                        .map((user) => (
                          <div
                            key={user.id}
                            onClick={() => {
                              setSelectedUserIds((prev) => [...prev, user.id]);
                              setSelectedUsers((prev) => [...prev, user]);
                              setSearchQuery('');
                              setMatchingUsers([]);
                            }}
                            className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0"
                          >
                            <p className="font-medium text-gray-800">{user.name}</p>
                            <p className="text-sm text-gray-600">{user.email}</p>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                {selectedUsers.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Selected Recipients</label>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {selectedUsers.map((user) => (
                        <div key={user.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                          <span className="text-sm text-gray-800">{user.name} ({user.email})</span>
                          <motion.button
                            onClick={() => {
                              setSelectedUserIds(selectedUserIds.filter(id => id !== user.id));
                              setSelectedUsers(selectedUsers.filter(u => u.id !== user.id));
                            }}
                            className="text-red-500 hover:text-red-700 transition-colors"
                            whileHover={{ scale: 1.1 }}
                          >
                            <X className="w-4 h-4" />
                          </motion.button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Custom Certificate HTML (Required)</label>
                  <textarea
                    rows={6}
                    placeholder="<html>...</html>"
                    value={customHtml}
                    onChange={(e) => setCustomHtml(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  />
                </div>

                <div className="flex space-x-4 pt-4">
                  <motion.button
                    onClick={() => {
                      setIsCertModalOpen(false);
                      setSelectedEventId('');
                      setSelectedUserIds([]);
                      setSelectedUsers([]);
                      setCustomHtml('');
                    }}
                    className="flex-1 px-6 py-3 bg-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    onClick={handleGenerateCertificates}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Generate Certificates
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notification Modal */}
      <AnimatePresence>
        {isNotificationModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setIsNotificationModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 w-full max-w-lg"
            >
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Send Notification</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Event</label>
                  <select
                    value={selectedEventId || ''}
                    onChange={(e) => setSelectedEventId(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="" disabled>Select an event</option>
                    {events.map((e) => (
                      <option key={e.id} value={e.id}>{e.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="What's the update?"
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex space-x-4 pt-4">
                  <motion.button
                    onClick={() => {
                      setIsNotificationModalOpen(false);
                      setMessage('');
                      setSelectedEventId('');
                    }}
                    className="flex-1 px-6 py-3 bg-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    onClick={handleSendNotification}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Send Notification
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
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