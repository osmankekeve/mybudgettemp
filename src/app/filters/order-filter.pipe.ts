import { Pipe, PipeTransform } from '@angular/core';
@Pipe({
  name: 'filterOrder'
})

export class OrderFilterPipe implements PipeTransform {

  transform(value: any, args?: any): any {
    if (!args) {
     return value;
    }
    return value.filter(
      item => item.data.receiptNo.toLowerCase().indexOf(args.toLowerCase()) > -1
   );
  }
}
