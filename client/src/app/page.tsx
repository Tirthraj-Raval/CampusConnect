'use client'

import { useEffect, useState } from 'react'
import Navbar from '../../components/Navbar'
import HeroSection from '../../components/HeroSection'
import StatsSection from '../../components/StatsSection'
import FeaturesSection from '../../components/FeaturesSection'
import HowItWorks from '../../components/HowItWorks'
import EventsSection from '../../components/EventsSection'
import InstitutionsSection from '../../components/InstitutionsSection'
import TestimonialsSection from '../../components/TestimonialsSection'
import CTA from '../../components/CTA'
import Footer from '../../components/Footer'
import AnimatedBackground from '../../components/AnimatedBackground'
import StudentDashboard from '../../components/StudentDashboard'

export default function HomePage() {
  const [scrolled, setScrolled] = useState(false)
  type User = { name: string; [key: string]: any } | null;
  const [user, setUser] = useState<User>(null)
  const [userType, setUserType] = useState<string | null>(null)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';
    fetch(`${apiBase}/api/auth/me`, {
      credentials: 'include',
    })
      .then(res => {
      if (!res.ok) throw new Error('Not logged in');
      return res.json();
      })
      .then(data => {
      setUser(data.user);
      setUserType(data.type);
      })
      .catch(() => {
      setUser(null);
      setUserType(null);
      });
  }, [])

  const logout = async () => {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';
    await fetch(`${apiBase}/auth/logout`, {
      credentials: 'include',
    })
    window.location.reload()
  }

  const handleGoogleLogin = async () => {
    if (user) {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';
      setUser(null)
      await fetch(`${apiBase}/auth/logout`, { credentials: 'include' })
      window.location.reload()
    } else {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';
      window.location.href = `${apiBase}/auth/student/google`
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-sky-50 to-emerald-50">
      <AnimatedBackground />
      
      <Navbar 
        scrolled={scrolled} 
        user={user} 
        userType={userType} 
        logout={logout} 
      />

      {userType=="student" ? <StudentDashboard userType = {userType} logout = {logout} /> : null}
      
      <HeroSection 
        user={user} 
        handleGoogleLogin={handleGoogleLogin} 
      />
      
      <StatsSection />
      <FeaturesSection />
      <HowItWorks />
      <EventsSection />
      <InstitutionsSection />
      <TestimonialsSection />
      <CTA 
        user={user} 
        userType={userType} 
        logout={logout} 
      />
      <Footer />
    </div>
  )
}
