import {CustomerModel} from './customer-model';
import {ProfileModel} from './profile-model';

export class CustomerMainModel {
  data: CustomerModel;
  employee?: ProfileModel;
  executive?: ProfileModel;
  actionType?: string;
  paymentTypeTr?: string;
  termTr?: string;
}
