'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiUsers, 
  FiCalendar, 
  FiCheckCircle, 
  FiXCircle, 
  FiSettings,
  FiMail,
  FiDownload,
  FiEdit,
  FiTrash2,
  FiPlus,
  FiSearch,
  FiFilter,
  FiChevronDown,
  FiChevronUp,
  FiExternalLink,
  FiBarChart2,
  FiPieChart,
  FiRefreshCw,
  FiMoreVertical,
  FiUserPlus,
  FiUserMinus,
  FiAward,
  FiMessageSquare,
  FiEye,
  FiBell,
  FiLock,
  FiClock,
  FiArchive,
  FiMenu,
  FiMapPin
} from 'react-icons/fi';
import { 
  FaRegUserCircle,
  FaChartLine,
  FaRegBookmark,
  FaBookmark,
  FaUniversity,
  FaRegStar,
  FaStar
} from 'react-icons/fa';
import { Bar, Pie, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { toast } from 'react-hot-toast';
import { useParams, usePathname } from 'next/navigation';
import io from 'socket.io-client'

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Types
type User = {
  id: string;
  name: string;
  email: string;
  profile_pic?: string;
  role: 'member' | 'editor' | 'secretary';
  joined_at: string;
  last_active: string;
};

type Event = {
  id: string;
  title: string;
  description: string;
  event_date: string;
  time: string;
  location: string;
  image_url?: string;
  rsvps: number;
  views: number;
  max_capacity: number;
  status: 'Draft' | 'Published' | 'Completed' | 'Cancelled';
  feedback_count: number;
  certificates_generated: number;
  created_at: string;
};

type Certificate = {
  id: string;
  event_id: string;
  user_id: string;
  certificate_url: string;
  generated_at: string;
};

type Feedback = {
  id: string;
  event_id: string;
  user_id: string;
  rating: number;
  comment?: string;
  created_at: string;
};

type Subscription = {
  id: string;
  user_id: string;
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

export default function ClubDashboard() {
  const pathname = usePathname();
  const params = useParams();
  const clubId = params.club_id as string; // /clubs/[club_id]/dashboard
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [clubData, setClubData] = useState<any>(null);
  const [committee, setCommittee] = useState<User[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCommitteeMember, setSelectedCommitteeMember] = useState<User | null>(null);

//Added by me
const [searchTerm, setSearchTerm] = useState('');
const [suggestions, setSuggestions] = useState<User[]>([]);
const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
const [newEvent, setNewEvent] = useState<Partial<Event>>({
  title: '',
  description: '',
  event_date: '',
  time: '',
  location: '',
  max_capacity: 0,
  status: 'Draft',
  image_url: '',
});
const [isEditingCommitteeMember, setIsEditingCommitteeMember] = useState(false); // Required for edit vs add
const [isCertModalOpen, setIsCertModalOpen] = useState(false);
const [selectedEventId, setSelectedEventId] = useState('');
const [userIdsInput, setUserIdsInput] = useState('');
const [customHtml, setCustomHtml] = useState('');;
const [matchingUsers, setMatchingUsers] = useState<User[]>([]);
const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
const [eventsWithCounts, setEventsWithCounts] = useState<(Event & { certificates_generated: number })[]>([]);
const [rsvpCounts, setRsvpCounts] = useState<Record<string, number>>({});
const [dropdownOpen, setDropdownOpen] = useState(false);
const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
const [message, setMessage] = useState('');  
const socket = io("http://localhost:5000", {
  transports: ["websocket"],
  reconnectionAttempts: 5,
});
const [eventsWithRsvps, setEventsWithRsvps] = useState<Event[]>([]);
const [rsvpTrendsData, setRsvpTrendsData] = useState<{
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    fill: boolean;
    borderColor: string;
    tension: number;
  }[];
}>({
  labels: [],
  datasets: [],
});

  // Fetch all data for the dashboard
  const fetchData = useCallback(async () => {
    if (!clubId) return;

    setLoading(true);
    try {
      const [
        clubRes,
        committeeRes,
        eventsRes,
        certificatesRes,
        feedbackRes,
        subscriptionsRes,
        analyticsRes
      ] = await Promise.all([
        fetch(`http://localhost:5000/api/club/${clubId}`, { credentials: 'include' }),
        fetch(`http://localhost:5000/api/clubs/${clubId}/committee`, { credentials: 'include' }),
        fetch(`http://localhost:5000/api/club/${clubId}/events`, { credentials: 'include' }),
        fetch(`http://localhost:5000/api/clubs/${clubId}/certificates`, { credentials: 'include' }),
        fetch(`http://localhost:5000/api/clubs/${clubId}/feedbacks`, { credentials: 'include' }),
        fetch(`http://localhost:5000/api/club/${clubId}/subscriptions`, { credentials: 'include' }),
        fetch(`http://localhost:5000/api/clubs/${clubId}/dashboard/analytics`, { credentials: 'include' })
      ]);

      if (!clubRes.ok) throw new Error('Failed to fetch club data');
      if (!committeeRes.ok) throw new Error('Failed to fetch committee data');
      if (!eventsRes.ok) throw new Error('Failed to fetch events data');
      if (!certificatesRes.ok) throw new Error('Failed to fetch certificates data');
      if (!feedbackRes.ok) throw new Error('Failed to fetch feedback data');
      if (!subscriptionsRes.ok) throw new Error('Failed to fetch subscriptions data');
      if (!analyticsRes.ok) throw new Error('Failed to fetch analytics data');

      const club = await clubRes.json();
      const committee = await committeeRes.json();
      const events = await eventsRes.json();
      const certificates = await certificatesRes.json();
      const feedbackData = await feedbackRes.json();
      const subs = await subscriptionsRes.json();
      const analyticsData = await analyticsRes.json();

      // Fetch additional analytics if needed
      const [feedbackPieRes, subsGrowthRes, rsvpsRes] = await Promise.all([
        fetch(`http://localhost:5000/api/clubs/${clubId}/feedback-pie`, { credentials: 'include' }),
        fetch(`http://localhost:5000/api/clubs/${clubId}/subscriber-growth`, { credentials: 'include' }),
        fetch(`http://localhost:5000/api/clubs/${clubId}/rsvps`, { credentials: 'include' })
      ]);

      const feedbackPie = feedbackPieRes.ok ? await feedbackPieRes.json() : [];
      const subscriberGrowth = subsGrowthRes.ok ? await subsGrowthRes.json() : [];
      const rsvpsData = rsvpsRes.ok ? await rsvpsRes.json() : [];
      console.log("RSVPs Data:", rsvpsData);
      setClubData(club);
      setCommittee(committee);
      setEvents(events);
      setCertificates(certificates);
      setFeedback(feedbackData);
      setSubscriptions(subs);
      setEventsWithRsvps(rsvpsData);

      setAnalytics({
        total_events: events.length,
        total_rsvps: events.reduce((sum: number, event: Event) => sum + event.rsvps, 0),
        total_certificates: certificates.length,
        total_subscribers: subs.filter((s: Subscription) => s.status === 'active').length,
        monthly_views: analyticsData.monthly_views,
        rsvp_trends: analyticsData.rsvp_trends,
        feedback_pie: feedbackPie,
        subscriber_growth: subscriberGrowth
      });
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [clubId]);

  // Load data on mount and when clubId changes
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  //Added by me
useEffect(() => {
  // 🛑 Guard clause: avoid running until both search term and university_id exist
  console.log("Use Effect triggered", searchTerm, clubData?.university_id);
  if (!searchTerm || searchTerm.length < 2 || !clubData?.university_id) {
    setSuggestions([]);
    return;
  }

  const controller = new AbortController();

  const fetchSuggestions = async () => {
    try {
      setIsLoadingSuggestions(true);

      const res = await fetch(
        `http://localhost:5000/api/club/users/search?q=${encodeURIComponent(searchTerm)}&universityId=${clubData.university_id}`,
        {
          signal: controller.signal,
          credentials: 'include',
        }
      );

      if (!res.ok) {
        console.error('Failed to fetch suggestions');
        return;
      }

      const data = await res.json();
      setSuggestions(data);
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Error fetching suggestions:', err);
      }
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  fetchSuggestions();

  return () => controller.abort(); // cleanup on unmount or input change
}, [searchTerm, clubData?.university_id]);


async function issueCertificates(eventId: string, userIds: string[], html: string) {
  const payload = {
    eventId,
    userIds,
    customHtml: html,
  };
  console.log("Issuing certificates with payload:", payload);

  const res = await fetch(`http://localhost:5000/api/clubs/${clubId}/certificates/generate`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  console.log("Response from certificate generation:", res);

  if (!res.ok) {
    const text = await res.text();
    console.error('Server error:', text);
    throw new Error('Certificate generation failed');
  }

  return res.json();
}

useEffect(() => {
  if (!searchQuery) return;

const delayDebounceFn = setTimeout(async () => {
  try {
    const res = await fetch(
      `http://localhost:5000/api/club/users/search?q=${encodeURIComponent(searchQuery)}&universityId=${clubData?.university_id}`,
      { credentials: 'include' }
    );
    console.log("Response from user search:", res);
    if(res.ok){
      const data = await res.json();
      setMatchingUsers(data || []);
    }
  } catch (error) {
    console.error('Error fetching users:', error);
  }
}, 300);

  return () => clearTimeout(delayDebounceFn);
}, [searchQuery, isCertModalOpen]);


const onSelectUser = (user: User) => {
  setSelectedUserIds((prev) => [...prev, user.id]);
  setSelectedUsers((prev) => [...prev, user]);
  setSearchQuery('');
  setMatchingUsers([]);
};

  const onRemoveUser = (id: string) => {
  setSelectedUserIds((prev) => prev.filter((uid) => uid !== id));
  setSelectedUsers((prev) => prev.filter((u) => u.id !== id));
};

useEffect(() => {
  if (events.length === 0 || certificates.length === 0) return;

  const certCounts: Record<string, number> = {};
  certificates.forEach(cert => {
    certCounts[cert.event_id] = (certCounts[cert.event_id] || 0) + 1;
  });

  const enriched = events.map(event => ({
    ...event,
    certificates_generated: certCounts[event.id] || 0,
  }));

  setEventsWithCounts(enriched);
}, [events, certificates]);
  


const logout = async () => {
    await fetch('http://localhost:5000/auth/logout', {
      credentials: 'include',
    })
    window.location.href = "/";
  }

  useEffect(() => {
      socket.on("connect", () => {
        console.log("✅ Club Dashboard connected to socket:", socket.id);
      });

      socket.on("disconnect", () => {
        console.warn("❌ Club Dashboard disconnected from socket.");
      });

      return () => {
        socket.disconnect();
      };
    }, []);

    useEffect(() => {
  const fetchTrends = async () => {
    const res = await fetch(`http://localhost:5000/api/clubs/${clubId}/rsvp-trends`);
    const data = await res.json(); // [{ date, count }]
    const labels = data.map((item: { date: string }) => item.date);
    const counts = data.map((item: { date: string; count: string }) => Number(item.count));
    console.log("Fecthc Trneds data:", data);
    setRsvpTrendsData({
      labels,
      datasets: [
        {
          label: 'RSVPs Over Time',
          data: counts,
          fill: false,
          borderColor: 'rgba(59, 130, 246, 1)',
          tension: 0.2,
        },
      ],
    });
  };

  fetchTrends();
}, [clubId]);





  // Format date
  const formatDate = (dateString: string) => {
    console.log("Formatting date:", dateString);
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // Format time
  const formatTime = (timeString: string) => {
    return timeString; // In a real app, you might want to format this properly
  };

  // Calculate time since 
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

  // Handle add committee member
  const handleAddCommitteeMember = async (userId: string, role: 'member' | 'editor' | 'secretary') => {
    try {
      const response = await fetch(`http://localhost:5000/api/clubs/${clubId}/committee`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ user_id: userId, role }),
      });

      if (!response.ok) throw new Error('Failed to add committee member');

      toast.success('Committee member added successfully');
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error adding committee member:', error);
      toast.error('Failed to add committee member');
    }
  };

  const handleEditCommitteeMember = async (userId: string, role: 'member' | 'editor' | 'secretary') => {
  try {
    console.log("Editing committee member:", userId, "to role:", role);
    const response = await fetch(`http://localhost:5000/api/clubs/${clubId}/committee/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ userId, role }),
    });

    if (!response.ok) throw new Error('Failed to update committee member');

    toast.success('Committee member updated successfully');
    fetchData(); // Refresh the UI
    setIsMemberModalOpen(false);
    setSelectedCommitteeMember(null);
  } catch (error) {
    console.error('Error updating committee member:', error);
    toast.error('Failed to update committee member');
  }
};


  // Handle remove committee member
  const handleRemoveCommitteeMember = async (userId: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/clubs/${clubId}/committee/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to remove committee member');

      toast.success('Committee member removed successfully');
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error removing committee member:', error);
      toast.error('Failed to remove committee member');
    }
  };

  // Handle change secretary
  const handleChangeSecretary = async (userId: string) => {
    try {
      // First remove the current secretary
      const currentSecretary = committee.find(m => m.role === 'secretary');
      if (currentSecretary) {
        await handleRemoveCommitteeMember(currentSecretary.id);
      }

      // Then add the new secretary
      await handleAddCommitteeMember(userId, 'secretary');
      toast.success('Secretary changed successfully');
    } catch (error) {
      console.error('Error changing secretary:', error);
      toast.error('Failed to change secretary');
    }
  };

  // Handle create event
  const handleCreateEvent = async (eventData: Partial<Event>) => {
    try {
      const response = await fetch(`http://localhost:5000/api/club/${clubId}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(eventData),
      });

      if (!response.ok) throw new Error('Failed to create event');

      toast.success('Event created successfully');
      fetchData(); // Refresh data
      setIsEventModalOpen(false);
    } catch (error) {
      console.error('Error creating event:', error);
      toast.error('Failed to create event');
    }
  };

  // Handle edit event
  const handleEditEvent = async (eventId: string, eventData: Partial<Event>) => {
    try {
      const response = await fetch(`http://localhost:5000/api/club/${clubId}/events/${eventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(eventData),
      });

      if (!response.ok) throw new Error('Failed to update event');

      toast.success('Event updated successfully');
      fetchData(); // Refresh data
      setIsEventModalOpen(false);
    } catch (error) {
      console.error('Error updating event:', error);
      toast.error('Failed to update event');
    }
  };

  // Handle delete event
  const handleDeleteEvent = async (eventId: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/club/${clubId}/events/${eventId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to delete event');

      toast.success('Event deleted successfully');
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete event');
    }
  };

  // Handle update club settings
  const handleUpdateClubSettings = async (settingsData: { name?: string; description?: string; logo_url?: string }) => {
    try {
      const response = await fetch(`http://localhost:5000/api/club/${clubId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(settingsData),
      });

      if (!response.ok) throw new Error('Failed to update club settings');

      toast.success('Club settings updated successfully');
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error updating club settings:', error);
      toast.error('Failed to update club settings');
    }
  };

  // Filter events based on search query
  const filteredEvents = events.filter(event =>
    (event?.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
(event?.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
(event?.location || '').toLowerCase().includes(searchQuery.toLowerCase())

  );

  // Chart data for analytics
  const monthlyViewsData = {
    labels: analytics?.monthly_views?.map(item => item.month) || [],
    datasets: [
      {
        label: 'Monthly Views',
        data: analytics?.monthly_views?.map(item => item.views) || [],
        backgroundColor: 'rgba(16, 185, 129, 0.6)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 1,
      }
    ]
  };


  const feedbackDistributionData = {
    labels: ['5 Stars', '4 Stars', '3 Stars', '2 Stars', '1 Star'],
    datasets: [
      {
        data: [
          feedback.filter(f => f.rating === 5).length,
          feedback.filter(f => f.rating === 4).length,
          feedback.filter(f => f.rating === 3).length,
          feedback.filter(f => f.rating === 2).length,
          feedback.filter(f => f.rating === 1).length
        ],
        backgroundColor: [
          'rgba(16, 185, 129, 0.7)',
          'rgba(101, 163, 13, 0.7)',
          'rgba(234, 179, 8, 0.7)',
          'rgba(245, 158, 11, 0.7)',
          'rgba(239, 68, 68, 0.7)'
        ],
        borderColor: [
          'rgba(16, 185, 129, 1)',
          'rgba(101, 163, 13, 1)',
          'rgba(234, 179, 8, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(239, 68, 68, 1)'
        ],
        borderWidth: 1,
      }
    ]
  };

  const subscriberGrowthData = {
    labels: analytics?.subscriber_growth?.map(item => item.month) || [],
    datasets: [
      {
        label: 'Subscribers',
        data: analytics?.subscriber_growth?.map(item => item.count) || [],
        backgroundColor: 'rgba(6, 182, 212, 0.6)',
        borderColor: 'rgba(6, 182, 212, 1)',
        borderWidth: 1,
        tension: 0.4,
      }
    ]
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-lg font-medium text-gray-700">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  if (!clubData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <FiXCircle className="h-12 w-12 text-red-500 mx-auto" />
          <p className="mt-4 text-lg font-medium text-gray-700">Failed to load club data</p>
          <button 
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-all duration-300 ease-in-out ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-sky-500 rounded-lg flex items-center justify-center text-white font-bold">
              {clubData.name.substring(0, 2)}
            </div>
            <span className="text-xl font-bold text-gray-800">Club Admin</span>
          </div>
          <button 
            onClick={() => setIsMenuOpen(false)}
            className="md:hidden text-gray-500 hover:text-gray-700"
          >
            <FiXCircle className="h-6 w-6" />
          </button>
        </div>
        <nav className="p-4">
          <div className="space-y-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${activeTab === 'dashboard' ? 'bg-emerald-50 text-emerald-600' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              <FiBarChart2 className="h-5 w-5" />
              <span>Dashboard</span>
            </button>
            <button
              onClick={() => setActiveTab('committee')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${activeTab === 'committee' ? 'bg-emerald-50 text-emerald-600' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              <FiUsers className="h-5 w-5" />
              <span>Committee</span>
              <span className="ml-auto bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded-full">
                {committee.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${activeTab === 'events' ? 'bg-emerald-50 text-emerald-600' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              <FiCalendar className="h-5 w-5" />
              <span>Events</span>
              <span className="ml-auto bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded-full">
                {events.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('rsvps')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${activeTab === 'rsvps' ? 'bg-emerald-50 text-emerald-600' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              <FiCheckCircle className="h-5 w-5" />
              <span>RSVPs</span>
              <span className="ml-auto bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded-full">
                {eventsWithRsvps.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('certificates')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${activeTab === 'certificates' ? 'bg-emerald-50 text-emerald-600' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              <FiAward className="h-5 w-5" />
              <span>Certificates</span>
              <span className="ml-auto bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded-full">
                {certificates.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('feedback')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${activeTab === 'feedback' ? 'bg-emerald-50 text-emerald-600' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              <FiMessageSquare className="h-5 w-5" />
              <span>Feedback</span>
              <span className="ml-auto bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded-full">
                {feedback.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('subscriptions')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${activeTab === 'subscriptions' ? 'bg-emerald-50 text-emerald-600' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              <FiBell className="h-5 w-5" />
              <span>Subscriptions</span>
              <span className="ml-auto bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded-full">
                {subscriptions.filter(s => s.status === 'active').length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${activeTab === 'analytics' ? 'bg-emerald-50 text-emerald-600' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              <FaChartLine className="h-5 w-5" />
              <span>Analytics</span>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${activeTab === 'settings' ? 'bg-emerald-50 text-emerald-600' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              <FiSettings className="h-5 w-5" />
              <span>Settings</span>
            </button>
          </div>
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
              {clubData.logo_url ? (
                <img src={clubData.logo_url} alt="Club Logo" className="w-full h-full rounded-full object-cover" />
              ) : (
                <FaRegUserCircle className="h-6 w-6 text-gray-500" />
              )}
            </div>
            <div>
              <p className="font-medium text-gray-800">Club Admin</p>
              <p className="text-xs text-gray-500">{clubData.name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="md:ml-64 transition-all duration-300">
        {/* Top Navigation */}
        <header className="bg-white shadow-sm relative">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setIsMenuOpen(true)}
            className="md:hidden text-gray-500 hover:text-gray-700"
          >
            <FiMenu className="h-6 w-6" />
          </button>
          <h1 className="text-xl font-bold text-gray-800">
            {clubData.name} - {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
          </h1>
        </div>

        <div className="flex items-center space-x-4 relative">
          <button 
            onClick={fetchData}
            className="p-2 text-gray-500 hover:text-gray-700"
            title="Refresh data"
          >
            <FiRefreshCw className="h-5 w-5" />
          </button>

          <button className="p-2 text-gray-500 hover:text-gray-700 relative">
            <FiMail className="h-5 w-5" />
            <span className="absolute top-0 right-0 h-2 w-2 bg-emerald-500 rounded-full"></span>
          </button>

          <div className="relative">
            <button 
              onClick={() => setDropdownOpen(prev => !prev)}
              className="flex items-center space-x-2"
            >
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                <img className="h-7 w-7 text-gray-500" src={clubData?.logo_url} alt="Club Logo" />
              </div>
              <span className="hidden md:inline text-sm font-medium text-gray-700">
                {clubData?.name || 'Club Admin'}
              </span>
              <FiChevronDown className="hidden md:inline h-4 w-4 text-gray-500" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border rounded shadow-lg z-10">
                <button 
                  onClick={logout}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Logout (Club)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>

        {/* Dashboard Content */}
        <main className="p-6">
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:border-emerald-200 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Total Events</p>
                      <p className="text-3xl font-bold text-gray-800 mt-1">{analytics?.total_events || 0}</p>
                      <p className="text-xs text-emerald-600 mt-2">
                        <span className="font-medium">{events.filter(e => e.status === 'Published').length}</span> upcoming
                      </p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                      <FiCalendar className="h-6 w-6" />
                    </div>
                  </div>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                  className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:border-emerald-200 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Total RSVPs</p>
                      <p className="text-3xl font-bold text-gray-800 mt-1">{analytics?.total_rsvps || 0}</p>
                      <p className="text-xs text-emerald-600 mt-2">
                        <span className="font-medium">{events.reduce((sum, event) => sum + event.views, 0).toLocaleString()}</span> total views
                      </p>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg text-purple-600">
                      <FiCheckCircle className="h-6 w-6" />
                    </div>
                  </div>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 }}
                  className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:border-emerald-200 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Certificates Issued</p>
                      <p className="text-3xl font-bold text-gray-800 mt-1">{analytics?.total_certificates || 0}</p>
                      <p className="text-xs text-emerald-600 mt-2">
                        <span className="font-medium">{events.reduce((sum, event) => sum + (event.certificates_generated || 0), 0)}</span> from events
                      </p>
                    </div>
                    <div className="p-3 bg-amber-50 rounded-lg text-amber-600">
                      <FiAward className="h-6 w-6" />
                    </div>
                  </div>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.4 }}
                  className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:border-emerald-200 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Subscribers</p>
                      <p className="text-3xl font-bold text-gray-800 mt-1">{analytics?.total_subscribers || 0}</p>
                      <p className="text-xs text-emerald-600 mt-2">
                        <span className="font-medium">+{Math.floor(subscriptions.length * 0.1)}</span> this month
                      </p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg text-green-600">
                      <FiBell className="h-6 w-6" />
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Upcoming Events */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-800">Upcoming Events</h2>
                  <button 
                    onClick={() => setActiveTab('events')}
                    className="text-sm text-emerald-600 hover:text-emerald-800 font-medium"
                  >
                    View All
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {events
                    .filter(e => {
                        const eventDate = new Date(e.event_date);
                        const today = new Date();
                        // Strip time from both dates
                        eventDate.setHours(0, 0, 0, 0);
                        today.setHours(0, 0, 0, 0);
                        return eventDate >= today;
                      })
                      .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
                      .slice(0, 3)
                    .map(event => (
                    <motion.div 
                      key={event.id}
                      whileHover={{ y: -5 }}
                      className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-all"
                    >
                      <div className="h-40 bg-gradient-to-r from-emerald-50 to-sky-50 flex items-center justify-center">
                        {event.image_url ? (
                          <img src={event.image_url} alt={event.title} className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-4xl font-bold text-emerald-500">{event.title.charAt(0)}</span>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold text-gray-800">{event.title}</h3>
                        <div className="flex items-center mt-2 text-sm text-gray-500">
                          <FiCalendar className="mr-1.5 h-4 w-4 text-emerald-500" />
                          <span>{formatDate(event.event_date)}</span>
                        </div>
                        <div className="flex items-center mt-1 text-sm text-gray-500">
                          <FiMapPin className="mr-1.5 h-4 w-4 text-emerald-500" />
                          <span>{event.location}</span>
                        </div>
                        <div className="mt-4 flex justify-between items-center">
                          <span className="text-sm font-medium text-emerald-600">
                            {event.rsvps} RSVPs
                          </span>
                          <button 
                            onClick={() => {
                              setSelectedEvent(event);
                              setIsEventModalOpen(true);
                            }}
                            className="text-sm text-white bg-emerald-500 hover:bg-emerald-600 px-3 py-1 rounded"
                          >
                            Manage
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 lg:col-span-2">
                  <h2 className="text-lg font-bold text-gray-800 mb-4">Event Views</h2>
                  <div className="h-64">
                    <Line 
                      data={monthlyViewsData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            display: false,
                          },
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                          },
                        },
                      }}
                    />
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <h2 className="text-lg font-bold text-gray-800 mb-4">Recent RSVPs</h2>
                  <div className="h-64">
                    <Line 
                      data={rsvpTrendsData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            display: false,
                          },
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                          },
                        },
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Committee Tab */}
          {activeTab === 'committee' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-2xl font-bold text-gray-800">Committee Management</h2>
                <button 
                  onClick={() => setIsMemberModalOpen(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-sky-500 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all"
                >
                  <FiUserPlus className="h-5 w-5" />
                  <span>Add Member</span>
                </button>
              </div>

              <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Member
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Joined
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Last Active
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {committee.map(member => (
                        <tr key={member.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {member.profile_pic ? (
                                <img className="h-10 w-10 rounded-full" src={member.profile_pic} alt="" />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                  <FaRegUserCircle className="h-6 w-6 text-gray-500" />
                                </div>
                              )}
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{member.name}</div>
                                <div className="text-sm text-gray-500">{member.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              member.role === 'secretary' ? 'bg-purple-100 text-purple-800' :
                              member.role === 'editor' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{formatDate(member.joined_at)}</div>
                            <div className="text-sm text-gray-500">{getTimeSince(member.joined_at)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{getTimeSince(member.last_active)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            {member.role !== 'secretary' && (
                              <button 
                                onClick={() => handleChangeSecretary(member.id)}
                                className="text-purple-600 hover:text-purple-900 mr-3"
                                title="Make Secretary"
                              >
                                <FiLock className="h-5 w-5" />
                              </button>
                            )}
                            <button 
                              onClick={() => handleRemoveCommitteeMember(member.id)}
                              className="text-red-600 hover:text-red-900 mr-3"
                              title="Remove from Committee"
                            >
                              <FiUserMinus className="h-5 w-5" />
                            </button>
                            <button 
                              onClick={() => {
                                setSelectedCommitteeMember(member);
                                setIsMemberModalOpen(true);
                                setIsEditingCommitteeMember(true);
                              }}
                              className="text-gray-600 hover:text-gray-900"
                              title="Edit"
                            >
                              <FiMoreVertical className="h-5 w-5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Events Tab */}
          {activeTab === 'events' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-2xl font-bold text-gray-800">Event Management</h2>
                <div className="flex items-center space-x-3 w-full md:w-auto">
                  <div className="relative flex-grow md:w-64">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiSearch className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search events..."
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 focus:bg-white transition"
                    />
                  </div>
                  <button 
                    onClick={() => {
                      setSelectedEvent(null);
                      setIsEventModalOpen(true);
                    }}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-sky-500 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all"
                  >
                    <FiPlus className="h-5 w-5" />
                    <span>New Event</span>
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Event
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date & Time
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          RSVPs
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredEvents.map(event => (
                        <tr key={event.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">
                                {event.title.charAt(0)}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{event.title}</div>
                                <div className="text-sm text-gray-500">{event.location}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{formatDate(event.event_date)}</div>
                            <div className="text-sm text-gray-500">{formatTime(event.event_date)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              event.status === 'Published' ? 'bg-blue-100 text-blue-800' :
                              event.status === 'Completed' ? 'bg-green-100 text-green-800' :
                              event.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {event.status ? event.status.charAt(0).toUpperCase() + event.status.slice(1) : 'Unknown'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {event.rsvps}/{event.max_capacity} ({Math.round((event.rsvps / event.max_capacity) * 100)}%)
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                              <div 
                                className={`h-1.5 rounded-full ${
                                  (event.rsvps / event.max_capacity) > 0.75 ? 'bg-emerald-500' :
                                  (event.rsvps / event.max_capacity) > 0.5 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${(event.rsvps / event.max_capacity) * 100}%` }}
                              ></div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button 
                              onClick={() => {
                                setSelectedEvent(event);
                                setIsEventModalOpen(true);
                              }}
                              className="text-emerald-600 hover:text-emerald-900 mr-3"
                            >
                              <FiEdit className="h-5 w-5" />
                            </button>
                            <button 
                              onClick={() => handleDeleteEvent(event.id)}
                              className="text-red-600 hover:text-red-900 mr-3"
                            >
                              <FiTrash2 className="h-5 w-5" />
                            </button>
                            <button className="text-gray-600 hover:text-gray-900">
                              <FiMoreVertical className="h-5 w-5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* RSVPs Tab */}
          {activeTab === 'rsvps' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800">Event RSVPs</h2>
              
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-800">Upcoming Event RSVPs</h3>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={async () => {
                        try {
                          const response = await fetch(`http://localhost:5000/api/clubs/${clubId}/rsvps/download/all`, {
                            credentials: 'include'
                          });
                          
                          if (!response.ok) throw new Error('Failed to export RSVPs');
                          
                          const blob = await response.blob();
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `${clubData.name}-rsvps.csv`;
                          document.body.appendChild(a);
                          a.click();
                          a.remove();
                          
                          toast.success('RSVPs exported successfully');
                        } catch (error) {
                          console.error('Export error:', error);
                          toast.error('Failed to export RSVPs');
                        }
                      }}
                      className="text-xs bg-emerald-50 text-emerald-600 px-2 py-1 rounded"
                    >
                      Export CSV
                    </button>
                    <button className="text-xs bg-gray-50 text-gray-600 px-2 py-1 rounded">
                      Print List
                    </button>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Event
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          RSVPs
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {eventsWithRsvps
                        .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
                        .map(event => (
                        <tr key={event.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{event.title}</div>
                            <div className="text-sm text-gray-500">{event.location}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{formatDate(event.event_date)}</div>
                            <div className="text-sm text-gray-500">{formatTime(event.event_date)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{event.rsvps} / {event.max_capacity}</div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                              <div 
                                className="h-1.5 rounded-full bg-emerald-500" 
                                style={{ width: `${Math.min(100, (event.rsvps / event.max_capacity) * 100)}%` }}
                              ></div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button 
                              onClick={() => {
                                setSelectedEvent(event);
                                setActiveTab('certificates');
                              }}
                              className="text-emerald-600 hover:text-emerald-900 mr-3"
                              title="View Certificates"
                            >
                              <FiAward className="h-5 w-5" />
                            </button>
                            <button 
                              onClick={async () => {
                                try {
                                  const response = await fetch(`http://localhost:5000/api/clubs/${clubId}/rsvps/download?eventId=${event.id}`, {
                                    credentials: 'include'
                                  });
                                  
                                  if (!response.ok) throw new Error('Failed to export RSVPs');
                                  
                                  const blob = await response.blob();
                                  const url = window.URL.createObjectURL(blob);
                                  const a = document.createElement('a');
                                  a.href = url;
                                  a.download = `${event.title}-rsvps.csv`;
                                  document.body.appendChild(a);
                                  a.click();
                                  a.remove();
                                  
                                  toast.success('RSVPs exported successfully');
                                } catch (error) {
                                  console.error('Export error:', error);
                                  toast.error('Failed to export RSVPs');
                                }
                              }}
                              className="text-blue-600 hover:text-blue-900"
                              title="Download RSVPs"
                            >
                              <FiDownload className="h-5 w-5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Certificates Tab */}
          {activeTab === 'certificates' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-2xl font-bold text-gray-800">Certificate Management</h2>
                <div className="flex items-center space-x-3">
                  <button 
                    onClick={() => {
                          setIsCertModalOpen(true);
                        }}

                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-sky-500 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all"
                  >
                    <FiPlus className="h-5 w-5" />
                    <span>Generate Certificates</span>
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Event
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Recipient
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Issued On
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {certificates.slice(0, 10).map(cert => {
                        const event = events.find(e => e.id === cert.event_id);
                        return (
                          <tr key={cert.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{event?.title || 'General Certificate'}</div>
                              <div className="text-sm text-gray-500">{event ? formatDate(event.event_date) : 'N/A'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">User {cert.user_id.split('user')[1]}</div>
                              <div className="text-sm text-gray-500">{cert.user_id}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{formatDate(cert.generated_at)}</div>
                              <div className="text-sm text-gray-500">{getTimeSince(cert.generated_at)}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <a 
                                href={cert.certificate_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-emerald-600 hover:text-emerald-900 mr-3"
                              >
                                <FiExternalLink className="h-5 w-5" />
                              </a>
                              <a 
                                href={cert.certificate_url} 
                                download
                                className="text-blue-600 hover:text-blue-900"
                              >
                                <FiDownload className="h-5 w-5" />
                              </a>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="bg-gray-50 px-6 py-3 flex items-center justify-between border-t border-gray-200">
                  <div className="flex-1 flex justify-between items-center">
                    <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                      Previous
                    </button>
                    <div className="hidden md:flex">
                      <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                        Showing <span className="font-bold mx-1">1</span> to <span className="font-bold mx-1">10</span> of <span className="font-bold ml-1">{certificates.length}</span>
                      </span>
                    </div>
                    <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Feedback Tab */}
          {activeTab === 'feedback' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-2xl font-bold text-gray-800">Event Feedback</h2>
                <div className="flex items-center space-x-3">
                  <button 
                    onClick={async () => {
                      try {
                        const response = await fetch(`http://localhost:5000/api/clubs/${clubId}/feedbacks/export`, {
                          credentials: 'include'
                        });
                        
                        if (!response.ok) throw new Error('Failed to export feedback');
                        
                        const blob = await response.blob();
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${clubData.name}-feedback.csv`;
                        document.body.appendChild(a);
                        a.click();
                        a.remove();
                        
                        toast.success('Feedback exported successfully');
                      } catch (error) {
                        console.error('Export error:', error);
                        toast.error('Failed to export feedback');
                      }
                    }}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-sky-500 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all"
                  >
                    <FiDownload className="h-5 w-5" />
                    <span>Export All</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Feedback Distribution</h3>
                  <div className="h-64">
                    <Pie 
                      data={feedbackDistributionData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'bottom',
                          },
                        },
                      }}
                    />
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 lg:col-span-2">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Recent Feedback</h3>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {feedback
                      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                      .slice(0, 5)
                      .map(item => {
                      const event = events.find(e => e.id === item.event_id);
                      return (
                        <div key={item.id} className="p-4 border border-gray-100 rounded-lg">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center">
                                {[...Array(5)].map((_, i) => (
                                  i < item.rating ? (
                                    <FaStar key={i} className="h-4 w-4 text-yellow-400" />
                                  ) : (
                                    <FaRegStar key={i} className="h-4 w-4 text-gray-300" />
                                  )
                                ))}
                              </div>
                              <h4 className="mt-1 font-medium text-gray-900">{event?.title || 'General Feedback'}</h4>
                              {item.comment && (
                                <p className="mt-1 text-sm text-gray-600">{item.comment}</p>
                              )}
                            </div>
                            <div className="text-xs text-gray-500">{getTimeSince(item.created_at)}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Event
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Rating
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Comment
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {feedback.slice(0, 10).map(item => {
                        const event = events.find(e => e.id === item.event_id);
                        return (
                          <tr key={item.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{event?.title || 'General Feedback'}</div>
                              <div className="text-sm text-gray-500">{event ? formatDate(event.event_date) : 'N/A'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                {[...Array(5)].map((_, i) => (
                                  i < item.rating ? (
                                    <FaStar key={i} className="h-4 w-4 text-yellow-400" />
                                  ) : (
                                    <FaRegStar key={i} className="h-4 w-4 text-gray-300" />
                                  )
                                ))}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900 max-w-xs truncate">{item.comment || 'No comment'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{formatDate(item.created_at)}</div>
                              <div className="text-sm text-gray-500">{getTimeSince(item.created_at)}</div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Subscriptions Tab */}
          {activeTab === 'subscriptions' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-2xl font-bold text-gray-800">Club Subscriptions</h2>
                <div className="flex items-center space-x-3">
                  <button 
                    onClick={() => {
                        setIsNotificationModalOpen(true);
                        fetch(`http://localhost:5000/api/clubs/${clubId}/events`)
                          .then((res) => res.json())
                          .then((data) => setEvents(data))
                          .catch(() => toast.error("Failed to load events"));
                      }}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-sky-500 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all"
                  >
                    <FiMail className="h-5 w-5" />
                    <span>Send Notification</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Total Subscribers</p>
                      <p className="text-3xl font-bold text-gray-800 mt-1">{subscriptions.length}</p>
                      <p className="text-xs text-emerald-600 mt-2">
                        <span className="font-medium">+{Math.floor(subscriptions.length * 0.1)}</span> this month
                      </p>
                    </div>
                    <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
                      <FiUsers className="h-6 w-6" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Active Subscribers</p>
                      <p className="text-3xl font-bold text-gray-800 mt-1">{subscriptions.filter(s => s.status === 'active').length}</p>
                      <p className="text-xs text-emerald-600 mt-2">
                        <span className="font-medium">{Math.round((subscriptions.filter(s => s.status === 'active').length / subscriptions.length) * 100)}%</span> engagement
                      </p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                      <FiBell className="h-6 w-6" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Notification Open Rate</p>
                      <p className="text-3xl font-bold text-gray-800 mt-1">62%</p>
                      <p className="text-xs text-emerald-600 mt-2">
                        <span className="font-medium">+8%</span> from last month
                      </p>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg text-purple-600">
                      <FiMail className="h-6 w-6" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">New This Week</p>
                      <p className="text-3xl font-bold text-gray-800 mt-1">18</p>
                      <p className="text-xs text-emerald-600 mt-2">
                        <span className="font-medium">+3</span> from last week
                      </p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg text-green-600">
                      <FiUserPlus className="h-6 w-6" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Subscriber
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Subscribed Since
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Last Notified
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {subscriptions.slice(0, 10).map(sub => (
                        <tr key={sub.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">User {sub.user_id.split('user')[1]}</div>
                            <div className="text-sm text-gray-500">{sub.user_id}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{formatDate(sub.subscribed_at)}</div>
                            <div className="text-sm text-gray-500">{getTimeSince(sub.subscribed_at)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{getTimeSince(new Date(Date.now() - Math.floor(Math.random() * 1000 * 60 * 60 * 24 * 7)).toISOString())}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              !sub.status || sub.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {sub.status
                                ? sub.status.charAt(0).toUpperCase() + sub.status.slice(1)
                                : 'Active'}
                            </span>

                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800">Advanced Analytics</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Event Performance</h3>
                  <div className="h-64">
                    <Bar 
                      data={{
                        labels: events.map(e => e.title),
                        datasets: [
                          {
                            label: 'RSVPs',
                            data: events.map(e => e.rsvps),
                            backgroundColor: 'rgba(59, 130, 246, 0.6)',
                            borderColor: 'rgba(59, 130, 246, 1)',
                            borderWidth: 1,
                          },
                          {
                            label: 'Views',
                            data: events.map(e => e.views),
                            backgroundColor: 'rgba(16, 185, 129, 0.6)',
                            borderColor: 'rgba(16, 185, 129, 1)',
                            borderWidth: 1,
                          }
                        ]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'top',
                          },
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                          },
                        },
                      }}
                    />
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Engagement Trends</h3>
                  <div className="h-64">
                    <Line 
                      data={{
                        labels: analytics?.monthly_views?.map(item => item.month) || [],
                        datasets: [
                          {
                            label: 'Monthly Views',
                            data: analytics?.monthly_views?.map(item => item.views) || [],
                            backgroundColor: 'rgba(139, 92, 246, 0.6)',
                            borderColor: 'rgba(139, 92, 246, 1)',
                            borderWidth: 1,
                            tension: 0.4,
                          }
                        ]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            display: false,
                          },
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                          },
                        },
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Subscriber Growth</h3>
                  <div className="h-64">
                    <Line 
                      data={subscriberGrowthData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            display: false,
                          },
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                          },
                        },
                      }}
                    />
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Feedback Ratings</h3>
                  <div className="h-64">
                    <Pie 
                      data={feedbackDistributionData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'bottom',
                          },
                        },
                      }}
                    />
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Certificate Issuance</h3>
                  <div className="h-64">
                    <Bar 
                      data={{
                        labels: eventsWithCounts.map(e => e.title),
                        datasets: [
                          {
                            label: 'Certificates',
                            data: eventsWithCounts.map(e => e.certificates_generated),
                            backgroundColor: 'rgba(234, 179, 8, 0.6)',
                            borderColor: 'rgba(234, 179, 8, 1)',
                            borderWidth: 1,
                          }
                        ]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            display: false,
                          },
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                          },
                        },
                      }}
                    />

                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800">Club Settings</h2>
              
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Club Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Club Name</label>
                    <input
                      type="text"
                      defaultValue={clubData?.name}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                      onChange={(e) => {
                        setClubData({...clubData, name: e.target.value});
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">University</label>
                    <input
                      type="text"
                      defaultValue="University of Example"
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      defaultValue={clubData?.description}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                      onChange={(e) => {
                        setClubData({...clubData, description: e.target.value});
                      }}
                    ></textarea>
                  </div>
                  <div className="md:col-span-2">
                    <button
                      onClick={() => handleUpdateClubSettings({
                        name: clubData.name,
                        description: clubData.description
                      })}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Club Logo</h3>
                <div className="flex items-center space-x-6">
                  <div className="w-20 h-20 bg-gradient-to-r from-emerald-50 to-sky-50 rounded-lg flex items-center justify-center overflow-hidden">
                    {clubData?.logo_url ? (
                      <img src={clubData.logo_url} alt="Club Logo" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl font-bold text-emerald-500">{clubData?.name.charAt(0)}</span>
                    )}
                  </div>
                  <div>
                    <button 
                      onClick={() => {
                        // In a real app, this would open a file upload dialog
                        const newLogoUrl = 'https://example.com/new-logo.png';
                        handleUpdateClubSettings({ logo_url: newLogoUrl });
                        toast.success('Logo updated successfully');
                      }}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                    >
                      Upload New Logo
                    </button>
                    <p className="mt-1 text-xs text-gray-500">Recommended size: 200x200px</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Danger Zone</h3>
                <div className="space-y-4">
                  <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
                    <h4 className="font-medium text-red-800">Transfer Club Ownership</h4>
                    <p className="text-sm text-red-600 mt-1">Transfer this club to another committee member</p>
                    <button 
                      onClick={() => {
                        // In a real app, this would open a modal to select a new owner
                        toast.success('Ownership transferred successfully');
                      }}
                      className="mt-2 px-4 py-2 bg-white text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition"
                    >
                      Transfer Ownership
                    </button>
                  </div>
                  <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
                    <h4 className="font-medium text-red-800">Delete Club</h4>
                    <p className="text-sm text-red-600 mt-1">Permanently delete this club and all its data</p>
                    <button 
                      onClick={async () => {
                        if (confirm('Are you sure you want to delete this club? This action cannot be undone.')) {
                          try {
                            const response = await fetch(`http://localhost:5000/api/clubs/${clubId}`, {
                              method: 'DELETE',
                              credentials: 'include'
                            });
                            
                            if (!response.ok) throw new Error('Failed to delete club');
                            
                            toast.success('Club deleted successfully');
                            // Redirect to clubs list or home page
                            window.location.href = '/clubs';
                          } catch (error) {
                            console.error('Error deleting club:', error);
                            toast.error('Failed to delete club');
                          }
                        }
                      }}
                      className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                    >
                      Delete Club
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Event Modal */}
      <AnimatePresence>
        {isEventModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-800">
                    {selectedEvent ? 'Edit Event' : 'Create New Event'}
                  </h3>
                  <button 
                    onClick={() => setIsEventModalOpen(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <FiXCircle className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Event Title</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                      value={selectedEvent ? selectedEvent.title : newEvent.title}
                      onChange={(e) => {
                        if (selectedEvent) {
                          setSelectedEvent({ ...selectedEvent, title: e.target.value });
                        } else {
                          setNewEvent({ ...newEvent, title: e.target.value });
                        }
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
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
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
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
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                      
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                    ></textarea>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                      value={selectedEvent ? selectedEvent.status : newEvent.status}
                      onChange={(e) => {
                        const value = e.target.value as 'Draft' | 'Published' | 'Completed' | 'Cancelled';
                        if (selectedEvent) {
                          setSelectedEvent({ ...selectedEvent, status: value });
                        } else {
                          setNewEvent({ ...newEvent, status: value });
                        }
                      }}
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Event Image</label>
                    <div className="mt-1 flex items-center">
                      <span className="inline-block h-12 w-12 rounded-lg overflow-hidden bg-gray-100">
                        {selectedEvent?.image_url ? (
                          <img src={selectedEvent.image_url} alt="Event" className="h-full w-full object-cover" />
                        ) : (
                          <FiCalendar className="h-full w-full text-gray-300 p-2" />
                        )}
                      </span>
                      <button
                        type="button"
                        className="ml-5 bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                        onClick={() => {
                                const newImageUrl = 'https://example.com/new-event-image.jpg';
                                if (selectedEvent) {
                                  setSelectedEvent({ ...selectedEvent, image_url: newImageUrl });
                                } else {
                                  setNewEvent({ ...newEvent, image_url: newImageUrl });
                                }
                                toast.success('Event image updated');
                              }}
                          >
                        Change
                      </button>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200 flex justify-end space-x-3">
                    <button
                      onClick={() => setIsEventModalOpen(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                    <button
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
                            image_url: selectedEvent.image_url
                          });
                        } else {
                          // For create, you would collect the data from form state
                          // This is simplified - in a real app you'd have form state management
                          handleCreateEvent(newEvent);
                        }
                      }}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
                    >
                      {selectedEvent ? 'Update Event' : 'Create Event'}
                    </button>
                  </div>
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
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    >
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-800">
              {isEditingCommitteeMember ? 'Edit Committee Member' : 'Add Committee Member'}
            </h3>
            <button
              onClick={() => {
                setIsMemberModalOpen(false);
                setSearchTerm('');
                setSuggestions([]);
                setSelectedCommitteeMember(null);
                setIsEditingCommitteeMember(false);
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <FiXCircle className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            {/* 🔍 Search Input with Suggestions */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Search Members</label>
              <div className="relative">
                <FiSearch className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setSelectedCommitteeMember(null);
                    setIsEditingCommitteeMember(false);
                  }}
                  placeholder="Name or email..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              {/* Suggestions */}
              {suggestions.length > 0 && (
                <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow max-h-60 overflow-y-auto">
                  {suggestions.map((u) => (
                    <li
                      key={u.id}
                      onClick={() => {
                        setSelectedCommitteeMember(u);
                        setSearchTerm(`${u.name} (${u.email})`);
                        setSuggestions([]);
                        setIsEditingCommitteeMember(false); // reset if new selection
                      }}
                      className="px-4 py-2 flex items-center space-x-3 hover:bg-gray-100 cursor-pointer"
                    >
                      {u.profile_pic ? (
                        <img src={u.profile_pic} alt="" className="h-8 w-8 rounded-full" />
                      ) : (
                        <FaRegUserCircle className="h-8 w-8 text-gray-400" />
                      )}
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{u.name}</p>
                        <p className="text-sm text-gray-500">{u.email}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* 🔧 Role Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="member">Member</option>
                <option value="editor">Editor</option>
                <option value="secretary">Secretary</option>
              </select>
            </div>

            {/* 👤 Preview */}
            {selectedCommitteeMember && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  {selectedCommitteeMember.profile_pic ? (
                    <img className="h-12 w-12 rounded-full" src={selectedCommitteeMember.profile_pic} alt="" />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                      <FaRegUserCircle className="h-6 w-6 text-gray-500" />
                    </div>
                  )}
                  <div>
                    <h4 className="font-medium text-gray-900">{selectedCommitteeMember.name}</h4>
                    <p className="text-sm text-gray-500">{selectedCommitteeMember.email}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="pt-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setIsMemberModalOpen(false);
                  setSearchTerm('');
                  setSuggestions([]);
                  setSelectedCommitteeMember(null);
                  setIsEditingCommitteeMember(false);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
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

                    // Cleanup
                    setIsMemberModalOpen(false);
                    setSelectedCommitteeMember(null);
                    setSearchTerm('');
                    setSuggestions([]);
                    setIsEditingCommitteeMember(false);
                  }
                }}
                disabled={!selectedCommitteeMember}
                className={`px-4 py-2 rounded-lg text-white ${
                  selectedCommitteeMember
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-gray-300'
                }`}
              >
                {isEditingCommitteeMember ? 'Update Member' : 'Add Member'}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
<AnimatePresence>
  {isCertModalOpen && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    >
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-800">Generate Certificates</h3>
            <button
              onClick={() => setIsCertModalOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <FiXCircle className="h-6 w-6" />
            </button>
          </div>

          {/* Event Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Event</label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="">-- Choose an event --</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.title}
                </option>
              ))}
            </select>
          </div>

          {/* User Email Multi-Select */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Recipients (by email)</label>

            {/* Input to search emails */}
            <input
              type="text"
              placeholder="Type email to search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 mb-1 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
              autoComplete="off"
            />

            {/* Dropdown of matching users */}
            {searchQuery && matchingUsers.length > 0 && (
              <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md mb-2 bg-white shadow-md z-50 relative">
                {matchingUsers
                  .filter((user) => !selectedUserIds.includes(user.id))
                  .map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => {
                        setSelectedUserIds((prev) => [...prev, user.id]);
                        setSearchQuery('');
                        setMatchingUsers([]);
                      }}
                      className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                    >
                      {user.name} ({user.email})
                    </button>
                  ))}
              </div>
            )}

            {/* Selected users as tags */}
            {selectedUsers.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedUsers.map((user) => (
                      <span
                        key={user.id}
                        className="flex items-center space-x-1 bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm"
                      >
                        <span>{user.email}</span>
                        <button
                          type="button"
                          onClick={() => onRemoveUser(user.id)}
                          className="font-bold hover:text-emerald-900"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                )}

          </div>

          {/* Custom HTML Editor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Custom Certificate HTML</label>
            <textarea
              rows={8}
              placeholder="<html>...</html>"
              value={customHtml}
              onChange={(e) => setCustomHtml(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 font-mono text-sm"
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              onClick={() => setIsCertModalOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                try {
                  console.log("Generate button is pressed", selectedEventId, selectedUserIds, customHtml);
                  if (!selectedEventId) {
                    toast.error('Please select an event');
                    return;
                  }
                  if (selectedUserIds.length === 0) {
                    toast.error('Please select at least one recipient');
                    return;
                  }
                  await issueCertificates(selectedEventId, selectedUserIds, customHtml);
                  toast.success('Certificates generated successfully');

                  // Refresh certificates list if needed
                  fetch(`http://localhost:5000/api/clubs/${clubId}/certificates`, { credentials: 'include' })
                    .then((r) => r.json())
                    .then(setCertificates);

                  // Reset modal states
                  setSelectedEventId('');
                  setSelectedUserIds([]);
                  setSearchQuery('');
                  setMatchingUsers([]);
                  setCustomHtml('');
                  setIsCertModalOpen(false);
                } catch (err: any) {
                  toast.error('Failed to generate certificates');
                  console.error(err);
                }
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg"
            >
              Generate
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>


  <AnimatePresence>
  {isNotificationModalOpen && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    >
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        className="bg-white rounded-xl shadow-xl w-full max-w-md"
      >
        <div className="p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">Send Notification</h3>
            <button onClick={() => setIsNotificationModalOpen(false)} className="text-gray-500 hover:text-gray-700">
              <FiXCircle className="h-6 w-6" />
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Event</label>
            <select
              value={selectedEventId || ''}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="" disabled>Select an event</option>
              {events.map((e: any) => (
              <option key={e.id} value={e.id}>{e.title}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="What's the update?"
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => setIsNotificationModalOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
           <button
              onClick={async () => {
                if (!selectedEventId || !message.trim()) {
                  toast.error("Event and message are required");
                  return;
                }

                const res = await fetch(`http://localhost:5000/api/clubs/${clubId}/events/${selectedEventId}/notify`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ eventId: selectedEventId, message }),
                });

                if (res.ok) {
                  toast.success("Notification sent!");
                  setIsNotificationModalOpen(false);
                  setMessage('');
                  setSelectedEventId('');
                } else {
                  toast.error("Failed to send notification");
                }
              }}
              className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition"
            >
              Send
            </button>

          </div>
        </div>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>



    </div>
  );
}