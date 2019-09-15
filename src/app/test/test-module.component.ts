import { Component, OnInit, OnDestroy } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { InformationService } from '../services/information.service';
import { Observable } from 'rxjs';
import { TestService } from '../services/test.service';
@Component({
  selector: 'app-test-module',
  templateUrl: './test-module.component.html',
  styleUrls: ['./test-module.component.css']
})
export class TestModuleComponent implements OnInit, OnDestroy {
  selectedRecord: any = '';
  mainList$: Observable<any[]>;
  constructor(public infoService: InformationService,
              public service: TestService,
              public db: AngularFirestore) { }

  ngOnInit() {
    this.selectedRecord = undefined;
    this.mainList$ = this.service.getItems();
    this.mainList$.subscribe(list => {
      console.log(list);
    });
  }

  ngOnDestroy(): void {

  }

  onClickShowReport(data: any): void {
    this.selectedRecord = data;
  }

  btnSave_Click(): void {
    const newId = this.db.createId();
    this.db.collection('tblTest').add({data: this.selectedRecord}).then(() => {
      this.infoService.success('kayıt başarılı');
      this.selectedRecord = '';
    }).catch(err => this.infoService.error(err));
  }

  btnCancel_Click(): void {
    this.selectedRecord = undefined;
  }

  btnRemove_Click(): void {
    this.selectedRecord = undefined;
  }
}
