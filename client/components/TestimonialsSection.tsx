// components/home/WhoItsFor.tsx (file still named TestimonialsSection.tsx —
// renamed properly in the Phase 2 component split).
//
// This slot used to hold three testimonials attributed to named students with
// stock-photo avatars. Nobody had said any of it. Rather than delete the section
// and leave a gap in the page, it now describes what the platform does for each
// audience in the product's own voice — same carousel, same animation, nothing
// put in someone else's mouth.
'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'

const audiences = [
  {
    audience: "For Students",
    icon: "🎓",
    headline: "Everything happening on campus, in one place.",
    detail:
      "Follow the clubs you care about, register for events in a click, keep track of what you've signed up for, and collect your certificates as you go.",
  },
  {
    audience: "For Club Organisers",
    icon: "📋",
    headline: "Run an event without a spreadsheet and three WhatsApp groups.",
    detail:
      "Publish events, watch registrations arrive live, manage your committee, gather feedback afterwards, and issue certificates to the people who actually turned up.",
  },
  {
    audience: "For Universities",
    icon: "📊",
    headline: "See what campus engagement actually looks like.",
    detail:
      "Participation, attendance and feedback across every club and event — reported from real activity instead of estimated at the end of the year.",
  },
]

export default function TestimonialsSection() {
  const [activeAudience, setActiveAudience] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveAudience((prev) => (prev + 1) % audiences.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [audiences.length])

  return (
    <section id="who-its-for" className="py-20 px-6 md:px-20 bg-gradient-to-br from-sky-50 to-emerald-50">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            Who It&apos;s <span className="text-emerald-600">For</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            One platform, three sides of campus life.
          </p>
        </motion.div>

        <div className="relative h-96 max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            {audiences.map((item, index) => (
              activeAudience === index && (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0 bg-white rounded-2xl shadow-lg p-8 md:p-12 flex flex-col justify-center"
                >
                  <div className="flex items-center mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-3xl">
                      {item.icon}
                    </div>
                    <div className="ml-4 text-sm font-bold uppercase tracking-wide text-emerald-600">
                      {item.audience}
                    </div>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4 leading-snug">
                    {item.headline}
                  </h3>
                  <p className="text-lg text-gray-600 leading-relaxed">{item.detail}</p>
                </motion.div>
              )
            ))}
          </AnimatePresence>
        </div>

        <div className="flex justify-center mt-8 space-x-2">
          {audiences.map((item, index) => (
            <button
              key={index}
              onClick={() => setActiveAudience(index)}
              aria-label={`Show ${item.audience}`}
              className={`w-3 h-3 rounded-full ${activeAudience === index ? 'bg-emerald-500' : 'bg-gray-300'}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
