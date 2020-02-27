import { Pipe, PipeTransform } from '@angular/core';
@Pipe({
  name: 'filterNote'
})

export class NoteFilterPipe implements PipeTransform {

  transform(value: any, args?: any): any {
    if (!args) {
     return value;
    }
    return value.filter(
      item => item.data.note.toLowerCase().indexOf(args.toLowerCase()) > -1
   );
  }
}
