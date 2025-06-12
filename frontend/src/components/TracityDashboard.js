import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TracityGlobe from './TracityGlobe';
import ChatPopup from './ChatPopup';
import TracityStatCard from './TracityStatCard';
import TracityFeatureCard from './TracityFeatureCard';

const TracityDashboard = ({ stats }) => {
  const [showChat, setShowChat] = useState(false);
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDatasets();
  }, []);

  const fetchDatasets = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/datasets`);
      if (response.ok) {
        const data = await response.json();
        setDatasets(data);
      }
    } catch (error) {
      console.error('Error fetching datasets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGlobeClick = () => {
    setShowChat(true);
  };

  const handleCloseChat = () => {
    setShowChat(false);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 10
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 p-4 md:p-6 lg:p-8">
      <motion.div
        className="max-w-7xl mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center mr-4">
              <span className="text-2xl">⚡</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold gradient-text">
              TRACITY
            </h1>
          </div>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Your AI Data Companion
          </p>
        </motion.div>

        {/* Main Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-8">
          
          {/* Effortless Data Perfection Card - Top Left */}
          <motion.div variants={itemVariants} className="lg:col-span-2 xl:col-span-2">
            <TracityFeatureCard
              title="Effortless Data Perfection"
              subtitle="14 days trial"
              description="after • $5/month"
              icon="🎯"
              color="dark"
              size="large"
            />
          </motion.div>

          {/* Central Globe - Spans center area */}
          <motion.div 
            variants={itemVariants}
            className="lg:col-span-2 xl:col-span-2 lg:row-span-2 flex items-center justify-center relative"
          >
            <div className="bento-card h-full w-full flex flex-col items-center justify-center relative overflow-hidden bg-gradient-to-br from-purple-600/10 via-blue-600/10 to-pink-600/10 border-purple-500/30">
              <TracityGlobe onClick={handleGlobeClick} />
              <motion.div 
                className="text-center mt-6 relative z-10"
                animate={{ y: [0, -5, 0] }}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              >
                <h2 className="text-2xl font-bold gradient-text mb-2">
                  Your AI Data
                </h2>
                <h2 className="text-2xl font-bold gradient-text mb-2">
                  Companion
                </h2>
              </motion.div>
            </div>
          </motion.div>

          {/* User Stats Card - Top Right */}
          <motion.div variants={itemVariants} className="lg:col-span-2 xl:col-span-2">
            <TracityStatCard
              title="25M"
              subtitle="created insights"
              value={`${Math.round(stats.total_visualizations / 1000)}K`}
              description="visualizations generated"
              icon="📊"
              color="orange"
            />
          </motion.div>

          {/* Happy Users Card - Left */}
          <motion.div variants={itemVariants} className="lg:col-span-1 xl:col-span-1">
            <TracityStatCard
              title="12K"
              subtitle="happy users"
              value={`${Math.round(stats.total_users / 1000)}K`}
              description="data explorers"
              showUserAvatars={true}
              color="slate"
            />
          </motion.div>

          {/* Generate Button Card - Left */}
          <motion.div variants={itemVariants} className="lg:col-span-1 xl:col-span-1">
            <div className="bento-card h-full flex items-center justify-center bg-gradient-to-br from-purple-600/80 to-blue-600/80 border-purple-500/50 hover:border-purple-400/70 cursor-pointer group">
              <motion.div 
                className="text-center"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:bg-white/30 transition-all">
                  <span className="text-3xl">⚡</span>
                </div>
                <h3 className="text-lg font-semibold text-white">Generate</h3>
              </motion.div>
            </div>
          </motion.div>

          {/* Branching Paths Card - Right */}
          <motion.div variants={itemVariants} className="lg:col-span-1 xl:col-span-1">
            <TracityFeatureCard
              title="Branching paths"
              description="Explore multiple data directions with branching"
              icon="🌿"
              color="blue"
              size="small"
            />
          </motion.div>

          {/* Keyword Enhancer Card - Right */}
          <motion.div variants={itemVariants} className="lg:col-span-1 xl:col-span-1">
            <TracityFeatureCard
              title="Keyword enhancer"
              description="Boost your data precision with keywords"
              icon="🔍"
              color="pink"
              size="small"
            />
          </motion.div>

          {/* Data Templates Card - Bottom Left */}
          <motion.div variants={itemVariants} className="lg:col-span-2 xl:col-span-2">
            <div className="bento-card h-full bg-slate-800/50 border-slate-600/30">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-white">Data templates</h3>
                <span className="text-2xl">📁</span>
              </div>
              <p className="text-sm text-slate-400 mb-4">
                Use pre-made templates to jumpstart creativity
              </p>
              <div className="flex items-center space-x-2">
                <div className="bg-blue-600/20 text-blue-300 px-3 py-2 rounded-lg text-sm font-medium">
                  14 days trial
                </div>
                <div className="flex -space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 border-2 border-slate-800"
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Bottom Stats Row */}
          <motion.div variants={itemVariants} className="lg:col-span-2 xl:col-span-2">
            <div className="grid grid-cols-2 gap-4 h-full">
              <div className="bento-card text-center bg-slate-800/30 border-slate-600/30">
                <div className="text-2xl font-bold text-cyan-400 pulse-glow">
                  {stats.total_datasets}
                </div>
                <div className="text-sm text-slate-400">Active Datasets</div>
              </div>
              <div className="bento-card text-center bg-slate-800/30 border-slate-600/30">
                <div className="text-2xl font-bold text-green-400 pulse-glow">
                  99.2%
                </div>
                <div className="text-sm text-slate-400">Accuracy Rate</div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Chat Popup */}
      <AnimatePresence>
        {showChat && (
          <ChatPopup onClose={handleCloseChat} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default TracityDashboard;