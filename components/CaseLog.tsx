import React, { useState } from 'react';
import { CaseLogEntry } from '../types';
import { Plus, Edit2, Trash2, Activity, GraduationCap, Stethoscope, FileText, AlertTriangle, ThumbsUp, ThumbsDown, User, Building2, Download } from 'lucide-react';
import { Modal } from './ui/Modal';
import { InputGroup, inputClasses } from './ui/InputGroup';
import { jsPDF } from "jspdf";

interface CaseLogProps {
  caseLog: CaseLogEntry[];
  updateCaseLog: (caseLog: CaseLogEntry[]) => void;
}

const DEFAULT_FORM: Partial<CaseLogEntry> = { 
    caseNumber: '', 
    title: '', 
    status: 'open', 
    dateOpened: new Date().toISOString().split('T')[0],
    
    patientAge: '',
    patientGender: '',
    hospital: '',
    diagnosis: '',
    
    hgb: '',
    platelets: '',
    physicianName: '',
    
    physicianCooperation: 'unknown',
    treatmentsUsed: '',
    articlesUsed: '',
    
    successes: '',
    challenges: '',
    trainingNeeds: '',
    notes: '' 
};

export const CaseLogSection: React.FC<CaseLogProps> = ({ caseLog, updateCaseLog }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<CaseLogEntry | null>(null);
  const [formData, setFormData] = useState<Partial<CaseLogEntry>>(DEFAULT_FORM);

  const handleEdit = (item: CaseLogEntry) => {
    setFormData(item);
    setEditingItem(item);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this case log?')) {
      updateCaseLog(caseLog.filter(c => c.id !== id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      updateCaseLog(caseLog.map(c => c.id === editingItem.id ? { ...formData as CaseLogEntry, id: editingItem.id } : c));
    } else {
      updateCaseLog([...caseLog, { ...formData as CaseLogEntry, id: Date.now().toString() }]);
    }
    setShowForm(false);
    setEditingItem(null);
    setFormData(DEFAULT_FORM);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-100/50 text-red-600 border-red-200';
      case 'pending': return 'bg-amber-100/50 text-amber-600 border-amber-200';
      case 'closed': return 'bg-gray-100 text-gray-500 border-gray-200';
      default: return 'bg-gray-100 text-gray-500';
    }
  };

  const getCooperationIcon = (status?: string) => {
      switch(status) {
          case 'cooperative': return <ThumbsUp size={14} className="text-green-600" />;
          case 'hostile': return <ThumbsDown size={14} className="text-red-500" />;
          case 'neutral': return <Activity size={14} className="text-amber-500" />;
          default: return <Activity size={14} className="text-subtle" />;
      }
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    let y = 20;

    const checkPageBreak = (height: number) => {
        if (y + height > 280) {
            doc.addPage();
            y = 20;
        }
    }

    // Title
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("HLC Lessons Learned Report", pageWidth / 2, y, { align: "center" });
    y += 10;
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, y, { align: "center" });
    y += 15;

    if (caseLog.length === 0) {
        doc.text("No cases to report.", margin, y);
    }

    caseLog.forEach(item => {
        checkPageBreak(50); // Initial check for header block

        // Case Header Box
        doc.setFillColor(245, 245, 245);
        doc.setDrawColor(220, 220, 220);
        doc.rect(margin, y, pageWidth - (margin * 2), 14, "FD");
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        const titleText = `${item.caseNumber ? item.caseNumber + ' - ' : ''}${item.title}`;
        doc.text(titleText, margin + 4, y + 9);
        
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.text(item.dateOpened, pageWidth - margin - 4, y + 9, { align: "right" });
        
        y += 20;
        
        // Clinical Context Row
        doc.setFont("helvetica", "bold");
        doc.text("Context:", margin, y);
        doc.setFont("helvetica", "normal");
        const contextText = `${item.hospital || 'Hospital N/A'}  |  Dr. ${item.physicianName || 'N/A'}  |  Age: ${item.patientAge || '?'} ${item.patientGender || ''}`;
        doc.text(contextText, margin + 25, y);
        y += 6;

        if (item.diagnosis) {
             const diagText = `Diagnosis: ${item.diagnosis}`;
             const splitDiag = doc.splitTextToSize(diagText, pageWidth - margin - 25);
             checkPageBreak(splitDiag.length * 5);
             doc.text(splitDiag, margin + 25, y);
             y += (splitDiag.length * 5) + 2;
        }

        // Labs
        if (item.hgb || item.platelets) {
             doc.setFont("helvetica", "bold");
             doc.text("Labs:", margin, y);
             doc.setFont("helvetica", "normal");
             doc.text(`Hemoglobin: ${item.hgb || '--'} g/dL   Platelets: ${item.platelets || '--'}`, margin + 25, y);
             y += 6;
        }

        y += 2;

        // Treatments & Strategies
        if (item.treatmentsUsed || item.articlesUsed) {
            checkPageBreak(30);
            doc.setFillColor(240, 248, 255); // Light blue tint
            doc.rect(margin, y, pageWidth - (margin * 2), 6, "F");
            doc.setFont("helvetica", "bold");
            doc.text("Interventions & Medical Strategies", margin + 2, y + 4);
            y += 8;

            doc.setFont("helvetica", "normal");
            if (item.treatmentsUsed) {
                const prefix = "Treatments: ";
                const text = doc.splitTextToSize(prefix + item.treatmentsUsed, pageWidth - (margin * 2));
                checkPageBreak(text.length * 5);
                doc.text(text, margin, y);
                y += (text.length * 5);
            }
            if (item.articlesUsed) {
                const prefix = "Articles: ";
                const text = doc.splitTextToSize(prefix + item.articlesUsed, pageWidth - (margin * 2));
                checkPageBreak(text.length * 5);
                doc.text(text, margin, y);
                y += (text.length * 5);
            }
            y += 4;
        }

        // LESSONS LEARNED SECTION
        checkPageBreak(40);
        doc.setFillColor(255, 250, 240); // Light orange tint
        doc.rect(margin, y, pageWidth - (margin * 2), 6, "F");
        doc.setFont("helvetica", "bold");
        doc.text("Lessons Learned / Retrospective", margin + 2, y + 4);
        y += 8;

        doc.setFont("helvetica", "normal");
        
        // Physician Rating
        if (item.physicianCooperation) {
             doc.text(`Physician Cooperation: ${item.physicianCooperation.toUpperCase()}`, margin, y);
             y += 6;
        }

        const printSection = (label: string, content: string | undefined) => {
            if (!content) return;
            const prefix = label;
            const fullText = prefix + content;
            const lines = doc.splitTextToSize(fullText, pageWidth - (margin * 2));
            checkPageBreak(lines.length * 5);
            doc.text(lines, margin, y);
            y += (lines.length * 5) + 2;
        };

        printSection("(+) What worked well: ", item.successes);
        printSection("(-) Challenges faced: ", item.challenges);
        printSection("(!) Training Opportunities: ", item.trainingNeeds);

        y += 8;
        doc.setDrawColor(200);
        doc.line(margin, y, pageWidth - margin, y);
        y += 8;
    });

    doc.save("HLC_Lessons_Learned_Report.pdf");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-sand">
        <div>
          <h2 className="text-3xl font-bold text-ink">Case Log & Lessons Learned</h2>
          <p className="text-subtle mt-1">Retrospective analysis based on HLC-7 worksheets</p>
        </div>
        <div className="flex gap-3">
             <button 
                onClick={handleExportPDF}
                className="flex items-center justify-center bg-white text-ink border border-sand w-12 h-12 rounded-xl hover:bg-taupe transition-colors shadow-sm"
                title="Generate PDF Report"
             >
                <Download size={22} />
             </button>
            <button 
            onClick={() => { setFormData(DEFAULT_FORM); setEditingItem(null); setShowForm(true); }}
            className="flex items-center gap-2 bg-clay text-white px-5 py-3 rounded-xl font-semibold hover:bg-clay/90 transition-colors shadow-sm"
            >
            <Plus size={18} /> New Case Log
            </button>
        </div>
      </div>

      {showForm && (
        <Modal title={editingItem ? 'Edit Case Review' : 'New Case Review'} onClose={() => setShowForm(false)}>
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* --- SECTION 1: PROFILE --- */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-clay font-serif italic border-b border-sand/50 pb-2">
                    <User size={18} />
                    <h4>Case Profile</h4>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="col-span-2 md:col-span-1">
                        <InputGroup label="Case #">
                            <input className={inputClasses.base} value={formData.caseNumber} onChange={e => setFormData({...formData, caseNumber: e.target.value})} placeholder="YYYY-001" />
                        </InputGroup>
                    </div>
                    <div className="col-span-2 md:col-span-1">
                        <InputGroup label="Date">
                            <input type="date" className={inputClasses.base} value={formData.dateOpened} onChange={e => setFormData({...formData, dateOpened: e.target.value})} />
                        </InputGroup>
                    </div>
                    <div className="col-span-2">
                        <InputGroup label="Status">
                            <select className={inputClasses.select} value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})}>
                            <option value="open">Active / Open</option>
                            <option value="pending">Pending Review</option>
                            <option value="closed">Closed</option>
                            </select>
                        </InputGroup>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputGroup label="Patient Name / Ref">
                        <input className={inputClasses.base} value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Patient Name" />
                    </InputGroup>
                    <InputGroup label="Hospital">
                        <input className={inputClasses.base} value={formData.hospital} onChange={e => setFormData({...formData, hospital: e.target.value})} placeholder="Hospital Name" />
                    </InputGroup>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <InputGroup label="Age">
                        <input className={inputClasses.base} value={formData.patientAge} onChange={e => setFormData({...formData, patientAge: e.target.value})} placeholder="e.g. 45" />
                    </InputGroup>
                    <InputGroup label="Gender">
                         <select className={inputClasses.select} value={formData.patientGender} onChange={e => setFormData({...formData, patientGender: e.target.value})}>
                            <option value="">Select...</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                        </select>
                    </InputGroup>
                    <InputGroup label="Physician">
                        <input className={inputClasses.base} value={formData.physicianName} onChange={e => setFormData({...formData, physicianName: e.target.value})} placeholder="Attending Dr." />
                    </InputGroup>
                </div>
            </div>

            {/* --- SECTION 2: CLINICAL CONTEXT --- */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-clay font-serif italic border-b border-sand/50 pb-2">
                    <Stethoscope size={18} />
                    <h4>Clinical Context (HLC-7 Data)</h4>
                </div>
                
                <InputGroup label="Diagnosis / Problem">
                    <textarea className={inputClasses.textarea} rows={2} style={{minHeight: '80px'}} value={formData.diagnosis} onChange={e => setFormData({...formData, diagnosis: e.target.value})} placeholder="What was the medical diagnosis? Why was blood an issue?" />
                </InputGroup>

                <div className="grid grid-cols-2 gap-4">
                    <InputGroup label="Hgb (g/dL)">
                        <input className={inputClasses.base} value={formData.hgb} onChange={e => setFormData({...formData, hgb: e.target.value})} placeholder="e.g. 7.5" />
                    </InputGroup>
                    <InputGroup label="Platelets (Plts/µL)">
                        <input className={inputClasses.base} value={formData.platelets} onChange={e => setFormData({...formData, platelets: e.target.value})} placeholder="e.g. 150k" />
                    </InputGroup>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputGroup label="Treatments / Strategies Used">
                        <textarea className={inputClasses.textarea} rows={3} style={{minHeight: '100px'}} value={formData.treatmentsUsed} onChange={e => setFormData({...formData, treatmentsUsed: e.target.value})} placeholder="EPO, Iron, Cell Salvage, etc..." />
                    </InputGroup>
                    <InputGroup label="Articles / Case Studies Used">
                        <textarea className={inputClasses.textarea} rows={3} style={{minHeight: '100px'}} value={formData.articlesUsed} onChange={e => setFormData({...formData, articlesUsed: e.target.value})} placeholder="Which articles proved beneficial?" />
                    </InputGroup>
                </div>
            </div>

            {/* --- SECTION 3: RETROSPECTIVE --- */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-clay font-serif italic border-b border-sand/50 pb-2">
                    <GraduationCap size={18} />
                    <h4>Retrospective: Lessons Learned</h4>
                </div>

                <div className="bg-taupe/30 p-4 rounded-xl border border-sand/50 mb-2">
                    <label className="block text-xs font-bold text-subtle uppercase tracking-widest mb-3">Physician Cooperation</label>
                    <div className="flex gap-4">
                        {['cooperative', 'neutral', 'hostile'].map(status => (
                            <label key={status} className="flex items-center gap-2 cursor-pointer">
                                <input 
                                    type="radio" 
                                    name="coop" 
                                    checked={formData.physicianCooperation === status} 
                                    onChange={() => setFormData({...formData, physicianCooperation: status as any})}
                                    className="text-clay focus:ring-clay"
                                />
                                <span className="text-sm font-medium text-ink capitalize">{status}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <InputGroup label="The Good: What worked well?">
                    <textarea 
                        className={inputClasses.textarea} 
                        value={formData.successes} 
                        onChange={e => setFormData({...formData, successes: e.target.value})} 
                        placeholder="Was the doctor impressed by a specific article? Did the transfer go smoothly?"
                    />
                </InputGroup>

                <InputGroup label="The Ugly: Challenges & Issues">
                    <textarea 
                        className={inputClasses.textarea} 
                        value={formData.challenges} 
                        onChange={e => setFormData({...formData, challenges: e.target.value})} 
                        placeholder="What were the barriers? Hostile staff? Delayed notification?"
                    />
                </InputGroup>

                <InputGroup label="Training Opportunities">
                    <textarea 
                        className={inputClasses.textarea} 
                        value={formData.trainingNeeds} 
                        onChange={e => setFormData({...formData, trainingNeeds: e.target.value})} 
                        placeholder="What should the committee study based on this experience?"
                    />
                </InputGroup>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-sand/50">
              <button 
                type="button" 
                onClick={() => setShowForm(false)}
                className="px-6 py-3 rounded-xl border border-sand/50 font-semibold text-subtle hover:bg-taupe transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="px-6 py-3 rounded-xl bg-clay text-white font-semibold hover:bg-clay/90 transition-colors shadow-sm"
              >
                {editingItem ? 'Save Log' : 'Create Log'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {caseLog.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-sand/50 rounded-2xl">
          <Activity className="w-12 h-12 text-subtle/50 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-ink mb-2">No case logs found</h3>
          <p className="text-subtle">Start a "Lessons Learned" log from your HLC-7 worksheets.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {caseLog.map(item => (
            <div key={item.id} className="bg-white rounded-2xl p-6 shadow-sm border border-transparent hover:border-sand hover:shadow-apple-card transition-all duration-300 flex flex-col h-full">
              
              {/* Header */}
              <div className="flex justify-between items-start mb-4 pb-4 border-b border-sand/30">
                <div>
                   <div className="flex items-center gap-3 mb-2">
                     <span className={`px-2 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase border ${getStatusColor(item.status)}`}>
                       {item.status}
                     </span>
                     <span className="font-mono text-xs text-subtle">#{item.caseNumber}</span>
                     <span className="text-xs text-subtle">• {new Date(item.dateOpened).toLocaleDateString()}</span>
                   </div>
                   <h3 className="text-xl font-bold text-ink">{item.title}</h3>
                   <div className="flex items-center gap-2 text-sm text-subtle mt-1">
                      {item.hospital && <span className="flex items-center gap-1"><Building2 size={12}/> {item.hospital}</span>}
                      {item.physicianName && <span className="flex items-center gap-1 ml-2"><Stethoscope size={12}/> {item.physicianName}</span>}
                   </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(item)} className="p-2 text-subtle hover:bg-taupe rounded-lg transition-colors"><Edit2 size={18} /></button>
                  <button onClick={() => handleDelete(item.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={18} /></button>
                </div>
              </div>

              {/* Body */}
              <div className="space-y-4 flex-1">
                  {/* Diagnosis */}
                  {item.diagnosis && (
                      <div className="bg-taupe/30 p-3 rounded-xl">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-subtle block mb-1">Diagnosis</span>
                          <p className="text-sm font-medium text-ink leading-snug">{item.diagnosis}</p>
                      </div>
                  )}

                  {/* Labs Snapshot */}
                  {(item.hgb || item.platelets) && (
                      <div className="flex gap-4 text-sm">
                          {item.hgb && <div className="px-3 py-1 bg-red-50 text-red-800 rounded-lg border border-red-100 font-mono text-xs">Hgb: {item.hgb}</div>}
                          {item.platelets && <div className="px-3 py-1 bg-blue-50 text-blue-800 rounded-lg border border-blue-100 font-mono text-xs">Plt: {item.platelets}</div>}
                      </div>
                  )}
                  
                  {/* Retrospective Snapshot */}
                  <div className="pt-2">
                       <div className="text-[10px] font-bold uppercase tracking-wider text-subtle mb-2 flex items-center gap-2">
                          <GraduationCap size={12} /> Lessons Learned
                       </div>
                       
                       {/* Physician Rating */}
                       {item.physicianCooperation && item.physicianCooperation !== 'unknown' && (
                           <div className="flex items-center gap-2 mb-2 text-xs font-semibold">
                               Dr. Cooperation: 
                               <span className="flex items-center gap-1 capitalize">
                                   {getCooperationIcon(item.physicianCooperation)} {item.physicianCooperation}
                               </span>
                           </div>
                       )}

                       {/* Successes */}
                       {item.successes && (
                           <div className="flex gap-2 items-start mb-2">
                               <ThumbsUp size={14} className="text-green-600 mt-0.5 shrink-0" />
                               <p className="text-xs text-subtle line-clamp-2">{item.successes}</p>
                           </div>
                       )}
                       
                       {/* Challenges */}
                       {item.challenges && (
                           <div className="flex gap-2 items-start">
                               <AlertTriangle size={14} className="text-amber-500 mt-0.5 shrink-0" />
                               <p className="text-xs text-subtle line-clamp-2">{item.challenges}</p>
                           </div>
                       )}
                  </div>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
};