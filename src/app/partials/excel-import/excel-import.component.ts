import {Component, OnInit, Input, Output, EventEmitter} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {ProductService} from '../../services/product.service';
import {InformationService} from '../../services/information.service';
import * as XLSX from 'xlsx';
import {Router} from '@angular/router';
import {ExcelService} from '../../services/excel-service';
import {ProductMainModel} from '../../models/product-main-model';
import {ProductUnitService} from '../../services/product-unit.service';
import {ProductUnitModel} from '../../models/product-unit-model';
import {AuthenticationService} from '../../services/authentication.service';
import {AngularFirestore} from '@angular/fire/firestore';
import {getFloat, getProductTypes, getProductTypesForImport} from '../../core/correct-library';

@Component({
  selector: 'app-excel-import',
  templateUrl: 'excel-import.component.html'
})

export class ExcelImportComponent implements OnInit {

  @Input() public inputData: any;
  @Output() passEntry: EventEmitter<any> = new EventEmitter();
  onTransaction = false;
  showImportResult = false;
  transactionProcessCount = 0;
  fileName = 'Dosya Seçiniz';
  headerTitle = '';
  module = '';
  listExcelData = [];
  listInfo = [];
  listErrorInfo = [];
  templateItems = {};
  listExcelDataKeys: any;
  productMap = new Map();
  unitMap = new Map();
  customerMap = new Map();
  stockTypeMap = new Map();

  constructor(public activeModal: NgbActiveModal, protected pService: ProductService, protected infoService: InformationService,
              protected route: Router, protected excelService: ExcelService, protected puService: ProductUnitService,
              protected db: AngularFirestore) {
  }

  async ngOnInit(): Promise<void> {
    this.module = this.route.url.replace('/', '');
    if (this.module === 'product') {
      this.headerTitle = 'Ürünler';
      this.listInfo = [
        { key: 'Sistemde ürün kodları tekil olmak zorundadır.'},
        { key: 'Ürün taban kodlarının sistemde olduğundan emin olunuz.'},
        { key: 'KDV oranı alanını tam sayı olarak giriniz.'},
        { key: 'Ürün birim adının sistem ile eşleştiğinden emin olunuz.'},
        { key: 'Ürün tipini doğru girdiğinizden emin olunuz. (Normal Ürün, Promosyon Ürün, Hizmet Ürün)'},
        { key: 'Ürün aktiflik durumunu doğru girdiğinizden emin olunuz.(Aktif, Pasif)'},
        { key: 'Ürün web ürün mü durumunu doğru girdiğinizden emin olunuz.(Evet, Hayır)'},
        { key: 'Excel de bulunan ürün kodları sistemde yoksa yeni kayıt eğer var ise mevcut kayıt güncellemesi yapılacaktır.'},
        { key: 'Güncellenecek olan kayıtların Varsayılan Birim Tipi, Ürün Tipi güncellenmez.'},
      ];
      this.templateItems = {
        'Urun Tipi': '',
        'Urun Kodu': '',
        'Urun Taban Kodu': '',
        'Urun Adi': '',
        'Urun Varsayilan Birimi': '',
        'Urun Kdv Orani': '',
        'Otv Tutarı': '',
        Agirlik: '',
        Yükseklik: '',
        'Barkod -1': '',
        'Barkod -2': '',
        'Web Ürün mü?': '',
        Aktiflik: '',
        Açıklama: ''
      };

      const a = await this.pService.getProductsForSelection(null);
      a.forEach(item => {
        this.productMap.set(item.data.productCode, item.data);
      });
      // console.log(this.productMap);

      const b = await this.puService.getItemsForSelect();
      b.forEach(item => {
        this.unitMap.set(item.unitName, item.primaryKey);
      });
      // console.log(this.unitMap);

      this.stockTypeMap = getProductTypesForImport();
    }
  }

  async fileExcelUpload(file) {
    try {
      this.onTransaction = false;
      this.showImportResult = false;
      this.listExcelData = [];
      this.listErrorInfo = [];

      /* wire up file reader */
      const target: DataTransfer = (file.target) as DataTransfer;
      this.fileName = target.files[0].name;
      if (target.files.length !== 1) {
        await this.infoService.error('Çoklu dosya seçemezsini.');
      }
      const reader: FileReader = new FileReader();
      reader.onload = (e: any) => {
        // read workbook
        const bstr: string = e.target.result;
        const wb: XLSX.WorkBook = XLSX.read(bstr, {type: 'binary'});
        // grab first sheet
        const wsname: string = wb.SheetNames[0];
        const ws: XLSX.WorkSheet = wb.Sheets[wsname];
        // save data
        this.listExcelData = (XLSX.utils.sheet_to_json(ws, {header: 1})) as any;
        this.listExcelDataKeys = Object.keys(this.listExcelData[0]);
        const check = this.checkExcelImport();
        if (check != null) {
          this.infoService.error(check);
        }

        // console.log(this.listExcelDataKeys);
        // console.log(this.listExcelData);
        // console.log(Object.keys(this.templateItems));
      };
      reader.readAsBinaryString(target.files[0]);
      file.target.value = '';
    } catch (error) {
      await this.infoService.error(error);
    }
  }

  async btnImport_Click() {
    try {
      this.onTransaction = true;
      this.showImportResult = false;
      this.transactionProcessCount = 0;
      const check = this.checkExcelImport();
      if (check != null) {
        await this.infoService.error(check);
      } else {
        const errorList = [];
        if (this.module === 'product') {
          for (let i = 1; i < this.listExcelData.length; i++) {
            const item = this.listExcelData[i];

            if (!this.stockTypeMap.has(this.checkExcelCell(item[0]))) {
              errorList.push({
                code: this.checkExcelCell(item[1]),
                name: this.checkExcelCell(item[3]),
                info: 'Lütfen ürünü tipini doğru girdiğinizden emin olunuz.'
              });

            } else if (!this.unitMap.has(this.checkExcelCell(item[4]))) {
              errorList.push({
                code: this.checkExcelCell(item[1]),
                name: this.checkExcelCell(item[3]),
                info: 'Lütfen ürünü birimini doğru girdiğinizden emin olunuz.'
              });

            } else if (this.checkExcelCell(item[11]) !== 'Evet' && this.checkExcelCell(item[11]) !== 'Hayır') {
              errorList.push({
                code: this.checkExcelCell(item[1]),
                name: this.checkExcelCell(item[3]),
                info: 'Lütfen web ürün durum bilgisini doğru girdiğinizden emin olunuz.'
              });

            }  else if (this.checkExcelCell(item[12]) !== 'Aktif' && this.checkExcelCell(item[11]) !== 'Pasif') {
              errorList.push({
                code: this.checkExcelCell(item[1]),
                name: this.checkExcelCell(item[3]),
                info: 'Lütfen aktiflik durum bilgisini doğru girdiğinizden emin olunuz.'
              });

            } else {
              this.transactionProcessCount ++;
              if (this.productMap.has(this.checkExcelCell(item[1]))) {
                const importRow = this.productMap.get(this.checkExcelCell(item[1]));

                importRow.productBaseCode = this.checkExcelCell(item[2]);
                importRow.productName = this.checkExcelCell(item[3]);
                importRow.taxRate = Math.abs(getFloat(this.checkExcelCell(item[5])));
                importRow.sctAmount = Math.abs(getFloat(this.checkExcelCell(item[6])));
                importRow.weight = Math.abs(getFloat(this.checkExcelCell(item[7])));
                importRow.height = Math.abs(getFloat(this.checkExcelCell(item[8])));
                importRow.barcode1 = this.checkExcelCell(item[9]);
                importRow.barcode2 = this.checkExcelCell(item[10]);
                importRow.isWebProduct = this.checkExcelCell(item[11]) === 'Evet';
                importRow.isActive = this.checkExcelCell(item[12]) === 'Aktif';
                importRow.description = this.checkExcelCell(item[13]);
                await this.db.collection(this.pService.tableName).doc(importRow.primaryKey).update(Object.assign({}, importRow));
                console.log('product updated :' + importRow.productCode);

              } else {
                const importRow = this.pService.clearSubModel();
                importRow.primaryKey = this.db.createId();
                importRow.stockType = this.stockTypeMap.get(this.checkExcelCell(item[0]));
                importRow.productCode = this.checkExcelCell(item[1]);
                importRow.productBaseCode = this.checkExcelCell(item[2]);
                importRow.productName = this.checkExcelCell(item[3]);
                importRow.defaultUnitCode = this.unitMap.get(this.checkExcelCell(item[4]));
                importRow.taxRate = Math.abs(getFloat(this.checkExcelCell(item[5])));
                importRow.sctAmount = Math.abs(getFloat(this.checkExcelCell(item[6])));
                importRow.weight = Math.abs( getFloat(this.checkExcelCell(item[7])));
                importRow.height = Math.abs(getFloat(this.checkExcelCell(item[8])));
                importRow.barcode1 = this.checkExcelCell(item[9]);
                importRow.barcode2 = this.checkExcelCell(item[10]);
                importRow.isWebProduct = this.checkExcelCell(item[11]) === 'Evet';
                importRow.isActive = this.checkExcelCell(item[12]) === 'Aktif';
                importRow.description = this.checkExcelCell(item[13]);
                await this.db.collection(this.pService.tableName).doc(importRow.primaryKey).set(Object.assign({}, importRow));
                console.log('product imported :' + importRow.productCode);
              }
            }
          }

          this.listErrorInfo = errorList;
        }
      }
      this.onTransaction = false;
      this.showImportResult = true;
    } catch (error) {
      this.onTransaction = false;
      this.showImportResult = true;
      await this.infoService.error(error.message);
    }
  }

  async btnDownloadTemplate_Click() {
    try {
      const a = [];
      a.push(this.templateItems);
      this.excelService.exportAsExcelFile(a, this.module + '_template_file');
    } catch (error) {
      await this.infoService.error(error);
    }
  }

  async btnDownloadFaultyRecords_Click() {
    try {
      this.excelService.exportAsExcelFile(this.listErrorInfo, this.module + '_faulty_records');
    } catch (error) {
      await this.infoService.error(error);
    }
  }

  checkExcelImport = () => {
    if (Object.keys(this.templateItems).length !== this.listExcelDataKeys.length) {
      return 'Yüklemek istediğiniz excel, sistem formatına uygun değildir.' +
        'Lütfen Taslak formatını indirerek işleminize devam ediniz.';
    } else {
      return null;
    }
  }

  checkExcelCell = (cell: any) => {
    if (cell === undefined) {
      return '';
    } else {
      return cell;
    }
  }

  checkImportResult(isShow: boolean): void {
    if (isShow) {

    } else {

    }
  }

}
