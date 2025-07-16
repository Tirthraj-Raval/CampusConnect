// components/home/EventsSection.tsx
'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'

const events = [
  {
    image: '/event-tech.png',
    title: 'Hackfest 2025',
    desc: 'Join 24-hour coding challenge hosted by Tech Club.',
    date: 'Oct 15-16, 2025',
    club: 'Tech Society',
  },
  {
    image: '/event-dance.jpg',
    title: 'Cultural Night',
    desc: 'Dance, music and fun with Food & Cultural Society.',
    date: 'Nov 5, 2025',
    club: 'Cultural Society',
  },
  {
    image: '/event-food.jpg',
    title: 'Food Carnival',
    desc: 'Enjoy dishes from 20+ clubs. Taste. Vote. Win prizes!',
    date: 'Dec 12, 2025',
    club: 'Food Club',
  },
]

export default function EventsSection() {
  return (
    <section id="events" className="py-20 px-6 md:px-20 bg-white">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            Trending <span className="text-emerald-600">Events</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Check out what's happening around your campus this week.
          </p>
        </motion.div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {events.map((event, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              viewport={{ once: true }}
              className="rounded-2xl overflow-hidden shadow-md bg-white hover:shadow-xl transition transform hover:-translate-y-2"
            >
              <div className="relative h-64 overflow-hidden">
                <Image
                  src={event.image}
                  alt={event.title}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute bottom-0 left-0 p-4">
                  <div className="text-xs font-semibold text-white bg-emerald-500 px-2 py-1 rounded-full inline-block mb-2">
                    {event.club}
                  </div>
                  <h3 className="text-xl font-bold text-white">{event.title}</h3>
                  <p className="text-sm text-white/90">{event.date}</p>
                </div>
              </div>
              <div className="p-6">
                <p className="text-gray-600 mb-4">{event.desc}</p>
                <button className="w-full py-2.5 bg-emerald-50 text-emerald-600 font-medium rounded-lg hover:bg-emerald-100 transition">
                  View Details
                </button>
              </div>
            </motion.div>
          ))}
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <button className="px-8 py-3 border-2 border-emerald-500 text-emerald-600 font-semibold rounded-full hover:bg-emerald-50 transition">
            View All Events
          </button>
        </motion.div>
      </div>
    </section>
  )
}