import React from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Lock,
  Zap,
  Share2,
  BarChart3,
  Users,
  HardDrive,
  CheckCircle,
  ArrowRight,
  ShieldCheck,
  FileCheck
} from 'lucide-react';
import Button from '../components/common/Button';
import { useAuth } from '../context/AuthContext';

const LandingPage = () => {
  const { isAuthenticated } = useAuth();

  const features = [
    {
      icon: Lock,
      title: 'Streaming AES-256 Encryption',
      description:
        'Files are encrypted and decrypted on-the-fly via native Node.js crypto streams. Files are never stored raw in plaintext.'
    },
    {
      icon: Zap,
      title: 'High-Performance Streaming',
      description:
        'Memory-optimized architecture pipes large files directly through ciphers without buffering entire payloads into RAM.'
    },
    {
      icon: Share2,
      title: 'Granular Shareable Links',
      description:
        'Generate secure random tokens with optional expiration (1h to 30d), bcrypt password protection, and download caps.'
    },
    {
      icon: BarChart3,
      title: 'Real-Time Download Tracking',
      description:
        'Detailed audit logs capture timestamp, IP address, and client user-agent for every successful download event.'
    },
    {
      icon: Users,
      title: 'Role-Based Access Control',
      description:
        'Multi-tier permissions with User and Admin roles. Admins manage system storage, users, and audit platform security.'
    },
    {
      icon: HardDrive,
      title: 'Pluggable Storage Engine',
      description:
        'Designed with a clean StorageService abstraction ready for seamless cloud expansion (AWS S3, Azure Blob, Google Cloud).'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-primary-500 selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-primary-600 to-indigo-600 text-white shadow-md shadow-primary-500/20">
              <Shield className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-lg tracking-tight text-slate-900">
              SecureFile
            </span>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link to="/dashboard">
                <Button variant="primary" size="sm" icon={ArrowRight}>
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm">
                    Get Started Free
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 sm:pt-24 sm:pb-32 overflow-hidden">
        <div className="absolute -top-40 right-1/2 translate-x-1/2 w-[700px] h-[400px] bg-gradient-to-tr from-primary-200/40 via-indigo-200/30 to-purple-200/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 border border-primary-200/80 text-primary-700 text-xs font-semibold mb-6 animate-pulse-subtle">
            <ShieldCheck className="w-3.5 h-3.5 text-primary-600" />
            Zero-Knowledge AES-256 Storage Architecture
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
            Secure File Transfer, <br />
            <span className="bg-gradient-to-r from-primary-600 to-indigo-600 bg-clip-text text-transparent">
              Simplified.
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Upload, encrypt, store and securely share your files from anywhere.
            Built with production-ready security, streaming ciphers, and download tracking.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link to={isAuthenticated ? '/dashboard' : '/register'}>
              <Button variant="primary" size="lg" icon={ArrowRight}>
                {isAuthenticated ? 'Open Dashboard' : 'Create Free Account'}
              </Button>
            </Link>
            <Link to={isAuthenticated ? '/upload' : '/login'}>
              <Button variant="outline" size="lg">
                {isAuthenticated ? 'Upload File' : 'Sign In'}
              </Button>
            </Link>
          </div>

          {/* Trust badges */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-slate-500">
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              AES-256 Stream Cipher
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              Bcrypt Passwords
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              Expirable Links & Caps
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              Full Audit Tracking
            </span>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-primary-600 uppercase tracking-wider">
              Enterprise-Grade Security
            </h2>
            <h3 className="mt-2 text-3xl font-bold text-slate-900 tracking-tight">
              Designed For High-Assurance Data Protection
            </h3>
            <p className="mt-3 text-slate-600 text-sm leading-relaxed">
              Every upload is cryptographically transformed with random initialization vectors
              before reaching physical disk storage.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feat, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-slate-50/75 border border-slate-200/70 hover:bg-white hover:shadow-md hover:border-primary-200 transition-all duration-200 flex flex-col"
              >
                <div className="p-3 bg-white border border-slate-200/80 rounded-xl text-primary-600 w-fit mb-4 shadow-2xs">
                  <feat.icon className="w-6 h-6" />
                </div>
                <h4 className="text-base font-semibold text-slate-900 mb-2">{feat.title}</h4>
                <p className="text-sm text-slate-600 leading-relaxed">{feat.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works workflow */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-xs font-bold text-primary-600 uppercase tracking-wider">
              Zero-Friction Workflow
            </h2>
            <h3 className="mt-2 text-3xl font-bold text-slate-900 tracking-tight">
              From File to Encrypted Share in Seconds
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-2xs">
              <span className="w-8 h-8 rounded-full bg-primary-50 text-primary-700 font-bold text-sm inline-flex items-center justify-center mb-3">
                1
              </span>
              <h5 className="font-semibold text-sm text-slate-900">Upload File</h5>
              <p className="mt-1 text-xs text-slate-500">
                Drag and drop any file type up to 500 MB.
              </p>
            </div>
            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-2xs">
              <span className="w-8 h-8 rounded-full bg-primary-50 text-primary-700 font-bold text-sm inline-flex items-center justify-center mb-3">
                2
              </span>
              <h5 className="font-semibold text-sm text-slate-900">Stream Encrypt</h5>
              <p className="mt-1 text-xs text-slate-500">
                AES-256 cipher streams encrypt directly to storage.
              </p>
            </div>
            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-2xs">
              <span className="w-8 h-8 rounded-full bg-primary-50 text-primary-700 font-bold text-sm inline-flex items-center justify-center mb-3">
                3
              </span>
              <h5 className="font-semibold text-sm text-slate-900">Generate Link</h5>
              <p className="mt-1 text-xs text-slate-500">
                Set custom expiration, password, and download caps.
              </p>
            </div>
            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-2xs">
              <span className="w-8 h-8 rounded-full bg-primary-50 text-primary-700 font-bold text-sm inline-flex items-center justify-center mb-3">
                4
              </span>
              <h5 className="font-semibold text-sm text-slate-900">Stream Decrypt</h5>
              <p className="mt-1 text-xs text-slate-500">
                Recipients stream decrypted file with audit logging.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary-600" />
            <span className="font-semibold text-slate-700">SecureFile Transfer Platform</span>
            <span>© {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="hover:text-slate-800">
              Sign In
            </Link>
            <Link to="/register" className="hover:text-slate-800">
              Register
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
