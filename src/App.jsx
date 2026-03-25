import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  clearStoredSession,
  deleteUploadedApk,
  fetchAdminHistory,
  fetchLatestRelease,
  getStoredSession,
  loginAdmin,
  storeSession,
  uploadRelease,
} from './api'
import heroImage from './assets/hero.png'
import './App.css'

const featureCards = [
  {
    title: 'Adaptive Recipe Search',
    description:
      'Discover meal ideas by ingredients, cuisine, prep time, and dietary goals in one flow.',
  },
  {
    title: 'Workout Nutrition Companion',
    description:
      'Get AI-assisted meal suggestions for bulking, cutting, recovery, and balanced fitness routines.',
  },
  {
    title: 'Medicine Awareness Layer',
    description:
      'See medicine info with strong caution messaging that prompts users to verify with professionals.',
  },
  {
    title: 'Geo-aware Suggestions',
    description:
      'Improve relevance by city context while avoiding permanent location storage.',
  },
]

const heroHighlights = ['Recipe Ideas', 'Fitness Meals', 'Medicine Alerts', 'Local Favorites']

const trustPoints = [
  'Location context is used only for recommendation quality and is not permanently stored.',
  'Only release metadata and download links are managed by the admin backend.',
  'AI outputs are informational and should be validated before acting on them.',
]

const howItWorksSteps = [
  { step: '01', title: 'Tell us your goals', description: 'Enter your available ingredients, dietary restrictions, or fitness goals like bulking or cutting.' },
  { step: '02', title: 'Get AI-curated recipes', description: 'Receive instant, personalized meal ideas with exact macros, prep times, and step-by-step instructions.' },
  { step: '03', title: 'Stay safe & consistent', description: 'Our Medicine Awareness Layer ensures you are mindful of interactions while you effortlessly track your daily nutrition.' },
]

const testimonials = [
  { text: "This app completely changed my cutting phase. The customized recipes actually taste good and perfectly hit my protein goals every single time.", author: "Marcus T.", tag: "Fitness Enthusiast" },
  { text: "I love that it warns me about mixing certain citrus fruits with my daily medication. So incredibly smart, safe, and easy to use.", author: "Sarah W.", tag: "Daily User" },
  { text: "Finally, an AI recipe app that doesn't just give generic answers. The step-by-step cooking instructions actually work flawlessly.", author: "Priya K.", tag: "Home Chef" }
]

const faqItems = [
  { q: "Is RecipeWallah free to use?", a: "Yes! Currently, the app is 100% free with no hidden subscriptions while we are in active development." },
  { q: "How do I install the Android APK?", a: "To install directly from our site, download the APK file, open it on your Android device, and tap 'Allow from this source' if prompted by your security settings." },
  { q: "Does the app save my medical data?", a: "No. The Medicine Awareness Layer evaluates potential interactions on the fly. We never persistently store your personal health condition records." },
  { q: "Are the macronutrient trackers perfectly accurate?", a: "Our AI evaluates raw ingredients based on standard, highly-accurate nutritional databases. However, you should always exercise professional judgment for strict medical or competitive bodybuilding routines." },
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
    title: 'Gym Nutrition Guidance',
    subtitle: 'Get high-protein meal suggestions for bulking, cutting, and recovery.',
    image:
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=60&fm=webp',
  },
  {
    id: 'medicine',
    title: 'Medicine Awareness',
    subtitle: 'Read careful medicine notes with reminders to verify professionally.',
    image:
      'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=60&fm=webp',
  },
]

const fallbackRelease = {
  version: 'Upcoming release',
  releaseNotes: 'The RecipeWallah team will publish the next downloadable app build here.',
  platform: 'android',
  directDownloadUrl: '',
  playStoreUrl: '',
  appStoreUrl: '',
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

function PrivacyPolicyView({ navigate }) {
  return (
    <div className="page-shell privacy-shell">
      <div className="privacy-container reveal">
        <h1 className="serif-title gradient-text">Privacy Policy</h1>
        <p className="last-updated">Last Updated: March 2026</p>
        <hr className="divider" />
        <section>
          <h2>1. Introduction</h2>
          <p>Welcome to RecipeWallah. This Privacy Policy outlines how we collect, use, and protect your information when you use our mobile application and website services.</p>
        </section>
        <section>
          <h2>2. Location & Data Collection</h2>
          <p>RecipeWallah may access your device's location to serve localized recipe suggestions. However, <strong>we do not save or persistently store your location data</strong> in our databases. Furthermore, <strong>we strictly do not share, sell, or disclose any of your data to third parties.</strong></p>
        </section>
        <section>
          <h2>3. AI-Generated Content Liability</h2>
          <p>All recipes, nutritional macronutrients, and dietary suggestions provided within RecipeWallah are entirely AI-generated. While we strive for quality, we cannot guarantee absolute accuracy. <strong>Using these suggestions is entirely the responsibility of the user.</strong> You must verify any ingredient safety, allergies, or dietary compliance prior to preparation and consumption.</p>
        </section>
        <section>
          <h2>4. Health and Medicine Disclaimer</h2>
          <p>The "Medicine Awareness Layer" is provided strictly for informational purposes. As the app's content is AI-generated, you must always consult a certified medical professional before mixing any suggested foods with prescription medication or altering your diet for medical purposes.</p>
        </section>
      </div>
    </div>
  )
}

function Navbar({ navigate, pathname, releaseData }) {
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
          <button className={`nav-item ${pathname === '/privacy' ? 'active' : ''}`} onClick={() => navTo('/privacy')}>Privacy Policy</button>
        </nav>

        <div className="nav-actions">
          {releaseData?.directDownloadUrl ? (
            <a className="nav-download-btn" href={releaseData.directDownloadUrl} target="_blank" rel="noreferrer">
              Download APK
            </a>
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
          <button className="mobile-nav-item" onClick={() => navTo('/privacy')}>🔒 Privacy Policy</button>
          <div className="mobile-menu-divider" />
          {releaseData?.directDownloadUrl ? (
            <a className="mobile-download-btn" href={releaseData.directDownloadUrl} target="_blank" rel="noreferrer" onClick={() => setMenuOpen(false)}>
              ⬇ Download APK
            </a>
          ) : (
            <span className="mobile-download-btn disabled">APK Coming Soon</span>
          )}
        </div>
      )}
    </header>
  )
}

function HomeView({ releaseData, navigate }) {
  return (
    <div className="page-shell new-home-shell">
      {/* Immersive Hero Section */}
      <section className="premium-hero">
        <div className="hero-content reveal">
          <div className="pill-badge">v{releaseData.version || '1.0.0'} Now Live</div>
          <h1 className="serif-title">
            Your Ultimate <br/>
            <span className="gradient-text">Food & Fitness</span> <br/>
            Companion.
          </h1>
          <p className="hero-subtext">
            RecipeWallah bridges the gap between delicious cooking, strict gym nutrition, and vital medicine awareness. All in one beautifully simple app.
          </p>
          <div className="hero-button-group">
            <DownloadAction href={releaseData.directDownloadUrl} label="Download APK" pendingLabel="Building APK..." />
            <DownloadAction href={releaseData.playStoreUrl} label="Google Play" pendingLabel="Play Store Pending" />
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
          <h2 className="serif-title">Designed for Every Lifestyle</h2>
          <p>Whether you're bulking, cutting, or managing dietary restrictions safely.</p>
        </div>
        <div className="features-grid">
          {featureCards.map((f, i) => (
            <div className={`feature-box reveal-delay-${i % 3}`} key={f.title}>
              <h3>{f.title}</h3>
              <p>{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="premium-testimonials reveal">
        <div className="section-header center">
          <h2 className="serif-title">Loved by Early Users</h2>
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
          <h2>Beautiful Visuals. <br/>Powerful Outcomes.</h2>
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

      {/* FAQ Section */}
      <section className="premium-faq reveal">
        <div className="section-header center">
          <h2 className="serif-title">Frequently Asked Questions</h2>
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

      {/* CTA Download Banner */}
      <section className="cta-banner reveal">
        <div className="cta-inner">
          <div className="cta-text">
            <h2 className="serif-title">Ready to eat smarter<br/>and train harder?</h2>
            <p>RecipeWallah is 100% free. Download now and start your journey today.</p>
          </div>
          <div className="cta-actions">
            <DownloadAction href={releaseData.directDownloadUrl} label="⬇ Download APK" pendingLabel="APK Coming Soon" />
            <DownloadAction href={releaseData.playStoreUrl} label="Google Play" pendingLabel="Play Store Soon" />
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
}) {
  const hasUploadedApk = Boolean(releaseData.fileName || releaseData.storagePath)
  const [activeTab, setActiveTab] = useState('publish')

  const tabs = [
    { id: 'publish', label: '📦 Publish Release' },
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
                        <div className="form-group"><label htmlFor="appFile">Upload APK (optional)</label><input id="appFile" type="file" accept=".apk" onChange={(event) => { const file = event.target.files?.[0] ?? null; if (file && !isApkFile(file)) { setSelectedFile(null); return; } setSelectedFile(file); }} />{selectedFile ? <p className="muted" style={{marginTop: '0.4rem', fontSize: '0.85rem'}}>Selected: {selectedFile.name}</p> : null}</div>
                        <div className="form-group"><label htmlFor="directDownloadUrl">Direct Download URL (optional)</label><input id="directDownloadUrl" name="directDownloadUrl" type="url" placeholder="https://example.com/app.apk" value={releaseForm.directDownloadUrl} onChange={onReleaseFieldChange} /></div>
                        <div className="form-group"><label htmlFor="playStoreUrl">Google Play URL (optional)</label><input id="playStoreUrl" name="playStoreUrl" type="url" placeholder="https://play.google.com/store/apps..." value={releaseForm.playStoreUrl} onChange={onReleaseFieldChange} /></div>
                        <div className="form-group"><label htmlFor="appStoreUrl">App Store URL (optional)</label><input id="appStoreUrl" name="appStoreUrl" type="url" placeholder="https://apps.apple.com/app/id..." value={releaseForm.appStoreUrl} onChange={onReleaseFieldChange} /></div>
                        <div className="form-group full-width">
                          <button type="submit" className="solid-btn" disabled={uploadState.isUploading}>{uploadState.isUploading ? `Publishing... ${uploadState.progress}%` : 'Publish Release'}</button>
                          {uploadState.isUploading ? <progress max="100" value={uploadState.progress} style={{marginTop: '0.5rem', width: '100%'}} /> : null}
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
                  {!hasUploadedApk ? <p className="muted" style={{marginTop: '0.75rem'}}>No uploaded APK available to delete.</p> : null}
                  {deleteApkState.message ? <p className="status-message success">{deleteApkState.message}</p> : null}
                  {deleteApkState.error ? <p className="status-message error">{deleteApkState.error}</p> : null}
                </section>
              )}

              {/* HISTORY TAB */}
              {activeTab === 'history' && (
                <HistoryList historyItems={historyItems} historyState={historyState} onRefresh={loadHistory} />
              )}
            </>
          ) : null}
        </main>
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

  const currentUser = session?.user ?? null
  const authToken = session?.token ?? ''

  const adminAllowlist = useMemo(
    () =>
      ('owner@recipewallah.com')
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
      />
    )
  } else if (pathname === '/privacy') {
    pageContent = <PrivacyPolicyView navigate={navigate} />
  } else {
    pageContent = <HomeView releaseData={releaseData} navigate={navigate} />
  }

  return (
    <div className={isAdminRoute ? '' : 'app-container'}>
      {!isAdminRoute && <Navbar navigate={navigate} pathname={pathname} releaseData={releaseData} />}
      {pageContent}
      {pathname !== '/admin' && (
        <footer className="universal-footer reveal">
          <div className="footer-content">
            <p>&copy; {new Date().getFullYear()} RecipeWallah. All rights reserved.</p>
            <div className="footer-links">
              <button onClick={() => navigate('/privacy')}>Privacy Policy</button>
            </div>
          </div>
        </footer>
      )}
    </div>
  )
}

export default App
