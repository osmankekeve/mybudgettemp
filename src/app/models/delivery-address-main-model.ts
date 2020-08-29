import {DeliveryAddressModel} from './delivery-address-model';
import {CustomerMainModel} from './customer-main-model';

export class DeliveryAddressMainModel {
  data?: DeliveryAddressModel;
  customer: CustomerMainModel;
  actionType?: string;
}
