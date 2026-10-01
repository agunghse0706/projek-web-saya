import React from 'react';
import { 
  ShieldCheck, 
  FileSpreadsheet, 
  PlusCircle, 
  Building2, 
  BarChart3, 
  Download, 
  RotateCcw,
  HardHat
} from 'lucide-react';

interface HeaderProps {
  currentTab: 'dashboard' | 'form' | 'contractors' | 'analytics';
  setCurrentTab: (tab: 'dashboard' | 'form' | 'contractors' | 'analytics') => void;
  onExportData: () => void;
  onResetData: () => void;
  recordCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  onExportData,
  onResetData,
  recordCount,
}) => {
  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-30 shadow-xs">
      {/* Top Banner with Oil & Gas / Refinery Brand Accent */}
      <div className="bg-slate-900 text-white text-xs px-4 sm:px-6 py-1.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-semibold tracking-wide text-slate-100 uppercase">PT KILANG PERTAMINA INTERNASIONAL</span>
          <span className="text-slate-400">|</span>
          <span className="text-slate-300">REFINERY UNIT V BALIKPAPAN</span>
        </div>
        <div className="flex items-center gap-4 text-slate-300 text-xs">
          <span>K3LL & CSMS Subcontractor Management</span>
          <span className="text-slate-500">·</span>
          <span className="text-slate-300 font-mono">User: agung.hse0706@gmail.com</span>
        </div>
      </div>

      {/* Main Header Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-slate-800 rounded-lg flex items-center justify-center text-amber-400 shadow-sm shrink-0">
            <HardHat className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                Subcontractor HSE KPI Assessment
              </h1>
              <span className="text-xs bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded">
                KPI RU-V
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Sistem Evaluasi & Pemantauan Kinerja K3LL Subkontraktor Kilang Minyak Balikpapan
            </p>
          </div>
        </div>

        {/* Global Actions */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={() => setCurrentTab('form')}
            className="inline-flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold px-3.5 py-2 rounded-md transition-colors shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Input Evaluasi Baru</span>
          </button>
          <button
            onClick={onExportData}
            title="Ekspor Seluruh Data ke format CSV/Excel"
            className="inline-flex items-center gap-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium px-3 py-2 rounded-md transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Ekspor Data ({recordCount})</span>
            <span className="sm:hidden">Ekspor</span>
          </button>
          <button
            onClick={onResetData}
            title="Kembalikan dataset contoh resmi"
            className="inline-flex items-center gap-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-medium px-2.5 py-2 rounded-md transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden md:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* Nav Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-1 border-t border-slate-100 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setCurrentTab('dashboard')}
          className={`flex items-center gap-2 py-2.5 px-3 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
            currentTab === 'dashboard'
              ? 'border-blue-700 text-blue-700 font-semibold'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Dashboard Kinerja Eksekutif</span>
        </button>

        <button
          onClick={() => setCurrentTab('form')}
          className={`flex items-center gap-2 py-2.5 px-3 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
            currentTab === 'form'
              ? 'border-blue-700 text-blue-700 font-semibold'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Formulir Asesmen (40 Butir KPI)</span>
        </button>

        <button
          onClick={() => setCurrentTab('contractors')}
          className={`flex items-center gap-2 py-2.5 px-3 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
            currentTab === 'contractors'
              ? 'border-blue-700 text-blue-700 font-semibold'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Daftar Kontraktor (36 Perusahaan)</span>
        </button>

        <button
          onClick={() => setCurrentTab('analytics')}
          className={`flex items-center gap-2 py-2.5 px-3 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
            currentTab === 'analytics'
              ? 'border-blue-700 text-blue-700 font-semibold'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Analisis Risiko & Piramida Insiden</span>
        </button>
      </div>
    </header>
  );
};
