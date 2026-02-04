
/**
 * Utility to estimate road distance and travel time in France.
 * Based on straight-line distance with a circuity factor.
 */

// Approximate centroids of French departments (lat, lng)
// This is a simplified map for estimation purposes.
export const DEPT_COORDS: Record<string, [number, number]> = {
  "01": [46.10, 5.24], "02": [49.56, 3.62], "03": [46.34, 3.33], "04": [44.09, 6.24], "05": [44.56, 6.08],
  "06": [43.70, 7.27], "07": [44.75, 4.59], "08": [49.76, 4.72], "09": [42.96, 1.60], "10": [48.30, 4.08],
  "11": [43.21, 2.35], "12": [44.35, 2.57], "13": [43.45, 5.40], "14": [49.18, -0.37], "15": [44.93, 2.44],
  "16": [45.65, 0.16], "17": [45.75, -0.63], "18": [47.08, 2.40], "19": [45.27, 1.77], "21": [47.32, 5.04],
  "22": [48.51, -2.76], "23": [46.17, 1.87], "24": [45.18, 0.72], "25": [47.24, 6.02], "26": [44.93, 4.89],
  "27": [49.02, 1.15], "28": [48.45, 1.49], "29": [48.40, -4.10], "2A": [41.93, 8.74], "2B": [42.69, 9.45],
  "30": [43.84, 4.36], "31": [43.60, 1.44], "32": [43.65, 0.58], "33": [44.84, -0.58], "34": [43.61, 3.88],
  "35": [48.11, -1.68], "36": [46.81, 1.69], "37": [47.39, 0.69], "38": [45.19, 5.72], "39": [46.67, 5.55],
  "40": [43.89, -0.50], "41": [47.59, 1.33], "42": [45.44, 4.39], "43": [45.04, 3.88], "44": [47.22, -1.55],
  "45": [47.90, 1.91], "46": [44.45, 1.44], "47": [44.20, 0.62], "48": [44.52, 3.50], "49": [47.47, -0.55],
  "50": [49.12, -1.09], "51": [48.96, 4.37], "52": [48.11, 5.14], "53": [48.07, -0.77], "54": [48.69, 6.18],
  "55": [48.77, 5.16], "56": [47.66, -2.76], "57": [49.12, 6.18], "58": [47.00, 3.16], "59": [50.63, 3.06],
  "60": [49.43, 2.08], "61": [48.43, 0.09], "62": [50.48, 2.44], "63": [45.78, 3.08], "64": [43.30, -0.37],
  "65": [43.23, 0.08], "66": [42.69, 2.89], "67": [48.58, 7.75], "68": [47.75, 7.34], "69": [45.76, 4.83],
  "70": [47.62, 6.16], "71": [46.78, 4.83], "72": [48.01, 0.20], "73": [45.57, 5.92], "74": [45.90, 6.13],
  "75": [48.86, 2.35], "76": [49.44, 1.10], "77": [48.54, 2.65], "78": [48.81, 2.13], "79": [46.33, -0.47],
  "80": [49.90, 2.30], "81": [43.93, 2.15], "82": [44.02, 1.35], "83": [43.13, 5.93], "84": [43.95, 4.81],
  "85": [46.67, -1.43], "86": [46.58, 0.34], "87": [45.83, 1.26], "88": [48.17, 6.45], "89": [47.80, 3.57],
  "90": [47.64, 6.86], "91": [48.51, 2.24], "92": [48.89, 2.23], "93": [48.91, 2.45], "94": [48.79, 2.45],
  "95": [49.04, 2.06], "20": [42.00, 9.00]
};

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export interface TravelInfo {
  distanceKm: number;
  timeMinutes: number;
  costEur: number | null; // null if SGS
}

export const estimateTravel = (fromDept: string, toDept: string, isSGS: boolean): TravelInfo => {
  if (fromDept === toDept) {
    return { distanceKm: 25, timeMinutes: 30, costEur: isSGS ? null : 25 * 0.42 };
  }

  const coord1 = DEPT_COORDS[fromDept];
  const coord2 = DEPT_COORDS[toDept];

  if (!coord1 || !coord2) {
    return { distanceKm: 0, timeMinutes: 0, costEur: null };
  }

  const crowDistance = getDistance(coord1[0], coord1[1], coord2[0], coord2[1]);
  // Circuity factor 1.3 for French roads + base 10km for local detours
  const roadDistance = Math.round(crowDistance * 1.3 + 10);
  // Average speed 75 km/h
  const timeMinutes = Math.round((roadDistance / 75) * 60);
  const costEur = isSGS ? null : Number((roadDistance * 0.42).toFixed(2));

  return { distanceKm: roadDistance, timeMinutes, costEur };
};

export const formatTime = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h${m.toString().padStart(2, '0')}` : `${m}min`;
};
