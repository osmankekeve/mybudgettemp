import { Pipe, PipeTransform } from '@angular/core';
@Pipe({
  name: 'filterReminder'
})

export class ReminderFilterPipe implements PipeTransform {

  transform(value: any, args?: any): any {
    if (!args) {
     return value;
    }
    return value.filter(
      item => item.data.description.toLowerCase().indexOf(args.toLowerCase()) > -1
   );
  }
}
