import { Pipe, PipeTransform } from '@angular/core';
@Pipe({
  name: 'filterStockVoucher'
})

export class StockVoucherFilterPipe implements PipeTransform {

  transform(value: any, args?: any): any {
    if (!args) {
     return value;
    }
    return value.filter(
      item => item.data.receiptNo.toLowerCase().indexOf(args.toLowerCase()) > -1 || item.data.title.toLowerCase().indexOf(args.toLowerCase()) > -1
   );
  }
}
