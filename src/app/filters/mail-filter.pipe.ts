import { Pipe, PipeTransform } from '@angular/core';
@Pipe({
  name: 'filterMail'
})

export class MailFilterPipe implements PipeTransform {

  transform(value: any, args?: any): any {
    if (!args) {
     return value;
    }
    return value.filter(
      item => item.data.subject.toLowerCase().indexOf(args.toLowerCase()) > -1 || item.customerName.toLowerCase().indexOf(args.toLowerCase()) > -1
   );
  }
}
