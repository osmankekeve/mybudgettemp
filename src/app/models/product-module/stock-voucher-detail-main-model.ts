import { ProductUnitModel } from './../product-unit-model';
import { ProductMainModel } from '../product-main-model';
import { StockVoucherDetailModel } from './stock-voucher-detail-model';
import { currencyFormat, getConvertedUnitValue, getFloat } from 'src/app/core/correct-library';
import { ProductUnitMappingModel } from '../product-unit-mapping-model';

export class StockVoucherDetailMainModel {
  data: StockVoucherDetailModel;
  product: ProductMainModel;
  unit: ProductUnitModel;
  unitMapping: ProductUnitMappingModel;
  defaultUnitQuantity?: number;
  amountFormatted?: string;
  totalAmount?: number;
  totalAmountFormatted?: string;
  actionType?: string;
}

export const setVoucherDetailCalculation = (record: StockVoucherDetailMainModel): void => {
  record.amountFormatted = currencyFormat(record.data.amount);
  record.totalAmount = record.data.amount * record.data.quantity;
  record.totalAmountFormatted = currencyFormat(record.totalAmount);
  record.defaultUnitQuantity =
  getConvertedUnitValue(record.data.quantity, record.product.data.defaultUnitCode,
    record.data.unitPrimaryKey, record.unitMapping.unitValue,
    record.product.data.defaultUnitCode, 1);
};
