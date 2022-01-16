import { Component, OnInit, SecurityContext } from '@angular/core';
import { MatCard } from '@angular/material';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

export class StaticPageReference {
  title: string;
  description: string;
  hrefPath: string
}

@Component({
  selector: 'shell',
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.css']
})
export class ShellComponent implements OnInit {
  staticPageBaseHref: string = "https://www.colorkerala.org";
  pageReference:Map<string, StaticPageReference> = new Map([
                                                        ["bylaws", {
                                                          'title': "KAOC By-laws",
                                                          "hrefPath": "bylaws/",
                                                          "description":
                                                          "KAOC is a registered non-profile organization"
                                                        }]]);
  staticPageUrl:SafeResourceUrl;
  staticPageTitle:string;
  staticPageDescription:string;
  errorMessage: string;

  constructor(private route:ActivatedRoute, private sanitizer: DomSanitizer) {
    let pageId = this.route.snapshot.paramMap.get('pageId');
    let pageReference:StaticPageReference = this.pageReference.get(pageId);
    if(pageReference) {
        this.staticPageUrl = this.sanitizer.bypassSecurityTrustResourceUrl(`${this.staticPageBaseHref}/${pageReference.hrefPath}`);
        this.staticPageTitle = pageReference.title;
        this.staticPageDescription = pageReference.description;
    } else {
        this.errorMessage = `Page not found: static/${pageId}`;
        this.staticPageTitle = this.errorMessage;
    }
  }

  ngOnInit(): void {
  }

}
