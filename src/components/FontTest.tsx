import { useEffect, useState } from 'react';

export default function FontTest() {
  const [fontStatus, setFontStatus] = useState<string>('Checking...');

  useEffect(() => {
    // Check if font is loaded
    if (typeof window !== 'undefined' && 'fonts' in document) {
      document.fonts.ready.then(() => {
        const loadedFonts = Array.from(document.fonts).map(font => font.family);
        setFontStatus(`Loaded: ${loadedFonts.join(', ')}`);
      });

      // Try to load the font explicitly
      const font = new FontFace('Aurora Pro Test', 'url(/fonts/AURORA-PRO.otf)');
      font.load().then(() => {
        document.fonts.add(font);
        setFontStatus('Aurora Pro loaded successfully!');
      }).catch((error) => {
        setFontStatus(`Font load error: ${error.message}`);
      });
    }
  }, []);

  return (
    <div className="fixed top-4 right-4 z-50 bg-black/90 p-4 rounded border border-green-500/30 text-xs max-w-xs">
      <div className="space-y-2">
        <div className="text-green-400 font-bold">Font Loading Test:</div>
        <div className="text-yellow-400 text-xs">{fontStatus}</div>
        
        <div style={{ fontFamily: "'Aurora Pro', sans-serif", fontWeight: 'normal' }} className="text-green-300 text-lg">
          Aurora Pro Normal: OmniCode
        </div>
        <div style={{ fontFamily: "'Aurora Pro', sans-serif", fontWeight: 'bold' }} className="text-green-300 text-lg">
          Aurora Pro Bold: OmniCode
        </div>
        <div style={{ fontFamily: "'Aurora Pro', sans-serif", fontWeight: '900' }} className="text-green-300 text-lg">
          Aurora Pro Black: OmniCode
        </div>
        <div style={{ fontFamily: "'Fira Sans', sans-serif" }} className="text-green-300 text-lg">
          Fira Sans: OmniCode
        </div>
        <div style={{ fontFamily: "Arial, sans-serif" }} className="text-green-300 text-lg">
          Arial: OmniCode
        </div>
        <div style={{ fontFamily: "'Times New Roman', serif" }} className="text-green-300 text-lg">
          Times: OmniCode
        </div>
        <div className="text-green-400/70 text-xs mt-2">
          Check the status message above for font loading details
        </div>
      </div>
    </div>
  );
}