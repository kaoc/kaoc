import {Component, OnInit} from '@angular/core';
import * as $ from 'jquery';
import {AuthService} from '../../secured/auth/auth.service';
import {Router} from '@angular/router';
import { EventService } from 'src/app/secured/event.service';
import { Event } from 'src/app/secured/Event';


@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  events: Event[];
  loggedIn = false;
  constructor(private authService: AuthService, private router: Router, private eventService: EventService) {
    authService.firebaseUser.subscribe(firebaseUser => {
      if (typeof firebaseUser !== 'undefined') {
        this.loggedIn = (firebaseUser != null);
      }
    });
    eventService.getUpcomingEvents().then(upComingEvents=>{
      this.events = upComingEvents;
      this.events.forEach(event=>{
        if(event.geoLocation) {
          event.mapsLink = `https://www.google.com/maps/search/?api=1&query=${event.geoLocation._latitude},${event.geoLocation._longitude}`;
        }
      });
    });
  }

  ngOnInit() {
    $(document).ready(() => {
      $('nav').removeClass('black');
      $('.headr').removeClass('black');
      animate();
    });
    // $(window).on('scroll', () => {
    //   if ($(window).scrollTop()) {
    //     $('nav').addClass('black');
    //     $('.headr').addClass('black');
    //     // $('.topsection').addClass('topnone');
    //   } else {
    //     $('nav').removeClass('black');
    //     $('.headr').removeClass('black');
    //     // $('.topsection').removeClass('topnone');
    //   }
    // });

    function animate() {
      // window and animation items
      const animation_elements = $.find('.animation-element');
      var web_window = $(window);

      //check to see if any animation containers are currently in view
      function check_if_in_view() {
        //get current window information
        var window_height = web_window.height();
        var window_top_position = web_window.scrollTop();
        var window_bottom_position = (window_top_position + window_height);

        //iterate through elements to see if its in view
        $.each(animation_elements, function() {

          //get the element sinformation
          var element = $(this);
          var element_height = $(element).outerHeight();
          var element_top_position = $(element).offset().top;
          var element_bottom_position = (element_top_position + element_height);

          //check to see if this current container is visible (its viewable if it exists between the viewable space of the viewport)
          if ((element_bottom_position >= window_top_position) && (element_top_position <= window_bottom_position)) {
            element.addClass('in-view');
          } else {
            element.removeClass('in-view');
          }
        });

      }

      //on or scroll, detect elements in view
      $(window).on('scroll resize', function() {
        check_if_in_view();
      });
      //trigger our scroll event on initial load
      $(window).trigger('scroll');
    }
  }
}
