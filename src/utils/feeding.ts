import type { DailyFeedingReport, FeedingActivityRow } from '../types.ts';

export function createDefaultFeedingActivities(): FeedingActivityRow[] {
  return [
    {
      id: 'act_1',
      orderNumber: 1,
      activityName: 'አጠቃላይ አገልግሎቱ',
      startTime: '',
      endTime: '',
    },
    {
      id: 'act_2',
      orderNumber: 2,
      activityName: 'የተሰጠው ትምህርት / ጨዋታ',
      startTime: '',
      endTime: '',
    },
    {
      id: 'act_3',
      orderNumber: 3,
      activityName: 'ምገባ',
      startTime: '',
      endTime: '',
    },
    {
      id: 'act_4',
      orderNumber: 4,
      activityName: 'መዝሙር',
      startTime: '',
      endTime: '',
    },
  ];
}

export interface FeedingValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export function validateFeedingReport(
  report: Partial<DailyFeedingReport>
): FeedingValidationResult {
  const errors: Record<string, string> = {};

  if (!report.coordinatorName || !report.coordinatorName.trim()) {
    errors.coordinatorName = 'የዕለቱ ተረኛ አስተባባሪ ስም ያስፈልጋል (Coordinator name is required)';
  }

  if (!report.foodType || !report.foodType.trim()) {
    errors.foodType = 'የምግቡ አይነት ያስፈልጋል (Food type is required)';
  }

  if (
    report.childrenCount === undefined ||
    isNaN(report.childrenCount) ||
    report.childrenCount < 0
  ) {
    errors.childrenCount = 'የህፃናት ቁጥር ከ 0 ያላነሰ መሆን አለበት (Children count must be 0 or greater)';
  }

  if (
    report.volunteersCount === undefined ||
    isNaN(report.volunteersCount) ||
    report.volunteersCount < 0
  ) {
    errors.volunteersCount = 'የአገልጋዮች ብዛት ከ 0 ያላነሰ መሆን አለበት (Volunteers count must be 0 or greater)';
  }

  if (!report.location || !report.location.trim()) {
    errors.location = 'ምገባው የተከናወነበት ቦታ ያስፈልጋል (Feeding location is required)';
  }

  if (!report.date || !report.date.trim()) {
    errors.date = 'ቀን ያስፈልጋል (Date is required)';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function calculateFeedingSummaryStats(reports: DailyFeedingReport[]) {
  const totalReports = reports.length;
  let totalChildrenFed = 0;
  let totalFoodKg = 0;
  let totalVolunteers = 0;
  let totalLessons = 0;
  let totalGames = 0;
  let totalNone = 0;

  reports.forEach((rep) => {
    totalChildrenFed += Number(rep.childrenCount) || 0;
    totalFoodKg += Number(rep.foodQuantityKg) || 0;
    totalVolunteers += Number(rep.volunteersCount) || 0;
    if (rep.activityType === 'lesson') totalLessons++;
    else if (rep.activityType === 'game') totalGames++;
    else if (rep.activityType === 'none') totalNone++;
  });

  const avgChildrenPerDay =
    totalReports > 0 ? Math.round(totalChildrenFed / totalReports) : 0;

  return {
    totalReports,
    totalChildrenFed,
    totalFoodKg: Math.round(totalFoodKg * 10) / 10,
    totalVolunteers,
    totalLessons,
    totalGames,
    totalNone,
    avgChildrenPerDay,
  };
}
