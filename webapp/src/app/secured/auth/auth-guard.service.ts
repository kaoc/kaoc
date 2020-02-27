import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from './auth.service';

/**
 * AuthGuardService - For auth guard service.
 *
 */
@Injectable({
  providedIn: 'root'
})
export class AuthGuardService implements CanActivate {

    constructor(public authService: AuthService, public router: Router) {}

    /**
     * Called when a route is activated.
     */
    canActivate(route: ActivatedRouteSnapshot): boolean {
        //const expectedRole = route.data.expectedRole;
        const firebaseUser = this.authService.getFirebaseUser();

        if (firebaseUser != null) {
            if (firebaseUser.emailVerified) {
              return true;
            } else {
              this.authService.lastRequestedSecuredUrl = this.resolveUrl(route, null);
              this.router.navigate(['/secured/verify']);
              return false;
            }
        } else {
            this.authService.lastRequestedSecuredUrl = this.resolveUrl(route, null);
            this.router.navigate(['/secured/login']);
            return false;
        }
    }

    /**
     * Resolves the Url
     */
    resolveUrl(route: ActivatedRouteSnapshot, paths: string[]) {
        if (route) {
            paths = paths || [];
            this.resolveUrl(route.parent, paths);
            route.url.forEach(url => {
                paths.push(url.path);
            });
            return paths.join('/');
        }
        return null;
    }
}
