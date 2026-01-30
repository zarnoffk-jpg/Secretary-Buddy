import React, { useState, useEffect } from 'react';
import { CommitteeMember } from '../types';
import { Plus, Edit2, Trash2, Users, FileText, Download, UserPlus, FileSignature } from 'lucide-react';
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

  const generateContactPDF = (member: CommitteeMember) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("HOSPITAL LIAISON COMMITTEE CONTACT INFORMATION", pageWidth / 2, 20, { align: "center" });
    
    doc.setDrawColor(0);
    doc.setFillColor(230, 230, 230);
    
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
    doc.rect(16, y - 4, 3, 3); doc.text("Update contact information for an existing contact", 21, y - 1);
    doc.rect(100, y - 4, 3, 3); doc.text("Cooperative doctor", 105, y - 1);
    y += 6;
    doc.rect(16, y - 4, 3, 3); doc.text("Provide contact information for a new contact", 21, y - 1);
    doc.rect(100, y - 4, 3, 3); doc.text("Consulting doctor", 105, y - 1);
    y += 6;
    doc.rect(100, y - 4, 3, 3); doc.text("One of Jehovah's Witnesses", 105, y - 1);
    y += 6;
    doc.rect(100, y - 4, 3, 3, "FD"); 
    doc.text("HLC member, PVG member, or other support staff", 105, y - 1);
    doc.text("with the HLC", 105, y + 3);

    y += 10;
    doc.line(14, y, pageWidth - 14, y);
    doc.text("Comments: " + (member.comments || ""), 16, y + 5);
    
    y = 80;
    doc.rect(14, y, pageWidth - 28, 7, "F"); 
    doc.rect(14, y, pageWidth - 28, 85); 
    doc.setFont("helvetica", "bold");
    doc.text("SECTION 2", 16, y + 5);
    
    y += 7; 
    const rowHeight = 8;
    const col1X = 16;
    const col2X = 105;
    
    const drawRowLine = (yPos: number) => doc.line(14, yPos, pageWidth - 14, yPos);
    doc.line(100, y, 100, y + (rowHeight * 5)); 

    doc.setFont("helvetica", "normal");
    
    doc.text(`First name: ${member.firstName || ''}`, col1X, y + 5);
    doc.text(`Address: ${member.address || ''}`, col2X, y + 5);
    y += rowHeight; drawRowLine(y);
    
    doc.text(`Last name: ${member.lastName || ''}`, col1X, y + 5);
    doc.text("", col2X, y + 5); 
    y += rowHeight; drawRowLine(y);
    
    doc.text(`Home telephone: ${member.homePhone || ''}`, col1X, y + 5);
    doc.text(`City: ${member.city || ''}`, col2X, y + 5);
    y += rowHeight; drawRowLine(y);
    
    doc.text(`Mobile telephone: ${member.mobilePhone || ''}`, col1X, y + 5);
    doc.text(`Province or state: ${member.province || ''}`, col2X, y + 5);
    doc.text(`Zone or code: ${member.postalCode || ''}`, col2X + 50, y + 5);
    doc.line(col2X + 48, y - rowHeight, col2X + 48, y); 
    y += rowHeight; drawRowLine(y);
    
    doc.text(`Email address: ${member.email || ''}`, col1X, y + 5);
    doc.text(`Country: ${member.country || ''}`, col2X, y + 5);
    y += rowHeight; drawRowLine(y);
    
    doc.text(`Gender: ${member.gender || ''}`, col1X, y + 5);
    y += rowHeight; drawRowLine(y);
    
    doc.text(`Congregation number and name: ${member.congregation || ''}`, col1X, y + 5);
    y += rowHeight; drawRowLine(y);

    doc.text("Comments:", col1X, y + 5);
    
    y = 175;
    doc.rect(14, y, pageWidth - 28, 7, "F"); 
    doc.rect(14, y, pageWidth - 28, 50); 
    doc.setFont("helvetica", "bold");
    doc.text("SECTION 4", 16, y + 5);
    doc.setFont("helvetica", "normal");
    
    y += 12;
    const disclaimer = "By filling out and submitting this form, I confirm that any third parties listed above have agreed to their personal information being stored and processed by the HLC...";
    const splitDisclaimer = doc.splitTextToSize(disclaimer, pageWidth - 32);
    doc.text(splitDisclaimer, 16, y);
    
    y += 25;
    doc.text("HLC name: ________________________________________________", 16, y);
    y += 10;
    doc.text("Date: _________________   HLC member: _____________________________________", 16, y);

    doc.setFontSize(8);
    doc.text("hlc-31-E 7/23", 16, 280);

    doc.save(`HLC_Contact_${member.lastName}_${member.firstName}.pdf`);
  };

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
    const instructions = "Instructions: As a committee, the Hospital Liaison Committee (HLC) should review the qualifications for HLC members outlined in Hospital Liaison Committee Guidelines (hlcg), chapter 2. Once the HLC decides on whom to recommend, it should consult with the brother's circuit overseer.";
    const splitInstructions = doc.splitTextToSize(instructions, contentWidth);
    doc.text(splitInstructions, margin, 30);

    let y = 50;
    doc.setFillColor(230, 230, 230);
    doc.setDrawColor(0);
    doc.rect(margin, y, contentWidth, 7, "F");
    doc.rect(margin, y, contentWidth, 70); 
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

    doc.text(`JWPUB.ORG email address: ${member.jwpubEmail || ''}`, margin + 2, y + 6);
    doc.text(`Congregation name: ${member.congregation || ''}`, midX + 2, y + 6);
    y += rowH; drawGridLine(y);

    doc.text(`Email for medical professionals:`, margin + 2, y + 3);
    doc.setFontSize(9);
    doc.text(`${member.medicalEmail || ''}`, margin + 2, y + 7);
    doc.setFontSize(10);
    
    doc.text(`Circuit overseer: ${member.circuitOverseer || ''}`, midX + 2, y + 6);
    y += rowH; drawGridLine(y);

    doc.text(`Languages spoken and read fluently:`, margin + 2, y + 3);
    doc.text(`${member.languages || ''}`, margin + 2, y + 7);
    
    doc.text(`Date of birth: ${member.dob || ''}`, midX + 2, y + 6);
    y += rowH; drawGridLine(y);

    doc.text(`Date of baptism: ${member.dateBaptism || ''}`, midX + 2, y + 6);
    y += rowH; drawGridLine(y);

    doc.text(`Date of appointment as elder: ${member.dateElder || ''}`, midX + 2, y + 6);

    y = 125;
    doc.rect(margin, y, contentWidth, 7, "F");
    doc.rect(margin, y, contentWidth, 85); 
    doc.setFont("helvetica", "bold");
    doc.text("SECTION 2: AVAILABILITY", margin + 2, y + 5);
    
    y += 7;
    doc.setFont("helvetica", "normal");
    
    doc.text("Besides serving as an elder, what other theocratic responsibilities does he care for?", margin + 2, y + 5);
    y += 6;
    const q1Text = doc.splitTextToSize(member.otherResponsibilities || '', contentWidth - 4);
    doc.text(q1Text, margin + 2, y + 4);
    y += 12;
    doc.line(margin, y, pageWidth - margin, y);

    doc.text(`Is he currently serving on the Patient Visitation Group?  ${member.onPVG ? "YES" : "NO"}`, margin + 2, y + 5);
    y += 8;
    doc.line(margin, y, pageWidth - margin, y);

    doc.text("Describe his family obligations, such as whether he is married or has children living at home:", margin + 2, y + 5);
    y += 6;
    const q3Text = doc.splitTextToSize(member.familyObligations || '', contentWidth - 4);
    doc.text(q3Text, margin + 2, y + 4);
    y += 15;
    doc.line(margin, y, pageWidth - margin, y);

    doc.text("Describe his secular obligations, such as work type, hours, and availability:", margin + 2, y + 5);
    y += 6;
    const q4Text = doc.splitTextToSize(member.secularObligations || '', contentWidth - 4);
    doc.text(q4Text, margin + 2, y + 4);
    y += 18;
    doc.line(margin, y, pageWidth - margin, y);

    doc.text(`Comments: ${member.comments || ''}`, margin + 2, y + 5);


    y = 215;
    doc.rect(margin, y, contentWidth, 7, "F");
    doc.rect(margin, y, contentWidth, 60); 
    doc.setFont("helvetica", "bold");
    doc.text("SECTION 3: HLC RECOMMENDATION", margin + 2, y + 5);

    y += 7;
    doc.setFont("helvetica", "normal");
    doc.text("What needs in the HLC have prompted this recommendation?", margin + 2, y + 5);
    y += 6;
    const qRecText = doc.splitTextToSize(member.recommendationReason || '', contentWidth - 4);
    doc.text(qRecText, margin + 2, y + 4);

    y += 35;
    doc.setFontSize(9);
    const disclaimer = "We have read the qualifications for HLC members... and unanimously agree that the brother meets the qualifications.";
    const splitDisclaimer = doc.splitTextToSize(disclaimer, contentWidth);
    doc.text(splitDisclaimer, margin + 2, y);
    
    y += 12;
    doc.text("HLC name: _________________________________________  Date: _________________________", margin + 2, y);
    y += 8;
    doc.text("HLC member: ___________________________________  HLC member: ___________________________________", margin + 2, y);

    doc.setFontSize(8);
    doc.text("hlc-21-E 7/23", margin, 280);

    doc.save(`HLC_Recommendation_${member.lastName}.pdf`);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-sand">
        <div>
          <h2 className="text-4xl font-serif font-bold text-ink">Personnel</h2>
          <p className="text-subtle mt-2 font-serif italic">Committee members, support staff, and recommendations</p>
        </div>
        <button 
          onClick={() => { setFormData(DEFAULT_FORM); setEditingItem(null); setFormData({...DEFAULT_FORM, group: activeGroup}); setShowForm(true); }}
          className="flex items-center gap-2 bg-clay text-white px-6 py-3 rounded-lg font-semibold hover:bg-clay/90 transition-all shadow-md active:translate-y-0.5"
        >
          <Plus size={18} /> Add {activeGroup === 'Recommendation' ? 'Candidate' : 'Member'}
        </button>
      </div>

      <div className="flex flex-wrap gap-2 p-1.5 bg-taupe/50 rounded-xl w-fit">
        {['HLC', 'PVG', 'Recommendation'].map(g => (
          <button
            key={g}
            onClick={() => setActiveGroup(g as any)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
              activeGroup === g 
                ? 'bg-white text-clay shadow-sm' 
                : 'text-subtle hover:text-ink hover:bg-white/50'
            }`}
          >
            {g === 'Recommendation' ? <UserPlus size={16} /> : <Users size={16} />}
            {g}
          </button>
        ))}
      </div>

      {showForm && (
        <Modal title={editingItem ? 'Edit Profile' : (activeGroup === 'Recommendation' ? 'New Recommendation' : 'New Personnel')} onClose={() => setShowForm(false)}>
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {!editingItem && (
                <div className="bg-taupe/30 p-4 rounded-xl border border-sand/50 mb-6">
                <label className="block text-xs font-bold text-subtle uppercase tracking-widest mb-3">Group Assignment</label>
                <div className="flex gap-4">
                    {['HLC', 'PVG', 'Recommendation'].map(g => (
                         <label key={g} className="flex items-center gap-2 cursor-pointer">
                            <input 
                                type="radio" 
                                name="group" 
                                checked={formData.group === g} 
                                onChange={() => setFormData({...formData, group: g as any})}
                                className="text-clay focus:ring-clay"
                            />
                            <span className="text-sm font-medium text-ink">{g}</span>
                        </label>
                    ))}
                </div>
                </div>
            )}

            <div className="grid grid-cols-2 gap-6">
              <InputGroup label="First Name">
                <input 
                  className={inputClasses.base}
                  value={formData.firstName} 
                  onChange={e => setFormData({...formData, firstName: e.target.value})} 
                  required 
                />
              </InputGroup>
              <InputGroup label="Last Name">
                <input 
                  className={inputClasses.base}
                  value={formData.lastName} 
                  onChange={e => setFormData({...formData, lastName: e.target.value})} 
                  required 
                />
              </InputGroup>
            </div>

            {formData.group === 'Recommendation' ? (
                <>
                   <div className="space-y-4 border-t border-sand/50 pt-4">
                        <h4 className="font-serif font-bold text-ink">Section 1: Profile</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <InputGroup label="JWPUB Email">
                                <input className={inputClasses.base} value={formData.jwpubEmail} onChange={e => setFormData({...formData, jwpubEmail: e.target.value})} />
                            </InputGroup>
                            <InputGroup label="Medical Email">
                                <input className={inputClasses.base} value={formData.medicalEmail} onChange={e => setFormData({...formData, medicalEmail: e.target.value})} />
                            </InputGroup>
                            <InputGroup label="Congregation #">
                                <input className={inputClasses.base} value={formData.congregationNumber} onChange={e => setFormData({...formData, congregationNumber: e.target.value})} />
                            </InputGroup>
                            <InputGroup label="Congregation Name">
                                <input className={inputClasses.base} value={formData.congregation} onChange={e => setFormData({...formData, congregation: e.target.value})} />
                            </InputGroup>
                            <InputGroup label="Circuit Overseer">
                                <input className={inputClasses.base} value={formData.circuitOverseer} onChange={e => setFormData({...formData, circuitOverseer: e.target.value})} />
                            </InputGroup>
                            <InputGroup label="Languages">
                                <input className={inputClasses.base} value={formData.languages} onChange={e => setFormData({...formData, languages: e.target.value})} placeholder="Spoken and read fluently" />
                            </InputGroup>
                            <InputGroup label="Date of Birth">
                                <input type="date" className={inputClasses.base} value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} />
                            </InputGroup>
                            <InputGroup label="Baptism Date">
                                <input type="date" className={inputClasses.base} value={formData.dateBaptism} onChange={e => setFormData({...formData, dateBaptism: e.target.value})} />
                            </InputGroup>
                            <InputGroup label="Elder Appointment">
                                <input type="date" className={inputClasses.base} value={formData.dateElder} onChange={e => setFormData({...formData, dateElder: e.target.value})} />
                            </InputGroup>
                        </div>
                   </div>

                   <div className="space-y-4 border-t border-sand/50 pt-4">
                        <h4 className="font-serif font-bold text-ink">Section 2: Availability</h4>
                        <InputGroup label="Other Theocratic Responsibilities">
                             <textarea className={inputClasses.textarea} value={formData.otherResponsibilities} onChange={e => setFormData({...formData, otherResponsibilities: e.target.value})} rows={2} />
                        </InputGroup>
                        <div className="flex items-center gap-3">
                             <input type="checkbox" id="onPVG" checked={formData.onPVG} onChange={e => setFormData({...formData, onPVG: e.target.checked})} className="w-5 h-5 text-clay rounded focus:ring-clay" />
                             <label htmlFor="onPVG" className="text-sm font-medium text-ink">Currently serving on PVG?</label>
                        </div>
                        <InputGroup label="Family Obligations">
                             <textarea className={inputClasses.textarea} value={formData.familyObligations} onChange={e => setFormData({...formData, familyObligations: e.target.value})} rows={2} placeholder="Married, children at home..." />
                        </InputGroup>
                        <InputGroup label="Secular Obligations">
                             <textarea className={inputClasses.textarea} value={formData.secularObligations} onChange={e => setFormData({...formData, secularObligations: e.target.value})} rows={2} placeholder="Work type, hours, availability..." />
                        </InputGroup>
                        <InputGroup label="Comments">
                             <textarea className={inputClasses.textarea} value={formData.comments} onChange={e => setFormData({...formData, comments: e.target.value})} rows={2} />
                        </InputGroup>
                   </div>

                   <div className="space-y-4 border-t border-sand/50 pt-4">
                        <h4 className="font-serif font-bold text-ink">Section 3: HLC Recommendation</h4>
                        <InputGroup label="What needs prompted this?">
                             <textarea className={inputClasses.textarea} value={formData.recommendationReason} onChange={e => setFormData({...formData, recommendationReason: e.target.value})} rows={3} />
                        </InputGroup>
                   </div>
                </>
            ) : (
                <>
                <div className="grid grid-cols-2 gap-6">
                    <InputGroup label="Role / Title">
                        <input 
                        className={inputClasses.base}
                        value={formData.role} 
                        onChange={e => setFormData({...formData, role: e.target.value})} 
                        placeholder="e.g. Chairman"
                        />
                    </InputGroup>
                    <InputGroup label="Gender">
                        <select
                        className={inputClasses.select}
                        value={formData.gender} 
                        onChange={e => setFormData({...formData, gender: e.target.value})} 
                        >
                        <option value="">Select...</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        </select>
                    </InputGroup>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputGroup label="Home Phone">
                        <input type="tel" className={inputClasses.base} value={formData.homePhone} onChange={e => setFormData({...formData, homePhone: e.target.value})} />
                    </InputGroup>
                    <InputGroup label="Mobile Phone">
                        <input type="tel" className={inputClasses.base} value={formData.mobilePhone} onChange={e => setFormData({...formData, mobilePhone: e.target.value})} />
                    </InputGroup>
                </div>

                <InputGroup label="Email">
                    <input type="email" className={inputClasses.base} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </InputGroup>

                <InputGroup label="Address">
                    <input className={inputClasses.base} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Street Address" />
                </InputGroup>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <InputGroup label="City">
                        <input className={inputClasses.base} value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
                    </InputGroup>
                    <InputGroup label="State/Prov">
                        <input className={inputClasses.base} value={formData.province} onChange={e => setFormData({...formData, province: e.target.value})} />
                    </InputGroup>
                    <InputGroup label="Zip/Zone">
                        <input className={inputClasses.base} value={formData.postalCode} onChange={e => setFormData({...formData, postalCode: e.target.value})} />
                    </InputGroup>
                    <InputGroup label="Country">
                        <input className={inputClasses.base} value={formData.country} onChange={e => setFormData({...formData, country: e.target.value})} />
                    </InputGroup>
                </div>

                <InputGroup label="Congregation">
                    <input className={inputClasses.base} value={formData.congregation} onChange={e => setFormData({...formData, congregation: e.target.value})} placeholder="Number and Name" />
                </InputGroup>
                </>
            )}

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
                {editingItem ? 'Save Changes' : (activeGroup === 'Recommendation' ? 'Add Candidate' : 'Add Member')}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {filteredMembers.length === 0 ? (
        <div className="text-center py-24 border-2 border-dashed border-sand/50 rounded-3xl bg-white/40">
          <Users className="w-16 h-16 text-subtle/50 mx-auto mb-4" />
          <h3 className="text-xl font-serif font-bold text-ink mb-2">
            {activeGroup === 'Recommendation' ? 'No active recommendations' : 'No members found'}
          </h3>
          <p className="text-subtle">
             {activeGroup === 'Recommendation' ? 'Add a candidate to begin the HLC recommendation process.' : `Add members to the ${activeGroup} roster.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredMembers.map(member => (
            <div key={member.id} className="bg-white/70 backdrop-blur-md rounded-2xl p-6 shadow-apple-card border border-white/60 hover:shadow-apple-hover transition-all duration-300 group">
              <div className="flex justify-between items-start mb-4">
                 <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold border ${activeGroup === 'Recommendation' ? 'bg-ink text-white border-ink' : 'bg-clay/10 text-clay border-clay/20'}`}>
                    {member.firstName?.[0]}{member.lastName?.[0]}
                 </div>
                 <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleEdit(member)} 
                      className="p-2 text-subtle hover:bg-taupe rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(member.id)} 
                      className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove"
                    >
                      <Trash2 size={16} />
                    </button>
                 </div>
              </div>

              <div className="mb-4">
                 {activeGroup === 'Recommendation' && <div className="text-[10px] font-bold uppercase tracking-widest text-subtle mb-1">Candidate</div>}
                 <h3 className="text-xl font-bold text-ink">{member.firstName} {member.lastName}</h3>
                 <div className="text-sm font-semibold text-clay">{member.role || (activeGroup === 'Recommendation' ? 'Elder' : '')}</div>
              </div>

              <div className="space-y-2 text-sm text-subtle mb-6">
                 {member.congregation && <div>🏛️ {member.congregation}</div>}
                 {member.mobilePhone && <div>📱 {member.mobilePhone}</div>}
                 {member.email && <div>✉️ {member.email}</div>}
                 {activeGroup === 'Recommendation' && member.circuitOverseer && <div>👤 CO: {member.circuitOverseer}</div>}
              </div>

              <button 
                onClick={() => activeGroup === 'Recommendation' ? generateRecommendationPDF(member) : generateContactPDF(member)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-sand bg-white text-ink text-sm font-semibold hover:bg-taupe transition-colors"
              >
                {activeGroup === 'Recommendation' ? <FileSignature size={16} /> : <Download size={16} />}
                {activeGroup === 'Recommendation' ? 'Export HLC-21' : 'Generate Form'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};