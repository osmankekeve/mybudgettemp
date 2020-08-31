import {SalesOrderDetailModel} from './sales-order-detail-model';
import {ProductMainModel} from './product-main-model';
import {currencyFormat} from '../core/correct-library';

export class SalesOrderDetailMainModel {
  data: SalesOrderDetailModel;
  product: ProductMainModel;
  priceFormatted?: string;
  totalPriceFormatted?: string;
  totalPriceWithTaxFormatted?: string;
  actionType?: string;
  processType?: string;
}

export const setOrderDetailCalculation = (record: SalesOrderDetailMainModel): void => {
  let productTotalPrice = record.data.price - (record.data.price * record.data.discount1) / 100;
  productTotalPrice = productTotalPrice - (productTotalPrice * record.data.discount2) / 100;
  productTotalPrice = productTotalPrice * record.data.quantity;
  record.data.totalPrice = productTotalPrice;
  record.data.totalPriceWithTax = record.data.totalPrice + (record.data.totalPrice * record.data.taxRate) / 100;
  record.totalPriceFormatted = currencyFormat(record.data.totalPrice);
  record.totalPriceWithTaxFormatted = currencyFormat(record.data.totalPriceWithTax);
};
