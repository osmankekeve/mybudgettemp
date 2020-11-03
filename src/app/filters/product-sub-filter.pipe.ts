import { Pipe, PipeTransform } from '@angular/core';
@Pipe({
  name: 'filterProductSub'
})

export class ProductSubFilterPipe implements PipeTransform {

  transform(value: any, args?: any): any {
    if (!args) {
     return value;
    }
    return value.filter(
      item => item.product.data.productName.toLowerCase().indexOf(args.toLowerCase()) > -1 || item.product.data.productCode.toLowerCase().indexOf(args.toLowerCase()) > -1
   );
  }
}
