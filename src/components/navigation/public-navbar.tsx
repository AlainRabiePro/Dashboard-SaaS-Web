'use client';

import Link from 'next/link';
import { Globe } from 'lucide-react';

export default function PublicNavbar() {
  return (
    <nav className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition">
          <Globe className="w-8 h-8 text-blue-500" />
          <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            DomainHub
          </span>
        </Link>
        <div className="flex gap-4 items-center">
          <a href="/#pricing" className="text-slate-300 hover:text-white transition">
            Tarifs
          </a>
          <a href="/#faq" className="text-slate-300 hover:text-white transition">
            FAQ
          </a>
          <Link href="/login" className="text-slate-300 hover:text-white transition">
            Se Connecter
          </Link>
          <Link
            href="/signup"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition"
          >
            S'inscrire
          </Link>
        </div>
      </div>
    </nav>
  );
}
