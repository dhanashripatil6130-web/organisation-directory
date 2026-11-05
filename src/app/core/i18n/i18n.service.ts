import { Injectable } from '@angular/core';
import en from './en.json';

type Params = Record<string, string | number>;

@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly messages: Record<string, string> = en;

  t(key: string, params: Params = {}): string {
    const text = this.messages[key] ?? key;
    return text.replace(/\{(\w+)\}/g, (placeholder, name: string) => String(params[name] ?? placeholder));
  }
}
