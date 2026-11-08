import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  HeadingLevel,
  AlignmentType,
  WidthType,
  BorderStyle,
  ShadingType,
} from 'docx';
import type { Student, DayAttendance, DailyFeedingReport, AppSettings } from '../types.ts';
import { calculateDayStats, formatDisplayDate, formatRollNumber } from './attendance.ts';
import { ensureEthiopicFont } from './pdfFont.ts';

// Helper to trigger browser download
function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// =========================================================================
// 1. COMBINED PDF EXPORT (Attendance + Feeding in ONE Document)
// =========================================================================

export async function exportCombinedReportPDF(
  date: string,
  students: Student[],
  attendance: DayAttendance | undefined,
  feeding: DailyFeedingReport | undefined,
  settings: Partial<AppSettings> = {}
): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  // Embed Ethiopic TTF font so Amharic glyphs render natively
  const fontLoaded = await ensureEthiopicFont(doc);
  const fontName = fontLoaded ? 'AbyssinicaSIL' : 'helvetica';

  const formattedDate = formatDisplayDate(date);
  const records = attendance?.records || {};
  const notes = attendance?.notes || {};
  const stats = calculateDayStats(students, records, { treatBlankAsAbsent: true });

  const isAm = settings.language === 'am';

  // Top Header Banner
  doc.setFillColor(4, 120, 87); // Emerald 700
  doc.rect(0, 0, 595, 60, 'F');

  doc.setFont(fontName, 'normal');
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text(isAm ? 'RollCall — ዕለታዊ የተሟላ ሪፖርት' : 'RollCall — Daily Combined Report', 40, 36);

  doc.setFontSize(10);
  doc.setTextColor(209, 250, 229);
  doc.text(
    isAm
      ? `ቀን: ${formattedDate} (${date})   |   ክፍል: ${settings.className || 'አጠቃላይ ክፍል'}`
      : `Date: ${formattedDate} (${date})   |   Class: ${settings.className || 'General Class'}`,
    40,
    52
  );

  // SECTION 1: ATTENDANCE
  doc.setFont(fontName, 'normal');
  doc.setFontSize(13);
  doc.setTextColor(4, 120, 87);
  doc.text(isAm ? 'ክፍል 1: የተማሪዎች አቴንዳንስ ሪፖርት' : 'Section 1: Student Attendance Report', 40, 85);

  // Attendance KPI box
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(40, 94, 515, 30, 4, 4, 'FD');

  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(
    isAm
      ? `ጠቅላላ ተማሪዎች: ${stats.totalStudents}   |   የተገኙ: ${stats.present}   |   ቀሪ: ${stats.absent}   |   ፈቃድ: ${stats.permission}   |   የመገኘት መጠን: ${stats.attendanceRate}%`
      : `Total Students: ${stats.totalStudents}   |   Present: ${stats.present}   |   Absent: ${stats.absent}   |   Permission: ${stats.permission}   |   Attendance Rate: ${stats.attendanceRate}%`,
    50,
    113
  );

  // Attendance Table Data
  const attHead = isAm
    ? [['ተ.ቁ', 'መለያ ቁጥር', 'የተማሪው ስም', 'የመገኘት ሁኔታ', 'ማስታወሻ']]
    : [['#', 'Roll #', 'Student Name', 'Status', 'Notes']];

  const attBody = students.map((s, idx) => {
    const rawSt = records[s.id];
    const st = (rawSt === 'present' || rawSt === 'permission' || rawSt === 'late') ? rawSt : 'absent';
    let statusText = '';
    if (isAm) {
      statusText = st === 'present' ? 'ተገኝቷል' : st === 'absent' ? 'ቀሪ' : st === 'permission' ? 'ፈቃድ' : 'ዘግይቷል';
    } else {
      statusText = st === 'present' ? 'Present' : st === 'absent' ? 'Absent' : st === 'permission' ? 'Permission' : 'Late';
    }

    return [
      idx + 1,
      formatRollNumber(s.rollNumber),
      s.name,
      statusText,
      notes[s.id] || '-',
    ];
  });

  autoTable(doc, {
    startY: 132,
    head: attHead,
    body: attBody,
    theme: 'grid',
    styles: {
      font: fontName,
      fontSize: 8.5,
      cellPadding: 4,
      lineColor: [226, 232, 240],
    },
    headStyles: {
      fillColor: [4, 120, 87],
      textColor: [255, 255, 255],
      font: fontName,
      fontStyle: 'normal',
      halign: 'center',
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 32 },
      1: { halign: 'center', cellWidth: 48 },
      2: { halign: 'left' },
      3: { halign: 'center', cellWidth: 105 },
      4: { halign: 'left', cellWidth: 120 },
    },
  });

  // SECTION 2: FEEDING REPORT (placed after attendance table)
  let nextY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 24 : 350;

  // Check if we need a new page for the feeding section
  if (nextY > 640) {
    doc.addPage();
    nextY = 45;
  }

  doc.setFont(fontName, 'normal');
  doc.setFontSize(13);
  doc.setTextColor(4, 120, 87);
  doc.text(isAm ? 'ክፍል 2: የዕለት ምገባ ሪፖርት' : 'Section 2: Daily Feeding Program Report', 40, nextY);

  if (!feeding) {
    // Feeding record pending / not recorded
    doc.setDrawColor(253, 230, 138);
    doc.setFillColor(254, 243, 199);
    doc.roundedRect(40, nextY + 10, 515, 36, 4, 4, 'FD');

    doc.setFontSize(9);
    doc.setTextColor(146, 64, 14);
    doc.text(
      isAm
        ? `* ለዚህ ቀን (${date}) የምገባ ሪፖርት እስካሁን አልተመዘገበም።`
        : `* Feeding report has not been submitted for this date (${date}) yet.`,
      50,
      nextY + 32
    );
  } else {
    // Feeding Metadata Box
    doc.setDrawColor(203, 213, 225);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(40, nextY + 10, 515, 68, 4, 4, 'FD');

    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);

    let actTypeLabel = '';
    if (isAm) {
      actTypeLabel = feeding.activityType === 'lesson' ? 'ትምህርት' : feeding.activityType === 'game' ? 'ጨዋታ' : 'ምንም አልተከናወነም';
    } else {
      actTypeLabel = feeding.activityType === 'lesson' ? 'Lesson' : feeding.activityType === 'game' ? 'Game' : 'None';
    }

    if (isAm) {
      doc.text(`• የዕለቱ ተረኛ አስተባባሪ: ${feeding.coordinatorName}`, 52, nextY + 27);
      doc.text(`• የምግቡ አይነት: ${feeding.foodType}`, 52, nextY + 42);
      doc.text(`• ምገባው የተከናወነበት ቦታ: ${feeding.location}`, 52, nextY + 57);
      doc.text(
        `• የተሳተፉ ህፃናት ቁጥር: ${feeding.childrenCount}   |   አገልጋዮች: ${feeding.volunteersCount}   |   እንቅስቃሴ: ${actTypeLabel}`,
        52,
        nextY + 70
      );
    } else {
      doc.text(`• Coordinator on duty: ${feeding.coordinatorName}`, 52, nextY + 27);
      doc.text(`• Food Type: ${feeding.foodType}`, 52, nextY + 42);
      doc.text(`• Feeding Location: ${feeding.location}`, 52, nextY + 57);
      doc.text(
        `• Children Fed: ${feeding.childrenCount}   |   Volunteers: ${feeding.volunteersCount}   |   Activity: ${actTypeLabel}`,
        52,
        nextY + 70
      );
    }

    // Feeding Activity Schedule Table (3 rows with start & end times)
    const feedHead = isAm
      ? [
          [
            { content: 'ተ.ቁ', rowSpan: 2, styles: { halign: 'center' as const, valign: 'middle' as const } },
            { content: 'ተግባር', rowSpan: 2, styles: { halign: 'left' as const, valign: 'middle' as const } },
            { content: 'ሰዓት', colSpan: 2, styles: { halign: 'center' as const } },
          ],
          [
            { content: 'ተጀመረ', styles: { halign: 'center' as const } },
            { content: 'አለቀ', styles: { halign: 'center' as const } },
          ],
        ]
      : [
          [
            { content: '#', rowSpan: 2, styles: { halign: 'center' as const, valign: 'middle' as const } },
            { content: 'Activity', rowSpan: 2, styles: { halign: 'left' as const, valign: 'middle' as const } },
            { content: 'Time Schedule', colSpan: 2, styles: { halign: 'center' as const } },
          ],
          [
            { content: 'Start Time', styles: { halign: 'center' as const } },
            { content: 'End Time', styles: { halign: 'center' as const } },
          ],
        ];

    const feedBody = (feeding.activities || []).map((row) => [
      row.orderNumber,
      row.activityName,
      row.startTime || '-',
      row.endTime || '-',
    ]);

    autoTable(doc, {
      startY: nextY + 86,
      head: feedHead,
      body: feedBody,
      theme: 'grid',
      styles: {
        font: fontName,
        fontSize: 8.5,
        cellPadding: 5,
        lineColor: [203, 213, 225],
      },
      headStyles: {
        fillColor: [180, 83, 9], // Amber 700
        textColor: [255, 255, 255],
        font: fontName,
        fontStyle: 'normal',
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 35 },
        1: { halign: 'left' },
        2: { halign: 'center', cellWidth: 100 },
        3: { halign: 'center', cellWidth: 100 },
      },
    });

    if (feeding.generalNotes) {
      const feedFinalY = (doc as any).lastAutoTable?.finalY || nextY + 180;
      doc.setFont(fontName, 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      const notesLabel = isAm ? 'ያጋጠሙ ክፍተቶች ወይም ተግዳሮቶች:' : 'Gaps or Challenges:';
      doc.text(`${notesLabel} ${feeding.generalNotes}`, 40, feedFinalY + 16, { maxWidth: 515 });
    }
  }

  // Page Footers across all pages
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont(fontName, 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      isAm
        ? `ገጽ ${i} / ${totalPages}   •   RollCall ዕለታዊ የተሟላ የአቴንዳንስ እና የምገባ ሪፖርት   •   ${date}`
        : `Page ${i} of ${totalPages}   •   RollCall Daily Combined Attendance & Feeding Report   •   ${date}`,
      40,
      doc.internal.pageSize.height - 18
    );
  }

  doc.save(`Daily_Report_${date}.pdf`);
}

// =========================================================================
// 2. COMBINED WORD (.DOCX) EXPORT (Using genuine docx library)
// =========================================================================

export async function exportCombinedReportWord(
  date: string,
  students: Student[],
  attendance: DayAttendance | undefined,
  feeding: DailyFeedingReport | undefined,
  settings: Partial<AppSettings> = {}
): Promise<void> {
  const isAm = settings.language === 'am';
  const formattedDate = formatDisplayDate(date);
  const records = attendance?.records || {};
  const notes = attendance?.notes || {};
  const stats = calculateDayStats(students, records, { treatBlankAsAbsent: true });

  // Common Border Style for Tables
  const thinBorder = {
    top: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
    left: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
    right: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
  };

  // Section 1: Attendance Table Rows
  const attTableRows = [
    new TableRow({
      tableHeader: true,
      children: [
        new TableCell({
          width: { size: 600, type: WidthType.DXA },
          shading: { fill: '047857', type: ShadingType.CLEAR },
          children: [new Paragraph({ children: [new TextRun({ text: isAm ? 'ተ.ቁ' : '#', bold: true, color: 'FFFFFF' })] })],
        }),
        new TableCell({
          width: { size: 1200, type: WidthType.DXA },
          shading: { fill: '047857', type: ShadingType.CLEAR },
          children: [new Paragraph({ children: [new TextRun({ text: isAm ? 'መለያ ቁጥር' : 'Roll #', bold: true, color: 'FFFFFF' })] })],
        }),
        new TableCell({
          width: { size: 3600, type: WidthType.DXA },
          shading: { fill: '047857', type: ShadingType.CLEAR },
          children: [new Paragraph({ children: [new TextRun({ text: isAm ? 'የተማሪው ሙሉ ስም' : 'Student Name', bold: true, color: 'FFFFFF' })] })],
        }),
        new TableCell({
          width: { size: 2000, type: WidthType.DXA },
          shading: { fill: '047857', type: ShadingType.CLEAR },
          children: [new Paragraph({ children: [new TextRun({ text: isAm ? 'ሁኔታ' : 'Status', bold: true, color: 'FFFFFF' })] })],
        }),
        new TableCell({
          width: { size: 2600, type: WidthType.DXA },
          shading: { fill: '047857', type: ShadingType.CLEAR },
          children: [new Paragraph({ children: [new TextRun({ text: isAm ? 'ማስታወሻ' : 'Notes', bold: true, color: 'FFFFFF' })] })],
        }),
      ],
    }),
  ];

  students.forEach((s, idx) => {
    const rawSt = records[s.id];
    const st = (rawSt === 'present' || rawSt === 'permission' || rawSt === 'late') ? rawSt : 'absent';
    const isAbsent = st === 'absent';
    const isPresent = st === 'present';
    const isPermission = st === 'permission';
    const isLate = st === 'late';

    let statusText = '';
    if (isAm) {
      statusText = isPresent ? 'ተገኝቷል' : isAbsent ? 'ቀሪ' : isPermission ? 'ፈቃድ' : 'ዘግይቷል';
    } else {
      statusText = isPresent ? 'Present' : isAbsent ? 'Absent' : isPermission ? 'Permission' : 'Late';
    }

    attTableRows.push(
      new TableRow({
        children: [
          new TableCell({
            borders: thinBorder,
            children: [new Paragraph({ children: [new TextRun(String(idx + 1))] })],
          }),
          new TableCell({
            borders: thinBorder,
            children: [new Paragraph({ children: [new TextRun(formatRollNumber(s.rollNumber))] })],
          }),
          new TableCell({
            borders: thinBorder,
            children: [new Paragraph({ children: [new TextRun({ text: s.name, bold: true })] })],
          }),
          new TableCell({
            borders: thinBorder,
            shading: isAbsent ? { fill: 'FEE2E2', type: ShadingType.CLEAR } : undefined,
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: statusText,
                    bold: true,
                    color: isPresent ? '059669' : isAbsent ? 'DC2626' : isPermission ? '2563EB' : isLate ? 'D97706' : '64748B',
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            borders: thinBorder,
            children: [new Paragraph({ children: [new TextRun(notes[s.id] || '')] })],
          }),
        ],
      })
    );
  });

  // Section 2: Feeding Activity Rows
  const feedTableRows = [
    new TableRow({
      tableHeader: true,
      children: [
        new TableCell({
          width: { size: 800, type: WidthType.DXA },
          shading: { fill: 'B45309', type: ShadingType.CLEAR },
          children: [new Paragraph({ children: [new TextRun({ text: isAm ? 'ተ.ቁ' : '#', bold: true, color: 'FFFFFF' })] })],
        }),
        new TableCell({
          width: { size: 4600, type: WidthType.DXA },
          shading: { fill: 'B45309', type: ShadingType.CLEAR },
          children: [new Paragraph({ children: [new TextRun({ text: isAm ? 'ተግባር' : 'Activity', bold: true, color: 'FFFFFF' })] })],
        }),
        new TableCell({
          width: { size: 2300, type: WidthType.DXA },
          shading: { fill: 'B45309', type: ShadingType.CLEAR },
          children: [new Paragraph({ children: [new TextRun({ text: isAm ? 'ተጀመረ' : 'Start Time', bold: true, color: 'FFFFFF' })] })],
        }),
        new TableCell({
          width: { size: 2300, type: WidthType.DXA },
          shading: { fill: 'B45309', type: ShadingType.CLEAR },
          children: [new Paragraph({ children: [new TextRun({ text: isAm ? 'አለቀ' : 'End Time', bold: true, color: 'FFFFFF' })] })],
        }),
      ],
    }),
  ];

  if (feeding?.activities && feeding.activities.length > 0) {
    feeding.activities.forEach((row) => {
      feedTableRows.push(
        new TableRow({
          children: [
            new TableCell({
              borders: thinBorder,
              children: [new Paragraph({ children: [new TextRun(String(row.orderNumber))] })],
            }),
            new TableCell({
              borders: thinBorder,
              children: [new Paragraph({ children: [new TextRun({ text: row.activityName, bold: true })] })],
            }),
            new TableCell({
              borders: thinBorder,
              children: [new Paragraph({ children: [new TextRun(row.startTime || '-')] })],
            }),
            new TableCell({
              borders: thinBorder,
              children: [new Paragraph({ children: [new TextRun(row.endTime || '-')] })],
            }),
          ],
        })
      );
    });
  } else {
    // Default placeholder rows
    const defaults = isAm
      ? [
          { no: 1, name: 'አጠቃላይ አገልግሎቱ', start: '-', end: '-' },
          { no: 2, name: 'የተሰጠው ትምህርት / ጨዋታ', start: '-', end: '-' },
          { no: 3, name: 'ምገባ', start: '-', end: '-' },
          { no: 4, name: 'መዝሙር', start: '-', end: '-' },
        ]
      : [
          { no: 1, name: 'General Assembly', start: '-', end: '-' },
          { no: 2, name: 'Lesson / Game', start: '-', end: '-' },
          { no: 3, name: 'Meal Serving', start: '-', end: '-' },
          { no: 4, name: 'Song & Closing', start: '-', end: '-' },
        ];
    defaults.forEach((r) => {
      feedTableRows.push(
        new TableRow({
          children: [
            new TableCell({ borders: thinBorder, children: [new Paragraph({ children: [new TextRun(String(r.no))] })] }),
            new TableCell({ borders: thinBorder, children: [new Paragraph({ children: [new TextRun(r.name)] })] }),
            new TableCell({ borders: thinBorder, children: [new Paragraph({ children: [new TextRun(r.start)] })] }),
            new TableCell({ borders: thinBorder, children: [new Paragraph({ children: [new TextRun(r.end)] })] }),
          ],
        })
      );
    });
  }

  let actLabel = '';
  if (feeding) {
    if (isAm) {
      actLabel = feeding.activityType === 'lesson' ? 'ትምህርት' : feeding.activityType === 'game' ? 'ጨዋታ' : 'ምንም አልተከናወነም';
    } else {
      actLabel = feeding.activityType === 'lesson' ? 'Lesson' : feeding.activityType === 'game' ? 'Game' : 'None';
    }
  }

  // Construct Document
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Document Header
          new Paragraph({
            text: isAm ? 'RollCall — ዕለታዊ የተሟላ ሪፖርት' : 'RollCall — Daily Combined Report',
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.LEFT,
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: isAm
                  ? `ቀን: ${formattedDate} (${date})   |   ክፍል: ${settings.className || 'አጠቃላይ ክፍል'}`
                  : `Date: ${formattedDate} (${date})   |   Class: ${settings.className || 'General Class'}`,
                bold: true,
              }),
            ],
            spacing: { after: 200 },
          }),

          // SECTION 1: ATTENDANCE
          new Paragraph({
            text: isAm ? 'ክፍል 1: የተማሪዎች አቴንዳንስ ሪፖርት' : 'Section 1: Student Attendance Report',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: isAm ? `ጠቅላላ ተማሪዎች: ${stats.totalStudents}   |   ` : `Total Students: ${stats.totalStudents}   |   `, bold: true }),
              new TextRun({ text: isAm ? `የተገኙ: ${stats.present}   |   ` : `Present: ${stats.present}   |   `, bold: true, color: '059669' }),
              new TextRun({ text: isAm ? `ቀሪ: ${stats.absent}   |   ` : `Absent: ${stats.absent}   |   `, bold: true, color: 'DC2626' }),
              new TextRun({ text: isAm ? `ፈቃድ: ${stats.permission}   |   ` : `Permission: ${stats.permission}   |   `, bold: true, color: '2563EB' }),
              new TextRun({ text: isAm ? `የመገኘት መጠን: ${stats.attendanceRate}%` : `Attendance Rate: ${stats.attendanceRate}%`, bold: true }),
            ],
            spacing: { after: 200 },
          }),

          // Attendance Table
          new Table({
            width: { size: 10000, type: WidthType.DXA },
            rows: attTableRows,
          }),

          // SECTION 2: FEEDING
          new Paragraph({
            text: isAm ? 'ክፍል 2: የዕለት ምገባ ሪፖርት' : 'Section 2: Daily Feeding Program Report',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 100 },
          }),

          ...(feeding
            ? [
                new Paragraph({
                  children: [
                    new TextRun({ text: isAm ? 'የዕለቱ ተረኛ አስተባባሪ: ' : 'Coordinator on duty: ', bold: true }),
                    new TextRun({ text: feeding.coordinatorName }),
                  ],
                }),
                new Paragraph({
                  children: [
                    new TextRun({ text: isAm ? 'የምግቡ አይነት: ' : 'Food Type: ', bold: true }),
                    new TextRun({ text: feeding.foodType }),
                  ],
                }),
                new Paragraph({
                  children: [
                    new TextRun({ text: isAm ? 'ምገባው የተከናወነበት ቦታ: ' : 'Feeding Location: ', bold: true }),
                    new TextRun({ text: feeding.location }),
                  ],
                }),
                new Paragraph({
                  children: [
                    new TextRun({ text: isAm ? `የተሳተፉ ህፃናት ቁጥር: ${feeding.childrenCount}   |   ` : `Children Fed: ${feeding.childrenCount}   |   `, bold: true }),
                    new TextRun({ text: isAm ? `አገልጋዮች: ${feeding.volunteersCount}   |   ` : `Volunteers: ${feeding.volunteersCount}   |   `, bold: true }),
                    new TextRun({ text: isAm ? `እንቅስቃሴ: ${actLabel}` : `Activity: ${actLabel}`, bold: true }),
                  ],
                  spacing: { after: 150 },
                }),
              ]
            : [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: isAm
                        ? '* ለዚህ ቀን የምገባ ሪፖርት እስካሁን አልተመዘገበም።'
                        : '* Daily feeding report has not been submitted for this date yet.',
                      italics: true,
                      color: 'B45309',
                    }),
                  ],
                  spacing: { after: 150 },
                }),
              ]),

          // Feeding Activity Table
          new Table({
            width: { size: 10000, type: WidthType.DXA },
            rows: feedTableRows,
          }),

          ...(feeding?.generalNotes
            ? [
                new Paragraph({
                  children: [
                    new TextRun({ text: isAm ? 'በዕለቱ የተፈጠሩ ክፍተቶች ወይም ተግዳሮቶች: ' : 'Gaps or Challenges: ', bold: true }),
                    new TextRun({ text: feeding.generalNotes, italics: true }),
                  ],
                  spacing: { before: 150, after: 150 },
                }),
              ]
            : []),

          new Paragraph({
            children: [
              new TextRun({
                text: 'Generated by RollCall Student Attendance and Feeding Management App',
                italics: true,
                color: '94A3B8',
                size: 16,
              }),
            ],
            spacing: { before: 300 },
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  triggerBlobDownload(blob, `Daily_Report_${date}.docx`);
}

// =========================================================================
// 3. COMBINED EXCEL (.XLSX) EXPORT (Multi-Tab Workbook)
// =========================================================================

export function exportCombinedReportExcel(
  date: string,
  students: Student[],
  attendance: DayAttendance | undefined,
  feeding: DailyFeedingReport | undefined,
  settings: Partial<AppSettings> = {}
): void {
  const isAm = settings.language === 'am';
  const records = attendance?.records || {};
  const notes = attendance?.notes || {};
  const stats = calculateDayStats(students, records, { treatBlankAsAbsent: true });

  const workbook = XLSX.utils.book_new();

  // Tab 1: Executive Summary
  const summaryData: (string | number)[][] = isAm
    ? [
        ['RollCall — ዕለታዊ የተሟላ ሪፖርት'],
        ['ቀን:', date],
        ['ክፍል:', settings.className || 'አጠቃላይ ክፍል'],
        [],
        ['1. የተማሪዎች አቴንዳንስ ማጠቃለያ'],
        ['ጠቅላላ ተማሪዎች:', stats.totalStudents],
        ['የተገኙ ተማሪዎች:', stats.present],
        ['ቀሪዎች:', stats.absent],
        ['ፈቃድ:', stats.permission],
        ['የመገኘት መጠን:', `${stats.attendanceRate}%`],
        [],
        ['2. የዕለት ምገባ ማጠቃለያ'],
        ['ሁኔታ:', feeding ? 'የተመዘገበ' : 'ያልተመዘገበ'],
        ['ተረኛ አስተባባሪ:', feeding?.coordinatorName || '-'],
        ['የምግቡ አይነት:', feeding?.foodType || '-'],
        ['የተከናወነበት ቦታ:', feeding?.location || '-'],
        ['የተሳተፉ ህፃናት ቁጥር:', feeding?.childrenCount !== undefined ? feeding.childrenCount : '-'],
        ['የተሳተፉ አገልጋዮች ብዛት:', feeding?.volunteersCount !== undefined ? feeding.volunteersCount : '-'],
        ['የተሰጠው እንቅስቃሴ:', feeding?.activityType ? (feeding.activityType === 'lesson' ? 'ትምህርት' : feeding.activityType === 'game' ? 'ጨዋታ' : 'ምንም') : '-'],
        ['በዕለቱ የተፈጠሩ ክፍተቶች ወይም ተግዳሮቶች:', feeding?.generalNotes || '-'],
      ]
    : [
        ['RollCall — Daily Combined Report'],
        ['Report Date:', date],
        ['Class / Group:', settings.className || 'General Class'],
        [],
        ['1. Student Attendance Summary'],
        ['Total Students:', stats.totalStudents],
        ['Present Students:', stats.present],
        ['Absent Students:', stats.absent],
        ['Permission:', stats.permission],
        ['Attendance Rate:', `${stats.attendanceRate}%`],
        [],
        ['2. Daily Feeding Summary'],
        ['Status:', feeding ? 'Recorded' : 'Pending'],
        ['Coordinator:', feeding?.coordinatorName || '-'],
        ['Food Type:', feeding?.foodType || '-'],
        ['Location:', feeding?.location || '-'],
        ['Children Fed:', feeding?.childrenCount !== undefined ? feeding.childrenCount : '-'],
        ['Volunteers:', feeding?.volunteersCount !== undefined ? feeding.volunteersCount : '-'],
        ['Activity Type:', feeding?.activityType ? (feeding.activityType === 'lesson' ? 'Lesson' : feeding.activityType === 'game' ? 'Game' : 'None') : '-'],
        ['Gaps or Challenges:', feeding?.generalNotes || '-'],
      ];
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, isAm ? 'ማጠቃለያ' : 'Summary');

  // Tab 2: Student Attendance
  const attData: (string | number)[][] = isAm
    ? [['ተ.ቁ', 'መለያ', 'የተማሪው ሙሉ ስም', 'የመገኘት ሁኔታ', 'ማስታወሻ']]
    : [['#', 'Roll No', 'Student Name', 'Attendance Status', 'Notes']];

  students.forEach((s, idx) => {
    const rawSt = records[s.id];
    const st = (rawSt === 'present' || rawSt === 'permission' || rawSt === 'late') ? rawSt : 'absent';
    let statusText = '';
    if (isAm) {
      statusText = st === 'present' ? 'ተገኝቷል' : st === 'absent' ? 'ቀሪ' : st === 'permission' ? 'ፈቃድ' : 'ዘግይቷል';
    } else {
      statusText = st === 'present' ? 'Present' : st === 'absent' ? 'Absent' : st === 'permission' ? 'Permission' : 'Late';
    }

    attData.push([
      idx + 1,
      formatRollNumber(s.rollNumber),
      s.name,
      statusText,
      notes[s.id] || '',
    ]);
  });
  const attSheet = XLSX.utils.aoa_to_sheet(attData);
  XLSX.utils.book_append_sheet(workbook, attSheet, isAm ? 'አቴንዳንስ' : 'Attendance');

  // Tab 3: Feeding Report
  const feedData: (string | number)[][] = isAm
    ? [
        ['የዕለት ምገባ ሪፖርት — የስራ መርሐግብር'],
        ['ቀን:', date],
        ['ተረኛ አስተባባሪ:', feeding?.coordinatorName || '-'],
        ['ምግብ:', `${feeding?.foodType || '-'} (${feeding?.foodQuantityKg || 0} ኪ.ግ)`],
        [],
        ['ተ.ቁ', 'ተግባር', 'የተጀመረበት ሰዓት', 'የተጠናቀቀበት ሰዓት'],
      ]
    : [
        ['Daily Feeding Report — Activity Schedule'],
        ['Date:', date],
        ['Coordinator on Duty:', feeding?.coordinatorName || '-'],
        ['Food Type:', `${feeding?.foodType || '-'} (${feeding?.foodQuantityKg || 0} kg)`],
        [],
        ['#', 'Activity', 'Start Time', 'End Time'],
      ];

  if (feeding?.activities && feeding.activities.length > 0) {
    feeding.activities.forEach((act) => {
      feedData.push([
        act.orderNumber,
        act.activityName,
        act.startTime || '',
        act.endTime || '',
      ]);
    });
  } else {
    if (isAm) {
      feedData.push([1, 'አጠቃላይ አገልግሎቱ', '', '']);
      feedData.push([2, 'የተሰጠው ትምህርት / ጨዋታ', '', '']);
      feedData.push([3, 'ምገባ', '', '']);
      feedData.push([4, 'መዝሙር', '', '']);
    } else {
      feedData.push([1, 'General Assembly', '', '']);
      feedData.push([2, 'Lesson / Game', '', '']);
      feedData.push([3, 'Meal Serving', '', '']);
      feedData.push([4, 'Song & Closing', '', '']);
    }
  }
  const feedSheet = XLSX.utils.aoa_to_sheet(feedData);
  XLSX.utils.book_append_sheet(workbook, feedSheet, isAm ? 'የምገባ ሪፖርት' : 'Feeding Report');

  XLSX.writeFile(workbook, `Daily_Report_${date}.xlsx`);
}

// =========================================================================
// 4. WEEKLY REPORT EXPORTS (PDF & WORD)
// =========================================================================

export async function exportWeeklyReportPDF(
  summary: {
    startDate: string;
    endDate: string;
    ethiopianLabel: string;
    totalStudents: number;
    totalDays: number;
    totalPresent: number;
    totalAbsent: number;
    totalPermission: number;
    attendanceRate: number;
    feedingSummary: {
      totalChildrenFed: number;
      totalVolunteers: number;
      totalFoodKg: number;
      lessonCount: number;
      gameCount: number;
      nothingCount: number;
    };
    dailyBreakdowns: Array<{
      date: string;
      ethDateStr: string;
      present: number;
      absent: number;
      permission: number;
      rate: number;
      feeding?: DailyFeedingReport;
    }>;
    gapsAndChallenges: Array<{
      date: string;
      ethDateStr: string;
      coordinator: string;
      notes: string;
    }>;
  },
  settings: Partial<AppSettings> = {}
): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const fontLoaded = await ensureEthiopicFont(doc);
  const fontName = fontLoaded ? 'AbyssinicaSIL' : 'helvetica';

  // Top Header Banner
  doc.setFillColor(4, 120, 87); // Emerald 700
  doc.rect(0, 0, 595, 60, 'F');

  doc.setFont(fontName, 'normal');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('RollCall — ሳምንታዊ የተሟላ ሪፖርት (Weekly Summary Report)', 40, 36);

  doc.setFontSize(9);
  doc.setTextColor(209, 250, 229);
  doc.text(
    `የሳምንቱ ጊዜ: ${summary.ethiopianLabel} (${summary.startDate} to ${summary.endDate})   |   ክፍል: ${settings.className || 'General'}`,
    40,
    52
  );

  // SECTION 1: ATTENDANCE KPI BOX
  doc.setFont(fontName, 'normal');
  doc.setFontSize(12);
  doc.setTextColor(4, 120, 87);
  doc.text('1. የተማሪዎች አቴንዳንስ አጠቃላይ ድምር (Attendance Summary)', 40, 82);

  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(40, 92, 515, 34, 4, 4, 'FD');

  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(
    `የተመዘገቡ ተማሪዎች: ${summary.totalStudents}  |  የተመዘገቡ ቀናት: ${summary.totalDays}  |  ተገኝተዋል: ${summary.totalPresent}  |  ቀሪ: ${summary.totalAbsent}  |  ፈቃድ: ${summary.totalPermission}  |  የመገኘት ምጣኔ: ${summary.attendanceRate}%`,
    48,
    113
  );

  // SECTION 2: FEEDING KPI BOX
  doc.setFontSize(12);
  doc.setTextColor(180, 83, 9); // Amber 700
  doc.text('2. የዕለት ምገባ እና እንቅስቃሴ ድምር (Feeding & Activities)', 40, 145);

  doc.setDrawColor(254, 215, 170);
  doc.setFillColor(255, 251, 235);
  doc.roundedRect(40, 155, 515, 34, 4, 4, 'FD');

  doc.setFontSize(8.5);
  doc.setTextColor(120, 53, 15);
  doc.text(
    `ምገባ የተደረገላቸው ህፃናት: ${summary.feedingSummary.totalChildrenFed}  |  አገልጋዮች: ${summary.feedingSummary.totalVolunteers}  |  ትምህርት: ${summary.feedingSummary.lessonCount}  |  ጨዋታ: ${summary.feedingSummary.gameCount}  |  ምንም: ${summary.feedingSummary.nothingCount}`,
    48,
    176
  );

  // Daily Breakdown Table
  const tableHead = [['#', 'ቀን (Date)', 'ተገኝቷል', 'ቀሪ', 'ፈቃድ', 'ምጣኔ', 'የምግብ አይነት', 'እንቅስቃሴ']];
  const tableBody = summary.dailyBreakdowns.map((d, idx) => {
    const act = d.feeding?.activityType;
    const actLabel = act === 'lesson' ? 'ትምህርት' : act === 'game' ? 'ጨዋታ' : act === 'none' ? 'ምንም' : '-';
    const foodStr = d.feeding ? d.feeding.foodType : '-';
    return [
      idx + 1,
      `${d.ethDateStr}\n(${d.date})`,
      d.present,
      d.absent,
      d.permission,
      `${d.rate}%`,
      foodStr,
      actLabel,
    ];
  });

  autoTable(doc, {
    startY: 202,
    head: tableHead,
    body: tableBody,
    theme: 'grid',
    styles: {
      font: fontName,
      fontSize: 8,
      cellPadding: 4,
      textColor: [30, 41, 59],
    },
    headStyles: {
      fillColor: [4, 120, 87],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 22, halign: 'center' },
      1: { cellWidth: 120 },
      2: { cellWidth: 45, halign: 'center' },
      3: { cellWidth: 40, halign: 'center' },
      4: { cellWidth: 40, halign: 'center' },
      5: { cellWidth: 45, halign: 'center' },
      6: { cellWidth: 120 },
      7: { cellWidth: 60, halign: 'center' },
    },
    margin: { left: 40, right: 40 },
  });

  // Gaps & Challenges section
  let finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 18 : 350;
  if (summary.gapsAndChallenges.length > 0) {
    if (finalY > 700) {
      doc.addPage();
      finalY = 40;
    }
    doc.setFont(fontName, 'normal');
    doc.setFontSize(11);
    doc.setTextColor(180, 83, 9);
    doc.text('3. በሳምንቱ የተፈጠሩ ክፍተቶች ወይም ተግዳሮቶች (Gaps & Challenges)', 40, finalY);

    const gapHead = [['ቀን (Date)', 'ተረኛ አስተባባሪ', 'የተመዘገበ ክፍተት ወይም ተግዳሮት']];
    const gapBody = summary.gapsAndChallenges.map((g) => [
      `${g.ethDateStr} (${g.date})`,
      g.coordinator,
      g.notes,
    ]);

    autoTable(doc, {
      startY: finalY + 8,
      head: gapHead,
      body: gapBody,
      theme: 'grid',
      styles: {
        font: fontName,
        fontSize: 8,
        cellPadding: 4,
      },
      headStyles: {
        fillColor: [180, 83, 9],
        textColor: [255, 255, 255],
      },
      columnStyles: {
        0: { cellWidth: 110 },
        1: { cellWidth: 100 },
        2: { cellWidth: 305 },
      },
      margin: { left: 40, right: 40 },
    });
  }

  triggerBlobDownload(doc.output('blob'), `Weekly_Report_${summary.startDate}_to_${summary.endDate}.pdf`);
}

export async function exportWeeklyReportWord(
  summary: {
    startDate: string;
    endDate: string;
    ethiopianLabel: string;
    totalStudents: number;
    totalDays: number;
    totalPresent: number;
    totalAbsent: number;
    totalPermission: number;
    attendanceRate: number;
    feedingSummary: {
      totalChildrenFed: number;
      totalVolunteers: number;
      totalFoodKg: number;
      lessonCount: number;
      gameCount: number;
      nothingCount: number;
    };
    dailyBreakdowns: Array<{
      date: string;
      ethDateStr: string;
      present: number;
      absent: number;
      permission: number;
      rate: number;
      feeding?: DailyFeedingReport;
    }>;
    gapsAndChallenges: Array<{
      date: string;
      ethDateStr: string;
      coordinator: string;
      notes: string;
    }>;
  },
  settings: Partial<AppSettings> = {}
): Promise<void> {
  const tableRows: TableRow[] = [
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '#', bold: true, color: 'FFFFFF' })] })], shading: { fill: '047857', type: ShadingType.CLEAR } }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'ቀን (Date)', bold: true, color: 'FFFFFF' })] })], shading: { fill: '047857', type: ShadingType.CLEAR } }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'ተገኝቷል', bold: true, color: 'FFFFFF' })] })], shading: { fill: '047857', type: ShadingType.CLEAR } }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'ቀሪ', bold: true, color: 'FFFFFF' })] })], shading: { fill: '047857', type: ShadingType.CLEAR } }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'ፈቃድ', bold: true, color: 'FFFFFF' })] })], shading: { fill: '047857', type: ShadingType.CLEAR } }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'ምጣኔ %', bold: true, color: 'FFFFFF' })] })], shading: { fill: '047857', type: ShadingType.CLEAR } }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'የምግብ አይነት', bold: true, color: 'FFFFFF' })] })], shading: { fill: '047857', type: ShadingType.CLEAR } }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'እንቅስቃሴ', bold: true, color: 'FFFFFF' })] })], shading: { fill: '047857', type: ShadingType.CLEAR } }),
      ],
    }),
  ];

  summary.dailyBreakdowns.forEach((d, idx) => {
    const act = d.feeding?.activityType;
    const actLabel = act === 'lesson' ? 'ትምህርት (Lesson)' : act === 'game' ? 'ጨዋታ (Game)' : act === 'none' ? 'ምንም (Nothing)' : '-';
    const foodStr = d.feeding ? d.feeding.foodType : '-';
    tableRows.push(
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ text: String(idx + 1) })] }),
          new TableCell({ children: [new Paragraph({ text: `${d.ethDateStr} (${d.date})` })] }),
          new TableCell({ children: [new Paragraph({ text: String(d.present) })] }),
          new TableCell({ children: [new Paragraph({ text: String(d.absent) })] }),
          new TableCell({ children: [new Paragraph({ text: String(d.permission) })] }),
          new TableCell({ children: [new Paragraph({ text: `${d.rate}%` })] }),
          new TableCell({ children: [new Paragraph({ text: foodStr })] }),
          new TableCell({ children: [new Paragraph({ text: actLabel })] }),
        ],
      })
    );
  });

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: 'RollCall — ሳምንታዊ የተሟላ ሪፖርት (Weekly Summary Report)',
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `የሳምንቱ ጊዜ: ${summary.ethiopianLabel} (${summary.startDate} to ${summary.endDate})\n`, bold: true }),
              new TextRun({ text: `ክፍል: ${settings.className || 'General'}   |   መምህር: ${settings.teacherName || 'Instructor'}\n` }),
              new TextRun({
                text: `ድምር ተማሪዎች: ${summary.totalStudents}  |  የተመዘገቡ ቀናት: ${summary.totalDays}  |  ተገኝተዋል: ${summary.totalPresent}  |  ቀሪ: ${summary.totalAbsent}  |  ፈቃድ: ${summary.totalPermission}  |  የመገኘት ምጣኔ: ${summary.attendanceRate}%\n`,
                bold: true,
              }),
              new TextRun({
                text: `ምገባ የተደረገላቸው ህፃናት: ${summary.feedingSummary.totalChildrenFed}  |  አገልጋዮች: ${summary.feedingSummary.totalVolunteers}  |  ትምህርት: ${summary.feedingSummary.lessonCount}  |  ጨዋታ: ${summary.feedingSummary.gameCount}  |  ምንም: ${summary.feedingSummary.nothingCount}\n`,
              }),
            ],
          }),
          new Paragraph({ text: 'ዕለታዊ ዝርዝር መረጃዎች (Daily Records)', heading: HeadingLevel.HEADING_2 }),
          new Table({
            rows: tableRows,
            width: { size: 100, type: WidthType.PERCENTAGE },
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  triggerBlobDownload(blob, `Weekly_Report_${summary.startDate}_to_${summary.endDate}.docx`);
}

// =========================================================================
// 5. MONTHLY REPORT EXPORTS (PDF & WORD)
// =========================================================================

export async function exportMonthlyReportPDF(
  summary: {
    ethYear: number;
    ethMonth: number;
    ethMonthName: string;
    startDate: string;
    endDate: string;
    label: string;
    totalStudents: number;
    totalDays: number;
    totalPresent: number;
    totalAbsent: number;
    totalPermission: number;
    attendanceRate: number;
    feedingSummary: {
      totalChildrenFed: number;
      totalVolunteers: number;
      totalFoodKg: number;
      lessonCount: number;
      gameCount: number;
      nothingCount: number;
    };
    dailyBreakdowns: Array<{
      date: string;
      ethDateStr: string;
      present: number;
      absent: number;
      permission: number;
      rate: number;
      feeding?: DailyFeedingReport;
    }>;
    gapsAndChallenges: Array<{
      date: string;
      ethDateStr: string;
      coordinator: string;
      notes: string;
    }>;
  },
  settings: Partial<AppSettings> = {}
): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const fontLoaded = await ensureEthiopicFont(doc);
  const fontName = fontLoaded ? 'AbyssinicaSIL' : 'helvetica';

  // Top Header Banner
  doc.setFillColor(4, 120, 87);
  doc.rect(0, 0, 595, 60, 'F');

  doc.setFont(fontName, 'normal');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text(`RollCall — ወርሃዊ የተሟላ ሪፖርት: ${summary.label}`, 40, 36);

  doc.setFontSize(9);
  doc.setTextColor(209, 250, 229);
  doc.text(
    `የቀን ገደብ: ${summary.startDate} እስከ ${summary.endDate}   |   ክፍል: ${settings.className || 'General'}`,
    40,
    52
  );

  // SECTION 1: ATTENDANCE KPI BOX
  doc.setFont(fontName, 'normal');
  doc.setFontSize(12);
  doc.setTextColor(4, 120, 87);
  doc.text('1. የወሩ የተማሪዎች አቴንዳንስ አጠቃላይ ድምር (Monthly Attendance)', 40, 82);

  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(40, 92, 515, 34, 4, 4, 'FD');

  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(
    `የተመዘገቡ ተማሪዎች: ${summary.totalStudents}  |  የተመዘገቡ ቀናት: ${summary.totalDays}  |  ተገኝተዋል: ${summary.totalPresent}  |  ቀሪ: ${summary.totalAbsent}  |  ፈቃድ: ${summary.totalPermission}  |  የመገኘት ምጣኔ: ${summary.attendanceRate}%`,
    48,
    113
  );

  // SECTION 2: FEEDING KPI BOX
  doc.setFontSize(12);
  doc.setTextColor(180, 83, 9);
  doc.text('2. የወሩ የምገባ እና እንቅስቃሴ ድምር (Monthly Feeding & Activities)', 40, 145);

  doc.setDrawColor(254, 215, 170);
  doc.setFillColor(255, 251, 235);
  doc.roundedRect(40, 155, 515, 34, 4, 4, 'FD');

  doc.setFontSize(8.5);
  doc.setTextColor(120, 53, 15);
  doc.text(
    `ምገባ የተደረገላቸው ህፃናት: ${summary.feedingSummary.totalChildrenFed}  |  አገልጋዮች: ${summary.feedingSummary.totalVolunteers}  |  ትምህርት: ${summary.feedingSummary.lessonCount}  |  ጨዋታ: ${summary.feedingSummary.gameCount}  |  ምንም: ${summary.feedingSummary.nothingCount}`,
    48,
    176
  );

  // Table of daily breakdowns in month
  const tableHead = [['#', 'ቀን (Date)', 'ተገኝቷል', 'ቀሪ', 'ፈቃድ', 'ምጣኔ', 'የምግብ አይነት', 'እንቅስቃሴ']];
  const tableBody = summary.dailyBreakdowns.map((d, idx) => {
    const act = d.feeding?.activityType;
    const actLabel = act === 'lesson' ? 'ትምህርት' : act === 'game' ? 'ጨዋታ' : act === 'none' ? 'ምንም' : '-';
    const foodStr = d.feeding ? d.feeding.foodType : '-';
    return [
      idx + 1,
      `${d.ethDateStr}\n(${d.date})`,
      d.present,
      d.absent,
      d.permission,
      `${d.rate}%`,
      foodStr,
      actLabel,
    ];
  });

  autoTable(doc, {
    startY: 202,
    head: tableHead,
    body: tableBody,
    theme: 'grid',
    styles: {
      font: fontName,
      fontSize: 8,
      cellPadding: 4,
    },
    headStyles: {
      fillColor: [4, 120, 87],
      textColor: [255, 255, 255],
    },
    columnStyles: {
      0: { cellWidth: 22, halign: 'center' },
      1: { cellWidth: 120 },
      2: { cellWidth: 45, halign: 'center' },
      3: { cellWidth: 40, halign: 'center' },
      4: { cellWidth: 40, halign: 'center' },
      5: { cellWidth: 45, halign: 'center' },
      6: { cellWidth: 120 },
      7: { cellWidth: 60, halign: 'center' },
    },
    margin: { left: 40, right: 40 },
  });

  triggerBlobDownload(doc.output('blob'), `Monthly_Report_${summary.ethMonthName}_${summary.ethYear}.pdf`);
}

export async function exportMonthlyReportWord(
  summary: {
    ethYear: number;
    ethMonth: number;
    ethMonthName: string;
    startDate: string;
    endDate: string;
    label: string;
    totalStudents: number;
    totalDays: number;
    totalPresent: number;
    totalAbsent: number;
    totalPermission: number;
    attendanceRate: number;
    feedingSummary: {
      totalChildrenFed: number;
      totalVolunteers: number;
      totalFoodKg: number;
      lessonCount: number;
      gameCount: number;
      nothingCount: number;
    };
    dailyBreakdowns: Array<{
      date: string;
      ethDateStr: string;
      present: number;
      absent: number;
      permission: number;
      rate: number;
      feeding?: DailyFeedingReport;
    }>;
    gapsAndChallenges: Array<{
      date: string;
      ethDateStr: string;
      coordinator: string;
      notes: string;
    }>;
  },
  settings: Partial<AppSettings> = {}
): Promise<void> {
  const tableRows: TableRow[] = [
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '#', bold: true, color: 'FFFFFF' })] })], shading: { fill: '047857', type: ShadingType.CLEAR } }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'ቀን (Date)', bold: true, color: 'FFFFFF' })] })], shading: { fill: '047857', type: ShadingType.CLEAR } }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'ተገኝቷል', bold: true, color: 'FFFFFF' })] })], shading: { fill: '047857', type: ShadingType.CLEAR } }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'ቀሪ', bold: true, color: 'FFFFFF' })] })], shading: { fill: '047857', type: ShadingType.CLEAR } }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'ፈቃድ', bold: true, color: 'FFFFFF' })] })], shading: { fill: '047857', type: ShadingType.CLEAR } }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'ምጣኔ %', bold: true, color: 'FFFFFF' })] })], shading: { fill: '047857', type: ShadingType.CLEAR } }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'የምግብ አይነት', bold: true, color: 'FFFFFF' })] })], shading: { fill: '047857', type: ShadingType.CLEAR } }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'እንቅስቃሴ', bold: true, color: 'FFFFFF' })] })], shading: { fill: '047857', type: ShadingType.CLEAR } }),
      ],
    }),
  ];

  summary.dailyBreakdowns.forEach((d, idx) => {
    const act = d.feeding?.activityType;
    const actLabel = act === 'lesson' ? 'ትምህርት (Lesson)' : act === 'game' ? 'ጨዋታ (Game)' : act === 'none' ? 'ምንም (Nothing)' : '-';
    const foodStr = d.feeding ? d.feeding.foodType : '-';
    tableRows.push(
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ text: String(idx + 1) })] }),
          new TableCell({ children: [new Paragraph({ text: `${d.ethDateStr} (${d.date})` })] }),
          new TableCell({ children: [new Paragraph({ text: String(d.present) })] }),
          new TableCell({ children: [new Paragraph({ text: String(d.absent) })] }),
          new TableCell({ children: [new Paragraph({ text: String(d.permission) })] }),
          new TableCell({ children: [new Paragraph({ text: `${d.rate}%` })] }),
          new TableCell({ children: [new Paragraph({ text: foodStr })] }),
          new TableCell({ children: [new Paragraph({ text: actLabel })] }),
        ],
      })
    );
  });

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: `RollCall — ወርሃዊ የተሟላ ሪፖርት: ${summary.label}`,
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `የቀን ገደብ: ${summary.startDate} እስከ ${summary.endDate}\n`, bold: true }),
              new TextRun({ text: `ክፍል: ${settings.className || 'General'}   |   መምህር: ${settings.teacherName || 'Instructor'}\n` }),
              new TextRun({
                text: `ድምር ተማሪዎች: ${summary.totalStudents}  |  የተመዘገቡ ቀናት: ${summary.totalDays}  |  ተገኝተዋል: ${summary.totalPresent}  |  ቀሪ: ${summary.totalAbsent}  |  ፈቃድ: ${summary.totalPermission}  |  የመገኘት ምጣኔ: ${summary.attendanceRate}%\n`,
                bold: true,
              }),
              new TextRun({
                text: `ምገባ የተደረገላቸው ህፃናት: ${summary.feedingSummary.totalChildrenFed}  |  አገልጋዮች: ${summary.feedingSummary.totalVolunteers}  |  ትምህርት: ${summary.feedingSummary.lessonCount}  |  ጨዋታ: ${summary.feedingSummary.gameCount}  |  ምንም: ${summary.feedingSummary.nothingCount}\n`,
              }),
            ],
          }),
          new Paragraph({ text: 'ዕለታዊ ዝርዝር መረጃዎች (Daily Records in Month)', heading: HeadingLevel.HEADING_2 }),
          new Table({
            rows: tableRows,
            width: { size: 100, type: WidthType.PERCENTAGE },
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  triggerBlobDownload(blob, `Monthly_Report_${summary.ethMonthName}_${summary.ethYear}.docx`);
}
