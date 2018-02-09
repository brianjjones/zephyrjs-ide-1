import { Injectable } from '@angular/core';
import { WebUsbPort } from './webusb.port';
import { SettingsService } from '../../pages/editor/settings.service';

/**
 * This class provides the WebUsb service.
 */
@Injectable()
export class WebUsbService {
    public usb: any = null;
    public port: WebUsbPort = null;
    private record = false;
    private incomingData = []; // Array<string>;
    private incomingCB: any = null;
    public fileCount : number = 0;
    fileArray = [];
    constructor(private settingsService: SettingsService) {
        this.usb = (navigator as any).usb;
    }
    // Handle incoming data from the device
    public onReceive(data: string) {
        // If this is the closing message, call any callbacks
        if (data === "[33macm> [39;0m") {
            this.record = false;
            // Call the callback and reset data
            if (this.incomingCB) {
                this.incomingCB();
            }
            this.incomingCB = null;
            this.incomingData = [];
        }
        else if (this.record) {
            this.incomingData.push(data);
        }
    }

    public onReceiveError(error: DOMException) {
            // tslint:disable-next-line:no-empty
    }

    public requestPort(): Promise<WebUsbPort> {
        return new Promise<WebUsbPort>((resolve, reject) => {
            const filters = [
                {'vendorId': 0x8086, 'productId': 0xF8A1},
                {'vendorId': 0xDEAD, 'productId': 0xBEEF}
            ];

            if (this.usb === undefined) {
                reject('WebUSB not available');
            }

            this.usb.requestDevice({'filters': filters})
            .then((device: any) => {
                resolve(new WebUsbPort(device));
            })
            .catch((error: string) => {
                reject(error);
            });
        });
    }

    public connect(): Promise<void> {
        let _doConnect = (): Promise<void> => {
            return this.port.connect().then(() => {
                this.port.onReceive = (data: string) => {
                    this.onReceive(data);
                };

                this.port.onReceiveError = (error: DOMException) => {
                    this.onReceiveError(error);
                };
                this.lsArray();
            });
        };

        if (this.port !== null) {
            return _doConnect();
        }

        return new Promise<void>((resolve, reject) => {
            let _onError = (error: DOMException) => {
                this.port = null;
                reject(error);
            };

            this.requestPort()
            .then((p: WebUsbPort) => {
                this.port = p;
                _doConnect()
                .then(() => resolve())
                .catch((error: DOMException) => _onError(error));
            })
            .catch((error: DOMException) => _onError(error));
        });
    }

    public disconnect(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (this.port === null) {
                resolve();
            } else {
                this.port.disconnect()
                .then(() => {
                    this.port = null;
                    resolve();
                })
                .catch((error: DOMException) => {
                    this.port = null;
                    reject(error);
                });
            }
        });
    }

    public isConnected(): boolean {
        return this.port !== null && this.port.isConnected();
    }

    public isAshellReady(): boolean {
        return this.port.isAshellReady();
    }

    public send(data: string): Promise<string> {
        return this.port.send(data);
    }

    public run(data: string): Promise<string> {
        let throttle = this.settingsService.getDeviceThrottle();
        return this.port.run(data, throttle);
    }

    public stop(): Promise<string> {
        return this.port.stop();
    }

    public load(data: string) : Promise<string> {
        let webusbThis = this;
        let loadStr = "";
        //return this.send('cat ' + data + '\n');
        webusbThis.record = true;
        return( new Promise<string>((resolve, reject) =>{
            webusbThis.sendAndWait('cat ' + data + '\n', function () {
                // Remove the command line from the array
                webusbThis.incomingData.splice(0, 2);
                loadStr = webusbThis.incomingData.join('');
                resolve(loadStr);
            });
        }));
    }

    // Send a command 'data' and resolve using 'cb' once the device replies
    public sendAndWait(data: string, cb: any) {
        this.incomingCB = cb;
        this.send(data);
    }

    public rm(data: string) : Promise<string> {
        let webusbThis = this;
        return (new Promise<string>((resolve, reject) => {
            webusbThis.sendAndWait('rm ' + data + '\n', function(){
                resolve("rm " + data + " done");
            });
        }));
    }

    public lsTest(lsArray: Array<string>): Array<string> {
        return ["THIS", "IS", "A", "TEST"];
    }

    public lsArray(): Promise<Array<string>> {
        if (this.port) {
            let retArray = [];
            let webusbThis = this;
            webusbThis.record = true;
            webusbThis.fileArray = [];
            return( new Promise<Array<string>>((resolve, reject) =>{
                webusbThis.sendAndWait('ls\n', function () {
                    let retArray = webusbThis.incomingData;
                    for (var i = 0; i < webusbThis.incomingData.length; i++) {
                        retArray[i] = retArray[i].replace(/[^0-9a-z\.]/gi, '');
                        if (retArray[i] === '') {
                            retArray.splice(i, 1);
                            i--;
                        }
                    }
                    let itr = 0;
                    for (var i = 0; i < retArray.length; i++) {
                        if (!isNaN(retArray[i] as any)) {
                            webusbThis.fileArray[itr] = {size: retArray[i], name: retArray[i + 1]};
                            itr++;
                            i++;
                        }
                    }
                    retArray = webusbThis.fileArray;
                    webusbThis.fileCount = retArray.length;
                    resolve(retArray);
                });
            }));
        }
        else {
        return new Promise((resolve, reject) => {
                resolve([]);
        });}
    }

    public countSide() : number {
        if (this.port) {
            return 14;
            //return this.port.count();
        }
        return 0;
    }

    public count() : Promise<number> {
        if (this.port) {
            let webusbThis = this;
            let localArr = [];
            return( new Promise<number>((resolve, reject) =>{
                this.lsArray()
                .then(async (res) => {
                    resolve(res.length);
                    });
                }));

            // this.port.onReceive = (data: string) => {
            //     this.onReceive(data);
            // };
            //return 4;
            //return this.port.count();
        }
        else {
        return new Promise((resolve, reject) => {
            setTimeout(function(){
                resolve(55); // Yay! Everything went well!
            }, 250);
        });}
    }

    public save(filename: string, data: string): Promise<string> {
        if (this.port === null) {
            return new Promise<string>((resolve, reject) => {
                reject('No device connection established');
            });
        }

        let throttle = this.settingsService.getDeviceThrottle();
        return this.port.save(filename, data, throttle);
    }
}
