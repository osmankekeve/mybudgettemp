import {Component, OnInit, OnDestroy, OnChanges} from '@angular/core';
import {AngularFirestore} from '@angular/fire/firestore';
import {Observable} from 'rxjs/internal/Observable';
import {InformationService} from '../services/information.service';
import {AuthenticationService} from '../services/authentication.service';
import {ProfileService} from '../services/profile.service';
import {getDateForInput, getFirstDayOfMonthForInput, getInputDataForInsert, getTodayForInput} from '../core/correct-library';
import {ActivatedRoute, Router} from '@angular/router';
import {ProfileMainModel} from '../models/profile-main-model';
import {TodoListModel} from '../models/to-do-list-model';
import {ToDoService} from '../services/to-do.service';
import {TodoListMainModel} from '../models/to-do-list-main-model';
import {CollectionMainModel} from '../models/collection-main-model';

@Component({
  selector: 'app-to-do-list',
  templateUrl: './to-do-list.component.html',
  styleUrls: ['./to-do-list.component.css']
})
export class ToDoListComponent implements OnInit, OnDestroy {
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

  ngOnDestroy(): void {
  }

  populateList(): void {
    this.mainList = undefined;
    const beginDate = new Date(this.filterBeginDate.year, this.filterBeginDate.month - 1, this.filterBeginDate.day, 0, 0, 0);
    const finishDate = new Date(this.filterFinishDate.year, this.filterFinishDate.month - 1, this.filterFinishDate.day + 1, 0, 0, 0);
    this.service.getMainItemsTimeBetweenDates(beginDate, finishDate, this.filterIsActive).subscribe(list => {
      if (this.mainList === undefined) { this.mainList = []; }
      list.forEach((data: any) => {
        const item = data.returnData as TodoListMainModel;
        if (item.actionType === 'added') {
          this.mainList.push(item);
        } else if (item.actionType === 'removed') {
          this.mainList.splice(this.mainList.indexOf(this.refModel), 1);
        } else if (item.actionType === 'modified') {
          this.mainList[this.mainList.indexOf(this.refModel)] = item;
        } else {
          // nothing
        }
      });
    });
    setTimeout(() => {
      if (this.mainList === undefined) {
        this.mainList = [];
      }
    }, 5000);
  }

  showSelectedRecord(record: any): void {
    this.openedPanel = 'mainPanel';
    this.selectedRecord = record as TodoListMainModel;
    this.refModel = record as TodoListMainModel;
  }

  btnReturnList_Click(): void {
    try {
      if (this.paramPrimaryKey !== undefined) {
        this.route.navigate(['to-do-list', {}]);
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

  btnNew_Click(): void {
    try {
      this.clearSelectedRecord();
    } catch (err) {
      this.infoService.error(err);
    }
  }

  btnSave_Click(): void {
    if (this.selectedRecord.data.todoText === '') {
      this.infoService.error('Lütfen açıklama giriniz.');
    } else {
      if (this.selectedRecord.data.primaryKey === null) {
        this.selectedRecord.data.primaryKey = this.db.createId();
        this.service.setItem(this.selectedRecord)
          .then(() => {
            this.infoService.success('Kayıt başarıyla gerçekleşti.');
            this.selectedRecord = undefined;
          }).catch(err => this.infoService.error(err));
      } else {
        this.service.updateItem(this.selectedRecord)
          .then(() => {
            this.infoService.success('Kayıt başarıyla güncellendi.');
            this.selectedRecord = undefined;
          }).catch(err => this.infoService.error(err));
      }
    }
  }

  btnRemove_Click(): void {
    try {
      this.service.removeItem(this.selectedRecord)
        .then(() => {
          this.infoService.success('Kayıt başarıyla kaldırıldı.');
          this.selectedRecord = undefined;
        })
        .catch(err => this.infoService.error(err));
    } catch (err) {
      this.infoService.error(err);
    }
  }

  btnMainFilter_Click(): void {
    try {
      this.populateList();
    } catch (err) {
      this.infoService.error(err);
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

}
