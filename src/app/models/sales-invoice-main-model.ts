import {SalesInvoiceModel} from './sales-invoice-model';
import {CustomerAccountModel} from './customer-account-model';
import {CustomerMainModel} from './customer-main-model';
import {SalesInvoiceDetailMainModel} from './sales-invoice-detail-main-model';

export class SalesInvoiceMainModel {
  data: SalesInvoiceModel;
  customerName?: string;
  customer?: CustomerMainModel;
  account?: CustomerAccountModel;
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
  invoiceDetailList: Array<SalesInvoiceDetailMainModel>;
}
