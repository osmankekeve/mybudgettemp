import { Component, OnInit } from '@angular/core';
import {FileUploadService} from '../services/file-upload.service';
import {FileMainModel} from '../models/file-main-model';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-uploader',
  templateUrl: './uploader.component.html',
  styleUrls: ['./uploader.component.css']
})
export class UploaderComponent implements OnInit {
  constructor( public service: FileUploadService, public toastService: ToastService) { }
  mainList: Array<FileMainModel>;

  ngOnInit() {
    this.mainList = undefined;
    this.service.getMainItems('shared').subscribe(list => {
      if (this.mainList === undefined) {
        this.mainList = [];
      }
      list.forEach((data: any) => {
        const item = data.returnData as FileMainModel;
        if (item.actionType === 'added') {
          this.mainList.push(item);
        }
        if (item.actionType === 'removed') {
          for (let i = 0; i < this.mainList.length; i++) {
            if (item.data.primaryKey === this.mainList[i].data.primaryKey) {
              this.mainList.splice(i, 1);
            }
          }
        }
        if (item.actionType === 'modified') {
          for (let i = 0; i < this.mainList.length; i++) {
            if (item.data.primaryKey === this.mainList[i].data.primaryKey) {
              this.mainList[i] = item;
            }
          }
        }
      });
    });
    setTimeout (() => {
      if (this.mainList === undefined) {
        this.mainList = [];
      }
    }, 1000);
  }

  async btnRemoveFile_Click(item: FileMainModel): Promise<void> {
    try {
      await this.service.removeItem(item).then(async () => {
        this.toastService.success('Dosya başarıyla kaldırıldı.');

      });
        } catch (error) {
          this.toastService.error(error);
    }
  }
}
