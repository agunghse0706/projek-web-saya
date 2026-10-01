import React, { useMemo } from 'react';
import { HSEAssessmentRecord, WORK_LOCATIONS } from '../types/hse';
import { identifyRiskAlerts } from '../utils/riskAlert';
import { 
  BarChart3, 
  Flame, 
  ShieldAlert, 
  CheckCircle, 
  AlertTriangle, 
  TrendingUp, 
  Activity, 
  FileCheck2,
  HardHat,
  HeartPulse,
  TrendingDown
} from 'lucide-react';

interface AnalyticsViewProps {
  assessments: HSEAssessmentRecord[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ assessments }) => {
  // Aggregate data
  const total = assessments.length;

  const riskAlerts = useMemo(() => {
    return identifyRiskAlerts(assessments);
  }, [assessments]);

  const incidents = useMemo(() => {
    let fatality = 0;
    let lti = 0;
    let rwdc = 0;
    let mtc = 0;
    let fac = 0;
    let nearmiss = 0;
    let propertyDamage = 0;
    let envIncident = 0;

    assessments.forEach(a => {
      fatality += a.fatality;
      lti += a.lti;
      rwdc += a.rwdc;
      mtc += a.mtc;
      fac += a.fac;
      nearmiss += a.nearmiss;
      propertyDamage += a.propertyDamage;
      envIncident += a.environmentalIncident;
    });

    return {
      fatality,
      lti,
      rwdc,
      mtc,
      fac,
      nearmiss,
      propertyDamage,
      envIncident,
      recordableTotal: fatality + lti + rwdc + mtc,
    };
  }, [assessments]);

  // Leading indicator compliance gaps
  const gaps = useMemo(() => {
    if (total === 0) return [];

    const list = [
      { name: 'Toolbox Meeting (Q24)', met: assessments.filter(a => a.toolboxMeeting === 'Memenuhi').length },
      { name: 'HSE Meeting (Q22)', met: assessments.filter(a => a.hseMeeting === 'Memenuhi').length },
      { name: 'HSE Reporting (Q23)', met: assessments.filter(a => a.hseReporting === 'Memenuhi').length },
      { name: 'MWT Manager Level (Q25)', met: assessments.filter(a => a.mwt === 'Memenuhi').length },
      { name: 'Penutupan Temuan Safety (Q26)', met: assessments.filter(a => a.closureFindings === 'Memenuhi').length },
      { name: 'Inspeksi & Color Code Valid (Q27)', met: assessments.filter(a => a.inspectionCompliance === 'Memenuhi').length },
      { name: 'Kepatuhan APD (Q28)', met: assessments.filter(a => a.ppeCompliance === 'Memenuhi').length },
      { name: 'Good Housekeeping (Q29)', met: assessments.filter(a => a.housekeepingCompliance === 'Memenuhi').length },
      { name: 'Sertifikasi AK3 Umum (Q30)', met: assessments.filter(a => a.ak3Certification === 'Memenuhi').length },
      { name: 'Rasio Safetyman 1:25 (Q31)', met: assessments.filter(a => a.safetyOfficerRatioMet === 'Memenuhi').length },
      { name: 'Pemeriksaan Kesehatan MCU (Q32)', met: assessments.filter(a => a.healthCheck === 'Baik').length },
      { name: 'Jaminan BPJS TK & Kes (Q33)', met: assessments.filter(a => a.bpjs === 'Baik').length },
      { name: 'Daily Check Up (DCU) (Q34)', met: assessments.filter(a => a.dcu === 'Baik').length },
      { name: 'Sosialisasi PJSM/JSA (Q35)', met: assessments.filter(a => a.pjsmJsa === 'Baik').length },
      { name: 'Emergency Drill & ERP (Q36)', met: assessments.filter(a => a.emergencyManagement === 'Baik').length },
      { name: 'Matriks Pelatihan K3LL (Q37)', met: assessments.filter(a => a.trainingMatrix === 'Baik').length },
      { name: 'Pelatihan Wajib KPI RU-V (Q38)', met: assessments.filter(a => a.mandatoryTraining === 'Baik').length },
      { name: 'HSE Plan Disetujui RU-V (Q39)', met: assessments.filter(a => a.approvedHsePlan === 'Baik').length },
    ];

    return list.map(item => ({
      ...item,
      percentage: Math.round((item.met / total) * 100),
      gap: total - item.met,
    })).sort((a, b) => a.percentage - b.percentage); // lowest compliance first
  }, [assessments, total]);

  // Quadrant classification
  const quadrants = useMemo(() => {
    const leader: HSEAssessmentRecord[] = [];
    const atRisk: HSEAssessmentRecord[] = [];
    const recovery: HSEAssessmentRecord[] = [];
    const critical: HSEAssessmentRecord[] = [];

    assessments.forEach(a => {
      const highLead = a.leadingScore >= 80;
      const highLag = a.laggingScore >= 80 && a.fatality === 0 && a.lti === 0;

      if (highLead && highLag) leader.push(a);
      else if (!highLead && highLag) atRisk.push(a);
      else if (highLead && !highLag) recovery.push(a);
      else critical.push(a);
    });

    return { leader, atRisk, recovery, critical };
  }, [assessments]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-wider font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded">
            CSMS Safety Analytics
          </span>
          <span className="text-slate-300">·</span>
          <span className="text-xs text-slate-500 font-medium">Kilang Minyak Balikpapan</span>
        </div>
        <h2 className="text-xl font-bold text-slate-900 mt-1">
          Analisis Risiko & Matriks Evaluasi K3LL Subkontraktor
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Identifikasi gap kepatuhan leading indicator, piramida kecelakaan kerja, dan matriks resiko rekanan kilang.
        </p>
      </div>

      {/* Risk Alert Analytics Section */}
      {riskAlerts.length > 0 && (
        <div className="bg-white border-2 border-rose-200 rounded-lg p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-rose-100 pb-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-600 animate-pulse" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Monitoring Deteksi Dini: Tren Penurunan Skor K3LL &gt; 15%
                </h3>
                <p className="text-xs text-slate-500">
                  Daftar kontraktor yang mengalami kemunduran performa signifikan antar periode asesmen
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded">
              {riskAlerts.length} Kontraktor Terdeteksi
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {riskAlerts.map(alert => (
              <div key={alert.currentRecord.id} className="p-3 bg-rose-50/50 rounded-lg border border-rose-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">{alert.companyName} ({alert.workLocation})</span>
                  <span className="text-xs font-black text-rose-700 bg-rose-100 px-2 py-0.5 rounded border border-rose-300">
                    ↓ -{alert.scoreDrop}% Drop
                  </span>
                </div>
                <div className="text-xs text-slate-700 flex items-center justify-between bg-white p-2 rounded border border-rose-100">
                  <span>{alert.previousPeriod}: <strong className="text-blue-700">{alert.previousScore}%</strong></span>
                  <span className="text-rose-500 font-bold">➔</span>
                  <span>{alert.currentPeriod}: <strong className="text-rose-700">{alert.currentScore}%</strong></span>
                </div>
                <div className="text-[11px] text-slate-600">
                  <span className="font-semibold text-rose-900">Pemicu: </span>
                  {alert.reasons.join(', ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Section: Accident Pyramid Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Deep Accident Pyramid */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-500" />
                <span>Piramida Heinrich / Frank Bird (Kilang RU-V)</span>
              </h3>
              <p className="text-xs text-slate-500">
                Hubungan teoritis antara nearmiss dan insiden berat di area kilang
              </p>
            </div>
            <span className="text-xs text-slate-400 font-mono">Q6 - Q13</span>
          </div>

          <div className="space-y-2 py-2">
            <div className="p-3 bg-rose-950 text-white rounded text-center">
              <div className="text-[10px] text-rose-300 uppercase font-bold tracking-wider">1 FATALITY (Target 0)</div>
              <div className="text-2xl font-black text-rose-400">{incidents.fatality} Kasus</div>
              <div className="text-[11px] text-rose-200 mt-0.5">Kejadian fatalitas akibat kecelakaan kerja</div>
            </div>

            <div className="p-3 bg-amber-900 text-white rounded text-center">
              <div className="text-[10px] text-amber-200 uppercase font-bold tracking-wider">10 SERIOUS ACCIDENTS (LTI & RWDC)</div>
              <div className="text-xl font-black text-amber-300">{incidents.lti + incidents.rwdc} Kasus</div>
              <div className="text-[11px] text-amber-100 mt-0.5">LTI: {incidents.lti} · RWDC: {incidents.rwdc}</div>
            </div>

            <div className="p-3 bg-slate-800 text-white rounded text-center">
              <div className="text-[10px] text-slate-300 uppercase font-bold tracking-wider">30 MINOR INJURIES (MTC & FAC)</div>
              <div className="text-lg font-black text-slate-100">{incidents.mtc + incidents.fac} Kasus</div>
              <div className="text-[11px] text-slate-300 mt-0.5">Medical Treatment: {incidents.mtc} · First Aid (P3K): {incidents.fac}</div>
            </div>

            <div className="p-3.5 bg-emerald-700 text-white rounded text-center">
              <div className="text-[10px] text-emerald-200 uppercase font-bold tracking-wider">600 NEARMISS / PROACTIVE OBSERVATIONS</div>
              <div className="text-2xl font-black text-white">{incidents.nearmiss} Laporan</div>
              <div className="text-[11px] text-emerald-100 mt-0.5">
                Semakin banyak nearmiss dilaporkan, semakin rendah kemungkinan terjadinya insiden fatal.
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs text-slate-600">
            <strong>Catatan K3LL:</strong> Rekor YTD menunjukkan {incidents.recordableTotal} total insiden tercatat (Recordable Cases) dengan {incidents.propertyDamage} kasus kerusakan aset dan {incidents.envIncident} insiden lingkungan.
          </div>
        </div>

        {/* Right: Gap Analysis / Lowest Compliance Leading Indicators */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                <span>Analisis Gap Kepatuhan K3LL (Prioritas Perbaikan)</span>
              </h3>
              <p className="text-xs text-slate-500">
                Elemen penilaian dengan tingkat pemenuhan terendah di kalangan subkontraktor
              </p>
            </div>
            <span className="text-xs text-slate-400 font-mono">Prioritas Temuan</span>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[380px] pr-1">
            {gaps.map((item, idx) => (
              <div key={idx} className="p-2.5 rounded border border-slate-100 bg-slate-50/70 space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800">{item.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500 font-mono">
                      {item.gap} kontraktor belum memenuhi
                    </span>
                    <span className={`font-bold text-xs ${
                      item.percentage >= 80 ? 'text-emerald-700' :
                      item.percentage >= 60 ? 'text-amber-700' : 'text-rose-700'
                    }`}>
                      {item.percentage}%
                    </span>
                  </div>
                </div>

                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${
                      item.percentage >= 80 ? 'bg-emerald-500' :
                      item.percentage >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quadrant Matrix: Leading vs Lagging */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-600" />
            <span>Matriks Kuadran Kinerja HSE Subkontraktor (Leading vs Lagging)</span>
          </h3>
          <p className="text-xs text-slate-500">
            Pemetaan rekanan untuk menentukan strategi pembinaan, reward, atau peringatan CSMS.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Quadrant 1: Leaders */}
          <div className="p-4 rounded-lg border border-emerald-200 bg-emerald-50/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-900 uppercase tracking-wide">
                Kuadran 1: Pemimpin K3LL (High Leading + High Lagging)
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-200 text-emerald-900">
                {quadrants.leader.length} Kontraktor
              </span>
            </div>
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              Budaya proaktif tinggi dan zero incident. Berikan apresiasi HSE Award & prioritas rekomendasi CSMS RU-V.
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {quadrants.leader.map(c => (
                <span key={c.id} className="text-[11px] font-medium text-slate-800 bg-white border border-emerald-200 px-2 py-0.5 rounded">
                  {c.companyName} ({c.calculatedScore}%)
                </span>
              ))}
            </div>
          </div>

          {/* Quadrant 2: At Risk */}
          <div className="p-4 rounded-lg border border-amber-200 bg-amber-50/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                Kuadran 2: Berisiko Tinggi (Low Leading + High Lagging)
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-200 text-amber-900">
                {quadrants.atRisk.length} Kontraktor
              </span>
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              Belum ada insiden berat namun kepatuhan program proaktif (TBM, DCU, APD) rendah. Risiko kecelakaan sewaktu-waktu.
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {quadrants.atRisk.length === 0 ? (
                <span className="text-[11px] text-slate-400 italic">Nihil pada periode ini.</span>
              ) : (
                quadrants.atRisk.map(c => (
                  <span key={c.id} className="text-[11px] font-medium text-slate-800 bg-white border border-amber-200 px-2 py-0.5 rounded">
                    {c.companyName} ({c.calculatedScore}%)
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Quadrant 3: Recovery */}
          <div className="p-4 rounded-lg border border-blue-200 bg-blue-50/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-900 uppercase tracking-wide">
                Kuadran 3: Pemulihan Pasca-Insiden (High Leading + Low Lagging)
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-200 text-blue-900">
                {quadrants.recovery.length} Kontraktor
              </span>
            </div>
            <p className="text-[11px] text-blue-800 leading-relaxed">
              Memiliki program safety aktif namun sempat mengalami insiden minor (MTC/RWDC). Wajib evaluasi JSA dan investigasi RCA.
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {quadrants.recovery.length === 0 ? (
                <span className="text-[11px] text-slate-400 italic">Nihil pada periode ini.</span>
              ) : (
                quadrants.recovery.map(c => (
                  <span key={c.id} className="text-[11px] font-medium text-slate-800 bg-white border border-blue-200 px-2 py-0.5 rounded">
                    {c.companyName} ({c.calculatedScore}%)
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Quadrant 4: Critical */}
          <div className="p-4 rounded-lg border border-rose-200 bg-rose-50/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-900 uppercase tracking-wide">
                Kuadran 4: Kritis / Pembinaan Khusus (Low Leading + Low Lagging)
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-200 text-rose-900">
                {quadrants.critical.length} Kontraktor
              </span>
            </div>
            <p className="text-[11px] text-rose-800 leading-relaxed">
              Pelanggaran berulang, ketidakpatuhan leading, atau insiden recordable tinggi. Wajib Safety Stand-down dan sanksi CSMS.
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {quadrants.critical.map(c => (
                <span key={c.id} className="text-[11px] font-medium text-slate-800 bg-white border border-rose-200 px-2 py-0.5 rounded">
                  {c.companyName} ({c.calculatedScore}%)
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
