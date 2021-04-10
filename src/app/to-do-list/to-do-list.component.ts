import {Component, OnInit, OnDestroy, OnChanges} from '@angular/core';
import {AngularFirestore} from '@angular/fire/firestore';
import {Observable} from 'rxjs/internal/Observable';
import {InformationService} from '../services/information.service';
import {AuthenticationService} from '../services/authentication.service';
import {ProfileService} from '../services/profile.service';
import {getFirstDayOfMonthForInput, getTodayForInput} from '../core/correct-library';
import {ActivatedRoute, Router} from '@angular/router';
import {ProfileMainModel} from '../models/profile-main-model';
import {ToDoService} from '../services/to-do.service';
import {TodoListMainModel} from '../models/to-do-list-main-model';
import {PurchaseOrderService} from '../services/purchase-order.service';
import {ToastService} from '../services/toast.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ExcelService } from '../services/excel-service';
import { Subscription } from 'rxjs';
import { MainFilterComponent } from '../partials/main-filter/main-filter.component';
import { InfoModuleComponent } from '../partials/info-module/info-module.component';

@Component({
  selector: 'app-to-do-list',
  templateUrl: './to-do-list.component.html',
  styleUrls: ['./to-do-list.component.css']
})
export class ToDoListComponent implements OnInit, OnDestroy {
  mainList$: Subscription;
  mainList: Array<TodoListMainModel>;
  employeeList$: Observable<ProfileMainModel[]>;
  selectedRecord: TodoListMainModel;
  refModel: TodoListMainModel;
  openedPanel: any;
  searchText: '';
  paramPrimaryKey: any = undefined;
  filter = {
    filterBeginDate: getFirstDayOfMonthForInput(),
    filterFinishDate: getTodayForInput(),
    filterIsActive: '1'
  };
  onTransaction = false;

  constructor(public authService: AuthenticationService, public service: ToDoService, protected toastService: ToastService,
              public proService: ProfileService, public router: ActivatedRoute,
              public infoService: InformationService, public route: Router,
              public db: AngularFirestore, protected modalService: NgbModal, public excelService: ExcelService) {
  }

  async ngOnInit() {
    this.paramPrimaryKey = this.router.snapshot.paramMap.get('primaryKey');
    this.populateList();
    this.employeeList$ = this.proService.getMainItems();
    this.selectedRecord = undefined;
    if (this.paramPrimaryKey !== undefined && this.paramPrimaryKey !== null) {
      const data = await this.service.getItem(this.paramPrimaryKey);
      if (data) {
        this.showSelectedRecord(data);
      }
    }
  }

  ngOnDestroy() {
    if (this.mainList$ !== undefined) {
      this.mainList$.unsubscribe();
    }
  }

  async generateModule(isReload: boolean, primaryKey: string, error: any, info: any): Promise<void> {
    if (error === null) {
      this.toastService.success(info !== null ? info : 'Belirtilmeyen Bilgi');
      if (isReload) {
        this.service.getItem(primaryKey)
          .then(item => {
            this.showSelectedRecord(item.returnData);
          })
          .catch(reason => {
            this.finishProcess(reason, null);
          });
      } else {
        this.generateCharts();
        this.clearSelectedRecord();
        this.selectedRecord = undefined;
      }
    } else {
      await this.infoService.error(error.message !== undefined ? error.message : error);
    }
    this.onTransaction = false;
  }

  populateList(): void {
    this.mainList = undefined;
    const beginDate = new Date(this.filter.filterBeginDate.year, this.filter.filterBeginDate.month - 1, this.filter.filterBeginDate.day, 0, 0, 0);
    const finishDate = new Date(this.filter.filterFinishDate.year, this.filter.filterFinishDate.month - 1, this.filter.filterFinishDate.day + 1, 0, 0, 0);
    this.mainList$ = this.service.getMainItemsTimeBetweenDates(undefined, undefined, this.filter.filterIsActive).subscribe(list => {
      if (this.mainList === undefined) {
        this.mainList = [];
      }
      list.forEach((data: any) => {
        const item = data.returnData as TodoListMainModel;
        if (item.actionType === 'added') {
          this.mainList.push(item);
        }
        if (item.actionType === 'removed') {
          for (let i = 0; i < this.mainList.length; i++) {
            if (item.data.primaryKey === this.mainList[i].data.primaryKey) {
              this.mainList.splice(i, 1);
              break;
            }
          }
        }
        if (item.actionType === 'modified') {
          for (let i = 0; i < this.mainList.length; i++) {
            if (item.data.primaryKey === this.mainList[i].data.primaryKey) {
              this.mainList[i] = item;
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
    }, 5000);
  }

  generateCharts(): void {

  }

  showSelectedRecord(record: any): void {
    this.openedPanel = 'mainPanel';
    this.selectedRecord = record as TodoListMainModel;
    this.refModel = record as TodoListMainModel;
  }

  async btnReturnList_Click(): Promise<void> {
    try {
      if (this.paramPrimaryKey !== undefined) {
        await this.finishProcess(null, null);
        await this.route.navigate(['to-do-list', {}]);
      }
      if (this.openedPanel === 'mainPanel') {
        this.selectedRecord = undefined;
      } else {
        this.openedPanel = 'mainPanel';
      }
    } catch (err) {
      this.infoService.error(err);
    }
  }

  async btnNew_Click(): Promise<void> {
    try {
      this.clearSelectedRecord();
    } catch (err) {
      await this.infoService.error(err);
    }
  }

  async btnSave_Click(): Promise<void> {
    try {
      this.onTransaction = true;
      Promise.all([this.service.checkForSave(this.selectedRecord)])
        .then(async (values: any) => {
          if (this.selectedRecord.data.primaryKey === null) {
            this.selectedRecord.data.primaryKey = this.db.createId();
            await this.service.setItem(this.selectedRecord)
              .then(() => {
                this.generateModule(true, this.selectedRecord.data.primaryKey, null, 'Kayıt başarıyla kaydedildi.');
              })
              .catch((error) => {
                this.finishProcess(error, null);
              });
          } else {
            await this.service.updateItem(this.selectedRecord)
              .then(() => {
                this.generateModule(true, this.selectedRecord.data.primaryKey, null, 'Kayıt başarıyla güncellendi.');
              })
              .catch((error) => {
                this.finishProcess(error, null);
              });
          }
        })
        .catch((error) => {
          this.finishProcess(error, null);
        });
    } catch (error) {
      await this.finishProcess(error, null);
    }
  }

  async btnRemove_Click(): Promise<void> {
    try {
      this.onTransaction = true;
      Promise.all([this.service.checkForRemove(this.selectedRecord)])
        .then(async (values: any) => {
          await this.service.removeItem(this.selectedRecord)
            .then(() => {
              this.finishProcess(null, 'Kayıt başarıyla kaldırıldı.');
            })
            .catch((error) => {
              this.finishProcess(error, null);
            });
        })
        .catch((error) => {
          this.finishProcess(error, null);
        });
    } catch (error) {
      await this.finishProcess(error, null);
    }
  }

  async btnShowMainFiler_Click(): Promise<void> {
    try {
      const modalRef = this.modalService.open(MainFilterComponent, {size: 'md'});
      modalRef.result.then((result: any) => {
        if (result) {
          this.filter.filterBeginDate = result.filterBeginDate;
          this.filter.filterFinishDate = result.filterFinishDate;
          this.ngOnDestroy();
          this.populateList();
        }
      }, () => {});
    } catch (error) {
      await this.infoService.error(error);
    }
  }

  async btnShowJsonData_Click(): Promise<void> {
    try {
      await this.infoService.showJsonData(JSON.stringify(this.selectedRecord, null, 2));
    } catch (error) {
      await this.infoService.error(error);
    }
  }

  async btnShowInfoModule_Click(): Promise<void> {
    try {
      this.modalService.open(InfoModuleComponent, {size: 'lg'});
    } catch (error) {
      await this.infoService.error(error);
    }
  }

  btnExportToExcel_Click(): void {
    if (this.mainList.length > 0) {
      this.excelService.exportToExcel(this.mainList, 'to-do-list');
    } else {
      this.infoService.error('Aktarılacak kayıt bulunamadı.');
    }
  }

  clearSelectedRecord(): void {
    this.openedPanel = 'mainPanel';
    this.refModel = undefined;
    this.selectedRecord = this.service.clearMainModel();
  }

  async finishProcess(error: any, info: any): Promise<void> {
    // error.message sistem hatası
    // error kontrol hatası
    if (error === null) {
      if (info !== null) {
        this.toastService.success(info);
      }
      this.generateCharts();
      this.clearSelectedRecord();
      this.selectedRecord = undefined;
    } else {
      await this.infoService.error(error.message !== undefined ? error.message : error);
    }
    this.onTransaction = false;
  }

}
