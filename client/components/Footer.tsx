// components/home/Footer.tsx
'use client'

// Every link in this footer used to be href="#", advertising a Pricing page, a
// Blog, a Help Center, Tutorials, Webinars, Careers and a Privacy Policy that
// have never existed, plus four social accounts that don't exist either. It now
// links only to destinations that are actually in the app.
const exploreLinks = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Events', href: '#events' },
  { label: "Who It's For", href: '#who-its-for' },
]

const clubLinks = [
  { label: 'Browse Clubs', href: '/clubs' },
  { label: 'Club Login', href: '/club-login' },
  { label: 'Student Login', href: '/student-login' },
]

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-16 px-6 md:px-20">
      <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-12">
        <div>
          <div className="text-2xl font-bold text-white mb-4">
            Campus<span className="text-emerald-400">Connect</span>
          </div>
          <p className="mb-6">
            A single place for university clubs to run events and for students to
            find them — registrations, feedback and certificates included.
          </p>
        </div>

        <div>
          <h3 className="text-white font-semibold mb-4">Explore</h3>
          <ul className="space-y-2">
            {exploreLinks.map((item) => (
              <li key={item.href}>
                <a href={item.href} className="hover:text-white transition">{item.label}</a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-white font-semibold mb-4">Get Started</h3>
          <ul className="space-y-2">
            {clubLinks.map((item) => (
              <li key={item.href}>
                <a href={item.href} className="hover:text-white transition">{item.label}</a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-white font-semibold mb-4">About</h3>
          <p className="text-sm leading-relaxed">
            An independent project built for university clubs and students. Not
            affiliated with, or endorsed by, any institution.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-gray-800 text-center text-gray-500 text-sm">
        © {new Date().getFullYear()} CampusConnect. All rights reserved. Built by a student, for students.
      </div>
    </footer>
  )
}
