'use client'

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export default function ClubsUploadPage() {
  const [csv, setCsv] = useState<File | null>(null);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const params = useParams();
  const universityId = params.university_id;

  const handleUpload = async (e: any) => {
    e.preventDefault();
    if (!csv) return;

    setIsSubmitting(true);
    setMessage('');

    const formData = new FormData();
    formData.append('csv', csv);

    try {
      const res = await fetch(`http://localhost:5000/api/university/${universityId}/upload-clubs`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(data.message || 'Clubs uploaded successfully!');
      } else {
        setMessage(data.error || 'Upload failed');
      }
    } catch (err: any) {
      setMessage(err.message || 'Network error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-purple-50 to-pink-50 flex items-center justify-center px-4 py-12">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-purple-200 opacity-20"
            style={{
              width: Math.random() * 200 + 100,
              height: Math.random() * 200 + 100,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              x: [0, Math.random() * 100 - 50],
              y: [0, Math.random() * 100 - 50],
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: Math.random() * 20 + 10,
              repeat: Infinity,
              repeatType: 'reverse',
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white/90 backdrop-blur-sm shadow-2xl rounded-3xl overflow-hidden w-full max-w-2xl border border-white/20"
      >
        {/* Header Section */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6">
          <div className="flex items-center gap-4">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="bg-white/20 p-3 rounded-full backdrop-blur-sm"
            >
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </motion.div>
            <div>
              <h1 className="text-2xl font-bold text-white">Upload Club Data</h1>
              <p className="text-sm text-purple-100">Bulk import clubs via CSV file</p>
            </div>
          </div>
        </div>

        {/* Form Section */}
        <div className="p-8">
          <form onSubmit={handleUpload} className="space-y-6">
            {/* File Upload */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CSV File
                <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="relative">
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col w-full h-32 border-2 border-dashed border-gray-300 hover:border-gray-400 rounded-xl cursor-pointer transition-all hover:bg-gray-50">
                    <div className="flex flex-col items-center justify-center pt-7">
                      <svg className="w-10 h-10 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="pt-1 text-sm tracking-wider text-gray-600">
                        {csv ? csv.name : 'Click to select a CSV file'}
                      </p>
                      {!csv && (
                        <p className="text-xs text-gray-500 mt-2">Only CSV files are accepted</p>
                      )}
                    </div>
                    <input 
                      type="file" 
                      accept=".csv" 
                      onChange={(e) => setCsv(e.target.files?.[0] || null)} 
                      className="opacity-0 absolute" 
                      required 
                    />
                  </label>
                </div>
              </div>
            </motion.div>

            {/* CSV Format Info */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded"
            >
              <div className="flex items-start">
                <div className="flex-shrink-0 text-purple-500">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-purple-800">Expected CSV Format</h3>
                  <div className="mt-1 text-xs text-purple-700">
                    <p>• First column: Club Name</p>
                    <p>• Second column: Description</p>
                    <p>• Third column: Category</p>
                    <p>• Fourth column: Contact Email</p>
                    <p>• Include header row (name,description,category,email)</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Status Message */}
            <AnimatePresence>
              {message && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`p-4 rounded ${
                    message.includes('success') 
                      ? 'bg-emerald-50 border-l-4 border-emerald-500' 
                      : 'bg-red-50 border-l-4 border-red-500'
                  }`}
                >
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg 
                        className={`h-5 w-5 ${
                          message.includes('success') ? 'text-emerald-500' : 'text-red-500'
                        }`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d={
                            message.includes('success') 
                              ? "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                              : "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          } 
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p 
                        className={`text-sm ${
                          message.includes('success') ? 'text-emerald-700' : 'text-red-700'
                        }`}
                      >
                        {message}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="pt-2"
            >
              <button
                type="submit"
                disabled={isSubmitting || !csv}
                className={`w-full flex justify-center items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium px-6 py-3 rounded-full shadow-lg transition-all ${
                  isSubmitting || !csv ? 'opacity-75 cursor-not-allowed' : 'hover:shadow-xl'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Uploading...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Upload Clubs
                  </>
                )}
              </button>
            </motion.div>
          </form>
        </div>

        {/* Floating Elements */}
        <motion.div
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="absolute top-6 right-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center space-x-2 text-sm"
        >
          <motion.div 
            className="w-2 h-2 bg-white rounded-full"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <span>Bulk Import</span>
        </motion.div>
      </motion.div>
    </div>
  );
}