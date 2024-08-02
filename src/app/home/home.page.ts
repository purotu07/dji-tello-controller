import { Component, ViewChild, ElementRef } from '@angular/core';
import { UdpService } from '../services/udp.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  @ViewChild('videoPlayer', { static: true }) videoPlayer!: ElementRef;

  battery: number = 0;
  height: number = 0;
  speed: number = 0;
  temperature: number = 0;

  constructor(private udpService: UdpService) {}

  ionViewDidEnter() {
    this.udpService.sendCommand('command');
    this.startVideoStream();
    this.updateStatus();
  }

  takeOff() {
    this.udpService.sendCommand('takeoff');
  }

  land() {
    this.udpService.sendCommand('land');
  }

  sendCommand(command: string) {
    this.udpService.sendCommand(command);
  }

  move(direction: string) {
    let command: string;
    switch (direction) {
      case 'up':
        command = 'up 20';
        break;
      case 'down':
        command = 'down 20';
        break;
      case 'left':
        command = 'left 20';
        break;
      case 'right':
        command = 'right 20';
        break;
      case 'forward':
        command = 'forward 20';
        break;
      case 'back':
        command = 'back 20';
        break;
      default:
        return;
    }
    this.udpService.sendCommand(command);
  }

  startVideoStream() {
    this.udpService.startVideoStream().then(stream => {
      this.videoPlayer.nativeElement.srcObject = stream;
    });
  }

  updateStatus() {
    this.udpService.getStatus().then(status => {
      this.battery = status.battery;
      this.height = status.height;
      this.speed = status.speed;
      this.temperature = status.temperature;
    });
  }
}