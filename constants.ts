import { Meeting, Holiday } from './types';

export const FED_MEETINGS_2026: string[] = [
  '2026-01-28',
  '2026-03-18',
  '2026-04-29',
  '2026-06-17',
  '2026-07-29',
  '2026-09-16',
  '2026-10-28',
  '2026-12-09',
];

export const FED_MEETINGS_2027: string[] = [
  '2027-01-27',
  '2027-03-17',
  '2027-04-28',
  '2027-06-09',
  '2027-07-28',
  '2027-09-15',
  '2027-10-27',
  '2027-12-08',
];

export const ALL_FED_MEETINGS = [...FED_MEETINGS_2026, ...FED_MEETINGS_2027];

export const FALLBACK_HOLIDAYS: Holiday[] = [
  // 2026
  { date: '2026-01-01', localName: "New Year's Day", name: "New Year's Day" },
  { date: '2026-01-19', localName: "MLK Day", name: "Martin Luther King, Jr. Day" },
  { date: '2026-02-16', localName: "Presidents' Day", name: "Washington's Birthday" },
  { date: '2026-04-03', localName: "Good Friday", name: "Good Friday" }, 
  { date: '2026-05-25', localName: "Memorial Day", name: "Memorial Day" },
  { date: '2026-06-19', localName: "Juneteenth", name: "Juneteenth National Independence Day" },
  { date: '2026-07-03', localName: "Independence Day", name: "Independence Day" },
  { date: '2026-09-07', localName: "Labor Day", name: "Labor Day" },
  { date: '2026-10-12', localName: "Columbus Day", name: "Columbus Day" },
  { date: '2026-11-11', localName: "Veterans Day", name: "Veterans Day" },
  { date: '2026-11-26', localName: "Thanksgiving Day", name: "Thanksgiving Day" },
  { date: '2026-12-25', localName: "Christmas Day", name: "Christmas Day" },
  // 2027
  { date: '2027-01-01', localName: "New Year's Day", name: "New Year's Day" },
  { date: '2027-01-18', localName: "MLK Day", name: "Martin Luther King, Jr. Day" },
  { date: '2027-02-15', localName: "Presidents' Day", name: "Washington's Birthday" },
  { date: '2027-03-26', localName: "Good Friday", name: "Good Friday" },
  { date: '2027-05-31', localName: "Memorial Day", name: "Memorial Day" },
  { date: '2027-06-18', localName: "Juneteenth (Observed)", name: "Juneteenth National Independence Day" }, // 19th is Sat
  { date: '2027-07-05', localName: "Independence Day (Observed)", name: "Independence Day" }, // 4th is Sun
  { date: '2027-09-06', localName: "Labor Day", name: "Labor Day" },
  { date: '2027-10-11', localName: "Columbus Day", name: "Columbus Day" },
  { date: '2027-11-11', localName: "Veterans Day", name: "Veterans Day" },
  { date: '2027-11-25', localName: "Thanksgiving Day", name: "Thanksgiving Day" },
  { date: '2027-12-24', localName: "Christmas Day (Observed)", name: "Christmas Day" }, // 25th is Sat
];

export const DEFAULT_MEETINGS: Meeting[] = ALL_FED_MEETINGS.map(d => ({
  date: d,
  hikeBps: 0
}));

export const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];