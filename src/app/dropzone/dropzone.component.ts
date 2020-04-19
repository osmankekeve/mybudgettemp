import {Component, Input, OnInit} from '@angular/core';
import {FileModel} from '../models/file-model';
import {FileUploadService} from '../services/file-upload.service';
import {FileMainModel} from '../models/file-main-model';
import {CollectionMainModel} from '../models/collection-main-model';
import {GlobalUploadService} from '../services/global-upload.service';
import {CustomerService} from '../services/customer.service';

@Component({
  selector: 'app-dropzone',
  templateUrl: './dropzone.component.html',
  styleUrls: ['./dropzone.component.css']
})
export class DropzoneComponent implements OnInit {
  @Input() recordData: any;
  isHovering: boolean;
  files: File[] = [];

  constructor(public service: GlobalUploadService) {
    this.service.get().subscribe(() => {
      this.files = [];
    });
  }

  ngOnInit() {}

  toggleHover(event: boolean) {
    this.isHovering = event;
  }

  onDrop(files: FileList) {
    for (let i = 0; i < files.length; i++) {
      this.files.push(files.item(i));
    }
  }

}
