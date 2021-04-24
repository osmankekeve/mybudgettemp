import { ProductModel } from './product-model';
import { StockModel } from './stock-model';

export class StockMainModel {
  data: StockModel;
  product?: ProductModel;
  actionType?: string;
}
