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
  priceListName?: string;
  discountListName?: string;
  deliveryAddressName?: string;
  storageName?: string;
  termName?: string;
  paymentName?: string;
  approverName?: string;
  totalDetailDiscountFormatted?: string;
  generalDiscountFormatted?: string;
  totalPriceWithoutDiscountFormatted?: string;
  totalPriceFormatted?: string;
  totalPriceWithTaxFormatted?: string;
  orderDetailList: Array<SalesOrderDetailMainModel>;
}
