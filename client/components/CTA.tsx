// components/home/CTA.tsx
'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'

interface CTAProps {
  user: { name: string; [key: string]: any } | null
  userType: string | null
  logout: () => Promise<void>
}

export default function CTA({ user, userType, logout }: CTAProps) {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';
  return (
    <section className="py-24 bg-gradient-to-r from-emerald-500 to-sky-500 text-white text-center px-6 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: Math.random() * 100 + 50,
              height: Math.random() * 100 + 50,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>
      
      <div className="max-w-4xl mx-auto relative z-10">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-4xl md:text-5xl font-bold mb-6 leading-tight"
        >
          Ready to Transform Your Campus Experience?
        </motion.h2>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          viewport={{ once: true }}
          className="text-lg md:text-xl mb-8 max-w-2xl mx-auto"
        >
          Join thousands of students who are already discovering, participating, and celebrating with CampusConnect.
        </motion.p>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          viewport={{ once: true }}
          className="flex flex-col sm:flex-row justify-center gap-4"
        >
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
                onClick={() => (window.location.href = `${apiBase}/auth/student/google`)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-sky-500 text-white text-sm font-medium rounded-full shadow-lg hover:shadow-xl transition"
              >
                <Image src="/google-icon.svg" alt="Google" width={20} height={20} className="mr-2" />
                Student Login
              </motion.button>

              <motion.button
                onClick={() => (window.location.href = `${apiBase}/auth/club/google`)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center px-4 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-sm font-medium rounded-full shadow-lg hover:shadow-xl transition"
              >
                <Image src="/google-icon.svg" alt="Google" width={20} height={20} className="mr-2" />
                Club Login
              </motion.button>
            </div>
          )}
          
          <motion.a
            href="#features"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center justify-center px-8 py-3.5 bg-transparent text-white border-2 border-white text-lg font-semibold rounded-full hover:bg-white/10 transition"
          >
            Learn More
          </motion.a>
        </motion.div>
      </div>
    </section>
  )
}