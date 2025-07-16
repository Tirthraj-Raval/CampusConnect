// components/home/InstitutionsSection.tsx
'use client'

import { motion } from 'framer-motion'

const institutions = [
  { 
    name: "IIT Delhi", 
    logo: "https://upload.wikimedia.org/wikipedia/en/f/fd/Indian_Institute_of_Technology_Delhi_Logo.svg",
    color: "from-blue-500 to-blue-700"
  },
  { 
    name: "IIM Ahmedabad", 
    logo: "https://static.theprint.in/wp-content/uploads/2022/04/ghjgj20220401082329.jpg?compress=true&dpr=2.6&quality=80&w=376",
    color: "from-red-500 to-red-700"
  },
  { 
    name: "BITS Pilani", 
    logo: "https://upload.wikimedia.org/wikipedia/en/d/d3/BITS_Pilani-Logo.svg",
    color: "from-orange-500 to-orange-700"
  },
  { 
    name: "NIT Trichy", 
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/NITT_logo.png/601px-NITT_logo.png",
    color: "from-green-500 to-green-700"
  },
  { 
    name: "VIT Vellore", 
    logo: "https://upload.wikimedia.org/wikipedia/en/c/c5/Vellore_Institute_of_Technology_seal_2017.svg",
    color: "from-purple-500 to-purple-700"
  },
  { 
    name: "SRM Chennai", 
    logo: "https://scet.berkeley.edu/wp-content/uploads/8.-SRM-Logo.png",
    color: "from-indigo-500 to-indigo-700"
  },
  { 
    name: "NSUT Delhi", 
    logo: "https://upload.wikimedia.org/wikipedia/en/thumb/e/e9/Netaji_Subhas_University_of_Technology.svg/1200px-Netaji_Subhas_University_of_Technology.svg.png",
    color: "from-pink-500 to-pink-700"
  },
  { 
    name: "DTU Delhi", 
    logo: "https://www.getadmissioninfo.com/uploads/topics/delhi-technological-engineering-university-dtu-logo.png",
    color: "from-teal-500 to-teal-700"
  },
  { 
    name: "IIT Bombay", 
    logo: "https://upload.wikimedia.org/wikipedia/en/1/1d/Indian_Institute_of_Technology_Bombay_Logo.svg",
    color: "from-cyan-500 to-cyan-700"
  },
  { 
    name: "IIIT Hyderabad", 
    logo: "https://upload.wikimedia.org/wikipedia/en/3/38/IIIT_Hyderabad_Logo.svg",
    color: "from-amber-500 to-amber-700"
  }
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
            Trusted by <span className="text-emerald-600">Leading Institutions</span>
          </h2>
          <p className="text-gray-600 text-lg">
            Students join from top colleges and universities across the country
          </p>
        </motion.div>

        {/* Infinite scrolling logos */}
        <div className="relative overflow-hidden">
          <div className="flex space-x-10 animate-scroll">
            {/* First set of logos */}
            <div className="flex space-x-10 min-w-max">
              {institutions.map((institution, index) => (
                <motion.div
                  key={index}
                  className="flex-shrink-0 w-64 h-40 bg-gradient-to-br from-white to-gray-100 rounded-3xl border border-gray-300 shadow-lg flex items-center justify-center group hover:shadow-2xl hover:border-emerald-300 transition-all duration-300 cursor-pointer"
                  whileHover={{ scale: 1.1, y: -10 }}
                >
                  <div className="text-center p-6">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white shadow-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 overflow-hidden">
                      <img
                        src={institution.logo}
                        alt={`${institution.name} logo`}
                        className="w-16 h-16 object-contain"
                        onError={(e) => {
                          const img = e.target as HTMLImageElement;
                          img.style.display = 'none';
                          const fallback = img.nextElementSibling as HTMLElement | null;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                      <div
                        className={`w-16 h-16 bg-gradient-to-r ${institution.color} rounded-full hidden items-center justify-center text-white text-2xl font-bold`}
                      >
                        {institution.name.charAt(0)}
                      </div>
                    </div>
                    <h3 className="text-base font-semibold text-gray-800 group-hover:text-emerald-600 transition-colors duration-300">
                      {institution.name}
                    </h3>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Duplicate set for seamless loop */}
            <div className="flex space-x-10 min-w-max">
              {institutions.map((institution, index) => (
                <motion.div
                  key={`duplicate-${index}`}
                  className="flex-shrink-0 w-64 h-40 bg-gradient-to-br from-white to-gray-100 rounded-3xl border border-gray-300 shadow-lg flex items-center justify-center group hover:shadow-2xl hover:border-emerald-300 transition-all duration-300 cursor-pointer"
                  whileHover={{ scale: 1.1, y: -10 }}
                >
                  <div className="text-center p-6">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white shadow-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 overflow-hidden">
                      <img
                        src={institution.logo}
                        alt={`${institution.name} logo`}
                        className="w-16 h-16 object-contain"
                        onError={(e) => {
                          const img = e.target as HTMLImageElement;
                          img.style.display = 'none';
                          if (img.nextSibling && img.nextSibling instanceof HTMLElement) {
                            (img.nextSibling as HTMLElement).style.display = 'flex';
                          }
                        }}
                      />
                      <div
                        className={`w-16 h-16 bg-gradient-to-r ${institution.color} rounded-full hidden items-center justify-center text-white text-2xl font-bold`}
                      >
                        {institution.name.charAt(0)}
                      </div>
                    </div>
                    <h3 className="text-base font-semibold text-gray-800 group-hover:text-emerald-600 transition-colors duration-300">
                      {institution.name}
                    </h3>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Stats below the scrolling logos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16"
        >
          {[
            { value: "200+", label: "Partner Colleges", color: "from-emerald-500 to-emerald-600" },
            { value: "50K+", label: "Active Students", color: "from-sky-500 to-sky-600" },
            { value: "1000+", label: "Events Monthly", color: "from-purple-500 to-purple-600" },
            { value: "98%", label: "Satisfaction Rate", color: "from-orange-500 to-orange-600" },
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className={`text-3xl md:text-4xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-2`}>
                {stat.value}
              </div>
              <div className="text-gray-600 font-medium text-sm">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
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