import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
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
import type { SavedTermlyReport, SavedAnnualReport, AppSettings } from '../types.ts';
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

export async function exportTermlyReportPDF(
  report: SavedTermlyReport,
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

  // Banner
  doc.setFillColor(23, 59, 101); // #173B65 Navy Blue
  doc.rect(0, 0, 595, 65, 'F');

  doc.setFont(fontName, 'normal');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text(
    isAm
      ? `${settings.schoolName || 'ትምህርት ቤት'} — የሴሚስተር / ሩብ ዓመት የተሟላ ሪፖርት`
      : `${settings.schoolName || 'School'} — Termly Comprehensive Report`,
    40,
    35
  );

  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225);
  doc.text(
    `${report.termName} (${report.termAmharicName})  |  ${report.academicYear}  |  ${report.startDate} - ${report.endDate}`,
    40,
    52
  );

  // SECTION 1: ATTENDANCE KPI BOX
  doc.setFont(fontName, 'normal');
  doc.setFontSize(12);
  doc.setTextColor(23, 59, 101);
  doc.text(isAm ? '1. የተማሪዎች አቴንዳንስ ማጠቃለያ' : '1. Attendance Summary', 40, 88);

  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(244, 247, 251);
  doc.roundedRect(40, 96, 515, 45, 4, 4, 'FD');

  doc.setFontSize(8.5);
  doc.setTextColor(23, 34, 53);
  doc.text(
    isAm
      ? `ጠቅላላ ተማሪዎች: ${report.totalStudents}  |  የት/ት ቀናት: ${report.totalSchoolDays}  |  የተገኘበት ድምር: ${report.totalPresent}  |  ቀሪ: ${report.totalAbsent}  |  ፈቃድ: ${report.totalPermission}  |  ምጣኔ: ${report.attendanceRate}%`
      : `Enrolled: ${report.totalStudents}  |  School Days: ${report.totalSchoolDays}  |  Present: ${report.totalPresent}  |  Absent: ${report.totalAbsent}  |  Permission: ${report.totalPermission}  |  Rate: ${report.attendanceRate}%`,
    50,
    122
  );

  // SECTION 2: FEEDING KPI BOX
  let startFeedingY = 158;
  if (report.feedingSummary) {
    doc.setFontSize(12);
    doc.setTextColor(245, 158, 11); // Amber
    doc.text(isAm ? '2. የት/ቤት ምገባ ፕሮግራም ማጠቃለያ' : '2. School Feeding Summary', 40, startFeedingY);

    doc.setDrawColor(254, 215, 170);
    doc.setFillColor(255, 251, 235);
    doc.roundedRect(40, startFeedingY + 8, 515, 40, 4, 4, 'FD');

    doc.setFontSize(8.5);
    doc.setTextColor(120, 53, 15);
    doc.text(
      isAm
        ? `ምገባ የተደረገላቸው ህፃናት: ${report.feedingSummary.totalChildrenFed}  |  አገልጋዮች/ፈቃደኞች: ${report.feedingSummary.totalVolunteers}  |  ትምህርት ክፍለጊዜዎች: ${report.feedingSummary.lessonCount}  |  ጨዋታ: ${report.feedingSummary.gameCount}`
        : `Children Fed: ${report.feedingSummary.totalChildrenFed}  |  Volunteers: ${report.feedingSummary.totalVolunteers}  |  Lessons: ${report.feedingSummary.lessonCount}  |  Games: ${report.feedingSummary.gameCount}`,
      50,
      startFeedingY + 32
    );
    startFeedingY += 60;
  }

  // Summary Table of Included Report Dates
  const tableData = report.includedReportDates.map((dateStr, idx) => [
    idx + 1,
    dateStr,
    report.termName,
    isAm ? 'ተመዝግቧል' : 'Recorded',
  ]);

  autoTable(doc, {
    startY: startFeedingY + 10,
    head: [[
      '#',
      isAm ? 'የተመዘገበበት ቀን' : 'Recorded Date',
      isAm ? 'ሴሚስተር' : 'Term',
      isAm ? 'ሁኔታ' : 'Status',
    ]],
    body: tableData.slice(0, 30),
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
      0: { cellWidth: 30, halign: 'center' },
      1: { cellWidth: 150 },
      2: { cellWidth: 150 },
      3: { cellWidth: 150, halign: 'center' },
    },
    margin: { left: 40, right: 40 },
  });

  const finalY = (doc as any).lastAutoTable?.finalY || 400;

  // Signatures
  const sigY = Math.min(finalY + 45, 750);
  doc.setFont(fontName, 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);

  doc.text(isAm ? 'ያዘጋጀው መምህር: ____________________' : 'Teacher Signature: ____________________', 40, sigY);
  doc.text(isAm ? 'ፊርማ እና ቀን' : 'Signature & Date', 40, sigY + 16);

  doc.text(isAm ? 'የትምህርት ቤቱ ማህተም: ____________________' : 'School Official Seal / Stamp: ____________________', 300, sigY);
  doc.text(isAm ? 'ርዕሰ መምህር' : 'Principal / Director', 300, sigY + 16);

  triggerBlobDownload(doc.output('blob'), `Termly_Report_${report.termId}_${report.academicYear}.pdf`);
}

export async function exportAnnualReportPDF(
  report: SavedAnnualReport,
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

  // Banner
  doc.setFillColor(23, 59, 101); // #173B65 Navy Blue
  doc.rect(0, 0, 595, 65, 'F');

  doc.setFont(fontName, 'normal');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text(
    isAm
      ? `${settings.schoolName || 'ትምህርት ቤት'} — የዓመቱ አጠቃላይ ማጠቃለያ ሪፖርት`
      : `${settings.schoolName || 'School'} — Annual Attendance & Feeding Report`,
    40,
    35
  );

  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225);
  doc.text(
    `${isAm ? 'የትምህርት ዘመን' : 'Academic Year'}: ${report.academicYear}  |  ${report.startDate} - ${report.endDate}`,
    40,
    52
  );

  // Overall Annual Stats
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(244, 247, 251);
  doc.roundedRect(40, 85, 515, 50, 4, 4, 'FD');

  doc.setFont(fontName, 'normal');
  doc.setFontSize(9);
  doc.setTextColor(23, 34, 53);
  doc.text(
    isAm
      ? `ጠቅላላ ተማሪዎች: ${report.totalStudents}  |  የትምህርት ቀናት: ${report.totalSchoolDays}  |  የተገኘበት ድምር: ${report.totalPresent}  |  ቀሪ: ${report.totalAbsent}  |  ፈቃድ: ${report.totalPermission}  |  አጠቃላይ ምጣኔ: ${report.attendanceRate}%`
      : `Enrolled: ${report.totalStudents}  |  School Days: ${report.totalSchoolDays}  |  Present: ${report.totalPresent}  |  Absent: ${report.totalAbsent}  |  Permission: ${report.totalPermission}  |  Overall Rate: ${report.attendanceRate}%`,
    50,
    115
  );

  // Terms Breakdown Table
  const termsData = report.termsBreakdown.map((t, idx) => [
    idx + 1,
    t.termName,
    t.present,
    t.absent,
    `${t.rate}%`,
  ]);

  autoTable(doc, {
    startY: 155,
    head: [[
      '#',
      isAm ? 'ሴሚስተር / ክፍለ ጊዜ' : 'Term / Semester',
      isAm ? 'ተገኝቷል' : 'Present',
      isAm ? 'ቀሪ' : 'Absent',
      isAm ? 'የመገኘት ምጣኔ %' : 'Attendance Rate %',
    ]],
    body: termsData,
    theme: 'grid',
    styles: {
      font: fontName,
      fontSize: 9,
      cellPadding: 5,
    },
    headStyles: {
      fillColor: [23, 59, 101],
      textColor: [255, 255, 255],
    },
    columnStyles: {
      0: { cellWidth: 30, halign: 'center' },
      1: { cellWidth: 200 },
      2: { cellWidth: 80, halign: 'center' },
      3: { cellWidth: 80, halign: 'center' },
      4: { cellWidth: 100, halign: 'center' },
    },
    margin: { left: 40, right: 40 },
  });

  const finalY = (doc as any).lastAutoTable?.finalY || 350;

  // Signatures
  const sigY = Math.min(finalY + 50, 750);
  doc.setFont(fontName, 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);

  doc.text(isAm ? 'ያዘጋጀው መምህር: ____________________' : 'Teacher Signature: ____________________', 40, sigY);
  doc.text(isAm ? 'ፊርማ እና ቀን' : 'Signature & Date', 40, sigY + 16);

  doc.text(isAm ? 'የትምህርት ቤቱ ማህተም: ____________________' : 'School Official Seal / Stamp: ____________________', 300, sigY);
  doc.text(isAm ? 'ርዕሰ መምህር' : 'Principal / Director', 300, sigY + 16);

  triggerBlobDownload(doc.output('blob'), `Annual_Report_${report.academicYear.replace(/\s+/g, '_')}.pdf`);
}
