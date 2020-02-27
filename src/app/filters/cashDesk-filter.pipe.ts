import { Pipe, PipeTransform } from '@angular/core';
@Pipe({
  name: 'filterCashDesk'
})

export class CashDeskFilterPipe implements PipeTransform {

  transform(value: any, args?: any): any {
    if (!args) {
     return value;
    }
    return value.filter(
      item => item.data.name.toLowerCase().indexOf(args.toLowerCase()) > -1
   );
  }
}
