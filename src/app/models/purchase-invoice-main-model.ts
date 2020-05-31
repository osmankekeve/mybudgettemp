import {PurchaseInvoiceModel} from './purchase-invoice-model';
import {CustomerModel} from './customer-model';

export class PurchaseInvoiceMainModel {
  data: PurchaseInvoiceModel;
  customer?: CustomerModel;
  customerName?: string;
  employeeName?: string;
  approverName?: string;
  actionType?: string;
  totalPriceFormatted?: string;
  totalPriceWithTaxFormatted?: string;
  statusTr?: string;
  platformTr?: string;
}
