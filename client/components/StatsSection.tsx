// components/home/StatsSection.tsx
'use client'

import { motion } from 'framer-motion'

const stats = [
  { value: "500+", label: "Active Clubs" },
  { value: "10K+", label: "Monthly Users" },
  { value: "2K+", label: "Events Monthly" },
  { value: "95%", label: "Satisfaction Rate" }
]

export default function StatsSection() {
  return (
    <section className="py-20 bg-gradient-to-br from-emerald-50 via-sky-50 to-purple-50 relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.05)_1px,transparent_1px)] bg-[size:30px_30px]" />
      
      <div className="max-w-7xl mx-auto px-6 md:px-20 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-emerald-600 to-sky-600 bg-clip-text text-transparent mb-4">
            Trusted by Thousands
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Join the largest campus community platform connecting students across colleges
          </p>
        </motion.div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30, scale: 0.8 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: index * 0.1, type: "spring", stiffness: 100 }}
              viewport={{ once: true }}
              whileHover={{ y: -5, scale: 1.05 }}
              className="text-center p-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100"
            >
              <motion.div 
                className="text-5xl font-black bg-gradient-to-r from-emerald-600 to-sky-600 bg-clip-text text-transparent mb-3"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
              >
                {stat.value}
              </motion.div>
              <div className="text-gray-700 font-bold text-lg">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}