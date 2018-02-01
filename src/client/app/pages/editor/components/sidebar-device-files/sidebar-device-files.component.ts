import { Component, EventEmitter, Output } from '@angular/core';

import { WebUsbService } from '../../../../shared/webusb/webusb.service';
import { WebUsbPort } from '../../../../shared/webusb/webusb.port';


@Component({
    moduleId: module.id,
    selector: 'sd-sidebar-device-files',
    templateUrl: 'sidebar-device-files.component.html',
    styleUrls: ['sidebar-device-files.component.css'],
    providers: [WebUsbService]
})
export class SidebarDeviceFilesComponent {
    @Output()
    private onDeviceFile = new EventEmitter();

    @Output()
    private onDeviceFileDeleted = new EventEmitter();


    constructor(public webusbService: WebUsbService) { }

    // tslint:disable-next-line:no-unused-locals
    public onDeviceFilenameClicked(filename: string) {
        this.onDeviceFile.emit({
            filename: filename,
            contents: this.webusbService.load(filename)
        });
        return false;
    }

    // tslint:disable-next-line:no-unused-locals
    public computeFileSize(filename: string) {
        let contents = this.webusbService.load(filename);
    //    let m = encodeURIComponent(contents).match(/%[89ABab]/g);
    //    return contents.length + (m ? m.length : 0);
        return 100;
    }

    // tslint:disable-next-line:no-unused-locals
    public onDeleteFileClicked(filename: string) {
        this.webusbService.rm(filename);
        this.onDeviceFileDeleted.emit(filename);
        return false;
    }
}
