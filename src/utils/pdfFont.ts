import jsPDF from 'jspdf';

let cachedFontBase64: string | null = null;

export async function ensureEthiopicFont(doc: jsPDF): Promise<boolean> {
  try {
    if (!cachedFontBase64) {
      const response = await fetch('/fonts/AbyssinicaSIL-Regular.ttf');
      if (!response.ok) return false;
      const buffer = await response.arrayBuffer();
      // Convert buffer to base64
      let binary = '';
      const bytes = new Uint8Array(buffer);
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      cachedFontBase64 = btoa(binary);
    }

    if (cachedFontBase64) {
      doc.addFileToVFS('AbyssinicaSIL-Regular.ttf', cachedFontBase64);
      doc.addFont('AbyssinicaSIL-Regular.ttf', 'AbyssinicaSIL', 'normal');
      doc.setFont('AbyssinicaSIL');
      return true;
    }
  } catch (err) {
    console.warn('Could not load Ethiopic TTF font into jsPDF, falling back to standard font:', err);
  }
  return false;
}
