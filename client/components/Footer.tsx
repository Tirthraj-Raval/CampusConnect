// components/home/Footer.tsx
'use client'

import Image from 'next/image'
import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-16 px-6 md:px-20">
      <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-12">
        <div>
          <div className="text-2xl font-bold text-white mb-4">
            Campus<span className="text-emerald-400">Connect</span>
          </div>
          <p className="mb-6">
            Connecting students with campus life since 2023. Making college experiences unforgettable.
          </p>
          <div className="flex space-x-4">
            {['twitter', 'facebook', 'instagram', 'linkedin'].map((social) => (
              <a key={social} href="#" className="text-gray-400 hover:text-white transition">
                <span className="sr-only">{social}</span>
                <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center">
                  <Image
                    src={`/${social}-icon.svg`}
                    alt={social}
                    width={16}
                    height={16}
                  />
                </div>
              </a>
            ))}
          </div>
        </div>
        
        <div>
          <h3 className="text-white font-semibold mb-4">Product</h3>
          <ul className="space-y-2">
            {['Features', 'How It Works', 'Pricing', 'Testimonials'].map((item) => (
              <li key={item}>
                <a href="#" className="hover:text-white transition">{item}</a>
              </li>
            ))}
          </ul>
        </div>
        
        <div>
          <h3 className="text-white font-semibold mb-4">Resources</h3>
          <ul className="space-y-2">
            {['Blog', 'Help Center', 'Tutorials', 'Webinars'].map((item) => (
              <li key={item}>
                <a href="#" className="hover:text-white transition">{item}</a>
              </li>
            ))}
          </ul>
        </div>
        
        <div>
          <h3 className="text-white font-semibold mb-4">Company</h3>
          <ul className="space-y-2">
            {['About Us', 'Careers', 'Contact', 'Privacy Policy'].map((item) => (
              <li key={item}>
                <a href="#" className="hover:text-white transition">{item}</a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-gray-800 text-center text-gray-500 text-sm">
        © {new Date().getFullYear()} CampusConnect. All rights reserved. Built with ❤ by students for students.
      </div>
    </footer>
  )
}