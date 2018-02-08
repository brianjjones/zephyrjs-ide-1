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

    constructor(private settingsService: SettingsService) {
        this.usb = (navigator as any).usb;
    }

    //BJONES TODO MONDAY
    // onRecieve returns the text after ls, figure out how to harvest it

    public onReceive(data: string) {

        // We need to save this data for an async function
        if (this.record) {
            //console.log("bjones SERVICE record! " + data);
            this.incomingData.push(data);
        }

        if (data === "[33macm> [39;0m") {

            this.record = false;
            console.log("BJONES got closing item - record == " + this.record);
            if (this.incomingCB) {
                // Call the callback and then reset the data
                this.incomingCB();
                this.incomingCB = null;
            }
            this.incomingData = [];
        }
        // tslint:disable-next-line:no-empty
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
        return this.port.load(data);
    }

    public rm(data: string) : Promise<string> {
        let webusbThis = this;
        return (new Promise<string>((resolve, reject) => {
            //BJONES is there a more universal way I could do this?
            // Basically send happens fast, but I need to wait until
            // I get the data back to fulfill the promise.           
            webusbThis.incomingCB = function() {
                resolve("done!");
            }
            this.send('rm ' + data + '\n');
        }));
        //return this.port.rm(data);
    }

    public lsTest(): Array<string> {
        return ["THIS", "IS", "A", "TEST"];
    }

    public lsArray(): Promise<Array<string>> {

        if (this.port) {
            let webusbThis = this;

            return( new Promise<Array<string>>((resolve, reject) =>{
                webusbThis.port.send('ls\n')
                .then(async () => {
                    webusbThis.record = true;
                    webusbThis.incomingCB = function () {
                        console.log("BJONES callback called! = " + webusbThis.incomingData.length);
                        resolve(webusbThis.incomingData);
                    }
                    });
                }));
        }
        else {
        return new Promise((resolve, reject) => {
                console.log("BJONES lsArray FAILED");
                resolve([]); // Yay! Everything went well!

        });}

        // if (this.port) {
        //     //console.log("Bjones HIT LSARRAY");
        //     //return ["THIS", "IS", "A", "TEST"];
        //     return this.port.lsArray();
        // }
        // return new Promise<Array<string>>((resolve, reject) => {
        //     return ["test", "a", "is", "this"];
        // });
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

            return( new Promise<number>((resolve, reject) =>{
                webusbThis.port.send('ls\n')
                .then(async () => {
                    webusbThis.record = true;
                    webusbThis.incomingCB = function () {
                        console.log("BJONES callback called!");
                        resolve(webusbThis.incomingData.length);
                    }
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
