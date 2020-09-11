import {SalesInvoiceModel} from './sales-invoice-model';
import {CustomerAccountModel} from './customer-account-model';
import {CustomerMainModel} from './customer-main-model';

export class SalesInvoiceMainModel {
  data: SalesInvoiceModel;
  customerName?: string;
  customer?: CustomerMainModel;
  account?: CustomerAccountModel;
  employeeName?: string;
  approverName?: string;
  actionType?: string;
  totalPriceFormatted?: string;
  totalPriceWithTaxFormatted?: string;
  statusTr?: string;
  platformTr?: string;
}
