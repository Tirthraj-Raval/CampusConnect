// components/home/HeroSection.tsx
'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'

interface HeroSectionProps {
  user: { name: string; [key: string]: any } | null
  handleGoogleLogin: () => Promise<void>
}

export default function HeroSection({ user, handleGoogleLogin }: HeroSectionProps) {
  return (
    <section className="relative pt-32 pb-20 px-6 md:px-20 text-center overflow-hidden">
      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-8"
        >
          <div className="inline-flex items-center px-4 py-2 bg-emerald-100 text-emerald-600 rounded-full text-sm font-medium mb-6">
            <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></span>
            Join 10,000+ students already connected
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-6xl md:text-7xl lg:text-8xl font-extrabold text-gray-800 mb-8 leading-tight"
        >
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-sky-500">{user ? `Welcome ${user.name.split(' ')[0]}` : 'Discover'}</span><br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-500 to-purple-500">{user ? 'Explore' : 'Join'}</span><br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-emerald-600">{user ? 'Connect' : 'Celebrate'}</span>
        </motion.h1>
  
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-12 leading-relaxed"
        >
          CampusConnect brings every club event, competition, fest, and opportunity from your college — 
          <span className="font-semibold text-emerald-600"> directly to your fingertips.</span>
        </motion.p>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-col sm:flex-row justify-center gap-6 mb-16"
        >
          <motion.button
            onClick={handleGoogleLogin}
            whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(16, 185, 129, 0.3)" }}
            whileTap={{ scale: 0.95 }}
            className="group inline-flex items-center justify-center px-10 py-4 bg-gradient-to-r from-emerald-500 to-sky-500 text-white text-lg font-semibold rounded-full hover:shadow-xl transition-all duration-300 shadow-lg relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-sky-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <svg className="w-6 h-6 mr-3 relative z-10" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="relative z-10">Get Started for Free</span>
          </motion.button>
          
          <motion.a
            href="#features"
            whileHover={{ scale: 1.05, borderColor: "rgb(16, 185, 129)" }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center justify-center px-10 py-4 bg-white text-gray-800 border-2 border-gray-200 text-lg font-semibold rounded-full hover:bg-gray-50 transition-all duration-300 shadow-lg"
          >
            <span className="mr-2">Learn More</span>
            <motion.svg 
              className="w-5 h-5" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </motion.svg>
          </motion.a>
        </motion.div>

        {/* Interactive dashboard preview */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.8, y: 100 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.8, type: "spring", stiffness: 60 }}
          className="mt-16 max-w-6xl mx-auto relative"
        >
          <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/20 bg-gradient-to-br from-white/90 to-gray-50/90 backdrop-blur-xl p-8">
            {/* Enhanced Mock Dashboard Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                <motion.div 
                  className="w-14 h-14 bg-gradient-to-r from-emerald-500 to-sky-500 rounded-xl flex items-center justify-center shadow-lg"
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                  <span className="text-white font-bold text-2xl">CC</span>
                </motion.div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-800">Your Dashboard</h3>
                  <p className="text-gray-600 font-medium">Welcome back, Student!</p>
                </div>
              </div>
              <div className="flex space-x-3">
                <motion.div 
                  className="w-4 h-4 bg-red-400 rounded-full shadow-sm"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <motion.div 
                  className="w-4 h-4 bg-yellow-400 rounded-full shadow-sm"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                />
                <motion.div 
                  className="w-4 h-4 bg-green-400 rounded-full shadow-sm"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
                />
              </div>
            </div>

            {/* Enhanced Event Cards */}
            <div className="grid md:grid-cols-3 gap-6 mb-6">
              {[
                { title: "Tech Hackathon", club: "Tech Society", color: "from-emerald-400 to-emerald-600", emoji: "💻", date: "Tomorrow" },
                { title: "Cultural Night", club: "Cultural Club", color: "from-sky-400 to-sky-600", emoji: "🎭", date: "This Weekend" },
                { title: "Food Festival", club: "Food Club", color: "from-purple-400 to-purple-600", emoji: "🍕", date: "Next Week" },
              ].map((event, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 1 + i * 0.15 }}
                  whileHover={{ y: -8, scale: 1.03 }}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100"
                >
                  <motion.div 
                    className={`w-14 h-14 bg-gradient-to-r ${event.color} rounded-xl flex items-center justify-center text-white text-3xl mb-4 shadow-lg`}
                    whileHover={{ rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 0.5 }}
                  >
                    {event.emoji}
                  </motion.div>
                  <h4 className="font-bold text-gray-800 mb-2 text-lg">{event.title}</h4>
                  <p className="text-sm text-gray-600 mb-4 font-medium">{event.club}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-3 py-1 rounded-full">
                      {event.date}
                    </span>
                    <motion.button 
                      className="text-sm bg-gradient-to-r from-emerald-500 to-sky-500 text-white px-4 py-2 rounded-full font-bold shadow-md hover:shadow-lg transition-all duration-300"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Join
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Enhanced Floating Notifications */}
            <motion.div
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 1.5 }}
              className="absolute top-6 right-6 bg-gradient-to-r from-emerald-500 to-sky-500 text-white px-6 py-3 rounded-2xl shadow-xl flex items-center space-x-3"
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
            
            {/* Additional floating notification */}
            <motion.div
              initial={{ opacity: 0, x: -100 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 2 }}
              className="absolute bottom-6 left-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-2xl shadow-xl flex items-center space-x-3"
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
          </div>
        </motion.div>
      </div>
    </section>
  )
}