import { Pipe, PipeTransform } from '@angular/core';
@Pipe({
  name: 'filterWaitingWork'
})

export class WaitingWorkFilterPipe implements PipeTransform {

  transform(value: any, args?: any): any {
    if (!args) {
     return value;
    }
    return value.filter(
      item => item.log.toLowerCase().indexOf(args.toLowerCase()) > -1
   );
  }
}
