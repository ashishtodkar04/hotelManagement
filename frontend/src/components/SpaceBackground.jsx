import React from 'react';

/**
 * Ambient Light Background Container
 * Provides a subtle, luxury champagne and ivory ambient gradient backdrop.
 */
export default function SpaceBackground() {
  return (
    <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden bg-[#faf8f5]">
      {/* Soft Ambient Orbs */}
      <div 
        className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full blur-[140px] opacity-40"
        style={{ background: 'radial-gradient(circle, #fde68a 0%, #fef3c7 60%, transparent 100%)' }}
      />
      <div 
        className="absolute top-1/3 -right-40 w-[700px] h-[700px] rounded-full blur-[160px] opacity-30"
        style={{ background: 'radial-gradient(circle, #fed7aa 0%, #ffedd5 60%, transparent 100%)' }}
      />
      <div 
        className="absolute -bottom-40 left-1/4 w-[650px] h-[650px] rounded-full blur-[150px] opacity-25"
        style={{ background: 'radial-gradient(circle, #e0f2fe 0%, #bae6fd 60%, transparent 100%)' }}
      />

      {/* Subtle Pattern Grid */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `radial-gradient(#0f172a 1px, transparent 1px)`,
          backgroundSize: '32px 32px'
        }}
      />
    </div>
  );
}
