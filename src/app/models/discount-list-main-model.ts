import {PriceListModel} from './price-list-model';
import {ProductPriceMainModel} from './product-price-main-model';
import {DiscountListModel} from './discount-list-model';
import {ProductDiscountMainModel} from './product-discount-main-model';

export class DiscountListMainModel {
  data?: DiscountListModel;
  typeTr?: string;
  isActiveTr?: string;
  actionType?: string;
  productList?: Array<ProductDiscountMainModel>;
}
