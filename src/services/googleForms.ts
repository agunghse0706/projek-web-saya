import { 
  HSEAssessmentRecord, 
  WorkLocation, 
  WORK_LOCATIONS, 
  ComplianceStatus, 
  BinaryRating, 
  TierRating 
} from '../types/hse';
import { 
  calculateLTIFR, 
  calculateTRIR, 
  getRequiredSafetyman, 
  computeAssessmentScores 
} from '../utils/calculator';

export interface GoogleFormQuestion {
  questionId: string;
  title: string;
  description?: string;
}

export interface GoogleFormItem {
  itemId: string;
  title: string;
  description?: string;
  questionItem?: {
    question: {
      questionId: string;
      required?: boolean;
    };
  };
}

export interface GoogleFormData {
  formId: string;
  info: {
    title: string;
    description?: string;
    documentTitle?: string;
  };
  items: GoogleFormItem[];
}

export interface GoogleFormAnswer {
  questionId: string;
  textAnswers?: {
    answers: { value: string }[];
  };
}

export interface GoogleFormResponseItem {
  responseId: string;
  createTime: string;
  lastSubmittedTime: string;
  answers: Record<string, GoogleFormAnswer>;
}

export interface GoogleFormResponsesList {
  responses?: GoogleFormResponseItem[];
  nextPageToken?: string;
}

/**
 * Extracts the Form ID from either a raw ID or a full Google Form URL.
 */
export function extractGoogleFormId(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();
  
  // Pattern 1: https://docs.google.com/forms/d/e/{formId}/viewform
  // Pattern 2: https://docs.google.com/forms/d/{formId}/edit
  const matchD = trimmed.match(/\/forms\/d\/(?:e\/)?([a-zA-Z0-9_-]+)/);
  if (matchD && matchD[1]) {
    return matchD[1];
  }
  
  // Clean raw ID
  return trimmed.split('?')[0].split('#')[0];
}

/**
 * Fetch Google Form metadata and questions
 */
export async function fetchGoogleFormMetadata(
  formId: string, 
  accessToken: string
): Promise<GoogleFormData> {
  const cleanId = extractGoogleFormId(formId);
  const response = await fetch(`https://forms.googleapis.com/v1/forms/${cleanId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gagal memuat Formulir Google (${response.status}): ${errorText}`);
  }

  return response.json();
}

/**
 * Fetch all responses for a Google Form
 */
export async function fetchGoogleFormResponses(
  formId: string, 
  accessToken: string
): Promise<GoogleFormResponsesList> {
  const cleanId = extractGoogleFormId(formId);
  const response = await fetch(`https://forms.googleapis.com/v1/forms/${cleanId}/responses`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gagal mengambil respon dari Google Form (${response.status}): ${errorText}`);
  }

  return response.json();
}

/**
 * Map questions & responses into a complete HSEAssessmentRecord
 */
export function mapGoogleFormResponseToRecord(
  responseItem: GoogleFormResponseItem,
  formMetadata?: GoogleFormData,
  indexFallback = 1
): HSEAssessmentRecord {
  // Build a lookup: question title -> answer value
  const answersByTitle: Record<string, string> = {};
  
  if (formMetadata?.items) {
    formMetadata.items.forEach(item => {
      const qId = item.questionItem?.question?.questionId;
      if (qId && responseItem.answers?.[qId]) {
        const val = responseItem.answers[qId].textAnswers?.answers?.[0]?.value || '';
        answersByTitle[item.title.toLowerCase().trim()] = val;
      }
    });
  }

  // Fallback direct answer text lookup helper
  const getAnswer = (keywords: string[], defaultValue = ''): string => {
    // 1. Try keyword in mapped question titles
    for (const [title, val] of Object.entries(answersByTitle)) {
      if (keywords.some(k => title.includes(k.toLowerCase()))) {
        return val;
      }
    }

    // 2. Direct check inside responseItem.answers values if title lookup wasn't available
    if (responseItem.answers) {
      const allVals = Object.values(responseItem.answers).map(
        a => a.textAnswers?.answers?.[0]?.value || ''
      );
      for (const val of allVals) {
        if (keywords.some(k => val.toLowerCase().includes(k.toLowerCase()))) {
          return val;
        }
      }
    }

    return defaultValue;
  };

  const getNumberAnswer = (keywords: string[], defaultValue = 0): number => {
    const str = getAnswer(keywords, String(defaultValue));
    const cleaned = str.replace(/[^0-9.-]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? defaultValue : num;
  };

  // General Information
  const rawLocation = getAnswer(['lokasi', 'area', 'q1'], 'HSC').toUpperCase();
  const workLocation: WorkLocation = WORK_LOCATIONS.includes(rawLocation as WorkLocation)
    ? (rawLocation as WorkLocation)
    : 'HSC';

  const companyName = getAnswer(
    ['nama perusahaan', 'kontraktor', 'subkontraktor', 'q2'], 
    `Kontraktor Google Form #${indexFallback}`
  );
  
  const companyLeader = getAnswer(
    ['pimpinan', 'direktur', 'project manager', 'q3'], 
    'Pimpinan Proyek'
  );

  const reportPeriod = getAnswer(
    ['periode', 'bulan', 'q4'], 
    'Maret 24'
  );

  const hseOfficerName = getAnswer(
    ['hse officer', 'coordinator', 'nama petugas', 'q5'], 
    'HSE Officer'
  );

  // Statistics
  const fatality = getNumberAnswer(['fatality', 'kematian', 'q6'], 0);
  const lti = getNumberAnswer(['lti', 'lost time', 'q7'], 0);
  const rwdc = getNumberAnswer(['rwdc', 'restricted', 'q8'], 0);
  const mtc = getNumberAnswer(['mtc', 'medical', 'q9'], 0);
  const fac = getNumberAnswer(['fac', 'first aid', 'q10'], 0);
  const nearmiss = getNumberAnswer(['nearmiss', 'hampir celaka', 'q11'], 1);
  const propertyDamage = getNumberAnswer(['property damage', 'kerusakan', 'q12'], 0);
  const environmentalIncident = getNumberAnswer(['environmental', 'lingkungan', 'tumpahan', 'q13'], 0);
  const pob = getNumberAnswer(['pob', 'pekerja', 'jumlah orang', 'q16'], 50);
  const manHours = getNumberAnswer(['man hours', 'jam kerja', 'safe hours', 'q17'], 9500);

  // Frequency Rates
  const ltifr = calculateLTIFR(lti, manHours);
  const recordableCases = fatality + lti + rwdc + mtc;
  const trir = calculateTRIR(recordableCases, manHours);

  // Lagging Compliance
  const fatalityCompliance: ComplianceStatus = fatality === 0 ? 'Comply' : 'Non Comply';
  const ltiCompliance: ComplianceStatus = lti === 0 ? 'Comply' : 'Non Comply';
  const ltifrCompliance: ComplianceStatus = ltifr < 1.0 ? 'Comply' : 'Non Comply';
  const trirCompliance: ComplianceStatus = trir < 0.09 ? 'Comply' : 'Non Comply';

  // Leading Indicators
  const parseBinary = (keywords: string[]): BinaryRating => {
    const val = getAnswer(keywords, 'Memenuhi').toLowerCase();
    return val.includes('tidak') || val.includes('non') || val.includes('belum')
      ? 'Tidak Memenuhi'
      : 'Memenuhi';
  };

  const parseTier = (keywords: string[]): TierRating => {
    const val = getAnswer(keywords, 'Baik').toLowerCase();
    if (val.includes('tidak') || val.includes('buruk') || val.includes('kurang')) return 'Buruk';
    if (val.includes('terima') || val.includes('cukup')) return 'Diterima';
    return 'Baik';
  };

  const hseMeeting = parseBinary(['hse meeting', 'q22']);
  const hseReporting = parseBinary(['hse reporting', 'laporan bulanan', 'q23']);
  const toolboxMeeting = parseBinary(['toolbox', 'tbm', 'q24']);
  const mwt = parseBinary(['mwt', 'management walk', 'q25']);
  const closureFindings = parseBinary(['penutupan', 'closure', 'temuan', 'q26']);
  const inspectionCompliance = parseBinary(['inspeksi', 'color code', 'q27']);
  const ppeCompliance = parseBinary(['apd', 'ppe', 'q28']);
  const housekeepingCompliance = parseBinary(['housekeeping', 'tata graha', '5r', 'q29']);
  const ak3Certification = parseBinary(['ak3', 'ahli k3', 'q30']);

  const safetyOfficerCount = getNumberAnswer(['safetyman', 'jumlah safetyman', 'q31'], 2);
  const reqSafetyman = getRequiredSafetyman(pob);
  const safetyOfficerRatioMet: BinaryRating = safetyOfficerCount >= reqSafetyman ? 'Memenuhi' : 'Tidak Memenuhi';

  const healthCheck = parseTier(['mcu', 'pemeriksaan kesehatan', 'q32']);
  const bpjs = parseTier(['bpjs', 'jaminan kesehatan', 'q33']);
  const dcu = parseTier(['dcu', 'daily check', 'harian', 'q34']);
  const pjsmJsa = parseTier(['pjsm', 'jsa', 'q35']);
  const emergencyManagement = parseTier(['tanggap darurat', 'emergency', 'q36']);
  const trainingMatrix = parseTier(['matriks pelatihan', 'training matrix', 'q37']);
  const mandatoryTraining = parseTier(['pelatihan wajib', 'mandatory training', 'q38']);
  const approvedHsePlan = parseTier(['hse plan', 'rencana k3ll', 'q39']);

  const evidenceLink = getAnswer(['bukti', 'link', 'tautan', 'drive', 'q40'], 'https://forms.google.com');
  const evaluatorNotes = getAnswer(['catatan', 'keterangan', 'evaluator'], 'Diimpor otomatis dari Google Forms.');
  const verifiedBy = getAnswer(['diverifikasi', 'auditor', 'hse ru-v'], 'Agung Prasetyo (HSE Officer RU-V)');

  // Compute official Scores & Grade
  const rawFormState = {
    fatalityCompliance,
    ltiCompliance,
    ltifrCompliance,
    trirCompliance,
    hseMeeting,
    hseReporting,
    toolboxMeeting,
    mwt,
    closureFindings,
    inspectionCompliance,
    ppeCompliance,
    housekeepingCompliance,
    ak3Certification,
    safetyOfficerRatioMet,
    healthCheck,
    bpjs,
    dcu,
    pjsmJsa,
    emergencyManagement,
    trainingMatrix,
    mandatoryTraining,
    approvedHsePlan,
  };

  const { laggingScore, leadingScore, calculatedScore, grade } = computeAssessmentScores(rawFormState);

  const timestamp = responseItem.lastSubmittedTime || responseItem.createTime || new Date().toISOString();
  const id = `gform-${responseItem.responseId.slice(-8) || Math.random().toString(36).substr(2, 8)}`;

  return {
    id,
    timestamp,
    workLocation,
    companyName,
    companyLeader,
    reportPeriod,
    hseOfficerName,
    fatality,
    lti,
    rwdc,
    mtc,
    fac,
    nearmiss,
    propertyDamage,
    environmentalIncident,
    ltifr,
    trir,
    pob,
    manHours,
    fatalityCompliance,
    ltiCompliance,
    ltifrCompliance,
    trirCompliance,
    hseMeeting,
    hseReporting,
    toolboxMeeting,
    mwt,
    closureFindings,
    inspectionCompliance,
    ppeCompliance,
    housekeepingCompliance,
    ak3Certification,
    safetyOfficerCount,
    safetyOfficerRatioMet,
    healthCheck,
    bpjs,
    dcu,
    pjsmJsa,
    emergencyManagement,
    trainingMatrix,
    mandatoryTraining,
    approvedHsePlan,
    evidenceLink,
    evaluatorNotes,
    verifiedBy,
    laggingScore,
    leadingScore,
    calculatedScore,
    grade,
  };
}
