import { HSEAssessmentRecord, BinaryRating, TierRating, ComplianceStatus } from '../types/hse';

export function calculateLTIFR(ltiCount: number, manHours: number): number {
  if (!manHours || manHours <= 0) return 0;
  return Number(((ltiCount * 1_000_000) / manHours).toFixed(2));
}

export function calculateTRIR(recordableCases: number, manHours: number): number {
  if (!manHours || manHours <= 0) return 0;
  return Number(((recordableCases * 1_000_000) / manHours).toFixed(3));
}

export function getRequiredSafetyman(pob: number): number {
  if (!pob || pob <= 0) return 1;
  return Math.max(1, Math.ceil(pob / 25));
}

export function computeAssessmentScores(record: Partial<HSEAssessmentRecord>): {
  laggingScore: number;
  leadingScore: number;
  calculatedScore: number;
  grade: 'A' | 'B' | 'C' | 'D';
} {
  // 1. Lagging Score (Max 100)
  let laggingPoints = 0;
  if (record.fatalityCompliance === 'Comply') laggingPoints += 35;
  if (record.ltiCompliance === 'Comply') laggingPoints += 35;
  if (record.ltifrCompliance === 'Comply') laggingPoints += 15;
  if (record.trirCompliance === 'Comply') laggingPoints += 15;

  const laggingScore = Math.min(100, Math.max(0, laggingPoints));

  // 2. Leading Score (Max 100)
  let leadingPoints = 0;

  // Binary items (10 items x 5 pts = 50 pts)
  const binaryKeys: (keyof HSEAssessmentRecord)[] = [
    'hseMeeting',
    'hseReporting',
    'toolboxMeeting',
    'mwt',
    'closureFindings',
    'inspectionCompliance',
    'ppeCompliance',
    'housekeepingCompliance',
    'ak3Certification',
    'safetyOfficerRatioMet',
  ];

  binaryKeys.forEach(k => {
    if (record[k] === 'Memenuhi') {
      leadingPoints += 5;
    }
  });

  // Tier items (8 items x 6.25 pts max = 50 pts)
  const tierKeys: (keyof HSEAssessmentRecord)[] = [
    'healthCheck',
    'bpjs',
    'dcu',
    'pjsmJsa',
    'emergencyManagement',
    'trainingMatrix',
    'mandatoryTraining',
    'approvedHsePlan',
  ];

  tierKeys.forEach(k => {
    const val = record[k] as TierRating | undefined;
    if (val === 'Baik') leadingPoints += 6.25;
    else if (val === 'Diterima') leadingPoints += 4.375;
    else if (val === 'Buruk') leadingPoints += 1.25;
  });

  const leadingScore = Math.round(leadingPoints);

  // 3. Overall Weighted Score (35% Lagging + 65% Leading)
  let overall = Math.round((laggingScore * 0.35) + (leadingScore * 0.65));

  // Immediate sanction if Fatality or LTI occurred
  if ((record.fatality && record.fatality > 0) || record.fatalityCompliance === 'Non Comply') {
    overall = Math.min(overall, 49); // Cap to D
  } else if ((record.lti && record.lti > 0) || record.ltiCompliance === 'Non Comply') {
    overall = Math.min(overall, 65); // Cap to C
  }

  // Determine Grade
  let grade: 'A' | 'B' | 'C' | 'D' = 'D';
  if (overall >= 85) grade = 'A';
  else if (overall >= 70) grade = 'B';
  else if (overall >= 55) grade = 'C';
  else grade = 'D';

  return {
    laggingScore,
    leadingScore,
    calculatedScore: overall,
    grade,
  };
}

export function getGradeLabel(grade: 'A' | 'B' | 'C' | 'D'): { text: string; description: string; color: string } {
  switch (grade) {
    case 'A':
      return {
        text: 'Grade A (Sangat Baik)',
        description: 'Kinerja K3LL Unggul & Patuh Penuh terhadap Standar PT KPI RU-V',
        color: 'text-emerald-700',
      };
    case 'B':
      return {
        text: 'Grade B (Baik)',
        description: 'Memenuhi seluruh kriteria dasar K3LL dengan pemenuhan target',
        color: 'text-blue-700',
      };
    case 'C':
      return {
        text: 'Grade C (Perlu Pembinaan)',
        description: 'Terdapat gap kepatuhan leading indicator, perlu tindakan korektif',
        color: 'text-amber-700',
      };
    case 'D':
      return {
        text: 'Grade D (Kritis / Non-Comply)',
        description: 'Insiden fatalitas/LTI atau ketidakpatuhan mayor, evaluasi CSMS',
        color: 'text-rose-700',
      };
  }
}
