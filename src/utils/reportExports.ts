import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Student, DayAttendance, AppSettings, DailyFeedingReport } from '../types.ts';
import { calculateDayStats, formatDisplayDate, formatRollNumber } from './attendance.ts';

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

export function exportDailyAttendancePDF(
  date: string,
  students: Student[],
  dayAttendance: DayAttendance | undefined,
  settings: Partial<AppSettings> = {}
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const records = dayAttendance?.records || {};
  const notes = dayAttendance?.notes || {};
  const formattedDate = formatDisplayDate(date);
  const stats = calculateDayStats(students, records, { treatBlankAsAbsent: true });

  // Header Title
  doc.setFontSize(18);
  doc.setTextColor(4, 120, 87); // Emerald 700
  doc.text('Student Attendance Report / የተማሪዎች አቴንዳንስ ሪፖርት', 40, 45);

  // Subtitle
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
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 30 },
      1: { halign: 'center', cellWidth: 45 },
      2: { halign: 'left' },
      3: { halign: 'center', fontStyle: 'bold' },
      4: { halign: 'left' },
    },
    styles: {
      fontSize: 9,
      cellPadding: 5,
    },
    didDrawPage: (data) => {
      const pageCount = (doc as any).internal.getNumberOfPages();
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

export function exportDailyAttendanceWord(
  date: string,
  students: Student[],
  dayAttendance: DayAttendance | undefined,
  settings: Partial<AppSettings> = {}
): void {
  const records = dayAttendance?.records || {};
  const notes = dayAttendance?.notes || {};
  const stats = calculateDayStats(students, records, { treatBlankAsAbsent: true });
  const formattedDate = formatDisplayDate(date);

  let rowsHtml = '';
  students.forEach((s, idx) => {
    const rawSt = records[s.id];
    const st = (rawSt === 'present' || rawSt === 'permission' || rawSt === 'late') ? rawSt : 'absent';
    const note = notes[s.id] || '-';
    const isAbsent = st === 'absent';
    const isPresent = st === 'present';
    const isPermission = st === 'permission';
    const isLate = st === 'late';

    const statusBadge = isPresent
      ? '<span style="color:#059669; font-weight:bold;">Present / ተገኝቷል</span>'
      : isAbsent
      ? '<span style="color:#dc2626; font-weight:bold;">Absent / ቀሪ</span>'
      : isPermission
      ? '<span style="color:#2563eb; font-weight:bold;">Permission / ፈቃድ</span>'
      : '<span style="color:#d97706; font-weight:bold;">Late / ዘግይቷል</span>';

    rowsHtml += `
      <tr style="${isAbsent ? 'background-color:#fee2e2;' : ''}">
        <td style="padding:6px 10px; border:1px solid #cbd5e1; text-align:center;">${idx + 1}</td>
        <td style="padding:6px 10px; border:1px solid #cbd5e1; text-align:center; font-family:monospace;">${formatRollNumber(s.rollNumber)}</td>
        <td style="padding:6px 10px; border:1px solid #cbd5e1; font-weight:600;">${s.name}</td>
        <td style="padding:6px 10px; border:1px solid #cbd5e1; text-align:center;">${statusBadge}</td>
        <td style="padding:6px 10px; border:1px solid #cbd5e1; color:#475569;">${note}</td>
      </tr>
    `;
  });

  const html = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Attendance Report ${date}</title>
        <style>
          body { font-family: 'Segoe UI', Calibri, Arial, sans-serif; margin: 30px; color: #0f172a; }
          h1 { color: #047857; margin-bottom: 4px; font-size: 22px; }
          .meta-box { background: #f8fafc; border: 1px solid #cbd5e1; padding: 12px; margin: 16px 0; border-radius: 6px; }
          .summary-pill { display: inline-block; margin-right: 18px; font-size: 13px; font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin-top: 14px; font-size: 13px; }
          th { background-color: #047857; color: white; padding: 8px 10px; border: 1px solid #065f46; text-align: left; }
        </style>
      </head>
      <body>
        <h1>የተማሪዎች አቴንዳንስ ሪፖርት (Student Attendance Report)</h1>
        <p style="color:#64748b; font-size:13px; margin-top:0;">
          <strong>ክፍል (Class):</strong> ${settings.className || 'General'} | 
          <strong>አስተማሪ (Teacher):</strong> ${settings.teacherName || 'Instructor'} | 
          <strong>ቀን (Date):</strong> ${formattedDate} (${date})
        </p>

        <div class="meta-box">
          <span class="summary-pill">ጠቅላላ ተማሪዎች: ${stats.totalStudents}</span>
          <span class="summary-pill" style="color:#059669;">የተገኙ (Present): ${stats.present}</span>
          <span class="summary-pill" style="color:#dc2626;">ቀሪዎች (Absent): ${stats.absent}</span>
          <span class="summary-pill" style="color:#2563eb;">ፈቃድ (Permission): ${stats.permission}</span>
          <span class="summary-pill">የመገኘት መጠን (Rate): ${stats.attendanceRate}%</span>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width:40px; text-align:center;">ተ.ቁ</th>
              <th style="width:70px; text-align:center;">መለያ / Roll #</th>
              <th>የተማሪው ሙሉ ስም (Student Name)</th>
              <th style="width:120px; text-align:center;">ሁኔታ (Status)</th>
              <th style="width:180px;">ማስታወሻ (Note)</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
        <p style="margin-top:20px; font-size:11px; color:#94a3b8;">Generated by Student Attendance and Feeding Management App</p>
      </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', html], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document;charset=utf-8',
  });
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

export function exportFeedingReportPDF(report: DailyFeedingReport): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  // Title
  doc.setFontSize(18);
  doc.setTextColor(4, 120, 87);
  doc.text('Daily Feeding Report / የዕለት ምገባ ሪፖርት', 40, 45);

  // Subtitle
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Report Date: ${report.date}   |   Location: ${report.location}`, 40, 65);

  // Metadata Card
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(40, 78, 515, 95, 4, 4, 'FD');

  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);

  const actTypeLabel =
    report.activityType === 'lesson'
      ? 'ትምህርት (Lesson)'
      : report.activityType === 'game'
      ? 'ጨዋታ (Game)'
      : 'ምንም (Nothing)';

  doc.text(`• Coordinator / የዕለቱ ተረኛ አስተባባሪ:  ${report.coordinatorName}`, 55, 98);
  doc.text(`• Food Type / የምግቡ አይነት:  ${report.foodType}`, 55, 116);
  doc.text(`• Feeding Location / ምገባው የተከናወነበት ቦታ:  ${report.location}`, 55, 134);
  doc.text(
    `• Children Count / የህፃናት ቁጥር: ${report.childrenCount}    |    Volunteers / አገልጋዮች: ${report.volunteersCount}    |    Activity: ${actTypeLabel}`,
    55,
    152
  );

  // Recreated Feeding Activity Table (Header: ተ.ቁ, ተግባር, ሰዓት -> ተጀመረ, አለቀ)
  doc.setFontSize(11);
  doc.setTextColor(4, 120, 87);
  doc.text('Feeding Activity Schedule / የምገባ ተግባራት ሰሌዳ', 40, 195);

  const head = [
    [
      { content: 'ተ.ቁ\n(No)', rowSpan: 2, styles: { halign: 'center' as const, valign: 'middle' as const } },
      { content: 'ተግባር\n(Activity)', rowSpan: 2, styles: { halign: 'left' as const, valign: 'middle' as const } },
      { content: 'ሰዓት (Time)', colSpan: 2, styles: { halign: 'center' as const } },
    ],
    [
      { content: 'ተጀመረ (Start)', styles: { halign: 'center' as const } },
      { content: 'አለቀ (End)', styles: { halign: 'center' as const } },
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
      fontSize: 9,
      cellPadding: 6,
      lineColor: [203, 213, 225],
    },
    didDrawPage: (data) => {
      const pageCount = (doc as any).internal.getNumberOfPages();
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
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('በዕለቱ የተፈጠሩ ክፍተቶች ወይም ተግዳሮቶች:', 40, finalY + 25);
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(report.generalNotes, 40, finalY + 40, { maxWidth: 515 });
  }

  doc.save(`Feeding_Report_${report.date}.pdf`);
}

export function exportFeedingReportWord(report: DailyFeedingReport): void {
  const actTypeLabel =
    report.activityType === 'lesson'
      ? 'ትምህርት (Lesson)'
      : report.activityType === 'game'
      ? 'ጨዋታ (Game)'
      : 'ምንም (Nothing)';

  let tableRowsHtml = '';
  (report.activities || []).forEach((row) => {
    tableRowsHtml += `
      <tr>
        <td style="padding:8px; border:2px solid #334155; text-align:center; font-weight:bold; font-family:monospace;">${row.orderNumber}</td>
        <td style="padding:8px; border:2px solid #334155; font-weight:bold;">${row.activityName}</td>
        <td style="padding:8px; border:2px solid #334155; text-align:center; font-family:monospace; font-weight:600;">${row.startTime || '-'}</td>
        <td style="padding:8px; border:2px solid #334155; text-align:center; font-family:monospace; font-weight:600;">${row.endTime || '-'}</td>
      </tr>
    `;
  });

  const html = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Daily Feeding Report - ${report.date}</title>
        <style>
          body { font-family: 'Segoe UI', Calibri, Arial, sans-serif; margin: 40px; color: #0f172a; }
          h1 { color: #047857; margin-bottom: 4px; font-size: 22px; }
          .meta-card { background: #f8fafc; border: 1px solid #cbd5e1; padding: 16px; margin: 20px 0; border-radius: 6px; }
          .field-row { margin-bottom: 8px; font-size: 13px; }
          .field-label { font-weight: bold; color: #334155; display: inline-block; width: 260px; }
          table { width: 100%; border-collapse: collapse; margin-top: 18px; font-size: 13px; }
          th { background-color: #047857; color: white; padding: 10px; border: 2px solid #334155; text-align: center; }
        </style>
      </head>
      <body>
        <h1>የዕለት ምገባ ሪፖርት (Daily Feeding Report)</h1>
        <p style="color:#64748b; font-size:13px; margin-top:0;">ቀን (Date): ${report.date} | ማዕከል / ቦታ: ${report.location}</p>

        <div class="meta-card">
          <div class="field-row"><span class="field-label">የዕለቱ ተረኛ አስተባባሪ:</span> <strong>${report.coordinatorName}</strong></div>
          <div class="field-row"><span class="field-label">የምግቡ አይነት:</span> <strong>${report.foodType}</strong></div>
          <div class="field-row"><span class="field-label">ምገባው የተከናወነበት ቦታ:</span> ${report.location}</div>
          <div class="field-row"><span class="field-label">ምገባው ላይ የተሳተፉ ህፃናት ቁጥር:</span> <strong>${report.childrenCount}</strong></div>
          <div class="field-row"><span class="field-label">የተሳተፉ አገልጋዮች ብዛት:</span> <strong>${report.volunteersCount}</strong></div>
          <div class="field-row"><span class="field-label">የተሰጠው ትምህርት ወይም ጨዋታ:</span> <strong>${actTypeLabel}</strong></div>
          ${report.generalNotes ? `<div class="field-row"><span class="field-label">በዕለቱ የተፈጠሩ ክፍተቶች ወይም ተግዳሮቶች:</span> ${report.generalNotes}</div>` : ''}
        </div>

        <h3 style="color:#047857; margin-top:24px;">የምገባ ተግባራት እና የጊዜ ሰሌዳ (Activity Schedule)</h3>
        <table>
          <thead>
            <tr>
              <th rowspan="2" style="width:50px;">ተ.ቁ</th>
              <th rowspan="2" style="text-align:left;">ተግባር</th>
              <th colspan="2">ሰዓት</th>
            </tr>
            <tr>
              <th style="width:110px;">ተጀመረ</th>
              <th style="width:110px;">አለቀ</th>
            </tr>
          </thead>
          <tbody>
            ${tableRowsHtml}
          </tbody>
        </table>

        <p style="margin-top:28px; font-size:11px; color:#94a3b8;">Generated by Student Attendance and Feeding Management System</p>
      </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', html], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document;charset=utf-8',
  });
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
