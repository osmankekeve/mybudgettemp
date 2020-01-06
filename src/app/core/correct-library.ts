import {isNullOrUndefined} from 'util';


export const getNumber = (value: any) => {
  if (Number(value)) {
    return parseInt(value.toString(), 0);
  }
  return 0;
};

export const getFloat = (value: any) => {
  if (getNumber(value)) {
    return parseFloat(value.toString());
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

export const getTomorrowStart = () => {
  const date = new Date();
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1, 0, 0, 0);
};

export const getTomorrowEnd = () => {
  const date = new Date();
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1, 23, 59, 59);
};

export const getBeginOfYear = (year: number) => {
  const date = new Date();
  if (isNullOrEmpty(year)) {
    return new Date(date.getFullYear(), 1, 1, 0, 0, 0);
  } else {
    return new Date(year, 1, 1, 0, 0, 0);
  }
};

export const getEndOfYear = (year: number) => {
  const date = new Date();
  if (isNullOrEmpty(year)) {
    return new Date(date.getFullYear(), 12, 31, 23, 59, 59);
  } else {
    return new Date(year, 12, 31, 23, 59, 59);
  }
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

export const getTransactionTypes = () => {
  return new Map([['salesInvoice', 'Satış Faturası'], ['collection', 'Tahsilat'],
  ['purchaseInvoice', 'Alım Faturası'], ['payment', 'Ödeme'], ['accountVoucher', 'Cari Fiş'], ['cashDeskVoucher', 'Kasa Fişi']]);
};

export const getMonths = () => {
  return new Map([['1', 'Ocak'], ['2', 'Şubat'], ['3', 'Mart'], ['4', 'Nisan'], ['5', 'Mayıs'], ['6', 'Haziran'],
  ['7', 'Temmuz'], ['8', 'Ağustos'], ['9', 'Eylül'], ['10', 'Ekim'], ['11', 'Kasım'], ['12', 'Aralık']]);
};

export const getRelationTypes = () => {
  return new Map([['meeting', 'Toplanti'], ['mailSending', 'Mail Gönderim'],
  ['faxSending', 'Fax Gönderim'], ['phoneCall', 'Telefon Görüşmesi'], ['travel', 'Seyahat'], ['visit', 'Ziyaret']]);
};

export const getEncryptionKey = () => {
  return '34OSman17';
};

export const numberOnly = (event) =>  {
  const charCode = (event.which) ? event.which : event.keyCode;
  if (charCode > 31 && (charCode < 48 || charCode > 57)) {
    return false;
  }
  return true;
};

export const padLeft = (str: string, size: number) => {
  let s = str + '';
  while (s.length < size) { s = '0' + s; }
  return s;
};



