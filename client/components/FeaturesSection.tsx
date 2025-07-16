// components/home/FeaturesSection.tsx
'use client'

import { motion } from 'framer-motion'

const features = [
  {
    title: 'All Events in One Place',
    description: 'Forget the cluttered WhatsApp groups. Get every update on a single dashboard.',
    icon: '📅',
    color: 'bg-emerald-100',
  },
  {
    title: 'Club Subscriptions',
    description: 'Subscribe only to the clubs you care about and get curated feeds.',
    icon: '🔔',
    color: 'bg-sky-100',
  },
  {
    title: 'Instant Notifications',
    description: 'Never miss a competition or workshop. Be notified in real time.',
    icon: '⚡',
    color: 'bg-purple-100',
  },
  {
    title: 'Personalized Calendar',
    description: 'Sync all events with your personal calendar in one click.',
    icon: '🗓',
    color: 'bg-amber-100',
  },
  {
    title: 'Event Reminders',
    description: 'Get timely reminders so you never miss an important deadline.',
    icon: '⏰',
    color: 'bg-rose-100',
  },
  {
    title: 'Exclusive Content',
    description: 'Access member-only resources and materials from your clubs.',
    icon: '🔒',
    color: 'bg-indigo-100',
  },
]

export default function FeaturesSection() {
  return (
    <section id="features" className="py-20 px-6 md:px-20 bg-white">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            Why Choose <span className="text-emerald-600">CampusConnect</span>?
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Everything you need to stay connected with your campus life, all in one place.
          </p>
        </motion.div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              viewport={{ once: true }}
              className={`rounded-2xl p-8 shadow-sm hover:shadow-md transition ${feature.color}`}
            >
              <div className="text-5xl mb-6">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}