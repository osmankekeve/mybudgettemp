import { ActionMainModel } from './../../models/action-main-model';
import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {Subscription} from 'rxjs';
import {getEncryptionKey} from '../../core/correct-library';
import { ActionService } from 'src/app/services/action.service';

@Component({
  selector: 'app-action',
  templateUrl: 'action.component.html'
})

export class ActionComponent implements OnDestroy, OnInit {
  mainList$: Subscription;
  mainList: Array<ActionMainModel>;
  @Input() recordData: any;

  constructor(protected actService: ActionService) {
  }

  ngOnInit(): void {
    this.mainList = undefined;
    if (this.recordData.tableName && this.recordData.tableName !== '' && this.recordData.primaryKey) {
      this.mainList$ = this.actService.getActions(this.recordData.tableName, this.recordData.primaryKey).subscribe((list) => {
        if (this.mainList === undefined) {
          this.mainList = [];
        }
        list.forEach((data: any) => {
          const item = data.returnData as ActionMainModel;
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
