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

@Component({
  selector: 'app-to-do-list',
  templateUrl: './to-do-list.component.html',
  styleUrls: ['./to-do-list.component.css']
})
export class ToDoListComponent implements OnInit {
  mainList: Array<TodoListMainModel>;
  employeeList$: Observable<ProfileMainModel[]>;
  selectedRecord: TodoListMainModel;
  refModel: TodoListMainModel;
  openedPanel: any;
  searchText: '';
  isMainFilterOpened = false;
  paramPrimaryKey: any = undefined;

  filterBeginDate: any;
  filterFinishDate: any;
  filterIsActive = '1';
  onTransaction = false;

  constructor(public authService: AuthenticationService, public service: ToDoService,
              public proService: ProfileService, public router: ActivatedRoute,
              public infoService: InformationService, public route: Router,
              public db: AngularFirestore) {
  }

  async ngOnInit() {
    this.paramPrimaryKey = this.router.snapshot.paramMap.get('primaryKey');
    this.clearMainFiler();
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

  async generateModule(isReload: boolean, primaryKey: string, error: any, info: any): Promise<void> {
    if (error === null) {
      this.infoService.success(info !== null ? info : 'Belirtilmeyen Bilgi');
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
    const beginDate = new Date(this.filterBeginDate.year, this.filterBeginDate.month - 1, this.filterBeginDate.day, 0, 0, 0);
    const finishDate = new Date(this.filterFinishDate.year, this.filterFinishDate.month - 1, this.filterFinishDate.day + 1, 0, 0, 0);
    this.service.getMainItemsTimeBetweenDates(undefined, undefined, this.filterIsActive).subscribe(list => {
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

  async btnMainFilter_Click(): Promise<void> {
    try {
      this.generateCharts();
      this.populateList();
    } catch (err) {
      await this.infoService.error(err);
    }
  }

  btnShowMainFiler_Click(): void {
    try {
      this.isMainFilterOpened = this.isMainFilterOpened !== true;
      this.clearMainFiler();
    } catch (err) {
      this.infoService.error(err);
    }
  }

  clearSelectedRecord(): void {
    this.openedPanel = 'mainPanel';
    this.refModel = undefined;
    this.selectedRecord = this.service.clearMainModel();
  }

  clearMainFiler(): void {
    this.filterBeginDate = getFirstDayOfMonthForInput();
    this.filterFinishDate = getTodayForInput();
    this.filterIsActive = '1';
  }

  async finishProcess(error: any, info: any): Promise<void> {
    // error.message sistem hatası
    // error kontrol hatası
    if (error === null) {
      if (info !== null) {
        this.infoService.success(info);
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
