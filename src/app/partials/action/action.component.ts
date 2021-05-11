import { LogService } from './../../services/log.service';
import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {Subscription} from 'rxjs';
import { LogMainModel } from 'src/app/models/log-main-model';

@Component({
  selector: 'app-action',
  templateUrl: 'action.component.html'
})

export class ActionComponent implements OnDestroy, OnInit {
  mainList$: Subscription;
  mainList: Array<LogMainModel>;
  @Input() recordData: any;

  constructor(protected actService: LogService) {
  }

  ngOnInit(): void {
    this.mainList = undefined;
    if (this.recordData.tableName && this.recordData.tableName !== '' && this.recordData.primaryKey) {
      this.mainList$ = this.actService.getLogs(this.recordData.primaryKey).subscribe((list) => {
        if (this.mainList === undefined) {
          this.mainList = [];
        }
        list.forEach((data: any) => {
          const item = data.returnData as LogMainModel;
          if (item.actionType === 'added') {
            this.mainList.push(item);
          }
        });
      });
      setTimeout(() => {
        if (this.mainList === undefined) {
          this.mainList = [];
        }
      }, 1000);
    } else {
      setTimeout(() => {
        if (this.mainList === undefined) {
          this.mainList = [];
        }
      }, 1000);
    }
  }

  ngOnDestroy(): void {
    if (this.mainList$ !== undefined) {
      this.mainList$.unsubscribe();
    }
  }

}
