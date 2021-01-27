import { Pipe, PipeTransform } from '@angular/core';
@Pipe({
  name: 'filterAccountTransaction'
})

export class AccountTransactionFilterPipe implements PipeTransform {

  transform(value: any, args?: any): any {
    if (!args) {
     return value;
    }
    return value.filter(
      item => item.parentData.name.toLowerCase().indexOf(args.toLowerCase()) > -1 || item.data.receiptNo.toLowerCase().indexOf(args.toLowerCase()) > -1
   );
  }
}
