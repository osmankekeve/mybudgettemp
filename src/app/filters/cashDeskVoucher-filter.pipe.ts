import { Pipe, PipeTransform } from '@angular/core';
@Pipe({
  name: 'filterCashDeskVoucher'
})

export class CashDeskVoucherFilterPipe implements PipeTransform {

  transform(value: any, args?: any): any {
    if (!args) {
     return value;
    }
    return value.filter(
      item => item.casDeskName.toLowerCase().indexOf(args.toLowerCase()) > -1
   );
  }
}
