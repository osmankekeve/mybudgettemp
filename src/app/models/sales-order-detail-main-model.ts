import {SalesOrderDetailModel} from './sales-order-detail-model';
import {ProductMainModel} from './product-main-model';

export class SalesOrderDetailMainModel {
  data: SalesOrderDetailModel;
  product: ProductMainModel;
  totalPriceFormatted?: string;
  totalPriceWithTaxFormatted?: string;
  actionType?: string;
}
