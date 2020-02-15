import { TestBed } from '@angular/core/testing';

import { PlatformUtilsService } from './platform-utils.service';

describe('PlatformUtilsService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: PlatformUtilsService = TestBed.get(PlatformUtilsService);
    expect(service).toBeTruthy();
  });
});
