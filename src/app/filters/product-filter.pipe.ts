import { Pipe, PipeTransform } from '@angular/core';
@Pipe({
  name: 'filterProduct'
})

export class ProductFilterPipe implements PipeTransform {

  transform(value: any, args?: any): any {
    if (!args) {
     return value;
    }
    return value.filter(
      item => item.data.productName.toLowerCase().indexOf(args.toLowerCase()) > -1
   );
  }
}
