import { Pipe, PipeTransform } from '@angular/core';
@Pipe({
  name: 'filterCollection'
})

export class CollectionFilterPipe implements PipeTransform {

  transform(value: any, args?: any): any {
    if (!args) {
     return value;
    }
    return value.filter(
      item => item.data.receiptNo.toLowerCase().indexOf(args.toLowerCase()) > -1 ||
      item.customer.code.toLowerCase().indexOf(args.toLowerCase()) > -1 ||
      item.customer.name.toLowerCase().indexOf(args.toLowerCase()) > -1
   );
  }
}
