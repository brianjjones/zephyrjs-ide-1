import { Injectable } from '@angular/core';
import { WebUsbPort } from './webusb.port';
import { SettingsService } from '../../pages/editor/settings.service';

// enum REPLY {
//     IDLE,
//     LOAD,
//     LIST
// }

/**
 * This class provides the WebUsb service.
 */
@Injectable()

export class WebUsbService {
    public usb: any = null;
    public port: WebUsbPort = null;
    private incomingData = []; // Array<string>;
    private incomingDataStr = "";
    private incomingCB: any = null;
    private fileCount: number = 0;
    private fileArray = [];
    private fileData = "";
    private replyState: string; //REPLY = REPLY.IDLE;

    //BJONES private consolePrint = null;
    constructor(private settingsService: SettingsService) {
        this.usb = (navigator as any).usb;
    }
    public consolePrint(data: string) {
        // To be set once connected
    }
    // Handle incoming data from the device
    public onReceive(data: string) {
        // If this is the closing message, call any callbacks
        //this.consolePrint(data);
        let replyType = this.incomingReply(data);
        console.log("BJONES ---> REPLY OF TYPE + " + replyType)
        if (replyType && replyType !== "none") {
            console.log("BJONES incoming reply..." + replyType);
            this.incomingDataStr = "";
            this.replyState = replyType;
        }

        if (this.replyState) {
            switch(this.replyState) {
                case "cat":
                    // Skip the reply lines by only recording stuff between
                    if (replyType === null)
                        this.fileData += data;
                break;
                case "list":
                    this.incomingDataStr += data;
                break;
                default:
                break;
            }
            //this.incomingDataStr += data;
        }
        else {
            // This isn't an ashell reply, print it
            if (this.consolePrint) {
                this.consolePrint(data);
            }
            console.log(data);
        }

        // if ((this.incomingDataStr.match(/}/g) || []).length ==
        //     (this.incomingDataStr.match(/{/g) || []).length)
        //BJONES TODO add check here for '"status"' to indicate its the last sting
        if (this.replyState && this.replyDone(data)) {
            console.log("BJONES done getting reply");
            //console.log(this.incomingDataStr);

            switch(this.replyState) {
                case "cat":
                    if (this.incomingCB)
                        this.incomingCB(this.fileData);
                    this.fileData = "";
                break;
                case "list":
                    let replyObj = this.parseJSON(this.incomingDataStr);
                    if (this.incomingCB)
                        this.incomingCB(replyObj);
                    this.incomingDataStr = "";
                break;
                default:
                break;
            }

            // let replyObj = this.parseJSON(this.incomingDataStr);
            // if (replyObj) {
            //     if (this.incomingCB) {
            //             this.incomingCB(replyObj);
            //         }
            //     console.log("BJONES ITS A VALID REPLY!!!!");
            // }


            this.replyState = null;
            this.incomingCB = null;
        }
        // if (data === '[33macm> [39;0m') {
        //     // Call the callback and reset data
        //     if (this.incomingCB) {
        //         this.incomingCB();
        //     }
        //     this.incomingCB = null;
        //     this.incomingData = [];
        //     this.incomingData.push(data);
        // }
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
                // Go ahead and get the file list / count
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
        console.log("Sending " + data);
        return this.port.send(data);
    }

    public init() {
        this.port.init();
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
        let loadStr = '';
        //webusbThis.record = true;
        return( new Promise<string> ((resolve, reject) => {
            webusbThis.sendWithCB('{cat ' + data + '}\n', function (retStr: string) {
                // Remove the command line from the array
                //webusbThis.fileArray = retObj.data;
                //webusbThis.incomingData.splice(0, 2);q
            //    loadStr = webusbThis.incomingData.join('');
                resolve(retStr);
            });
        }));
    }

    // Send a command 'data' and resolve using 'cb' once the device replies
    public sendWithCB(data: string, cb: any) {
        this.incomingCB = cb;
        this.send(data);
    }

    public rm(data: string) : Promise<string> {
        return this.port.sendIdeRemove(data);
        // let webusbThis = this;
        // return (new Promise<string> ((resolve, reject) => {
        //     webusbThis.sendWithCB('rm ' + data + '\n', function() {
        //         resolve('rm ' + data + ' done');
        //     });
        // }));
    }

    public lsArray(): Promise<Array<string>> {
        if (this.port) {
            let retArray = [];
            let webusbThis = this;
            //BJONES webusbThis.record = true;
            webusbThis.fileArray = [];
            return( new Promise<Array<string>> ((resolve, reject) => {
                //webusbThis.port.sendIdeList();
                webusbThis.sendWithCB('{ls}\n', function (retObj: object) {
                    console.log("BJONES in CB");
                    webusbThis.fileArray = retObj.data;
                    // for (var i = 0; i < retArray.length; i++) {
                    //     retArray[i] = retArray[i].replace(/[^0-9a-z\.]/gi, '');
                    //     if (retArray[i] === '') {
                    //         retArray.splice(i, 1);
                    //         i--;
                    //     }
                    // }
                    // let itr = 0;
                    // for (var i = 0; i < retArray.length; i++) {
                    //     webusbThis.fileArray[i] = {size: retArray[i].size, name: retArray[i].name};
                    //     // if (!isNaN(retArray[i] as any)) {
                    //     //     webusbThis.fileArray[itr] = {size: retArray[i], name: retArray[i + 1]};
                    //     //     itr++;
                    //     //     i++;
                    //     // }
                    // }
                    //retArray = webusbThis.fileArray;
                    webusbThis.fileCount = webusbThis.fileArray.length;
                    resolve(webusbThis.fileArray);
                });
            }));
        } else {
            return new Promise((resolve, reject) => {
                resolve([]);
            });
        }
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

    public deviceFileCount(): number {
        return this.fileCount;
    }

    private replyDone(str: string) {
    //    var tmpStr = str.replace(/(\r\n|\n|\r)/gm,"");  // Strip newlines
        if (this.replyState === "cat") {
            return (/"data":[\s\S]"end"/).test(str);
        }

        return (/.*"status"\s*:\s*([0-9]+).*$/m).test(str);
    }

    private incomingReply(str: string): string {
    //    var tmpStr = str.replace(/(\r\n|\n|\r)/gm,"");  // Strip newlines
        let replyObj = ((/"reply"(.*?)"(.*?)"/).exec(str));
//        if ((/{\s*"reply"\s*:.*$/m).test(str)) {
        if (replyObj) {
            let replyStr = replyObj[0];
            let splitObj = replyStr.split(':').map(item => item.trim());
            if (splitObj.length == 2)
                return splitObj[1].replace(/['"]+/g, '');     // Return the reply type
            else
                return null;
        }
        return null;
    }

    private parseJSON = function (str: string): object {
        let retVal = null;
        try {
            retVal = JSON.parse(str);
            return retVal;
        } catch (e) {
            return retVal;
        }
    }
}
