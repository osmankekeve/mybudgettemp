import { Pipe, PipeTransform } from '@angular/core';
@Pipe({
  name: 'filterDataCustomerCustomer'
})

export class CustomerCustomerDataFilterPipe implements PipeTransform {

  transform(value: any, args?: any): any {
    if (!args) {
     return value;
    }
    return value.filter(
      item => item.customer.data.name.toLowerCase().indexOf(args.toLowerCase()) > -1 || item.customer.data.code.toLowerCase().indexOf(args.toLowerCase()) > -1
   );
  }
}
