import { Injectable } from '@angular/core';

declare var chrome: any;

@Injectable({
  providedIn: 'root',
})
export class UdpService {
  private telloAddress = '192.168.10.1';
  private telloPort = 8889;
  private socketId: number | null = null;

  constructor() {
    document.addEventListener('deviceready', () => {
      this.createSocket();
    }, false);
  }

  createSocket() {
    if (chrome && chrome.sockets && chrome.sockets.udp) {
      chrome.sockets.udp.create({}, (socketInfo: any) => {
        this.socketId = socketInfo.socketId;
        console.log('Socket created with ID:', this.socketId);
        this.bindSocket();
      });
    } else {
      console.error('UDP sockets not available. Make sure the plugin is installed.');
    }
  }

  bindSocket() {
    if (this.socketId !== null) {
      chrome.sockets.udp.bind(this.socketId, '0.0.0.0', 0, (result: any) => {
        if (result < 0) {
          console.error('Error binding socket:', chrome.runtime.lastError);
        } else {
          console.log('Socket bound to any available port');
          this.startReceiving();
        }
      });
    }
  }

  startReceiving() {
    if (this.socketId !== null) {
      chrome.sockets.udp.onReceive.addListener((info: any) => {
        if (info.socketId === this.socketId) {
          const message = new TextDecoder().decode(new Uint8Array(info.data));
          console.log('Received message:', message);
        }
      });
    }
  }

  sendCommand(command: string) {
    if (this.socketId !== null) {
      const data = new TextEncoder().encode(command);
      chrome.sockets.udp.send(this.socketId, data.buffer, this.telloAddress, this.telloPort, (sendInfo: any) => {
        if (sendInfo.resultCode < 0) {
          console.error('Send failed:', chrome.runtime.lastError);
        } else {
          console.log('Sent command:', command);
        }
      });
    }
  }

  startVideoStream(): Promise<MediaStream> {
    return navigator.mediaDevices.getUserMedia({
      video: {
        deviceId: {
          exact: 'Tello Video Stream', // This may need to be adjusted based on the actual device ID
        },
      },
      audio: false,
    });
  }

  async getStatus(): Promise<any> {
    this.sendCommand('battery?');
    const battery = await this.receiveResponse();
    this.sendCommand('height?');
    const height = await this.receiveResponse();
    this.sendCommand('speed?');
    const speed = await this.receiveResponse();
    this.sendCommand('temp?');
    const temperature = await this.receiveResponse();

    return {
      battery: parseInt(battery),
      height: parseInt(height),
      speed: parseInt(speed),
      temperature: parseInt(temperature),
    };
  }

  private receiveResponse(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (chrome && chrome.sockets && chrome.sockets.udp) {
        chrome.sockets.udp.onReceive.addListener((info: any) => {
          if (info.socketId === this.socketId) {
            const message = new TextDecoder().decode(new Uint8Array(info.data));
            resolve(message);
          } else {
            reject('No response received');
          }
        });
      } else {
        reject('UDP sockets not available');
      }
    });
  }
}