import { Pipe, PipeTransform } from '@angular/core';
@Pipe({
  name: 'filterProfile'
})

export class ProfileFilterPipe implements PipeTransform {

  transform(value: any, args?: any): any {
    if (!args) {
     return value;
    }
    return value.filter(
      item => item.data.longName.toLowerCase().indexOf(args.toLowerCase()) > -1
   );
  }
}
