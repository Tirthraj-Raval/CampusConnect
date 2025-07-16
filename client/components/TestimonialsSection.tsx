// components/home/TestimonialsSection.tsx
'use client'

import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { useState, useEffect } from 'react'

const testimonials = [
  {
    quote: "CampusConnect transformed my college experience! I discovered events I never knew existed and made friends through activities I love.",
    author: "Priya Sharma",
    role: "Computer Science, 3rd Year",
    avatar: "/testimonial3.jpg"
  },
  {
    quote: "As a club coordinator, this platform has made event management and student engagement so much easier. Attendance has doubled!",
    author: "Rahul Mehta",
    role: "Drama Club President",
    avatar: "/testimonial1.jpg"
  },
  {
    quote: "Finally, a single place for all college activities. No more missing deadlines or scrambling for last-minute registrations!",
    author: "Ananya Patel",
    role: "Biology, 2nd Year",
    avatar: "/testimonial4.jpeg"
  }
]

export default function TestimonialsSection() {
  const [activeTestimonial, setActiveTestimonial] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [testimonials.length])

  return (
    <section id="testimonials" className="py-20 px-6 md:px-20 bg-gradient-to-br from-sky-50 to-emerald-50">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            What <span className="text-emerald-600">Students</span> Say
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Hear from students and club organizers who use CampusConnect daily.
          </p>
        </motion.div>
        
        <div className="relative h-96 max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            {testimonials.map((testimonial, index) => (
              activeTestimonial === index && (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0 bg-white rounded-2xl shadow-lg p-8 md:p-12 flex flex-col justify-center"
                >
                  <div className="text-5xl text-emerald-100 mb-6">"</div>
                  <p className="text-xl text-gray-700 mb-8">{testimonial.quote}</p>
                  <div className="flex items-center">
                    <div className="w-16 h-16 rounded-full overflow-hidden border-4 border-emerald-100">
                      <Image
                        src={testimonial.avatar}
                        alt={testimonial.author}
                        width={64}
                        height={64}
                        className="object-cover"
                      />
                    </div>
                    <div className="ml-4">
                      <div className="font-bold text-gray-800">{testimonial.author}</div>
                      <div className="text-gray-600">{testimonial.role}</div>
                    </div>
                  </div>
                </motion.div>
              )
            ))}
          </AnimatePresence>
        </div>
        
        <div className="flex justify-center mt-8 space-x-2">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveTestimonial(index)}
              className={`w-3 h-3 rounded-full ${activeTestimonial === index ? 'bg-emerald-500' : 'bg-gray-300'}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}