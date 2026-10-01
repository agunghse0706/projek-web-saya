import React, { useState } from 'react';
import { 
  HSEAssessmentRecord, 
  CONTRACTOR_COMPANIES, 
  WORK_LOCATIONS, 
  WorkLocation 
} from '../types/hse';
import { getRecordRiskDrop } from '../utils/riskAlert';
import { 
  Building2, 
  Search, 
  Plus, 
  Eye, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ArrowRight,
  ShieldCheck,
  Filter,
  ShieldAlert,
  TrendingDown
} from 'lucide-react';

interface ContractorListViewProps {
  assessments: HSEAssessmentRecord[];
  onSelectContractor: (companyName: string) => void;
  onNewAssessmentForCompany: (companyName: string) => void;
  onViewRecord: (record: HSEAssessmentRecord) => void;
}

export const ContractorListView: React.FC<ContractorListViewProps> = ({
  assessments,
  onSelectContractor,
  onNewAssessmentForCompany,
  onViewRecord,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'evaluated' | 'pending' | 'risk-alert'>('all');

  // Map each company in CONTRACTOR_COMPANIES with their latest assessment data
  const contractorSummary = CONTRACTOR_COMPANIES.map(company => {
    const companyRecords = assessments.filter(a => a.companyName.toLowerCase() === company.toLowerCase());
    const latestRecord = companyRecords.length > 0
      ? [...companyRecords].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]
      : null;

    const totalHours = companyRecords.reduce((acc, c) => acc + c.manHours, 0);
    const totalIncidents = companyRecords.reduce((acc, c) => acc + c.fatality + c.lti + c.rwdc + c.mtc, 0);
    const riskDrop = latestRecord ? getRecordRiskDrop(latestRecord, assessments) : { hasDrop: false };

    return {
      name: company,
      totalAssessments: companyRecords.length,
      latestRecord,
      totalHours,
      totalIncidents,
      hasEvaluation: companyRecords.length > 0,
      riskDrop,
    };
  });

  const riskAlertCount = contractorSummary.filter(c => c.riskDrop.hasDrop).length;

  const filtered = contractorSummary.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
    if (statusFilter === 'evaluated') return matchSearch && item.hasEvaluation;
    if (statusFilter === 'pending') return matchSearch && !item.hasEvaluation;
    if (statusFilter === 'risk-alert') return matchSearch && item.riskDrop.hasDrop;
    return matchSearch;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded">
              Database Rekanan K3LL
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500 font-medium">CSMS Kilang Balikpapan</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            Daftar Kontraktor & Subkontraktor Resmi (36 Perusahaan)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar seluruh perusahaan rekanan yang terdaftar pada Formulir Asesmen KPI K3LL PT KPI RU-V.
          </p>
        </div>

        {/* Status Count Pill */}
        <div className="flex items-center gap-2 text-xs">
          <span className="p-2.5 bg-slate-50 border border-slate-200 rounded-md font-medium text-slate-700">
            Terdaftar: <strong className="text-slate-900">{CONTRACTOR_COMPANIES.length}</strong>
          </span>
          <span className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-md font-medium text-emerald-800">
            Terasesi: <strong>{contractorSummary.filter(c => c.hasEvaluation).length}</strong>
          </span>
          <span className="p-2.5 bg-amber-50 border border-amber-200 rounded-md font-medium text-amber-800">
            Belum Dievaluasi: <strong>{contractorSummary.filter(c => !c.hasEvaluation).length}</strong>
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Status:</span>
          </span>
          <button
            onClick={() => setStatusFilter('all')}
            className={`text-xs px-2.5 py-1.5 rounded transition-colors ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white font-medium'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Semua ({CONTRACTOR_COMPANIES.length})
          </button>
          <button
            onClick={() => setStatusFilter('evaluated')}
            className={`text-xs px-2.5 py-1.5 rounded transition-colors ${
              statusFilter === 'evaluated'
                ? 'bg-blue-700 text-white font-medium'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Sudah Terasesi ({contractorSummary.filter(c => c.hasEvaluation).length})
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`text-xs px-2.5 py-1.5 rounded transition-colors ${
              statusFilter === 'pending'
                ? 'bg-amber-600 text-white font-medium'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Belum Diasesi ({contractorSummary.filter(c => !c.hasEvaluation).length})
          </button>
          <button
            onClick={() => setStatusFilter('risk-alert')}
            className={`text-xs px-2.5 py-1.5 rounded-md font-semibold transition-all inline-flex items-center gap-1 ${
              statusFilter === 'risk-alert'
                ? 'bg-rose-700 text-white shadow-xs'
                : riskAlertCount > 0
                ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                : 'text-slate-400 border border-slate-200 opacity-60'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
            <span>Risk Alert ({riskAlertCount})</span>
          </button>
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama perusahaan..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-1.5 border border-slate-300 rounded-md bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
          />
        </div>
      </div>

      {/* Contractor Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(contractor => {
          const rec = contractor.latestRecord;

          return (
            <div 
              key={contractor.name}
              className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs leading-snug line-clamp-1" title={contractor.name}>
                        {contractor.name}
                      </h4>
                      <div className="text-[11px] text-slate-400">
                        {contractor.totalAssessments} Evaluasi Tercatat
                      </div>
                    </div>
                  </div>

                  {rec ? (
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-extrabold ${
                        rec.grade === 'A' ? 'bg-emerald-100 text-emerald-800' :
                        rec.grade === 'B' ? 'bg-blue-100 text-blue-800' :
                        rec.grade === 'C' ? 'bg-amber-100 text-amber-800' :
                        'bg-rose-100 text-rose-800'
                      }`}>
                        Grade {rec.grade}
                      </span>
                      {contractor.riskDrop.hasDrop && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                          <TrendingDown className="w-3 h-3 text-rose-600" />
                          <span>↓ {contractor.riskDrop.dropAmount}%</span>
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-500">
                      Pending
                    </span>
                  )}
                </div>

                {/* Details if evaluated */}
                {rec ? (
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                    {contractor.riskDrop.hasDrop && (
                      <div className="p-2 bg-rose-50 border border-rose-200 rounded text-[11px] text-rose-900 font-semibold flex items-center gap-1.5">
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        <span>Risk Alert: Skor anjlok -{contractor.riskDrop.dropAmount}% vs {contractor.riskDrop.previousRecord?.reportPeriod} ({contractor.riskDrop.previousRecord?.calculatedScore}%)</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Lokasi / Periode:</span>
                      <span className="font-medium text-slate-800">{rec.workLocation} · {rec.reportPeriod}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Skor Terakhir:</span>
                      <span className="font-bold text-slate-900">{rec.calculatedScore}% (Lag {rec.laggingScore} / Lead {rec.leadingScore})</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Jam Kerja Total:</span>
                      <span className="font-mono text-slate-800">{contractor.totalHours.toLocaleString('id-ID')} hrs</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Kasus Insiden:</span>
                      <span className={`font-semibold ${contractor.totalIncidents > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                        {contractor.totalIncidents === 0 ? 'Zero Incident' : `${contractor.totalIncidents} Kejadian`}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-400 italic">
                    Belum ada rekaman evaluasi K3LL yang diunggah untuk periode aktif.
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                {rec ? (
                  <button
                    onClick={() => onViewRecord(rec)}
                    className="inline-flex items-center gap-1 text-xs text-slate-700 hover:text-blue-700 font-medium py-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Lihat Hasil</span>
                  </button>
                ) : <div />}

                <button
                  onClick={() => onNewAssessmentForCompany(contractor.name)}
                  className="inline-flex items-center gap-1 text-xs bg-slate-100 hover:bg-blue-50 text-blue-700 font-semibold px-2.5 py-1.5 rounded transition-colors"
                >
                  <span>+ Nilai KPI</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
