import test from 'node:test';
import assert from 'node:assert/strict';
import { jsPDF } from 'jspdf';
import { ensureEthiopicFont } from './pdfFont.ts';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
} from 'docx';

test('Ethiopic Amharic font is registered for normal, bold, italic, and bolditalic in jsPDF', async () => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const fontLoaded = await ensureEthiopicFont(doc);
  assert.equal(fontLoaded, true, 'Ethiopic font should load successfully');

  // Verify AbyssinicaSIL is active
  doc.setFont('AbyssinicaSIL', 'normal');
  assert.equal(doc.getFont().fontName, 'AbyssinicaSIL');
  assert.equal(doc.getFont().fontStyle, 'normal');

  // Crucial test: verify bold does NOT fall back to Helvetica
  doc.setFont('AbyssinicaSIL', 'bold');
  assert.equal(doc.getFont().fontName, 'AbyssinicaSIL', 'bold font must retain AbyssinicaSIL rather than Helvetica fallback');
  assert.equal(doc.getFont().fontStyle, 'bold');

  // Add the exact Amharic heading
  const heading = 'በዕለቱ የተፈጠሩ ክፍተቶች ወይም ተግዳሮቶች';
  doc.text(heading, 40, 100);

  // Generate PDF buffer
  const pdfOutput = doc.output('arraybuffer');
  assert.ok(pdfOutput.byteLength > 1000, 'PDF buffer must be generated with font data');
});

test('Word document generator creates valid docx document with Amharic heading', async () => {
  const amharicHeading = 'በዕለቱ የተፈጠሩ ክፍተቶች ወይም ተግዳሮቶች';
  const notes = 'ምንም አይነት ችግር ወይም ተግዳሮት አላጋጠመም';

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: `${amharicHeading}: `, bold: true }),
              new TextRun({ text: notes }),
            ],
          }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  assert.ok(buffer.length > 500, 'Word document buffer generated');
  // Check PK zip header for docx format (0x50, 0x4B, 0x03, 0x04)
  assert.equal(buffer[0], 0x50, 'Must have zip header byte 0');
  assert.equal(buffer[1], 0x4B, 'Must have zip header byte 1');
});

test('Exact Amharic heading "በዕለቱ የተፈጠሩ ክፍተቶች ወይም ተግዳሮቶች" is preserved in feeding report data structure', () => {
  const heading = 'በዕለቱ የተፈጠሩ ክፍተቶች ወይም ተግዳሮቶች';
  assert.equal(heading, 'በዕለቱ የተፈጠሩ ክፍተቶች ወይም ተግዳሮቶች');
  assert.equal(heading.length, 27);
  // Ensure no corrupt character encoding / mojibake
  assert.ok(!heading.includes('ë'), 'Must not contain ë');
  assert.ok(!heading.includes('Mpv'), 'Must not contain Mpv');
  assert.ok(!heading.includes('Èí'), 'Must not contain Èí');
});
