import { Injectable, TemplateRef } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ToastService {
    toasts: Array<any> = [];

    show(textOrTpl: string | TemplateRef<any>, options: any = {}): void {
        this.toasts.push({ textOrTpl, ...options });
    }

    success(textOrTpl: string | TemplateRef<any>, options: any = {}): void {
        this.toasts.push({ textOrTpl, ...options, ...{ classname: 'bg-success text-light', delay: 10000 } });
    }

    error(textOrTpl: string | TemplateRef<any>, options: any = {}): void {
        this.toasts.push({ textOrTpl, ...options, ...{ classname: 'bg-danger text-light', delay: 15000 } });
    }

    remove(toast: any): void {
        this.toasts = this.toasts.filter(t => t !== toast);
    }
}
