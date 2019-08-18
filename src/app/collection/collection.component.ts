import { Component, OnInit, OnDestroy } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { Observable } from 'rxjs/internal/Observable';
import { CollectionModel } from '../models/collection-model';
import { CollectionService } from '../services/collection.service';

@Component({
  selector: 'app-collection',
  templateUrl: './collection.component.html',
  styleUrls: ['./collection.component.css']
})
export class CollectionComponent implements OnInit {
  mainList$: Observable<CollectionModel[]>;
  collection: AngularFirestoreCollection<CollectionModel>;
  selectedRecord: CollectionModel;
  selectedRecordSubItems: {
    customerName: string,
    typeTr: string
  };

  constructor(public service: CollectionService, public db: AngularFirestore) { }

  ngOnInit() {
    this.populateList();
    this.selectedRecord = undefined;
  }

  // tslint:disable-next-line: use-lifecycle-interface
  ngOnDestroy(): void {
    this.mainList$.subscribe();
  }

  populateList(): void {
    this.mainList$ = undefined;
    this.mainList$ = this.service.getItems();
  }

  showSelectedRecord(record: any): void {
    this.selectedRecord = record.data as CollectionModel;
    this.selectedRecordSubItems = {
      customerName : record.customerName,
      typeTr : this.selectedRecord.type
    };
  }

  btnReturnList_Click(): void {
    this.selectedRecord = undefined;
  }

  btnNew_Click(): void {
    this.clearSelectedRecord();
  }

  btnSave_Click(): void {
    if (this.selectedRecord.primaryKey === undefined) {
      this.selectedRecord.primaryKey = '';
      this.service.addItem(this.selectedRecord);
    } else {
      this.service.updateItem(this.selectedRecord);
    }
    this.selectedRecord = undefined;
  }

  btnRemove_Click(): void {
    this.service.removeItem(this.selectedRecord);
    this.selectedRecord = undefined;
  }

  clearSelectedRecord(): void {
    this.selectedRecord = {primaryKey: undefined, customerCode: '', receiptNo: '', type: '', description: '', amount: 0};
  }

}
