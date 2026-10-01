import { HSEAssessmentRecord } from '../types/hse';

export function exportAssessmentsToCsv(records: HSEAssessmentRecord[]) {
  if (!records || records.length === 0) {
    alert('Tidak ada data yang dapat diekspor.');
    return;
  }

  const headers = [
    'ID',
    'Tanggal Input',
    '1. Lokasi Kerja',
    '2. Nama Perusahaan',
    '3. Nama Pimpinan',
    '4. Periode Laporan',
    '5. Nama HSE Officer',
    '6. Fatality',
    '7. LTI',
    '8. RWDC',
    '9. MTC',
    '10. FAC',
    '11. Nearmiss',
    '12. Property Damage',
    '13. Environmental Incident',
    '14. LTIFR',
    '15. TRIR',
    '16. POB',
    '17. Man Hours',
    '18. Fatality Comply',
    '19. LTI Comply',
    '20. LTIFR Comply',
    '21. TRIR Comply',
    '22. HSE Meeting',
    '23. HSE Reporting',
    '24. Toolbox Meeting',
    '25. MWT Manager Level',
    '26. Penutupan Temuan',
    '27. Kepatuhan Inspeksi',
    '28. Kepatuhan APD',
    '29. Tata Graha',
    '30. Sertifikat AK3 Umum',
    '31. Jumlah Safetyman',
    '31b. Rasio Safetyman',
    '32. Pemeriksaan Kesehatan',
    '33. BPJS',
    '34. DCU',
    '35. Sosialisasi PJSM JSA',
    '36. Tanggap Darurat',
    '37. Matriks Pelatihan',
    '38. Pelatihan Wajib KPI RU-V',
    '39. HSE Plan Disetujui',
    '40. Tautan Bukti',
    'Skor Lagging',
    'Skor Leading',
    'Total Skor KPI (%)',
    'Grade',
    'Catatan Evaluator',
    'Diverifikasi Oleh'
  ];

  const rows = records.map(r => [
    r.id,
    new Date(r.timestamp).toISOString(),
    `"${r.workLocation}"`,
    `"${r.companyName}"`,
    `"${r.companyLeader}"`,
    `"${r.reportPeriod}"`,
    `"${r.hseOfficerName}"`,
    r.fatality,
    r.lti,
    r.rwdc,
    r.mtc,
    r.fac,
    r.nearmiss,
    r.propertyDamage,
    r.environmentalIncident,
    r.ltifr,
    r.trir,
    r.pob,
    r.manHours,
    r.fatalityCompliance,
    r.ltiCompliance,
    r.ltifrCompliance,
    r.trirCompliance,
    r.hseMeeting,
    r.hseReporting,
    r.toolboxMeeting,
    r.mwt,
    r.closureFindings,
    r.inspectionCompliance,
    r.ppeCompliance,
    r.housekeepingCompliance,
    r.ak3Certification,
    r.safetyOfficerCount,
    r.safetyOfficerRatioMet,
    r.healthCheck,
    r.bpjs,
    r.dcu,
    r.pjsmJsa,
    r.emergencyManagement,
    r.trainingMatrix,
    r.mandatoryTraining,
    r.approvedHsePlan,
    `"${r.evidenceLink || ''}"`,
    r.laggingScore,
    r.leadingScore,
    r.calculatedScore,
    r.grade,
    `"${(r.evaluatorNotes || '').replace(/"/g, '""')}"`,
    `"${r.verifiedBy || ''}"`
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + 
    [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `HSE_KPI_Assessment_RU_V_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
