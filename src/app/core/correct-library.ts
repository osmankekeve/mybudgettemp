import { isBoolean, isNumber, isString, isNullOrUndefined } from 'util';

export const getFloat = (value: any) => {
  if (isNumber(value)) {
    return parseFloat(value.toString());
  }
  return 0;
};

export const getNumber = (value: any) => {
  if (isNumber(value)) {
    return parseInt(value.toString(), 0);
  }
  return 0;
};

export const getString = (value: any) => {
  if (isString(value)) {
    return value.toString();
  }
  return '';
};

export const getBool = (value: any) => {
  if (isBoolean(value)) {
    return value;
  }
  return false;
};

export const getBoolByInt = (value: number) => {
  if (isNumber(value)) {
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

