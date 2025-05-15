import { useState, useEffect } from "react";
import { Link } from "wouter";
import { BarChart3, ChevronDown, Users, BarChart4, Star, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// Import animations
import { motion } from "framer-motion";

const LandingPage = () => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Detect dark mode
  useEffect(() => {
    // Check if document has .dark class or preferred color scheme is dark
    const checkDarkMode = () => {
      const isDark = 
        document.documentElement.classList.contains('dark') || 
        window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(isDark);
    };
    
    checkDarkMode();
    
    // Listen for changes in color scheme preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', checkDarkMode);
    
    // Listen for class changes on document for theme toggle
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ['class'] 
    });
    
    return () => {
      mediaQuery.removeEventListener('change', checkDarkMode);
      observer.disconnect();
    };
  }, []);

  // Handle scroll effect for navbar with smooth progress
  useEffect(() => {
    const handleScroll = () => {
      // Calculate scroll percentage (0 to 1) for the first 200px
      const scrollY = window.scrollY;
      const maxScrollForEffect = 200;
      const progress = Math.min(scrollY / maxScrollForEffect, 1);
      setScrollProgress(progress);
      
      // Set scrolled state for classes toggle
      const isScrolled = scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [scrolled]);

  // Statistics animation
  const stats = [
    { label: "Marketers", value: "5,000+", icon: <Users className="h-5 w-5 text-primary" /> },
    { label: "Clicks", value: "250,000+", icon: <BarChart4 className="h-5 w-5 text-primary" /> },
    { label: "Revenue", value: "₦150M+", icon: <BarChart3 className="h-5 w-5 text-primary" /> },
  ];

  // Features
  const features = [
    {
      title: "All-in-one platform",
      description: "Bring together your affiliate and referral programs within one account.",
      icon: <BarChart3 className="h-6 w-6" />,
    },
    {
      title: "Affiliate Programs",
      description: "Create advanced affiliate programs with ease for your business growth.",
      icon: <Users className="h-6 w-6" />,
    },
    {
      title: "Refer-a-friend & Loyalty",
      description: "Launch a refer-a-friend program that rewards both referrers and friends.",
      icon: <Star className="h-6 w-6" />,
    },
    {
      title: "Newsletter Referral",
      description: "Grow your email subscriber list and increase engagement with referrals.",
      icon: <CheckCircle2 className="h-6 w-6" />,
    },
  ];

  // Motion variants for animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation with smooth glassmorphism effect */}
      <header
        className="sticky top-0 z-50 transition-all duration-300"
        style={{
          backgroundColor: scrollProgress > 0 
            ? isDarkMode 
              ? `rgba(15, 23, 42, ${scrollProgress * 0.85})` // Dark slate color for dark mode
              : `rgba(255, 255, 255, ${scrollProgress * 0.85})` // White for light mode
            : 'transparent',
          backdropFilter: `blur(${scrollProgress * 8}px)`,
          boxShadow: scrollProgress > 0 
            ? isDarkMode
              ? `0 4px 15px -3px rgba(0, 0, 0, ${scrollProgress * 0.25})` // Darker shadow for dark mode
              : `0 4px 6px -1px rgba(0, 0, 0, ${scrollProgress * 0.05})` // Light shadow for light mode
            : 'none'
        }}
        data-scroll-progress={Math.round(scrollProgress * 100)}
      >
        <div className="container mx-auto flex items-center justify-between py-4">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <div className="bg-primary text-white p-2 rounded">
                <BarChart3 className="h-6 w-6" />
              </div>
              <span className="ml-2 text-2xl font-bold">Growvia</span>
            </Link>
            
            <nav className="hidden md:flex ml-12 space-x-8">
              <div className="relative group">
                <button 
                  className={`flex items-center transition-colors duration-300 ${
                    scrollProgress > 0.5 
                      ? 'text-gray-800 dark:text-gray-200' 
                      : 'text-gray-700 dark:text-gray-300'
                  } hover:text-primary dark:hover:text-primary-400`}
                >
                  Features <ChevronDown className="h-4 w-4 ml-1" />
                </button>
                <div className="absolute left-0 mt-2 w-64 rounded-md shadow-lg bg-white dark:bg-slate-900 ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="p-4 space-y-4">
                    <a href="#" className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-md">Affiliate Programs</a>
                    <a href="#" className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-md">Referral Programs</a>
                    <a href="#" className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-md">Analytics Dashboard</a>
                    <a href="#" className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-md">Payout Management</a>
                  </div>
                </div>
              </div>
              
              <div className="relative group">
                <button 
                  className={`flex items-center transition-colors duration-300 ${
                    scrollProgress > 0.5 
                      ? 'text-gray-800 dark:text-gray-200' 
                      : 'text-gray-700 dark:text-gray-300'
                  } hover:text-primary dark:hover:text-primary-400`}
                >
                  Services <ChevronDown className="h-4 w-4 ml-1" />
                </button>
                <div className="absolute left-0 mt-2 w-64 rounded-md shadow-lg bg-white dark:bg-slate-900 ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="p-4 space-y-4">
                    <a href="#" className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-md">Integration Support</a>
                    <a href="#" className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-md">Migration Assistance</a>
                    <a href="#" className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-md">Consultancy</a>
                  </div>
                </div>
              </div>
              
              <Link 
                href="/pricing" 
                className={`transition-colors duration-300 ${
                  scrollProgress > 0.5 
                    ? 'text-gray-800 dark:text-gray-200' 
                    : 'text-gray-700 dark:text-gray-300'
                } hover:text-primary dark:hover:text-primary-400`}
              >
                Pricing
              </Link>
              
              <div className="relative group">
                <button 
                  className={`flex items-center transition-colors duration-300 ${
                    scrollProgress > 0.5 
                      ? 'text-gray-800 dark:text-gray-200' 
                      : 'text-gray-700 dark:text-gray-300'
                  } hover:text-primary dark:hover:text-primary-400`}
                >
                  Resources <ChevronDown className="h-4 w-4 ml-1" />
                </button>
                <div className="absolute left-0 mt-2 w-64 rounded-md shadow-lg bg-white dark:bg-slate-900 ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="p-4 space-y-4">
                    <a href="#" className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-md">Blog & Articles</a>
                    <a href="#" className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-md">Knowledge Base</a>
                    <a href="#" className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-md">Integrations</a>
                  </div>
                </div>
              </div>
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            <Link href="/login">
              <Button 
                variant={scrollProgress > 0.5 ? "outline" : "ghost"} 
                className="rounded-full px-6 transition-all duration-300"
              >
                Log in
              </Button>
            </Link>
            <Link href="/register">
              <Button 
                className={`rounded-full px-6 transition-all duration-300 ${
                  scrollProgress > 0.5 
                    ? 'bg-primary hover:bg-primary-600' 
                    : 'bg-primary/90 hover:bg-primary'
                }`}
              >
                Sign up
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="absolute inset-0 opacity-25">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBzdHJva2U9IiM5OTkiIHN0cm9rZS13aWR0aD0iMS41IiBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiIG9wYWNpdHk9Ii4zIiBzdHJva2UtZGFzaGFycmF5PSI1LDUiPjxwYXRoIGQ9Ik00LjUgOS41djQxTTQuNSA5LjVoNDAiLz48L2c+PC9zdmc+')] bg-repeat"></div>
        </div>
        
        <div className="container relative mx-auto px-4 flex flex-col lg:flex-row items-center">
          <motion.div 
            className="lg:w-1/2 mb-12 lg:mb-0"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Accelerate Growth with <span className="text-primary bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">Affiliate Marketing</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 mb-8 max-w-lg">
              Transform your business with our powerful affiliate marketing platform, helping Nigerian businesses convert partnerships into profits.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="rounded-full px-8 py-6 bg-primary hover:bg-primary-600 text-lg">
                Start for free
              </Button>
              <Button size="lg" variant="outline" className="rounded-full px-8 py-6 text-lg">
                See how it works
              </Button>
            </div>
          </motion.div>
          
          <motion.div 
            className="lg:w-1/2 relative"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="relative z-10 bg-white dark:bg-slate-800 rounded-xl shadow-xl overflow-hidden">
              <div className="relative bg-primary-50 dark:bg-slate-700 p-4">
                <div className="flex items-center">
                  <div className="h-3 w-3 rounded-full bg-red-500 mr-2"></div>
                  <div className="h-3 w-3 rounded-full bg-yellow-500 mr-2"></div>
                  <div className="h-3 w-3 rounded-full bg-green-500"></div>
                </div>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {stats.map((stat, index) => (
                    <div key={index} className="flex flex-col items-center justify-center p-4 rounded-lg bg-slate-50 dark:bg-slate-700">
                      <div className="bg-primary/10 p-3 rounded-full mb-3">
                        {stat.icon}
                      </div>
                      <span className="text-2xl font-bold">{stat.value}</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</span>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 bg-white dark:bg-slate-600 rounded-lg p-4 border border-gray-200 dark:border-slate-700 flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Coupon</div>
                    <div className="font-mono font-bold">NIGERIA30</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Link</div>
                    <div className="font-mono font-bold text-primary">growvia.com/samuel</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Reward</div>
                    <div className="font-bold">₦15,000</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Decorative elements */}
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-gradient-to-br from-primary-200 to-primary-400 rounded-full opacity-30 filter blur-xl"></div>
            <div className="absolute -bottom-16 -left-12 w-64 h-64 bg-gradient-to-tr from-purple-400 to-pink-400 rounded-full opacity-20 filter blur-xl"></div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-white dark:bg-slate-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">What makes Growvia so good?</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Growvia is your all-in-one solution for creating advanced affiliate and referral programs tailored to your Nigerian business needs.
            </p>
          </div>
          
          {/* Feature tabs */}
          <div className="flex justify-center mb-12 overflow-x-auto no-scrollbar">
            <div className="inline-flex p-1 bg-gray-100 dark:bg-slate-800 rounded-full">
              <button className="px-6 py-2 rounded-full bg-white dark:bg-slate-700 shadow-sm text-primary font-medium">
                Program variety
              </button>
              <button className="px-6 py-2 rounded-full text-gray-600 dark:text-gray-400 font-medium">
                Advanced rewards
              </button>
              <button className="px-6 py-2 rounded-full text-gray-600 dark:text-gray-400 font-medium">
                Easy integration
              </button>
              <button className="px-6 py-2 rounded-full text-gray-600 dark:text-gray-400 font-medium">
                Partner enablement
              </button>
              <button className="px-6 py-2 rounded-full text-gray-600 dark:text-gray-400 font-medium">
                Payouts
              </button>
            </div>
          </div>
          
          {/* Feature boxes */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            {features.map((feature, index) => (
              <motion.div 
                key={index} 
                className="bg-slate-50 dark:bg-slate-800 p-6 rounded-xl"
                variants={itemVariants}
              >
                <div className="bg-primary/10 p-3 inline-block rounded-lg mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Relationships Section */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="container mx-auto px-4">
          <motion.div 
            className="max-w-3xl mx-auto text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Relationships that grow your business</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Attract the perfect affiliates and motivate customers to become loyal brand ambassadors, all while growing your subscriber base with our all-in-one platform.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div 
              className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <div className="p-6">
                <div className="bg-primary/10 p-3 inline-block rounded-lg mb-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-4">Affiliate</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Create, launch, and manage advanced affiliate programs with ease.
                </p>
                <div className="flex justify-end">
                  <Button variant="outline" className="rounded-full">Learn more</Button>
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="p-6">
                <div className="bg-primary/10 p-3 inline-block rounded-lg mb-4">
                  <Star className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-4">Refer-a-friend</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Launch a refer-a-friend program that rewards both referrers and friends.
                </p>
                <div className="flex justify-end">
                  <Button variant="outline" className="rounded-full">Learn more</Button>
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <div className="p-6">
                <div className="bg-primary/10 p-3 inline-block rounded-lg mb-4">
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-4">Newsletter referral</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Grow your email subscriber list and increase engagement.
                </p>
                <div className="flex justify-end">
                  <Button variant="outline" className="rounded-full">Learn more</Button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">Manage your partnerships like never before</h2>
            <p className="text-xl text-primary-100 mb-10 max-w-2xl mx-auto">
              Start your free 30-day trial today. Sign up in seconds. No credit card required.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button size="lg" className="rounded-full px-8 py-6 bg-white text-primary hover:bg-gray-100 text-lg">
                Get started now
              </Button>
              <Button size="lg" variant="outline" className="rounded-full px-8 py-6 text-white border-white hover:bg-primary-600 text-lg">
                Contact sales
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
            <div className="lg:col-span-2">
              <div className="flex items-center mb-6">
                <div className="bg-primary text-white p-2 rounded">
                  <BarChart3 className="h-6 w-6" />
                </div>
                <span className="ml-2 text-2xl font-bold">Growvia</span>
              </div>
              <p className="text-gray-400 mb-6">
                Partnership programs tailor-made for your business in Nigeria and beyond.
              </p>
              <div className="flex items-center space-x-2">
                <input 
                  type="email" 
                  placeholder="Email address" 
                  className="px-4 py-2 rounded-l-lg bg-slate-800 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <Button className="rounded-r-lg">Subscribe</Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Subscribe for product updates. For more details, review our Privacy Policy.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-bold mb-4">Product</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Affiliate programs</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Referral programs</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Newsletter referrals</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Automated payouts</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Integrations</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-bold mb-4">Company</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Become an affiliate</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Migrate to Growvia</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Startup discount</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Contact us</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-bold mb-4">Growvia for</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">SaaS businesses</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">E-commerce</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Fintech</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">EdTech</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Influencer marketing</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500 mb-4 md:mb-0">
              &copy; {new Date().getFullYear()} Growvia. All rights reserved.
            </p>
            <div className="flex space-x-6">
              <a href="#" className="text-gray-500 hover:text-white transition-colors">Terms</a>
              <a href="#" className="text-gray-500 hover:text-white transition-colors">Privacy</a>
              <a href="#" className="text-gray-500 hover:text-white transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;