import {isNullOrUndefined} from 'util';

export const getFloat = (value: any) => {
  if (getNumber(value)) {
    return parseFloat(value.toString());
  }
  return 0;
};

export const getNumber = (value: any) => {
  if (Number(value)) {
    return parseInt(value.toString(), 0);
  }
  return 0;
};

export const getString = (value: any) => {
  if (String(value)) {
    return value.toString();
  }
  return '';
};

export const getBool = (value: any) => {
  if (Boolean(value)) {
    return value;
  }
  return false;
};

export const getBoolStr = (value: boolean) => {
  if (value === true) {
    return 'Evet';
  }
  return 'Hayır';
};

export const getBoolByInt = (value: number) => {
  if (Number(value)) {
    if (getNumber(value) === 0) {
      return false;
    } else {
      return true;
    }
  }
  return false;
};

export const isNullOrEmpty = (value: any) => {
  if (isNullOrUndefined(value) || value === '') {
    return true;
  }
  return false;
};

export const getTodayForInput = () => {
  const date = new Date();
  return { year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate() };
};

export const getFirstDayOfMonthForInput = () => {
  const date = new Date();
  return { year: date.getFullYear(), month: date.getMonth() + 1, day: 1 };
};

export const getDateAndTime = (hour: number, minute: number, seconds: number) => {
  const date = new Date();
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, minute, seconds);
};

export const getTodayStart = () => {
  return getDateAndTime(0, 0, 0);
};

export const getTodayEnd = () => {
  return getDateAndTime(23, 59, 59);
};

export const getDateForInput = (value: number) => {
  if (isNullOrEmpty(value)) {
    const date = new Date();
    return { year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate() };
  } else {
    const date = new Date(value);
    return { year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate() };
  }
};

export const getInputDataForInsert = (value: any) => {
  const date = new Date();
  if (isNullOrEmpty(value)) {
    return new Date(date.getFullYear(), date.getMonth() + 1, date.getDate(),
      date.getHours(), date.getMinutes(), date.getSeconds()).getTime();
  } else {
    return new Date(value.year, value.month - 1, value.day,
      date.getHours(), date.getMinutes(), date.getSeconds()).getTime();
  }
};

export const getDateForExcel = (value: number) => {
  if (isNullOrEmpty(value)) {
    const date = new Date();
    return date.getFullYear() + '-' + date.getMonth().toString().padStart(2, '0') + '-' + date.getDate().toString().padStart(2, '0');
  } else {
    const date = getDateForInput(value);
    return date.year + '-' + date.month.toString().padStart(2, '0') + '-' + date.day.toString().padStart(2, '0');
  }
};

