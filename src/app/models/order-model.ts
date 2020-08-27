export class OrderModel {
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
  orderStatus: string; // waiting, approve, reject
  orderType: string; // sales, service
  portal: string; // mobile, web
  orderDate: number;
  description?: string;
  insertDate?: number;
  approverPrimaryKey: string;
  approveDate?: number;
}
