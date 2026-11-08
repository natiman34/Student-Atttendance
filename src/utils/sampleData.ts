import { Student, DayAttendance, DailyFeedingReport } from '../types.ts';
import { getTodayDateString } from './attendance.ts';

export const SAMPLE_STUDENTS: Student[] = [
  { id: 'stud_1', rollNumber: 1, name: 'አበበ ከበደ (Abebe Kebede)' },
  { id: 'stud_2', rollNumber: 2, name: 'ትዕግስት ታደሰ (Tigist Tadesse)' },
  { id: 'stud_3', rollNumber: 3, name: 'ዳዊት ኃይሌ (Dawit Haile)' },
  { id: 'stud_4', rollNumber: 4, name: 'ቤተልሔም አለሙ (Bethlehem Alemu)' },
  { id: 'stud_5', rollNumber: 5, name: 'ዮናስ መንግስቱ (Yonas Mengistu)' },
  { id: 'stud_6', rollNumber: 6, name: 'ሄለን ገብሬ (Helen Gebre)' },
  { id: 'stud_7', rollNumber: 7, name: 'ሳሙኤል ግርማ (Samuel Girma)' },
  { id: 'stud_8', rollNumber: 8, name: 'እየሩሳሌም በቀለ (Yerusalem Bekele)' },
  { id: 'stud_9', rollNumber: 9, name: 'ኪሩቤል ወርቁ (Kirubel Worku)' },
  { id: 'stud_10', rollNumber: 10, name: 'ማህሌት ጌታቸው (Mahlet Getachew)' },
  { id: 'stud_11', rollNumber: 11, name: 'ኤልያስ ሰለሞን (Elias Solomon)' },
  { id: 'stud_12', rollNumber: 12, name: 'ሰላማዊት ታፈሰ (Selamawit Tafesse)' },
];

export function getSampleFeedingReport(date: string = getTodayDateString()): DailyFeedingReport {
  return {
    id: `feeding_sample_${date}`,
    date,
    coordinatorName: 'ወ/ሮ አልማዝ ተስፋዬ (Almaz Tesfaye)',
    foodType: 'ምስር ወጥ በሩዝ (Lentil stew with rice)',
    foodQuantityKg: 35,
    location: 'ዋና የመመገቢያ አዳራሽ (Main Dining Hall)',
    childrenCount: 120,
    volunteersCount: 8,
    activityType: 'lesson',
    activities: [
      {
        id: 'act_1',
        orderNumber: 1,
        activityName: 'አጠቃላይ አገልግሎቱ',
        startTime: '05:30',
        endTime: '05:45',
      },
      {
        id: 'act_2',
        orderNumber: 2,
        activityName: 'የተሰጠው ትምህርት / ጨዋታ',
        startTime: '05:45',
        endTime: '06:30',
      },
      {
        id: 'act_3',
        orderNumber: 3,
        activityName: 'ምገባ',
        startTime: '06:30',
        endTime: '07:15',
      },
      {
        id: 'act_4',
        orderNumber: 4,
        activityName: 'መዝሙር',
        startTime: '07:15',
        endTime: '07:30',
      },
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function getSampleAttendance(
  students: Student[] = SAMPLE_STUDENTS,
  date: string = getTodayDateString()
): DayAttendance {
  const records: Record<string, import('../types.ts').AttendanceStatus> = {};
  students.forEach((s, idx) => {
    if (idx === 2) {
      records[s.id] = 'absent';
    } else if (idx === 6) {
      records[s.id] = 'permission';
    } else {
      records[s.id] = 'present';
    }
  });

  return {
    date,
    records,
    notes: {
      stud_3: 'ያልተሟላ ምክንያት (Unexcused absence)',
      stud_7: 'የህመም ፈቃድ (Medical permission leave)',
    },
    updatedAt: Date.now(),
  };
}
