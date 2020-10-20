import {CustomerMainModel} from './customer-main-model';
import {PurchaseOrderModel} from './purchase-order-model';
import {PurchaseOrderDetailMainModel} from './purchase-order-detail-main-model';

export class PurchaseOrderMainModel {
  data: PurchaseOrderModel;
  customer: CustomerMainModel;
  platformTr?: string;
  orderTypeTr?: string;
  statusTr?: string;
  actionType?: string;
  priceListName?: string;
  discountListName?: string;
  termName?: string;
  paymentName?: string;
  approverName?: string;
  totalDetailDiscountFormatted?: string;
  generalDiscountFormatted?: string;
  totalPriceWithoutDiscountFormatted?: string;
  totalPriceFormatted?: string;
  totalPriceWithTaxFormatted?: string;
  totalTaxAmount?: number;
  totalTaxAmountFormatted?: string;
  orderDetailList: Array<PurchaseOrderDetailMainModel>;
}
