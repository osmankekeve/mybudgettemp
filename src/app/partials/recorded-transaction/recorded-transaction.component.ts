
import { ShortCutRecordService } from '../../services/short-cut.service';
import {Component, OnInit, Input, Output, EventEmitter} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {ProductMainModel} from '../../models/product-main-model';
import {InformationService} from '../../services/information.service';
import {Router} from '@angular/router';
import { ShortCutRecordMainModel } from 'src/app/models/short-cut-main-model';

@Component({
  selector: 'app-recorded-transaction',
  templateUrl: 'recorded-transaction.component.html'
})

export class RecordedTransactionComponent implements OnInit {

  @Input() public record: ShortCutRecordMainModel;
  @Input() public module: String;
  @Output() passEntry: EventEmitter<any> = new EventEmitter();
  mainList: Array<ShortCutRecordMainModel>;
  searchText: '';

  constructor(public activeModal: NgbActiveModal, protected service: ShortCutRecordService,
              protected infoService: InformationService) {
  }

  async ngOnInit(): Promise<void> {
    this.service.getMainItemsBetweenDatesAsPromise(this.module).then((values: any) => {
      this.mainList = [];
      const returnData = values as Array<ShortCutRecordMainModel>;
      returnData.forEach(value => {
        this.mainList.push(value);
      });
    });
  }

  markSelected(selectedRecord: ShortCutRecordMainModel) {
    this.record = selectedRecord;
  }

  async btnSelect_Click() {
    try {
      this.passEntry.emit(this.record);
      this.activeModal.close(this.record);
    } catch (error) {
      await this.infoService.error(error);
    }
  }

  async btnRemove_Click() {
    try {
      this.service.removeItem(this.record.data).then(()=> {
        this.infoService.success("Kayıt başarıyla kaldırıldı.");
        this.record = null;
        this.ngOnInit();
      });
    } catch (error) {
      await this.infoService.error(error);
    }
  }
}
