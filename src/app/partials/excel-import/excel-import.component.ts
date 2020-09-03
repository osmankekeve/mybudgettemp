import {Component, OnInit, Input, Output, EventEmitter} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {ProductModel} from '../../models/product-model';
import {ProductService} from '../../services/product.service';
import {ProductMainModel} from '../../models/product-main-model';
import {PriceListService} from '../../services/price-list.service';
import {InformationService} from '../../services/information.service';
import * as XLSX from 'xlsx';
import {AngularFirestore} from '@angular/fire/firestore';
import {Router} from '@angular/router';

@Component({
  selector: 'app-excel-import',
  templateUrl: 'excel-import.component.html'
})

export class ExcelImportComponent implements OnInit {

  @Input() public inputData: any;
  @Output() passEntry: EventEmitter<any> = new EventEmitter();
  fileName = 'Dosya Seçiniz';
  module = '';
  listExcelData = [];
  listExcelDataKeys: any;

  constructor(public activeModal: NgbActiveModal, protected pService: ProductService, protected infoService: InformationService,
              public route: Router) {
  }

  async ngOnInit(): Promise<void> {
    this.module = this.route.url.replace('/', '');
  }

  fileExcelUpload(file) {
    /* wire up file reader */
    const target: DataTransfer = (file.target) as DataTransfer;
    this.fileName = target.files[0].name;
    if (target.files.length !== 1) { throw new Error('Cannot use multiple files'); }
    const reader: FileReader = new FileReader();
    reader.onload = (e: any) => {
      /* read workbook */
      const bstr: string = e.target.result;
      const wb: XLSX.WorkBook = XLSX.read(bstr, {type: 'binary'});

      /* grab first sheet */
      const wsname: string = wb.SheetNames[0];
      const ws: XLSX.WorkSheet = wb.Sheets[wsname];
      /* save data */
      this.listExcelData = (XLSX.utils.sheet_to_json(ws, {header: 1})) as any;
      this.listExcelDataKeys = Object.keys(this.listExcelData[0]);
      // data.splice(0, 1);
      console.log(this.listExcelDataKeys);
      console.log(this.listExcelData);
    };
    reader.readAsBinaryString(target.files[0]);
    file.target.value = '';
  }

  async btnImport_Click() {
    try {
    } catch (error) {
      await this.infoService.error(error);
    }
  }
}
