import {currencyFormat} from '../core/correct-library';
import {PurchaseOrderMainModel} from './purchase-order-main-model';

export class PurchaseOrderModel {
  primaryKey?: string;
  userPrimaryKey: string;
  employeePrimaryKey: string;
  customerPrimaryKey: string;
  priceListPrimaryKey: string;
  discountListPrimaryKey: string;
  termPrimaryKey: string;
  paymentTypePrimaryKey: string;
  storagePrimaryKey: string;
  receiptNo: string;
  status: string; // waitingForApprove, approved, rejected
  type: string; // purchase, service, return
  platform: string; // mobile, web
  description?: string;
  approverPrimaryKey: string;
  approveDate?: number;
  recordDate?: number;
  insertDate?: number;
  totalPriceWithoutDiscount?: number;
  totalPrice?: number;
  totalDetailDiscount?: number;
  generalDiscountValue?: number;
  generalDiscount?: number;
  totalPriceWithTax?: number;
}

export const setOrderCalculation = (record: PurchaseOrderMainModel): void => {
  let a = 0;
  let b = 0;
  let c = 0;
  if (record.orderDetailList != null) {
    for (const item of record.orderDetailList) {
      // iskontosuz detay toplam fiyati
      a += item.data.price * item.data.quantity;
      // iskontolu detay toplam fiyati
      b += item.data.totalPrice;
      c += item.data.totalPriceWithTax;

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
  }
};
