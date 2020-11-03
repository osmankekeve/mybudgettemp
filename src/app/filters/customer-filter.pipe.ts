import { Pipe, PipeTransform } from '@angular/core';
@Pipe({
  name: 'filterCustomer'
})

export class CustomerFilterPipe implements PipeTransform {

  transform(value: any, args?: any): any {
    if (!args) {
     return value;
    }
    return value.filter(
      item => item.customerName.toLowerCase().indexOf(args.toLowerCase()) > -1 || item.code.toLowerCase().indexOf(args.toLowerCase()) > -1
   );
  }
}
