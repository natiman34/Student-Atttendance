import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Student, DayAttendance, AppSettings } from '../types.ts';
import { calculateStudentStats, formatDisplayDate, formatRollNumber } from './attendance.ts';
import { ensureEthiopicFont } from './pdfFont.ts';

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

export async function exportStudentReportPDF(
  student: Student,
  attendanceHistory: DayAttendance[],
  settings: Partial<AppSettings> = {}
): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const fontLoaded = await ensureEthiopicFont(doc);
  const fontName = fontLoaded ? 'AbyssinicaSIL' : 'helvetica';
  const isAm = settings.language === 'am';

  const stats = calculateStudentStats(student.id, attendanceHistory);

  // Header Banner
  doc.setFillColor(23, 59, 101); // #173B65 Navy Blue
  doc.rect(0, 0, 595, 65, 'F');

  doc.setFont(fontName, 'normal');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text(
    isAm
      ? `${settings.schoolName || 'ትምህርት ቤት'} — የተማሪ የተሰብሳቢነት ማጠቃለያ`
      : `${settings.schoolName || 'School'} — Student Attendance Profile`,
    40,
    35
  );

  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225);
  doc.text(
    isAm
      ? `የትምህርት ዘመን: ${settings.academicYear || '2026 - 2027'}   |   የወጣበት ቀን: ${new Date().toLocaleDateString()}`
      : `Academic Year: ${settings.academicYear || '2026 - 2027'}   |   Exported: ${new Date().toLocaleDateString()}`,
    40,
    52
  );

  // Student Profile Card
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(244, 247, 251);
  doc.roundedRect(40, 80, 515, 60, 4, 4, 'FD');

  doc.setFont(fontName, 'normal');
  doc.setFontSize(13);
  doc.setTextColor(23, 34, 53);
  doc.text(`${student.name}`, 55, 102);

  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  const idStr = student.studentIdNumber ? `ID: ${student.studentIdNumber}   |   ` : '';
  const rollStr = `Roll #${formatRollNumber(student.rollNumber)}`;
  const gradeStr = student.grade ? `   |   Grade: ${student.grade}` : '';
  const sectionStr = student.section ? `   |   Section: ${student.section}` : '';
  const statusStr = student.isArchived ? `   |   Status: Archived` : `   |   Status: Active`;
  doc.text(`${idStr}${rollStr}${gradeStr}${sectionStr}${statusStr}`, 55, 122);

  // Stats KPI Row
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(40, 150, 515, 48, 4, 4, 'FD');

  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(isAm ? 'የተሰብሳቢነት ምጣኔ' : 'Attendance Rate', 55, 168);
  doc.setFontSize(16);
  doc.setTextColor(13, 148, 136); // Teal
  doc.text(`${stats.rate}%`, 55, 188);

  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(isAm ? 'ጠቅላላ ቀናት' : 'Total Days', 170, 168);
  doc.setFontSize(16);
  doc.setTextColor(23, 34, 53);
  doc.text(`${stats.totalDays}`, 170, 188);

  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(isAm ? 'የተገኘበት' : 'Present', 270, 168);
  doc.setFontSize(16);
  doc.setTextColor(22, 163, 74);
  doc.text(`${stats.present}`, 270, 188);

  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(isAm ? 'ቀሪ' : 'Absent', 370, 168);
  doc.setFontSize(16);
  doc.setTextColor(220, 82, 82);
  doc.text(`${stats.absent}`, 370, 188);

  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(isAm ? 'ፈቃድ' : 'Permission', 470, 168);
  doc.setFontSize(16);
  doc.setTextColor(245, 158, 11);
  doc.text(`${stats.permission}`, 470, 188);

  // Chronological Attendance Log Table
  const sortedDays = [...attendanceHistory].sort((a, b) => a.date.localeCompare(b.date));
  const tableData: any[] = [];

  sortedDays.forEach((day, idx) => {
    const rawStatus = day.records[student.id];
    const status = rawStatus || 'absent';
    const note = day.notes?.[student.id] || '-';

    let statusDisplay = isAm ? 'ቀሪ' : 'Absent';
    if (status === 'present') statusDisplay = isAm ? 'ተገኝቷል' : 'Present';
    else if (status === 'permission') statusDisplay = isAm ? 'ፈቃድ' : 'Permission';

    tableData.push([
      idx + 1,
      formatDisplayDate(day.date),
      day.date,
      statusDisplay,
      note,
    ]);
  });

  autoTable(doc, {
    startY: 215,
    head: [[
      '#',
      isAm ? 'ቀን (የኢትዮጵያ)' : 'Date (Display)',
      'ISO Date',
      isAm ? 'ሁኔታ' : 'Status',
      isAm ? 'ማስታወሻ' : 'Notes / Remarks',
    ]],
    body: tableData,
    theme: 'grid',
    styles: {
      font: fontName,
      fontSize: 8.5,
      cellPadding: 4,
    },
    headStyles: {
      fillColor: [23, 59, 101],
      textColor: [255, 255, 255],
    },
    columnStyles: {
      0: { cellWidth: 25, halign: 'center' },
      1: { cellWidth: 150 },
      2: { cellWidth: 80, halign: 'center' },
      3: { cellWidth: 80, halign: 'center' },
      4: { cellWidth: 180 },
    },
    margin: { left: 40, right: 40 },
  });

  const finalY = (doc as any).lastAutoTable?.finalY || 400;

  // Signatures & Stamp Block
  const sigY = Math.min(finalY + 45, 750);
  doc.setFont(fontName, 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);

  // Teacher signature
  doc.text(isAm ? 'ያዘጋጀው መምህር: ____________________' : 'Teacher Signature: ____________________', 40, sigY);
  doc.text(isAm ? 'ፊርማ እና ቀን' : 'Signature & Date', 40, sigY + 16);

  // Principal / School Stamp
  doc.text(isAm ? 'የትምህርት ቤቱ ማህተም: ____________________' : 'School Official Seal / Stamp: ____________________', 300, sigY);
  doc.text(isAm ? 'ርዕሰ መምህር' : 'Principal / Director', 300, sigY + 16);

  const cleanName = student.name.replace(/[^a-zA-Z0-9_\u1200-\u137F]/g, '_');
  triggerBlobDownload(doc.output('blob'), `Student_Attendance_${cleanName}.pdf`);
}
