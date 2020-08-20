import {PriceListModel} from './price-list-model';
import {ProductPriceMainModel} from './product-price-main-model';

export class PriceListMainModel {
  data?: PriceListModel;
  typeTr?: string;
  isActiveTr?: string;
  actionType?: string;
  productList?: Array<ProductPriceMainModel>;
}
