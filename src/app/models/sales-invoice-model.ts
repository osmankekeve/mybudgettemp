import {currencyFormat} from '../core/correct-library';
import {SalesInvoiceMainModel} from './sales-invoice-main-model';
import {SalesInvoiceDetailMainModel} from './sales-invoice-detail-main-model';

export class SalesInvoiceModel {
  primaryKey?: string;
  userPrimaryKey: string;
  employeePrimaryKey: string;
  customerCode?: string;
  accountPrimaryKey?: string;
  storagePrimaryKey?: string;
  receiptNo?: string;
  type?: string; // sales, service, return
  description?: string;
  status?: string; // waitingForApprove, approved, rejected, canceled
  approveByPrimaryKey?: string; // approved or rejected
  approveDate?: number;
  platform?: string; // mobile, web
  isWaybill?: boolean;
  insertDate?: number;
  recordDate?: number;
  totalPriceWithoutDiscount?: number;
  totalPrice?: number;
  totalDetailDiscount?: number;
  generalDiscountValue?: number;
  generalDiscount?: number;
  totalPriceWithTax?: number;
  orderPrimaryKeyList: Array<string>;
}

export const setInvoiceCalculation = (record: SalesInvoiceMainModel, list: Array<SalesInvoiceDetailMainModel>): void => {
  let a = 0;
  let b = 0;
  let c = 0;
  record.data.orderPrimaryKeyList = [];
  if (list != null) {
    for (const item of list) {
      // iskontosuz detay toplam fiyati
      a += item.data.price * item.data.quantity;
      // iskontolu detay toplam fiyati
      b += item.data.totalPrice;
      c += item.data.totalPriceWithTax;

      if (record.data.orderPrimaryKeyList.indexOf(item.data.orderPrimaryKey) < 0) {
        record.data.orderPrimaryKeyList.push(item.data.orderPrimaryKey);
      }
    }
    // iskontosuz detay toplam fiyati
    record.data.totalPriceWithoutDiscount = a;
    // iskontolu detay toplam fiyati
    record.data.totalPrice = b;
    // iskontolu detay toplam fiyati formatli
    record.totalPriceFormatted = currencyFormat(record.data.totalPrice);
    record.data.totalPriceWithTax = c;
    // iskontosuz detay toplam fiyati formatli
    record.totalPriceWithoutDiscountFormatted = currencyFormat(record.data.totalPriceWithoutDiscount);

    // detaya uygulanan toplan iskonto
    record.data.totalDetailDiscount = record.data.totalPriceWithoutDiscount - record.data.totalPrice;
    record.totalDetailDiscountFormatted = currencyFormat(record.data.totalDetailDiscount);

    // genel iskonto
    record.data.generalDiscount = (record.data.totalPrice * record.data.generalDiscountValue) / 100;
    record.generalDiscountFormatted = currencyFormat(record.data.generalDiscount);
    // tum iskontolar uygulanmis kdv dahil toplam tutar
    record.data.totalPriceWithTax = record.data.totalPriceWithTax - record.data.generalDiscount;
    record.totalPriceWithTaxFormatted = currencyFormat(record.data.totalPriceWithTax);
    // toplam KDV
    record.totalTaxAmount = record.data.totalPriceWithTax - record.data.totalPrice;
    record.totalTaxAmountFormatted = currencyFormat(record.totalTaxAmount);
    record.invoiceDetailList = list;
  }
};
