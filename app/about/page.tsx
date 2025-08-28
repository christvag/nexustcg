'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'

export default function AboutPage() {
  const team = [
    {
      name: 'John Smith',
      role: 'Head Grader',
      experience: '15+ years',
      specialty: 'Pokemon & MTG',
    },
    {
      name: 'Sarah Johnson',
      role: 'Authentication Expert',
      experience: '12+ years',
      specialty: 'Vintage Cards',
    },
    {
      name: 'Mike Chen',
      role: 'Senior Grader',
      experience: '10+ years',
      specialty: 'Yu-Gi-Oh & Sports',
    },
    {
      name: 'Emily Davis',
      role: 'Quality Control',
      experience: '8+ years',
      specialty: 'Modern TCGs',
    },
  ]

  const features = [
    {
      title: 'Expert Grading',
      description: 'Our team consists of certified professionals with decades of combined experience in card grading.',
      icon: '🎯',
    },
    {
      title: 'State-of-the-Art Facility',
      description: 'Climate-controlled environment with advanced security systems to protect your valuable cards.',
      icon: '🏢',
    },
    {
      title: 'Fast Turnaround',
      description: 'Multiple service levels to meet your timeline needs, from express 2-day to standard processing.',
      icon: '⚡',
    },
    {
      title: 'Transparent Pricing',
      description: 'No hidden fees. Clear, upfront pricing for all our grading services.',
      icon: '💎',
    },
  ]

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="text-gradient">About TCG Grading Service</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            We are the premier trading card grading service, dedicated to preserving
            and authenticating your valuable card collection with the highest standards
            of quality and care.
          </p>
        </motion.div>

        {/* Mission Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-gaming-primary/10 to-gaming-secondary/10 rounded-2xl p-8 mb-16"
        >
          <h2 className="text-3xl font-bold mb-4 text-center">Our Mission</h2>
          <p className="text-lg text-center text-gray-700 dark:text-gray-300 max-w-4xl mx-auto">
            To provide collectors with the most accurate, consistent, and reliable card grading
            service in the industry. We combine traditional expertise with modern technology
            to ensure every card is evaluated fairly and preserved for generations to come.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl font-bold text-center mb-12"
          >
            Why Choose Us
          </motion.h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 text-center card-hover"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Team Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-center mb-12">Meet Our Expert Team</h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((member, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-900 rounded-xl shadow-lg overflow-hidden"
              >
                <div className="h-48 bg-gradient-to-br from-gaming-primary to-gaming-secondary flex items-center justify-center">
                  <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center text-4xl font-bold text-white">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-1">{member.name}</h3>
                  <p className="text-gaming-primary font-medium mb-2">{member.role}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {member.experience} • {member.specialty}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center bg-gradient-to-r from-gaming-primary to-gaming-secondary rounded-2xl p-12"
        >
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Grade Your Collection?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied collectors who trust us with their valuable cards.
          </p>
          <a
            href="/packages"
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-gaming-primary bg-white rounded-lg hover:scale-105 transition-transform"
          >
            Get Started Today
            <svg className="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
        </motion.div>
      </div>
    </div>
  )
}