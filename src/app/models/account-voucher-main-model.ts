import {AccountVoucherModel} from './account-voucher-model';
import {CustomerMainModel} from './customer-main-model';

export class AccountVoucherMainModel {
  data: AccountVoucherModel;
  customer?: CustomerMainModel;
  employeeName?: string;
  approverName?: string;
  actionType?: string;
  statusTr?: string;
  platformTr?: string;
  typeTr?: string;
  amountFormatted?: string;
}
