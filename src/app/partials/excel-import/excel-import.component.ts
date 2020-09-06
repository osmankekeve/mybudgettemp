import {Component, OnInit, Input, Output, EventEmitter} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {ProductService} from '../../services/product.service';
import {InformationService} from '../../services/information.service';
import * as XLSX from 'xlsx';
import {Router} from '@angular/router';
import {ExcelService} from '../../services/excel-service';
import {ProductUnitService} from '../../services/product-unit.service';
import {AngularFirestore} from '@angular/fire/firestore';
import {getFloat, getProductTypesForImport} from '../../core/correct-library';
import {ProductUnitMappingService} from '../../services/product-unit-mapping.service';
import {ProductPriceService} from '../../services/product-price.service';
import {ProductDiscountService} from '../../services/product-discount.service';

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
  excelRowCount = 0;
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
  unitMappingMap = new Map();
  priceMap = new Map();
  discountMap = new Map();

  constructor(public activeModal: NgbActiveModal, protected pService: ProductService, protected infoService: InformationService,
              protected route: Router, protected excelService: ExcelService, protected puService: ProductUnitService,
              protected db: AngularFirestore, protected pumService: ProductUnitMappingService, protected ppService: ProductPriceService,
              protected pdService: ProductDiscountService) {
  }

  async ngOnInit(): Promise<void> {
    try {
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

        const b = await this.puService.getItemsForSelect();
        b.forEach(item => {
          this.unitMap.set(item.unitName, item.primaryKey);
        });

        this.stockTypeMap = getProductTypesForImport();
      }
      if (this.module === 'product-unit') {
        this.headerTitle = 'Ürün&Birim Bağlantısı';
        this.listInfo = [
          { key: 'Ürün kodlarının sistemde olduğundan emin olunuz.'},
          { key: 'Değer alanını sayı olarak giriniz, aksi taktirde 0 olarak işlem görür.'},
          { key: 'Ürün birimi, ürün kartındaki varsayılan birim ise, içeriye 1 olarak import edilecektir.'},
        ];
        this.templateItems = {
          'Urun Kodu': '',
          'Birim Değeri': ''
        };

        const a = await this.pService.getProductsForSelection(null);
        a.forEach(item => {
          this.productMap.set(item.data.productCode, item.data);
        });
      }
      if (this.module === 'price-list') {
        this.headerTitle = 'Ürün Fiyat Aktarımı';
        this.listInfo = [
          { key: 'Ürün kodlarının sistemde olduğundan emin olunuz.'},
          { key: 'Fiyat değeri alanını sayı olarak giriniz, aksi taktirde 0 olarak işlem görür.'},
          { key: 'Ürün listede yok ise yeni kayıt, mevcut ise güncelleme işlemi yapılacaktır.'}
        ];
        this.templateItems = {
          'Urun Kodu': '',
          'Ürün Fiyatı': ''
        };

        const a = await this.pService.getProductsForSelection(null);
        a.forEach(item => {
          this.productMap.set(item.data.productCode, item.data);
        });
      }
      if (this.module === 'discount-list') {
        this.headerTitle = 'Ürün İskonto Aktarımı';
        this.listInfo = [
          { key: 'Ürün kodlarının sistemde olduğundan emin olunuz.'},
          { key: 'İskonto 1 ve İskonto 2 alanını sayı olarak giriniz, aksi taktirde 0 olarak işlem görür.'},
          { key: 'Ürün listede yok ise yeni kayıt, mevcut ise güncelleme işlemi yapılacaktır.'}
        ];
        this.templateItems = {
          'Urun Kodu': '',
          'İskonto 1': '',
          'İskonto 2': ''
        };

        const a = await this.pService.getProductsForSelection(null);
        a.forEach(item => {
          this.productMap.set(item.data.productCode, item.data);
        });
      }
    } catch (error) {
      await this.infoService.error(error);
    }
  }

  async fileExcelUpload(file) {
    try {
      this.onTransaction = false;
      this.showImportResult = false;
      this.listExcelData = [];
      this.listErrorInfo = [];

      if (this.module === 'product') {

        const a = await this.pService.getProductsForSelection(null);
        a.forEach(item => {
          this.productMap.set(item.data.productCode, item.data);
        });
      }
      if (this.module === 'product-unit') {
        const b = await this.pumService.getUnitProductsAsync(this.inputData);
        b.forEach((item: any) => {
          this.unitMappingMap.set(item.data.productPrimaryKey, item);
        });
      }
      if (this.module === 'price-list') {
        const b = await this.ppService.getProductsForListDetail(this.inputData);
        b.forEach((item: any) => {
          this.priceMap.set(item.data.productPrimaryKey, item);
        });
      }
      if (this.module === 'discount-list') {
        const b = await this.pdService.getProductsForListDetail(this.inputData);
        b.forEach((item: any) => {
          this.discountMap.set(item.data.productPrimaryKey, item);
        });
      }

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
        this.excelRowCount = this.listExcelData.length -1 ;
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
              const productCode = this.checkExcelCell(item[1]).trimLeft().trimRight();
              if (this.productMap.has(productCode)) {
                const importRow = this.productMap.get(productCode);
                importRow.productBaseCode = this.checkExcelCell(item[2]).trimLeft().trimRight();
                importRow.productName = this.checkExcelCell(item[3]).trimLeft().trimRight();
                importRow.taxRate = Math.abs(getFloat(this.checkExcelCell(item[5])));
                importRow.sctAmount = Math.abs(getFloat(this.checkExcelCell(item[6])));
                importRow.weight = Math.abs(getFloat(this.checkExcelCell(item[7])));
                importRow.height = Math.abs(getFloat(this.checkExcelCell(item[8])));
                importRow.barcode1 = this.checkExcelCell(item[9]).trimLeft().trimRight();
                importRow.barcode2 = this.checkExcelCell(item[10]).trimLeft().trimRight();
                importRow.isWebProduct = this.checkExcelCell(item[11]) === 'Evet';
                importRow.isActive = this.checkExcelCell(item[12]) === 'Aktif';
                importRow.description = this.checkExcelCell(item[13]).trimLeft().trimRight();
                await this.db.collection(this.pService.tableName).doc(importRow.primaryKey).update(Object.assign({}, importRow));
                // console.log('product updated :' + importRow.productCode);

              } else {
                const importRow = this.pService.clearSubModel();
                importRow.primaryKey = this.db.createId();
                importRow.stockType = this.stockTypeMap.get(this.checkExcelCell(item[0]));
                importRow.productCode = productCode;
                importRow.productBaseCode = this.checkExcelCell(item[2]).trimLeft().trimRight();
                importRow.productName = this.checkExcelCell(item[3]).trimLeft().trimRight();
                importRow.defaultUnitCode = this.unitMap.get(this.checkExcelCell(item[4])).trimLeft().trimRight();
                importRow.taxRate = Math.abs(getFloat(this.checkExcelCell(item[5])));
                importRow.sctAmount = Math.abs(getFloat(this.checkExcelCell(item[6])));
                importRow.weight = Math.abs( getFloat(this.checkExcelCell(item[7])));
                importRow.height = Math.abs(getFloat(this.checkExcelCell(item[8])));
                importRow.barcode1 = this.checkExcelCell(item[9]).trimLeft().trimRight();
                importRow.barcode2 = this.checkExcelCell(item[10]).trimLeft().trimRight();
                importRow.isWebProduct = this.checkExcelCell(item[11]) === 'Evet';
                importRow.isActive = this.checkExcelCell(item[12]) === 'Aktif';
                importRow.description = this.checkExcelCell(item[13]).trimLeft().trimRight();
                await this.db.collection(this.pService.tableName).doc(importRow.primaryKey).set(Object.assign({}, importRow));
                // console.log('product imported :' + importRow.productCode);
              }
            }
          }
          this.listErrorInfo = errorList;
        }
        if (this.module === 'product-unit') {
          for (let i = 1; i < this.listExcelData.length; i++) {
            const item = this.listExcelData[i];
            const productCode = this.checkExcelCell(item[0]).toString().trimLeft().trimRight();

            if (!this.productMap.has(productCode)) {
              errorList.push({
                code: productCode,
                name: '-',
                info: 'Ürün kodu sistemde mevcut değil.'
              });
            } else {
              const productPrimaryKey = this.productMap.get(productCode).primaryKey;
              this.transactionProcessCount ++;

              if (this.unitMappingMap.has(productPrimaryKey)) {
                const importRow = this.unitMappingMap.get(productPrimaryKey).data;
                if (this.inputData === this.productMap.get(productCode).defaultUnitCode) {
                  importRow.unitValue = 1;
                } else {
                  importRow.unitValue = Math.abs(getFloat(this.checkExcelCell(item[1])));
                }
                await this.db.collection(this.pumService.tableName).doc(importRow.primaryKey).update(Object.assign({}, importRow));
              } else {
                const importRow = this.pumService.clearSubModel();
                importRow.primaryKey = this.db.createId();
                importRow.productPrimaryKey = productPrimaryKey;
                importRow.unitPrimaryKey = this.inputData;
                if (importRow.unitPrimaryKey === this.productMap.get(productCode).defaultUnitCode) {
                  importRow.unitValue = 1;
                } else {
                  importRow.unitValue = Math.abs(getFloat(this.checkExcelCell(item[1])));
                }
                await this.db.collection(this.pumService.tableName).doc(importRow.primaryKey).set(Object.assign({}, importRow));
              }
            }
          }

          this.listErrorInfo = errorList;
        }
        if (this.module === 'price-list') {
          for (let i = 1; i < this.listExcelData.length; i++) {
            const item = this.listExcelData[i];
            const productCode = this.checkExcelCell(item[0]).toString().trimLeft().trimRight();

            if (!this.productMap.has(productCode)) {
              errorList.push({
                code: productCode,
                name: '-',
                info: 'Ürün kodu sistemde mevcut değil.'
              });
            } else {
              const productPrimaryKey = this.productMap.get(productCode).primaryKey;
              this.transactionProcessCount ++;

              if (this.priceMap.has(productPrimaryKey)) {
                const importRow = this.priceMap.get(productPrimaryKey).data;
                importRow.productPrice = Math.abs(getFloat(this.checkExcelCell(item[1])));
                await this.db.collection(this.ppService.tableName).doc(importRow.primaryKey).update(Object.assign({}, importRow));
              } else {
                const importRow = this.ppService.clearSubModel();
                importRow.primaryKey = this.db.createId();
                importRow.productPrimaryKey = productPrimaryKey;
                importRow.priceListPrimaryKey = this.inputData;
                importRow.productPrice = Math.abs(getFloat(this.checkExcelCell(item[1])));
                await this.db.collection(this.ppService.tableName).doc(importRow.primaryKey).set(Object.assign({}, importRow));
              }
            }
          }

          this.listErrorInfo = errorList;
        }
        if (this.module === 'discount-list') {
          for (let i = 1; i < this.listExcelData.length; i++) {
            const item = this.listExcelData[i];
            const productCode = this.checkExcelCell(item[0]).toString().trimLeft().trimRight();

            if (!this.productMap.has(productCode)) {
              errorList.push({
                code: productCode,
                name: '-',
                info: 'Ürün kodu sistemde mevcut değil.'
              });
            } else {
              const productPrimaryKey = this.productMap.get(productCode).primaryKey;
              this.transactionProcessCount ++;

              if (this.discountMap.has(productPrimaryKey)) {
                const importRow = this.discountMap.get(productPrimaryKey).data;
                importRow.discount1 = Math.abs(getFloat(this.checkExcelCell(item[1])));
                importRow.discount2 = Math.abs(getFloat(this.checkExcelCell(item[2])));
                await this.db.collection(this.pdService.tableName).doc(importRow.primaryKey).update(Object.assign({}, importRow));
              } else {
                const importRow = this.pdService.clearSubModel();
                importRow.primaryKey = this.db.createId();
                importRow.productPrimaryKey = productPrimaryKey;
                importRow.discountListPrimaryKey = this.inputData;
                importRow.discount1 = Math.abs(getFloat(this.checkExcelCell(item[1])));
                importRow.discount2 = Math.abs(getFloat(this.checkExcelCell(item[2])));
                await this.db.collection(this.pdService.tableName).doc(importRow.primaryKey).set(Object.assign({}, importRow));
              }
            }
          }

          this.listErrorInfo = errorList;
        }
      }
      this.listExcelData = [];
      this.fileName = 'Dosya Seçiniz';
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
    if (this.listExcelData.length === 0) {
      return 'Lütfen yüklemek için dosya seçiniz.';
    } else if (Object.keys(this.templateItems).length !== this.listExcelDataKeys.length) {
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
