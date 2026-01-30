import React from 'react';

interface InputGroupProps {
  label: string;
  children: React.ReactNode;
}

export const InputGroup: React.FC<InputGroupProps> = ({ label, children }) => (
  <div className="group bg-paper/50 focus-within:bg-white border border-sand/50 focus-within:border-clay/50 focus-within:shadow-sm rounded-2xl overflow-hidden transition-all duration-300 relative">
    <label className="block px-4 pt-4 pb-2 text-[10px] font-bold text-subtle/70 uppercase tracking-[0.15em] group-focus-within:text-clay transition-colors">{label}</label>
    {children}
  </div>
);

// Standardized classes for inputs to prevent clipping and ensure visual consistency
export const inputClasses = {
  base: "w-full bg-transparent border-none px-4 pt-0 pb-4 text-ink font-medium focus:ring-0 placeholder-sand/60 text-base leading-relaxed",
  select: "w-full bg-transparent border-none px-4 pt-0 pb-4 text-ink font-medium focus:ring-0 text-base leading-relaxed cursor-pointer",
  textarea: "w-full bg-transparent border-none px-4 pt-0 pb-4 text-ink font-medium focus:ring-0 placeholder-sand/60 min-h-[140px] text-base leading-relaxed resize-y"
};