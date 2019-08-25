export interface AccountTransactionModel {
    primaryKey?: string;
    userPrimaryKey?: string;
    receiptNo?: string;
    transactionPrimaryKey?: string;
    transactionType?: string;
    parentPrimaryKey?: string;
    parentType?: string;
    cashDeskPrimaryKey?: string;
    amount?: number;
    amountType?: string;
    insertDate?: Date;
}
