'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  Sparkles, 
  Users, 
  Zap, 
  Shield, 
  Globe, 
  Award,
  ArrowRight,
  Play,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

const features = [
  {
    icon: Sparkles,
    title: 'Showcase Projects',
    description: 'Share your scientific discoveries, creative works, and innovative projects with a global community.',
  },
  {
    icon: Users,
    title: 'Connect & Collaborate',
    description: 'Find like-minded innovators, build your network, and collaborate on groundbreaking ideas.',
  },
  {
    icon: Zap,
    title: 'Real-Time Interactions',
    description: 'Engage with live comments, instant notifications, and dynamic community conversations.',
  },
  {
    icon: Shield,
    title: 'Secure & Private',
    description: 'Your data is protected with enterprise-grade security and GDPR-compliant privacy controls.',
  },
  {
    icon: Globe,
    title: 'Topic Discovery',
    description: 'Explore curated topics, trending research, and discover content tailored to your interests.',
  },
  {
    icon: Award,
    title: 'Skill Badges',
    description: 'Earn recognition for your expertise and contributions to the community.',
  },
];

const stats = [
  { label: 'Active Users', value: '10K+' },
  { label: 'Projects Shared', value: '50K+' },
  { label: 'Topics', value: '500+' },
  { label: 'Countries', value: '120+' },
];

export default function LandingPage() {
  const { user } = useAuth();
  const router = useRouter();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  };

  if (user) {
    router.push('/feed');
    return null;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text">Exposia</span>
            </Link>
            
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="ghost">Log In</Button>
              </Link>
              <Link href="/signup">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 gradient-bg opacity-5"></div>
        
        <motion.div
          className="max-w-7xl mx-auto text-center relative z-10"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.div variants={itemVariants}>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 text-balance">
              Where{' '}
              <span className="gradient-text">Science</span>
              {' & '}
              <span className="gradient-text">Creativity</span>
              {' '}Meet
            </h1>
          </motion.div>

          <motion.p
            variants={itemVariants}
            className="text-xl sm:text-2xl text-gray-600 dark:text-gray-400 mb-8 max-w-3xl mx-auto text-balance"
          >
            Share your projects, connect with innovators, and showcase your work to a global community of creators and scientists.
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link href="/signup">
              <Button size="lg" className="group">
                Start Creating
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="group">
              <Play className="mr-2 w-5 h-5" />
              Watch Demo
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-2 lg:grid-cols-4 gap-8 mt-20 max-w-4xl mx-auto"
          >
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl sm:text-4xl font-bold gradient-text mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600 dark:text-gray-400">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={containerVariants}
          >
            <motion.div variants={itemVariants} className="text-center mb-16">
              <h2 className="text-4xl sm:text-5xl font-bold mb-4">
                Everything You Need to <span className="gradient-text">Shine</span>
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Powerful features designed for creators, researchers, and innovators.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  variants={itemVariants}
                  className="glass rounded-2xl p-8 card-hover"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto glass rounded-3xl p-12 text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 gradient-bg opacity-10"></div>
          
          <div className="relative z-10">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              Ready to Share Your <span className="gradient-text">Vision</span>?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
              Join thousands of creators and innovators already on Exposia.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <Button size="lg" className="group">
                  Create Free Account
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>

            <div className="mt-8 flex items-center justify-center space-x-6 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center">
                <CheckCircle2 className="w-5 h-5 text-green-500 mr-2" />
                Free forever
              </div>
              <div className="flex items-center">
                <CheckCircle2 className="w-5 h-5 text-green-500 mr-2" />
                No credit card
              </div>
              <div className="flex items-center">
                <CheckCircle2 className="w-5 h-5 text-green-500 mr-2" />
                Setup in 2 min
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <Link href="/" className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold gradient-text">Exposia</span>
              </Link>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                The social network for science and creativity.
              </p>
              <p className="text-sm text-gray-500">
                © 2024 Exposia. All rights reserved.
              </p>
            </div>

            <div>
              <h4 className="font-bold mb-4">
              <h4 className="font-bold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                <li><Link href="/features">Features</Link></li>
                <li><Link href="/pricing">Pricing</Link></li>
                <li><Link href="/about">About</Link></li>
                <li><Link href="/blog">Blog</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                <li><Link href="/help">Help Center</Link></li>
                <li><Link href="/privacy">Privacy</Link></li>
                <li><Link href="/terms">Terms</Link></li>
                <li><Link href="/contact">Contact</Link></li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
