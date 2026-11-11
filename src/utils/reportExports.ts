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
  ShadingType,
} from 'docx';
import type { Student, DayAttendance, AppSettings, DailyFeedingReport } from '../types.ts';
import { calculateDayStats, formatDisplayDate, formatRollNumber } from './attendance.ts';
import { ensureEthiopicFont } from './pdfFont.ts';

export {
  exportCombinedReportPDF,
  exportCombinedReportWord,
  exportCombinedReportExcel,
  exportWeeklyReportPDF,
  exportWeeklyReportWord,
  exportMonthlyReportPDF,
  exportMonthlyReportWord,
} from './combinedExports.ts';

// Helper to download blob
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

// ==========================================
// 1. DAILY STUDENT ATTENDANCE EXPORTS
// ==========================================

export async function exportDailyAttendancePDF(
  date: string,
  students: Student[],
  dayAttendance: DayAttendance | undefined,
  settings: Partial<AppSettings> = {}
): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const fontLoaded = await ensureEthiopicFont(doc);
  const fontName = fontLoaded ? 'AbyssinicaSIL' : 'helvetica';

  const records = dayAttendance?.records || {};
  const notes = dayAttendance?.notes || {};
  const formattedDate = formatDisplayDate(date);
  const stats = calculateDayStats(students, records, { treatBlankAsAbsent: true });

  // Header Title
  doc.setFont(fontName, 'bold');
  doc.setFontSize(16);
  doc.setTextColor(4, 120, 87); // Emerald 700
  doc.text('Student Attendance Report / የተማሪዎች አቴንዳንስ ሪፖርት', 40, 45);

  // Subtitle
  doc.setFont(fontName, 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Class: ${settings.className || 'General Class'}   |   Teacher: ${
      settings.teacherName || 'Instructor'
    }   |   Date: ${formattedDate} (${date})`,
    40,
    65
  );

  // Summary Metrics Bar
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(40, 78, 515, 34, 4, 4, 'FD');

  doc.setFont(fontName, 'normal');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(
    `Total Students: ${stats.totalStudents}    |    Present: ${stats.present}    |    Absent: ${stats.absent}    |    Permission: ${stats.permission}    |    Rate: ${stats.attendanceRate}%`,
    50,
    99
  );

  // Table Body
  const head = [['#', 'Roll', 'Student Name', 'Status', 'Notes']];
  const body = students.map((s, index) => {
    const rawSt = records[s.id];
    const st = (rawSt === 'present' || rawSt === 'permission' || rawSt === 'late') ? rawSt : 'absent';
    const note = notes[s.id] || '-';
    const statusLabel =
      st === 'present'
        ? 'Present (ተገኝቷል)'
        : st === 'absent'
        ? 'Absent (ቀሪ)'
        : st === 'permission'
        ? 'Permission (ፈቃድ)'
        : 'Late (ዘግይቷል)';

    return [
      index + 1,
      formatRollNumber(s.rollNumber),
      s.name,
      statusLabel,
      note,
    ];
  });

  autoTable(doc, {
    startY: 122,
    head: head,
    body: body,
    theme: 'striped',
    headStyles: {
      fillColor: [4, 120, 87],
      textColor: [255, 255, 255],
      font: fontName,
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 30 },
      1: { halign: 'center', cellWidth: 45 },
      2: { halign: 'left' },
      3: { halign: 'center' },
      4: { halign: 'left' },
    },
    styles: {
      font: fontName,
      fontSize: 9,
      cellPadding: 5,
    },
    didDrawPage: (data) => {
      const pageCount = (doc as any).internal.getNumberOfPages();
      doc.setFont(fontName, 'normal');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Page ${data.pageNumber} of ${pageCount}  •  Attendance & Feeding Management`,
        40,
        doc.internal.pageSize.height - 20
      );
    },
  });

  doc.save(`Attendance_Report_${date}.pdf`);
}

export async function exportDailyAttendanceWord(
  date: string,
  students: Student[],
  dayAttendance: DayAttendance | undefined,
  settings: Partial<AppSettings> = {}
): Promise<void> {
  const records = dayAttendance?.records || {};
  const notes = dayAttendance?.notes || {};
  const stats = calculateDayStats(students, records, { treatBlankAsAbsent: true });
  const formattedDate = formatDisplayDate(date);

  const tableRows: TableRow[] = [
    new TableRow({
      tableHeader: true,
      children: [
        new TableCell({
          width: { size: 800, type: WidthType.DXA },
          shading: { fill: '047857', type: ShadingType.CLEAR },
          children: [new Paragraph({ children: [new TextRun({ text: 'ተ.ቁ', bold: true, color: 'FFFFFF' })] })],
        }),
        new TableCell({
          width: { size: 1400, type: WidthType.DXA },
          shading: { fill: '047857', type: ShadingType.CLEAR },
          children: [new Paragraph({ children: [new TextRun({ text: 'መለያ ቁጥር', bold: true, color: 'FFFFFF' })] })],
        }),
        new TableCell({
          width: { size: 4000, type: WidthType.DXA },
          shading: { fill: '047857', type: ShadingType.CLEAR },
          children: [new Paragraph({ children: [new TextRun({ text: 'የተማሪው ሙሉ ስም', bold: true, color: 'FFFFFF' })] })],
        }),
        new TableCell({
          width: { size: 2000, type: WidthType.DXA },
          shading: { fill: '047857', type: ShadingType.CLEAR },
          children: [new Paragraph({ children: [new TextRun({ text: 'ሁኔታ', bold: true, color: 'FFFFFF' })] })],
        }),
        new TableCell({
          width: { size: 1800, type: WidthType.DXA },
          shading: { fill: '047857', type: ShadingType.CLEAR },
          children: [new Paragraph({ children: [new TextRun({ text: 'ማስታወሻ', bold: true, color: 'FFFFFF' })] })],
        }),
      ],
    }),
  ];

  students.forEach((s, idx) => {
    const rawSt = records[s.id];
    const st = (rawSt === 'present' || rawSt === 'permission' || rawSt === 'late') ? rawSt : 'absent';
    const note = notes[s.id] || '-';
    const statusLabel =
      st === 'present'
        ? 'ተገኝቷል (Present)'
        : st === 'absent'
        ? 'ቀሪ (Absent)'
        : st === 'permission'
        ? 'ፈቃድ (Permission)'
        : 'ዘግይቷል (Late)';

    tableRows.push(
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(idx + 1) })] })],
          }),
          new TableCell({
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: formatRollNumber(s.rollNumber) })] })],
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: s.name, bold: true })] })],
          }),
          new TableCell({
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: statusLabel })] })],
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: note })] })],
          }),
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
            text: 'የተማሪዎች አቴንዳንስ ሪፖርት (Student Attendance Report)',
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.LEFT,
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `ክፍል (Class): ${settings.className || 'General'}   |   አስተማሪ (Teacher): ${settings.teacherName || 'Instructor'}   |   ቀን (Date): ${formattedDate} (${date})\n`, italics: true, color: '64748B' }),
              new TextRun({ text: `ጠቅላላ ተማሪዎች: ${stats.totalStudents}   |   የተገኙ: ${stats.present}   |   ቀሪዎች: ${stats.absent}   |   ፈቃድ: ${stats.permission}   |   የመገኘት መጠን: ${stats.attendanceRate}%\n`, bold: true }),
            ],
            spacing: { after: 200 },
          }),
          new Table({
            width: { size: 10000, type: WidthType.DXA },
            rows: tableRows,
          }),
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
  triggerBlobDownload(blob, `Attendance_Report_${date}.docx`);
}

export function exportDailyAttendanceExcel(
  date: string,
  students: Student[],
  dayAttendance: DayAttendance | undefined,
  settings: Partial<AppSettings> = {}
): void {
  const records = dayAttendance?.records || {};
  const notes = dayAttendance?.notes || {};
  const stats = calculateDayStats(students, records, { treatBlankAsAbsent: true });

  const workbook = XLSX.utils.book_new();

  const data: (string | number)[][] = [
    ['የተማሪዎች አቴንዳንስ ሪፖርት / Student Attendance Report'],
    ['ቀን (Date):', date],
    ['ክፍል (Class):', settings.className || 'General'],
    ['አስተማሪ (Teacher):', settings.teacherName || 'Instructor'],
    ['ጠቅላላ ተማሪዎች:', stats.totalStudents, 'የተገኙ:', stats.present, 'ቀሪ:', stats.absent, 'ፈቃድ:', stats.permission, 'መቶኛ:', `${stats.attendanceRate}%`],
    [],
    ['ተ.ቁ (No)', 'መለያ (Roll No)', 'የተማሪው ስም (Student Name)', 'ሁኔታ (Attendance Status)', 'ማስታወሻ (Notes)'],
  ];

  students.forEach((s, idx) => {
    const rawSt = records[s.id];
    const st = (rawSt === 'present' || rawSt === 'permission' || rawSt === 'late') ? rawSt : 'absent';
    const note = notes[s.id] || '';
    const statusLabel =
      st === 'present'
        ? 'Present'
        : st === 'absent'
        ? 'Absent'
        : st === 'permission'
        ? 'Permission'
        : 'Late';

    data.push([
      idx + 1,
      formatRollNumber(s.rollNumber),
      s.name,
      statusLabel,
      note,
    ]);
  });

  const worksheet = XLSX.utils.aoa_to_sheet(data);
  XLSX.utils.book_append_sheet(workbook, worksheet, `Attendance_${date}`);
  XLSX.writeFile(workbook, `Attendance_Report_${date}.xlsx`);
}

// ==========================================
// 2. DAILY FEEDING REPORT EXPORTS
// ==========================================

export async function exportFeedingReportPDF(report: DailyFeedingReport): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const fontLoaded = await ensureEthiopicFont(doc);
  const fontName = fontLoaded ? 'AbyssinicaSIL' : 'helvetica';

  const actTypeLabel =
    report.activityType === 'lesson'
      ? 'ትምህርት (Lesson)'
      : report.activityType === 'game'
      ? 'ጨዋታ (Game)'
      : 'ምንም (Nothing)';

  // Title
  doc.setFont(fontName, 'bold');
  doc.setFontSize(16);
  doc.setTextColor(4, 120, 87);
  doc.text('Daily Feeding Report / የዕለት ምገባ ሪፖርት', 40, 45);

  // Subtitle
  doc.setFont(fontName, 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`ቀን (Date): ${report.date}   |   ቦታ (Location): ${report.location}`, 40, 65);

  // Metadata Card
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(40, 78, 515, 95, 4, 4, 'FD');

  doc.setFont(fontName, 'normal');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);

  doc.text(`• Coordinator / የዕለቱ ተረኛ አስተባባሪ:  ${report.coordinatorName}`, 55, 98);
  doc.text(`• Food Type / የምግቡ አይነት:  ${report.foodType}`, 55, 116);
  doc.text(`• Feeding Location / ምገባው የተከናወነበት ቦታ:  ${report.location}`, 55, 134);
  doc.text(
    `• Children Count / የህፃናት ቁጥር: ${report.childrenCount}    |    Volunteers / አገልጋዮች: ${report.volunteersCount}    |    Activity: ${actTypeLabel}`,
    55,
    152
  );

  // Recreated Feeding Activity Table (Header: ተ.ቁ, ተግባር, ሰዓት -> ተጀመረ, አለቀ)
  doc.setFont(fontName, 'bold');
  doc.setFontSize(11);
  doc.setTextColor(4, 120, 87);
  doc.text('Feeding Activity Schedule / የምገባ ተግባራት ሰሌዳ', 40, 195);

  const head = [
    [
      { content: 'ተ.ቁ\n(No)', rowSpan: 2, styles: { halign: 'center' as const, valign: 'middle' as const, font: fontName } },
      { content: 'ተግባር\n(Activity)', rowSpan: 2, styles: { halign: 'left' as const, valign: 'middle' as const, font: fontName } },
      { content: 'ሰዓት (Time)', colSpan: 2, styles: { halign: 'center' as const, font: fontName } },
    ],
    [
      { content: 'ተጀመረ (Start)', styles: { halign: 'center' as const, font: fontName } },
      { content: 'አለቀ (End)', styles: { halign: 'center' as const, font: fontName } },
    ],
  ];

  const body = (report.activities || []).map((row) => [
    row.orderNumber,
    row.activityName,
    row.startTime || '-',
    row.endTime || '-',
  ]);

  autoTable(doc, {
    startY: 205,
    head: head,
    body: body,
    theme: 'grid',
    headStyles: {
      fillColor: [4, 120, 87],
      textColor: [255, 255, 255],
      font: fontName,
      fontStyle: 'bold',
      lineColor: [30, 41, 59],
      lineWidth: 1,
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 40 },
      1: { halign: 'left' },
      2: { halign: 'center', cellWidth: 90 },
      3: { halign: 'center', cellWidth: 90 },
    },
    styles: {
      font: fontName,
      fontSize: 9,
      cellPadding: 6,
      lineColor: [203, 213, 225],
    },
    didDrawPage: (data) => {
      const pageCount = (doc as any).internal.getNumberOfPages();
      doc.setFont(fontName, 'normal');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Page ${data.pageNumber} of ${pageCount}  •  Daily Feeding Program Report`,
        40,
        doc.internal.pageSize.height - 20
      );
    },
  });

  if (report.generalNotes) {
    const finalY = (doc as any).lastAutoTable?.finalY || 350;
    doc.setFont(fontName, 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    // Explicit requested Amharic heading
    doc.text('በዕለቱ የተፈጠሩ ክፍተቶች ወይም ተግዳሮቶች:', 40, finalY + 25);
    doc.setFont(fontName, 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(report.generalNotes, 40, finalY + 40, { maxWidth: 515 });
  }

  doc.save(`Feeding_Report_${report.date}.pdf`);
}

export async function exportFeedingReportWord(report: DailyFeedingReport): Promise<void> {
  const actTypeLabel =
    report.activityType === 'lesson'
      ? 'ትምህርት (Lesson)'
      : report.activityType === 'game'
      ? 'ጨዋታ (Game)'
      : 'ምንም (Nothing)';

  const tableRows: TableRow[] = [
    new TableRow({
      tableHeader: true,
      children: [
        new TableCell({
          width: { size: 1000, type: WidthType.DXA },
          shading: { fill: '047857', type: ShadingType.CLEAR },
          children: [new Paragraph({ children: [new TextRun({ text: 'ተ.ቁ (No)', bold: true, color: 'FFFFFF' })] })],
        }),
        new TableCell({
          width: { size: 4500, type: WidthType.DXA },
          shading: { fill: '047857', type: ShadingType.CLEAR },
          children: [new Paragraph({ children: [new TextRun({ text: 'ተግባር (Activity)', bold: true, color: 'FFFFFF' })] })],
        }),
        new TableCell({
          width: { size: 2250, type: WidthType.DXA },
          shading: { fill: '047857', type: ShadingType.CLEAR },
          children: [new Paragraph({ children: [new TextRun({ text: 'ተጀመረ (Start Time)', bold: true, color: 'FFFFFF' })] })],
        }),
        new TableCell({
          width: { size: 2250, type: WidthType.DXA },
          shading: { fill: '047857', type: ShadingType.CLEAR },
          children: [new Paragraph({ children: [new TextRun({ text: 'አለቀ (End Time)', bold: true, color: 'FFFFFF' })] })],
        }),
      ],
    }),
  ];

  (report.activities || []).forEach((row) => {
    tableRows.push(
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(row.orderNumber), bold: true })] })],
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: row.activityName || '-', bold: true })] })],
          }),
          new TableCell({
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: row.startTime || '-' })] })],
          }),
          new TableCell({
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: row.endTime || '-' })] })],
          }),
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
            text: 'የዕለት ምገባ ሪፖርት (Daily Feeding Report)',
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.LEFT,
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `ቀን (Date): ${report.date}   |   ማዕከል / ቦታ: ${report.location}\n`, italics: true, color: '64748B' }),
              new TextRun({ text: `የዕለቱ ተረኛ አስተባባሪ: `, bold: true }),
              new TextRun({ text: `${report.coordinatorName}\n` }),
              new TextRun({ text: `የምግቡ አይነት: `, bold: true }),
              new TextRun({ text: `${report.foodType}\n` }),
              new TextRun({ text: `ምገባው የተከናወነበት ቦታ: `, bold: true }),
              new TextRun({ text: `${report.location}\n` }),
              new TextRun({ text: `ምገባው ላይ የተሳተፉ ህፃናት ቁጥር: `, bold: true }),
              new TextRun({ text: `${report.childrenCount}\n` }),
              new TextRun({ text: `የተሳተፉ አገልጋዮች ብዛት: `, bold: true }),
              new TextRun({ text: `${report.volunteersCount}\n` }),
              new TextRun({ text: `የተሰጠው ትምህርት ወይም ጨዋታ: `, bold: true }),
              new TextRun({ text: `${actTypeLabel}\n` }),
            ],
            spacing: { after: 200 },
          }),
          new Paragraph({
            text: 'የምገባ ተግባራት እና የጊዜ ሰሌዳ (Activity Schedule)',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 120 },
          }),
          new Table({
            width: { size: 10000, type: WidthType.DXA },
            rows: tableRows,
          }),
          ...(report.generalNotes
            ? [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: 'በዕለቱ የተፈጠሩ ክፍተቶች ወይም ተግዳሮቶች: ',
                      bold: true,
                      size: 22,
                    }),
                    new TextRun({
                      text: report.generalNotes,
                      italics: true,
                      size: 20,
                    }),
                  ],
                  spacing: { before: 250, after: 150 },
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
  triggerBlobDownload(blob, `Feeding_Report_${report.date}.docx`);
}

export function exportFeedingReportExcel(report: DailyFeedingReport): void {
  const workbook = XLSX.utils.book_new();

  const actTypeLabel =
    report.activityType === 'lesson'
      ? 'ትምህርት (Lesson)'
      : report.activityType === 'game'
      ? 'ጨዋታ (Game)'
      : 'ምንም (Nothing)';

  const data: (string | number)[][] = [
    ['የዕለት ምገባ ሪፖርት / Daily Feeding Report'],
    ['ቀን (Report Date):', report.date],
    ['የዕለቱ ተረኛ አስተባባሪ (Coordinator):', report.coordinatorName],
    ['የምግቡ አይነት (Food Type):', report.foodType],
    ['ምገባው የተከናወነበት ቦታ (Location):', report.location],
    ['የተሳተፉ ህፃናት ቁጥር (Children Count):', report.childrenCount],
    ['የተሳተፉ አገልጋዮች ብዛት (Volunteers Count):', report.volunteersCount],
    ['የተሰጠው ትምህርት ወይም ጨዋታ:', actTypeLabel],
    ['በዕለቱ የተፈጠሩ ክፍተቶች ወይም ተግዳሮቶች:', report.generalNotes || ''],
    [],
    ['ተ.ቁ (No)', 'ተግባር (Activity)', 'ተጀመረ (Start Time)', 'አለቀ (End Time)'],
  ];

  (report.activities || []).forEach((row) => {
    data.push([
      row.orderNumber,
      row.activityName,
      row.startTime || '',
      row.endTime || '',
    ]);
  });

  const worksheet = XLSX.utils.aoa_to_sheet(data);
  XLSX.utils.book_append_sheet(workbook, worksheet, `Feeding_${report.date}`);
  XLSX.writeFile(workbook, `Feeding_Report_${report.date}.xlsx`);
}

export function exportAllFeedingHistoryExcel(reports: DailyFeedingReport[]): void {
  const workbook = XLSX.utils.book_new();

  const header = [
    'Date (ቀን)',
    'Coordinator (ተረኛ አስተባባሪ)',
    'Food Type (የምግቡ አይነት)',
    'Location (ቦታ)',
    'Children Count (ህፃናት ቁጥር)',
    'Volunteers (አገልጋዮች)',
    'Activity Type (ትምህርት/ጨዋታ)',
    'Notes (ማስታወሻ)',
  ];

  const rows = reports.map((r) => [
    r.date,
    r.coordinatorName,
    r.foodType,
    r.location,
    r.childrenCount,
    r.volunteersCount,
    r.activityType === 'lesson'
      ? 'Lesson'
      : r.activityType === 'game'
      ? 'Game'
      : 'Nothing',
    r.generalNotes || '',
  ]);

  const worksheet = XLSX.utils.aoa_to_sheet([header, ...rows]);
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Feeding History');
  XLSX.writeFile(workbook, `Feeding_History_${new Date().toISOString().slice(0, 10)}.xlsx`);
}
