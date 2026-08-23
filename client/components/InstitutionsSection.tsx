// components/home/InstitutionsSection.tsx
'use client'

import { motion } from 'framer-motion'

// The kinds of clubs the platform is built to run. These are categories, not
// customers — nothing here implies an endorsement or an existing deployment.
// Rendered from local styling rather than remote logos, so the marquee costs no
// external requests and can't break on a dead image host.
const clubTypes = [
  { name: "Coding Club", icon: "💻", color: "from-blue-500 to-blue-700" },
  { name: "Robotics", icon: "🤖", color: "from-slate-500 to-slate-700" },
  { name: "Cultural", icon: "🎭", color: "from-red-500 to-red-700" },
  { name: "Music", icon: "🎸", color: "from-orange-500 to-orange-700" },
  { name: "Sports", icon: "⚽", color: "from-green-500 to-green-700" },
  { name: "Entrepreneurship", icon: "🚀", color: "from-purple-500 to-purple-700" },
  { name: "Photography", icon: "📷", color: "from-indigo-500 to-indigo-700" },
  { name: "Literary", icon: "📚", color: "from-pink-500 to-pink-700" },
  { name: "Debate", icon: "🎤", color: "from-teal-500 to-teal-700" },
  { name: "Design", icon: "🎨", color: "from-amber-500 to-amber-700" }
]

export default function InstitutionsSection() {
  return (
    <section className="py-16 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 md:px-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3">
            Built for <span className="text-emerald-600">Every Kind of Club</span>
          </h2>
          <p className="text-gray-600 text-lg">
            From coding and robotics to cultural, sports and debate — the same tools
            for every society on campus
          </p>
        </motion.div>

        {/* Infinite scrolling club categories. The list is rendered twice so the
            marquee loops seamlessly; the second copy is hidden from assistive
            tech so it isn't announced as duplicate content. */}
        <div className="relative overflow-hidden">
          <div className="flex space-x-10 animate-scroll">
            {[0, 1].map((copy) => (
              <div
                key={copy}
                className="flex space-x-10 min-w-max"
                aria-hidden={copy === 1}
              >
                {clubTypes.map((club) => (
                  <motion.div
                    key={`${copy}-${club.name}`}
                    className="flex-shrink-0 w-64 h-40 bg-gradient-to-br from-white to-gray-100 rounded-3xl border border-gray-300 shadow-lg flex items-center justify-center group hover:shadow-2xl hover:border-emerald-300 transition-all duration-300 cursor-pointer"
                    whileHover={{ scale: 1.1, y: -10 }}
                  >
                    <div className="text-center p-6">
                      <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white shadow-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 overflow-hidden">
                        <div
                          className={`w-16 h-16 bg-gradient-to-r ${club.color} rounded-full flex items-center justify-center text-white text-2xl`}
                        >
                          {club.icon}
                        </div>
                      </div>
                      <h3 className="text-base font-semibold text-gray-800 group-hover:text-emerald-600 transition-colors duration-300">
                        {club.name}
                      </h3>
                    </div>
                  </motion.div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-100%);
          }
        }

        .animate-scroll {
          animation: scroll 40s linear infinite;
        }

        .animate-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  )
}