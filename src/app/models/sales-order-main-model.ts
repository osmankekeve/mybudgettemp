import {SalesOrderModel} from './sales-order-model';
import {CustomerMainModel} from './customer-main-model';
import {SalesOrderDetailMainModel} from './sales-order-detail-main-model';

export class SalesOrderMainModel {
  data: SalesOrderModel;
  customer: CustomerMainModel;
  platformTr?: string;
  orderTypeTr?: string;
  statusTr?: string;
  actionType?: string;
  detailDiscountAmount?: number;
  detailDiscountAmountFormatted?: string;
  generalDiscountAmount?: number;
  generalDiscountAmountFormatted?: string;
  totalPriceWithoutDiscount?: number;
  totalPriceWithoutDiscountFormatted?: string;
  totalPriceFormatted?: string;
  totalPriceWithTaxFormatted?: string;
  orderDetailList: Array<SalesOrderDetailMainModel>;
}
