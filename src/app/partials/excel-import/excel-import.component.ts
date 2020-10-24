import {Component, OnInit, Input, Output, EventEmitter} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {ProductService} from '../../services/product.service';
import {InformationService} from '../../services/information.service';
import * as XLSX from 'xlsx';
import {Router} from '@angular/router';
import {ExcelService} from '../../services/excel-service';
import {ProductUnitService} from '../../services/product-unit.service';
import {AngularFirestore} from '@angular/fire/firestore';
import {
  getCustomerTypes,
  getCustomerTypesForImport,
  getFloat,
  getStockTypesForImport,
  getProductTypesForImport
} from '../../core/correct-library';
import {ProductUnitMappingService} from '../../services/product-unit-mapping.service';
import {ProductPriceService} from '../../services/product-price.service';
import {ProductDiscountService} from '../../services/product-discount.service';
import {CustomerService} from '../../services/customer.service';
import {ProfileService} from '../../services/profile.service';
import {DeliveryAddressService} from '../../services/delivery-address.service';
import {DefinitionService} from '../../services/definition.service';
import {CustomerAccountService} from '../../services/customer-account.service';

@Component({
  selector: 'app-excel-import',
  templateUrl: 'excel-import.component.html'
})

export class ExcelImportComponent implements OnInit {

  @Input() public inputData: any;
  @Output() passEntry: EventEmitter<any> = new EventEmitter();
  onTransaction = false;
  isExcelReading = false;
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
  productTypeMap = new Map();
  unitMappingMap = new Map();
  priceMap = new Map();
  discountMap = new Map();
  employeeMap = new Map();
  termMap = new Map();
  paymentMap = new Map();

  constructor(public activeModal: NgbActiveModal, protected pService: ProductService, protected infoService: InformationService,
              protected route: Router, protected excelService: ExcelService, protected puService: ProductUnitService,
              protected db: AngularFirestore, protected pumService: ProductUnitMappingService, protected ppService: ProductPriceService,
              protected pdService: ProductDiscountService, protected cusService: CustomerService, protected profService: ProfileService,
              protected defService: DefinitionService, protected caService: CustomerAccountService, protected daService: DeliveryAddressService) {
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
          { key: 'Ürün stok tipini doğru girdiğinizden emin olunuz. (Normal Ürün, Promosyon Ürün, Hizmet Ürün)'},
          { key: 'Ürün tipini doğru girdiğinizden emin olunuz. (Alım, Satış, Alım-Satış)'},
          { key: 'Ürün aktiflik durumunu doğru girdiğinizden emin olunuz.(Aktif, Pasif)'},
          { key: 'Ürün web ürün mü durumunu doğru girdiğinizden emin olunuz.(Evet, Hayır)'},
          { key: 'Excel de bulunan ürün kodları sistemde yoksa yeni kayıt eğer var ise mevcut kayıt güncellemesi yapılacaktır.'},
          { key: 'Güncellenecek olan kayıtların Varsayılan Birim Tipi, Ürün Tipi güncellenmez.'},
        ];
        this.templateItems = {
          'Stok Tipi': '',
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
          Açıklama: '',
          'Ürün Tipi': ''
        };

        const b = await this.puService.getItemsForSelect();
        b.forEach(item => {
          this.unitMap.set(item.unitName, item.primaryKey);
        });

        this.stockTypeMap = getStockTypesForImport();
        this.productTypeMap = getProductTypesForImport();
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
      if (this.module === 'customer') {
        this.headerTitle = 'Müşteri Aktarımı';
        this.listInfo = [
          { key: 'Müşteri kodları referans alınacaktır.'},
          { key: 'Müşteri listede yok ise yeni kayıt, mevcut ise güncelleme işlemi yapılacaktır.'},
          { key: 'Müşteri tiplerini doğru girdiğinizden emin olunuz.\'Müşteri\', \'Tedarikçi\', \'Müşteri-Tedarikçi\''},
          { key: 'Ödeme ve Vade tiplerini doğru girdiğinizden emin olunuz.'},
          { key: 'Müşteri aktiflik durumunu doğru girdiğinizden emin olunuz.(Aktif, Pasif)'},
          { key: 'Temsilci isimlerini doğru girdiğinizden emin olunuz.'},
          { key: '\'Müşteri Tipi\', \'Müşteri Kodu\' değiştirilemez.'},
          { key: 'Yeni kayıt işlemlerinde, müşteri hesabı otomatik oluşturulur.'},
          { key: 'Yeni kayıt işlemlerinde, eğer adres bilgisi girilmiş ise, varsayılan adres olarak otomatik kayıt oluşturulur.'},
        ];
        this.templateItems = {
          'Musteri Tipi': '',
          'Musteri Kodu': '',
          'Musteri Adi': '',
          'Yetkili Kisi': '',
          'Aktif mi?': '',
          'Vergi Dairesi': '',
          'Vergi Numarasi': '',
          'Telefon 1': '',
          'Telefon 2': '',
          'Posta Kodu': '',
          'Mail Adresi': '',
          'Temsilci': '',
          'Odeme Sekli': '',
          'Vade Sekli': '',
          'Adres': ''
        };
      }
    } catch (error) {
      await this.infoService.error(error);
    }
  }

  async fileExcelUpload(file) {
    try {
      this.isExcelReading = true;
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
      if (this.module === 'customer') {
        const list = Array<string>();
        list.push('customer');
        list.push('supplier');
        list.push('customer-supplier');

        const a = await this.cusService.getCustomersMain(list);
        a.forEach(item => {
          this.customerMap.set(item.data.code, item.data);
        });

        const b = await this.profService.getMainItemsAsPromise();
        b.forEach(item => {
          this.employeeMap.set(item.data.longName, item.data.primaryKey);
        });

        const c = await this.defService.getItemsForFill('term');
        c.forEach(item => {
          this.termMap.set(item.custom1, item.primaryKey);
        });

        const d = await this.defService.getItemsForFill('payment-type');
        d.forEach(item => {
          this.paymentMap.set(item.custom1, item.primaryKey);
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
      this.isExcelReading = false;
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
            const stockType = this.checkExcelCell(item[0]).toString().trimLeft().trimRight();
            const productCode = this.checkExcelCell(item[1]).toString().trimLeft().trimRight();
            const productBaseCode = this.checkExcelCell(item[2]).toString().trimLeft().trimRight();
            const productName = this.checkExcelCell(item[3]).toString().trimLeft().trimRight();
            const defaultUnitCode = this.checkExcelCell(item[4]).toString().trimLeft().trimRight();
            const taxRate = this.checkExcelCell(item[5]).toString().trimLeft().trimRight();
            const sctAmount = this.checkExcelCell(item[6]).toString().trimLeft().trimRight();
            const weight = this.checkExcelCell(item[7]).toString().trimLeft().trimRight();
            const height = this.checkExcelCell(item[8]).toString().trimLeft().trimRight();
            const barcode1 = this.checkExcelCell(item[9]).toString().trimLeft().trimRight();
            const barcode2 = this.checkExcelCell(item[10]).toString().trimLeft().trimRight();
            const isWebProduct = this.checkExcelCell(item[11]).toString().trimLeft().trimRight();
            const isActive = this.checkExcelCell(item[12]).toString().trimLeft().trimRight();
            const description = this.checkExcelCell(item[13]).toString().trimLeft().trimRight();
            const productType = this.checkExcelCell(item[14]).toString().trimLeft().trimRight();

            if (!this.stockTypeMap.has(stockType)) {
              errorList.push({
                code: productCode,
                name: productName,
                info: 'Lütfen stok tipini doğru girdiğinizden emin olunuz.'
              });

            }
            else if (!this.productTypeMap.has(productType)) {
              errorList.push({
                code: productCode,
                name: productName,
                info: 'Lütfen ürün tipini doğru girdiğinizden emin olunuz.'
              });

            }
            else if (!this.unitMap.has(defaultUnitCode)) {
              errorList.push({
                code: productCode,
                name: productName,
                info: 'Lütfen ürünü birimini doğru girdiğinizden emin olunuz.'
              });

            }
            else if (isWebProduct !== 'Evet' && isWebProduct !== 'Hayır') {
              errorList.push({
                code: productCode,
                name: productName,
                info: 'Lütfen web ürün durum bilgisini doğru girdiğinizden emin olunuz.'
              });

            }
            else if (isActive !== 'Aktif' && isActive !== 'Pasif') {
              errorList.push({
                code: productCode,
                name: productName,
                info: 'Lütfen aktiflik durum bilgisini doğru girdiğinizden emin olunuz.'
              });

            }
            else {
              this.transactionProcessCount ++;
              if (this.productMap.has(productCode)) {
                const importRow = this.productMap.get(productCode);
                importRow.productType = this.productTypeMap.get(productType);
                importRow.productBaseCode = productBaseCode;
                importRow.productName = productName;
                importRow.taxRate = Math.abs(getFloat(taxRate));
                importRow.sctAmount = Math.abs(getFloat(sctAmount));
                importRow.weight = Math.abs(getFloat(weight));
                importRow.height = Math.abs(getFloat(height));
                importRow.barcode1 = barcode1;
                importRow.barcode2 = barcode2;
                importRow.isWebProduct = isWebProduct === 'Evet';
                importRow.isActive = isActive === 'Aktif';
                importRow.description = description;
                await this.db.collection(this.pService.tableName).doc(importRow.primaryKey).update(Object.assign({}, importRow));
                //console.log('product updated :' + importRow.productCode);

              } else {
                const importRow = this.pService.clearSubModel();
                importRow.primaryKey = this.db.createId();
                importRow.stockType = this.stockTypeMap.get(stockType);
                importRow.productType = this.productTypeMap.get(productType);
                importRow.productCode = productCode;
                importRow.productBaseCode = productBaseCode;
                importRow.productName = productName;
                importRow.defaultUnitCode = this.unitMap.get(defaultUnitCode);
                importRow.taxRate = Math.abs(getFloat(taxRate));
                importRow.sctAmount = Math.abs(getFloat(sctAmount));
                importRow.weight = Math.abs(getFloat(weight));
                importRow.height = Math.abs(getFloat(height));
                importRow.barcode1 = barcode1;
                importRow.barcode2 = barcode2;
                importRow.isWebProduct = isWebProduct === 'Evet';
                importRow.isActive = isActive === 'Aktif';
                importRow.description = description;
                await this.db.collection(this.pService.tableName).doc(importRow.primaryKey).set(Object.assign({}, importRow));
                //console.log('product imported :' + importRow.productCode);
              }
            }
          }
          this.listErrorInfo = errorList;
        }
        if (this.module === 'product-unit') {
          for (let i = 1; i < this.listExcelData.length; i++) {
            const item = this.listExcelData[i];
            const productCode = this.checkExcelCell(item[0]).toString().trimLeft().trimRight();
            const unitValue = this.checkExcelCell(item[1]).toString().trimLeft().trimRight();

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
                  importRow.unitValue = Math.abs(getFloat(unitValue));
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
                  importRow.unitValue = Math.abs(getFloat(unitValue));
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
            const productPrice = this.checkExcelCell(item[1]).toString().trimLeft().trimRight();

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
                importRow.productPrice = Math.abs(getFloat(productPrice));
                await this.db.collection(this.ppService.tableName).doc(importRow.primaryKey).update(Object.assign({}, importRow));
              } else {
                const importRow = this.ppService.clearSubModel();
                importRow.primaryKey = this.db.createId();
                importRow.productPrimaryKey = productPrimaryKey;
                importRow.priceListPrimaryKey = this.inputData;
                importRow.productPrice = Math.abs(getFloat(productPrice));
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
            const discount1 = this.checkExcelCell(item[1]).toString().trimLeft().trimRight();
            const discount2 = this.checkExcelCell(item[2]).toString().trimLeft().trimRight();

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
                importRow.discount1 = Math.abs(getFloat(discount1));
                importRow.discount2 = Math.abs(getFloat(discount2));
                await this.db.collection(this.pdService.tableName).doc(importRow.primaryKey).update(Object.assign({}, importRow));
              } else {
                const importRow = this.pdService.clearSubModel();
                importRow.primaryKey = this.db.createId();
                importRow.productPrimaryKey = productPrimaryKey;
                importRow.discountListPrimaryKey = this.inputData;
                importRow.discount1 = Math.abs(getFloat(discount1));
                importRow.discount2 = Math.abs(getFloat(discount2));
                await this.db.collection(this.pdService.tableName).doc(importRow.primaryKey).set(Object.assign({}, importRow));
              }
            }
          }

          this.listErrorInfo = errorList;
        }
        if (this.module === 'customer') {
          for (let i = 1; i < this.listExcelData.length; i++) {
            const item = this.listExcelData[i];
            const customerType = this.checkExcelCell(item[0]).toString().trimLeft().trimRight();
            const customerCode = this.checkExcelCell(item[1]).toString().trimLeft().trimRight();
            const customerName = this.checkExcelCell(item[2]).toString().trimLeft().trimRight();
            const owner = this.checkExcelCell(item[3]).toString().trimLeft().trimRight();
            const isActive = this.checkExcelCell(item[4]).toString().trimLeft().trimRight();
            const taxOffice = this.checkExcelCell(item[5]).toString().trimLeft().trimRight();
            const taxNumber = this.checkExcelCell(item[6]).toString().trimLeft().trimRight();
            const phone1 = this.checkExcelCell(item[7]).toString().trimLeft().trimRight();
            const phone2 = this.checkExcelCell(item[8]).toString().trimLeft().trimRight();
            const postCode = this.checkExcelCell(item[9]).toString().trimLeft().trimRight();
            const email = this.checkExcelCell(item[10]).toString().trimLeft().trimRight();
            const executive = this.checkExcelCell(item[11]).toString().trimLeft().trimRight();
            const payment = this.checkExcelCell(item[12]).toString().trimLeft().trimRight();
            const term = this.checkExcelCell(item[13]).toString().trimLeft().trimRight();
            const address = this.checkExcelCell(item[14]).toString().trimLeft().trimRight();
            if (!getCustomerTypesForImport().has(customerType)) {
              errorList.push({
                code: customerCode,
                name: customerName,
                info: 'Müşteri tipini doğru girdiğinizden emin olunuz.'
              });

            }
            else if (isActive !== 'Aktif' && isActive !== 'Pasif') {
              errorList.push({
                code: this.checkExcelCell(item[1]),
                name: this.checkExcelCell(item[3]),
                info: 'Lütfen aktiflik durum bilgisini doğru girdiğinizden emin olunuz.'
              });

            }
            else if (!this.employeeMap.has(executive)) {
              errorList.push({
                code: this.checkExcelCell(item[1]),
                name: this.checkExcelCell(item[3]),
                info: 'Lütfen temsilci bilgisini doğru girdiğinizden emin olunuz.'
              });

            }
            else if (!this.paymentMap.has(payment)) {
              errorList.push({
                code: this.checkExcelCell(item[1]),
                name: this.checkExcelCell(item[3]),
                info: 'Lütfen ödeme bilgisini doğru girdiğinizden emin olunuz.'
              });

            }
            else if (!this.termMap.has(term)) {
              errorList.push({
                code: this.checkExcelCell(item[1]),
                name: this.checkExcelCell(item[3]),
                info: 'Lütfen vade bilgisini doğru girdiğinizden emin olunuz.'
              });

            }
            else {
              this.transactionProcessCount ++;
              if (this.customerMap.has(customerCode)) {
                const importRow = this.customerMap.get(customerCode);
                importRow.name = customerName;
                importRow.owner = owner;
                importRow.isActive = isActive === 'Aktif';
                importRow.taxOffice = taxOffice;
                importRow.taxNumber = taxNumber;
                importRow.phone1 = phone1;
                importRow.phone2 = phone2;
                importRow.postCode = postCode;
                importRow.email = email;
                importRow.executivePrimary = this.employeeMap.get(executive);
                importRow.termKey = this.termMap.get(term);
                importRow.paymentTypeKey = this.paymentMap.get(payment);
                importRow.address = address;
                await this.db.collection(this.cusService.tableName).doc(importRow.primaryKey).update(Object.assign({}, importRow));
                console.log('updated :' + JSON.stringify(importRow));
              } else {
                const importRow = this.cusService.clearModel();
                importRow.primaryKey = this.db.createId();
                importRow.customerType = getCustomerTypesForImport().get(customerType);
                importRow.code = customerCode;
                importRow.name = customerName;
                importRow.owner = owner;
                importRow.isActive = isActive === 'Aktif';
                importRow.taxOffice = taxOffice;
                importRow.taxNumber = taxNumber;
                importRow.phone1 = phone1;
                importRow.phone2 = phone2;
                importRow.postCode = postCode;
                importRow.email = email;
                importRow.executivePrimary = this.employeeMap.get(executive);
                importRow.termKey = this.termMap.get(term);
                importRow.paymentTypeKey = this.paymentMap.get(payment);
                importRow.address = address;
                await this.cusService.setItem(this.cusService.convertMainModel(importRow), importRow.primaryKey).then(async ()=> {
                  await this.db.collection(this.cusService.tableName).doc(importRow.primaryKey).set(Object.assign({}, importRow)).then(async ()=> {
                    this.cusService.isCustomerHasAccount(importRow.primaryKey).then(result => {
                      if (!result) {
                        const accountData = this.caService.clearMainModel();
                        accountData.data.primaryKey = this.db.createId();
                        accountData.data.customerPrimaryKey = importRow.primaryKey;
                        accountData.data.name = importRow.name + ' ' + accountData.currencyTr + ' Hesabı';
                        this.caService.setItem(accountData).then(()=> {
                          this.db.collection(this.cusService.tableName).doc(importRow.primaryKey)
                            .update(Object.assign({}, { defaultAccountPrimaryKey: accountData.data.primaryKey }));
                        });
                      }
                    });
                    const daModel = this.daService.clearMainModel();
                    daModel.data.primaryKey = this.db.createId();
                    daModel.data.customerPrimaryKey = importRow.primaryKey;
                    daModel.data.addressName = 'Varsayılan Adres';
                    daModel.data.address = importRow.address;
                    if (importRow.address !== '') {
                      await this.daService.setItem(daModel, daModel.data.primaryKey);
                    }
                  });
                });
                console.log('updated :' + JSON.stringify(importRow));
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
