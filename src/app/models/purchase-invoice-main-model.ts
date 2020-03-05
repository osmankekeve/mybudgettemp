import {PurchaseInvoiceModel} from './purchase-invoice-model';
import {CustomerModel} from './customer-model';

export class PurchaseInvoiceMainModel {
  data: PurchaseInvoiceModel;
  customer?: CustomerModel;
  customerName?: string;
  employeeName?: string;
  actionType?: string;
  totalPriceFormatted?: string;
  totalPriceWithTaxFormatted?: string;
}
