import React, { useState, useMemo } from 'react';
import { 
  HSEAssessmentRecord, 
  WORK_LOCATIONS, 
  REPORT_PERIODS, 
  WorkLocation 
} from '../types/hse';
import { identifyRiskAlerts, getRecordRiskDrop, ContractorRiskAlert } from '../utils/riskAlert';
import { 
  ShieldCheck, 
  AlertTriangle, 
  Clock, 
  Users, 
  Award, 
  Search, 
  Filter, 
  Eye, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Activity, 
  TrendingUp, 
  Flame, 
  ArrowUpDown, 
  TrendingDown, 
  ShieldAlert, 
  ArrowDownRight, 
  Info,
  Trophy,
  Medal,
  Star,
  Sparkles
} from 'lucide-react';

export type ComplianceStatusType = 'Exceeds' | 'Meets' | 'Needs Improvement';

export function getComplianceStatus(score: number): {
  status: ComplianceStatusType;
  label: string;
  badgeClass: string;
  dotColor: string;
} {
  if (score > 90) {
    return {
      status: 'Exceeds',
      label: 'Exceeds',
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-1 ring-emerald-400/30',
      dotColor: 'bg-emerald-500',
    };
  } else if (score >= 70) {
    return {
      status: 'Meets',
      label: 'Meets',
      badgeClass: 'bg-blue-50 text-blue-800 border-blue-300 ring-1 ring-blue-400/30',
      dotColor: 'bg-blue-500',
    };
  } else {
    return {
      status: 'Needs Improvement',
      label: 'Needs Improvement',
      badgeClass: 'bg-amber-50 text-amber-900 border-amber-300 ring-1 ring-amber-400/30',
      dotColor: 'bg-amber-500',
    };
  }
}

interface DashboardViewProps {
  assessments: HSEAssessmentRecord[];
  onViewDetail: (record: HSEAssessmentRecord) => void;
  onNewAssessment: () => void;
  onDeleteRecord?: (id: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  assessments,
  onViewDetail,
  onNewAssessment,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('Semua');
  const [selectedLocation, setSelectedLocation] = useState<string>('Semua');
  const [selectedGrade, setSelectedGrade] = useState<string>('Semua');
  const [selectedCompliance, setSelectedCompliance] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [onlyRiskAlerts, setOnlyRiskAlerts] = useState<boolean>(false);
  const [sortField, setSortField] = useState<'calculatedScore' | 'manHours' | 'companyName'>('calculatedScore');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // Compute all Risk Alerts across the dataset
  const allRiskAlerts = useMemo(() => {
    return identifyRiskAlerts(assessments, selectedPeriod);
  }, [assessments, selectedPeriod]);

  // Set of record IDs that have risk alerts
  const riskAlertRecordIds = useMemo(() => {
    return new Set(allRiskAlerts.map(a => a.currentRecord.id));
  }, [allRiskAlerts]);

  // Top 5 Performers based on latest average HSE KPI scores
  const topPerformers = useMemo(() => {
    const companyMap = new Map<string, HSEAssessmentRecord[]>();

    assessments.forEach(rec => {
      const key = rec.companyName.trim().toLowerCase();
      if (!companyMap.has(key)) {
        companyMap.set(key, []);
      }
      companyMap.get(key)!.push(rec);
    });

    const list: {
      companyName: string;
      workLocation: string;
      averageScore: number;
      latestScore: number;
      latestPeriod: string;
      latestRecord: HSEAssessmentRecord;
      totalAssessments: number;
      totalManHours: number;
      grade: 'A' | 'B' | 'C' | 'D';
      isZeroAccident: boolean;
      pob: number;
    }[] = [];

    companyMap.forEach((records) => {
      if (records.length === 0) return;

      const sorted = [...records].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      const latest = sorted[sorted.length - 1];

      const totalHours = records.reduce((acc, r) => acc + r.manHours, 0);
      const avgScore = Math.round(
        records.reduce((acc, r) => acc + r.calculatedScore, 0) / records.length
      );
      const isZeroAccident = records.every(r => r.fatality === 0 && r.lti === 0);

      list.push({
        companyName: latest.companyName,
        workLocation: latest.workLocation,
        averageScore: avgScore,
        latestScore: latest.calculatedScore,
        latestPeriod: latest.reportPeriod,
        latestRecord: latest,
        totalAssessments: records.length,
        totalManHours: totalHours,
        grade: latest.grade,
        isZeroAccident,
        pob: latest.pob,
      });
    });

    // Rank descending by averageScore, tie-break on latestScore & totalManHours
    list.sort((a, b) => {
      if (b.averageScore !== a.averageScore) {
        return b.averageScore - a.averageScore;
      }
      if (b.latestScore !== a.latestScore) {
        return b.latestScore - a.latestScore;
      }
      return b.totalManHours - a.totalManHours;
    });

    return list.slice(0, 5).map((item, index) => ({
      ...item,
      rank: index + 1,
    }));
  }, [assessments]);

  // Filtered dataset
  const filteredData = useMemo(() => {
    return assessments.filter(item => {
      const matchPeriod = selectedPeriod === 'Semua' || item.reportPeriod === selectedPeriod;
      const matchLocation = selectedLocation === 'Semua' || item.workLocation === selectedLocation;
      const matchGrade = selectedGrade === 'Semua' || item.grade === selectedGrade;
      const matchCompliance = selectedCompliance === 'Semua' || getComplianceStatus(item.calculatedScore).status === selectedCompliance;
      const matchRisk = !onlyRiskAlerts || riskAlertRecordIds.has(item.id);
      const matchSearch = 
        item.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.hseOfficerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.workLocation.toLowerCase().includes(searchQuery.toLowerCase());

      return matchPeriod && matchLocation && matchGrade && matchCompliance && matchRisk && matchSearch;
    }).sort((a, b) => {
      let comparison = 0;
      if (sortField === 'calculatedScore') {
        comparison = a.calculatedScore - b.calculatedScore;
      } else if (sortField === 'manHours') {
        comparison = a.manHours - b.manHours;
      } else {
        comparison = a.companyName.localeCompare(b.companyName);
      }
      return sortAsc ? comparison : -comparison;
    });
  }, [assessments, selectedPeriod, selectedLocation, selectedGrade, selectedCompliance, onlyRiskAlerts, riskAlertRecordIds, searchQuery, sortField, sortAsc]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const total = filteredData.length;
    if (total === 0) {
      return {
        totalContractors: 0,
        totalManHours: 0,
        totalPOB: 0,
        totalFatality: 0,
        totalLTI: 0,
        totalRWDC: 0,
        totalMTC: 0,
        totalFAC: 0,
        totalNearmiss: 0,
        totalPropertyDamage: 0,
        totalEnvironmentalIncident: 0,
        avgScore: 0,
        avgLTIFR: 0,
        avgTRIR: 0,
        gradeCounts: { A: 0, B: 0, C: 0, D: 0 },
        leadingComplianceAvg: 0,
      };
    }

    let manHours = 0;
    let pob = 0;
    let fatality = 0;
    let lti = 0;
    let rwdc = 0;
    let mtc = 0;
    let fac = 0;
    let nearmiss = 0;
    let propertyDamage = 0;
    let environmentalIncident = 0;
    let scoreSum = 0;
    let leadingSum = 0;
    let ltifrSum = 0;
    let trirSum = 0;
    const grades = { A: 0, B: 0, C: 0, D: 0 };

    filteredData.forEach(d => {
      manHours += d.manHours;
      pob += d.pob;
      fatality += d.fatality;
      lti += d.lti;
      rwdc += d.rwdc;
      mtc += d.mtc;
      fac += d.fac;
      nearmiss += d.nearmiss;
      propertyDamage += d.propertyDamage;
      environmentalIncident += d.environmentalIncident;
      scoreSum += d.calculatedScore;
      leadingSum += d.leadingScore;
      ltifrSum += d.ltifr;
      trirSum += d.trir;
      grades[d.grade] = (grades[d.grade] || 0) + 1;
    });

    return {
      totalContractors: total,
      totalManHours: manHours,
      totalPOB: pob,
      totalFatality: fatality,
      totalLTI: lti,
      totalRWDC: rwdc,
      totalMTC: mtc,
      totalFAC: fac,
      totalNearmiss: nearmiss,
      totalPropertyDamage: propertyDamage,
      totalEnvironmentalIncident: environmentalIncident,
      avgScore: Math.round(scoreSum / total),
      avgLTIFR: Number((ltifrSum / total).toFixed(2)),
      avgTRIR: Number((trirSum / total).toFixed(3)),
      gradeCounts: grades,
      leadingComplianceAvg: Math.round(leadingSum / total),
    };
  }, [filteredData]);

  // Leading indicator compliance statistics
  const leadingComplianceStats = useMemo(() => {
    if (filteredData.length === 0) return [];

    const total = filteredData.length;
    const checkMetric = (
      label: string, 
      predicate: (item: HSEAssessmentRecord) => boolean, 
      target: string
    ) => {
      const compliantCount = filteredData.filter(predicate).length;
      return {
        label,
        rate: Math.round((compliantCount / total) * 100),
        count: compliantCount,
        total,
        target
      };
    };

    return [
      checkMetric('Toolbox Meeting (TBM)', d => d.toolboxMeeting === 'Memenuhi', '100%'),
      checkMetric('Daily Check Up (DCU)', d => d.dcu === 'Baik' || d.dcu === 'Diterima', '>90%'),
      checkMetric('Kepatuhan APD (PPE)', d => d.ppeCompliance === 'Memenuhi', '100%'),
      checkMetric('Inspeksi & Color Code', d => d.inspectionCompliance === 'Memenuhi', '100%'),
      checkMetric('HSE Meeting Koordinasi', d => d.hseMeeting === 'Memenuhi', '100%'),
      checkMetric('Pelaporan Insiden/Nearmiss', d => d.hseReporting === 'Memenuhi', '100%'),
      checkMetric('MWT Tingkat Manager', d => d.mwt === 'Memenuhi', '100%'),
      checkMetric('Penutupan Temuan Safety', d => d.closureFindings === 'Memenuhi', '100%'),
      checkMetric('Good Housekeeping', d => d.housekeepingCompliance === 'Memenuhi', '100%'),
      checkMetric('Rasio Safetyman (1:25)', d => d.safetyOfficerRatioMet === 'Memenuhi', '1:25 POB'),
      checkMetric('Jaminan BPJS Ketenagakerjaan', d => d.bpjs === 'Baik', '>90%'),
      checkMetric('HSE Plan Disetujui PT KPI', d => d.approvedHsePlan === 'Baik', '>80%'),
    ];
  }, [filteredData]);

  // Area stats breakdown
  const areaBreakdown = useMemo(() => {
    return WORK_LOCATIONS.map(loc => {
      const records = filteredData.filter(d => d.workLocation === loc);
      const hours = records.reduce((acc, c) => acc + c.manHours, 0);
      const incidents = records.reduce((acc, c) => acc + c.fatality + c.lti + c.rwdc + c.mtc, 0);
      const avgSc = records.length ? Math.round(records.reduce((acc, c) => acc + c.calculatedScore, 0) / records.length) : 0;
      return {
        location: loc,
        count: records.length,
        hours,
        incidents,
        avgScore: avgSc,
      };
    });
  }, [filteredData]);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner / Refinery Status */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded">
                Refinery Unit V Balikpapan
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-xs text-slate-500 font-medium">HSE CSMS Monitoring System</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
              Dashboard Kinerja HSE Kontraktor & Subkontraktor
            </h2>
            <p className="text-sm text-slate-600 mt-0.5">
              Matriks pemantauan Lagging & Leading Indicator berdasarkan standar 40 butir penilaian K3LL PT KPI RU-V.
            </p>
          </div>

          {/* Quick Zero Accident Banner */}
          <div className="flex items-center gap-3 bg-slate-900 text-white px-4 py-3 rounded-lg border border-slate-800 shrink-0">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-400 font-medium">Status Kilang Balikpapan</div>
              <div className="text-base font-bold text-white flex items-center gap-2">
                <span>{metrics.totalFatality === 0 && metrics.totalLTI === 0 ? 'ZERO ACCIDENT' : 'ACCIDENT REPORTED'}</span>
                {metrics.totalFatality === 0 && metrics.totalLTI === 0 && (
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                )}
              </div>
              <div className="text-xs text-slate-300">
                {metrics.totalManHours.toLocaleString('id-ID')} Jam Kerja Selamat
              </div>
            </div>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mr-1">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span>Filter:</span>
            </div>

            {/* Period Selector */}
            <select
              value={selectedPeriod}
              onChange={e => setSelectedPeriod(e.target.value)}
              className="text-xs border border-slate-300 rounded-md px-2.5 py-1.5 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
            >
              <option value="Semua">Semua Periode</option>
              {REPORT_PERIODS.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>

            {/* Location Selector */}
            <select
              value={selectedLocation}
              onChange={e => setSelectedLocation(e.target.value)}
              className="text-xs border border-slate-300 rounded-md px-2.5 py-1.5 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
            >
              <option value="Semua">Semua Lokasi Kilang</option>
              {WORK_LOCATIONS.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>

            {/* Grade Selector */}
            <select
              value={selectedGrade}
              onChange={e => setSelectedGrade(e.target.value)}
              className="text-xs border border-slate-300 rounded-md px-2.5 py-1.5 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
            >
              <option value="Semua">Semua Grade Nilai</option>
              <option value="A">Grade A (≥85% - Sangat Baik)</option>
              <option value="B">Grade B (70-84% - Baik)</option>
              <option value="C">Grade C (55-69% - Perlu Pembinaan)</option>
              <option value="D">Grade D (&lt;55% - Kritis)</option>
            </select>

            {/* Compliance Status Selector */}
            <select
              value={selectedCompliance}
              onChange={e => setSelectedCompliance(e.target.value)}
              className="text-xs border border-slate-300 rounded-md px-2.5 py-1.5 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600 font-medium"
            >
              <option value="Semua">Semua Status Kepatuhan</option>
              <option value="Exceeds">Exceeds (&gt;90)</option>
              <option value="Meets">Meets (70-90)</option>
              <option value="Needs Improvement">Needs Improvement (&lt;70)</option>
            </select>

            {/* Risk Alert Quick Filter Button */}
            <button
              onClick={() => setOnlyRiskAlerts(!onlyRiskAlerts)}
              className={`text-xs px-2.5 py-1.5 rounded-md font-semibold inline-flex items-center gap-1.5 transition-all ${
                onlyRiskAlerts
                  ? 'bg-rose-700 text-white shadow-xs ring-1 ring-rose-700'
                  : allRiskAlerts.length > 0
                  ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                  : 'text-slate-400 border border-slate-200 opacity-60'
              }`}
              title="Filter kontraktor dengan penurunan skor KPI > 15% dibandingkan periode sebelumnya"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
              <span>Risk Alert &gt;15% ({allRiskAlerts.length})</span>
            </button>

            {(selectedPeriod !== 'Semua' || selectedLocation !== 'Semua' || selectedGrade !== 'Semua' || selectedCompliance !== 'Semua' || onlyRiskAlerts || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedPeriod('Semua');
                  setSelectedLocation('Semua');
                  setSelectedGrade('Semua');
                  setSelectedCompliance('Semua');
                  setOnlyRiskAlerts(false);
                  setSearchQuery('');
                }}
                className="text-xs text-blue-700 hover:text-blue-900 font-medium px-2 py-1"
              >
                Reset Filter
              </button>
            )}
          </div>

          {/* Search box */}
          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari kontraktor atau HSE officer..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-1.5 border border-slate-300 rounded-md bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>
        </div>
      </div>

      {/* KPI Headline Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Card 1: Contractors Evaluated */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Kontraktor</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{metrics.totalContractors}</div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <span>POB Total:</span>
            <span className="font-semibold text-slate-700">{metrics.totalPOB} orang</span>
          </div>
        </div>

        {/* Card 2: Safe Man Hours */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Jam Kerja Aman</span>
            <Clock className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {(metrics.totalManHours / 1000).toFixed(1)}k
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {metrics.totalManHours.toLocaleString('id-ID')} man-hours
          </div>
        </div>

        {/* Card 3: Fatality & LTI */}
        <div className={`border rounded-lg p-4 shadow-xs ${
          metrics.totalFatality > 0 || metrics.totalLTI > 0 
            ? 'bg-rose-50 border-rose-200' 
            : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Fatality / LTI</span>
            <AlertTriangle className={`w-4 h-4 ${metrics.totalFatality > 0 || metrics.totalLTI > 0 ? 'text-rose-600' : 'text-slate-400'}`} />
          </div>
          <div className={`text-2xl font-bold ${metrics.totalFatality > 0 || metrics.totalLTI > 0 ? 'text-rose-700' : 'text-slate-900'}`}>
            {metrics.totalFatality} / {metrics.totalLTI}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Target RU-V: 0 Insiden
          </div>
        </div>

        {/* Card 4: Average Score */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Rata-rata Skor</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{metrics.avgScore}%</div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
            <span className="text-emerald-700 font-medium">A: {metrics.gradeCounts.A}</span>
            <span>·</span>
            <span className="text-blue-700 font-medium">B: {metrics.gradeCounts.B}</span>
            <span>·</span>
            <span className="text-rose-700 font-medium">C/D: {metrics.gradeCounts.C + metrics.gradeCounts.D}</span>
          </div>
        </div>

        {/* Card 5: TRIR Average */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">TRIR Kilang</span>
            <Activity className="w-4 h-4 text-purple-600" />
          </div>
          <div className={`text-2xl font-bold ${metrics.avgTRIR > 0.09 ? 'text-rose-600' : 'text-slate-900'}`}>
            {metrics.avgTRIR}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Batas Target &lt; 0.09
          </div>
        </div>

        {/* Card 6: Leading Indicators Compliance */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Leading K3LL</span>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{metrics.leadingComplianceAvg}%</div>
          <div className="text-xs text-slate-500 mt-1">
            Kepatuhan Proaktif
          </div>
        </div>
      </div>

      {/* RISK ALERT BANNER: Highlights contractors with score drop > 15% */}
      {allRiskAlerts.length > 0 && (
        <div className="bg-rose-50/60 border-2 border-rose-300 rounded-lg p-5 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-rose-200 pb-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <ShieldAlert className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] uppercase font-bold tracking-wider text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                    Sistem Deteksi Dini K3LL (Early Warning)
                  </span>
                  <span className="text-slate-400">·</span>
                  <span className="text-xs font-semibold text-rose-900 font-mono">
                    Ambang Batas Penurunan &gt; 15%
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-0.5 flex items-center gap-2">
                  <span>Risk Alert: {allRiskAlerts.length} Kontraktor Mengalami Penurunan Skor K3LL Signifikan</span>
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Kontraktor di bawah ini mengalami kemerosotan skor KPI lebih dari 15% dibandingkan periode asesmen sebelumnya. Diperlukan audit investigasi & intervensi CSMS segera.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setOnlyRiskAlerts(!onlyRiskAlerts)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-all ${
                  onlyRiskAlerts
                    ? 'bg-rose-700 text-white shadow-xs'
                    : 'bg-white border border-rose-300 text-rose-700 hover:bg-rose-100'
                }`}
              >
                {onlyRiskAlerts ? '✓ Menampilkan Risk Alert di Tabel' : 'Filter Kontraktor Ini di Tabel'}
              </button>
            </div>
          </div>

          {/* Cards for each Alerted Contractor */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {allRiskAlerts.map(alert => (
              <div 
                key={alert.currentRecord.id}
                className="bg-white border border-rose-200 rounded-lg p-4 shadow-2xs hover:border-rose-400 transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-sm">{alert.companyName}</h4>
                      <span className="text-xs bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded">
                        {alert.workLocation}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Pimpinan: {alert.currentRecord.companyLeader} · HSE: {alert.currentRecord.hseOfficerName}
                    </div>
                  </div>

                  {/* Drop Badge */}
                  <div className="text-right shrink-0">
                    <span className="inline-flex items-center gap-1 text-xs font-black text-rose-700 bg-rose-100 border border-rose-300 px-2 py-1 rounded">
                      <TrendingDown className="w-3.5 h-3.5" />
                      <span>↓ {alert.scoreDrop}% Drop</span>
                    </span>
                    <div className="text-[10px] uppercase font-bold text-rose-600 mt-0.5">
                      {alert.severity === 'critical' ? 'Level: Kritis' : 'Level: Tinggi'}
                    </div>
                  </div>
                </div>

                {/* Period & Score Shift */}
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-md flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Periode Sebelumnya</span>
                    <span className="font-semibold text-slate-800">{alert.previousPeriod}: </span>
                    <strong className="text-blue-700 font-bold">{alert.previousScore}%</strong>
                  </div>
                  <div className="flex items-center gap-1 text-rose-600 font-bold px-2">
                    <span>➔</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Periode Terkini</span>
                    <span className="font-semibold text-slate-800">{alert.currentPeriod}: </span>
                    <strong className="text-rose-700 font-black">{alert.currentScore}%</strong>
                  </div>
                </div>

                {/* Root Causes / Drivers */}
                <div className="space-y-1">
                  <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                    <Info className="w-3.5 h-3.5 text-rose-600" />
                    <span>Faktor Utama Kemerosotan K3LL:</span>
                  </div>
                  <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside pl-1 bg-rose-50/40 p-2 rounded border border-rose-100">
                    {alert.reasons.map((r, idx) => (
                      <li key={idx} className="leading-tight text-[11px] text-rose-950 font-medium">{r}</li>
                    ))}
                  </ul>
                </div>

                {/* Card Actions */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-500 font-medium">
                    Tindakan: Audit Khusus CSMS RU-V
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onViewDetail(alert.currentRecord)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 px-2.5 py-1.5 rounded transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Buka Evaluasi ({alert.currentPeriod})</span>
                    </button>
                    <button
                      onClick={() => onViewDetail(alert.previousRecord)}
                      className="text-xs text-slate-600 hover:text-slate-800 underline px-1.5 py-1"
                      title="Bandingkan dengan hasil asesmen periode sebelumnya"
                    >
                      Lihat Asesmen ({alert.previousPeriod})
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Middle Grid: Incident Triangle Pyramid + Leading Indicators Monitor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Top Performers, Heinrich Incident Pyramid & Area Breakdown (5 cols) */}
        <div className="lg:col-span-5 space-y-6">

          {/* Top Performers Widget */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                  <Trophy className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <span>Top Performers K3LL</span>
                    <span className="text-[10px] text-amber-800 bg-amber-100/80 font-bold px-1.5 py-0.5 rounded">
                      Top 5 Kontraktor
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Peringkat 5 kontraktor dengan rata-rata skor HSE KPI tertinggi
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono text-slate-400">CSMS Excellence</span>
            </div>

            {/* List of Top 5 Performers */}
            <div className="space-y-2 pt-1">
              {topPerformers.map(item => (
                <div 
                  key={item.companyName}
                  className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/60 hover:bg-white hover:border-slate-300 hover:shadow-2xs transition-all flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Rank Badge */}
                    <div className={`w-7 h-7 rounded-md flex items-center justify-center font-black text-xs shrink-0 ${
                      item.rank === 1 ? 'bg-amber-400 text-amber-950 shadow-xs ring-1 ring-amber-300' :
                      item.rank === 2 ? 'bg-slate-300 text-slate-900 shadow-xs' :
                      item.rank === 3 ? 'bg-amber-700/20 text-amber-900 border border-amber-600/30' :
                      'bg-slate-200 text-slate-700'
                    }`}>
                      #{item.rank}
                    </div>

                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 truncate leading-tight flex items-center gap-1.5">
                        <span className="truncate">{item.companyName}</span>
                        {item.rank === 1 && (
                          <Star className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <span className="font-semibold text-slate-700">{item.workLocation}</span>
                        <span>·</span>
                        <span className="font-mono">{(item.totalManHours / 1000).toFixed(1)}k hrs</span>
                        <span>·</span>
                        <span className="text-emerald-700 font-medium">Zero Incident</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0 text-right">
                    <div>
                      <div className="flex items-center justify-end gap-1.5">
                        <span className="text-sm font-black text-slate-900">{item.averageScore}%</span>
                        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                          {item.grade}
                        </span>
                        {item.averageScore > 90 ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100/90 text-emerald-800 border border-emerald-300">
                            <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
                            <span>Exceeds</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100/90 text-blue-800 border border-blue-300">
                            <CheckCircle2 className="w-2.5 h-2.5 text-blue-600" />
                            <span>Meets</span>
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Terbaru: {item.latestScore}% ({item.latestPeriod})
                      </div>
                    </div>

                    <button
                      onClick={() => onViewDetail(item.latestRecord)}
                      className="p-1.5 rounded-md hover:bg-slate-200/70 text-slate-400 hover:text-blue-700 transition-colors"
                      title="Lihat Lembar Penilaian Terkini"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Standar Mutu RU-V: Grade A (&ge;85%)</span>
              </span>
              <button
                onClick={() => setSelectedGrade('A')}
                className="text-blue-700 hover:underline font-medium"
              >
                Lihat Semua Grade A &rarr;
              </button>
            </div>
          </div>

          {/* Incident Triangle */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-500" />
                  <span>Piramida Statistik Insiden (YTD)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Distribusi data insiden (Q6-Q13) sesuai laporan subkontraktor
                </p>
              </div>
              <span className="text-xs text-slate-400 font-mono">Q6-Q13</span>
            </div>

            {/* Pyramid Visual */}
            <div className="space-y-2 py-1">
              {/* Level 1: Fatality */}
              <div className="mx-auto w-1/3 bg-slate-900 text-white rounded p-2 text-center text-xs shadow-xs">
                <div className="text-slate-400 text-[10px] uppercase font-semibold">Fatality</div>
                <div className="text-base font-bold text-rose-400">{metrics.totalFatality}</div>
              </div>

              {/* Level 2: LTI */}
              <div className="mx-auto w-1/2 bg-slate-800 text-white rounded p-2 text-center text-xs shadow-xs">
                <div className="text-slate-300 text-[10px] uppercase font-semibold">Lost Time Incident (LTI)</div>
                <div className="text-base font-bold text-amber-400">{metrics.totalLTI}</div>
              </div>

              {/* Level 3: RWDC + MTC */}
              <div className="mx-auto w-3/4 bg-slate-700 text-white rounded p-2 text-center text-xs shadow-xs">
                <div className="text-slate-300 text-[10px] uppercase font-semibold">RWDC & Medical Treatment (MTC)</div>
                <div className="text-sm font-bold text-slate-100">{metrics.totalRWDC + metrics.totalMTC} Kasus</div>
                <div className="text-[10px] text-slate-400 mt-0.5">RWDC: {metrics.totalRWDC} · MTC: {metrics.totalMTC}</div>
              </div>

              {/* Level 4: First Aid Cases (FAC) */}
              <div className="mx-auto w-5/6 bg-slate-100 text-slate-800 border border-slate-200 rounded p-2 text-center text-xs">
                <div className="text-slate-500 text-[10px] uppercase font-semibold">First Aid Case (FAC)</div>
                <div className="text-base font-bold text-slate-800">{metrics.totalFAC} Kasus</div>
              </div>

              {/* Level 5: Nearmiss Case */}
              <div className="w-full bg-emerald-50 text-emerald-900 border border-emerald-200 rounded p-2.5 text-center text-xs">
                <div className="text-emerald-700 text-[10px] uppercase font-bold tracking-wide">Nearmiss (Hampir Celaka)</div>
                <div className="text-lg font-extrabold text-emerald-800">{metrics.totalNearmiss} Laporan</div>
                <div className="text-[11px] text-emerald-600 mt-0.5">
                  Tingkat pelaporan nearmiss yang tinggi mencerminkan budaya K3LL terbuka dan proaktif.
                </div>
              </div>
            </div>

            {/* Property Damage and Environmental note */}
            <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-center text-xs">
              <div className="p-2 bg-slate-50 rounded">
                <span className="text-slate-500 block text-[11px]">Property Damage:</span>
                <span className="font-semibold text-slate-800">{metrics.totalPropertyDamage} Kejadian</span>
              </div>
              <div className="p-2 bg-slate-50 rounded">
                <span className="text-slate-500 block text-[11px]">Environmental Incident:</span>
                <span className="font-semibold text-slate-800">{metrics.totalEnvironmentalIncident || 0} Kejadian</span>
              </div>
            </div>
          </div>

          {/* Area Safety Breakdown */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Distribusi Area Kilang (Q1)</h3>
                <p className="text-xs text-slate-500">Kinerja K3LL per zona operasional</p>
              </div>
              <span className="text-xs text-slate-400 font-mono">7 Lokasi</span>
            </div>

            <div className="space-y-2">
              {areaBreakdown.map(area => (
                <div 
                  key={area.location}
                  onClick={() => setSelectedLocation(area.location === selectedLocation ? 'Semua' : area.location)}
                  className={`p-2.5 rounded-md border text-xs cursor-pointer transition-all flex items-center justify-between ${
                    selectedLocation === area.location 
                      ? 'border-blue-600 bg-blue-50/60 ring-1 ring-blue-600' 
                      : 'border-slate-100 hover:border-slate-300 bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800 w-24 truncate">{area.location}</span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-500">{area.count} vendor</span>
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    <span className="text-slate-500 font-mono">{(area.hours / 1000).toFixed(1)}k hrs</span>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      area.avgScore >= 85 ? 'bg-emerald-100 text-emerald-800' :
                      area.avgScore >= 70 ? 'bg-blue-100 text-blue-800' :
                      area.avgScore >= 55 ? 'bg-amber-100 text-amber-800' :
                      'bg-rose-100 text-rose-800'
                    }`}>
                      {area.avgScore}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Leading Indicators Matrix & Target Compliance (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>Kepatuhan Leading Indicator Program K3LL (Q22 - Q39)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Persentase subkontraktor yang memenuhi target pencegahan insiden
                </p>
              </div>
              <div className="text-xs text-slate-400 font-mono">Bobot Penilaian 65%</div>
            </div>

            <div className="space-y-3.5">
              {leadingComplianceStats.map((stat, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-800">{stat.label}</span>
                      <span className="text-[11px] text-slate-400">Target: {stat.target}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-500 font-mono">
                        {stat.count}/{stat.total} vendor
                      </span>
                      <span className={`font-bold ${
                        stat.rate >= 90 ? 'text-emerald-700' :
                        stat.rate >= 75 ? 'text-blue-700' :
                        stat.rate >= 60 ? 'text-amber-700' : 'text-rose-700'
                      }`}>
                        {stat.rate}%
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        stat.rate >= 90 ? 'bg-emerald-500' :
                        stat.rate >= 75 ? 'bg-blue-600' :
                        stat.rate >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${stat.rate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Note on requirements */}
            <div className="mt-5 p-3 bg-blue-50/70 border border-blue-100 rounded-md text-xs text-blue-900 space-y-1">
              <div className="font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-700" />
                <span>Kriteria Wajib PT Kilang Pertamina Internasional RU-V:</span>
              </div>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                Koordinator HSE wajib bersertifikat AK3 Umum Kemenaker/BNSP (Q30), rasio safetyman minimal 1 orang per 25 pekerja (Q31), pemeriksaan kesehatan & DCU harian untuk pekerjaan berisiko tinggi (Q34), dan seluruh pekerja wajib terdaftar BPJS Kesehatan & Ketenagakerjaan (Q33).
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard & Assessment Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Daftar Evaluasi Kinerja K3LL Subkontraktor
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Menampilkan {filteredData.length} data asesmen berdasarkan kriteria filter aktif
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Urutkan:</span>
            <button
              onClick={() => {
                if (sortField === 'calculatedScore') {
                  setSortAsc(!sortAsc);
                } else {
                  setSortField('calculatedScore');
                  setSortAsc(false);
                }
              }}
              className={`text-xs px-2.5 py-1.5 rounded border inline-flex items-center gap-1 ${
                sortField === 'calculatedScore'
                  ? 'bg-slate-100 border-slate-300 font-semibold text-slate-800'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>Skor Total</span>
              <ArrowUpDown className="w-3 h-3" />
            </button>
            <button
              onClick={() => {
                if (sortField === 'manHours') {
                  setSortAsc(!sortAsc);
                } else {
                  setSortField('manHours');
                  setSortAsc(false);
                }
              }}
              className={`text-xs px-2.5 py-1.5 rounded border inline-flex items-center gap-1 ${
                sortField === 'manHours'
                  ? 'bg-slate-100 border-slate-300 font-semibold text-slate-800'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>Jam Kerja</span>
              <ArrowUpDown className="w-3 h-3" />
            </button>
            <button
              onClick={onNewAssessment}
              className="text-xs bg-blue-700 hover:bg-blue-800 text-white font-medium px-3 py-1.5 rounded transition-colors"
            >
              + Input Form
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Nama Perusahaan / Subkontraktor</th>
                <th className="py-3 px-3">Lokasi (Q1)</th>
                <th className="py-3 px-3">Periode (Q4)</th>
                <th className="py-3 px-3 text-right">POB / Jam Kerja</th>
                <th className="py-3 px-3 text-center">Lagging (Q18-Q21)</th>
                <th className="py-3 px-3 text-center">Insiden YTD</th>
                <th className="py-3 px-3 text-right">Skor Total</th>
                <th className="py-3 px-3 text-center">Status Kepatuhan</th>
                <th className="py-3 px-3 text-center">Grade</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-500">
                    Tidak ada data asesmen yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                filteredData.map(record => {
                  const riskDrop = getRecordRiskDrop(record, assessments);

                  return (
                    <tr 
                      key={record.id} 
                      className={`transition-colors ${
                        riskDrop.hasDrop 
                          ? 'bg-rose-50/70 hover:bg-rose-100/60 border-l-4 border-l-rose-600' 
                          : 'hover:bg-slate-50/80'
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{record.companyName}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                          <span>Pimpinan: {record.companyLeader}</span>
                          <span>·</span>
                          <span>HSE: {record.hseOfficerName}</span>
                        </div>
                        {riskDrop.hasDrop && (
                          <div className="inline-flex items-center gap-1 mt-1.5 text-[11px] font-bold text-rose-800 bg-rose-100/90 border border-rose-300 px-2 py-0.5 rounded">
                            <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                            <span>Risk Alert: Drop ↓ {riskDrop.dropAmount}% (vs {riskDrop.previousRecord?.reportPeriod}: {riskDrop.previousRecord?.calculatedScore}%)</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="font-medium text-slate-800">{record.workLocation}</span>
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap text-slate-600">
                        {record.reportPeriod}
                      </td>
                      <td className="py-3.5 px-3 text-right whitespace-nowrap">
                        <div className="font-semibold text-slate-800">{record.pob} orang</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {record.manHours.toLocaleString('id-ID')} hrs
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        {record.fatalityCompliance === 'Comply' && record.ltiCompliance === 'Comply' ? (
                          <div className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Comply</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 text-rose-700 font-semibold text-[11px]">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Non-Comply</span>
                          </div>
                        )}
                        <div className="text-[10px] text-slate-400">
                          TRIR: {record.trir}
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        {record.fatality > 0 || record.lti > 0 ? (
                          <span className="text-rose-600 font-bold">
                            {record.fatality} Fat / {record.lti} LTI
                          </span>
                        ) : record.rwdc > 0 || record.mtc > 0 ? (
                          <span className="text-amber-600 font-medium">
                            {record.rwdc + record.mtc} Recordable
                          </span>
                        ) : (
                          <span className="text-emerald-700 font-medium">0 Insiden</span>
                        )}
                        <div className="text-[10px] text-slate-400">
                          {record.nearmiss} NM · {record.fac} FAC
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <span className="text-sm font-bold text-slate-900">{record.calculatedScore}%</span>
                          {riskDrop.hasDrop && (
                            <span 
                              className="inline-flex items-center text-[10px] font-black text-rose-700 bg-rose-200/80 px-1 py-0.5 rounded"
                              title={`Turun ${riskDrop.dropAmount}% dari ${riskDrop.previousRecord?.reportPeriod}`}
                            >
                              <TrendingDown className="w-3 h-3 text-rose-600 mr-0.5" />
                              <span>-{riskDrop.dropAmount}%</span>
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Lag: {record.laggingScore} · Lead: {record.leadingScore}
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        {(() => {
                          const comp = getComplianceStatus(record.calculatedScore);
                          if (comp.status === 'Exceeds') {
                            return (
                              <span 
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs"
                                title="Skor > 90: Melampaui Standar Kepatuhan K3LL"
                              >
                                <Sparkles className="w-3 h-3 text-emerald-600 shrink-0" />
                                <span>Exceeds</span>
                              </span>
                            );
                          } else if (comp.status === 'Meets') {
                            return (
                              <span 
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-300 shadow-2xs"
                                title="Skor 70-90: Memenuhi Standar Kepatuhan K3LL"
                              >
                                <CheckCircle2 className="w-3 h-3 text-blue-600 shrink-0" />
                                <span>Meets</span>
                              </span>
                            );
                          } else {
                            return (
                              <span 
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-300 shadow-2xs"
                                title="Skor < 70: Perlu Peningkatan Performa K3LL"
                              >
                                <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                                <span>Needs Improvement</span>
                              </span>
                            );
                          }
                        })()}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded text-xs font-bold ${
                          record.grade === 'A' ? 'bg-emerald-100 text-emerald-800' :
                          record.grade === 'B' ? 'bg-blue-100 text-blue-800' :
                          record.grade === 'C' ? 'bg-amber-100 text-amber-800' :
                          'bg-rose-100 text-rose-800'
                        }`}>
                          Grade {record.grade}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => onViewDetail(record)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-slate-200 hover:border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-medium transition-colors"
                          title="Buka Lembar Penilaian Lengkap 40 Butir"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          <span>Detail & Cetak</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
