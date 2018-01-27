import { Component, EventEmitter, Output } from '@angular/core';

import { FileService } from '../../file.service';


@Component({
    moduleId: module.id,
    selector: 'sd-sidebar-device-files',
    templateUrl: 'sidebar-device-files.component.html',
    styleUrls: ['sidebar-device-files.component.css'],
    providers: [FileService]
})
export class SidebarDeviceFilesComponent {
    @Output()
    private onFileSelected = new EventEmitter();

    @Output()
    private onFileDeleted = new EventEmitter();


    constructor(public fileService: FileService) { }

    // tslint:disable-next-line:no-unused-locals
    public onFilenameClicked(filename: string) {
        this.onFileSelected.emit({
            filename: filename,
            contents: this.fileService.load(filename)
        });
        return false;
    }

    // tslint:disable-next-line:no-unused-locals
    public computeFileSize(filename: string) {
        let contents = this.fileService.load(filename);
        let m = encodeURIComponent(contents).match(/%[89ABab]/g);
        return contents.length + (m ? m.length : 0);
    }

    // tslint:disable-next-line:no-unused-locals
    public onDeleteFileClicked(filename: string) {
        this.fileService.delete(filename);
        this.onFileDeleted.emit(filename);
        return false;
    }
}
