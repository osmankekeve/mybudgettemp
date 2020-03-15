import {CustomerModel} from './customer-model';
import {CustomerAccountModel} from './customer-account-model';

export class CustomerAccountMainModel {
  data?: CustomerAccountModel;
  customer: CustomerModel;
  actionType?: string;
  currencyTr?: string;
}
