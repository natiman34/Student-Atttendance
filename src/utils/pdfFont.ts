import jsPDF from 'jspdf';

let cachedFontBase64: string | null = null;

export async function ensureEthiopicFont(doc: jsPDF): Promise<boolean> {
  try {
    if (!cachedFontBase64) {
      let buffer: ArrayBuffer | null = null;

      if (typeof fetch === 'function') {
        try {
          const response = await fetch('/fonts/AbyssinicaSIL-Regular.ttf');
          if (response.ok) {
            buffer = await response.arrayBuffer();
          }
        } catch {
          // fetch failed or non-browser environment
        }
      }

      // Node.js test environment fallback
      if (!buffer && typeof process !== 'undefined' && process.versions?.node) {
        try {
          const fsName = 'fs';
          const pathName = 'path';
          const fs = await import(/* @vite-ignore */ fsName);
          const path = await import(/* @vite-ignore */ pathName);
          const fontPath = path.resolve(process.cwd(), 'public/fonts/AbyssinicaSIL-Regular.ttf');
          if (fs.existsSync(fontPath)) {
            const fileBuf = fs.readFileSync(fontPath);
            buffer = fileBuf.buffer.slice(fileBuf.byteOffset, fileBuf.byteOffset + fileBuf.byteLength);
          }
        } catch {
          // ignore
        }
      }

      if (buffer) {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        cachedFontBase64 = btoa(binary);
      }
    }

    if (cachedFontBase64) {
      doc.addFileToVFS('AbyssinicaSIL-Regular.ttf', cachedFontBase64);
      // Register for all 4 font variants so bold or italic text doesn't fall back to Helvetica
      doc.addFont('AbyssinicaSIL-Regular.ttf', 'AbyssinicaSIL', 'normal');
      doc.addFont('AbyssinicaSIL-Regular.ttf', 'AbyssinicaSIL', 'bold');
      doc.addFont('AbyssinicaSIL-Regular.ttf', 'AbyssinicaSIL', 'italic');
      doc.addFont('AbyssinicaSIL-Regular.ttf', 'AbyssinicaSIL', 'bolditalic');
      doc.setFont('AbyssinicaSIL', 'normal');
      return true;
    }
  } catch (err) {
    console.warn('Could not load Ethiopic TTF font into jsPDF, falling back to standard font:', err);
  }
  return false;
}
