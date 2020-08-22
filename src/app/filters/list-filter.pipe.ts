import { Pipe, PipeTransform } from '@angular/core';
@Pipe({
  name: 'filterList'
})

export class ListFilterPipe implements PipeTransform {

  transform(value: any, args?: any): any {
    if (!args) {
     return value;
    }
    return value.filter(
      item => item.data.listName.toLowerCase().indexOf(args.toLowerCase()) > -1
   );
  }
}
