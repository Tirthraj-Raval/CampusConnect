// components/home/Navbar.tsx
'use client'

import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'

interface NavbarProps {
  scrolled: boolean
  user: { name: string; [key: string]: any } | null
  userType: string | null
  logout: () => Promise<void>
}

export default function Navbar({ scrolled, user, userType, logout }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <nav className={`fixed w-full px-6 md:px-16 py-4 z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-md shadow-sm' : 'bg-transparent'}`}>
      <div className="flex justify-between items-center max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link href="/" className="flex items-center">
            <div className="text-3xl font-bold text-emerald-600 tracking-wide cursor-pointer">
              Campus<span className="text-sky-600">Connect</span>
            </div>
          </Link>
        </motion.div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-10">
          {user ? (
            <motion.button
              onClick={logout}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-red-500 to-pink-500 text-white text-sm font-medium rounded-full shadow-lg hover:shadow-xl transition"
            >
              <Image src="/google-icon.svg" alt="Google" width={20} height={20} className="mr-2" />
              Logout ({userType === 'superadmin' ? 'Superadmin' : userType === 'club' ? 'Club' : 'Student'})
            </motion.button>
          ) : (
            <div className="flex gap-3">
              <motion.button
                onClick={() => (window.location.href = 'http://localhost:5000/auth/student/google')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-sky-500 text-white text-sm font-medium rounded-full shadow-lg hover:shadow-xl transition"
              >
                <Image src="/google-icon.svg" alt="Google" width={20} height={20} className="mr-2" />
                Student Login
              </motion.button>

              <motion.button
                onClick={() => (window.location.href = 'http://localhost:5000/auth/club/google')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center px-4 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-sm font-medium rounded-full shadow-lg hover:shadow-xl transition"
              >
                <Image src="/google-icon.svg" alt="Google" width={20} height={20} className="mr-2" />
                Club Login
              </motion.button>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-gray-700 focus:outline-none"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden overflow-hidden bg-white shadow-lg rounded-b-xl"
          >
            <div className="pt-4 pb-6 space-y-4">
              <a
                href="#features"
                className="block px-3 py-2 text-gray-700 hover:text-emerald-600 transition font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className="block px-3 py-2 text-gray-700 hover:text-emerald-600 transition font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                How It Works
              </a>
              <a
                href="#events"
                className="block px-3 py-2 text-gray-700 hover:text-emerald-600 transition font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Events
              </a>
              <a
                href="#testimonials"
                className="block px-3 py-2 text-gray-700 hover:text-emerald-600 transition font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Testimonials
              </a>

              {user ? (
                <div className="flex justify-center">
                  <motion.button
                    onClick={logout}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="min-w-[150px] px-4 py-2 flex items-center justify-center bg-gradient-to-r from-red-500 to-pink-500 text-white text-sm font-medium rounded-full shadow hover:shadow-md transition whitespace-nowrap"
                  >
                    <Image
                      src="/google-icon.svg"
                      alt="Google"
                      width={20}
                      height={20}
                      className="mr-2"
                    />
                    Logout (
                    {userType === 'superadmin'
                      ? 'Superadmin'
                      : userType === 'club'
                      ? 'Club'
                      : 'Student'}
                    )
                  </motion.button>
                </div>
              ) : (
                <div className="flex flex-wrap justify-center gap-3">
                  <motion.button
                    onClick={() =>
                      (window.location.href = 'http://localhost:5000/auth/student/google')
                    }
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="min-w-[120px] px-3 py-2 flex items-center justify-center bg-gradient-to-r from-emerald-500 to-sky-500 text-white text-sm font-medium rounded-full shadow hover:shadow-md transition whitespace-nowrap"
                  >
                    <Image
                      src="/google-icon.svg"
                      alt="Google"
                      width={20}
                      height={20}
                      className="mr-2"
                    />
                    Student
                  </motion.button>

                  <motion.button
                    onClick={() =>
                      (window.location.href = 'http://localhost:5000/auth/club/google')
                    }
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="min-w-[120px] px-3 py-2 flex items-center justify-center bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-sm font-medium rounded-full shadow hover:shadow-md transition whitespace-nowrap"
                  >
                    <Image
                      src="/google-icon.svg"
                      alt="Google"
                      width={20}
                      height={20}
                      className="mr-2"
                    />
                    Club
                  </motion.button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}