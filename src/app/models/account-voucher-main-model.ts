import {AccountVoucherModel} from './account-voucher-model';
import {CustomerModel} from './customer-model';

export class AccountVoucherMainModel {
  data: AccountVoucherModel;
  customerName?: string;
  customer?: CustomerModel;
  employeeName?: string;
  approverName?: string;
  actionType?: string;
  statusTr?: string;
  platformTr?: string;
  amountFormatted?: string;
}
