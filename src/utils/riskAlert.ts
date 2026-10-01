import { HSEAssessmentRecord } from '../types/hse';

export interface ContractorRiskAlert {
  companyName: string;
  workLocation: string;
  currentRecord: HSEAssessmentRecord;
  previousRecord: HSEAssessmentRecord;
  previousPeriod: string;
  currentPeriod: string;
  previousScore: number;
  currentScore: number;
  scoreDrop: number; // Positive number representing the drop, e.g., 26 for -26%
  scoreChange: number; // Signed number, e.g., -26
  reasons: string[];
  severity: 'high' | 'critical';
}

const PERIOD_ORDER: Record<string, number> = {
  'Desember 23': 202312,
  'Januari 24': 202401,
  'Februari 24': 202402,
  'Maret 24': 202403,
  'April 24': 202404,
  'Mei 24': 202405,
  'Juni 24': 202406,
};

function getPeriodWeight(record: HSEAssessmentRecord): number {
  if (PERIOD_ORDER[record.reportPeriod]) {
    return PERIOD_ORDER[record.reportPeriod];
  }
  const time = new Date(record.timestamp).getTime();
  return isNaN(time) ? 0 : time;
}

/**
 * Identifies all contractors whose KPI scores have dropped by more than 15%
 * compared to their previous assessment period.
 */
export function identifyRiskAlerts(
  assessments: HSEAssessmentRecord[],
  targetPeriod?: string
): ContractorRiskAlert[] {
  // Group assessments by company
  const companyGroups = new Map<string, HSEAssessmentRecord[]>();

  assessments.forEach(rec => {
    const key = rec.companyName.trim().toLowerCase();
    if (!companyGroups.has(key)) {
      companyGroups.set(key, []);
    }
    companyGroups.get(key)!.push(rec);
  });

  const alerts: ContractorRiskAlert[] = [];

  companyGroups.forEach((records) => {
    if (records.length < 2) return;

    // Sort chronologically ascending
    const sorted = [...records].sort((a, b) => getPeriodWeight(a) - getPeriodWeight(b));

    // Find comparison pair
    let currentRec: HSEAssessmentRecord;
    let prevRec: HSEAssessmentRecord;

    if (targetPeriod && targetPeriod !== 'Semua') {
      const targetIdx = sorted.findIndex(r => r.reportPeriod === targetPeriod);
      if (targetIdx <= 0) return; // No previous record for this period
      currentRec = sorted[targetIdx];
      prevRec = sorted[targetIdx - 1];
    } else {
      // Compare the two most recent records
      currentRec = sorted[sorted.length - 1];
      prevRec = sorted[sorted.length - 2];
    }

    const drop = prevRec.calculatedScore - currentRec.calculatedScore;

    // Threshold: dropped by MORE THAN 15%
    if (drop > 15) {
      const reasons: string[] = [];

      // Detect drivers of the drop
      if (currentRec.fatality > prevRec.fatality) {
        reasons.push(`Terjadi ${currentRec.fatality} kasus Fatalitas`);
      }
      if (currentRec.lti > prevRec.lti) {
        reasons.push(`Terjadi ${currentRec.lti} kasus Lost Time Incident (LTI)`);
      }
      if (currentRec.rwdc > prevRec.rwdc || currentRec.mtc > prevRec.mtc) {
        reasons.push(`Terjadi ${currentRec.rwdc + currentRec.mtc} kasus kecelakaan kerja (RWDC/MTC)`);
      }
      if (currentRec.trir > prevRec.trir && currentRec.trir > 0.09) {
        reasons.push(`TRIR melonjak menjadi ${currentRec.trir} (melebihi batas aman 0.09)`);
      }
      if (currentRec.housekeepingCompliance === 'Tidak Memenuhi' && prevRec.housekeepingCompliance === 'Memenuhi') {
        reasons.push('Kepatuhan Tata Graha (Housekeeping) turun ke Tidak Memenuhi');
      }
      if (currentRec.mwt === 'Tidak Memenuhi' && prevRec.mwt === 'Memenuhi') {
        reasons.push('MWT Manager Level tidak terlaksana');
      }
      if (currentRec.inspectionCompliance === 'Tidak Memenuhi' && prevRec.inspectionCompliance === 'Memenuhi') {
        reasons.push('Inspeksi perkakas & valid color coding tidak memenuhi standar');
      }
      if (currentRec.closureFindings === 'Tidak Memenuhi' && prevRec.closureFindings === 'Memenuhi') {
        reasons.push('Tindakan penutupan temuan inspeksi belum selesai (pending)');
      }
      if (currentRec.safetyOfficerRatioMet === 'Tidak Memenuhi' && prevRec.safetyOfficerRatioMet === 'Memenuhi') {
        reasons.push('Rasio safetyman kurang dari standar 1:25 pekerja');
      }
      if (currentRec.emergencyManagement === 'Buruk' && prevRec.emergencyManagement !== 'Buruk') {
        reasons.push('Kesiapsiagaan tanggap darurat & drill dinilai Buruk');
      }
      if (currentRec.dcu === 'Buruk' || (currentRec.dcu === 'Diterima' && prevRec.dcu === 'Baik')) {
        reasons.push('Penurunan kualitas pemeriksaan harian (Daily Check Up)');
      }
      if (reasons.length === 0) {
        reasons.push(`Penurunan skor Leading (-${prevRec.leadingScore - currentRec.leadingScore} poin) atau Lagging (-${prevRec.laggingScore - currentRec.laggingScore} poin)`);
      }

      const severity: 'high' | 'critical' = 
        (drop >= 25 || currentRec.fatality > 0 || currentRec.lti > 0 || currentRec.trir > 0.09)
          ? 'critical'
          : 'high';

      alerts.push({
        companyName: currentRec.companyName,
        workLocation: currentRec.workLocation,
        currentRecord: currentRec,
        previousRecord: prevRec,
        previousPeriod: prevRec.reportPeriod,
        currentPeriod: currentRec.reportPeriod,
        previousScore: prevRec.calculatedScore,
        currentScore: currentRec.calculatedScore,
        scoreDrop: drop,
        scoreChange: -drop,
        reasons,
        severity,
      });
    }
  });

  // Sort by biggest score drop first
  return alerts.sort((a, b) => b.scoreDrop - a.scoreDrop);
}

/**
 * Check if a specific record represents a >15% drop compared to its preceding record
 */
export function getRecordRiskDrop(
  record: HSEAssessmentRecord,
  allAssessments: HSEAssessmentRecord[]
): { hasDrop: boolean; previousRecord?: HSEAssessmentRecord; dropAmount?: number } {
  const companyRecords = allAssessments
    .filter(a => a.companyName.trim().toLowerCase() === record.companyName.trim().toLowerCase())
    .sort((a, b) => getPeriodWeight(a) - getPeriodWeight(b));

  const idx = companyRecords.findIndex(r => r.id === record.id);
  if (idx > 0) {
    const prev = companyRecords[idx - 1];
    const drop = prev.calculatedScore - record.calculatedScore;
    if (drop > 15) {
      return { hasDrop: true, previousRecord: prev, dropAmount: drop };
    }
  }

  return { hasDrop: false };
}
