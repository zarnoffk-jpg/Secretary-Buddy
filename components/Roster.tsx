import React, { useState, useEffect } from 'react';
import { CommitteeMember } from '../types';
import { Plus, Edit2, Trash2, Users, FileText, Printer, Search, User, Mail, Phone, MapPin, Calendar, Heart, Briefcase, FileSignature, AlertTriangle } from 'lucide-react';
import { Modal } from './ui/Modal';
import { jsPDF } from "jspdf";
import { InputGroup, inputClasses } from './ui/InputGroup';

interface RosterProps {
  roster: CommitteeMember[];
  updateRoster: (roster: CommitteeMember[]) => void;
}

const DEFAULT_FORM: Partial<CommitteeMember> = {
  firstName: '',
  lastName: '',
  group: 'HLC',
  role: '',
  email: '',
  homePhone: '',
  mobilePhone: '',
  gender: '',
  congregation: '',
  address: '',
  city: '',
  province: '',
  postalCode: '',
  country: '',
  comments: '',
  // Recommendation fields
  jwpubEmail: '',
  medicalEmail: '',
  languages: '',
  congregationNumber: '',
  circuitOverseer: '',
  dob: '',
  dateBaptism: '',
  dateElder: '',
  otherResponsibilities: '',
  onPVG: false,
  familyObligations: '',
  secularObligations: '',
  recommendationReason: ''
};

export const RosterSection: React.FC<RosterProps> = ({ roster, updateRoster }) => {
  const [activeGroup, setActiveGroup] = useState<'HLC' | 'PVG' | 'Recommendation'>('HLC');
  const [showForm, setShowForm] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportSearch, setExportSearch] = useState('');
  const [editingItem, setEditingItem] = useState<CommitteeMember | null>(null);
  const [formData, setFormData] = useState<Partial<CommitteeMember>>(DEFAULT_FORM);

  useEffect(() => {
    let hasChanges = false;
    const migratedRoster = roster.map(member => {
      let needsUpdate = false;
      const updates: any = {};

      if (!member.firstName && member.name) {
        const parts = member.name.split(' ');
        updates.firstName = parts[0];
        updates.lastName = parts.slice(1).join(' ');
        needsUpdate = true;
      }
      if (!member.group) {
        updates.group = 'HLC';
        needsUpdate = true;
      }
      if (!member.role && member.position) {
        updates.role = member.position;
        needsUpdate = true;
      }

      if (needsUpdate) {
        hasChanges = true;
        return { ...member, ...updates };
      }
      return member;
    });

    if (hasChanges) {
      updateRoster(migratedRoster);
    }
  }, [roster, updateRoster]);

  const handleEdit = (item: CommitteeMember) => {
    setFormData(item);
    setEditingItem(item);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Remove from list?')) {
      updateRoster(roster.filter(r => r.id !== id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalData = {
        ...formData,
        name: `${formData.firstName} ${formData.lastName}`.trim() 
    } as CommitteeMember;

    if (editingItem) {
      updateRoster(roster.map(r => r.id === editingItem.id ? { ...finalData, id: editingItem.id } : r));
    } else {
      updateRoster([...roster, { ...finalData, id: Date.now().toString() }]);
    }
    setShowForm(false);
    setEditingItem(null);
    setFormData(DEFAULT_FORM);
  };

  const filteredMembers = roster.filter(m => (m.group || 'HLC') === activeGroup);

  // ----------------------------------------------------------------------
  // PDF GENERATION: HLC-31 (Contact Info)
  // ----------------------------------------------------------------------
  const generateContactPDF = (member: CommitteeMember) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("HOSPITAL LIAISON COMMITTEE CONTACT INFORMATION", pageWidth / 2, 20, { align: "center" });
    
    doc.setDrawColor(0);
    doc.setFillColor(240, 240, 240);
    
    let y = 30;
    doc.rect(14, y, pageWidth - 28, 7, "F"); 
    doc.rect(14, y, pageWidth - 28, 45); 
    doc.setFontSize(10);
    doc.text("SECTION 1", 16, y + 5);
    
    y += 7;
    doc.line(14, y, pageWidth - 14, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.text("This form is being used to: (Check one.)", 16, y);
    doc.text("Type of contact: (Check all that apply.)", 100, y);
    
    y += 6;
    doc.rect(16, y - 4, 3, 3); doc.text("Update contact information", 21, y - 1);
    doc.rect(100, y - 4, 3, 3); doc.text("Cooperative doctor", 105, y - 1);
    y += 6;
    doc.rect(16, y - 4, 3, 3); doc.text("New contact", 21, y - 1);
    doc.rect(100, y - 4, 3, 3); doc.text("Consulting doctor", 105, y - 1);
    y += 6;
    doc.rect(100, y - 4, 3, 3); doc.text("One of Jehovah's Witnesses", 105, y - 1);
    y += 6;
    doc.rect(100, y - 4, 3, 3, "FD"); // Filled check for HLC Member
    doc.text("HLC member, PVG member, or support staff", 105, y - 1);

    y += 10;
    doc.line(14, y, pageWidth - 14, y);
    doc.text("Comments: " + (member.comments || ""), 16, y + 5);
    
    y = 80;
    doc.rect(14, y, pageWidth - 28, 7, "F"); 
    doc.rect(14, y, pageWidth - 28, 90); 
    doc.setFont("helvetica", "bold");
    doc.text("SECTION 2: CONTACT DETAILS", 16, y + 5);
    
    y += 7; 
    const rowHeight = 9;
    const col1X = 16;
    const col2X = 105;
    
    const drawRowLine = (yPos: number) => doc.line(14, yPos, pageWidth - 14, yPos);
    doc.line(100, y, 100, y + (rowHeight * 6)); 

    doc.setFont("helvetica", "normal");
    
    doc.text(`First name: ${member.firstName || ''}`, col1X, y + 6);
    doc.text(`Address: ${member.address || ''}`, col2X, y + 6);
    y += rowHeight; drawRowLine(y);
    
    doc.text(`Last name: ${member.lastName || ''}`, col1X, y + 6);
    doc.text("", col2X, y + 6); 
    y += rowHeight; drawRowLine(y);
    
    doc.text(`Home telephone: ${member.homePhone || ''}`, col1X, y + 6);
    doc.text(`City: ${member.city || ''}`, col2X, y + 6);
    y += rowHeight; drawRowLine(y);
    
    doc.text(`Mobile telephone: ${member.mobilePhone || ''}`, col1X, y + 6);
    doc.text(`Province or state: ${member.province || ''}`, col2X, y + 6);
    doc.text(`Post Code: ${member.postalCode || ''}`, col2X + 50, y + 6);
    doc.line(col2X + 48, y - rowHeight, col2X + 48, y); 
    y += rowHeight; drawRowLine(y);
    
    doc.text(`Email address: ${member.email || ''}`, col1X, y + 6);
    doc.text(`Country: ${member.country || ''}`, col2X, y + 6);
    y += rowHeight; drawRowLine(y);
    
    doc.text(`Gender: ${member.gender || ''}`, col1X, y + 6);
    y += rowHeight; drawRowLine(y);
    
    doc.text(`Congregation: ${member.congregation || ''}`, col1X, y + 6);

    y = 180;
    doc.setFontSize(8);
    doc.text("hlc-31-E", 14, 280);

    doc.save(`HLC31_${member.lastName}_${member.firstName}.pdf`);
  };

  // ----------------------------------------------------------------------
  // PDF GENERATION: HLC-21 (Recommendation)
  // ----------------------------------------------------------------------
  const generateRecommendationPDF = (member: CommitteeMember) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    const contentWidth = pageWidth - (margin * 2);
    
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("HOSPITAL LIAISON COMMITTEE MEMBER RECOMMENDATION", pageWidth / 2, 20, { align: "center" });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const instructions = "Instructions: As a committee, the Hospital Liaison Committee (HLC) should review the qualifications for HLC members. Once the HLC decides on whom to recommend, it should consult with the brother's circuit overseer.";
    const splitInstructions = doc.splitTextToSize(instructions, contentWidth);
    doc.text(splitInstructions, margin, 30);

    let y = 50;
    
    // SECTION 1: PROFILE
    doc.setFillColor(240, 240, 240);
    doc.setDrawColor(0);
    doc.rect(margin, y, contentWidth, 7, "F");
    doc.rect(margin, y, contentWidth, 75); 
    doc.setFont("helvetica", "bold");
    doc.text("SECTION 1: PROFILE", margin + 2, y + 5);
    
    y += 7;
    doc.setFont("helvetica", "normal");
    const midX = pageWidth / 2;
    const rowH = 9;

    const drawGridLine = (yPos: number) => doc.line(margin, yPos, pageWidth - margin, yPos);
    
    doc.text(`Name: ${member.firstName} ${member.lastName}`, margin + 2, y + 6);
    doc.line(midX, y, midX, y + (rowH * 7)); 
    doc.text(`Congregation number: ${member.congregationNumber || ''}`, midX + 2, y + 6);
    y += rowH; drawGridLine(y);

    doc.text(`JWPUB.ORG email: ${member.jwpubEmail || ''}`, margin + 2, y + 6);
    doc.text(`Congregation name: ${member.congregation || ''}`, midX + 2, y + 6);
    y += rowH; drawGridLine(y);

    doc.text(`Medical email: ${member.medicalEmail || ''}`, margin + 2, y + 6);
    doc.text(`Circuit overseer: ${member.circuitOverseer || ''}`, midX + 2, y + 6);
    y += rowH; drawGridLine(y);

    doc.text(`Languages: ${member.languages || ''}`, margin + 2, y + 6);
    doc.text(`Date of birth: ${member.dob || ''}`, midX + 2, y + 6);
    y += rowH; drawGridLine(y);

    doc.text(`Address: ${member.address || ''} ${member.city || ''}`, margin + 2, y + 6);
    doc.text(`Date of baptism: ${member.dateBaptism || ''}`, midX + 2, y + 6);
    y += rowH; drawGridLine(y);

    doc.text(`Mobile phone: ${member.mobilePhone || ''}`, margin + 2, y + 6);
    doc.text(`Date appointed elder: ${member.dateElder || ''}`, midX + 2, y + 6);
    y += rowH; drawGridLine(y);

    doc.text(`Currently on PVG: ${member.onPVG ? 'Yes' : 'No'}`, margin + 2, y + 6);
    doc.text(`Other responsibilities: ${member.otherResponsibilities || ''}`, midX + 2, y + 6);
    
    y += rowH + 5;

    // SECTION 2: PERSONAL CIRCUMSTANCES
    doc.rect(margin, y, contentWidth, 7, "F");
    doc.rect(margin, y, contentWidth, 40); 
    doc.setFont("helvetica", "bold");
    doc.text("SECTION 2: PERSONAL CIRCUMSTANCES", margin + 2, y + 5);
    y += 7;

    doc.setFont("helvetica", "normal");
    doc.text("Family obligations:", margin + 2, y + 5);
    const famObs = doc.splitTextToSize(member.familyObligations || "None listed.", contentWidth - 4);
    doc.text(famObs, margin + 2, y + 10);
    
    y += 18;
    doc.line(margin, y, pageWidth - margin, y);
    doc.text("Secular work obligations:", margin + 2, y + 5);
    const secObs = doc.splitTextToSize(member.secularObligations || "None listed.", contentWidth - 4);
    doc.text(secObs, margin + 2, y + 10);

    y += 18;
    
    // SECTION 3: SPIRITUAL QUALIFICATIONS (Blank for CO)
    y += 5;
    if (y + 50 > 280) { doc.addPage(); y = 20; }
    
    doc.rect(margin, y, contentWidth, 7, "F");
    doc.rect(margin, y, contentWidth, 40);
    doc.setFont("helvetica", "bold");
    doc.text("SECTION 3: SPIRITUAL QUALIFICATIONS (To be completed by CO)", margin + 2, y + 5);
    y += 10;
    doc.setFont("helvetica", "normal");
    doc.text("[Space reserved for Circuit Overseer comments regarding ministry, teaching, and shepherding]", margin + 2, y);

    y += 35;

    // SECTION 4: REMARKS (Blank for Committee/CO)
    if (y + 50 > 280) { doc.addPage(); y = 20; }
    
    doc.rect(margin, y, contentWidth, 7, "F");
    doc.rect(margin, y, contentWidth, 40);
    doc.setFont("helvetica", "bold");
    doc.text("SECTION 4: REMARKS / REASON FOR RECOMMENDATION", margin + 2, y + 5);
    y += 10;
    doc.setFont("helvetica", "normal");
    // We map the reason if it exists, otherwise leave blank for manual entry
    if (member.recommendationReason) {
        const reason = doc.splitTextToSize(member.recommendationReason, contentWidth - 4);
        doc.text(reason, margin + 2, y);
    } else {
        doc.text("[Space reserved for recommendation details]", margin + 2, y);
    }

    doc.setFontSize(8);
    doc.text("hlc-21-E", 14, 280);

    doc.save(`HLC21_${member.lastName}.pdf`);
  };

  // ----------------------------------------------------------------------
  // EXPORT DISPATCHER
  // ----------------------------------------------------------------------
  const handleExportForm = (member: CommitteeMember) => {
    if (member.group === 'HLC' || member.group === 'PVG') {
        generateContactPDF(member);
    } else if (member.group === 'Recommendation') {
        generateRecommendationPDF(member);
    } else {
        // ERROR / FALLBACK
        alert("Cannot determine form type (HL31 vs HLC21) for this member. Please check their role/type.");
    }
  };


  return (
    <div className="space-y-6">
      
      {/* HEADER & CONTROLS */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 pb-6 border-b border-sand gap-4">
        <div>
          <h2 className="text-3xl font-bold text-ink">Personnel</h2>
          <p className="text-subtle mt-1">Roster management and committee details</p>
        </div>
        <div className="flex gap-3">
             <button 
                onClick={() => { setExportSearch(''); setShowExportModal(true); }}
                className="flex items-center justify-center bg-white text-ink border border-sand w-12 h-12 rounded-xl hover:bg-taupe transition-colors shadow-sm"
                title="Export member forms (Print Center)"
             >
                <Printer size={22} />
             </button>
             <button 
                onClick={() => { setFormData(DEFAULT_FORM); setEditingItem(null); setShowForm(true); }}
                className="flex items-center gap-2 bg-clay text-white px-5 py-3 rounded-xl font-semibold hover:bg-clay/90 transition-colors shadow-sm"
             >
                <Plus size={18} /> Add Member
             </button>
        </div>
      </div>

      {/* EXPORT MODAL (PRINT CENTER) */}
      {showExportModal && (
          <Modal title="Print Center" onClose={() => setShowExportModal(false)}>
              <div className="space-y-6 min-h-[400px]">
                  <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex gap-3 items-start">
                      <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={18} />
                      <div className="text-sm text-amber-900/80">
                          <p className="font-bold text-amber-900">Form Selection Guide:</p>
                          <ul className="list-disc pl-4 mt-1 space-y-0.5 text-xs">
                              <li><strong>HLC / PVG Members:</strong> Generates <span className="font-mono">HL-31</span> (Contact Information).</li>
                              <li><strong>Recommendations:</strong> Generates <span className="font-mono">HLC-21</span> (Recommendation Form).</li>
                          </ul>
                      </div>
                  </div>

                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-subtle group-focus-within:text-clay transition-colors">
                        <Search size={18} />
                    </div>
                    <input 
                        className="w-full bg-white border border-sand/50 rounded-2xl py-3.5 pl-12 pr-4 text-ink shadow-sm focus:outline-none focus:ring-2 focus:ring-clay/10 focus:border-clay/50 transition-all"
                        placeholder="Search member to print..." 
                        value={exportSearch}
                        onChange={e => setExportSearch(e.target.value)}
                        autoFocus
                    />
                 </div>

                 <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                     {roster
                        .filter(m => m.name?.toLowerCase().includes(exportSearch.toLowerCase()) || m.lastName?.toLowerCase().includes(exportSearch.toLowerCase()))
                        .map(member => (
                         <div key={member.id} className="flex items-center justify-between p-4 bg-white rounded-xl border border-sand/30 hover:border-clay/30 hover:shadow-sm transition-all group">
                             <div className="flex items-center gap-3">
                                 <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${member.group === 'HLC' ? 'bg-clay/10 text-clay' : member.group === 'Recommendation' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                     {member.firstName?.charAt(0)}{member.lastName?.charAt(0)}
                                 </div>
                                 <div>
                                     <div className="font-bold text-ink">{member.firstName} {member.lastName}</div>
                                     <div className="text-xs text-subtle flex gap-2">
                                         <span className="font-semibold">{member.group}</span>
                                         <span>•</span>
                                         <span>{member.role || 'Member'}</span>
                                     </div>
                                 </div>
                             </div>
                             <button 
                                onClick={() => handleExportForm(member)}
                                className="flex items-center gap-2 px-4 py-2 bg-taupe/30 hover:bg-clay hover:text-white text-subtle font-semibold text-xs rounded-lg transition-colors"
                             >
                                 <Printer size={14} /> Print Form
                             </button>
                         </div>
                     ))}
                     {roster.filter(m => m.name?.toLowerCase().includes(exportSearch.toLowerCase())).length === 0 && (
                         <div className="text-center py-8 text-subtle italic">No members found.</div>
                     )}
                 </div>
              </div>
          </Modal>
      )}

      {/* TABS */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-taupe/50 rounded-xl w-fit">
        {['HLC', 'PVG', 'Recommendation'].map((g) => (
          <button
            key={g}
            onClick={() => setActiveGroup(g as any)}
            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
              activeGroup === g 
                ? 'bg-white text-clay shadow-sm' 
                : 'text-subtle hover:text-ink hover:bg-white/50'
            }`}
          >
            {g === 'Recommendation' ? 'Recommendations' : g}
          </button>
        ))}
      </div>

      {/* EDIT/NEW MODAL */}
      {showForm && (
        <Modal title={editingItem ? 'Edit Member' : 'New Member'} onClose={() => setShowForm(false)}>
          <form onSubmit={handleSubmit} className="space-y-8">
            
            <div className="space-y-4">
                 <h4 className="text-xs font-bold text-clay uppercase tracking-widest border-b border-sand pb-2 mb-4">Core Profile</h4>
                 
                 <div className="grid grid-cols-2 gap-4">
                     <InputGroup label="First Name">
                        <input className={inputClasses.base} value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} required />
                     </InputGroup>
                     <InputGroup label="Last Name">
                        <input className={inputClasses.base} value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} required />
                     </InputGroup>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                     <InputGroup label="Group">
                        <select className={inputClasses.select} value={formData.group} onChange={e => setFormData({...formData, group: e.target.value as any})}>
                            <option value="HLC">HLC</option>
                            <option value="PVG">PVG</option>
                            <option value="Recommendation">Recommendation</option>
                        </select>
                     </InputGroup>
                     <InputGroup label="Role / Position">
                        <input className={inputClasses.base} value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} placeholder="e.g. Chairman, Secretary" />
                     </InputGroup>
                 </div>
            </div>

            <div className="space-y-4">
                 <h4 className="text-xs font-bold text-clay uppercase tracking-widest border-b border-sand pb-2 mb-4">Contact Info</h4>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputGroup label="Email">
                        <input type="email" className={inputClasses.base} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                    </InputGroup>
                    <InputGroup label="Mobile Phone">
                        <input type="tel" className={inputClasses.base} value={formData.mobilePhone} onChange={e => setFormData({...formData, mobilePhone: e.target.value})} />
                    </InputGroup>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputGroup label="Home Phone">
                        <input type="tel" className={inputClasses.base} value={formData.homePhone} onChange={e => setFormData({...formData, homePhone: e.target.value})} />
                    </InputGroup>
                    <InputGroup label="Congregation">
                        <input className={inputClasses.base} value={formData.congregation} onChange={e => setFormData({...formData, congregation: e.target.value})} />
                    </InputGroup>
                 </div>

                 <InputGroup label="Address">
                    <input className={inputClasses.base} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                 </InputGroup>

                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="col-span-2 md:col-span-1">
                        <InputGroup label="City">
                            <input className={inputClasses.base} value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
                        </InputGroup>
                    </div>
                    <div className="col-span-2 md:col-span-1">
                        <InputGroup label="Province">
                            <input className={inputClasses.base} value={formData.province} onChange={e => setFormData({...formData, province: e.target.value})} />
                        </InputGroup>
                    </div>
                    <div className="col-span-2 md:col-span-1">
                        <InputGroup label="Post Code">
                            <input className={inputClasses.base} value={formData.postalCode} onChange={e => setFormData({...formData, postalCode: e.target.value})} />
                        </InputGroup>
                    </div>
                     <div className="col-span-2 md:col-span-1">
                        <InputGroup label="Country">
                            <input className={inputClasses.base} value={formData.country} onChange={e => setFormData({...formData, country: e.target.value})} />
                        </InputGroup>
                    </div>
                 </div>
            </div>

            {/* CONDITIONAL FIELDS FOR RECOMMENDATION */}
            {formData.group === 'Recommendation' && (
                <div className="space-y-4 bg-purple-50/50 p-6 rounded-2xl border border-purple-100">
                     <h4 className="text-xs font-bold text-purple-700 uppercase tracking-widest border-b border-purple-200 pb-2 mb-4 flex items-center gap-2">
                        <FileSignature size={14} /> Recommendation Details (HLC-21)
                     </h4>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputGroup label="JWPUB Email">
                            <input type="email" className={inputClasses.base} value={formData.jwpubEmail} onChange={e => setFormData({...formData, jwpubEmail: e.target.value})} />
                        </InputGroup>
                        <InputGroup label="Medical Email">
                            <input type="email" className={inputClasses.base} value={formData.medicalEmail} onChange={e => setFormData({...formData, medicalEmail: e.target.value})} />
                        </InputGroup>
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <InputGroup label="Date of Birth">
                            <input type="date" className={inputClasses.base} value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} />
                        </InputGroup>
                        <InputGroup label="Date of Baptism">
                            <input type="date" className={inputClasses.base} value={formData.dateBaptism} onChange={e => setFormData({...formData, dateBaptism: e.target.value})} />
                        </InputGroup>
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <InputGroup label="Appointed Elder">
                            <input type="date" className={inputClasses.base} value={formData.dateElder} onChange={e => setFormData({...formData, dateElder: e.target.value})} />
                        </InputGroup>
                        <InputGroup label="Congregation #">
                            <input className={inputClasses.base} value={formData.congregationNumber} onChange={e => setFormData({...formData, congregationNumber: e.target.value})} />
                        </InputGroup>
                     </div>

                     <InputGroup label="Family Obligations">
                        <textarea className={inputClasses.textarea} rows={2} style={{minHeight: '80px'}} value={formData.familyObligations} onChange={e => setFormData({...formData, familyObligations: e.target.value})} placeholder="Describe family circumstances..." />
                     </InputGroup>

                     <InputGroup label="Secular Obligations">
                        <textarea className={inputClasses.textarea} rows={2} style={{minHeight: '80px'}} value={formData.secularObligations} onChange={e => setFormData({...formData, secularObligations: e.target.value})} placeholder="Describe employment..." />
                     </InputGroup>

                     <InputGroup label="Reason for Recommendation">
                        <textarea className={inputClasses.textarea} value={formData.recommendationReason} onChange={e => setFormData({...formData, recommendationReason: e.target.value})} />
                     </InputGroup>
                </div>
            )}

            <InputGroup label="General Comments">
                <textarea className={inputClasses.textarea} value={formData.comments} onChange={e => setFormData({...formData, comments: e.target.value})} rows={3} style={{minHeight: '100px'}} />
            </InputGroup>

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
                {editingItem ? 'Save Member' : 'Add Member'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ROSTER LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredMembers.map(member => (
          <div key={member.id} className="bg-white rounded-2xl p-6 shadow-sm border border-transparent hover:border-sand hover:shadow-apple-card transition-all duration-300 group">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shadow-sm ${
                    member.group === 'HLC' ? 'bg-clay/10 text-clay' :
                    member.group === 'PVG' ? 'bg-blue-50 text-blue-600' :
                    'bg-purple-50 text-purple-600'
                }`}>
                  {member.firstName?.charAt(0)}{member.lastName?.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-ink leading-tight">{member.firstName} {member.lastName}</h3>
                  <div className="text-xs font-semibold text-subtle uppercase tracking-wider mt-1">{member.role || 'Member'}</div>
                </div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleEdit(member)} className="p-2 text-subtle hover:bg-taupe rounded-lg transition-colors"><Edit2 size={16} /></button>
                <button onClick={() => handleDelete(member.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t border-sand/30">
                {member.mobilePhone && (
                    <div className="flex items-center gap-3 text-sm text-subtle">
                        <Phone size={14} className="opacity-70" /> {member.mobilePhone}
                    </div>
                )}
                {member.email && (
                    <div className="flex items-center gap-3 text-sm text-subtle truncate">
                        <Mail size={14} className="opacity-70" /> 
                        <span className="truncate">{member.email}</span>
                    </div>
                )}
                {member.congregation && (
                    <div className="flex items-center gap-3 text-sm text-subtle">
                        <Users size={14} className="opacity-70" /> {member.congregation}
                    </div>
                )}
                 {member.city && (
                    <div className="flex items-center gap-3 text-sm text-subtle">
                        <MapPin size={14} className="opacity-70" /> {member.city}
                    </div>
                )}
            </div>

            {/* Quick Actions Footer for Recommendation */}
            {member.group === 'Recommendation' && (
                 <div className="mt-4 pt-3 border-t border-sand/30 flex gap-2">
                     {member.dob && <span className="text-[10px] bg-purple-50 text-purple-700 px-2 py-1 rounded border border-purple-100 flex items-center gap-1"><Calendar size={10}/> Age: {new Date().getFullYear() - new Date(member.dob).getFullYear()}</span>}
                     {member.onPVG && <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-100">On PVG</span>}
                 </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};