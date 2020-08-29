export class SalesOrderModel {
  primaryKey?: string;
  userPrimaryKey: string;
  employeePrimaryKey: string;
  customerPrimaryKey: string;
  priceListPrimaryKey: string;
  discountListPrimaryKey: string;
  deliveryAddressPrimaryKey?: string;
  storagePrimaryKey: string;
  termPrimaryKey: string;
  paymentTypePrimaryKey: string;
  status: string; // waiting, approve, reject
  type: string; // sales, service
  platform: string; // mobile, web
  description?: string;
  approverPrimaryKey: string;
  approveDate?: number;
  recordDate?: number;
  insertDate?: number;
  totalPrice?: number;
  totalPriceWithTax?: number;
  generalDiscount?: number;
}
