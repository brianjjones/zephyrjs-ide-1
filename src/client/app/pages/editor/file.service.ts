import { Injectable } from '@angular/core';

import { LocalStorageService } from 'angular-2-local-storage';


@Injectable()
export class FileService {
    // E.g. 'zephyrjs-ide.FILES.foo'
    readonly PREFIX: string = 'FILES.';

    public constructor(private _localStorageService: LocalStorageService) {
    }

    public exists(filename: string): boolean {
        return this.load(filename) !== null;
    }

    public load(filename: string): string {
        return this._localStorageService.get(this.PREFIX + filename) as string;
    }

    public save(
        filename: string,
        contents: string,
        overwrite: boolean = false): boolean {

        if (this.exists(filename) && !overwrite) {
            return false;
        }

        return this._localStorageService.set(this.PREFIX + filename, contents);
    }

    public ls(): Array<string> {
        let prefixLength = this.PREFIX.length;
        let files: Array<string> = [];
        for (let key of this._localStorageService.keys()) {
            // Only return keys that are for files
            if (key.substr(0, prefixLength) === this.PREFIX) {
                files.push(key.substr(prefixLength));
            }
        }

        return files;
    }

    public count(): number {
        return this.ls().length;
    }

    public delete(filename: string) {
        return this._localStorageService.remove(this.PREFIX + filename);
    }
}
