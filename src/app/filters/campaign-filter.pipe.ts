import { Pipe, PipeTransform } from '@angular/core';
@Pipe({
  name: 'filterCampaign'
})

export class CampaignFilterPipe implements PipeTransform {

  transform(value: any, args?: any): any {
    if (!args) {
     return value;
    }
    return value.filter(
      item => item.data.title.toLowerCase().indexOf(args.toLowerCase()) > -1 ||
      item.data.code.toLowerCase().indexOf(args.toLowerCase()) > -1
   );
  }
}
