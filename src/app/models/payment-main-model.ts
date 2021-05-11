import {PaymentModel} from './payment-model';
import {CustomerMainModel} from './customer-main-model';

export class PaymentMainModel {
  data: PaymentModel;
  customer?: CustomerMainModel;
  employeeName?: string;
  approverName?: string;
  actionType?: string;
  amountFormatted?: string;
  statusTr?: string;
  typeTr?: string;
  platformTr?: string;
  documentDate: string | number | Date;
}
