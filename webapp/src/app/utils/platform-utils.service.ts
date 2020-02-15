import { Injectable, OnInit } from '@angular/core';

@Injectable({
  providedIn: 'root'
})

export class PlatformUtilsService {
  constructor() { }

  OnInit() {
  }

  /**
   * Determine the mobile operating system.
   * This function returns one of 'iOS', 'Android', or 'unknown'.
   *
   * @returns {String}
   */
  getMobileOperatingSystem() {
    const userAgent = navigator.userAgent || navigator.vendor;

    if (/android/i.test(userAgent)) {
      return 'Android';
    }
    if (/iPad|iPhone|iPod/.test(userAgent)) {
      return 'iOS';
    }
    return 'Unspported OS';
  }
}
