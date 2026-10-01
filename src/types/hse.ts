export type WorkLocation = 
  | 'HSC'
  | 'HCC'
  | 'DIS & WAX'
  | 'UTILITIES'
  | 'OM UTARA'
  | 'OM SELATAN'
  | 'LUAR KILANG';

export type ComplianceStatus = 'Comply' | 'Non Comply';
export type BinaryRating = 'Memenuhi' | 'Tidak Memenuhi';
export type TierRating = 'Baik' | 'Diterima' | 'Buruk';

export interface HSEAssessmentRecord {
  id: string;
  timestamp: string; // ISO date string
  
  // 1. INFORMASI UMUM (Q1 - Q5)
  workLocation: WorkLocation; // Q1
  companyName: string; // Q2
  companyLeader: string; // Q3 (Nama Pimpinan Perusahaan)
  reportPeriod: string; // Q4 (e.g. "Desember 23", "Januari 24", "Februari 24", "Maret 24")
  hseOfficerName: string; // Q5 (Nama HSE Officer / HSE Coordinator)

  // 2. HSE STATISTIC RECORD (YTD) (Q6 - Q17)
  fatality: number; // Q6
  lti: number; // Q7 (Lost Time Incident)
  rwdc: number; // Q8 (Restricted Work Day Case)
  mtc: number; // Q9 (Medical Treatment Case)
  fac: number; // Q10 (First Aid Case)
  nearmiss: number; // Q11 (Nearmiss Case)
  propertyDamage: number; // Q12 (Property Damage Case)
  environmentalIncident: number; // Q13 (Environmental Incident Case)
  ltifr: number; // Q14 (Lost Time Injury Frequency Rate)
  trir: number; // Q15 (Total Recordable Injury Rate)
  pob: number; // Q16 (POB Periode Laporan)
  manHours: number; // Q17 (Man Hour Periode Laporan)

  // 3. KEPATUHAN LAGGING INDICATOR (Q18 - Q21)
  fatalityCompliance: ComplianceStatus; // Q18 (Target: Tidak ada insiden)
  ltiCompliance: ComplianceStatus; // Q19 (Target: Tidak ada insiden)
  ltifrCompliance: ComplianceStatus; // Q20 (Target: LTIFR < 1)
  trirCompliance: ComplianceStatus; // Q21 (Target: TRIR < 0.09)

  // 4. LEADING INDICATOR (Q22 - Q39)
  hseMeeting: BinaryRating; // Q22 (Target: 100% Hadir)
  hseReporting: BinaryRating; // Q23 (Target: 100% dilaporkan)
  toolboxMeeting: BinaryRating; // Q24 (Target: 100% Pelaksanaan)
  mwt: BinaryRating; // Q25 (HSE Management Walkthrough / MWT - Manager level, Target: 100%)
  closureFindings: BinaryRating; // Q26 (Tindakan Penutupan Temuan safety, Target: 100% ditutup)
  inspectionCompliance: BinaryRating; // Q27 (Pemeriksaan perlengkapan, perkakas, valid color code)
  ppeCompliance: BinaryRating; // Q28 (Kepatuhan APD, 100% patuh)
  housekeepingCompliance: BinaryRating; // Q29 (Manajemen tata graha yang baik, 100% Comply)
  ak3Certification: BinaryRating; // Q30 (Koordinator HSE min Sertifikat AK3 Umum berlaku)
  safetyOfficerCount: number; // Q31 (Jumlah Petugas Safety / Safetyman)
  safetyOfficerRatioMet: BinaryRating; // Target rasio 1:25 pekerja
  healthCheck: TierRating; // Q32 (Pemeriksaan Kesehatan: Baik >90%, Diterima 50-90%, Buruk <50%)
  bpjs: TierRating; // Q33 (BPJS Kesehatan & Ketenagakerjaan: Baik >90%, Diterima 50-90%, Buruk <50%)
  dcu: TierRating; // Q34 (Pemeriksaan harian / DCU sebelum kerja kritis: Baik >90%, Diterima 50-90%, Buruk <50%)
  pjsmJsa: TierRating; // Q35 (Sosialisasi PJSM/JSA: Baik >90%, Diterima 50-90%, Buruk <50%)
  emergencyManagement: TierRating; // Q36 (Tanggap Darurat, Drill & Tim: Baik >90%, Diterima 50-90%, Buruk <50%)
  trainingMatrix: TierRating; // Q37 (Matriks & Rencana Pelatihan tersedia & update)
  mandatoryTraining: TierRating; // Q38 (Pelatihan wajib & khusus oleh PT. KPI RU-V)
  approvedHsePlan: TierRating; // Q39 (HSE Plan disetujui PT. KPI RU-V, Baik >80%)

  // 5. BUKTI & CATATAN (Q40)
  evidenceLink: string; // Q40 (Masukkan tautan Semua Bukti yang Diperlukan)
  evaluatorNotes?: string;
  verifiedBy?: string;

  // CALCULATED METRICS
  calculatedScore: number; // 0 - 100%
  laggingScore: number; // 0 - 100%
  leadingScore: number; // 0 - 100%
  grade: 'A' | 'B' | 'C' | 'D';
}

export const WORK_LOCATIONS: WorkLocation[] = [
  'HSC',
  'HCC',
  'DIS & WAX',
  'UTILITIES',
  'OM UTARA',
  'OM SELATAN',
  'LUAR KILANG'
];

export const CONTRACTOR_COMPANIES = [
  'PT. Gading Digstar Karya Abadi',
  'PT. Taka Turbo',
  'PT. Teknofas',
  'PT. Malewa Putra',
  'PT. Prasida Arta BK',
  'PT. Irma Jaya',
  'PT. Mulia Adi Perkasa',
  'PT. Sriwijaya Teknik Utama',
  'PT. Alif Fadilah',
  'PT. Rizky Handayani Sejati',
  'PT. Jamin Jaya',
  'PT. Surveyor Indonesia',
  'PT. Kinasih',
  'PT. DTS',
  'PT. Atlas Copco',
  'PT. OSA',
  'PT. Merpati Putih',
  'PT. Dade',
  'PT. Adighana Perkasa Mandiri',
  'PT. Belani Mura',
  'PT. Bumiphala Perkasa',
  'PT. SHB',
  'PT. Viya Jaya',
  'PT. Quarta',
  'PT. Basuki Water',
  'PT. Jasa Kita Bersama',
  'PT. Wignyo',
  'PT. Eka Dwi Indah Jaya',
  'PT. PBAS',
  'PT. Wanda Putri',
  'PT. BMJP',
  'PT. Citra Aulia Mandiri',
  'PT. Patra Utama Mandiri',
  'PT. Karya Murni Nusantara',
  'PT. Elnusa Fabricator',
  'PT. BMKU'
];

export const REPORT_PERIODS = [
  'Maret 24',
  'Februari 24',
  'Januari 24',
  'Desember 23'
];
