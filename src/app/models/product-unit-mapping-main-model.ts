import {ProductUnitMappingModel} from './product-unit-mapping-model';
import {ProductMainModel} from './product-main-model';
import {ProductUnitModel} from './product-unit-model';
import {ProductModel} from './product-model';

export class ProductUnitMappingMainModel {
  data: ProductUnitMappingModel;
  product: ProductMainModel;
  unit: ProductUnitModel;
  actionType?: string;
  isActiveTr?: string;
}
