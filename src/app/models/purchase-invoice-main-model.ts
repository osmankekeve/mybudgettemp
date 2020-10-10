import {PurchaseInvoiceModel} from './purchase-invoice-model';
import {PurchaseInvoiceDetailMainModel} from './purchase-invoice-detail-main-model';
import {CustomerAccountModel} from './customer-account-model';
import {CustomerMainModel} from './customer-main-model';

export class PurchaseInvoiceMainModel {
  data: PurchaseInvoiceModel;
  customer?: CustomerMainModel;
  account?: CustomerAccountModel;
  customerName?: string;
  employeeName?: string;
  approverName?: string;
  actionType?: string;
  statusTr?: string;
  platformTr?: string;
  typeTr?: string;
  totalDetailDiscountFormatted?: string;
  generalDiscountFormatted?: string;
  totalPriceWithoutDiscountFormatted?: string;
  totalPriceFormatted?: string;
  totalPriceWithTaxFormatted?: string;
  totalTaxAmount?: number;
  totalTaxAmountFormatted?: string;
  invoiceDetailList: Array<PurchaseInvoiceDetailMainModel>;
}
