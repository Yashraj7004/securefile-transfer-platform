import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/common/Button';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
      <div className="p-4 bg-red-50 text-red-600 rounded-3xl border border-red-200/80 mb-6 shadow-sm">
        <ShieldAlert className="w-12 h-12" />
      </div>
      <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">404</h1>
      <h2 className="text-lg font-bold text-slate-700 mt-2">Page Not Found</h2>
      <p className="text-xs text-slate-500 max-w-sm mt-1 mb-8 leading-relaxed">
        The requested URL or resource does not exist, has been moved, or is no longer accessible.
      </p>
      <Link to="/">
        <Button variant="primary" size="md" icon={ArrowLeft}>
          Return to Homepage
        </Button>
      </Link>
    </div>
  );
};

export default NotFoundPage;
