export class CustomerTargetModel {
    primaryKey?: string;
    userPrimaryKey: string;
    customerCode?: string;
    type?: string; // yearly, monthly
    beginMonth?: number;
    finishMonth?: number;
    year?: number;
    amount?: number;
    description?: string;
    insertDate: number;
}
