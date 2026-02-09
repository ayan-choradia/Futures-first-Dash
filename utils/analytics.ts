import { Scenario, DailyRate, DerivedInstrument, MarketData, Holiday } from '../types';
import { MONTH_NAMES } from '../constants';

// --- HELPERS ---
const getIMMDate = (year: number, month: number): Date => {
  const d = new Date(year, month, 1);
  let wedCount = 0;
  while (wedCount < 3) {
    if (d.getDay() === 3) wedCount++;
    if (wedCount < 3) d.setDate(d.getDate() + 1);
  }
  return d;
};

const getEndOfMonth = (year: number, month: number): Date => new Date(year, month + 1, 0);
const formatDate = (d: Date) => d.toISOString().split('T')[0];
const addDays = (dateStr: string, days: number) => {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + days);
    return formatDate(d);
};

// --- CORE RATE GENERATION ---
export const generateDailyRates = (scenario: Scenario, holidays: Holiday[]): DailyRate[] => {
  const rates: DailyRate[] = [];
  const startDate = new Date('2026-01-01');
  const endDate = new Date('2028-06-30'); 

  const E = scenario.baseEffr ?? scenario.baseSofr;
  const holidaySet = new Set(holidays.map(h => h.date));
  const meetings = scenario.meetings; 

  const LmMap = new Map<string, string>(); 
  for (let y = 2026; y <= 2028; y++) {
      for (let m = 0; m < 12; m++) {
        let d = new Date(y, m + 1, 0);
        while (true) {
            const dateStr = formatDate(d);
            const isWk = d.getDay()===0 || d.getDay()===6;
            if (!isWk && !holidaySet.has(dateStr)) {
                LmMap.set(`${y}-${m}`, dateStr);
                break;
            }
            d.setDate(d.getDate() - 1);
        }
      }
  }

  let prevBizRate = E; 

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = formatDate(d);
    const dayOfWeek = d.getDay(); 
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isHoliday = holidaySet.has(dateStr);
    const isBusinessDay = !isWeekend && !isHoliday;
    const month = d.getMonth();
    const year = d.getFullYear();

    let cumulativeHike = 0;
    // Rate changes effective the DAY AFTER the meeting
    for (const m of meetings) {
      if (m.date < dateStr) cumulativeHike += m.hikeBps;
    }
    const baseRate = E + (cumulativeHike / 100);

    let Sd = 0;
    let isTurn = false;
    const LmStr = LmMap.get(`${year}-${month}`);
    if (LmStr && dateStr === LmStr) {
        isTurn = true;
        if (month === 11) Sd = scenario.turns.yearEnd / 100;
        else if ([2,5,8].includes(month)) Sd = scenario.turns.quarterEnd / 100;
        else Sd = scenario.turns.monthEnd / 100;
    }

    let finalRate = baseRate;
    if (isBusinessDay) {
        finalRate = baseRate + Sd;
        prevBizRate = finalRate;
    } else {
        finalRate = prevBizRate;
    }

    rates.push({
      date: dateStr,
      dayType: isBusinessDay ? 'Business' : isWeekend ? 'Weekend' : 'Holiday',
      baseRate,
      turnPremium: Sd * 10000,
      finalRate,
      isMeetingDate: scenario.meetings.some(m => m.date === dateStr),
      isTurn
    });
  }
  return rates;
};

// --- SENSITIVITY MATH ---
const calculateDateRangeSensitivity = (meetingDate: string, start: string, end: string, dailyRates: DailyRate[]): number => {
    // Contract Period: Inclusive of Start, Exclusive of End? 
    // Usually Futures reference average rate over [Start, End]. 
    // Both inclusive usually for SOFR averages (all days in month).
    // Let's assume Inclusive-Inclusive for date filtering.
    
    // Effective Date of Hike = Meeting Date + 1 Day
    const effDate = addDays(meetingDate, 1);

    const windowRates = dailyRates.filter(r => r.date >= start && r.date <= end);
    const totalDays = windowRates.length;
    if (totalDays === 0) return 0;

    // Affected Days: Days in the window where Date >= Effective Date
    const affectedDays = windowRates.filter(r => r.date >= effDate).length;
    
    return affectedDays / totalDays;
};

const createInst = (id: string, name: string, price: number, rate: number, sens: Record<string, number>): DerivedInstrument => 
    ({ id, name, price, rate, meetingSensitivities: sens });

const calcSpread = (near: DerivedInstrument, far: DerivedInstrument): DerivedInstrument => {
    // Spread = Back Rate - Front Rate (Steepener +ve)
    // Or Spread = Front Price - Back Price? 
    // Standard STIR Spread: Near - Far (Price). 
    // If Price = 100 - Rate. 
    // Spread = (100 - Rn) - (100 - Rf) = Rf - Rn. 
    // So Spread Price corresponds to Rate Spread (Far - Near).
    // Sensitivity: If Far Rate goes up (Sens 1.0), Spread goes UP. 
    // So Spread Sens = Sens_Far - Sens_Near.
    
    // HOWEVER, checking user screenshot:
    // 1M Spread Jan-Feb (Jan 28 meeting). Value 90%.
    // Jan Sens: 10%. Feb Sens: 100%. 
    // If Sens = Back - Front = 1.0 - 0.1 = 0.9. Matches.
    
    const spreadVal = near.price - far.price; // This is the standard Price Spread.
    // But for Sensitivity, we want risk to Rate Hike.
    // If Rates go up 1bp across curve.
    // Near Price -1bp. Far Price -1bp. Spread Price Unchanged.
    // If Rate Hike is only in Far month.
    // Near 0. Far -1. Spread (- -1) = +1. 
    // So Spread Price increases if Far Rate increases.
    
    const sens: Record<string, number> = {};
    for (const k in near.meetingSensitivities) {
        const sNear = Math.abs(near.meetingSensitivities[k] || 0); // Use magnitude (0..1)
        const sFar = Math.abs(far.meetingSensitivities[k] || 0);
        sens[k] = sFar - sNear; // Result 0.9
    }
    return createInst(`${near.id}-${far.id}`, `${near.id}/${far.id}`, spreadVal, far.rate - near.rate, sens);
};

const calcFly = (spread1: DerivedInstrument, spread2: DerivedInstrument): DerivedInstrument => {
    // Fly = Spread1 - Spread2
    // Sens = Sens1 - Sens2
    const price = spread1.price - spread2.price;
    const sens: Record<string, number> = {};
    for (const k in spread1.meetingSensitivities) {
        sens[k] = (spread1.meetingSensitivities[k] || 0) - (spread2.meetingSensitivities[k] || 0);
    }
    // Id: S1=A-B, S2=B-C. Fly=A-B-C
    const parts1 = spread1.id.split('-');
    const parts2 = spread2.id.split('-');
    const id = `${parts1[0]}${parts1[1]}${parts2[1]}`; 
    return createInst(id, id, price, 0, sens);
};

const calcCondor = (spread1: DerivedInstrument, spread3: DerivedInstrument): DerivedInstrument => {
    const price = spread1.price - spread3.price;
    const sens: Record<string, number> = {};
    for (const k in spread1.meetingSensitivities) {
        sens[k] = (spread1.meetingSensitivities[k] || 0) - (spread3.meetingSensitivities[k] || 0);
    }
    return createInst(`${spread1.id}/${spread3.id}`, "Condor", price, 0, sens);
};

const calcDefly = (fly1: DerivedInstrument, fly2: DerivedInstrument): DerivedInstrument => {
    const price = fly1.price - fly2.price;
    const sens: Record<string, number> = {};
    for (const k in fly1.meetingSensitivities) {
        sens[k] = (fly1.meetingSensitivities[k] || 0) - (fly2.meetingSensitivities[k] || 0);
    }
    return createInst(`DF ${fly1.id}`, "Defly", price, 0, sens);
};

// --- MAIN CALCULATOR ---
export const calculateMarketData = (dailyRates: DailyRate[], meetings: {date: string}[]): MarketData => {
    
    // 1. MONTHLY OUTRIGHTS (SR1)
    const mOutrights: DerivedInstrument[] = [];
    for (let i = 0; i < 24; i++) {
        const d = new Date(2026, i, 1);
        const y = d.getFullYear();
        const m = d.getMonth();
        const start = formatDate(d);
        const end = formatDate(getEndOfMonth(y, m));
        
        const ratesInMonth = dailyRates.filter(r => r.date >= start && r.date <= end);
        const avg = ratesInMonth.reduce((sum, r) => sum + r.finalRate, 0) / (ratesInMonth.length || 1);
        
        const impacts: Record<string, number> = {};
        meetings.forEach(meet => {
            // Store raw sensitivity (0..1) to Rate Hike
            impacts[meet.date] = calculateDateRangeSensitivity(meet.date, start, end, dailyRates);
        });

        const id = `${MONTH_NAMES[m].toUpperCase()}${y-2000}`; 
        // Price is 100-Rate. 
        // For display, we store Price. 
        // Sensitivity attached is "Rate Sensitivity".
        mOutrights.push(createInst(id, id, 100 - avg, avg, impacts));
    }

    // 2. MONTHLY SPREADS & FLIES
    const mSpreads: DerivedInstrument[] = [];
    const mFlies: DerivedInstrument[] = [];

    for (let i = 0; i < mOutrights.length - 1; i++) {
        mSpreads.push(calcSpread(mOutrights[i], mOutrights[i+1]));
    }
    for (let i = 0; i < mSpreads.length - 1; i++) {
        mFlies.push(calcFly(mSpreads[i], mSpreads[i+1]));
    }

    // 3. QUARTERLY OUTRIGHTS (SR3)
    const qOutrights: DerivedInstrument[] = [];
    const immMonths = [2, 5, 8, 11]; 
    const years = [2026, 2027, 2028];
    
    years.forEach(y => {
        immMonths.forEach(m => {
            if (y === 2028 && m > 2) return; 

            // Standard CME Reference Quarter: 3rd Wed to 3rd Wed
            const startIMM = getIMMDate(y, m);
            const nextQMonth = m + 3;
            const nextY = nextQMonth > 11 ? y + 1 : y;
            const nextM = nextQMonth > 11 ? nextQMonth - 12 : nextQMonth;
            const endIMM = getIMMDate(nextY, nextM);

            const sStr = formatDate(startIMM);
            const eStr = formatDate(endIMM);

            const rates = dailyRates.filter(r => r.date >= sStr && r.date < eStr);
            const avg = rates.reduce((acc, v) => acc + v.finalRate, 0) / (rates.length || 1);

            const impacts: Record<string, number> = {};
            meetings.forEach(meet => {
                impacts[meet.date] = calculateDateRangeSensitivity(meet.date, sStr, eStr, dailyRates);
            });

            const codeMap: Record<number, string> = { 2: 'H', 5: 'M', 8: 'U', 11: 'Z' };
            const id = `SR3${codeMap[m]}${y-2020}`; 
            
            qOutrights.push(createInst(id, id, 100 - avg, avg, impacts));
        });
    });

    // 4. QUARTERLY SPREADS, FLIES, DEFLIES, CONDORS
    const qSpreads: DerivedInstrument[] = [];
    const qFlies: DerivedInstrument[] = [];
    const qDeflies: DerivedInstrument[] = [];
    const qCondors: DerivedInstrument[] = [];

    for (let i = 0; i < qOutrights.length - 1; i++) {
        qSpreads.push(calcSpread(qOutrights[i], qOutrights[i+1]));
    }
    for (let i = 0; i < qSpreads.length - 1; i++) {
        qFlies.push(calcFly(qSpreads[i], qSpreads[i+1]));
    }
    for (let i = 0; i < qFlies.length - 1; i++) {
        qDeflies.push(calcDefly(qFlies[i], qFlies[i+1]));
    }
    for (let i = 0; i < qSpreads.length - 2; i++) {
        qCondors.push(calcCondor(qSpreads[i], qSpreads[i+2]));
    }

    return {
        monthly: {
            outrights: mOutrights,
            spreads: mSpreads,
            flies: mFlies
        },
        quarterly: {
            outrights: qOutrights,
            spreads: qSpreads,
            flies: qFlies,
            deflies: qDeflies,
            condors: qCondors
        }
    };
};