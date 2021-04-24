import { StockModel } from './stock-model';
import {ProductModel} from './product-model';

export class ProductMainModel {
  data: ProductModel;
  stock: StockModel;
  actionType?: string;
  defaultUnitName?: string;
  isActiveTr?: string;
  isWebProductTr?: string;
  stockTypeTr?: string;
  productTypeTr?: string;
  sctAmountFormatted?: string;
}
