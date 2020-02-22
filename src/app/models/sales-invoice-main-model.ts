import {SalesInvoiceModel} from './sales-invoice-model';
import {CustomerModel} from './customer-model';

export class SalesInvoiceMainModel {
  data: SalesInvoiceModel;
  customerName?: string;
  customer?: CustomerModel;
  employeeName?: string;
  actionType?: string;
}
