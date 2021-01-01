import {ProductMainModel} from './product-main-model';
import {currencyFormat} from '../core/correct-library';
import {ProductUnitModel} from './product-unit-model';
import { CampaignDetailModel } from './campaign-detail-model';

export class CampaignDetailMainModel {
  data: CampaignDetailModel;
  product: ProductMainModel;
  unit: ProductUnitModel;
  priceFormatted?: string;
  totalPriceFormatted?: string;
  totalPriceWithTaxFormatted?: string;
  totalTaxAmount?: number;
  totalTaxAmountFormatted?: string;
  actionType?: string;
}

export const setCampaignDetailCalculation = (record: CampaignDetailMainModel): void => {
  let productTotalPrice = record.data.price - (record.data.price * record.data.discount1) / 100;
  productTotalPrice = productTotalPrice - (productTotalPrice * record.data.discount2) / 100;
  productTotalPrice = productTotalPrice * record.data.quantity;
  record.data.totalPrice = productTotalPrice;
  record.data.totalPriceWithTax = record.data.totalPrice + (record.data.totalPrice * record.data.taxRate) / 100;
  record.totalPriceFormatted = currencyFormat(record.data.totalPrice);
  record.totalPriceWithTaxFormatted = currencyFormat(record.data.totalPriceWithTax);
  record.priceFormatted = currencyFormat(record.data.price);
  record.totalTaxAmount = record.data.totalPriceWithTax - record.data.totalPrice;
  record.totalTaxAmountFormatted = currencyFormat(record.totalTaxAmount);
};
