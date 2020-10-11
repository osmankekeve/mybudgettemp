export class ProductModel {
  primaryKey?: string;
  userPrimaryKey: string;
  employeePrimaryKey: string;
  productCode: string;
  productBaseCode: string;
  productName: string;
  stockType: string; // normal, promotion, service
  productType: string; // buy, sale, buy-sale
  defaultUnitCode: string;
  taxRate: number;
  sctAmount?: number;
  isActive: boolean;
  weight?: number;
  height?: number;
  description?: string;
  barcode1?: string;
  barcode2?: string;
  imgUrl?: string;
  isWebProduct: boolean;
  insertDate?: number;
}
