import {SalesInvoiceModel} from './sales-invoice-model';
import {CustomerModel} from './customer-model';
import {CustomerAccountModel} from './customer-account-model';

export class SalesInvoiceMainModel {
  data: SalesInvoiceModel;
  customerName?: string;
  customer?: CustomerModel;
  account?: CustomerAccountModel;
  employeeName?: string;
  actionType?: string;
  totalPriceFormatted?: string;
  totalPriceWithTaxFormatted?: string;
}
