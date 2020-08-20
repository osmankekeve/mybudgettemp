import {ProductPriceModel} from './product-price-model';
import {ProductMainModel} from './product-main-model';

export class ProductPriceMainModel {
  data?: ProductPriceModel;
  product?: ProductMainModel;
  actionType?: string;
  priceFormatted?: string;
}
