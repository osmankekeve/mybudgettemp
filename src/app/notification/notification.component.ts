import { Component, OnInit, OnDestroy } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { InformationService } from '../services/information.service';
import { AccountTransactionModel } from '../models/account-transaction-model';
import { LogModel } from '../models/log-model';
import { LogService } from '../services/log.service';
@Component({
  selector: 'app-notification',
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.css']
})
export class NotificationComponent implements OnInit, OnDestroy {
  mainList: Array<LogModel>;
  refModel: LogModel;

  constructor(public infoService: InformationService,
              public service: LogService,
              public db: AngularFirestore) { }

  ngOnInit() {
    this.populateList();
  }

  ngOnDestroy(): void {

  }

  populateList(): void {
    this.mainList = [];
    this.service.getNotifications().subscribe(list => {
      list.forEach((item: any) => {
        if (item.actionType === 'added') {
          this.mainList.push(item);
        } else if (item.actionType === 'removed') {
          this.mainList.splice(this.mainList.indexOf(this.refModel), 1);
        } else if (item.actionType === 'modified') {
          this.mainList[this.mainList.indexOf(this.refModel)] = item.data;
        } else {
          // nothing
        }
      });
    });
  }
}
