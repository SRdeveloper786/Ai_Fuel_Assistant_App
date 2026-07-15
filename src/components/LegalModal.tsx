import React from 'react';

interface LegalModalProps {
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 backdrop-blur-md bg-black/70">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-white uppercase tracking-wider">Privacy & Terms</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">X</button>
        </div>

        <div className="text-xs text-slate-300 space-y-4 leading-relaxed">
          <section>
            <h3 className="font-bold text-white mb-1">Privacy Policy</h3>
            <p>Your privacy is paramount. This application operates on a <strong>Local-First Architecture</strong>. All your vehicle data, fuel logs, and preferences are stored exclusively on your device in your local browser sandbox.</p>
            <p><strong>We do not:</strong> collect, store, share, or sell your personal data, location, or usage habits on any external servers.</p>
            <p><strong>Permissions:</strong> Location is requested only for solar-time theme sync and is processed locally. Microphone is used for voice commands locally. Access to your device's photo gallery is requested strictly to parse fuel receipt images for automatic field entry via local OCR processing.</p>
          </section>

          <section>
            <h3 className="font-bold text-white mb-1">Terms of Service</h3>
            <p>By using this application, you agree that this tool is provided "as-is" for informational purposes only. Fuel pricing, efficiency calculations, and emergency data are estimates. Always prioritize safety and verify information via official local channels before making driving decisions.</p>
          </section>
          
          <p className="text-[10px] text-slate-500 font-mono">Last Updated: July 2026</p>
        </div>
        
        <button onClick={onClose} className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl cursor-pointer">Close</button>
      </div>
    </div>
  );
};
