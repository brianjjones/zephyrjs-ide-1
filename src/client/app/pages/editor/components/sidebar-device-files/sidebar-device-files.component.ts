import { Component, EventEmitter, Output } from '@angular/core';
import { WebUsbService } from '../../../../shared/webusb/webusb.service';

@Component({
    moduleId: module.id,
    selector: 'sd-sidebar-device-files',
    templateUrl: 'sidebar-device-files.component.html',
    styleUrls: ['sidebar-device-files.component.css']
})
export class SidebarDeviceFilesComponent {
    @Output()
    private onFileSelected = new EventEmitter();

    @Output()
    private onDeviceFileDeleted = new EventEmitter();

    fileCount : number = 0;
    fileArray = [];
    // subscription: Subscription;
    constructor(public webusbService: WebUsbService) { }

    ngOnInit() {
        this.getFileInfo();
    }

    private getFileInfo() {
        this.fileArray = [];
        this.fileCount = 0;
        let deviceThis = this;
        this.webusbService.lsArray(this.fileArray)
        .then( function (arr) {
            let retArray = arr;
            for (var i = 0; i < arr.length; i++) {
                retArray[i] = retArray[i].replace(/[^0-9a-z\.]/gi, '');
                if (retArray[i] === '') {
                    retArray.splice(i, 1);
                    i--;
                }
            }
            let itr = 0;
            for (var i = 0; i < retArray.length; i++) {
                if (!isNaN(retArray[i] as any)) {
                    deviceThis.fileArray[itr] = {size: retArray[i], name: retArray[i + 1]};
                    itr++;
                    i++;
                }
            }
            deviceThis.fileCount = deviceThis.fileArray.length;
        });
    }

    public getDeviceFilesCount(){
        this.webusbService.count().then((res) => {
            return res;
        });
    }

    // tslint:disable-next-line:no-unused-locals
    public onDeviceFilenameClicked(filename: string) {
        this.webusbService.load(filename)
        .then(async (res) => {
        this.onFileSelected.emit({
            filename: filename,
            contents: res
        });
    });
        return false;
    }

    public onRenameDeviceFileClicked(filename: string) {
        let that = this;
        this.webusbService.rm(filename)
        .then(async (res) => {
            that.onDeviceFileDeleted.emit(filename);
            that.getFileInfo();
        });
        return false;
    }

    // tslint:disable-next-line:no-unused-locals
    public onDeleteDeviceFileClicked(filename: string) {
        let that = this;
        this.webusbService.rm(filename)
        .then(async (res) => {
            that.onDeviceFileDeleted.emit(filename);
            that.getFileInfo();
        });
        return false;
    }

    public getFileCount() {
        return this.fileCount;
    }
}
