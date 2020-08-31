import {SalesOrderMainModel} from './sales-order-main-model';
import {currencyFormat} from '../core/correct-library';

export class SalesOrderModel {
  primaryKey?: string;
  userPrimaryKey: string;
  employeePrimaryKey: string;
  customerPrimaryKey: string;
  priceListPrimaryKey: string;
  discountListPrimaryKey: string;
  deliveryAddressPrimaryKey?: string;
  storagePrimaryKey: string;
  termPrimaryKey: string;
  paymentTypePrimaryKey: string;
  status: string; // waiting, approve, reject
  type: string; // sales, service
  platform: string; // mobile, web
  description?: string;
  approverPrimaryKey: string;
  approveDate?: number;
  recordDate?: number;
  insertDate?: number;
  totalPrice?: number;
  totalPriceWithTax?: number;
  generalDiscount?: number;
}

export const setOrderCalculation = (record: SalesOrderMainModel): void => {
  let a = 0;
  let b = 0;
  let c = 0;
  for (const item of record.orderDetailList) {
    // iskontosuz detay toplam fiyati
    a += item.data.price * item.data.quantity;
    // iskontolu detay toplam fiyati
    b += item.data.totalPrice;
    c += item.data.totalPriceWithTax;

  }
  // iskontosuz detay toplam fiyati
  record.totalPriceWithoutDiscount = a;
  // iskontolu detay toplam fiyati
  record.data.totalPrice = b;
  // iskontolu detay toplam fiyati formatli
  record.totalPriceFormatted = currencyFormat(record.data.totalPrice);
  record.data.totalPriceWithTax = c;
  // iskontosuz detay toplam fiyati formatli
  record.totalPriceWithoutDiscountFormatted = currencyFormat(record.totalPriceWithoutDiscount);

  // detaya uygulanan toplan iskonto
  record.detailDiscountAmount = record.totalPriceWithoutDiscount - record.data.totalPrice;
  record.detailDiscountAmountFormatted = currencyFormat(record.detailDiscountAmount);

  // genel iskonto
  record.generalDiscountAmount = (record.data.totalPrice * record.data.generalDiscount) / 100;
  record.generalDiscountAmountFormatted = currencyFormat(record.generalDiscountAmount);
  // tum iskontolar uygulanmis kdv dahil toplam tutar
  record.data.totalPriceWithTax = record.data.totalPriceWithTax - record.generalDiscountAmount;
  record.totalPriceWithTaxFormatted = currencyFormat(record.data.totalPriceWithTax);
};
