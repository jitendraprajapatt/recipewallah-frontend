import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  clearStoredSession,
  deleteUploadedApk,
  fetchAdminHistory,
  fetchAdminQueries,
  fetchLatestRelease,
  getStoredSession,
  loginAdmin,
  storeSession,
  submitContactQuery,
  updateQueryStatus,
  deleteQuery,
  uploadRelease,
} from './api'
import heroImage from './assets/hero.png'
import './App.css'

const featureCards = [
  {
    icon: '🤖',
    title: 'AI Smart Nutrition',
    description:
      'Intelligent background updates for localized recipe suggestions tailored to your goals.',
  },
  {
    icon: '🧘',
    title: 'AI Fitness Tracking',
    description:
      'Real-time form analysis and rep counting using advanced vision-based intelligence.',
  },
  {
    icon: '🏥',
    title: 'Medical Database',
    description:
      'Comprehensive medicine lookup and body analysis with Health Profile tracking.',
  },
  {
    icon: '🔔',
    title: 'Smart Reminders',
    description:
      'Automated notifications for medicine timings, workout schedules, and meal prep.',
  },
]

const heroHighlights = ['Recipe Ideas', 'Fitness Meals', 'Medicine Alerts', 'Local Favorites']

const trustPoints = [
  'Location context is used only for recommendation quality and is not permanently stored.',
  'Only release metadata and download links are managed by the admin backend.',
  'AI outputs are informational and should be validated before acting on them.',
]

const howItWorksSteps = [
  { step: '01', title: 'Setup Your Profile', description: 'Enter your physical metrics for BMI analysis and tell us your health or fitness goals.' },
  { step: '02', title: 'AI-Guided Activity', description: 'Get tailored recipes or start a workout with real-time pose detection and rep counting.' },
  { step: '03', title: 'Stay on Track', description: 'Receive smart reminders for medicine and meals while tracking your progress locally and privately.' },
]

const testimonials = [
  { text: "This app completely changed my cutting phase. The customized recipes actually taste good and perfectly hit my protein goals every single time.", author: "Marcus T.", tag: "Fitness Enthusiast" },
  { text: "I love that it warns me about mixing certain citrus fruits with my daily medication. So incredibly smart, safe, and easy to use.", author: "Sarah W.", tag: "Daily User" },
  { text: "Finally, an AI recipe app that doesn't just give generic answers. The step-by-step cooking instructions actually work flawlessly.", author: "Priya K.", tag: "Home Chef" }
]

const faqItems = [
  { q: "Is RecipeWallah free to use?", a: "Yes! RecipeWallah is 100% free with no hidden subscriptions or paywalls. We use standard non-intrusive ads for premium maintenance." },
  { q: "How does the AI Fitness Tracking work?", a: "RecipeWallah uses advanced vision-based intelligence to analyze your body's key points in real-time through your camera, allowing for rep counting and form analysis without your data ever leaving the device." },
  { q: "Do I need to stay online for the AI features?", a: "While an internet connection is needed for generating new recipes, our intelligent sync system handles updates in the background, and fitness tracking works locally on your phone." },
  { q: "How is the medical information managed?", a: "The Health tab includes a comprehensive medicine database and body analysis tools. You can store your BMI and Health Profile locally to get better personalized recommendations." },
  { q: "Why do I need notifications?", a: "Smart reminders help you stay consistent with your medicine timings, workout appointments, and meal preparation directly on your device." },
  { q: "Does the app support multiple languages?", a: "Yes! RecipeWallah features a seamless bilingual toggle between English and Hindi that affects the entire user interface and AI interactions." },
]

const showcaseScenes = [
  {
    id: 'food',
    title: 'Smart Food Discovery',
    subtitle: 'Discover recipes based on ingredients, mood, and available time.',
    image:
      'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=800&q=60&fm=webp',
  },
  {
    id: 'gym',
    title: 'Vision-Based Fitness',
    subtitle: 'Real-time exercise tracking and form analysis using built-in intelligence.',
    image:
      'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&w=800&q=60&fm=webp',
  },
  {
    id: 'medicine',
    title: 'Health & Body Analysis',
    subtitle: 'Manage your medical database, Health Profile, and BMI metrics.',
    image:
      'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=60&fm=webp',
  },
]

const fallbackRelease = {
  version: 'Upcoming release',
  releaseNotes: 'The RecipeWallah team will publish the next downloadable app build here.',
  platform: 'android',
  directDownloadUrl: import.meta.env.VITE_FALLBACK_DIRECT_DOWNLOAD_URL ?? '',
  playStoreUrl: import.meta.env.VITE_PLAY_STORE_URL ?? '',
  appStoreUrl: import.meta.env.VITE_APP_STORE_URL ?? '',
  fileName: '',
  fileSize: 0,
  storagePath: '',
  updatedAt: null,
}

function formatReleaseDate(value) {
  if (!value) {
    return 'Not published yet'
  }

  const parsedDate = typeof value?.toDate === 'function' ? value.toDate() : new Date(value)

  if (Number.isNaN(parsedDate.getTime())) {
    return 'Unknown time'
  }

  return parsedDate.toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function formatFileSize(bytes) {
  if (!bytes || Number.isNaN(bytes)) {
    return 'Unknown size'
  }

  const units = ['B', 'KB', 'MB', 'GB']
  let currentSize = bytes
  let unitIndex = 0

  while (currentSize >= 1024 && unitIndex < units.length - 1) {
    currentSize /= 1024
    unitIndex += 1
  }

  return `${currentSize.toFixed(unitIndex === 0 ? 0 : 2)} ${units[unitIndex]}`
}

function isApkFile(file) {
  return /\.apk$/i.test(file?.name ?? '')
}

function readApiError(error) {
  if (!error) {
    return 'Something went wrong. Please try again.'
  }

  if (error.status === 401) {
    return 'Invalid credentials or expired session.'
  }

  if (error.status === 413) {
    return 'Uploaded file is too large.'
  }

  return error.message ?? 'Something went wrong. Please try again.'
}

function usePathname() {
  const [pathname, setPathname] = useState(() => window.location.pathname || '/')

  useEffect(() => {
    const onPopState = () => {
      setPathname(window.location.pathname || '/')
    }

    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const navigate = useCallback((nextPath, hash = '') => {
    // Hash-only scroll (no path change)
    if (!nextPath && hash) {
      if (window.location.hash !== hash) {
        window.history.pushState({}, '', window.location.pathname + hash)
      }
      setTimeout(() => {
        const element = document.querySelector(hash)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 50)
      return
    }

    // Same page with a hash: scroll without navigation
    if (hash && nextPath === window.location.pathname) {
      window.history.pushState({}, '', nextPath + hash)
      setTimeout(() => {
        const element = document.querySelector(hash)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 50)
      return
    }

    if (!nextPath || nextPath === window.location.pathname) {
      return
    }

    window.history.pushState({}, '', nextPath + hash)
    setPathname(nextPath)
    if (!hash) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      setTimeout(() => {
        const element = document.querySelector(hash)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 100)
    }
  }, [])

  return { pathname, navigate }
}

function DownloadAction({ href, label, pendingLabel }) {
  if (!href) {
    return (
      <span className="premium-btn disabled" aria-disabled="true">
        {pendingLabel}
      </span>
    )
  }

  return (
    <a className="premium-btn" href={href} target="_blank" rel="noreferrer">
      {label}
    </a>
  )
}

function ContactView() {
  const [formData, setFormData] = useState({ name: '', email: '', type: 'feedback', query: '' })
  const [status, setStatus] = useState({ loading: false, success: '', error: '' })
  const [progress, setProgress] = useState(0)

  const simulateProgress = () => {
    setProgress(0)
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval)
          return 90
        }
        return prev + (90 - prev) * 0.1
      })
    }, 100)
    return interval
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus({ loading: true, success: '', error: '' })
    const interval = simulateProgress()

    try {
      await submitContactQuery(formData)
      clearInterval(interval)
      setProgress(100)
      
      setTimeout(() => {
        setStatus({ loading: false, success: 'Thank you! Your message has been sent successfully.', error: '' })
        setFormData({ name: '', email: '', type: 'feedback', query: '' })
        setProgress(0)
      }, 500)
    } catch (err) {
      clearInterval(interval)
      setStatus({ loading: false, success: '', error: readApiError(err) })
      setProgress(0)
    }
  }

  return (
    <div className="page-shell contact-shell">
      <div className="contact-container reveal">
        <div className="contact-header">
          <h1 className="serif-title gradient-text">Contact Us</h1>
          <p>Have feedback or need to report an issue? We're here to help.</p>
        </div>
        
        <form className="premium-form contact-form" onSubmit={handleSubmit}>
          {status.loading && <BrandLoading label="Sending Message..." />}
          
          {!status.loading && (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name">Full Name</label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@example.com"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="type">How can we help?</label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="premium-select"
                >
                  <option value="feedback">Provide Feedback</option>
                  <option value="report">Report an Issue</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="query">Your Message</label>
                <textarea
                  id="query"
                  rows="5"
                  value={formData.query}
                  onChange={(e) => setFormData({ ...formData, query: e.target.value })}
                  placeholder="Tell us what's on your mind..."
                  required
                ></textarea>
              </div>

              <button type="submit" className="premium-btn submit-btn" disabled={status.loading}>
                {status.loading ? 'Submitting...' : 'Send Message'}
              </button>
            </>
          )}

          {status.error && <p className="status-message error">{status.error}</p>}
          {status.success && <p className="status-message success">{status.success}</p>}
        </form>
      </div>
    </div>
  )
}

function PrivacyPolicyView({ navigate }) {
  return (
    <div className="page-shell privacy-shell">
      <div className="privacy-container reveal">
        <h1 className="serif-title gradient-text">Privacy Policy — RecipeWallah</h1>
        <p className="last-updated">Last Updated: April 22, 2026</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: '#10b981', fontWeight: '500' }}>
          <span>✓</span>
          <span>Google Play Data Safety Compliant</span>
        </div>
        <hr className="divider" />

        <p>RecipeWallah ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our mobile application (the "App").</p>

        <section>
          <h2>1. Information Collection and Use</h2>

          <h3>A. Health & Fitness Data (Sensitive Information)</h3>
          <p>RecipeWallah allows you to provide a "Health Profile," including your name, age, weight, height, BMI, dietary restrictions, allergies, and medical history. We also track in-app workout sessions and exercise repetitions via our Live AI Coach.</p>
          <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem' }}>
            <li><strong>Local Storage Only:</strong> All health profile data, workout history, and user settings are stored locally on your device using industry-standard storage.</li>
            <li><strong>No Server Upload:</strong> We do NOT upload, transmit, or store your personal health profile on our own servers.</li>
            <li><strong>Purpose:</strong> This data is used solely to enhance and personalize the prompts sent to our AI models to provide tailored recipe, nutrition, and fitness recommendations.</li>
          </ul>

          <h3>B. Camera and Image Data</h3>
          <p>The App requests access to your device's Camera and Photo Gallery/Media.</p>
          <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem' }}>
            <li><strong>Live AI Coach (Local Processing):</strong> When using the Live AI Coach, the camera stream is processed strictly locally on your device using Google ML Kit for pose detection. Video frames are analyzed in real-time to count repetitions and analyze posture. No video or image data from the Live Coach is ever recorded, saved, or sent to any server.</li>
            <li><strong>Body Analysis & Medical Reports (AI Processing):</strong> When you upload or take a photo for "Body Analysis" or "Medical Report Analysis," the image is temporarily and securely transmitted to our AI Providers (Gemini/OpenAI) to generate an analysis. We do not store these images on our servers after the analysis is returned.</li>
          </ul>

          <h3>C. Location Information</h3>
          <p>The App requests access to your Approximate and Exact Location.</p>
          <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem' }}>
            <li><strong>Purpose:</strong> This is used to provide region-specific recipe suggestions and local food trends. This information is processed in real-time and is not stored or shared with us.</li>
          </ul>

          <h3>D. Notifications and Background Activity</h3>
          <p>The App requests permission to send notifications and run background tasks (including ignoring battery optimizations).</p>
          <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem' }}>
            <li><strong>Purpose:</strong> This allows the App to deliver your scheduled daily AI recipe suggestions (e.g., at 8 AM, 7 PM) and personalized health/medicine reminders exactly when you need them.</li>
          </ul>

          <h3>E. Microphone (Audio)</h3>
          <p>The App may request microphone access.</p>
          <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem' }}>
            <li><strong>Purpose:</strong> This permission is tied to the underlying camera plugins used by the App. We do not actively record, listen to, or store your voice or audio data.</li>
          </ul>

          <h3>F. Search Quota, Favorites, and Reminders</h3>
          <p>We store information regarding your remaining ad-rewarded search quotas, "Favorite" recipes, and scheduled reminders locally on your device to ensure the App functions as intended.</p>
        </section>

        <section>
          <h2>2. Third-Party Services</h2>
          <p>We use third-party services that may collect information used to identify you or provide core functionalities:</p>
          <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem' }}>
            <li><strong>Google AdMob:</strong> Used to display banner, interstitial, and rewarded video advertisements. AdMob may collect your Advertising ID to provide personalized ads. (Google’s Privacy Policy)</li>
            <li><strong>Google ML Kit:</strong> Used locally on your device for real-time pose detection and text recognition.</li>
            <li><strong>AI Providers (Gemini/OpenAI):</strong> When you search for a recipe, ask a question, or analyze a photo (medical/body), your query and relevant local health metrics are securely sent to AI providers to generate a response. This data is governed by the respective AI provider's privacy policies.</li>
            <li><strong>Firebase (Analytics & Crashlytics):</strong> Used to monitor app performance, track crashes, and understand user behavior to improve the App. This data is anonymized.</li>
          </ul>
        </section>

        <section>
          <h2>3. AI-Generated Content Disclaimer</h2>
          <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem' }}>
            <li><strong>Accuracy:</strong> All recipes, nutrition advice, fitness plans, medical report summaries, and body analyses provided by RecipeWallah are AI-generated. AI can make mistakes.</li>
            <li><strong>Not Medical Advice:</strong> Content provided by this App is for informational purposes only and is NOT a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition or before starting any new fitness/diet regimen.</li>
          </ul>
        </section>

        <section>
          <h2>4. Data Retention and Deletion</h2>
          <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem' }}>
            <li><strong>User Control:</strong> You can view, edit, or delete your Health Profile data and Reminders at any time directly within the App settings.</li>
            <li><strong>App Uninstallation:</strong> Because we do not store your personal data on remote servers, uninstalling the App or clearing the App's data will result in the immediate and permanent deletion of all locally stored data, including your Health Profile, Favorites, Workout History, and Reminders.</li>
          </ul>
        </section>

        <section>
          <h2>5. Children’s Privacy</h2>
          <p>RecipeWallah does not knowingly collect personal information from children under 13. If you are a parent or guardian and you are aware that your child has provided us with personal information, please contact us so we can guide you on deleting the local app data.</p>
        </section>

        <section>
          <h2>6. Changes to This Privacy Policy</h2>
          <p>We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.</p>
        </section>

        <section>
          <h2>7. Contact Us</h2>
          <p>If you have any questions or suggestions about our Privacy Policy, do not hesitate to contact us at:</p>
          <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem' }}>
            <li>Email: <a href="mailto:petrolearns@gmail.com">petrolearns@gmail.com</a></li>
            <li>Website: <a href="https://www.recipewallah.in/" target="_blank" rel="noreferrer">https://www.recipewallah.in/</a></li>
          </ul>
          <p style={{ marginTop: '1rem', fontWeight: '500' }}>By using RecipeWallah, you acknowledge that you have read and understood this Privacy Policy.</p>
        </section>
      </div>
    </div>
  )
}

function Navbar({ navigate, pathname, releaseData, isLoading }) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
      if (window.scrollY > 20) setMenuOpen(false)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navTo = (path, hash) => {
    navigate(path, hash)
    setMenuOpen(false)
  }

  return (
    <header className={`modern-navbar ${isScrolled ? 'scrolled' : ''}`}>
      <div className="nav-container">
        <button className="brand-link" onClick={() => navTo('/')}>
          <img src="/favicon.png" alt="RecipeWallah Logo" className="brand-icon-img" /> RecipeWallah
        </button>

        {/* Desktop nav */}
        <nav className="nav-menu">
          <button className={`nav-item ${pathname === '/' ? 'active' : ''}`} onClick={() => navTo('/')}>Home</button>
          <button className="nav-item" onClick={() => navTo('/', '#features')}>Features</button>
          <button className={`nav-item ${pathname === '/contact' ? 'active' : ''}`} onClick={() => navTo('/contact')}>Contact</button>
          <button className={`nav-item ${pathname === '/privacy-policy' ? 'active' : ''}`} onClick={() => navTo('/privacy-policy')}>Privacy Policy</button>
        </nav>

        <div className="nav-actions">
          {releaseData?.directDownloadUrl ? (
            <a className="nav-download-btn" href={releaseData.directDownloadUrl} target="_blank" rel="noreferrer">
              Download APK
            </a>
          ) : isLoading ? (
            <span className="nav-download-btn disabled" aria-disabled="true">Checking APK...</span>
          ) : (
            <span className="nav-download-btn disabled" aria-disabled="true">APK Pending</span>
          )}
        </div>

        {/* Hamburger button — mobile only */}
        <button
          className={`hamburger-btn ${menuOpen ? 'open' : ''}`}
          onClick={() => setMenuOpen(v => !v)}
          aria-label="Toggle menu"
        >
          <span /><span /><span />
        </button>
      </div>

      {/* Mobile menu drawer */}
      {menuOpen && (
        <div className="mobile-menu">
          <button className="mobile-nav-item" onClick={() => navTo('/')}>🏠 Home</button>
          <button className="mobile-nav-item" onClick={() => navTo('/', '#features')}>✨ Features</button>
          <button className="mobile-nav-item" onClick={() => navTo('/contact')}>📧 Contact Us</button>
          <button className="mobile-nav-item" onClick={() => navTo('/privacy-policy')}>🔒 Privacy Policy</button>
          <div className="mobile-menu-divider" />
          {releaseData?.directDownloadUrl ? (
            <a className="mobile-download-btn" href={releaseData.directDownloadUrl} target="_blank" rel="noreferrer" onClick={() => setMenuOpen(false)}>
              ⬇ Download APK
            </a>
          ) : isLoading ? (
            <span className="mobile-download-btn disabled">Checking APK...</span>
          ) : (
            <span className="mobile-download-btn disabled">APK Coming Soon</span>
          )}
        </div>
      )}
    </header>
  )
}

function BrandLoading({ label }) {
  return (
    <div className="brand-spinner-container reveal">
      <div className="brand-spinner"></div>
      {label && <span className="loading-text">{label}</span>}
    </div>
  )
}

function HomeView({ releaseData, navigate, isLoading }) {
  return (
    <div className="page-shell new-home-shell">
      {/* Immersive Hero Section */}
      <section className="premium-hero">
        <div className="hero-content reveal">
          <div className="pill-badge">v{releaseData.version || '1.0.0'} Now Live</div>
          <h1 className="serif-title">
            Your Ultimate <br />
            <span className="gradient-text">Food & Fitness</span> <br />
            Companion.
          </h1>
          <p className="hero-subtext">
            RecipeWallah bridges the gap between delicious cooking, strict gym nutrition, and vital medicine awareness. All in one beautifully simple app.
          </p>
          <div className="hero-button-group">
            <DownloadAction 
              href={releaseData.directDownloadUrl || null} 
              label="Download APK" 
              pendingLabel={isLoading ? "Checking APK..." : "APK Coming Soon"} 
            />
            <DownloadAction 
              href={releaseData.playStoreUrl || null} 
              label="Google Play" 
              pendingLabel={isLoading ? "Loading..." : "Play Store Pending"} 
            />
          </div>
        </div>

        <div className="hero-graphics reveal-delay">
          <div className="blobs-container">
            <div className="blob blob-1"></div>
            <div className="blob blob-2"></div>
          </div>
          <div className="floating-card c1">
            <img src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=70&fm=webp" alt="Food" />
            <div className="card-lbl">Smart Recipes</div>
          </div>
          <div className="floating-card c2">
            <img src="https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&w=500&q=70&fm=webp" alt="Gym" />
            <div className="card-lbl">Macro Tracking</div>
          </div>
          <div className="floating-card c3">
            <img src="https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=500&q=70&fm=webp" alt="Medicine" />
            <div className="card-lbl">Medicine Safety</div>
          </div>
        </div>
      </section>

      {/* Stats Strip */}
      <section className="stats-strip reveal">
        <div className="stats-grid">
          <div className="stat-item">
            <strong>500+</strong>
            <span>Recipes Powered by AI</span>
          </div>
          <div className="stat-item">
            <strong>3-in-1</strong>
            <span>Food · Gym · Medicine</span>
          </div>
          <div className="stat-item">
            <strong>100%</strong>
            <span>Free to Download</span>
          </div>
          <div className="stat-item">
            <strong>AI First</strong>
            <span>Gemini Powered Intelligence</span>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="premium-how-it-works reveal">
        <div className="section-header center">
          <span className="section-label">Getting Started</span>
          <h2>How RecipeWallah Works</h2>
          <p>Three steps to a healthier, completely personalized daily routine.</p>
        </div>
        <div className="modern-steps-grid">
          {howItWorksSteps.map((step, i) => (
            <div className={`modern-step-card reveal-delay-${i % 3}`} key={step.step}>
              <div className="step-count">{step.step}</div>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Showcase */}
      <section className="premium-features" id="features">
        <div className="section-header reveal">
          <span className="section-label">Core Features</span>
          <h2 className="serif-title">Designed for <span className="gradient-text">Every Lifestyle</span></h2>
          <p>Whether you're bulking, cutting, or managing dietary restrictions safely.</p>
        </div>
        <div className="features-grid">
          {featureCards.map((f, i) => (
            <div className={`feature-box reveal-delay-${i % 3}`} key={f.title}>
              <span className="feature-box-icon">{f.icon}</span>
              <h3>{f.title}</h3>
              <p>{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="premium-testimonials reveal">
        <div className="section-header center">
          <span className="section-label">Community</span>
          <h2 className="serif-title">Loved by <span className="gradient-text">Early Users</span></h2>
          <p>See how RecipeWallah is transforming daily routines.</p>
        </div>
        <div className="testimonials-grid">
          {testimonials.map((t, i) => (
            <div className={`testimonial-card reveal-delay-${i % 3}`} key={t.author}>
              <div className="stars">★★★★★</div>
              <p className="t-text">"{t.text}"</p>
              <div className="t-author">
                <h4>{t.author}</h4>
                <span>{t.tag}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Visual Gallery */}
      <section className="premium-gallery" id="visuals">
        <div className="section-header center reveal">
          <h2>Beautiful Visuals. <br />Powerful Outcomes.</h2>
        </div>
        <div className="gallery-layout reveal-delay">
          {showcaseScenes.map((scene) => (
            <div className="gallery-item" key={scene.id}>
              <img src={scene.image} alt={scene.title} />
              <div className="gallery-overlay">
                <h4>{scene.title}</h4>
                <p>{scene.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Why RecipeWallah Section */}
      <section className="premium-why reveal" style={{ padding: '5rem 5%' }}>
        <div className="section-header center" style={{ marginBottom: '3rem' }}>
          <span className="section-label">Why Choose Us</span>
          <h2 className="serif-title">Why <span className="gradient-text">RecipeWallah?</span></h2>
          <p>Trusted by fitness enthusiasts and home cooks across India for smarter, safer daily nutrition.</p>
        </div>
        <div className="features-grid">
          <div className="feature-box reveal-delay-0">
            <span className="feature-box-icon">🔒</span>
            <h3>Zero Login, Full Privacy</h3>
            <p>No account. No cloud storage of your data. Every health detail you enter stays 100% local on your device — we never see it.</p>
          </div>
          <div className="feature-box reveal-delay-1">
            <span className="feature-box-icon">🤖</span>
            <h3>Powered by Gemini AI</h3>
            <p>Industry-leading AI models from Google Gemini and OpenAI generate recipes so personalized they feel hand-crafted by a professional nutritionist.</p>
          </div>
          <div className="feature-box reveal-delay-2">
            <span className="feature-box-icon">🤸</span>
            <h3>Vision-Based AI</h3>
            <p>Our integrated vision intelligence analyzes your movement in real-time for live exercise tracking, rep counting, and perfect form guidance.</p>
          </div>
          <div className="feature-box reveal-delay-0">
            <span className="feature-box-icon">🅾️</span>
            <h3>Bilingual & Voice Search</h3>
            <p>Seamlessly toggle between English and Hindi. Use advanced voice search for recipes and medicines for a hands-free, high-tech experience.</p>
          </div>
          <div className="feature-box reveal-delay-1">
            <span className="feature-box-icon">🔔</span>
            <h3>Smart Notification Center</h3>
            <p>Never miss a dose or a rep. Set custom reminders for medicine, workouts, and meal prep using Flutter local notifications.</p>
          </div>
          <div className="feature-box reveal-delay-2">
            <span className="feature-box-icon">🩺</span>
            <h3>Medical & Body Analysis</h3>
            <p>A comprehensive built-in medical database paired with BMI tracking and a secure, local health profile management system.</p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="premium-faq reveal">
        <div className="section-header center">
          <span className="section-label">Help Center</span>
          <h2 className="serif-title">Frequently Asked Questions</h2>
          <p>Everything you need to know about RecipeWallah.</p>
        </div>
        <div className="faq-grid">
          {faqItems.map((item, i) => (
            <div className={`faq-card reveal-delay-${i % 2}`} key={item.q}>
              <h3>{item.q}</h3>
              <p>{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SEO Article Section */}
      <section className="premium-seo-content reveal" style={{ padding: '2rem 5%', maxWidth: '1000px', margin: '4rem auto' }}>
        <div className="section-header center">
          <h2 className="serif-title">The Best Free AI Recipe & Fitness Nutrition App</h2>
        </div>
        <div className="seo-text-body" style={{ background: 'var(--card-bg)', padding: '2.5rem', borderRadius: '16px', border: '1px solid var(--border-color)', color: 'var(--text)', fontSize: '1.05rem', lineHeight: '1.8' }}>
          <p style={{ marginBottom: '1.5rem' }}>
            Elevate your lifestyle with <strong>RecipeWallah (RW)</strong>, the premium <strong>AI-powered health and fitness platform</strong>. Unlike standard meal planners, RecipeWallah integrates advanced <strong>vision-based intelligence</strong>, enabling real-time exercise tracking and live form analysis directly through your mobile camera. Whether you're mastering squats in the <strong>gym</strong>, tracking high-protein <strong>bulking and cutting recipes</strong> like <strong>sabji</strong> and <strong>non-veg</strong> favorites, or managing a personal <strong>medical database</strong>, our platform delivers an intelligent, all-in-one high-tech experience designed for the modern user.
          </p>
          <p style={{ marginBottom: '1.5rem' }}>
            Our smart nutrition engine doesn't just display data—it uses an <strong>intelligent background sync</strong> to constantly update AI-curated recipes tailored to your pantry favorites, including fresh <strong>fruit</strong> nutrition and high-<strong>protein</strong> <strong>food</strong> options. Coupled with a <strong>bilingual interface</strong> (English/Hindi) and <strong>voice search capabilities</strong>, RecipeWallah ensures that managing your health is seamless and hands-free. From BMI analysis in your secure local Health Profile to smart <strong>medicine</strong> and workout reminders, every feature is optimized for safety, consistency, and a premium aesthetic using <strong>Glassmorphism</strong> design.
          </p>
          <p>
            The best part? RecipeWallah is a 100% <strong>free health and fitness app</strong>. We believe in total data privacy, meaning your medical history and physical metrics stay securely on your device. By combining state-of-the-art <strong>generative intelligence</strong> with cutting-edge vision technology, RecipeWallah (the ultimate <strong>wala</strong> for health) is the most comprehensive tool for anyone seeking a smarter way to cook, train, and stay healthy without the need for multiple, expensive subscriptions.
          </p>
        </div>
      </section>

      {/* CTA Download Banner */}
      <section className="cta-banner reveal">
        <div className="cta-inner">
          <div className="cta-text">
            <h2 className="serif-title">Ready to eat smarter<br />and train harder?</h2>
            <p>RecipeWallah is 100% free. Download now and start your journey today.</p>
          </div>
          <div className="cta-actions">
            <DownloadAction href={isLoading ? null : releaseData.directDownloadUrl} label="⬇ Download APK" pendingLabel={isLoading ? "APK loading..." : "APK Coming Soon"} />
            <DownloadAction href={isLoading ? null : releaseData.playStoreUrl} label="Google Play" pendingLabel={isLoading ? "Loading..." : "Play Store Soon"} />
          </div>
        </div>
      </section>
    </div>
  )
}

function HistoryList({ historyItems, historyState, onRefresh }) {
  return (
    <section className="dashboard-card history-card" id="admin-history">
      <div className="card-header-row">
        <h3>Release History</h3>
        <button type="button" className="ghost-btn" onClick={onRefresh} disabled={historyState.isLoading}>
          {historyState.isLoading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {historyState.error ? <p className="status-message error">{historyState.error}</p> : null}

      {!historyState.error && historyItems.length === 0 ? (
        <p className="muted">No history entries yet.</p>
      ) : null}

      {historyItems.length > 0 ? (
        <div className="history-list">
          {historyItems.map((item) => (
            <article className="history-item" key={item.id}>
              <div className="history-title-row">
                <strong>{item.action === 'delete_apk' ? 'APK deleted' : 'Release published'}</strong>
                <span>{formatReleaseDate(item.createdAt)}</span>
              </div>
              <p>
                By <strong>{item.actorEmail || 'unknown'}</strong> | Version <strong>{item.version || 'N/A'}</strong>
              </p>
              <p className="muted">{item.notes || 'No extra notes.'}</p>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  )
}

function QueriesList({ queries, loading, onUpdateStatus, onDelete, onRefresh }) {
  const [actionMessage, setActionMessage] = useState('')
  const [selectedQuery, setSelectedQuery] = useState(null)
  const [statusType, setStatusType] = useState('') // 'resolved' or 'rejected'

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [progress, setProgress] = useState(0)

  const openActionModal = (query, type) => {
    setSelectedQuery(query)
    setStatusType(type)
    setActionMessage('')
    setIsSubmitting(false)
    setProgress(0)
  }

  const closeActionModal = () => {
    setSelectedQuery(null)
    setStatusType('')
  }

  const handleActionSubmit = async (e) => {
    e.preventDefault()
    if (!selectedQuery) return
    
    setIsSubmitting(true)
    setProgress(0)
    
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval)
          return 90
        }
        return prev + (90 - prev) * 0.1
      })
    }, 100)

    try {
      await onUpdateStatus(selectedQuery._id, { status: statusType, adminMessage: actionMessage })
      clearInterval(interval)
      setProgress(100)
      setTimeout(() => {
        closeActionModal()
      }, 500)
    } catch (err) {
      clearInterval(interval)
      setIsSubmitting(false)
      setProgress(0)
    }
  }

  return (
    <section className="dashboard-card queries-card" id="admin-queries">
      <div className="card-header-row">
        <h3>User Queries</h3>
        <div className="header-actions">
          <button className="icon-btn refresh-btn" title="Refresh" onClick={onRefresh} disabled={loading}>🔄</button>
          {loading && <span className="loader-medium brand-accent"></span>}
        </div>
      </div>

      {queries.length === 0 ? (
        <p className="muted">No user queries found.</p>
      ) : (
        <div className="queries-table-container">
          <table className="premium-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>User</th>
                <th>Type</th>
                <th>Query</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {queries.map((q) => (
                <tr key={q._id}>
                  <td>{formatReleaseDate(q.createdAt)}</td>
                  <td>
                    <div><strong>{q.name}</strong></div>
                    <div className="muted">{q.email}</div>
                  </td>
                  <td>
                    <span className={`pill-badge type-${q.type}`}>
                      {q.type}
                    </span>
                  </td>
                  <td className="query-text-cell">
                    <p title={q.query}>{q.query}</p>
                    {q.adminMessage && (
                      <div className="admin-reply-box">
                        <strong>Reply:</strong> {q.adminMessage}
                      </div>
                    )}
                  </td>
                  <td>
                    <span className={`status-pill status-${q.status}`}>
                      {q.status}
                    </span>
                  </td>
                  <td className="actions-cell">
                    {q.status === 'pending' && (
                      <div className="action-btns">
                        <button className="icon-btn resolve" title="Resolve" onClick={() => openActionModal(q, 'resolved')}>✅</button>
                        <button className="icon-btn reject" title="Reject" onClick={() => openActionModal(q, 'rejected')}>❌</button>
                      </div>
                    )}
                    <button className="icon-btn delete" title="Delete" onClick={() => onDelete(q._id)}>🗑</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedQuery && (
        <div className="modal-overlay">
          <div className="modal-content reveal">
            <h3>{statusType === 'resolved' ? 'Resolve' : 'Reject'} Query</h3>
            <p>From: <strong>{selectedQuery.name}</strong></p>
            
            {isSubmitting && (
              <ProgressBar progress={progress} label={`Sending ${statusType} notification...`} />
            )}

            {!isSubmitting && (
              <form onSubmit={handleActionSubmit}>
                <div className="form-group">
                  <label>Add a message for the user (will be sent via email):</label>
                  <textarea
                    value={actionMessage}
                    onChange={(e) => setActionMessage(e.target.value)}
                    placeholder={`Reason for ${statusType}...`}
                    required
                    rows="4"
                  ></textarea>
                </div>
                <div className="modal-actions">
                  <button type="button" className="ghost-btn" onClick={closeActionModal}>Cancel</button>
                  <button type="submit" className={`solid-btn ${statusType}`}>Submit & Send Mail</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  )
}

function AdminView({
  currentUser,
  isAdminAllowed,
  authState,
  setAuthState,
  onLoginSubmit,
  onLogout,
  releaseData,
  releaseStatus,
  releaseForm,
  onReleaseFieldChange,
  selectedFile,
  setSelectedFile,
  uploadState,
  onUploadSubmit,
  onDeleteApk,
  deleteApkState,
  historyItems,
  historyState,
  loadHistory,
  queries,
  queriesLoading,
  onUpdateQueryStatus,
  onDeleteQuery,
  onRefreshQueries,
}) {
  const hasUploadedApk = Boolean(releaseData.fileName || releaseData.storagePath)
  const [activeTab, setActiveTab] = useState('publish')

  const tabs = [
    { id: 'publish', label: '📦 Publish Release' },
    { id: 'queries', label: '💬 User Queries' },
    { id: 'metrics', label: '📊 Metrics' },
    { id: 'delete', label: '🗑 Delete APK' },
    { id: 'history', label: '📋 History' },
  ]

  return (
    <div className="admin-shell">
      {/* Admin Top Navbar */}
      <header className="admin-topbar">
        <div className="admin-topbar-left">
          <img src="/favicon.png" alt="Logo" className="admin-logo" />
          <span className="admin-brand">RecipeWallah Admin</span>
        </div>
        <div className="admin-topbar-right">
          {currentUser && isAdminAllowed && (
            <>
              <span className="admin-user-badge">{currentUser.email}</span>
              <button className="ghost-btn" type="button" onClick={onLogout}>Sign Out</button>
            </>
          )}
        </div>
      </header>

      <div className="admin-body">
        {/* Sidebar Navigation */}
        <aside className="admin-sidebar">
          <nav className="sidebar-nav">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`sidebar-link ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </aside>

        <main className="admin-content">
          {/* Header Banner */}
          <section className="admin-hero-banner">
            <div>
              <h1 className="serif-title">{tabs.find(t => t.id === activeTab)?.label || 'Admin'}</h1>
              <p>RecipeWallah Owner Release Console — manage your app releases.</p>
            </div>
            <div className="admin-version-pill">
              v{releaseData.version || '—'} <span>Live</span>
            </div>
          </section>

          {!currentUser ? (
            <section className="dashboard-card auth-card" id="admin-login">
              <div className="card-icon">🔑</div>
              <h3>Owner Login</h3>
              <p className="card-sub">Enter your credentials to access the release controls.</p>
              <form className="admin-form" onSubmit={onLoginSubmit}>
                <div className="form-group full-width">
                  <label htmlFor="adminEmail">Email or username</label>
                  <input
                    id="adminEmail"
                    type="text"
                    value={authState.email}
                    onChange={(event) =>
                      setAuthState((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                    required
                    autoComplete="username"
                    placeholder="owner@recipewallah.com"
                  />
                </div>

                <div className="form-group full-width">
                  <label htmlFor="adminPassword">Password</label>
                  <input
                    id="adminPassword"
                    type="password"
                    value={authState.password}
                    onChange={(event) =>
                      setAuthState((current) => ({
                        ...current,
                        password: event.target.value,
                      }))
                    }
                    required
                    autoComplete="current-password"
                    placeholder="Enter your password"
                  />
                </div>

                <div className="form-group full-width">
                  <button type="submit" className="solid-btn" disabled={authState.isLoading}>
                    {authState.isLoading ? 'Signing in...' : 'Login as Owner'}
                  </button>
                </div>

                {authState.error ? <p className="status-message error">{authState.error}</p> : null}
              </form>
            </section>
          ) : null}

          {currentUser && !isAdminAllowed ? (
            <section className="dashboard-card auth-card">
              <p className="status-message error">
                {currentUser.email} is signed in, but this account is not in VITE_ADMIN_EMAILS.
              </p>
              <button className="ghost-btn" type="button" onClick={onLogout}>Sign Out</button>
            </section>
          ) : null}

          {currentUser && isAdminAllowed ? (
            <>
              {/* METRICS TAB */}
              {activeTab === 'metrics' && (
                <section className="dashboard-card metrics-card" id="admin-metrics">
                  <article className="metric-tile">
                    <span>Current Version</span>
                    <strong>{releaseData.version}</strong>
                  </article>
                  <article className="metric-tile">
                    <span>APK Status</span>
                    <strong className={hasUploadedApk ? 'text-green' : 'text-muted'}>{hasUploadedApk ? '✅ Uploaded' : '⏳ Not uploaded'}</strong>
                  </article>
                  <article className="metric-tile">
                    <span>Release History</span>
                    <strong>{historyItems.length} entries</strong>
                  </article>
                </section>
              )}

              {/* PUBLISH TAB */}
              {activeTab === 'publish' && (
                <div className="admin-grid">
                  <div className="admin-col">
                    <section className="dashboard-card editor-card" id="admin-release">
                      <h3>Publish New Release</h3>
                      <form className="admin-form" onSubmit={onUploadSubmit}>
                        <div className="form-group"><label htmlFor="version">Version</label><input id="version" name="version" type="text" placeholder="Example: v2.1.0" value={releaseForm.version} onChange={onReleaseFieldChange} required /></div>
                        <div className="form-group"><label htmlFor="platform">Platform</label><select id="platform" name="platform" value={releaseForm.platform} onChange={onReleaseFieldChange}><option value="android">Android</option><option value="ios">iOS</option><option value="both">Android + iOS</option></select></div>
                        <div className="form-group full-width"><label htmlFor="releaseNotes">Release Notes</label><textarea id="releaseNotes" name="releaseNotes" rows="3" placeholder="What changed in this release?" value={releaseForm.releaseNotes} onChange={onReleaseFieldChange} /></div>
                        <div className="form-group"><label htmlFor="appFile">Upload APK (optional)</label><input id="appFile" type="file" accept=".apk" onChange={(event) => { const file = event.target.files?.[0] ?? null; if (file && !isApkFile(file)) { setSelectedFile(null); return; } setSelectedFile(file); }} />{selectedFile ? <p className="muted" style={{ marginTop: '0.4rem', fontSize: '0.85rem' }}>Selected: {selectedFile.name}</p> : null}</div>
                        <div className="form-group"><label htmlFor="directDownloadUrl">Direct Download URL (optional)</label><input id="directDownloadUrl" name="directDownloadUrl" type="url" placeholder="https://example.com/app.apk" value={releaseForm.directDownloadUrl} onChange={onReleaseFieldChange} /></div>
                        <div className="form-group"><label htmlFor="playStoreUrl">Google Play URL (optional)</label><input id="playStoreUrl" name="playStoreUrl" type="url" placeholder="https://play.google.com/store/apps..." value={releaseForm.playStoreUrl} onChange={onReleaseFieldChange} /></div>
                        <div className="form-group"><label htmlFor="appStoreUrl">App Store URL (optional)</label><input id="appStoreUrl" name="appStoreUrl" type="url" placeholder="https://apps.apple.com/app/id..." value={releaseForm.appStoreUrl} onChange={onReleaseFieldChange} /></div>
                        <div className="form-group full-width">
                          <button type="submit" className="solid-btn" disabled={uploadState.isUploading}>{uploadState.isUploading ? `Publishing... ${uploadState.progress}%` : 'Publish Release'}</button>
                          {uploadState.isUploading ? <progress max="100" value={uploadState.progress} style={{ marginTop: '0.5rem', width: '100%' }} /> : null}
                          {uploadState.error ? <p className="status-message error">{uploadState.error}</p> : null}
                          {uploadState.success ? <p className="status-message success">{uploadState.success}</p> : null}
                        </div>
                      </form>
                    </section>
                  </div>
                  <div className="admin-col">
                    <section className="dashboard-card current-release-card">
                      <h3>Current Release</h3>
                      {releaseStatus.isLoading ? <p className="muted">Loading release...</p> : null}
                      {!releaseStatus.isLoading ? (
                        <div className="release-meta-grid">
                          <div className="release-meta-item"><span>Version</span><strong>{releaseData.version}</strong></div>
                          <div className="release-meta-item"><span>Updated</span><strong>{formatReleaseDate(releaseData.updatedAt)}</strong></div>
                          <div className="release-meta-item full"><span>File</span><strong>{releaseData.fileName || 'No APK uploaded'}</strong></div>
                          <div className="release-meta-item"><span>Size</span><strong>{formatFileSize(releaseData.fileSize)}</strong></div>
                        </div>
                      ) : null}
                    </section>
                  </div>
                </div>
              )}

              {/* DELETE TAB */}
              {activeTab === 'delete' && (
                <section className="dashboard-card danger-zone" id="admin-danger">
                  <h3>🗑 Delete APK</h3>
                  <p className="muted">Owner-only action. Removes the uploaded APK file and clears its metadata from the release record.</p>
                  <button type="button" className="danger-btn" onClick={onDeleteApk} disabled={deleteApkState.isLoading || !hasUploadedApk}>
                    {deleteApkState.isLoading ? 'Deleting APK...' : 'Delete Current APK File'}
                  </button>
                  {!hasUploadedApk ? <p className="muted" style={{ marginTop: '0.75rem' }}>No uploaded APK available to delete.</p> : null}
                  {deleteApkState.message ? <p className="status-message success">{deleteApkState.message}</p> : null}
                  {deleteApkState.error ? <p className="status-message error">{deleteApkState.error}</p> : null}
                </section>
              )}

              {/* QUERIES TAB */}
              {activeTab === 'queries' && (
                <QueriesList
                  queries={queries}
                  loading={queriesLoading}
                  onUpdateStatus={onUpdateQueryStatus}
                  onDelete={onDeleteQuery}
                  onRefresh={onRefreshQueries}
                />
              )}

              {/* HISTORY TAB */}
              {activeTab === 'history' && (
                <HistoryList historyItems={historyItems} historyState={historyState} onRefresh={loadHistory} />
              )}
            </>
          ) : (
            <div className="unauthorized-message reveal">
              <div className="danger-icon">⚠️</div>
              <h2>Access Restricted</h2>
              <p>Your account (<strong>{currentUser?.email}</strong>) does not have administrative permissions.</p>
              <p className="muted">Please contact the system administrator to whitelist your email.</p>
              <button className="premium-btn" onClick={onLogout}>Sign Out</button>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

function ProgressBar({ progress, label }) {
  return (
    <div className="progress-wrapper reveal">
      <div className="progress-info">
        <span>{label || 'Sending...'}</span>
        <span className="progress-percentage">{Math.round(progress)}%</span>
      </div>
      <div className="progress-container">
        <div className="progress-bar" style={{ width: `${progress}%` }}></div>
      </div>
    </div>
  )
}

function App() {
  const { pathname, navigate } = usePathname()
  const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/')

  const [rotatingIndex, setRotatingIndex] = useState(0)
  const [showcaseIndex, setShowcaseIndex] = useState(0)
  const [releaseData, setReleaseData] = useState(fallbackRelease)
  const [releaseStatus, setReleaseStatus] = useState({
    isLoading: true,
    error: '',
    info: '',
  })
  const [session, setSession] = useState(() => getStoredSession())
  const [authState, setAuthState] = useState({
    email: '',
    password: '',
    isLoading: false,
    error: '',
  })
  const [releaseForm, setReleaseForm] = useState({
    version: '',
    platform: 'android',
    releaseNotes: '',
    directDownloadUrl: fallbackRelease.directDownloadUrl,
    playStoreUrl: fallbackRelease.playStoreUrl,
    appStoreUrl: fallbackRelease.appStoreUrl,
  })
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploadState, setUploadState] = useState({
    isUploading: false,
    progress: 0,
    error: '',
    success: '',
  })
  const [deleteApkState, setDeleteApkState] = useState({
    isLoading: false,
    error: '',
    message: '',
  })
  const [historyState, setHistoryState] = useState({
    isLoading: false,
    error: '',
  })
  const [historyItems, setHistoryItems] = useState([])
  const [queries, setQueries] = useState([])
  const [queriesLoading, setQueriesLoading] = useState(false)

  const currentUser = session?.user ?? null
  const authToken = session?.token ?? ''

  const adminAllowlist = useMemo(
    () =>
      (import.meta.env.VITE_ADMIN_EMAILS ?? 'owner@recipewallah.com')
        .split(',')
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean),
    []
  )

  const isAdminAllowed =
    !!currentUser &&
    (adminAllowlist.length === 0 ||
      adminAllowlist.includes(currentUser.email?.toLowerCase() ?? ''))

  useEffect(() => {
    const timer = window.setInterval(() => {
      setRotatingIndex((current) => (current + 1) % heroHighlights.length)
    }, 2400)

    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setShowcaseIndex((current) => (current + 1) % showcaseScenes.length)
    }, 3200)

    return () => window.clearInterval(timer)
  }, [])

  // ── Scroll-triggered animations ──────────────────────────────────────
  useEffect(() => {
    const SELECTOR = [
      '.modern-step-card',
      '.feature-box',
      '.testimonial-card',
      '.gallery-item',
      '.faq-card',
      '.stat-item',
      '.section-header',
      '.cta-inner',
      '.stats-grid',
      '.pill-badge',
      '.hero-subtext',
      '.hero-button-group',
    ].join(', ')

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target
            // Stagger by sibling index
            const siblings = Array.from(el.parentElement?.children ?? [])
            const idx = siblings.indexOf(el)
            el.style.transitionDelay = `${Math.min(idx * 0.08, 0.4)}s`
            el.classList.add('is-visible')
            observer.unobserve(el)
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -60px 0px' }
    )

    const tick = () => {
      const elements = document.querySelectorAll(SELECTOR)
      elements.forEach((el) => {
        if (!el.classList.contains('is-visible')) {
          observer.observe(el)
        }
      })
    }

    // Small delay to let React render first
    const id = setTimeout(tick, 100)
    return () => {
      clearTimeout(id)
      observer.disconnect()
    }
  }, [pathname])


  const loadRelease = useCallback(async () => {
    setReleaseStatus({
      isLoading: true,
      error: '',
      info: '',
    })

    try {
      const release = await fetchLatestRelease()

      if (!release) {
        setReleaseData(fallbackRelease)
        setReleaseStatus({
          isLoading: false,
          error: '',
          info: 'No release has been published yet. Owner can publish from /admin.',
        })
        return
      }

      const normalizedRelease = {
        ...fallbackRelease,
        ...release,
      }

      setReleaseData(normalizedRelease)
      setReleaseStatus({
        isLoading: false,
        error: '',
        info: '',
      })
      setReleaseForm((current) => ({
        ...current,
        directDownloadUrl: current.directDownloadUrl || normalizedRelease.directDownloadUrl,
        playStoreUrl: current.playStoreUrl || normalizedRelease.playStoreUrl,
        appStoreUrl: current.appStoreUrl || normalizedRelease.appStoreUrl,
      }))
    } catch (error) {
      console.error('Fetch release error:', error)
      setReleaseData(fallbackRelease)
      setReleaseStatus({
        isLoading: false,
        error: readApiError(error),
        info: '',
      })
    }
  }, [])

  const loadHistory = useCallback(async () => {
    if (!authToken || !isAdminAllowed) {
      setHistoryItems([])
      return
    }

    setHistoryState({
      isLoading: true,
      error: '',
    })

    try {
      const history = await fetchAdminHistory(authToken, { limit: 40 })
      setHistoryItems(history)
      setHistoryState({
        isLoading: false,
        error: '',
      })
    } catch (error) {
      setHistoryState({
        isLoading: false,
        error: readApiError(error),
      })
    }
  }, [authToken, isAdminAllowed])

  const loadQueries = useCallback(async () => {
    if (!authToken || !isAdminAllowed) return
    setQueriesLoading(true)
    try {
      const data = await fetchAdminQueries(authToken)
      setQueries(data)
    } catch (error) {
      console.error('Fetch queries error:', error)
    } finally {
      setQueriesLoading(false)
    }
  }, [authToken, isAdminAllowed])

  useEffect(() => {
    if (isAdminRoute && authToken && isAdminAllowed) {
      void loadQueries()
    }
  }, [isAdminRoute, authToken, isAdminAllowed, loadQueries])

  const onUpdateQueryStatus = async (id, data) => {
    try {
      setQueriesLoading(true)
      await updateQueryStatus(authToken, id, data)
      await loadQueries()
    } catch (error) {
      alert(readApiError(error))
    } finally {
      setQueriesLoading(false)
    }
  }

  const onDeleteQuery = async (id) => {
    if (!window.confirm('Are you sure you want to delete this query?')) return
    try {
      setQueriesLoading(true)
      await deleteQuery(authToken, id)
      await loadQueries()
    } catch (error) {
      alert(readApiError(error))
    } finally {
      setQueriesLoading(false)
    }
  }

  useEffect(() => {
    void loadRelease()
  }, [loadRelease])

  useEffect(() => {
    if (!isAdminRoute || !authToken || !isAdminAllowed) {
      return
    }

    void loadHistory()
  }, [isAdminRoute, authToken, isAdminAllowed, loadHistory])

  const onLoginSubmit = async (event) => {
    event.preventDefault()

    setAuthState((current) => ({
      ...current,
      isLoading: true,
      error: '',
    }))

    try {
      const nextSession = await loginAdmin({
        email: authState.email.trim(),
        password: authState.password,
      })

      storeSession(nextSession)
      setSession(nextSession)
      setAuthState({
        email: '',
        password: '',
        isLoading: false,
        error: '',
      })
    } catch (error) {
      setAuthState((current) => ({
        ...current,
        isLoading: false,
        error: readApiError(error),
      }))
    }
  }

  const onLogout = () => {
    clearStoredSession()
    setSession(null)
    setUploadState({
      isUploading: false,
      progress: 0,
      error: '',
      success: '',
    })
    setDeleteApkState({
      isLoading: false,
      error: '',
      message: '',
    })
    setHistoryItems([])
  }

  const onReleaseFieldChange = (event) => {
    const { name, value } = event.target
    setReleaseForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const onUploadSubmit = async (event) => {
    event.preventDefault()

    if (!currentUser || !isAdminAllowed || !authToken) {
      setUploadState((current) => ({
        ...current,
        error: 'Only approved owner accounts can publish releases.',
        success: '',
      }))
      return
    }

    const version = releaseForm.version.trim()
    const releaseNotes = releaseForm.releaseNotes.trim()
    const playStoreUrl = releaseForm.playStoreUrl.trim()
    const appStoreUrl = releaseForm.appStoreUrl.trim()
    const directDownloadUrl = releaseForm.directDownloadUrl.trim()

    if (!version) {
      setUploadState((current) => ({
        ...current,
        error: 'Version is required.',
        success: '',
      }))
      return
    }

    if (!selectedFile && !directDownloadUrl && !playStoreUrl && !appStoreUrl) {
      setUploadState((current) => ({
        ...current,
        error: 'Add at least one download link or upload an APK file.',
        success: '',
      }))
      return
    }

    setUploadState({
      isUploading: true,
      progress: 0,
      error: '',
      success: '',
    })

    setDeleteApkState((current) => ({
      ...current,
      message: '',
      error: '',
    }))

    try {
      const savedRelease = await uploadRelease({
        token: authToken,
        release: {
          version,
          platform: releaseForm.platform,
          releaseNotes,
          directDownloadUrl,
          playStoreUrl,
          appStoreUrl,
        },
        file: selectedFile,
        onProgress: (progress) => {
          setUploadState((current) => ({
            ...current,
            progress,
          }))
        },
      })

      const normalizedRelease = {
        ...fallbackRelease,
        ...(savedRelease ?? {}),
      }

      setReleaseData(normalizedRelease)
      setReleaseStatus({
        isLoading: false,
        error: '',
        info: '',
      })
      setUploadState({
        isUploading: false,
        progress: 100,
        error: '',
        success: 'Release published successfully.',
      })
      setSelectedFile(null)
      setReleaseForm((current) => ({
        ...current,
        version: '',
        releaseNotes: '',
        directDownloadUrl: normalizedRelease.directDownloadUrl,
        playStoreUrl: normalizedRelease.playStoreUrl,
        appStoreUrl: normalizedRelease.appStoreUrl,
      }))

      await loadHistory()
    } catch (error) {
      setUploadState({
        isUploading: false,
        progress: 0,
        error: readApiError(error),
        success: '',
      })
    }
  }

  const onDeleteApk = async () => {
    if (!authToken || !currentUser || !isAdminAllowed) {
      setDeleteApkState({
        isLoading: false,
        error: 'Only approved owner accounts can delete APK files.',
        message: '',
      })
      return
    }

    if (!releaseData.fileName && !releaseData.storagePath) {
      setDeleteApkState({
        isLoading: false,
        error: 'No uploaded APK found for deletion.',
        message: '',
      })
      return
    }

    const isConfirmed = window.confirm('Delete the current uploaded APK from server storage?')
    if (!isConfirmed) {
      return
    }

    setDeleteApkState({
      isLoading: true,
      error: '',
      message: '',
    })

    setUploadState((current) => ({
      ...current,
      success: '',
      error: '',
    }))

    try {
      const result = await deleteUploadedApk(authToken)
      const normalizedRelease = {
        ...fallbackRelease,
        ...(result.release ?? {}),
      }

      setReleaseData(normalizedRelease)
      setDeleteApkState({
        isLoading: false,
        error: '',
        message: result.removedFile
          ? 'APK file deleted from server successfully.'
          : 'APK metadata cleaned. File was not present on disk.',
      })

      setReleaseForm((current) => ({
        ...current,
        directDownloadUrl: normalizedRelease.directDownloadUrl,
      }))

      await loadHistory()
    } catch (error) {
      setDeleteApkState({
        isLoading: false,
        error: readApiError(error),
        message: '',
      })
    }
  }

  let pageContent = null

  if (isAdminRoute) {
    pageContent = (
      <AdminView
        currentUser={currentUser}
        isAdminAllowed={isAdminAllowed}
        authState={authState}
        setAuthState={setAuthState}
        onLoginSubmit={onLoginSubmit}
        onLogout={onLogout}
        releaseData={releaseData}
        releaseStatus={releaseStatus}
        releaseForm={releaseForm}
        onReleaseFieldChange={onReleaseFieldChange}
        selectedFile={selectedFile}
        setSelectedFile={setSelectedFile}
        uploadState={uploadState}
        onUploadSubmit={onUploadSubmit}
        onDeleteApk={onDeleteApk}
        deleteApkState={deleteApkState}
        historyItems={historyItems}
        historyState={historyState}
        loadHistory={loadHistory}
        queries={queries}
        queriesLoading={queriesLoading}
        onUpdateQueryStatus={onUpdateQueryStatus}
        onDeleteQuery={onDeleteQuery}
        onRefreshQueries={loadQueries}
      />
    )
  } else if (pathname === '/contact') {
    pageContent = <ContactView />
  } else if (pathname === '/privacy-policy') {
    pageContent = <PrivacyPolicyView navigate={navigate} />
  } else {
    pageContent = <HomeView releaseData={releaseData} navigate={navigate} isLoading={releaseStatus.isLoading} />
  }

  return (
    <div className={isAdminRoute ? '' : 'app-container'}>
      {!isAdminRoute && <Navbar navigate={navigate} pathname={pathname} releaseData={releaseData} isLoading={releaseStatus.isLoading} />}
      {pageContent}
      {pathname !== '/admin' && (
        <footer className="universal-footer reveal">
          <div className="footer-content">
            <div>
              <p style={{ fontWeight: '700', color: 'var(--ink)', fontSize: '1.1rem', marginBottom: '0.25rem' }}>RecipeWallah</p>
              <p>&copy; {new Date().getFullYear()} All rights reserved.</p>
            </div>
            <div className="footer-links">
              <a href="https://www.instagram.com/recipewalllah/" target="_blank" rel="noreferrer" className="footer-social-link">
                Instagram
              </a>
              <button onClick={() => navigate('/contact')}>Contact Us</button>
              <button onClick={() => navigate('/privacy-policy')}>Privacy Policy</button>
              <button onClick={() => navigate('/', '#features')}>Features</button>
            </div>
          </div>
        </footer>
      )}
    </div>
  )
}

export default App
