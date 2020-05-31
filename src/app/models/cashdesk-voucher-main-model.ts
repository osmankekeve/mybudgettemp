import {CashdeskVoucherModel} from './cashdesk-voucher-model';

export class CashDeskVoucherMainModel {
  data: CashdeskVoucherModel;
  employeeName?: string;
  approverName?: string;
  casDeskName?: string;
  secondCashDeskName?: string;
  actionType?: string;
  typeTr?: string;
  statusTr?: string;
  platformTr?: string;
  amountFormatted?: string;
}
