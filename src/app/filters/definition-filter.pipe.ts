import { Pipe, PipeTransform } from '@angular/core';
@Pipe({
  name: 'filterDefinition'
})

export class DefinitionFilterPipe implements PipeTransform {

  transform(value: any, args?: any): any {
    if (!args) {
     return value;
    }
    return value.filter(
      item => item.data.key.toLowerCase().indexOf(args.toLowerCase()) > -1 || item.data.custom1.toLowerCase().indexOf(args.toLowerCase()) > -1
   );
  }
}
