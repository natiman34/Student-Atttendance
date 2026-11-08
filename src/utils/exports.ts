import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Student, DayAttendance, AppSettings, WeekGroup } from '../types.ts';
import { calculateDayStats, calculateStudentStats, formatDisplayDate, formatRollNumber } from './attendance.ts';

// 1. Parse Excel / CSV files
export async function parseExcelOrCsvFile(
  file: File
): Promise<{ rollNumber: number; name: string }[]> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) return [];

  const worksheet = workbook.Sheets[firstSheetName];
  const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  const result: { rollNumber: number; name: string }[] = [];
  let autoRoll = 1;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    // Check header row
    const firstCell = String(row[0] || '').toLowerCase().trim();
    const secondCell = String(row[1] || '').toLowerCase().trim();
    if (
      i === 0 &&
      (firstCell.includes('roll') ||
        firstCell.includes('id') ||
        firstCell.includes('no') ||
        firstCell.includes('num') ||
        firstCell.includes('student') ||
        secondCell.includes('name'))
    ) {
      continue;
    }

    if (row.length >= 2) {
      const rollParsed = parseInt(String(row[0]).trim(), 10);
      const name = String(row[1] || '').trim();
      if (name) {
        result.push({
          rollNumber: isNaN(rollParsed) ? autoRoll++ : rollParsed,
          name,
        });
      }
    } else if (row.length === 1 && String(row[0]).trim()) {
      result.push({
        rollNumber: autoRoll++,
        name: String(row[0]).trim(),
      });
    }
  }

  return result;
}

// 2. Export Word Document (.doc format compatible with Microsoft Word & Google Docs)
export function downloadWordReport(
  title: string,
  settings: Partial<AppSettings>,
  students: Student[],
  attendanceHistory: DayAttendance[],
  filterSubtitle?: string
): void {
  const dateStr = formatDisplayDate(new Date().toISOString().slice(0, 10));

  let tableRowsHtml = '';
  students.forEach((student) => {
    const stats = calculateStudentStats(student.id, attendanceHistory);
    const isWarning = stats.totalDays > 0 && stats.rate < (settings.targetAttendanceRate || 75);

    tableRowsHtml += `
      <tr style="${isWarning ? 'background-color: #fee2e2;' : ''}">
        <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center; font-family: monospace;">${formatRollNumber(student.rollNumber)}</td>
        <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: 600;">${student.name}</td>
        <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center; color: #059669; font-weight: bold;">${stats.present}</td>
        <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center; color: #dc2626; font-weight: bold;">${stats.absent}</td>
        <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center; color: #2563eb; font-weight: bold;">${stats.permission}</td>
        <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">${stats.totalDays}</td>
        <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: right; font-weight: bold; ${isWarning ? 'color: #dc2626;' : 'color: #059669;'}">${stats.totalDays > 0 ? stats.rate + '%' : '-'}</td>
      </tr>
    `;
  });

  const htmlContent = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${title}</title>
        <style>
          body { font-family: Calibri, Arial, sans-serif; margin: 40px; color: #1e293b; }
          h1 { color: #047857; margin-bottom: 4px; font-size: 24px; }
          .meta { font-size: 13px; color: #64748b; margin-bottom: 24px; border-bottom: 2px solid #047857; padding-bottom: 12px; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13px; }
          th { background-color: #f1f5f9; padding: 10px; border: 1px solid #94a3b8; text-align: left; font-weight: bold; }
        </style>
      </head>
      <body>
        <h1>${settings.className || 'Classroom Attendance Report'}</h1>
        <div class="meta">
          <strong>Teacher:</strong> ${settings.teacherName || 'Instructor'} | 
          <strong>Term:</strong> ${settings.academicYear || 'Academic Year'} | 
          <strong>Generated:</strong> ${dateStr} ${filterSubtitle ? `| <strong>Scope:</strong> ${filterSubtitle}` : ''}
        </div>
        <table>
          <thead>
            <tr>
              <th style="width: 50px; text-align: center;">Roll #</th>
              <th>Student Name</th>
              <th style="width: 70px; text-align: center;">Present</th>
              <th style="width: 70px; text-align: center;">Absent</th>
              <th style="width: 70px; text-align: center;">Permission</th>
              <th style="width: 80px; text-align: center;">Total Days</th>
              <th style="width: 90px; text-align: right;">Rate (%)</th>
            </tr>
          </thead>
          <tbody>
            ${tableRowsHtml}
          </tbody>
        </table>
        <p style="margin-top: 24px; font-size: 11px; color: #94a3b8;">Generated by RollCall Offline Attendance System</p>
      </body>
    </html>
  `;

  const blob = new Blob([htmlContent], { type: 'application/msword;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// 3. Export PDF Document using jsPDF + autoTable
export function downloadPDFReport(
  title: string,
  settings: Partial<AppSettings>,
  students: Student[],
  attendanceHistory: DayAttendance[],
  filterSubtitle?: string
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  // Header Title
  doc.setFontSize(20);
  doc.setTextColor(4, 120, 87); // Emerald 700
  doc.text(settings.className || 'Classroom Attendance Report', 40, 50);

  // Subtitle metadata
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  const dateStr = formatDisplayDate(new Date().toISOString().slice(0, 10));
  const subtext = `Teacher: ${settings.teacherName || 'Instructor'}   |   Term: ${settings.academicYear || 'Academic Year'}   |   Date: ${dateStr}`;
  doc.text(subtext, 40, 70);

  if (filterSubtitle) {
    doc.text(`Scope: ${filterSubtitle}`, 40, 85);
  }

  // Draw separator line
  doc.setDrawColor(4, 120, 87);
  doc.setLineWidth(1.5);
  doc.line(40, filterSubtitle ? 95 : 80, 555, filterSubtitle ? 95 : 80);

  // Table Data Preparation
  const head = [['#', 'Student Name', 'Present', 'Absent', 'Permission', 'Total', 'Rate']];
  const body: (string | number)[][] = [];

  students.forEach((student) => {
    const stats = calculateStudentStats(student.id, attendanceHistory);
    body.push([
      formatRollNumber(student.rollNumber),
      student.name,
      stats.present,
      stats.absent,
      stats.permission,
      stats.totalDays,
      stats.totalDays > 0 ? `${stats.rate}%` : '-',
    ]);
  });

  autoTable(doc, {
    startY: filterSubtitle ? 105 : 90,
    head: head,
    body: body,
    theme: 'striped',
    headStyles: {
      fillColor: [16, 185, 129], // Emerald 500
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 35 },
      1: { halign: 'left' },
      2: { halign: 'center', textColor: [5, 150, 105], fontStyle: 'bold' },
      3: { halign: 'center', textColor: [220, 38, 38], fontStyle: 'bold' },
      4: { halign: 'center', textColor: [37, 99, 235], fontStyle: 'bold' },
      5: { halign: 'center' },
      6: { halign: 'right', fontStyle: 'bold' },
    },
    styles: {
      fontSize: 9,
      cellPadding: 5,
    },
    didDrawPage: (data) => {
      // Footer page numbering
      const pageCount = (doc as any).internal.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Page ${data.pageNumber} of ${pageCount}  •  RollCall Attendance System`,
        40,
        doc.internal.pageSize.height - 20
      );
    },
  });

  doc.save(`${title.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.pdf`);
}

// 4. Export Native Excel (.xlsx) using SheetJS
export function downloadExcelSheet(
  fileName: string,
  students: Student[],
  attendanceHistory: DayAttendance[],
  weekGroup?: WeekGroup
): void {
  const workbook = XLSX.utils.book_new();

  if (weekGroup) {
    // Generate Weekly Grid Sheet
    const dates = weekGroup.dates;
    const headerRow = ['Roll Number', 'Student Name', ...dates.map((d) => formatDisplayDate(d).slice(0, 10)), 'Present', 'Absent', 'Permission', 'Rate'];
    const dataRows: (string | number)[][] = [];

    students.forEach((student) => {
      let presentCount = 0;
      let absentCount = 0;
      let permissionCount = 0;

      const dateStatuses = dates.map((dateStr) => {
        const dayRecord = weekGroup.days.find((d) => d.date === dateStr);
        const status = dayRecord?.records[student.id];
        if (status === 'present') {
          presentCount++;
          return 'P';
        }
        if (status === 'absent') {
          absentCount++;
          return 'A';
        }
        if (status === 'permission') {
          permissionCount++;
          return 'Perm';
        }
        if (status === 'late') {
          return 'L';
        }
        return '-';
      });

      const total = presentCount + absentCount + permissionCount;
      const rate = total > 0 ? `${Math.round((presentCount / total) * 100)}%` : '-';

      dataRows.push([
        formatRollNumber(student.rollNumber),
        student.name,
        ...dateStatuses,
        presentCount,
        absentCount,
        permissionCount,
        rate,
      ]);
    });

    const worksheet = XLSX.utils.aoa_to_sheet([headerRow, ...dataRows]);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Weekly Attendance');
  } else {
    // Cumulative Attendance Sheet
    const headerRow = ['Roll Number', 'Student Name', 'Total Present', 'Total Absent', 'Total Permission', 'Total Days', 'Attendance Rate'];
    const dataRows = students.map((s) => {
      const stats = calculateStudentStats(s.id, attendanceHistory);
      return [
        formatRollNumber(s.rollNumber),
        s.name,
        stats.present,
        stats.absent,
        stats.permission,
        stats.totalDays,
        stats.totalDays > 0 ? `${stats.rate}%` : '-',
      ];
    });

    const worksheet = XLSX.utils.aoa_to_sheet([headerRow, ...dataRows]);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Cumulative Attendance');
  }

  XLSX.writeFile(workbook, `${fileName}-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

// 5. Export Monthly Student Attendance Summary as Word Document
export function downloadMonthlyWordReport(
  monthName: string,
  year: number,
  students: Student[],
  monthlyAttendance: DayAttendance[],
  targetRate = 75
): void {
  const sessionCount = monthlyAttendance.length;
  let tableRowsHtml = '';

  students.forEach((student) => {
    let present = 0;
    let absent = 0;
    let permission = 0;
    let late = 0;

    for (const day of monthlyAttendance) {
      const st = day.records[student.id];
      if (st === 'present') present++;
      else if (st === 'absent') absent++;
      else if (st === 'permission') permission++;
      else if (st === 'late') late++;
    }

    const totalDays = present + absent + permission + late;
    const rate = totalDays > 0 ? Math.round((present / totalDays) * 100) : 0;
    const isWarning = totalDays > 0 && rate < targetRate;

    tableRowsHtml += `
      <tr style="${isWarning ? 'background-color: #fee2e2;' : ''}">
        <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center; font-family: monospace;">${formatRollNumber(student.rollNumber)}</td>
        <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: 600;">${student.name}</td>
        <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center; color: #059669; font-weight: bold;">${present}</td>
        <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center; color: #dc2626; font-weight: bold;">${absent}</td>
        <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center; color: #2563eb; font-weight: bold;">${permission}</td>
        <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">${totalDays}</td>
        <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: right; font-weight: bold; ${isWarning ? 'color: #dc2626;' : 'color: #059669;'}">${totalDays > 0 ? rate + '%' : '-'}</td>
      </tr>
    `;
  });

  const htmlContent = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Monthly Attendance Summary - ${monthName} ${year}</title>
        <style>
          body { font-family: Calibri, Arial, sans-serif; margin: 40px; color: #1e293b; }
          h1 { color: #047857; margin-bottom: 4px; font-size: 24px; }
          .meta { font-size: 13px; color: #64748b; margin-bottom: 24px; border-bottom: 2px solid #047857; padding-bottom: 12px; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13px; }
          th { background-color: #f1f5f9; padding: 10px; border: 1px solid #94a3b8; text-align: left; font-weight: bold; }
        </style>
      </head>
      <body>
        <h1>Monthly Attendance Summary</h1>
        <div class="meta">
          <strong>Period:</strong> ${monthName} ${year} &bull; 
          <strong>Recorded Sessions:</strong> ${sessionCount} days &bull; 
          <strong>Total Students:</strong> ${students.length} &bull; 
          <strong>Generated:</strong> ${formatDisplayDate(new Date().toISOString().slice(0, 10))}
        </div>
        <table>
          <thead>
            <tr>
              <th style="text-align: center; width: 60px;">Roll #</th>
              <th>Student Name</th>
              <th style="text-align: center;">Present</th>
              <th style="text-align: center;">Absent</th>
              <th style="text-align: center;">Permission</th>
              <th style="text-align: center;">Total Days</th>
              <th style="text-align: right;">Attendance Rate</th>
            </tr>
          </thead>
          <tbody>
            ${tableRowsHtml}
          </tbody>
        </table>
      </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', htmlContent], {
    type: 'application/msword',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `attendance-summary-${monthName.toLowerCase()}-${year}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// 6. Export Monthly Student Attendance Summary as PDF Document
export function downloadMonthlyPdfReport(
  monthName: string,
  year: number,
  students: Student[],
  monthlyAttendance: DayAttendance[],
  targetRate = 75
): void {
  const doc = new jsPDF();
  const sessionCount = monthlyAttendance.length;

  // Title
  doc.setFontSize(18);
  doc.setTextColor(4, 120, 87);
  doc.text(`Monthly Attendance Summary - ${monthName} ${year}`, 40, 40);

  // Subtitle
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Recorded Sessions: ${sessionCount} days  •  Total Students: ${students.length}  •  Target: ${targetRate}%`,
    40,
    55
  );

  const tableData = students.map((s) => {
    let present = 0;
    let absent = 0;
    let permission = 0;
    let late = 0;

    for (const day of monthlyAttendance) {
      const st = day.records[s.id];
      if (st === 'present') present++;
      else if (st === 'absent') absent++;
      else if (st === 'permission') permission++;
      else if (st === 'late') late++;
    }

    const totalDays = present + absent + permission + late;
    const rate = totalDays > 0 ? Math.round((present / totalDays) * 100) : 0;

    return [
      formatRollNumber(s.rollNumber),
      s.name,
      present,
      absent,
      permission,
      totalDays,
      totalDays > 0 ? `${rate}%` : '-',
    ];
  });

  autoTable(doc, {
    startY: 65,
    head: [['Roll #', 'Student Name', 'Present', 'Absent', 'Permission', 'Total Days', 'Rate']],
    body: tableData,
    headStyles: {
      fillColor: [4, 120, 87],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 35 },
      1: { halign: 'left' },
      2: { halign: 'center', textColor: [5, 150, 105], fontStyle: 'bold' },
      3: { halign: 'center', textColor: [220, 38, 38], fontStyle: 'bold' },
      4: { halign: 'center', textColor: [37, 99, 235], fontStyle: 'bold' },
      5: { halign: 'center' },
      6: { halign: 'right', fontStyle: 'bold' },
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
        `Page ${data.pageNumber} of ${pageCount}  •  Monthly Summary (${monthName} ${year})`,
        40,
        doc.internal.pageSize.height - 20
      );
    },
  });

  doc.save(`monthly-attendance-${monthName.toLowerCase()}-${year}.pdf`);
}

// 7. Export Monthly Student Attendance Summary as Excel
export function downloadMonthlyExcelSheet(
  monthName: string,
  year: number,
  students: Student[],
  monthlyAttendance: DayAttendance[]
): void {
  const workbook = XLSX.utils.book_new();

  // Sort monthly attendance chronologically
  const sortedDays = [...monthlyAttendance].sort((a, b) => a.date.localeCompare(b.date));
  const dates = sortedDays.map((d) => d.date);

  const headerRow = [
    'Roll Number',
    'Student Name',
    ...dates.map((d) => d.slice(8)), // day of month as header
    'Total Present',
    'Total Absent',
    'Total Permission',
    'Total Sessions',
    'Attendance Rate',
  ];

  const dataRows: (string | number)[][] = [];

  students.forEach((student) => {
    let presentCount = 0;
    let absentCount = 0;
    let permissionCount = 0;

    const dateStatuses = sortedDays.map((day) => {
      const status = day.records[student.id];
      if (status === 'present') {
        presentCount++;
        return 'P';
      }
      if (status === 'absent') {
        absentCount++;
        return 'A';
      }
      if (status === 'permission') {
        permissionCount++;
        return 'Perm';
      }
      if (status === 'late') {
        return 'L';
      }
      return '-';
    });

    const total = presentCount + absentCount + permissionCount;
    const rate = total > 0 ? `${Math.round((presentCount / total) * 100)}%` : '-';

    dataRows.push([
      formatRollNumber(student.rollNumber),
      student.name,
      ...dateStatuses,
      presentCount,
      absentCount,
      permissionCount,
      total,
      rate,
    ]);
  });

  const worksheet = XLSX.utils.aoa_to_sheet([headerRow, ...dataRows]);
  XLSX.utils.book_append_sheet(workbook, worksheet, `${monthName} ${year}`);

  XLSX.writeFile(workbook, `attendance-${monthName.toLowerCase()}-${year}.xlsx`);
}

