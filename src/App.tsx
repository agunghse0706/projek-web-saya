import React, { useState, useEffect } from 'react';
import { HSEAssessmentRecord } from './types/hse';
import { INITIAL_ASSESSMENTS } from './data/initialData';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { AssessmentForm } from './components/AssessmentForm';
import { AssessmentDetailModal } from './components/AssessmentDetailModal';
import { ContractorListView } from './components/ContractorListView';
import { AnalyticsView } from './components/AnalyticsView';
import { GoogleFormsSyncModal } from './components/GoogleFormsSyncModal';
import { exportAssessmentsToCsv } from './utils/exportCsv';
import { CheckCircle2, AlertCircle } from 'lucide-react';

const STORAGE_KEY = 'hse_kpi_assessments_ru5_v1';

export default function App() {
  const [assessments, setAssessments] = useState<HSEAssessmentRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load assessments from localStorage', e);
    }
    return INITIAL_ASSESSMENTS;
  });

  const [currentTab, setCurrentTab] = useState<'dashboard' | 'form' | 'contractors' | 'analytics'>('dashboard');
  const [selectedRecord, setSelectedRecord] = useState<HSEAssessmentRecord | null>(null);
  const [editingRecord, setEditingRecord] = useState<HSEAssessmentRecord | null>(null);
  const [prefilledCompany, setPrefilledCompany] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' } | null>(null);
  const [isGoogleFormsModalOpen, setIsGoogleFormsModalOpen] = useState<boolean>(false);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(assessments));
    } catch (e) {
      console.error('Failed to persist assessments', e);
    }
  }, [assessments]);

  const showToast = (text: string, type: 'success' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleImportGoogleFormsAssessments = (importedRecords: HSEAssessmentRecord[]) => {
    const existingIds = new Set(assessments.map(a => a.id));
    const newRecords = importedRecords.filter(r => !existingIds.has(r.id));
    
    if (newRecords.length === 0) {
      showToast('Semua respon yang dipilih sudah ada di dalam database evaluasi.', 'info');
      return;
    }

    const updated = [...newRecords, ...assessments];
    setAssessments(updated);
    showToast(`${newRecords.length} respon evaluasi dari Google Forms berhasil diimpor!`);
    setCurrentTab('dashboard');
  };

  const handleSaveAssessment = (savedRecord: HSEAssessmentRecord) => {
    const existingIndex = assessments.findIndex(a => a.id === savedRecord.id);
    if (existingIndex >= 0) {
      const updated = [...assessments];
      updated[existingIndex] = savedRecord;
      setAssessments(updated);
      showToast(`Evaluasi K3LL untuk ${savedRecord.companyName} berhasil diperbarui.`);
    } else {
      setAssessments([savedRecord, ...assessments]);
      showToast(`Evaluasi K3LL baru untuk ${savedRecord.companyName} (${savedRecord.reportPeriod}) berhasil disimpan.`);
    }
    setEditingRecord(null);
    setPrefilledCompany(null);
    setCurrentTab('dashboard');
  };

  const handleResetData = () => {
    if (window.confirm('Apakah Anda yakin ingin mengatur ulang data kembali ke dataset contoh awal PT KPI RU-V?')) {
      setAssessments(INITIAL_ASSESSMENTS);
      localStorage.removeItem(STORAGE_KEY);
      showToast('Data berhasil direset ke contoh awal.', 'info');
    }
  };

  const handleExportData = () => {
    exportAssessmentsToCsv(assessments);
    showToast(`${assessments.length} rekaman evaluasi berhasil diekspor ke format CSV/Excel.`);
  };

  const handleNewAssessmentForCompany = (companyName: string) => {
    setPrefilledCompany(companyName);
    setEditingRecord(null);
    setCurrentTab('form');
  };

  const handleEditRecord = (record: HSEAssessmentRecord) => {
    setSelectedRecord(null);
    setEditingRecord(record);
    setCurrentTab('form');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 bg-slate-900 text-white text-xs px-4 py-3 rounded-lg shadow-lg border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Main Header & Nav */}
      <Header
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          if (tab === 'form' && currentTab !== 'form') {
            setEditingRecord(null);
            setPrefilledCompany(null);
          }
          setCurrentTab(tab);
        }}
        onExportData={handleExportData}
        onResetData={handleResetData}
        onOpenGoogleFormsSync={() => setIsGoogleFormsModalOpen(true)}
        recordCount={assessments.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-6">
        {currentTab === 'dashboard' && (
          <DashboardView
            assessments={assessments}
            onViewDetail={(record) => setSelectedRecord(record)}
            onNewAssessment={() => {
              setEditingRecord(null);
              setPrefilledCompany(null);
              setCurrentTab('form');
            }}
          />
        )}

        {currentTab === 'form' && (
          <AssessmentForm
            onSave={handleSaveAssessment}
            onOpenGoogleFormsSync={() => setIsGoogleFormsModalOpen(true)}
            onCancel={() => {
              setEditingRecord(null);
              setPrefilledCompany(null);
              setCurrentTab('dashboard');
            }}
            initialData={
              editingRecord 
                ? editingRecord 
                : prefilledCompany 
                ? ({ companyName: prefilledCompany } as HSEAssessmentRecord) 
                : null
            }
          />
        )}

        {currentTab === 'contractors' && (
          <ContractorListView
            assessments={assessments}
            onSelectContractor={(company) => {
              const latest = assessments.find(a => a.companyName.toLowerCase() === company.toLowerCase());
              if (latest) setSelectedRecord(latest);
            }}
            onNewAssessmentForCompany={handleNewAssessmentForCompany}
            onViewRecord={(record) => setSelectedRecord(record)}
          />
        )}

        {currentTab === 'analytics' && (
          <AnalyticsView assessments={assessments} />
        )}
      </main>

      {/* Detail / Official Evaluation Sheet Modal */}
      {selectedRecord && (
        <AssessmentDetailModal
          record={selectedRecord}
          allAssessments={assessments}
          onClose={() => setSelectedRecord(null)}
          onEdit={handleEditRecord}
        />
      )}

      {/* Google Forms Sync & Import Modal */}
      <GoogleFormsSyncModal
        isOpen={isGoogleFormsModalOpen}
        onClose={() => setIsGoogleFormsModalOpen(false)}
        onImportAssessments={handleImportGoogleFormsAssessments}
        existingAssessmentsCount={assessments.length}
      />

      {/* Bottom Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-auto no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">PT Kilang Pertamina Internasional</span>
            <span>·</span>
            <span>Refinery Unit V Balikpapan (RU-V)</span>
          </div>
          <div>
            <span>Standar Penilaian K3LL Subkontraktor · JANGAN LUPA BAHAGIA....</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
