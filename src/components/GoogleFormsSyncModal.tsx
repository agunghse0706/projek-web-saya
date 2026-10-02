import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { 
  initAuth, 
  googleSignIn, 
  logoutGoogle, 
  getAccessToken 
} from '../services/googleAuth';
import { 
  fetchGoogleFormMetadata, 
  fetchGoogleFormResponses, 
  mapGoogleFormResponseToRecord, 
  extractGoogleFormId,
  GoogleFormData,
  GoogleFormResponsesList
} from '../services/googleForms';
import { HSEAssessmentRecord } from '../types/hse';
import { 
  X, 
  ExternalLink, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Layers, 
  FileCheck, 
  Sparkles, 
  ShieldCheck, 
  HelpCircle,
  Database,
  ArrowRight
} from 'lucide-react';

interface GoogleFormsSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportAssessments: (records: HSEAssessmentRecord[]) => void;
  existingAssessmentsCount: number;
}

// Sample Google Form fallback records for instant testing if no live form is provided
const SAMPLE_GFORM_PREVIEWS: HSEAssessmentRecord[] = [
  {
    id: 'gform-sub-001',
    timestamp: '2024-03-28T09:15:00Z',
    workLocation: 'HSC',
    companyName: 'PT. Barata Indonesia (Persero)',
    companyLeader: 'Dedi Kurniawan, S.T.',
    reportPeriod: 'Maret 24',
    hseOfficerName: 'Rizal Fahmi, SKM',
    fatality: 0,
    lti: 0,
    rwdc: 0,
    mtc: 0,
    fac: 0,
    nearmiss: 2,
    propertyDamage: 0,
    environmentalIncident: 0,
    ltifr: 0,
    trir: 0,
    pob: 85,
    manHours: 16150,
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
    evidenceLink: 'https://docs.google.com/forms/d/e/1FAIpQLSc-hse-ru5/viewform',
    evaluatorNotes: 'Respon terverifikasi dari Google Forms CSMS RU-V.',
    verifiedBy: 'Agung Prasetyo (HSE Pertamina RU-V)',
    laggingScore: 100,
    leadingScore: 100,
    calculatedScore: 100,
    grade: 'A',
  },
  {
    id: 'gform-sub-002',
    timestamp: '2024-03-27T14:30:00Z',
    workLocation: 'OM SELATAN',
    companyName: 'PT. Tripatra Engineers & Constructors',
    companyLeader: 'Ir. Ahmad Zulkarnain',
    reportPeriod: 'Maret 24',
    hseOfficerName: 'Budi Raharjo',
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
    pob: 110,
    manHours: 20900,
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
    mandatoryTraining: 'Diterima',
    approvedHsePlan: 'Baik',
    evidenceLink: 'https://docs.google.com/forms/d/e/1FAIpQLSc-hse-ru5/viewform',
    evaluatorNotes: 'Data diimpor dari submission Google Form formulir asesmen.',
    verifiedBy: 'Agung Prasetyo (HSE Pertamina RU-V)',
    laggingScore: 100,
    leadingScore: 92,
    calculatedScore: 95,
    grade: 'A',
  }
];

export const GoogleFormsSyncModal: React.FC<GoogleFormsSyncModalProps> = ({
  isOpen,
  onClose,
  onImportAssessments,
  existingAssessmentsCount,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  // Form input state
  const [formInputUrl, setFormInputUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Fetched data state
  const [formMetadata, setFormMetadata] = useState<GoogleFormData | null>(null);
  const [parsedRecords, setParsedRecords] = useState<HSEAssessmentRecord[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Listen for Google Auth state
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, accessToken) => {
        setCurrentUser(user);
        setToken(accessToken);
      },
      () => {
        setCurrentUser(null);
        setToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  if (!isOpen) return null;

  const handleSignInGoogle = async () => {
    setIsLoggingIn(true);
    setErrorMessage(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setCurrentUser(result.user);
        setToken(result.accessToken);
        setSuccessNotice(`Berhasil masuk sebagai ${result.user.email}`);
      }
    } catch (err: any) {
      console.error('Google Sign-In error:', err);
      setErrorMessage(
        err.message || 'Gagal login ke akun Google. Pastikan popup tidak diblokir oleh browser.'
      );
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logoutGoogle();
    setCurrentUser(null);
    setToken(null);
    setParsedRecords([]);
    setSelectedIds(new Set());
    setFormMetadata(null);
    setSuccessNotice(null);
  };

  const handleFetchFromGoogleForms = async () => {
    if (!formInputUrl.trim()) {
      setErrorMessage('Masukkan tautan (link) URL atau ID Google Form terlebih dahulu.');
      return;
    }

    const formId = extractGoogleFormId(formInputUrl);
    if (!formId) {
      setErrorMessage('Format URL Google Form tidak dikenali. Contoh: https://docs.google.com/forms/d/1XyZ.../edit');
      return;
    }

    if (!token) {
      setErrorMessage('Anda perlu masuk dengan Akun Google terlebih dahulu untuk mengakses Google Forms API.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessNotice(null);

    try {
      // 1. Fetch Form Structure
      const meta = await fetchGoogleFormMetadata(formId, token);
      setFormMetadata(meta);

      // 2. Fetch Form Responses
      const responsesData: GoogleFormResponsesList = await fetchGoogleFormResponses(formId, token);

      if (!responsesData.responses || responsesData.responses.length === 0) {
        setErrorMessage(
          `Formulir "${meta.info?.title || formId}" berhasil ditemukan, namun belum ada respon yang disubmit oleh subkontraktor.`
        );
        setParsedRecords([]);
        setSelectedIds(new Set());
      } else {
        const mapped = responsesData.responses.map((resp, idx) => 
          mapGoogleFormResponseToRecord(resp, meta, idx + 1)
        );
        setParsedRecords(mapped);
        setSelectedIds(new Set(mapped.map(m => m.id)));
        setSuccessNotice(`Ditemukan ${mapped.length} respon formulir asesmen dari Google Forms!`);
      }
    } catch (err: any) {
      console.error('Fetch Google Forms error:', err);
      setErrorMessage(
        `${err.message}. Pastikan akun Google Anda memiliki akses edit/pemilik pada Google Form tersebut.`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadSampleResponses = () => {
    setParsedRecords(SAMPLE_GFORM_PREVIEWS);
    setSelectedIds(new Set(SAMPLE_GFORM_PREVIEWS.map(s => s.id)));
    setSuccessNotice('Memuat 2 contoh respon Google Forms terverifikasi untuk pengujian.');
    setErrorMessage(null);
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.size === parsedRecords.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(parsedRecords.map(r => r.id)));
    }
  };

  const handleToggleSelectOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleExecuteImport = () => {
    const toImport = parsedRecords.filter(r => selectedIds.has(r.id));
    if (toImport.length === 0) {
      alert('Pilih setidaknya satu respon untuk diimpor.');
      return;
    }

    onImportAssessments(toImport);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-lg shadow-xs border border-purple-200">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wider font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                  Google Forms Integration
                </span>
                <span className="text-slate-400">·</span>
                <span className="text-xs text-slate-500">Workspace API</span>
              </div>
              <h2 className="text-base font-bold text-slate-900 mt-0.5">
                Tarik Formulir &amp; Respon Asesmen dari Google Forms
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-xs text-slate-800">
          
          {/* Step 1: Authentication Card */}
          <div className="p-4 rounded-lg border border-slate-200 bg-white space-y-3 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  Langkah 1: Hubungkan Akun Google Workspace
                </span>
                <p className="text-xs text-slate-600 mt-0.5">
                  Masuk dengan akun Google yang memiliki formulir respon K3LL untuk memberi izin akses.
                </p>
              </div>

              {currentUser ? (
                <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>
                  <div>
                    <div className="font-semibold text-emerald-900 text-xs">Terhubung</div>
                    <div className="text-[10px] text-emerald-700">{currentUser.email}</div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="ml-2 text-[11px] text-slate-500 hover:text-rose-600 underline"
                  >
                    Keluar
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleSignInGoogle}
                  disabled={isLoggingIn}
                  className="inline-flex items-center gap-2 border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 px-3.5 py-2 rounded-md shadow-xs transition-colors font-medium text-slate-700"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>{isLoggingIn ? 'Menghubungkan...' : 'Sign in with Google'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Step 2: Form Link Input & Fetch */}
          <div className="p-4 rounded-lg border border-slate-200 bg-white space-y-3 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              Langkah 2: Tautan atau ID Formulir Google Forms
            </span>

            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formInputUrl}
                  onChange={(e) => setFormInputUrl(e.target.value)}
                  placeholder="Tempelkan URL Google Form (misal: https://docs.google.com/forms/d/.../edit)"
                  className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                />
                <button
                  onClick={handleFetchFromGoogleForms}
                  disabled={isLoading}
                  className="inline-flex items-center gap-1.5 bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-md shadow-xs transition-colors shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>{isLoading ? 'Memuat...' : 'Tarik Respon'}</span>
                </button>
              </div>

              {/* Quick Preset / Demo Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-slate-500">
                <div className="flex items-center gap-2">
                  <span>Belum memiliki link form aktif?</span>
                  <button
                    onClick={handleLoadSampleResponses}
                    className="text-purple-700 hover:text-purple-900 font-semibold underline"
                  >
                    Muat Contoh Respon Formulir (Simulasi)
                  </button>
                </div>

                <a
                  href="https://forms.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 underline"
                >
                  <span>Buka Google Forms Baru</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-rose-800 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Success Notice */}
            {successNotice && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md text-emerald-800 text-xs flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{successNotice}</span>
              </div>
            )}
          </div>

          {/* Step 3: Responses Preview Table */}
          {parsedRecords.length > 0 && (
            <div className="border border-slate-200 rounded-lg overflow-hidden space-y-3 bg-slate-50/50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 text-xs uppercase tracking-wide">
                    Langkah 3: Pratinjau Respon Subkontraktor ({parsedRecords.length} Respon)
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Pilih respon formulir yang ingin diimpor ke database evaluasi KPI
                  </p>
                </div>

                <button
                  onClick={handleToggleSelectAll}
                  className="text-xs font-semibold text-purple-700 hover:text-purple-900"
                >
                  {selectedIds.size === parsedRecords.length ? 'Batal Pilih Semua' : 'Pilih Semua'}
                </button>
              </div>

              {/* Records List */}
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {parsedRecords.map(rec => (
                  <div
                    key={rec.id}
                    onClick={() => handleToggleSelectOne(rec.id)}
                    className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      selectedIds.has(rec.id)
                        ? 'bg-purple-50/80 border-purple-300 shadow-2xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(rec.id)}
                        onChange={() => handleToggleSelectOne(rec.id)}
                        className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                      />
                      <div>
                        <div className="font-bold text-slate-900 text-xs flex items-center gap-2">
                          <span>{rec.companyName}</span>
                          <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-semibold">
                            {rec.workLocation}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex flex-wrap items-center gap-2">
                          <span>Periode: <strong>{rec.reportPeriod}</strong></span>
                          <span>·</span>
                          <span>Jam Kerja: {rec.manHours.toLocaleString('id-ID')} hrs</span>
                          <span>·</span>
                          <span>Petugas: {rec.hseOfficerName}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="flex items-center justify-end gap-1.5">
                        <span className="text-sm font-black text-slate-900">{rec.calculatedScore}%</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded text-white ${
                          rec.grade === 'A' ? 'bg-emerald-600' :
                          rec.grade === 'B' ? 'bg-blue-600' :
                          rec.grade === 'C' ? 'bg-amber-600' : 'bg-rose-600'
                        }`}>
                          Grade {rec.grade}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {rec.fatality === 0 && rec.lti === 0 ? 'Zero Accident' : 'Ada Insiden'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Information & Mapping Note */}
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 flex items-start gap-2.5 text-[11px] text-slate-600">
            <Database className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-800">Pemetaan Otomatis 40 Butir CSMS PT KPI RU-V:</strong>
              <p className="mt-0.5 leading-relaxed">
                Setiap respon Google Form akan otomatis dihitung skor <em>Lagging</em> (35%), <em>Leading</em> (65%), LTIFR, TRIR, dan predikat mutu Grade A/B/C/D sesuai Keputusan Direksi CSMS Pertamina.
              </p>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="text-xs font-medium text-slate-700 hover:text-slate-900 px-4 py-2 border border-slate-300 rounded-md bg-white hover:bg-slate-50 transition-colors"
          >
            Tutup
          </button>

          <button
            onClick={handleExecuteImport}
            disabled={selectedIds.size === 0}
            className="inline-flex items-center gap-2 bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white font-bold text-xs px-4 py-2 rounded-md shadow-xs transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Impor {selectedIds.size} Respon Terpilih ke Sistem</span>
          </button>
        </div>
      </div>
    </div>
  );
};
