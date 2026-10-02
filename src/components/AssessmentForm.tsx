import React, { useState, useEffect } from 'react';
import { 
  HSEAssessmentRecord, 
  WORK_LOCATIONS, 
  CONTRACTOR_COMPANIES, 
  REPORT_PERIODS, 
  WorkLocation, 
  ComplianceStatus, 
  BinaryRating, 
  TierRating 
} from '../types/hse';
import { 
  calculateLTIFR, 
  calculateTRIR, 
  getRequiredSafetyman, 
  computeAssessmentScores, 
  getGradeLabel 
} from '../utils/calculator';
import { 
  CheckCircle2, 
  AlertCircle, 
  Save, 
  Sparkles, 
  HelpCircle, 
  Link as LinkIcon, 
  ShieldCheck, 
  ArrowRight, 
  ArrowLeft,
  ChevronRight,
  Info
} from 'lucide-react';

interface AssessmentFormProps {
  onSave: (record: HSEAssessmentRecord) => void;
  onCancel: () => void;
  initialData?: HSEAssessmentRecord | null;
  onOpenGoogleFormsSync?: () => void;
}

export const AssessmentForm: React.FC<AssessmentFormProps> = ({
  onSave,
  onCancel,
  initialData,
  onOpenGoogleFormsSync,
}) => {
  const [activeStep, setActiveStep] = useState<number>(1);
  const [isCustomCompany, setIsCustomCompany] = useState<boolean>(false);
  const [isCustomPeriod, setIsCustomPeriod] = useState<boolean>(false);

  // Form State initialized with defaults or initialData
  const [formData, setFormData] = useState<Partial<HSEAssessmentRecord>>(() => {
    if (initialData) return { ...initialData };
    return {
      workLocation: 'HSC',
      companyName: CONTRACTOR_COMPANIES[0],
      companyLeader: '',
      reportPeriod: REPORT_PERIODS[0],
      hseOfficerName: '',

      fatality: 0,
      lti: 0,
      rwdc: 0,
      mtc: 0,
      fac: 0,
      nearmiss: 0,
      propertyDamage: 0,
      environmentalIncident: 0,
      ltifr: 0,
      trir: 0,
      pob: 50,
      manHours: 9600,

      fatalityCompliance: 'Comply',
      ltiCompliance: 'Comply',
      ltifrCompliance: 'Comply',
      trirCompliance: 'Comply',

      hseMeeting: 'Memenuhi',
      hseReporting: 'Memenuhi',
      toolboxMeeting: 'Memenuhi',
      mwt: 'Memenuhi',
      closureFindings: 'Memenuhi',
      inspectionCompliance: 'Memenuhi',
      ppeCompliance: 'Memenuhi',
      housekeepingCompliance: 'Memenuhi',
      ak3Certification: 'Memenuhi',
      safetyOfficerCount: 2,
      safetyOfficerRatioMet: 'Memenuhi',

      healthCheck: 'Baik',
      bpjs: 'Baik',
      dcu: 'Baik',
      pjsmJsa: 'Baik',
      emergencyManagement: 'Baik',
      trainingMatrix: 'Baik',
      mandatoryTraining: 'Baik',
      approvedHsePlan: 'Baik',

      evidenceLink: 'https://',
      evaluatorNotes: '',
      verifiedBy: 'Agung Prasetyo (HSE Officer RU-V)',
    };
  });

  // Automatically recalculate LTIFR and TRIR when inputs change
  useEffect(() => {
    const lti = Number(formData.lti) || 0;
    const fatality = Number(formData.fatality) || 0;
    const rwdc = Number(formData.rwdc) || 0;
    const mtc = Number(formData.mtc) || 0;
    const manHours = Number(formData.manHours) || 0;
    const pob = Number(formData.pob) || 0;
    const safetymen = Number(formData.safetyOfficerCount) || 0;

    const computedLTIFR = calculateLTIFR(lti, manHours);
    const computedTRIR = calculateTRIR(fatality + lti + rwdc + mtc, manHours);

    const requiredSafety = getRequiredSafetyman(pob);
    const isRatioMet: BinaryRating = safetymen >= requiredSafety ? 'Memenuhi' : 'Tidak Memenuhi';

    // Auto set lagging compliance recommendations
    const fatComp: ComplianceStatus = fatality === 0 ? 'Comply' : 'Non Comply';
    const ltiComp: ComplianceStatus = lti === 0 ? 'Comply' : 'Non Comply';
    const ltifrComp: ComplianceStatus = computedLTIFR < 1 ? 'Comply' : 'Non Comply';
    const trirComp: ComplianceStatus = computedTRIR < 0.09 ? 'Comply' : 'Non Comply';

    setFormData(prev => ({
      ...prev,
      ltifr: computedLTIFR,
      trir: computedTRIR,
      safetyOfficerRatioMet: isRatioMet,
      fatalityCompliance: fatComp,
      ltiCompliance: ltiComp,
      ltifrCompliance: ltifrComp,
      trirCompliance: trirComp,
    }));
  }, [
    formData.fatality,
    formData.lti,
    formData.rwdc,
    formData.mtc,
    formData.manHours,
    formData.pob,
    formData.safetyOfficerCount,
  ]);

  // Compute live scores
  const scoreResults = computeAssessmentScores(formData);
  const gradeInfo = getGradeLabel(scoreResults.grade);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.companyName || !formData.companyLeader || !formData.hseOfficerName) {
      alert('Mohon lengkapi Nama Perusahaan, Pimpinan Perusahaan, dan Nama HSE Officer.');
      setActiveStep(1);
      return;
    }

    const fullRecord: HSEAssessmentRecord = {
      ...(formData as HSEAssessmentRecord),
      id: initialData?.id || `hse-${Date.now()}`,
      timestamp: initialData?.timestamp || new Date().toISOString(),
      calculatedScore: scoreResults.calculatedScore,
      laggingScore: scoreResults.laggingScore,
      leadingScore: scoreResults.leadingScore,
      grade: scoreResults.grade,
    };

    onSave(fullRecord);
  };

  const handleQuickFillExample = () => {
    setFormData({
      workLocation: 'HCC',
      companyName: 'PT. Taka Turbo',
      companyLeader: 'Bambang Supriyanto, S.T.',
      reportPeriod: 'Maret 24',
      hseOfficerName: 'Rian Hidayat, SKM (AK3 Umum)',
      fatality: 0,
      lti: 0,
      rwdc: 0,
      mtc: 0,
      fac: 1,
      nearmiss: 3,
      propertyDamage: 0,
      environmentalIncident: 0,
      ltifr: 0,
      trir: 0,
      pob: 78,
      manHours: 14850,
      fatalityCompliance: 'Comply',
      ltiCompliance: 'Comply',
      ltifrCompliance: 'Comply',
      trirCompliance: 'Comply',
      hseMeeting: 'Memenuhi',
      hseReporting: 'Memenuhi',
      toolboxMeeting: 'Memenuhi',
      mwt: 'Memenuhi',
      closureFindings: 'Memenuhi',
      inspectionCompliance: 'Memenuhi',
      ppeCompliance: 'Memenuhi',
      housekeepingCompliance: 'Memenuhi',
      ak3Certification: 'Memenuhi',
      safetyOfficerCount: 4,
      safetyOfficerRatioMet: 'Memenuhi',
      healthCheck: 'Baik',
      bpjs: 'Baik',
      dcu: 'Baik',
      pjsmJsa: 'Baik',
      emergencyManagement: 'Baik',
      trainingMatrix: 'Baik',
      mandatoryTraining: 'Baik',
      approvedHsePlan: 'Baik',
      evidenceLink: 'https://pertamina.sharepoint.com/sites/hse-ruv/evidence/taka-turbo-mar24',
      evaluatorNotes: 'Kinerja prima dan kepatuhan penuh.',
      verifiedBy: 'Agung Prasetyo (HSE Officer RU-V)',
    });
  };

  const steps = [
    { num: 1, title: 'Informasi Umum', subtitle: 'Q1 - Q5' },
    { num: 2, title: 'Statistik Insiden YTD', subtitle: 'Q6 - Q17' },
    { num: 3, title: 'Kepatuhan Lagging', subtitle: 'Q18 - Q21' },
    { num: 4, title: 'Leading: Program Kerja', subtitle: 'Q22 - Q31' },
    { num: 5, title: 'Leading: Kesehatan & Drill', subtitle: 'Q32 - Q39' },
    { num: 6, title: 'Evidensi & Verifikasi', subtitle: 'Q40' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Title & Top Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
              Formulir Penilaian Resmi
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500">PT KPI RU-V Balikpapan</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            Subcontractor HSE KPI Assessment Form
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Jawablah dengan jawaban yang sesuai. JANGAN LUPA BAHAGIA.... (40 Butir Pertanyaan Evaluasi)
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {onOpenGoogleFormsSync && (
            <button
              type="button"
              onClick={onOpenGoogleFormsSync}
              className="inline-flex items-center gap-1.5 text-xs text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-3 py-2 rounded-md font-semibold transition-colors shadow-2xs"
            >
              <svg className="w-3.5 h-3.5 text-purple-700" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
              </svg>
              <span>Tarik dari Google Forms</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleQuickFillExample}
            className="inline-flex items-center gap-1.5 text-xs text-slate-700 border border-slate-300 hover:bg-slate-50 px-3 py-2 rounded-md font-medium transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Isi Contoh Kilang</span>
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="text-xs text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 px-3 py-2 rounded-md transition-colors"
          >
            Kembali
          </button>
        </div>
      </div>

      {/* Stepper Navigation */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2 bg-white border border-slate-200 rounded-lg p-2 shadow-xs">
        {steps.map(step => (
          <button
            key={step.num}
            onClick={() => setActiveStep(step.num)}
            className={`p-2.5 rounded text-left transition-all flex flex-col ${
              activeStep === step.num
                ? 'bg-blue-700 text-white shadow-xs'
                : 'hover:bg-slate-50 text-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-[10px] uppercase font-bold tracking-wide ${activeStep === step.num ? 'text-blue-100' : 'text-slate-400'}`}>
                {step.subtitle}
              </span>
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                activeStep === step.num ? 'bg-white text-blue-700' : 'bg-slate-100 text-slate-600'
              }`}>
                {step.num}
              </span>
            </div>
            <span className="text-xs font-semibold mt-1 truncate">{step.title}</span>
          </button>
        ))}
      </div>

      {/* Main Layout: Form (Left 8 cols) + Realtime Score Summary (Right 4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Form Content */}
        <form onSubmit={handleSubmit} className="lg:col-span-8 bg-white border border-slate-200 rounded-lg p-6 shadow-xs space-y-6">

          {/* STEP 1: INFORMASI UMUM (Q1 - Q5) */}
          {activeStep === 1 && (
            <div className="space-y-6">
              <div className="border-b border-slate-200 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-700">BAGIAN 1</span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">INFORMASI UMUM</h3>
                <p className="text-xs text-slate-500">Pertanyaan butir 1 sampai 5</p>
              </div>

              {/* Q1: Lokasi Kerja */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-900">
                  1. LOKASI KERJA <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {WORK_LOCATIONS.map(loc => (
                    <label 
                      key={loc}
                      className={`flex items-center gap-2 p-2.5 rounded border text-xs cursor-pointer transition-all ${
                        formData.workLocation === loc 
                          ? 'border-blue-600 bg-blue-50/50 text-blue-900 font-semibold' 
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="workLocation"
                        value={loc}
                        checked={formData.workLocation === loc}
                        onChange={e => setFormData({ ...formData, workLocation: e.target.value as WorkLocation })}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span>{loc}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Q2: Nama Perusahaan */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-900">
                    2. NAMA PERUSAHAAN (KONTRAKTOR / SUBKONTRAKTOR) <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCustomCompany(!isCustomCompany)}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    {isCustomCompany ? 'Pilih dari Daftar Dokumen (36 PT)' : 'Input Manual PT Lain'}
                  </button>
                </div>

                {!isCustomCompany ? (
                  <select
                    value={formData.companyName}
                    onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-md bg-white text-slate-900 focus:ring-1 focus:ring-blue-600"
                  >
                    {CONTRACTOR_COMPANIES.map(company => (
                      <option key={company} value={company}>{company}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="Contoh: PT. Nama Perusahaan Baru"
                    value={formData.companyName}
                    onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-md bg-white text-slate-900 focus:ring-1 focus:ring-blue-600"
                  />
                )}
              </div>

              {/* Q3: Nama Pimpinan Perusahaan */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-900">
                  3. Nama Pimpinan Perusahaan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Nama Direktur / Project Manager..."
                  value={formData.companyLeader}
                  onChange={e => setFormData({ ...formData, companyLeader: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-md bg-white text-slate-900 focus:ring-1 focus:ring-blue-600"
                  required
                />
              </div>

              {/* Q4: Periode Laporan */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-900">
                    4. Periode Laporan <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCustomPeriod(!isCustomPeriod)}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    {isCustomPeriod ? 'Pilih Opsi Standar' : 'Periode Kustom'}
                  </button>
                </div>

                {!isCustomPeriod ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {REPORT_PERIODS.map(period => (
                      <label 
                        key={period}
                        className={`flex items-center gap-2 p-2.5 rounded border text-xs cursor-pointer transition-all ${
                          formData.reportPeriod === period 
                            ? 'border-blue-600 bg-blue-50/50 text-blue-900 font-semibold' 
                            : 'border-slate-200 hover:border-slate-300 text-slate-700'
                        }`}
                      >
                        <input
                          type="radio"
                          name="reportPeriod"
                          value={period}
                          checked={formData.reportPeriod === period}
                          onChange={e => setFormData({ ...formData, reportPeriod: e.target.value })}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span>{period}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <input
                    type="text"
                    placeholder="Contoh: April 24, Mei 24..."
                    value={formData.reportPeriod}
                    onChange={e => setFormData({ ...formData, reportPeriod: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-md bg-white text-slate-900 focus:ring-1 focus:ring-blue-600"
                  />
                )}
              </div>

              {/* Q5: Nama HSE Officer / HSE Coordinator */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-900">
                  5. Nama HSE Officer / HSE Coordinator <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Nama Penanggung Jawab K3LL Lapangan..."
                  value={formData.hseOfficerName}
                  onChange={e => setFormData({ ...formData, hseOfficerName: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-md bg-white text-slate-900 focus:ring-1 focus:ring-blue-600"
                  required
                />
              </div>
            </div>
          )}

          {/* STEP 2: HSE STATISTIC RECORD (YTD) (Q6 - Q17) */}
          {activeStep === 2 && (
            <div className="space-y-6">
              <div className="border-b border-slate-200 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-700">BAGIAN 2</span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">HSE STATISTIC RECORD (YTD)</h3>
                <p className="text-xs text-slate-500">Isi dengan jumlah angka insiden yang tercatat (Q6 sampai Q17)</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Q6: FATALITY */}
                <div className="space-y-1.5 p-3 rounded-md bg-slate-50 border border-slate-200">
                  <label className="block text-xs font-bold text-slate-900">
                    6. FATALITY <span className="text-rose-500">*</span>
                  </label>
                  <p className="text-[11px] text-slate-500">Kematian akibat kecelakaan kerja</p>
                  <input
                    type="number"
                    min="0"
                    value={formData.fatality}
                    onChange={e => setFormData({ ...formData, fatality: Number(e.target.value) })}
                    className="w-full text-xs p-2 border border-slate-300 rounded bg-white text-slate-900 font-bold"
                    required
                  />
                </div>

                {/* Q7: LOST TIME INCIDENT (LTI) */}
                <div className="space-y-1.5 p-3 rounded-md bg-slate-50 border border-slate-200">
                  <label className="block text-xs font-bold text-slate-900">
                    7. LOST TIME INCIDENT (LTI) <span className="text-rose-500">*</span>
                  </label>
                  <p className="text-[11px] text-slate-500">Kasus kecelakaan kerja kehilangan hari kerja</p>
                  <input
                    type="number"
                    min="0"
                    value={formData.lti}
                    onChange={e => setFormData({ ...formData, lti: Number(e.target.value) })}
                    className="w-full text-xs p-2 border border-slate-300 rounded bg-white text-slate-900 font-bold"
                    required
                  />
                </div>

                {/* Q8: RESTRICTED WORK DAY CASE (RWDC) */}
                <div className="space-y-1.5 p-3 rounded-md bg-slate-50 border border-slate-200">
                  <label className="block text-xs font-bold text-slate-900">
                    8. RESTRICTED WORK DAY CASE (RWDC) <span className="text-rose-500">*</span>
                  </label>
                  <p className="text-[11px] text-slate-500">Pekerja dialihkan ke tugas terbatas</p>
                  <input
                    type="number"
                    min="0"
                    value={formData.rwdc}
                    onChange={e => setFormData({ ...formData, rwdc: Number(e.target.value) })}
                    className="w-full text-xs p-2 border border-slate-300 rounded bg-white text-slate-900 font-bold"
                    required
                  />
                </div>

                {/* Q9: MEDICAL TREATMENT CASE (MTC) */}
                <div className="space-y-1.5 p-3 rounded-md bg-slate-50 border border-slate-200">
                  <label className="block text-xs font-bold text-slate-900">
                    9. MEDICAL TREATMENT CASE (MTC) <span className="text-rose-500">*</span>
                  </label>
                  <p className="text-[11px] text-slate-500">Perawatan medis di atas Pertolongan Pertama</p>
                  <input
                    type="number"
                    min="0"
                    value={formData.mtc}
                    onChange={e => setFormData({ ...formData, mtc: Number(e.target.value) })}
                    className="w-full text-xs p-2 border border-slate-300 rounded bg-white text-slate-900 font-bold"
                    required
                  />
                </div>

                {/* Q10: FIRST AID CASE (FAC) */}
                <div className="space-y-1.5 p-3 rounded-md bg-slate-50 border border-slate-200">
                  <label className="block text-xs font-bold text-slate-900">
                    10. FIRST AID CASE (FAC) <span className="text-rose-500">*</span>
                  </label>
                  <p className="text-[11px] text-slate-500">Kasus Pertolongan Pertama (P3K)</p>
                  <input
                    type="number"
                    min="0"
                    value={formData.fac}
                    onChange={e => setFormData({ ...formData, fac: Number(e.target.value) })}
                    className="w-full text-xs p-2 border border-slate-300 rounded bg-white text-slate-900 font-bold"
                    required
                  />
                </div>

                {/* Q11: NEARMISS CASE */}
                <div className="space-y-1.5 p-3 rounded-md bg-slate-50 border border-slate-200">
                  <label className="block text-xs font-bold text-slate-900">
                    11. NEARMISS CASE <span className="text-rose-500">*</span>
                  </label>
                  <p className="text-[11px] text-slate-500">Insiden nyaris celaka tanpa korban/cedera</p>
                  <input
                    type="number"
                    min="0"
                    value={formData.nearmiss}
                    onChange={e => setFormData({ ...formData, nearmiss: Number(e.target.value) })}
                    className="w-full text-xs p-2 border border-slate-300 rounded bg-white text-slate-900 font-bold"
                    required
                  />
                </div>

                {/* Q12: PROPERTY DAMAGE CASE */}
                <div className="space-y-1.5 p-3 rounded-md bg-slate-50 border border-slate-200">
                  <label className="block text-xs font-bold text-slate-900">
                    12. PROPERTY DAMAGE CASE <span className="text-rose-500">*</span>
                  </label>
                  <p className="text-[11px] text-slate-500">Kerusakan aset/alat tanpa korban cedera</p>
                  <input
                    type="number"
                    min="0"
                    value={formData.propertyDamage}
                    onChange={e => setFormData({ ...formData, propertyDamage: Number(e.target.value) })}
                    className="w-full text-xs p-2 border border-slate-300 rounded bg-white text-slate-900 font-bold"
                    required
                  />
                </div>

                {/* Q13: ENVIRONMENTAL INCIDENT CASE */}
                <div className="space-y-1.5 p-3 rounded-md bg-slate-50 border border-slate-200">
                  <label className="block text-xs font-bold text-slate-900">
                    13. ENVIRONMENTAL INCIDENT CASE <span className="text-rose-500">*</span>
                  </label>
                  <p className="text-[11px] text-slate-500">Tumpahan minyak, pencemaran lingkungan dll</p>
                  <input
                    type="number"
                    min="0"
                    value={formData.environmentalIncident}
                    onChange={e => setFormData({ ...formData, environmentalIncident: Number(e.target.value) })}
                    className="w-full text-xs p-2 border border-slate-300 rounded bg-white text-slate-900 font-bold"
                    required
                  />
                </div>

                {/* Q16: POB Periode Laporan */}
                <div className="space-y-1.5 p-3 rounded-md bg-blue-50/50 border border-blue-200">
                  <label className="block text-xs font-bold text-slate-900">
                    16. POB Periode Laporan <span className="text-rose-500">*</span>
                  </label>
                  <p className="text-[11px] text-slate-500">People On Board (Jumlah tenaga kerja aktif)</p>
                  <input
                    type="number"
                    min="1"
                    value={formData.pob}
                    onChange={e => setFormData({ ...formData, pob: Number(e.target.value) })}
                    className="w-full text-xs p-2 border border-blue-300 rounded bg-white text-slate-900 font-bold"
                    required
                  />
                </div>

                {/* Q17: Man Hour Periode Laporan */}
                <div className="space-y-1.5 p-3 rounded-md bg-blue-50/50 border border-blue-200">
                  <label className="block text-xs font-bold text-slate-900">
                    17. Man Hour Periode Laporan <span className="text-rose-500">*</span>
                  </label>
                  <p className="text-[11px] text-slate-500">Total jam kerja orang selama periode berjalan</p>
                  <input
                    type="number"
                    min="1"
                    value={formData.manHours}
                    onChange={e => setFormData({ ...formData, manHours: Number(e.target.value) })}
                    className="w-full text-xs p-2 border border-blue-300 rounded bg-white text-slate-900 font-bold"
                    required
                  />
                </div>

                {/* Q14: LTIFR (Auto Calculated) */}
                <div className="space-y-1.5 p-3 rounded-md bg-slate-100 border border-slate-200">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-900">
                      14. LTIFR (Lost Time Injury Rate) <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] text-slate-500">Target &lt; 1</span>
                  </div>
                  <p className="text-[11px] text-slate-500">Formula: (LTI × 1.000.000) / Man Hours</p>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.ltifr}
                    onChange={e => setFormData({ ...formData, ltifr: Number(e.target.value) })}
                    className="w-full text-xs p-2 border border-slate-300 rounded bg-white text-slate-900 font-mono font-bold"
                    required
                  />
                </div>

                {/* Q15: TRIR (Auto Calculated) */}
                <div className="space-y-1.5 p-3 rounded-md bg-slate-100 border border-slate-200">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-900">
                      15. TOTAL RECORDABLE INJURY RATE (TRIR) <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] text-slate-500">Target &lt; 0.09</span>
                  </div>
                  <p className="text-[11px] text-slate-500">Formula: (Fat+LTI+RWDC+MTC × 1.000.000) / Man Hours</p>
                  <input
                    type="number"
                    step="0.001"
                    value={formData.trir}
                    onChange={e => setFormData({ ...formData, trir: Number(e.target.value) })}
                    className="w-full text-xs p-2 border border-slate-300 rounded bg-white text-slate-900 font-mono font-bold"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: KEPATUHAN LAGGING INDICATOR (Q18 - Q21) */}
          {activeStep === 3 && (
            <div className="space-y-6">
              <div className="border-b border-slate-200 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-700">BAGIAN 3</span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">KEPATUHAN LAGGING INDICATOR</h3>
                <p className="text-xs text-slate-500">Target Memenuhi = Sesuai baku mutu keselamatan (Q18 sampai Q21)</p>
              </div>

              {/* Q18: Fatality */}
              <div className="p-4 border border-slate-200 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-900">
                    18. Fatality <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-xs text-slate-500 font-medium">Target Memenuhi = Tidak ada insiden (0)</span>
                </div>
                <div className="flex items-center gap-4">
                  <label className={`flex items-center gap-2 px-3 py-2 rounded border text-xs cursor-pointer ${
                    formData.fatalityCompliance === 'Comply' ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold' : 'border-slate-200 text-slate-600'
                  }`}>
                    <input
                      type="radio"
                      name="fatalityCompliance"
                      value="Comply"
                      checked={formData.fatalityCompliance === 'Comply'}
                      onChange={() => setFormData({ ...formData, fatalityCompliance: 'Comply' })}
                    />
                    <span>Comply</span>
                  </label>
                  <label className={`flex items-center gap-2 px-3 py-2 rounded border text-xs cursor-pointer ${
                    formData.fatalityCompliance === 'Non Comply' ? 'border-rose-600 bg-rose-50 text-rose-900 font-bold' : 'border-slate-200 text-slate-600'
                  }`}>
                    <input
                      type="radio"
                      name="fatalityCompliance"
                      value="Non Comply"
                      checked={formData.fatalityCompliance === 'Non Comply'}
                      onChange={() => setFormData({ ...formData, fatalityCompliance: 'Non Comply' })}
                    />
                    <span>Non Comply</span>
                  </label>
                </div>
              </div>

              {/* Q19: Lost Time Incident (LTI) */}
              <div className="p-4 border border-slate-200 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-900">
                    19. Lost Time Incident (LTI) <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-xs text-slate-500 font-medium">Target Memenuhi = Tidak ada insiden (0)</span>
                </div>
                <div className="flex items-center gap-4">
                  <label className={`flex items-center gap-2 px-3 py-2 rounded border text-xs cursor-pointer ${
                    formData.ltiCompliance === 'Comply' ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold' : 'border-slate-200 text-slate-600'
                  }`}>
                    <input
                      type="radio"
                      name="ltiCompliance"
                      value="Comply"
                      checked={formData.ltiCompliance === 'Comply'}
                      onChange={() => setFormData({ ...formData, ltiCompliance: 'Comply' })}
                    />
                    <span>Comply</span>
                  </label>
                  <label className={`flex items-center gap-2 px-3 py-2 rounded border text-xs cursor-pointer ${
                    formData.ltiCompliance === 'Non Comply' ? 'border-rose-600 bg-rose-50 text-rose-900 font-bold' : 'border-slate-200 text-slate-600'
                  }`}>
                    <input
                      type="radio"
                      name="ltiCompliance"
                      value="Non Comply"
                      checked={formData.ltiCompliance === 'Non Comply'}
                      onChange={() => setFormData({ ...formData, ltiCompliance: 'Non Comply' })}
                    />
                    <span>Non Comply</span>
                  </label>
                </div>
              </div>

              {/* Q20: LTIFR */}
              <div className="p-4 border border-slate-200 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-900">
                    20. Lost Time Incident Frequency Rate (LTIFR) <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-xs text-slate-500 font-medium">Target Memenuhi = LTIFR &lt; 1</span>
                </div>
                <div className="flex items-center gap-4">
                  <label className={`flex items-center gap-2 px-3 py-2 rounded border text-xs cursor-pointer ${
                    formData.ltifrCompliance === 'Comply' ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold' : 'border-slate-200 text-slate-600'
                  }`}>
                    <input
                      type="radio"
                      name="ltifrCompliance"
                      value="Comply"
                      checked={formData.ltifrCompliance === 'Comply'}
                      onChange={() => setFormData({ ...formData, ltifrCompliance: 'Comply' })}
                    />
                    <span>Comply</span>
                  </label>
                  <label className={`flex items-center gap-2 px-3 py-2 rounded border text-xs cursor-pointer ${
                    formData.ltifrCompliance === 'Non Comply' ? 'border-rose-600 bg-rose-50 text-rose-900 font-bold' : 'border-slate-200 text-slate-600'
                  }`}>
                    <input
                      type="radio"
                      name="ltifrCompliance"
                      value="Non Comply"
                      checked={formData.ltifrCompliance === 'Non Comply'}
                      onChange={() => setFormData({ ...formData, ltifrCompliance: 'Non Comply' })}
                    />
                    <span>Non Comply</span>
                  </label>
                </div>
              </div>

              {/* Q21: TRIR */}
              <div className="p-4 border border-slate-200 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-900">
                    21. Total Recordable Injury Rate (TRIR) <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-xs text-slate-500 font-medium">Target Memenuhi = TRIR &lt; 0.09</span>
                </div>
                <div className="flex items-center gap-4">
                  <label className={`flex items-center gap-2 px-3 py-2 rounded border text-xs cursor-pointer ${
                    formData.trirCompliance === 'Comply' ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold' : 'border-slate-200 text-slate-600'
                  }`}>
                    <input
                      type="radio"
                      name="trirCompliance"
                      value="Comply"
                      checked={formData.trirCompliance === 'Comply'}
                      onChange={() => setFormData({ ...formData, trirCompliance: 'Comply' })}
                    />
                    <span>Comply</span>
                  </label>
                  <label className={`flex items-center gap-2 px-3 py-2 rounded border text-xs cursor-pointer ${
                    formData.trirCompliance === 'Non Comply' ? 'border-rose-600 bg-rose-50 text-rose-900 font-bold' : 'border-slate-200 text-slate-600'
                  }`}>
                    <input
                      type="radio"
                      name="trirCompliance"
                      value="Non Comply"
                      checked={formData.trirCompliance === 'Non Comply'}
                      onChange={() => setFormData({ ...formData, trirCompliance: 'Non Comply' })}
                    />
                    <span>Non Comply</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: LEADING INDICATOR - PROGRAM KERJA (Q22 - Q31) */}
          {activeStep === 4 && (
            <div className="space-y-5">
              <div className="border-b border-slate-200 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-700">BAGIAN 4</span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">LEADING INDICATOR - PROGRAM KERJA K3LL</h3>
                <p className="text-xs text-slate-500">Pertanyaan butir 22 sampai 31 (Kepatuhan Operasional Kilang)</p>
              </div>

              {/* Helper for Binary Radio (Memenuhi / Tidak Memenuhi) */}
              {[
                {
                  key: 'hseMeeting' as keyof HSEAssessmentRecord,
                  num: 22,
                  title: 'HSE Meeting',
                  target: 'Target = 100% Hadir',
                },
                {
                  key: 'hseReporting' as keyof HSEAssessmentRecord,
                  num: 23,
                  title: 'HSE Reporting',
                  target: 'Target = 100% dilaporkan',
                },
                {
                  key: 'toolboxMeeting' as keyof HSEAssessmentRecord,
                  num: 24,
                  title: 'Toolbox meeting Compliance',
                  target: 'Target = 100% Pelaksanaan',
                },
                {
                  key: 'mwt' as keyof HSEAssessmentRecord,
                  num: 25,
                  title: 'HSE Management Walkthrough / MWT (Manager level)',
                  target: 'Target = 100%',
                },
                {
                  key: 'closureFindings' as keyof HSEAssessmentRecord,
                  num: 26,
                  title: 'Tindakan Penutupan Temuan',
                  target: 'Tingkat penutupan bulanan temuan safety. Target = 100% ditutup.',
                },
                {
                  key: 'inspectionCompliance' as keyof HSEAssessmentRecord,
                  num: 27,
                  title: 'Kepatuhan Inspeksi',
                  target: 'Seluruh perlengkapan, perkakas, kendaraan, telah lulus pemeriksaan dan telah mempunyai kode warna yang valid. Target = 100% Diperiksa',
                },
                {
                  key: 'ppeCompliance' as keyof HSEAssessmentRecord,
                  num: 28,
                  title: 'Kepatuhan APD',
                  target: 'Target = 100% patuh, tidak ada pelanggaran APD',
                },
                {
                  key: 'housekeepingCompliance' as keyof HSEAssessmentRecord,
                  num: 29,
                  title: 'Kepatuhan manajemen tata graha yang baik',
                  target: 'Target = 100% Comply',
                },
                {
                  key: 'ak3Certification' as keyof HSEAssessmentRecord,
                  num: 30,
                  title: 'Koordinator HSE minimal memiliki Sertifikat AK3 Umum yang masih berlaku atau lainnya',
                  target: 'Sertifikasi Kemenaker / BNSP yang aktif',
                },
              ].map(item => (
                <div key={item.num} className="p-3.5 border border-slate-200 rounded-lg space-y-1.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <label className="text-xs font-bold text-slate-900">
                      {item.num}. {item.title} <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[11px] text-slate-500">{item.target}</span>
                  </div>
                  <div className="flex items-center gap-3 pt-1">
                    <label className={`flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs cursor-pointer ${
                      formData[item.key] === 'Memenuhi' ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold' : 'border-slate-200 text-slate-600'
                    }`}>
                      <input
                        type="radio"
                        name={item.key}
                        value="Memenuhi"
                        checked={formData[item.key] === 'Memenuhi'}
                        onChange={() => setFormData({ ...formData, [item.key]: 'Memenuhi' })}
                      />
                      <span>Memenuhi</span>
                    </label>
                    <label className={`flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs cursor-pointer ${
                      formData[item.key] === 'Tidak Memenuhi' ? 'border-rose-600 bg-rose-50 text-rose-900 font-bold' : 'border-slate-200 text-slate-600'
                    }`}>
                      <input
                        type="radio"
                        name={item.key}
                        value="Tidak Memenuhi"
                        checked={formData[item.key] === 'Tidak Memenuhi'}
                        onChange={() => setFormData({ ...formData, [item.key]: 'Tidak Memenuhi' })}
                      />
                      <span>Tidak Memenuhi</span>
                    </label>
                  </div>
                </div>
              ))}

              {/* Q31: Safetyman Count & Ratio */}
              <div className="p-4 border border-blue-200 bg-blue-50/30 rounded-lg space-y-2">
                <label className="block text-xs font-bold text-slate-900">
                  31. Jumlah Petugas Safety / Safetyman <span className="text-rose-500">*</span>
                </label>
                <p className="text-[11px] text-slate-600">
                  Target: 1 safety man/area kerja untuk 1-25 pekerja (rasio 1:25); atau sesuai kebutuhan berdasarkan penilaian HSE
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-[11px] text-slate-500 block mb-1">Jumlah Safetyman Saat Ini:</span>
                    <input
                      type="number"
                      min="0"
                      value={formData.safetyOfficerCount}
                      onChange={e => setFormData({ ...formData, safetyOfficerCount: Number(e.target.value) })}
                      className="w-full text-xs p-2 border border-slate-300 rounded bg-white text-slate-900 font-bold"
                      required
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block mb-1">Status Kepatuhan Rasio (POB: {formData.pob}):</span>
                    <div className={`p-2 rounded text-xs font-bold border flex items-center justify-between ${
                      formData.safetyOfficerRatioMet === 'Memenuhi' 
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800' 
                        : 'bg-rose-50 border-rose-300 text-rose-800'
                    }`}>
                      <span>{formData.safetyOfficerRatioMet}</span>
                      <span className="text-[11px] font-normal">
                        (Minimal butuh {getRequiredSafetyman(formData.pob || 0)} orang)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: LEADING INDICATOR - KESEHATAN, PELATIHAN & HSE PLAN (Q32 - Q39) */}
          {activeStep === 5 && (
            <div className="space-y-5">
              <div className="border-b border-slate-200 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-700">BAGIAN 5</span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">KESEHATAN KERJA, PELATIHAN & HSE PLAN</h3>
                <p className="text-xs text-slate-500">Pertanyaan butir 32 sampai 39 (Skala Penilaian: Baik, Diterima, Buruk)</p>
              </div>

              {[
                {
                  key: 'healthCheck' as keyof HSEAssessmentRecord,
                  num: 32,
                  title: 'Pemeriksaan Kesehatan',
                  desc: 'Medical Check-Up (MCU) berkala untuk seluruh pekerja. Baik = >90%, Diterima = 50%-90%, Buruk = <50%',
                },
                {
                  key: 'bpjs' as keyof HSEAssessmentRecord,
                  num: 33,
                  title: 'Penyediaan BPJS Kesehatan dan BPJS Ketenagakerjaan',
                  desc: 'Seluruh pekerja dilindungi oleh BPJS Kesehatan dan BPJS Ketenagakerjaan yang masih berlaku. Baik = >90%, Diterima = 50%-90%, Buruk = <50%',
                },
                {
                  key: 'dcu' as keyof HSEAssessmentRecord,
                  num: 34,
                  title: 'Pemeriksaan harian (DCU)',
                  desc: 'DCU bagi pekerja dilaksanakan setiap hari sebelum bekerja untuk pekerjaan kritis/berisiko tinggi. Baik = >90%, Diterima = 50%-90%, Buruk = <50%',
                },
                {
                  key: 'pjsmJsa' as keyof HSEAssessmentRecord,
                  num: 35,
                  title: 'Sosialisasi PJSM/JSA',
                  desc: 'Pembahasan PJSM termasuk JSA dilakukan setelah TBM dalam kerja kelompok yang dipimpin oleh masing-masing leader/supervisor. Baik = >90%, Diterima = 50%-90%, Buruk = <50%',
                },
                {
                  key: 'emergencyManagement' as keyof HSEAssessmentRecord,
                  num: 36,
                  title: 'Tanggap Darurat / Manajemen Penanganan',
                  desc: '1. Latihan darurat (bulanan/6 bulanan) 2. ERP terkini 3. Tim tanggap darurat 4. Peralatan darurat. Baik = >90%, Diterima = 50%-90%, Buruk = <50%',
                },
                {
                  key: 'trainingMatrix' as keyof HSEAssessmentRecord,
                  num: 37,
                  title: 'Matriks Pelatihan & Rencana Pelatihan',
                  desc: 'Matriks Pelatihan & Rencana Pelatihan tersedia dan diperbarui. Baik = >90%, Diterima = 50%-90%, Buruk = <50%',
                },
                {
                  key: 'mandatoryTraining' as keyof HSEAssessmentRecord,
                  num: 38,
                  title: 'Pelatihan wajib dan khusus',
                  desc: 'Seluruh pekerja telah melewati pelatihan wajib dan khusus yang diwajibkan oleh PT. KPI RU-V. Baik = >90%, Diterima = 50%-90%, Buruk = <50%',
                },
                {
                  key: 'approvedHsePlan' as keyof HSEAssessmentRecord,
                  num: 39,
                  title: 'HSE Plan yang Disetujui',
                  desc: 'HSE Plan telah disetujui oleh PT. KPI RU-V. Baik = >80%',
                },
              ].map(item => (
                <div key={item.num} className="p-3.5 border border-slate-200 rounded-lg space-y-2">
                  <div>
                    <label className="text-xs font-bold text-slate-900">
                      {item.num}. {item.title} <span className="text-rose-500">*</span>
                    </label>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{item.desc}</p>
                  </div>
                  <div className="flex items-center gap-3 pt-1">
                    {(['Baik', 'Diterima', 'Buruk'] as TierRating[]).map(rating => (
                      <label 
                        key={rating}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs cursor-pointer ${
                          formData[item.key] === rating 
                            ? rating === 'Baik' ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold'
                              : rating === 'Diterima' ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold'
                              : 'border-rose-600 bg-rose-50 text-rose-900 font-bold'
                            : 'border-slate-200 text-slate-600'
                        }`}
                      >
                        <input
                          type="radio"
                          name={item.key}
                          value={rating}
                          checked={formData[item.key] === rating}
                          onChange={() => setFormData({ ...formData, [item.key]: rating })}
                        />
                        <span>{rating}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* STEP 6: BUKTI & PENGESAHAN (Q40) */}
          {activeStep === 6 && (
            <div className="space-y-6">
              <div className="border-b border-slate-200 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-700">BAGIAN 6</span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">EVIDENSI DOKUMEN & PENGESAHAN</h3>
                <p className="text-xs text-slate-500">Pertanyaan butir 40 dan catatan verifikasi PT KPI RU-V</p>
              </div>

              {/* Q40: Masukkan tautan Semua Bukti yang Diperlukan */}
              <div className="p-4 border border-slate-200 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-900">
                    40. Masukkan tautan Semua Bukti yang Diperlukan <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-500">Bukti yang diperlukan dibuat setiap bulan</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Tautan folder penyimpanan dokumen pendukung (Microsoft OneDrive, SharePoint, Google Drive, atau Server Kilang).
                </p>
                <div className="relative">
                  <LinkIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="url"
                    placeholder="https://pertamina.sharepoint.com/sites/hse/..."
                    value={formData.evidenceLink}
                    onChange={e => setFormData({ ...formData, evidenceLink: e.target.value })}
                    className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded bg-white text-slate-900"
                    required
                  />
                </div>
              </div>

              {/* Catatan Evaluator */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-900">
                  Catatan Evaluasi / Rekomendasi K3LL RU-V
                </label>
                <textarea
                  rows={3}
                  placeholder="Catatan temuan inspeksi, apresiasi, atau rekomendasi perbaikan CSMS..."
                  value={formData.evaluatorNotes}
                  onChange={e => setFormData({ ...formData, evaluatorNotes: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded bg-white text-slate-900"
                />
              </div>

              {/* Nama Verifikator */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-900">
                  Nama Petugas Evaluator / Verifikator HSE Pertamina
                </label>
                <input
                  type="text"
                  value={formData.verifiedBy}
                  onChange={e => setFormData({ ...formData, verifiedBy: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded bg-white text-slate-900 font-semibold"
                />
              </div>
            </div>
          )}

          {/* Form Step Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            {activeStep > 1 ? (
              <button
                type="button"
                onClick={() => setActiveStep(activeStep - 1)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 border border-slate-300 hover:bg-slate-50 px-3.5 py-2 rounded-md"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Sebelumnya</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              {activeStep < 6 ? (
                <button
                  type="button"
                  onClick={() => setActiveStep(activeStep + 1)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-md shadow-xs"
                >
                  <span>Langkah Berikutnya</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-2.5 rounded-md shadow-xs"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Hasil Asesmen</span>
                </button>
              )}
            </div>
          </div>
        </form>

        {/* Right: Realtime Score & Assessment Preview (4 cols) */}
        <div className="lg:col-span-4 space-y-4 sticky top-24">
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Kalkulasi Skor Real-Time
              </span>
              <span className="text-[11px] font-mono text-slate-400">CSMS Matrix</span>
            </div>

            {/* Total Score & Grade Badge */}
            <div className="text-center py-2 space-y-2 bg-slate-50 rounded-lg p-3 border border-slate-100">
              <span className="text-xs text-slate-500 font-medium">Predikat Kinerja HSE Subkontraktor</span>
              <div className="flex items-center justify-center gap-3">
                <span className="text-4xl font-extrabold text-slate-900 tracking-tight">
                  {scoreResults.calculatedScore}%
                </span>
                <span className={`px-3 py-1 rounded text-sm font-extrabold ${
                  scoreResults.grade === 'A' ? 'bg-emerald-100 text-emerald-800' :
                  scoreResults.grade === 'B' ? 'bg-blue-100 text-blue-800' :
                  scoreResults.grade === 'C' ? 'bg-amber-100 text-amber-800' :
                  'bg-rose-100 text-rose-800'
                }`}>
                  Grade {scoreResults.grade}
                </span>
              </div>
              <div className={`text-xs font-semibold ${gradeInfo.color}`}>
                {gradeInfo.text}
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">
                {gradeInfo.description}
              </p>
            </div>

            {/* Breakdown Scores */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded bg-slate-50">
                <span className="text-slate-600">Skor Lagging (Bobot 35%):</span>
                <span className="font-bold text-slate-900">{scoreResults.laggingScore} / 100</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-slate-50">
                <span className="text-slate-600">Skor Leading (Bobot 65%):</span>
                <span className="font-bold text-slate-900">{scoreResults.leadingScore} / 100</span>
              </div>
            </div>

            {/* Incident Summary Warnings */}
            <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs">
              <div className="font-semibold text-slate-700">Ringkasan Statistik:</div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Fatality / LTI:</span>
                <span className={`font-bold ${formData.fatality! > 0 || formData.lti! > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                  {formData.fatality} / {formData.lti}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>LTIFR / TRIR:</span>
                <span className="font-mono font-medium text-slate-900">
                  {formData.ltifr} / {formData.trir}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Jam Kerja Selamat:</span>
                <span className="font-mono text-slate-900">{formData.manHours?.toLocaleString('id-ID')} hrs</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Safetyman vs POB ({formData.pob}):</span>
                <span className={`font-semibold ${formData.safetyOfficerRatioMet === 'Memenuhi' ? 'text-emerald-700' : 'text-rose-600'}`}>
                  {formData.safetyOfficerCount} orang ({formData.safetyOfficerRatioMet})
                </span>
              </div>
            </div>

            {/* Document Info Pill */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded text-amber-900 text-[11px] leading-relaxed">
              <div className="font-bold flex items-center gap-1 mb-0.5">
                <Info className="w-3.5 h-3.5 text-amber-600" />
                <span>Ketentuan Sanksi K3LL RU-V:</span>
              </div>
              Apabila terdapat 1 insiden fatality atau LTI, predikat nilai secara otomatis diturunkan menjadi Grade D/C sesuai ketentuan Contractor Safety Management System (CSMS).
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
