import { Component, EventEmitter, Output } from '@angular/core';
// import { Subscription } from 'rxjs/Subscription';
import { WebUsbService } from '../../../../shared/webusb/webusb.service';
//import { WebUsbPort } from '../../../../shared/webusb/webusb.port';


@Component({
    moduleId: module.id,
    selector: 'sd-sidebar-device-files',
    templateUrl: 'sidebar-device-files.component.html',
    styleUrls: ['sidebar-device-files.component.css']
    //providers: [WebUsbService]
})
export class SidebarDeviceFilesComponent {
    @Output()
    private onFileSelected = new EventEmitter();

    @Output()
    private onDeviceFileDeleted = new EventEmitter();

    fileCount : {};// = this.getDeviceFilesCount();
    //fileCount = 5;
    fileArray = [];
    // subscription: Subscription;
    constructor(public webusbService: WebUsbService) { }

    ngOnInit() {
        console.log("BJONES in ngOnInit");
        this.getFileInfo();
    }

    private getFileInfo() {
        this.fileArray = [];
        this.fileCount = 0;
        let deviceThis = this;
        this.webusbService.lsArray(this.fileArray)
        .then( function (arr) {
            //deviceThis.fileArray = arr;
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
        console.log("BJONES in getDeviceFilesCount");
        this.webusbService.count().then((res) => {
            return res;
        });
    }

    // tslint:disable-next-line:no-unused-locals
    public onDeviceFilenameClicked(filename: string) {
        console.log("BJONES " + filename + " was CLICKED");
        this.webusbService.load(filename)
        .then(async (res) => {
            console.log("BJONES load file done about to emit");
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
            console.log("Bjones rm returned " + res);
            that.onDeviceFileDeleted.emit(filename);
            that.getFileInfo();
        //     setTimeout(function() {
        //     that.getFileInfo();
        // },2000);
        });

        // if(this.fileCount < 10)
        //     this.getFileInfo();
        return false;
    }

    // tslint:disable-next-line:no-unused-locals
    public onDeleteDeviceFileClicked(filename: string) {
        let that = this;
        this.webusbService.rm(filename)
        .then(async (res) => {
            console.log("Bjones rm returned " + res);
            that.onDeviceFileDeleted.emit(filename);
            that.getFileInfo();
        //     setTimeout(function() {
        //     that.getFileInfo();
        // },2000);
        });

        // if(this.fileCount < 10)
        //     this.getFileInfo();
        return false;
    }
}
