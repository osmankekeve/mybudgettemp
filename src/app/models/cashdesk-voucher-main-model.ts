import {CashdeskVoucherModel} from './cashdesk-voucher-model';

export class CashDeskVoucherMainModel {
  data: CashdeskVoucherModel;
  employeeName?: string;
  casDeskName?: string;
  secondCashDeskName?: string;
  actionType?: string;
  typeTr?: string;
  isActiveTr?: string;
  amountFormatted?: string;
}
