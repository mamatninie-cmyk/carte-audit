
import { AUDIT_DATA } from '../constants';
import { DepartmentStats, CoverageLevel, AuditEntry } from '../types';

export const calculateDepartmentStats = (): Map<string, DepartmentStats> => {
  const statsMap = new Map<string, DepartmentStats>();
  const auditorBases = new Map<string, { dept: string; count: number }>();

  // 1. Identify "Home Base" for each auditor (where they have the max 2025 count)
  AUDIT_DATA.forEach((entry: AuditEntry) => {
    const currentBase = auditorBases.get(entry.auditor);
    if (!currentBase || entry.count2025 > currentBase.count) {
      auditorBases.set(entry.auditor, { dept: entry.department, count: entry.count2025 });
    }
  });

  // 2. Accumulate stats per department
  AUDIT_DATA.forEach((entry: AuditEntry) => {
    let deptStat = statsMap.get(entry.department);
    if (!deptStat) {
      deptStat = {
        id: entry.department,
        total2025: 0,
        total2024: 0,
        auditorsCount: 0,
        isHomeBaseFor: [],
        auditors: [],
        score: 0,
        level: CoverageLevel.NONE
      };
      statsMap.set(entry.department, deptStat);
    }

    const isBase = auditorBases.get(entry.auditor)?.dept === entry.department;
    if (isBase) {
      deptStat.isHomeBaseFor.push(entry.auditor);
    }

    if (entry.count2025 > 0) {
      deptStat.total2025 += entry.count2025;
      deptStat.total2024 += entry.count2024;
      deptStat.auditorsCount += 1;
      deptStat.auditors.push({ 
        name: entry.auditor, 
        count25: entry.count2025, 
        count24: entry.count2024,
        isBase: isBase
      });
    }
  });

  // 3. Assign levels based on volume, diversity, and proximity bonus
  statsMap.forEach((stat) => {
    // Volume base (2025)
    let score = stat.total2025 * 0.8;
    
    // Diversity bonus (multiple auditors = safer coverage)
    score += (stat.auditorsCount * 4);

    // Proximity Bonus: If this is a home base for at least one auditor, 
    // it implies immediate availability and familiarity.
    if (stat.isHomeBaseFor.length > 0) {
      score += 15; // Significant boost for local residence/base
    }

    stat.score = score;

    if (score >= 35) {
      stat.level = CoverageLevel.EXCELLENT;
    } else if (score >= 18) {
      stat.level = CoverageLevel.GOOD;
    } else if (score >= 8) {
      stat.level = CoverageLevel.AVERAGE;
    } else if (score > 0) {
      stat.level = CoverageLevel.WEAK;
    } else {
      stat.level = CoverageLevel.NONE;
    }
  });

  return statsMap;
};
