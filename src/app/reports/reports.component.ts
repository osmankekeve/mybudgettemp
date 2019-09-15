import { Component, OnInit, OnDestroy } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { InformationService } from '../services/information.service';
@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css']
})
export class ReportsComponent implements OnInit, OnDestroy {
  selectedReport: any;
  constructor(public infoService: InformationService,
              public db: AngularFirestore) { }

  ngOnInit() {
    this.selectedReport = undefined;
  }

  ngOnDestroy(): void {

  }

  onClickShowReport(data: any): void {
    this.selectedReport = data;
    if (data === 'accountReport') {

    } else {
      //
    }
  }

  btnReturnList_Click(): void {
    this.selectedReport = undefined;
  }
}
