import {PaymentModel} from './payment-model';
import {CustomerModel} from './customer-model';

export class PaymentMainModel {
  data: PaymentModel;
  customer?: CustomerModel;
  customerName?: string;
  employeeName?: string;
  approverName?: string;
  actionType?: string;
  amountFormatted?: string;
  statusTr?: string;
  platformTr?: string;
}
