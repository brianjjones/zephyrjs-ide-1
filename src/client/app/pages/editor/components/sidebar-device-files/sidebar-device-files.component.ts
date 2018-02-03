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
    private onDeviceFile = new EventEmitter();

    @Output()
    private onDeviceFileDeleted = new EventEmitter();

    fileCount: {};// = this.getDeviceFilesCount();
    //fileCount = 5;
    fileArray: {};
    // subscription: Subscription;
    constructor(public webusbService: WebUsbService) { }

    ngOnInit() {
        console.log("BJONES in ngOnInit");
        this.fileCount = this.webusbService.count();
        // this.webusbService.count().then((res) => {
        //     return res;
        // });
      }

    public getDeviceFilesCount(){
        console.log("BJONES in getDeviceFilesCount");
        this.webusbService.count().then((res) => {
            return res;
        });
    }

    // tslint:disable-next-line:no-unused-locals
    public onDeviceFilenameClicked(filename: string) {
        this.onDeviceFile.emit({
            filename: filename,
            contents: this.webusbService.load(filename)
        });
        return false;
    }

    // tslint:disable-next-line:no-unused-locals
    public computeDeviceFileSize(filename: string) {
        //let contents = this.webusbService.load(filename);
    //    let m = encodeURIComponent(contents).match(/%[89ABab]/g);
    //    return contents.length + (m ? m.length : 0);
        return 100;
    }

    // tslint:disable-next-line:no-unused-locals
    public onDeleteDeviceFileClicked(filename: string) {
        this.webusbService.rm(filename);
        this.onDeviceFileDeleted.emit(filename);
        return false;
    }
}
