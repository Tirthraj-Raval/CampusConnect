// components/home/HowItWorks.tsx
'use client'

import { motion } from 'framer-motion'

const steps = [
  {
    step: 1,
    title: 'Login with College Email',
    desc: 'Secure Google login ensures only verified students can join.',
    icon: '🔐',
  },
  {
    step: 2,
    title: 'Explore & Subscribe',
    desc: 'Follow clubs you love. From tech to food, choose your interests.',
    icon: '🔍',
  },
  {
    step: 3,
    title: 'Get Real-time Feeds',
    desc: 'See upcoming events and competitions from subscribed clubs.',
    icon: '📲',
  },
  {
    step: 4,
    title: 'RSVP & Participate',
    desc: 'Register, get reminders, and attend amazing events hassle-free.',
    icon: '✅',
  },
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 px-6 md:px-20 bg-gradient-to-br from-sky-50 to-emerald-50">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            How It <span className="text-emerald-600">Works</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Get started in just 4 simple steps and unlock the full potential of your campus experience.
          </p>
        </motion.div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              viewport={{ once: true }}
              className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition border-t-4 border-emerald-400 relative overflow-hidden"
            >
              <div className="absolute -top-4 -right-4 text-9xl opacity-5 text-emerald-400 font-bold">{step.step}</div>
              <div className="text-4xl mb-4">{step.icon}</div>
              <div className="text-emerald-600 text-xl font-bold mb-2">Step {step.step}</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">{step.title}</h3>
              <p className="text-gray-600">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}