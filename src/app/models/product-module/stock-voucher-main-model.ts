import { currencyFormat } from 'src/app/core/correct-library';
import { StockVoucherDetailMainModel } from './stock-voucher-detail-main-model';
import { StockVoucherModel } from './stock-voucher-model';

export class StockVoucherMainModel {
  data: StockVoucherModel;
  typeTr?: string;
  statusTr?: string;
  actionType?: string;
  totalAmount?: number;
  totalAmountFormatted?: string;
  detailList: Array<StockVoucherDetailMainModel>;
}

export const setVoucherCalculation = (record: StockVoucherMainModel): void => {

  if (record.detailList != null) {
    for (const item of record.detailList) {
      record.totalAmount += item.data.amount * item.data.quantity;
    }
    record.totalAmountFormatted = currencyFormat(record.totalAmount);
  }
}