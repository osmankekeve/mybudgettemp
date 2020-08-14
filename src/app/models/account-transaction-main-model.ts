import {AccountTransactionModel} from './account-transaction-model';

export class AccountTransactionMainModel {
  data: AccountTransactionModel;
  parentData?: any;
  customer?: any;
  iconUrl?: string;
  transactionTypeTr?: string;
  matchTr?: string;
  remainingAmount?: number;
  actionType?: string;
}
