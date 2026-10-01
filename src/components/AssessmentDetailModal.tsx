import React, { useMemo } from 'react';
import { HSEAssessmentRecord } from '../types/hse';
import { getGradeLabel } from '../utils/calculator';
import { getRecordRiskDrop } from '../utils/riskAlert';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine
} from 'recharts';
import { 
  X, 
  Printer, 
  Building2, 
  Calendar, 
  MapPin, 
  User, 
  ShieldCheck, 
  AlertTriangle, 
  ExternalLink,
  CheckCircle,
  XCircle,
  FileCheck,
  ShieldAlert,
  TrendingDown,
  TrendingUp,
  HardHat,
  FileSpreadsheet,
  Activity,
  History
} from 'lucide-react';

interface AssessmentDetailModalProps {
  record: HSEAssessmentRecord | null;
  onClose: () => void;
  onEdit?: (record: HSEAssessmentRecord) => void;
  allAssessments?: HSEAssessmentRecord[];
}

export const AssessmentDetailModal: React.FC<AssessmentDetailModalProps> = ({
  record,
  onClose,
  onEdit,
  allAssessments = [],
}) => {
  if (!record) return null;

  const gradeInfo = getGradeLabel(record.grade);
  const riskDrop = getRecordRiskDrop(record, allAssessments);

  // Compute last 5 assessments historical trend for this specific contractor
  const historicalTrend = useMemo(() => {
    if (!record) return [];

    // Filter all records belonging to this company
    const companyRecords = allAssessments.filter(
      a => a.companyName.trim().toLowerCase() === record.companyName.trim().toLowerCase()
    );

    // Ensure the current record is included
    const hasCurrent = companyRecords.some(a => a.id === record.id);
    const combined = hasCurrent ? companyRecords : [...companyRecords, record];

    const periodOrder: Record<string, number> = {
      'November 23': 202311,
      'Desember 23': 202312,
      'Januari 24': 202401,
      'Februari 24': 202402,
      'Maret 24': 202403,
      'April 24': 202404,
      'Mei 24': 202405,
      'Juni 24': 202406,
    };

    const sorted = [...combined].sort((a, b) => {
      const orderA = periodOrder[a.reportPeriod] || new Date(a.timestamp).getTime();
      const orderB = periodOrder[b.reportPeriod] || new Date(b.timestamp).getTime();
      return orderA - orderB;
    });

    // Return the last 5 assessments
    return sorted.slice(-5).map(item => ({
      id: item.id,
      period: item.reportPeriod,
      score: item.calculatedScore,
      lagging: item.laggingScore,
      leading: item.leadingScore,
      grade: item.grade,
      isCurrent: item.id === record.id,
    }));
  }, [record, allAssessments]);

  // Summary statistics for the historical line chart
  const trendStats = useMemo(() => {
    if (historicalTrend.length === 0) {
      return { avg: 0, max: 0, min: 0, diff: 0, trend: 'stable' };
    }

    const scores = historicalTrend.map(t => t.score);
    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const max = Math.max(...scores);
    const min = Math.min(...scores);

    let diff = 0;
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (historicalTrend.length >= 2) {
      const curr = historicalTrend[historicalTrend.length - 1].score;
      const prev = historicalTrend[historicalTrend.length - 2].score;
      diff = curr - prev;
      if (diff > 0) trend = 'up';
      else if (diff < 0) trend = 'down';
    }

    return { avg, max, min, diff, trend };
  }, [historicalTrend]);

  // Trigger browser print dialog for PDF generation
  const handlePrintSummary = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Modal Header (Screen view only) */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50 print:hidden">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-semibold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded">
                Lembar Hasil Evaluasi K3LL
              </span>
              <span className="text-slate-400">·</span>
              <span className="text-xs text-slate-500 font-mono">ID: {record.id}</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-1">
              Subcontractor HSE KPI Assessment Report
            </h2>
            <p className="text-xs text-slate-500">
              PT Kilang Pertamina Internasional - Refinery Unit V Balikpapan
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintSummary}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 px-3.5 py-2 rounded-md shadow-xs transition-colors"
              title="Print Summary: Cetak Laporan PDF Resmi Kinerja HSE Kontraktor"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Summary (PDF)</span>
            </button>
            {onEdit && (
              <button
                onClick={() => onEdit(record)}
                className="text-xs font-semibold text-blue-700 border border-blue-200 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-md transition-colors"
              >
                Edit
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors"
              title="Tutup Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-xs text-slate-800 printable-content">
          
          {/* OFFICIAL PRINT LETTERHEAD (Kop Surat Resmi PT KPI RU-V) - Visible in Print Only */}
          <div className="print-only mb-4 border-b-2 border-slate-900 pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded bg-slate-900 text-amber-400 flex items-center justify-center font-bold text-xl border border-slate-700">
                  KPI
                </div>
                <div>
                  <div className="text-xs uppercase font-extrabold tracking-wider text-slate-900">
                    PT KILANG PERTAMINA INTERNASIONAL
                  </div>
                  <div className="text-[11px] font-bold text-slate-700">
                    REFINERY UNIT V BALIKPAPAN — HEALTH, SAFETY, SECURITY &amp; ENVIRONMENT (HSSE)
                  </div>
                  <div className="text-[10px] text-slate-600">
                    Sistem Manajemen Keselamatan Kontraktor (CSMS) &amp; Subcontractor HSE KPI Monitoring
                  </div>
                </div>
              </div>
              <div className="text-right text-[10px] text-slate-600 space-y-0.5">
                <div>No. Dokumen: <strong className="text-slate-900 font-mono">RU5/HSSE-CSMS/{record.id}</strong></div>
                <div>Tanggal Audit: <strong>{new Date(record.timestamp).toLocaleDateString('id-ID', { dateStyle: 'long' })}</strong></div>
                <div>Klasifikasi: <span className="font-semibold text-slate-800">Dokumen Resmi CSMS</span></div>
              </div>
            </div>
            <div className="mt-2.5 pt-2 border-t border-slate-300 text-center">
              <h1 className="text-sm font-black uppercase tracking-wide text-slate-900">
                LAPORAN RESMI RINGKASAN EVALUASI KEY PERFORMANCE INDICATOR (KPI) HSE SUBKONTRAKTOR
              </h1>
            </div>
          </div>

          {/* Risk Alert Warning Banner (if score dropped > 15%) */}
          {riskDrop.hasDrop && (
            <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-lg space-y-2 text-rose-950 page-break-inside-avoid">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-800">
                    PERINGATAN DINI K3LL (RISK ALERT): PENURUNAN SKOR &gt; 15%
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 font-black text-xs text-rose-700 bg-rose-200/80 px-2 py-0.5 rounded">
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>Turun {riskDrop.dropAmount}%</span>
                </span>
              </div>
              <p className="text-xs text-rose-900 leading-relaxed font-medium">
                Performa K3LL kontraktor ini mengalami kemerosotan tajam pada periode <strong>{record.reportPeriod}</strong> sebesar <strong>-{riskDrop.dropAmount}%</strong> dibandingkan periode <strong>{riskDrop.previousRecord?.reportPeriod}</strong> ({riskDrop.previousRecord?.calculatedScore}% ➔ {record.calculatedScore}%).
              </p>
              <div className="p-2.5 bg-white border border-rose-200 rounded text-[11px] text-slate-700 flex flex-wrap items-center justify-between gap-2">
                <span>Rekomendasi Auditor HSE: Wajib Audit CSMS Lapangan &amp; Safety Stand-Down.</span>
                <span className="font-semibold text-rose-700">Status: Tindakan Korektif Segera</span>
              </div>
            </div>
          )}

          {/* Executive Score Card Banner */}
          <div className="p-4 bg-slate-900 text-white rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 page-break-inside-avoid">
            <div>
              <div className="text-xs uppercase font-medium text-slate-400">Hasil Penilaian Akhir K3LL</div>
              <h3 className="text-xl font-bold text-white mt-0.5">{record.companyName}</h3>
              <div className="text-xs text-slate-300 mt-1 flex flex-wrap items-center gap-3">
                <span>Lokasi: <strong>{record.workLocation}</strong></span>
                <span>·</span>
                <span>Periode: <strong>{record.reportPeriod}</strong></span>
                <span>·</span>
                <span>Jam Kerja: <strong>{record.manHours.toLocaleString('id-ID')} hrs</strong></span>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-slate-800/90 p-3 rounded-lg border border-slate-700">
              <div className="text-right">
                <div className="text-xs text-slate-400">Skor Total KPI</div>
                <div className="text-3xl font-extrabold text-amber-400">{record.calculatedScore}%</div>
              </div>
              <div className="w-px h-10 bg-slate-700" />
              <div>
                <span className={`inline-block px-3 py-1 rounded text-sm font-extrabold ${
                  record.grade === 'A' ? 'bg-emerald-500 text-white' :
                  record.grade === 'B' ? 'bg-blue-500 text-white' :
                  record.grade === 'C' ? 'bg-amber-500 text-white' :
                  'bg-rose-500 text-white'
                }`}>
                  Grade {record.grade}
                </span>
                <div className="text-[10px] text-slate-300 mt-0.5">{gradeInfo.text}</div>
              </div>
            </div>
          </div>

          {/* Historical Performance Trend Chart (Recharts) */}
          <div className="border border-slate-200 rounded-lg p-4 bg-white shadow-xs page-break-inside-avoid space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-blue-700" />
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    Tren Kinerja K3LL Kontraktor ({historicalTrend.length} Asesmen Terakhir)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Histori pergerakan skor KPI K3LL untuk mengevaluasi konsistensi kepatuhan
                  </p>
                </div>
              </div>

              {/* Quick trend indicator */}
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2 py-1 rounded">
                  <span className="text-slate-500 text-[11px]">Rata-rata:</span>
                  <strong className="text-slate-900 font-bold">{trendStats.avg}%</strong>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2 py-1 rounded">
                  <span className="text-slate-500 text-[11px]">Tren:</span>
                  {trendStats.trend === 'up' ? (
                    <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>+{trendStats.diff}%</span>
                    </span>
                  ) : trendStats.trend === 'down' ? (
                    <span className="text-rose-700 font-bold flex items-center gap-0.5">
                      <TrendingDown className="w-3.5 h-3.5" />
                      <span>{trendStats.diff}%</span>
                    </span>
                  ) : (
                    <span className="text-slate-600 font-semibold">Stabil</span>
                  )}
                </div>
              </div>
            </div>

            {/* Recharts Container */}
            <div className="h-44 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart 
                  data={historicalTrend} 
                  margin={{ top: 12, right: 24, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="period" 
                    tick={{ fontSize: 11, fill: '#475569', fontWeight: 500 }} 
                    tickLine={false} 
                    axisLine={{ stroke: '#cbd5e1' }}
                  />
                  <YAxis 
                    domain={[0, 100]} 
                    ticks={[0, 25, 50, 75, 85, 100]} 
                    tick={{ fontSize: 10, fill: '#64748b' }} 
                    tickLine={false} 
                    axisLine={{ stroke: '#cbd5e1' }}
                  />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-2.5 rounded shadow-lg text-xs space-y-1 border border-slate-700">
                            <div className="font-bold flex items-center justify-between gap-3">
                              <span>{label}</span>
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                data.grade === 'A' ? 'bg-emerald-500 text-white' :
                                data.grade === 'B' ? 'bg-blue-500 text-white' :
                                data.grade === 'C' ? 'bg-amber-500 text-white' : 'bg-rose-500 text-white'
                              }`}>
                                Grade {data.grade}
                              </span>
                            </div>
                            <div className="text-amber-400 font-bold">Skor KPI: {data.score}%</div>
                            <div className="text-[11px] text-slate-300">
                              Lagging: {data.lagging} · Leading: {data.leading}
                            </div>
                            {data.isCurrent && (
                              <div className="text-[10px] text-emerald-400 font-semibold pt-0.5 border-t border-slate-700">
                                ✓ Laporan Terpilih
                              </div>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <ReferenceLine 
                    y={85} 
                    stroke="#10b981" 
                    strokeDasharray="4 4" 
                    label={{ value: 'Target RU-V (85%)', position: 'insideTopRight', fill: '#059669', fontSize: 10, fontWeight: 600 }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    name="Skor KPI" 
                    stroke="#1d4ed8" 
                    strokeWidth={2.5} 
                    dot={{ r: 4, stroke: '#1d4ed8', strokeWidth: 2, fill: '#ffffff' }}
                    activeDot={{ r: 6, stroke: '#1d4ed8', strokeWidth: 2, fill: '#1d4ed8' }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Sub-label note */}
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-700 inline-block"></span>
                <span>Garis Skor KPI K3LL Subkontraktor</span>
                <span className="text-slate-300">|</span>
                <span className="w-3 border-b-2 border-dashed border-emerald-600 inline-block"></span>
                <span className="text-emerald-700 font-medium">Batas Minimum Kinerja Unggul (85%)</span>
              </div>
              <div>
                <span>Tertinggi: <strong>{trendStats.max}%</strong> · Terendah: <strong>{trendStats.min}%</strong></span>
              </div>
            </div>
          </div>

          {/* Bagian 1: INFORMASI UMUM */}
          <div className="border border-slate-200 rounded-lg overflow-hidden page-break-inside-avoid">
            <div className="bg-slate-100 px-4 py-2 font-bold text-slate-900 uppercase text-[11px] tracking-wider border-b border-slate-200">
              1. INFORMASI UMUM (Q1 - Q5)
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <span className="text-slate-500 block text-[11px]">1. Lokasi Kerja:</span>
                <span className="font-semibold text-slate-900 text-sm">{record.workLocation}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">2. Nama Perusahaan:</span>
                <span className="font-semibold text-slate-900 text-sm">{record.companyName}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">3. Pimpinan Perusahaan:</span>
                <span className="font-medium text-slate-900">{record.companyLeader}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">4. Periode Laporan:</span>
                <span className="font-medium text-slate-900">{record.reportPeriod}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">5. HSE Officer / Coordinator:</span>
                <span className="font-medium text-slate-900">{record.hseOfficerName}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Tanggal Evaluasi:</span>
                <span className="font-medium text-slate-700">
                  {new Date(record.timestamp).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </div>
            </div>
          </div>

          {/* Bagian 2: HSE STATISTIC RECORD (YTD) */}
          <div className="border border-slate-200 rounded-lg overflow-hidden page-break-inside-avoid">
            <div className="bg-slate-100 px-4 py-2 font-bold text-slate-900 uppercase text-[11px] tracking-wider border-b border-slate-200">
              2. HSE STATISTIC RECORD (YTD) (Q6 - Q17)
            </div>
            <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-2 rounded bg-slate-50 border border-slate-100">
                <span className="text-slate-500 block text-[10px] uppercase">6. Fatality</span>
                <span className={`text-base font-bold ${record.fatality > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                  {record.fatality}
                </span>
              </div>
              <div className="p-2 rounded bg-slate-50 border border-slate-100">
                <span className="text-slate-500 block text-[10px] uppercase">7. Lost Time Incident (LTI)</span>
                <span className={`text-base font-bold ${record.lti > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                  {record.lti}
                </span>
              </div>
              <div className="p-2 rounded bg-slate-50 border border-slate-100">
                <span className="text-slate-500 block text-[10px] uppercase">8. RWDC</span>
                <span className="text-base font-bold text-slate-900">{record.rwdc}</span>
              </div>
              <div className="p-2 rounded bg-slate-50 border border-slate-100">
                <span className="text-slate-500 block text-[10px] uppercase">9. Medical Treatment (MTC)</span>
                <span className="text-base font-bold text-slate-900">{record.mtc}</span>
              </div>
              <div className="p-2 rounded bg-slate-50 border border-slate-100">
                <span className="text-slate-500 block text-[10px] uppercase">10. First Aid Case (FAC)</span>
                <span className="text-base font-bold text-slate-900">{record.fac}</span>
              </div>
              <div className="p-2 rounded bg-slate-50 border border-slate-100">
                <span className="text-slate-500 block text-[10px] uppercase">11. Nearmiss Case</span>
                <span className="text-base font-bold text-slate-900">{record.nearmiss}</span>
              </div>
              <div className="p-2 rounded bg-slate-50 border border-slate-100">
                <span className="text-slate-500 block text-[10px] uppercase">12. Property Damage</span>
                <span className="text-base font-bold text-slate-900">{record.propertyDamage}</span>
              </div>
              <div className="p-2 rounded bg-slate-50 border border-slate-100">
                <span className="text-slate-500 block text-[10px] uppercase">13. Environmental Incident</span>
                <span className="text-base font-bold text-slate-900">{record.environmentalIncident}</span>
              </div>
              <div className="p-2 rounded bg-blue-50/50 border border-blue-200">
                <span className="text-slate-600 block text-[10px] uppercase font-bold">14. LTIFR</span>
                <span className="text-base font-mono font-bold text-blue-900">{record.ltifr}</span>
              </div>
              <div className="p-2 rounded bg-blue-50/50 border border-blue-200">
                <span className="text-slate-600 block text-[10px] uppercase font-bold">15. TRIR</span>
                <span className="text-base font-mono font-bold text-blue-900">{record.trir}</span>
              </div>
              <div className="p-2 rounded bg-blue-50/50 border border-blue-200">
                <span className="text-slate-600 block text-[10px] uppercase font-bold">16. POB Laporan</span>
                <span className="text-base font-bold text-blue-900">{record.pob} orang</span>
              </div>
              <div className="p-2 rounded bg-blue-50/50 border border-blue-200">
                <span className="text-slate-600 block text-[10px] uppercase font-bold">17. Man Hours</span>
                <span className="text-base font-bold text-blue-900">{record.manHours.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>

          {/* Bagian 3: KEPATUHAN LAGGING INDICATOR */}
          <div className="border border-slate-200 rounded-lg overflow-hidden page-break-inside-avoid">
            <div className="bg-slate-100 px-4 py-2 font-bold text-slate-900 uppercase text-[11px] tracking-wider border-b border-slate-200 flex items-center justify-between">
              <span>3. KEPATUHAN LAGGING INDICATOR (Q18 - Q21)</span>
              <span className="text-slate-700 font-bold">Skor: {record.laggingScore}/100</span>
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center justify-between p-2.5 rounded bg-slate-50 border border-slate-200">
                <div>
                  <span className="font-semibold text-slate-900 block">18. Fatality</span>
                  <span className="text-[11px] text-slate-500">Target = Tidak ada insiden</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                  record.fatalityCompliance === 'Comply' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {record.fatalityCompliance}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded bg-slate-50 border border-slate-200">
                <div>
                  <span className="font-semibold text-slate-900 block">19. Lost Time Incident (LTI)</span>
                  <span className="text-[11px] text-slate-500">Target = Tidak ada insiden</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                  record.ltiCompliance === 'Comply' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {record.ltiCompliance}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded bg-slate-50 border border-slate-200">
                <div>
                  <span className="font-semibold text-slate-900 block">20. LTIFR</span>
                  <span className="text-[11px] text-slate-500">Target = LTIFR &lt; 1</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                  record.ltifrCompliance === 'Comply' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {record.ltifrCompliance}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded bg-slate-50 border border-slate-200">
                <div>
                  <span className="font-semibold text-slate-900 block">21. TRIR</span>
                  <span className="text-[11px] text-slate-500">Target = TRIR &lt; 0.09</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                  record.trirCompliance === 'Comply' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {record.trirCompliance}
                </span>
              </div>
            </div>
          </div>

          {/* Bagian 4: LEADING INDICATOR (Q22 - Q39) */}
          <div className="border border-slate-200 rounded-lg overflow-hidden page-break-inside-avoid">
            <div className="bg-slate-100 px-4 py-2 font-bold text-slate-900 uppercase text-[11px] tracking-wider border-b border-slate-200 flex items-center justify-between">
              <span>4. LEADING INDICATOR PROGRAM (Q22 - Q39)</span>
              <span className="text-slate-700 font-bold">Skor: {record.leadingScore}/100</span>
            </div>
            
            <div className="p-4 space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { q: 22, title: 'HSE Meeting (Target 100% Hadir)', val: record.hseMeeting },
                  { q: 23, title: 'HSE Reporting (Target 100% Dilaporkan)', val: record.hseReporting },
                  { q: 24, title: 'Toolbox Meeting (Target 100% Pelaksanaan)', val: record.toolboxMeeting },
                  { q: 25, title: 'MWT Manager Level (Target 100%)', val: record.mwt },
                  { q: 26, title: 'Tindakan Penutupan Temuan (100% Ditutup)', val: record.closureFindings },
                  { q: 27, title: 'Kepatuhan Inspeksi & Color Code Valid', val: record.inspectionCompliance },
                  { q: 28, title: 'Kepatuhan APD (100% Patuh)', val: record.ppeCompliance },
                  { q: 29, title: 'Manajemen Tata Graha (Housekeeping)', val: record.housekeepingCompliance },
                  { q: 30, title: 'Koordinator Sertifikat AK3 Umum', val: record.ak3Certification },
                  { q: 31, title: `Safetyman: ${record.safetyOfficerCount} orang (Rasio 1:25)`, val: record.safetyOfficerRatioMet },
                ].map(item => (
                  <div key={item.q} className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-100">
                    <span className="text-slate-700 text-[11px] font-medium">{item.q}. {item.title}</span>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      item.val === 'Memenuhi' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {item.val}
                    </span>
                  </div>
                ))}
              </div>

              {/* Tier Items (Q32 - Q39) */}
              <div className="pt-2 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { q: 32, title: 'Pemeriksaan Kesehatan (MCU)', val: record.healthCheck },
                  { q: 33, title: 'Penyediaan BPJS Kesehatan & TK', val: record.bpjs },
                  { q: 34, title: 'Pemeriksaan Harian (DCU)', val: record.dcu },
                  { q: 35, title: 'Sosialisasi PJSM / JSA', val: record.pjsmJsa },
                  { q: 36, title: 'Tanggap Darurat / Tim Emergency', val: record.emergencyManagement },
                  { q: 37, title: 'Matriks & Rencana Pelatihan', val: record.trainingMatrix },
                  { q: 38, title: 'Pelatihan Wajib & Khusus PT KPI RU-V', val: record.mandatoryTraining },
                  { q: 39, title: 'HSE Plan Disetujui RU-V (>80%)', val: record.approvedHsePlan },
                ].map(item => (
                  <div key={item.q} className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-100">
                    <span className="text-slate-700 text-[11px] font-medium">{item.q}. {item.title}</span>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      item.val === 'Baik' ? 'bg-emerald-100 text-emerald-800' :
                      item.val === 'Diterima' ? 'bg-blue-100 text-blue-800' :
                      'bg-rose-100 text-rose-800'
                    }`}>
                      {item.val}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bagian 5: Evidensi & Catatan Evaluator */}
          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 space-y-3 page-break-inside-avoid">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="font-bold text-slate-900 text-xs">
                40. Tautan Semua Bukti yang Diperlukan:
              </span>
              {record.evidenceLink && (
                <a
                  href={record.evidenceLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-blue-700 hover:underline break-all"
                >
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate max-w-xs">{record.evidenceLink}</span>
                </a>
              )}
            </div>

            {record.evaluatorNotes && (
              <div className="p-3 bg-white border border-slate-200 rounded">
                <span className="text-[11px] font-bold text-slate-700 block mb-1">Catatan &amp; Rekomendasi Evaluator HSE RU-V:</span>
                <p className="text-xs text-slate-800 italic">"{record.evaluatorNotes}"</p>
              </div>
            )}
          </div>

          {/* OFFICIAL SIGN-OFF BLOCK (Visible in Print & Screen) */}
          <div className="border border-slate-300 rounded-lg p-4 bg-white space-y-4 page-break-inside-avoid">
            <div className="text-[11px] uppercase font-bold tracking-wider text-slate-700 text-center border-b border-slate-200 pb-2">
              LEMBAR PENGESAHAN HASIL EVALUASI K3LL (CSMS PT KPI RU-V)
            </div>
            
            <div className="grid grid-cols-2 gap-8 text-center text-xs">
              {/* Disiapkan oleh */}
              <div className="space-y-12">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Disiapkan Oleh (Subkontraktor):</span>
                  <span className="font-bold text-slate-800">HSE Officer / Coordinator</span>
                </div>
                <div className="border-t border-slate-400 mx-auto w-48 pt-1">
                  <div className="font-bold text-slate-900">{record.hseOfficerName}</div>
                  <div className="text-[10px] text-slate-500">{record.companyName}</div>
                </div>
              </div>

              {/* Diverifikasi & Disetujui oleh */}
              <div className="space-y-12">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Diverifikasi &amp; Disetujui Oleh:</span>
                  <span className="font-bold text-slate-800">Evaluator HSSE PT KPI RU-V</span>
                </div>
                <div className="border-t border-slate-400 mx-auto w-48 pt-1">
                  <div className="font-bold text-slate-900">{record.verifiedBy || 'Agung Prasetyo'}</div>
                  <div className="text-[10px] text-slate-500">Refinery Unit V Balikpapan</div>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
              <span>Sistem Manajemen Keselamatan Kilang (CSMS) · RU-V Balikpapan</span>
              <span>Dicetak otomatis melalui Subcontractor HSE KPI System</span>
            </div>
          </div>

        </div>

        {/* Modal Footer (Screen only) */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between print:hidden">
          <button
            onClick={onClose}
            className="text-xs font-medium text-slate-700 hover:text-slate-900 px-4 py-2 border border-slate-300 rounded-md bg-white hover:bg-slate-50 transition-colors"
          >
            Tutup
          </button>
          
          {/* Main Print Summary Button */}
          <button
            onClick={handlePrintSummary}
            className="inline-flex items-center gap-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded-md shadow-xs transition-colors"
            title="Print Summary: Cetak Laporan PDF Resmi Kinerja HSE Kontraktor"
          >
            <Printer className="w-4 h-4" />
            <span>Print Summary (PDF)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
