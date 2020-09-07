import { Injectable, TemplateRef } from '@angular/core';
import {removeItemFromArray} from '../helpers';

@Injectable({ providedIn: 'root' })
export class ToastService {
  toasts: Array<any> = [];

  show(textOrTpl: string | TemplateRef<any>, options: any = {}): void {
    this.toasts.push({textOrTpl, ...options});
  }

  success(textOrTpl: string | TemplateRef<any>, options: any = {}): void {
    this.toasts.push({textOrTpl, ...options, ...{classname: 'bg-success text-light', delay: 5000}});
  }

  error(textOrTpl: string | TemplateRef<any>, options: any = {}): void {
    this.toasts.push({textOrTpl, ...options, ...{classname: 'bg-danger text-light', delay: 10000}});
  }

  warning(textOrTpl: string | TemplateRef<any>, options: any = {}): void {
    this.toasts.push({textOrTpl, ...options, ...{classname: 'bg-warning text-light', delay: 5000}});
  }

  info(textOrTpl: string | TemplateRef<any>, options: any = {}): void {
    this.toasts.push({textOrTpl, ...options, ...{classname: 'bg-info text-light', delay: 5000}});
  }

  remove(toast: any): void {
    removeItemFromArray(this.toasts, toast);
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }
}
