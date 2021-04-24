import { StockTransactionModel } from './stock-transaction-model';

export class StockTransactionMainModel {
  data: StockTransactionModel;
  parentData?: any;
  transactionTypeTr?: string;
  subTransactionTypeTr?: string;
  actionType?: string;
}
