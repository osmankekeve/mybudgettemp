import {Component, OnInit} from '@angular/core';
import {AngularFirestore} from '@angular/fire/firestore';
import {Observable} from 'rxjs/internal/Observable';
import {CustomerService} from '../../app/services/customer.service';
import {PurchaseInvoiceService} from '../services/purchase-invoice.service';
import {SalesInvoiceService} from '../services/sales-invoice.service';
import {CollectionService} from '../services/collection.service';
import {PaymentService} from '../services/payment.service';
import {InformationService} from '../services/information.service';
import {AccountTransactionModel} from '../models/account-transaction-model';
import {AccountTransactionService} from '../services/account-transaction.service';
import {CashDeskService} from '../services/cash-desk.service';
import {AccountVoucherService} from '../services/account-voucher.service';
import {AuthenticationService} from '../services/authentication.service';
import {ExcelService} from '../services/excel-service';
import {FileUploadService} from '../services/file-upload.service';
import {VisitMainModel} from '../models/visit-main-model';
import {VisitService} from '../services/visit.service';
import {Router, ActivatedRoute} from '@angular/router';
import { currencyFormat, getDateForInput, getEncryptionKey, getFloat, getInputDataForInsert, getTodayForInput, moneyFormat } from '../core/correct-library';
import * as CryptoJS from 'crypto-js';
import 'rxjs/add/operator/filter';
import {CustomerTargetMainModel} from '../models/customer-target-main-model';
import {CustomerTargetService} from '../services/customer-target.service';
import {SettingService} from '../services/setting.service';
import {AccountVoucherMainModel} from '../models/account-voucher-main-model';
import {CollectionMainModel} from '../models/collection-main-model';
import {SalesInvoiceMainModel} from '../models/sales-invoice-main-model';
import {PaymentMainModel} from '../models/payment-main-model';
import {PurchaseInvoiceMainModel} from '../models/purchase-invoice-main-model';
import {CashDeskMainModel} from '../models/cash-desk-main-model';
import {MailMainModel} from '../models/mail-main-model';
import {MailService} from '../services/mail.service';
import {ReportService} from '../services/report.service';
import {ProfileMainModel} from '../models/profile-main-model';
import {ProfileService} from '../services/profile.service';
import {CustomerMainModel} from '../models/customer-main-model';
import {CustomerAccountModel} from '../models/customer-account-model';
import {CustomerAccountService} from '../services/customer-account.service';
import {GlobalService} from '../services/global.service';
import {RouterModel} from '../models/router-model';
import {FileMainModel} from '../models/file-main-model';
import {GlobalUploadService} from '../services/global-upload.service';
import {DeliveryAddressMainModel} from '../models/delivery-address-main-model';
import {DeliveryAddressService} from '../services/delivery-address.service';
import {DefinitionModel} from '../models/definition-model';
import {DefinitionService} from '../services/definition.service';
import {ExcelImportComponent} from '../partials/excel-import/excel-import.component';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {AccountTransactionMainModel} from '../models/account-transaction-main-model';
import { PurchaseInvoiceModel } from '../models/purchase-invoice-model';
import * as Chart from 'chart.js';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-customer',
  templateUrl: './customer.component.html',
  styleUrls: ['./customer.component.css']
})

export class CustomerComponent implements OnInit {
  mainList: Array<CustomerMainModel>;
  selectedCustomer: CustomerMainModel;
  newCollection: CollectionMainModel;
  newPayment: PaymentMainModel;
  newVoucher: AccountVoucherMainModel;
  newDeliveryAddress: DeliveryAddressMainModel;

  accountList$: Observable<CustomerAccountModel[]>;
  purchaseInvoiceList$: Observable<PurchaseInvoiceMainModel[]>;
  purchaseInvoiceAmount: any;
  siAmount: any;
  colAmount: any;
  payAmount: any;
  voucherAmount: any;
  totalAmount: any;
  openedPanel: string;
  searchText: any;
  transactionList$: Observable<AccountTransactionModel[]>;
  cashDeskList$: Observable<CashDeskMainModel[]>;
  executiveList$: Observable<ProfileMainModel[]>;
  transactionList: Array<AccountTransactionMainModel>;
  deliveryAddressList: Array<DeliveryAddressMainModel>;
  totalValues = 0;
  BarChart: any;
  filesList: Array<FileMainModel>;
  visitList: Array<VisitMainModel>;
  targetList$: Observable<CustomerTargetMainModel[]>;
  mailList$: Observable<MailMainModel[]>;
  termList: Array<DefinitionModel>;
  paymentList: Array<DefinitionModel>;
  encryptSecretKey: string = getEncryptionKey();
  isMainFilterOpened = false;
  isActive = true;
  recordDate: any;
  onTransaction = false;

  buyingChart: any;
  purchaseInvoiceList: any;
  sellingChart: any;
  salesInvoiceList: any;

  constructor(protected db: AngularFirestore, protected service: CustomerService, protected piService: PurchaseInvoiceService,
              protected siService: SalesInvoiceService, protected colService: CollectionService, protected infoService: InformationService,
              protected cdService: CashDeskService, protected avService: AccountVoucherService, protected toastService: ToastService,
              protected authService: AuthenticationService, protected modalService: NgbModal,
              protected excelService: ExcelService, protected fuService: FileUploadService, protected vService: VisitService,
              protected router: ActivatedRoute, protected ctService: CustomerTargetService, protected sService: SettingService,
              protected payService: PaymentService, protected atService: AccountTransactionService, protected route: Router,
              protected rService: ReportService, protected proService: ProfileService, protected accService: CustomerAccountService,
              protected mailService: MailService, protected globService: GlobalService, protected gfuService: GlobalUploadService,
              protected daService: DeliveryAddressService, protected defService: DefinitionService) {
  }

  async ngOnInit() {
    this.openedPanel = 'dashboard';
    this.populateCustomerList();
    this.populateTermList();
    this.populatePaymentTypeList();
    this.cashDeskList$ = this.cdService.getMainItems();
    this.executiveList$ = this.proService.getMainItems();
    this.selectedCustomer = undefined;
    if (this.router.snapshot.paramMap.get('paramItem') !== null) {
      const bytes = await CryptoJS.AES.decrypt(this.router.snapshot.paramMap.get('paramItem'), this.encryptSecretKey);
      const paramItem = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
      if (paramItem) {
        this.showSelectedCustomer(paramItem);
      }
    }
  }

  async generateModule(isReload: boolean, primaryKey: string, error: any, info: any): Promise<void> {
    if (error === null) {
      this.toastService.success(info !== null ? info : 'Belirtilmeyen Bilgi');
      if (isReload) {
        this.service.getCustomer(primaryKey)
          .then(item => {
            this.showSelectedCustomer(item);
          })
          .catch(reason => {
            this.finishProcess(reason, null);
          });
      } else {
        this.generateCharts();
        this.clearSelectedCustomer();
        this.selectedCustomer = undefined;
      }
    } else {
      await this.infoService.error(error.message !== undefined ? error.message : error);
    }
    this.onTransaction = false;
  }

  generateCharts(): void {

  }

  populateCustomerList(): void {
    this.openedPanel = 'dashboard';
    this.mainList = undefined;
    this.service.getMainItems(this.isActive).subscribe(list => {
      if (this.mainList === undefined) {
        this.mainList = [];
      }
      list.forEach((item: any) => {
        const data = item.returnData as CustomerMainModel;
        if (data.actionType === 'added') {
          this.mainList.push(data);
        }
        if (data.actionType === 'removed') {
          for (let i = 0; i < this.mainList.length; i++) {
            if (data.data.primaryKey === this.mainList[i].data.primaryKey) {
              this.mainList.splice(i, 1);
              break;
            }
          }
        }
        if (data.actionType === 'modified') {
          for (let i = 0; i < this.mainList.length; i++) {
            if (data.data.primaryKey === this.mainList[i].data.primaryKey) {
              this.mainList[i] = data;
              break;
            }
          }
        }
      });
    });
    setTimeout(() => {
      if (this.mainList === undefined) {
        this.mainList = [];
      }
    }, 1000);
  }

  populateTermList(): void {
    Promise.all([this.defService.getItemsForFill('term')]).then((values: any) => {
      this.termList = [];
      if (values[0] !== null) {
        const returnData = values[0] as Array<DefinitionModel>;
        returnData.forEach(value => {
          this.termList.push(value);
        });
      }
    });
  }

  populatePaymentTypeList(): void {
    Promise.all([this.defService.getItemsForFill('payment-type')]).then((values: any) => {
      this.paymentList = [];
      if (values[0] !== null) {
        const returnData = values[0] as Array<DefinitionModel>;
        returnData.forEach(value => {
          this.paymentList.push(value);
        });
      }
    });
  }

  showSelectedCustomer(customer: any): void {
    this.selectedCustomer = customer as CustomerMainModel;
    this.accountList$ = this.accService.getAllItems(this.selectedCustomer.data.primaryKey);

    this.totalAmount = 0;
    this.siAmount = 0;
    this.colAmount = 0;
    this.payAmount = 0;
    this.voucherAmount = 0;
    this.purchaseInvoiceAmount = 0;

    this.atService.getMainItems(null, null, this.selectedCustomer.data.primaryKey, 'customer')
      .subscribe(list => {
      list.forEach((data: any) => {
        const item = data.returnData as AccountTransactionMainModel;
        if (item.data.transactionType === 'salesInvoice') {
          if (item.data.transactionSubType.startsWith('cancel')) {
            this.siAmount -= getFloat(Math.abs(item.data.amount));
          } else {
            this.siAmount += getFloat(Math.abs(item.data.amount));
          }
        }
        if (item.data.transactionType === 'collection') {
          if (item.data.transactionSubType.startsWith('cancel')) {
            this.colAmount -= getFloat(Math.abs(item.data.amount));
          } else {
            this.colAmount += getFloat(Math.abs(item.data.amount));
          }
        }
        if (item.data.transactionType === 'purchaseInvoice') {
          this.purchaseInvoiceAmount += getFloat(Math.abs(item.data.amount));
        }
        if (item.data.transactionType === 'payment') {
          if (item.data.transactionSubType.startsWith('cancel')) {
            this.payAmount -= getFloat(Math.abs(item.data.amount));
          } else {
            this.payAmount += getFloat(Math.abs(item.data.amount));
          }
        }
        if (item.data.transactionType === 'accountVoucher') {
          this.voucherAmount += getFloat(Math.abs(item.data.amount));
        }
        this.totalAmount += getFloat(item.data.amount);
      });
    });

    this.mailList$ = undefined;
    this.mailList$ = this.mailService.getCustomerItems(this.selectedCustomer.data.primaryKey);
    this.gerenateDashboardChart();
  }

  showSelectedDeliveryAddressRecord(item: any): void {
    this.newDeliveryAddress = item as DeliveryAddressMainModel;
  }

  async gerenateDashboardChart(): Promise<void> {
    try {
      const dateList = [];
      this.purchaseInvoiceList = undefined;
      Promise.all([this.service.getCustomerPurchaseInvoiceChartData(this.selectedCustomer.data.primaryKey)])
        .then((values: any) => {
          if (values[0] !== null) {
            this.purchaseInvoiceList = [];
            const returnData = values[0] as Array<PurchaseInvoiceModel>;
            returnData.forEach(item => {
              const date = new Date(item.insertDate).toLocaleDateString('en-us');
              dateList.push(date);
              this.purchaseInvoiceList.push(item.totalPriceWithTax);
            });
          }
        })
        .finally(() => {
          this.buyingChart = new Chart('buyingChart', {
            type: 'line', // bar, pie, doughnut
            data: {
              labels: dateList,
              datasets: [{
                label: '# of Votes',
                fill: false,
                data: this.purchaseInvoiceList,
                borderColor: '#bf4e6a',
                backgroundColor: '#bf4e6a',
                pointBackgroundColor: '#ffaa15',
                pointBorderColor: '#ffaa15',
                pointHoverBackgroundColor: '#ffaa15',
                pointHoverBorderColor: '#ffaa15'
              }]
            },
            options: {
              title: {
                text: 'Alım Cari Hareketler',
                display: true
              },
              scales: {
                yAxes: [{
                  ticks: {
                    callback: (value, index, values) => {
                      if (Number(value) >= 1000) {
                        return '₺' + Number(value).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                      } else {
                        return '₺' + Number(value).toFixed(2);
                      }
                    }
                  }
                }]
              },
              tooltips: {
                callbacks: {
                  label(tooltipItem, data) {
                    return '₺' + Number(tooltipItem.yLabel).toFixed(2).replace(/./g, (c, i, a) => {
                      return i > 0 && c !== '.' && (a.length - i) % 3 === 0 ? ',' + c : c;
                    });
                  }
                }
              },
            },
          });
        });
  
      const dateList2 = [];
      // #ffaa15, #bf4e6a
      this.salesInvoiceList = undefined;
      Promise.all([this.service.getCustomerSalesInvoiceChartData(this.selectedCustomer.data.primaryKey)])
          .then((values: any) => {
            if (values[0] !== null) {
              this.salesInvoiceList = [];
              const returnData = values[0] as Array<PurchaseInvoiceModel>;
              returnData.forEach(item => {
                const date = new Date(item.insertDate).toLocaleDateString('en-us');
                dateList2.push(date);
                this.salesInvoiceList.push(item.totalPriceWithTax);
              });
            }
          })
          .finally(() => {
            this.sellingChart = new Chart('sellingChart', {
              type: 'line', // bar, pie, doughnut
              data: {
                labels: dateList2,
                datasets: [{
                  label: '# of Votes',
                  fill: false,
                  data: this.salesInvoiceList,
                  borderColor: '#B9D6F2',
                  backgroundColor: '#B9D6F2',
                  pointBackgroundColor: '#006DAA',
                  pointBorderColor: '#006DAA',
                  pointHoverBackgroundColor: '#006DAA',
                  pointHoverBorderColor: '#006DAA',
                }]
              },
              options: {
                title: {
                  text: 'Satış Cari Hareketler',
                  display: true
                },
                scales: {
                  yAxes: [{
                    ticks: {
                      callback: (value, index, values) => {
                        if (Number(value) >= 1000) {
                          return '₺' + Number(value).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                        } else {
                          return '₺' + Number(value).toFixed(2);
                        }
                      }
                    }
                  }]
                },
                tooltips: {
                  callbacks: {
                    label(tooltipItem, data) {
                      return '₺' + Number(tooltipItem.yLabel).toFixed(2).replace(/./g, (c, i, a) => {
                        return i > 0 && c !== '.' && (a.length - i) % 3 === 0 ? ',' + c : c;
                      });
                    }
                  }
                },
              },
            });
          });

    } catch (error) {
      await this.toastService.error(error);
    }
  }

  async btnReturnList_Click(): Promise<void> {
    try {
      this.selectedCustomer = undefined;
      await this.route.navigate(['customer', {}]);
    } catch (error) {
      await this.infoService.error(error);
    }
  }

  async btnNew_Click(): Promise<void> {
    try {
      this.clearSelectedCustomer();
      const customerCodeData = await this.sService.getCustomerCode();
      if (customerCodeData !== null) {
        this.selectedCustomer.data.code = customerCodeData;
      }
    } catch (error) {
      await this.infoService.error(error);
    }
  }

  async btnSave_Click(): Promise<void> {
    try {
      this.onTransaction = true;
      Promise.all([this.service.checkForSave(this.selectedCustomer)])
        .then(async (values: any) => {
          if (this.selectedCustomer.data.primaryKey === null) {
            this.selectedCustomer.data.primaryKey = this.db.createId();
            await this.service.setItem(this.selectedCustomer, this.selectedCustomer.data.primaryKey)
              .then(() => {
                this.generateModule(true, this.selectedCustomer.data.primaryKey, null, 'Kayıt başarıyla kaydedildi.');
                this.openedPanel = 'dashboard';
              })
              .catch(async (error) => {
                await this.finishProcess(error, null);
              });
          } else {
            this.service.updateItem(this.selectedCustomer)
              .then(() => {
                this.generateModule(true, this.selectedCustomer.data.primaryKey, null, 'Kayıt başarıyla güncellendi.');
              })
              .catch(async (error) => {
                await this.finishProcess(error, null);
              });
          }
        })
        .catch(async (error) => {
          await this.finishProcess(error, null);
        });
    } catch (error) {
      await this.finishProcess(error, null);
    }
  }

  async btnRemove_Click(): Promise<void> {
    try {
      this.onTransaction = true;
      Promise.all([this.service.checkForRemove(this.selectedCustomer)])
        .then(async (values: any) => {
          await this.service.removeItem(this.selectedCustomer)
            .then(() => {
              this.finishProcess(null, 'Kayıt başarıyla kaldırıldı.');
            })
            .catch(async (error) => {
              await this.finishProcess(error, null);
            });
        })
        .catch(async (error) => {
          await this.finishProcess(error, null);
        });
    } catch (error) {
      await this.finishProcess(error, null);
    }
  }

  async btnSaveCollection_Click(): Promise<void> {
    try {
      this.onTransaction = true;
      Promise.all([this.colService.checkForSave(this.newCollection)])
        .then(async (values: any) => {
          if (this.newCollection.data.primaryKey === null) {
            this.newCollection.data.primaryKey = this.db.createId();
            this.newCollection.data.recordDate = getInputDataForInsert(this.recordDate);
            this.newCollection.data.insertDate = Date.now();
            await this.colService.setItem(this.newCollection, this.newCollection.data.primaryKey)
              .then(async () => {
                await this.finishSubProcess(null, 'Kayıt başarıyla tamamlandı.');
              })
              .catch(async (error) => {
                await this.finishProcess(error, null);
              })
              .finally(() => {
                this.clearNewCollection();
              });
          }
        })
        .catch(async (error) => {
          await this.finishProcess(error, null);
        });
    } catch (error) {
      await this.finishProcess(error, null);
    }
  }

  async btnSavePayment_Click(): Promise<void> {
    try {
      this.onTransaction = true;
      Promise.all([this.payService.checkForSave(this.newPayment)])
        .then(async (values: any) => {
          if (this.newPayment.data.primaryKey === null) {
            this.newPayment.data.primaryKey = this.db.createId();
            this.newPayment.data.recordDate = getInputDataForInsert(this.recordDate);
            this.newPayment.data.insertDate = Date.now();
            await this.payService.setItem(this.newPayment, this.newPayment.data.primaryKey)
              .then(async () => {
                await this.finishSubProcess(null, 'Kayıt başarıyla tamamlandı.');
              })
              .catch(async (error) => {
                await this.finishProcess(error, null);
              })
              .finally(() => {
                this.clearNewPayment();
              });
          }
        })
        .catch(async (error) => {
          await this.finishProcess(error, null);
        });
    } catch (error) {
      await this.finishProcess(error, null);
    }
  }

  async btnSaveVoucher_Click(): Promise<void> {
    try {
      this.onTransaction = true;
      Promise.all([this.avService.checkForSave(this.newVoucher)])
        .then(async (values: any) => {
          if (this.newVoucher.data.primaryKey === null) {
            this.newVoucher.data.primaryKey = this.db.createId();
            this.newVoucher.data.recordDate = getInputDataForInsert(this.recordDate);
            this.newVoucher.data.insertDate = Date.now();
            await this.avService.setItem(this.newVoucher, this.newVoucher.data.primaryKey)
              .then(async () => {
                await this.finishSubProcess(null, 'Kayıt başarıyla tamamlandı.');
              })
              .catch(async (error) => {
                await this.finishProcess(error, null);
              })
              .finally(() => {
                this.clearNewVoucher();
              });
          }
        })
        .catch(async (error) => {
          await this.finishProcess(error, null);
        });
    } catch (error) {
      await this.finishProcess(error, null);
    }
  }

  async btnNewDeliveryAddress_Click(): Promise<void> {
    try {
      await this.clearDeliveryAddress();
    } catch (error) {
      await this.finishProcess(error, null);
    }
  }

  async btnSaveDeliveryAddress_Click(): Promise<void> {
    try {
      this.onTransaction = true;
      Promise.all([this.daService.checkForSave(this.newDeliveryAddress)])
        .then(async (values: any) => {
          if (this.newDeliveryAddress.data.primaryKey === null) {
            this.newDeliveryAddress.data.primaryKey = this.db.createId();
            this.newDeliveryAddress.data.insertDate = Date.now();
            await this.daService.setItem(this.newDeliveryAddress, this.newDeliveryAddress.data.primaryKey)
              .then(async () => {
                await this.finishSubProcess(null, 'Kayıt başarıyla tamamlandı.');
              })
              .catch(async (error) => {
                await this.finishProcess(error, null);
              })
              .finally(() => {
                this.clearDeliveryAddress();
              });
          } else {
            await this.daService.updateItem(this.newDeliveryAddress)
              .then(() => {
                this.finishSubProcess(null, 'Hatırlatma başarıyla güncellendi.');
              })
              .catch((error) => {
                this.finishProcess(error, null);
              })
              .finally(() => {
                this.clearDeliveryAddress();
              });
          }
        })
        .catch(async (error) => {
          await this.finishProcess(error, null);
        });
    } catch (error) {
      await this.finishProcess(error, null);
    }
  }

  async btnRemoveDeliveryAddress_Click(): Promise<void> {
    try {
      this.onTransaction = true;
      Promise.all([this.daService.checkForRemove(this.newDeliveryAddress)])
        .then(async (values: any) => {
          await this.daService.removeItem(this.newDeliveryAddress)
            .then(async () => {
              await this.finishSubProcess(null, 'Kayıt başarıyla Kaldırıldı.');
            })
            .catch((error) => {
              this.finishProcess(error, null);
            })
            .finally(() => {
              this.clearDeliveryAddress();
            });
        })
        .catch((error) => {
          this.finishProcess(error, null);
        });
    } catch (error) {
      await this.finishProcess(error, null);
    }
  }

  async btnShowJsonData_Click(): Promise<void> {
    try {
      await this.infoService.showJsonData(JSON.stringify(this.selectedCustomer, null, 2));
    } catch (error) {
      await this.infoService.error(error);
    }
  }

  async btnExcelImport_Click(): Promise<void> {
    try {
      const modalRef = this.modalService.open(ExcelImportComponent, {size: 'lg'});
      modalRef.result.then((result: any) => {
        if (result) {
          console.log(result);
        }
      }, () => {});
    } catch (error) {
      await this.infoService.error(error);
    }
  }

  btnExportToExcel_Click(): void {
    try {
      if (this.mainList.length > 0) {
        this.excelService.exportToExcel(this.mainList, 'customer');
      } else {
        this.infoService.error('Aktarılacak kayıt bulunamadı.');
      }
    } catch (error) {
      this.infoService.error(error);
    }
  }

  btnFileUpload_Click(): void {
    try {
      this.gfuService.showModal(
        this.selectedCustomer.data.primaryKey,
        'customer',
        CryptoJS.AES.encrypt(JSON.stringify(this.selectedCustomer), this.encryptSecretKey).toString());
    } catch (error) {
      this.infoService.error(error);
    }
  }

  btnMainFilter_Click(): void {
    try {
      this.populateCustomerList();
    } catch (error) {
      this.infoService.error(error);
    }
  }

  async btnFix_Click(): Promise<void> {
    this.service.getMainItems(null).subscribe(list => {
      if (this.mainList === undefined) {
        this.mainList = [];
      }
      list.forEach((item: any) => {
        const data = item.returnData as CustomerMainModel;
        data.data.customerType = 'supplier';
        this.service.updateItem(data);
      });
    });
  }

  async btnShowMainFiler_Click(): Promise<void> {
    try {
      if (this.isMainFilterOpened === true) {
        this.isMainFilterOpened = false;
      } else {
        this.isMainFilterOpened = true;
      }
      this.clearMainFiler();
    } catch (error) {
      await this.infoService.error(error);
    }
  }

  async btnOpenSubPanel_Click(panel: string): Promise<void> {
    try {
      this.openedPanel = panel;
      if (this.selectedCustomer.data.primaryKey && this.openedPanel !== 'accountSummary' && this.openedPanel !== 'target') {
        this.transactionList$ = this.atService.getCustomerTransactionItems(this.selectedCustomer.data.primaryKey, panel);
      }
      if (this.openedPanel === 'salesInvoice') {
      }
      if (this.openedPanel === 'collection') {
        await this.clearNewCollection();
      }
      if (this.openedPanel === 'purchaseInvoice') {
      }
      if (this.openedPanel === 'payment') {
        await this.clearNewPayment();
      }
      if (this.openedPanel === 'accountVoucher') {
        await this.clearNewVoucher();
      }
      if (this.openedPanel === 'edit') {

      }
      if (this.openedPanel === 'target') {
        this.targetList$ = undefined;
        this.targetList$ = this.ctService.getMainItemsWithCustomerPrimaryKey(this.selectedCustomer.data.primaryKey);
      }
      if (this.openedPanel === 'accountSummary') {
        this.totalValues = 0;

        this.atService.getMainItems(null, null, this.selectedCustomer.data.primaryKey, 'customer')
          .subscribe(list => {
            this.transactionList = [];
            list.forEach((data: any) => {
              const item = data.returnData as AccountTransactionMainModel;
              this.transactionList.push(item);
              this.totalValues += item.data.amount;
            });
          });
      }
      if (this.openedPanel === 'dashboard') {
        if (!this.selectedCustomer.data.primaryKey) {
          await this.btnReturnList_Click();
        }
      }
      if (this.openedPanel === 'fileUpload') {
        this.filesList = undefined;
        this.fuService.getMainItemsWithPrimaryKey(this.selectedCustomer.data.primaryKey)
          .subscribe(list => {
            if (this.filesList === undefined) {
              this.filesList = [];
            }
            list.forEach((data: any) => {
              const item = data.returnData as FileMainModel;
              if (item.actionType === 'added') {
                this.filesList.push(item);
              }
              if (item.actionType === 'removed') {
                for (let i = 0; i < this.filesList.length; i++) {
                  if (item.data.primaryKey === this.filesList[i].data.primaryKey) {
                    this.filesList.splice(i, 1);
                  }
                }
              }
            });
          });
        setTimeout(() => {
          if (this.filesList === undefined) {
            this.filesList = [];
          }
        }, 1000);
      }
      if (this.openedPanel === 'visit') {
        this.visitList = undefined;
        this.vService.getMainItemsWithCustomerPrimaryKey(this.selectedCustomer.data.primaryKey)
          .subscribe(list => {
            if (this.visitList === undefined) {
              this.visitList = [];
            }
            list.forEach((data: any) => {
              const item = data.returnData as VisitMainModel;
              if (item.actionType === 'added') {
                this.visitList.push(item);
              }
              if (item.actionType === 'removed') {
                for (let i = 0; i < this.visitList.length; i++) {
                  if (item.visit.primaryKey === this.visitList[i].visit.primaryKey) {
                    this.visitList.splice(i, 1);
                  }
                }
              }
              if (item.actionType === 'modified') {
                for (let i = 0; i < this.visitList.length; i++) {
                  if (item.visit.primaryKey === this.visitList[i].visit.primaryKey) {
                    this.visitList[i] = item;
                  }
                }
              }
            });
          });
        setTimeout(() => {
          if (this.visitList === undefined) {
            this.visitList = [];
          }
        }, 1000);
      }
      if (this.openedPanel === 'delivery-address') {
        this.deliveryAddressList = undefined;
        this.daService.getMainItemsByCustomerPrimaryKey(this.selectedCustomer.data.primaryKey).subscribe(list => {
          if (this.deliveryAddressList === undefined) {
            this.deliveryAddressList = [];
          }
          list.forEach((data: any) => {
            const item = data.returnData as DeliveryAddressMainModel;
            if (item.actionType === 'added') {
              this.deliveryAddressList.push(item);
            }
            if (item.actionType === 'removed') {
              // tslint:disable-next-line:prefer-for-of
              for (let i = 0; i < this.deliveryAddressList.length; i++) {
                if (item.data.primaryKey === this.deliveryAddressList[i].data.primaryKey) {
                  this.deliveryAddressList.splice(i, 1);
                  break;
                }
              }
            }
            if (item.actionType === 'modified') {
              // tslint:disable-next-line:prefer-for-of
              for (let i = 0; i < this.deliveryAddressList.length; i++) {
                if (item.data.primaryKey === this.deliveryAddressList[i].data.primaryKey) {
                  this.deliveryAddressList[i] = item;
                  break;
                }
              }
            }
          });
        });
        await this.clearDeliveryAddress();
      }
      if (this.openedPanel === 'dashboard') {
        this.gerenateDashboardChart();
      }
    } catch (error) {
      await this.infoService.error(error);
    }
  }

  btnAccountSummaryExportToExcel_Click(): void {
    try {
      if (this.transactionList.length > 0) {
        this.excelService.exportToExcel(this.transactionList, 'customerAccountSummary');
      } else {
        this.infoService.error('Aktarılacak kayıt bulunamadı.');
      }
    } catch (error) {
      this.infoService.error(error);
    }
  }

  clearMainFiler(): void {
    this.isActive = true;
  }

  clearSelectedCustomer(): void {
    this.accountList$ = new Observable<CustomerAccountModel[]>();
    this.openedPanel = 'edit';
    this.selectedCustomer = this.service.clearMainModel();
  }

  async clearNewCollection(): Promise<void> {
    this.onTransaction = false;
    this.recordDate = getTodayForInput();
    this.newCollection = this.colService.clearMainModel();
    this.newCollection.data.customerCode = this.selectedCustomer.data.primaryKey;
    const receiptNoData = await this.sService.getCollectionCode();
    if (receiptNoData !== null) {
      this.newCollection.data.receiptNo = receiptNoData;
    }
  }

  async clearNewPayment(): Promise<void> {
    this.onTransaction = false;
    this.recordDate = getTodayForInput();
    this.newPayment = this.payService.clearMainModel();
    this.newPayment.data.customerCode = this.selectedCustomer.data.primaryKey;
    const receiptNoData = await this.sService.getPaymentCode();
    if (receiptNoData !== null) {
      this.newPayment.data.receiptNo = receiptNoData;
    }
  }

  async clearNewVoucher(): Promise<void> {
    this.onTransaction = false;
    this.recordDate = getTodayForInput();
    this.newVoucher = this.avService.clearMainModel();
    this.newVoucher.data.customerCode = this.selectedCustomer.data.primaryKey;
    const receiptNoData = await this.sService.getAccountVoucherCode();
    if (receiptNoData !== null) {
      this.newVoucher.data.receiptNo = receiptNoData;
    }
  }

  async clearDeliveryAddress(): Promise<void> {
    this.onTransaction = false;
    this.newDeliveryAddress = this.daService.clearMainModel();
    this.newDeliveryAddress.data.customerPrimaryKey = this.selectedCustomer.data.primaryKey;
  }

  async showTransactionRecord(item: any): Promise<void> {
    const r = new RouterModel();
    r.nextModule = item.transactionType;
    r.nextModulePrimaryKey = item.transactionPrimaryKey;
    r.previousModule = 'customer';
    r.previousModulePrimaryKey = this.selectedCustomer.data.primaryKey;
    await this.globService.showTransactionRecord(r);
  }

  async showTargetRecord(item: any): Promise<void> {
    await this.route.navigate(['customer-target', {
      paramItem: CryptoJS.AES.encrypt(JSON.stringify(item),
        this.encryptSecretKey).toString()
    }]);
  }

  async finishProcess(error: any, info: any): Promise<void> {
    // error.message sistem hatası
    // error kontrol hatası
    if (error === null) {
      if (info !== null) {
        this.infoService.success(info);
      }
      this.generateCharts();
      this.clearSelectedCustomer();
      this.selectedCustomer = undefined;
    } else {
      await this.infoService.error(error.message !== undefined ? error.message : error);
    }
    this.onTransaction = false;
  }

  async finishSubProcess(error: any, info: any): Promise<void> {
    // error.message sistem hatası
    // error kontrol hatası
    if (error === null) {
      if (info !== null) {
        this.infoService.success(info);
      }
      this.generateCharts();
    } else {
      await this.infoService.error(error.message !== undefined ? error.message : error);
    }
    this.onTransaction = false;
  }

  format_totalPrice($event): void {

  }

  format_totalPriceWithTax($event): void {

  }

  format_amount($event): void {
    if (this.openedPanel === 'collection') {
      this.newCollection.data.amount = getFloat(moneyFormat($event.target.value));
      this.newCollection.amountFormatted = currencyFormat(getFloat(moneyFormat($event.target.value)));
    } else if (this.openedPanel === 'payment') {
      this.newPayment.data.amount = getFloat(moneyFormat($event.target.value));
      this.newPayment.amountFormatted = currencyFormat(getFloat(moneyFormat($event.target.value)));
    } else if (this.openedPanel === 'accountVoucher') {
      this.newVoucher.data.amount = getFloat(moneyFormat($event.target.value));
      this.newVoucher.amountFormatted = currencyFormat(getFloat(moneyFormat($event.target.value)));
    } else {
      // nothing
    }
  }

  focus_amount(): void {
    if (this.openedPanel === 'collection') {
      if (this.newCollection.data.amount === 0) {
        this.newCollection.data.amount = null;
        this.newCollection.amountFormatted = null;
      }
    } else if (this.openedPanel === 'payment') {
      if (this.newPayment.data.amount === 0) {
        this.newPayment.data.amount = null;
        this.newPayment.amountFormatted = null;
      }
    } else if (this.openedPanel === 'accountVoucher') {
      if (this.newVoucher.data.amount === 0) {
        this.newVoucher.data.amount = null;
        this.newVoucher.amountFormatted = null;
      }
    } else {
      // nothing
    }
  }

  focus_totalPrice(): void {

  }

  focus_totalPriceWithTax(): void {

  }
}
