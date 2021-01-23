import {isNullOrUndefined} from 'util';
import * as CryptoJS from 'crypto-js';

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
  if (value === undefined || value === null) {
    return '';
  }
  if (String(value)) {
    return value.toString();
  }
  return '';
};

export const getStringCorrected = (value: any, returnValue: any) => {
  if (value === undefined || value === null || value === '') {
    return returnValue;
  }
  if (String(value)) {
    return value.toString();
  }
  return returnValue;
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

export const getBeginOfYearForInput = () => {
  const date = new Date();
  return { year: date.getFullYear(), month: 1, day: 1 };
};

export const getDateAndTime = (hour: number, minute: number, seconds: number) => {
  const date = new Date();
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, minute, seconds);
};

export const getTodayStart = () => {
  return getDateAndTime(0, 0, 0);
};

export const getDateTime = (year: number, month: number, day: number, hour: number, minute: number, seconds: number) => {
  const date = new Date();
  return new Date(year, month, day, hour, minute, seconds);
};

export const getDateTimeNow = () => {
  const date = new Date();
  return date.getTime();
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

export const getDateTimeForInput = (value: number) => {
  const date = new Date(value);
  return { year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate(),
    hour: date.getHours(), minute: date.getMinutes(), seconds: date.getSeconds() };
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

export const getDateTimeForQueryFilter = (value: any) => {
  if (isNullOrEmpty(value)) {
    const date = new Date();
    return getDateTime(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0).getTime();
  } else {
    const date = new Date(value);
    return getDateTime(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0).getTime();
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
  return new Map([
    ['salesInvoice', 'Satış Faturası'],
    ['cancelSalesInvoice', 'Satış Faturası İptal'],
    ['returnSalesInvoice', 'Satış Faturası İade'],
    ['cancelReturnSalesInvoice', 'Satış Faturası İade İptal'],
    ['serviceSalesInvoice', 'Satış Faturası Hizmet'],
    ['cancelServiceSalesInvoice', 'Satış Faturası Hizmet İptal'],

    ['collection', 'Tahsilat'],
    ['cancelCollection', 'Tahsilat İptal'],

    ['purchaseInvoice', 'Alım Faturası'],
    ['cancelPurchaseInvoice', 'Alım Faturası İptal'],
    ['returnPurchaseInvoice', 'Alım İade Faturası'],
    ['cancelReturnPurchaseInvoice', 'Alım İade Faturası İptal'],
    ['servicePurchaseInvoice', 'Alım Hizmet Faturası'],
    ['cancelServicePurchaseInvoice', 'Alım Hizmet Faturası İptal'],

    ['payment', 'Ödeme'],
    ['cancelPayment', 'Ödeme İptal'],
    ['accountVoucher', 'Cari Fiş'],
    ['cashDeskVoucher', 'Kasa Fişi'],
    ['buy-sale', 'Alış-Satış'],
    ['-1', 'Genel']
  ]);
};

export const getMonths = () => {
  return new Map([['1', 'Ocak'], ['2', 'Şubat'], ['3', 'Mart'], ['4', 'Nisan'], ['5', 'Mayıs'], ['6', 'Haziran'],
  ['7', 'Temmuz'], ['8', 'Ağustos'], ['9', 'Eylül'], ['10', 'Ekim'], ['11', 'Kasım'], ['12', 'Aralık']]);
};

export const getRelationTypes = () => {
  return new Map([['meeting', 'Toplanti'], ['mailSending', 'Mail Gönderim'],
  ['faxSending', 'Fax Gönderim'], ['phoneCall', 'Telefon Görüşmesi'], ['travel', 'Seyahat'], ['visit', 'Ziyaret']]);
};

export const getPaymentTypes = () => {
  return new Map([['cash', 'Nakit'], ['creditCard', 'Kredi Kartı'], ['transfer', 'Havale'], ['cheque', 'Çek'], ['-1', 'Seçilmedi']]);
};

export const getCurrencyTypes = () => {
  return new Map([['lira', 'Lira'], ['dollar', 'Dolar'], ['euro', 'Avro']]);
};

export const getUserTypes = () => {
  return new Map([['admin', 'Administrator'], ['manager', 'Yönetici'], ['user', 'Kullanıcı']]);
};

export const getTerms = () => {
  return new Map([['cash', 'Nakit'], ['15G', '15 Gün'], ['30G', '30 Gün'], ['45G', '45 Gün'], ['60G', '60 Gün'], ['90G', '90 Gün'],
    ['120G', '120 Gün'], ['-1', 'Seçilmedi']]);
};

export const getGenders = () => {
  return new Map([['male', 'Erkek'], ['female', 'Kadın']]);
};

export const getEducation = () => {
  return new Map([['primarySchool', 'İlk Okul'], ['middleSchool', 'Orta Okul'], ['highSchool', 'Lise'], ['university', 'Üniversite']]);
};

export const getCustomerTypes = () => {
  return new Map([['customer', 'Müşteri'], ['supplier', 'Tedarikçi'], ['customer-supplier', 'Müşteri-Tedarikçi']]);
};

export const getAllParentTypes = () => {
  return new Map([['-1', 'Genel'], ['customer', 'Müşteri'], ['supplier', 'Tedarikçi'], ['customer-supplier', 'Müşteri-Tedarikçi']]);
};

export const getCashDeskVoucherType = () => {
  return new Map([['open', 'Açılış'], ['transfer', 'Transfer']]);
};

export const getStatus = () => {
  return new Map([['waitingForApprove', 'Onay Bekleniyor'], ['approved', 'Onaylandı'], ['rejected', 'Reddedildi'],
    ['closed', 'Kapatıldı'], ['done', 'Tamamlandı'], ['portion', 'Parçalı Faturalama'], ['canceled', 'İptal Edildi']]);
};

export const getOrderType = () => {
  return new Map([['sales', 'Satış Sipariş'], ['purchase', 'Alım Sipariş'], ['service', 'Hizmet Sipariş'], ['return', 'İade Sipariş']]);
};

export const getInvoiceType = () => {
  return new Map([['sales', 'Satış Faturası'], ['service', 'Hizmet Faturası'], ['return', 'İade Faturası'], ['purchase', 'Alım Faturası']]);
};

export const getBuySaleType = () => {
  return new Map([['buy', 'Alış'], ['sale', 'Satış']]);
};

export const getReminderType = () => {
  return new Map([['oneTime', 'Tek Sefer'], ['daily', 'Günlük'], ['monthly', 'Aylık'], ['yearly', 'Yıllık']]);
};

export const getMailParents = () => {
  return new Map([['anyone', 'Mail Adresi'], ['customer', 'Müşteri'], ['employee', 'Personel']]);
};

export const getProductTypes = () => {
  return new Map([['normal', 'Normal'], ['promotion', 'Promosyon'], ['service', 'Hizmet'],
    ['buy', 'Alım'], ['sale', 'Satış'], ['buy-sale', 'Alım-Satış']]);
};

export const getStockTypesForImport = () => {
  return new Map([['Normal Ürün', 'normal'], ['Promosyon Ürün', 'promotion'], ['Hizmet Ürün', 'service']]);
};

export const getProductTypesForImport = () => {
  return new Map([['Alım', 'buy'], ['Satış', 'sale'], ['Alım-Satış', 'buy-sale']]);
};


export const getCustomerTypesForImport = () => {
  return new Map([['Müşteri', 'customer'], ['Tedarikçi', 'supplier'], ['Müşteri-Tedarikçi', 'customer-supplier']]);
};

export const getCampaignType = () => {
  return new Map([['normal', 'Normal Kampanya'], ['packet', 'Paket Kampanya']]);
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

export const encryptData = (strData: any) => {
  return CryptoJS.AES.encrypt(JSON.stringify(strData), getEncryptionKey()).toString();
};

export const getModuleIcons = () => {
  return new Map([
    ['salesInvoice', '../../assets/images/sales_invoice.png'],
    ['cancelSalesInvoice', '../../assets/images/sales_invoice.png'],
    ['collection', '../../assets/images/collection.png'],
    ['purchaseInvoice', '../../assets/images/purchase_invoice.png'],
    ['payment', '../../assets/images/payment.png'],
    ['accountVoucher', '../../assets/images/account_voucher.png'],
    ['cashDeskVoucher', '../../assets/images/account_voucher.png'],
    ['buy-sale', '../../assets/images/customer_account.png']
  ]);
};

export const getFileIcons = () => {
  return new Map([
    ['txt', '../../assets/icons/txt-icon.png'],
    ['7z', '../../assets/icons/7z-icon.png'],
    ['ai', '../../assets/icons/ai-icon.png'],
    ['doc', '../../assets/icons/doc-icon.png'],
    ['docx', '../../assets/icons/doc-icon.png'],
    ['rtf', '../../assets/icons/doc-icon.png'],
    ['eps', '../../assets/icons/eps-icon.png'],
    ['gif', '../../assets/icons/gif-icon.png'],
    ['html', '../../assets/icons/html-icon.png'],
    ['jpeg', '../../assets/icons/jpeg-icon.png'],
    ['jpg', '../../assets/icons/jpg-icon.png'],
    ['png', '../../assets/icons/png-icon.png'],
    ['log', '../../assets/icons/log-icon.png'],
    ['psd', '../../assets/icons/psd-icon.png'],
    ['tiff', '../../assets/icons/tiff-icon.png'],
    ['zip', '../../assets/icons/zip-icon.png'],
    ['vcd', '../../assets/icons/vcd-icon.png'],
    ['vcdx', '../../assets/icons/vcd-icon.png'],
    ['vsd', '../../assets/icons/vcd-icon.png'],
    ['vsdx', '../../assets/icons/vcd-icon.png'],
    ['xls', '../../assets/icons/xls-icon.png'],
    ['xlsx', '../../assets/icons/xlsx-icon.png'],
    ['pdf', '../../assets/icons/pdf-icon.png'],
    ['js', '../../assets/icons/txt-icon.png'],
  ]);
};

export const currencyFormat = (data: any) => {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY'}).format(data);
};

export const moneyFormat = (data: any) => {
  return data.replace('₺', '').replace('.', '').replace(',', '.');
};

export const getConvertedUnitValue = (productValue: number, productDefaultUnitCode: string, productCurrentUnitCode: string,
                                      productCurrentUnitValue: number, productTargetUnitCode: string, productTargetUnitValue: number) => {
  if (productCurrentUnitCode === productTargetUnitCode) {
    return productValue;
  } else {
    let defaultValue = 0;
    if (productDefaultUnitCode === productCurrentUnitCode) {
      defaultValue = productValue;
    } else {
      defaultValue = productValue / productCurrentUnitValue;
    }
    if (productDefaultUnitCode === productTargetUnitCode) {
      return defaultValue.toFixed(2);
    } else {
      return (defaultValue / productTargetUnitValue).toFixed(2);
    }
  }
};



