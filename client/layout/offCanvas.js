"use strict";
import {$, win} from '../globals';

export let offCanvas = {
  "TIMER": null,
  "USE_BACKDROP": null,
  "mixin": {
    "componentDidMount": function componentDidMount() {
      // Window events
      $(win).on('resize', offCanvas.evalScrollbar);
      //$('.offcanvas').on('refresh', offCanvas.evalScrollbar);
      $('#base').on('click', '> .backdrop', offCanvas.onCloseCanvas);

    },
    "componentWillUnmount": function componentWillUnmount() {
      $(win).off('resize', offCanvas.evalScrollbar);
      //$('.offcanvas').off('refresh', offCanvas.evalScrollbar);
      $('#base').off('click', '> .backdrop', offCanvas.onCloseCanvas);
    }
  },
  "invalidate": function invalidate() {
    offCanvas.toggleButtonState();
    offCanvas.toggleBackdropState();
    //offCanvas.toggleBodyScrolling();
    //offCanvas.evalScrollbar();
  },
  "toggleButtonState": function toggleButtonState() {
    // Activate the active offcanvas pane
    $('[data-toggle="offcanvas"]').removeClass('active');
    $('[href="#' + $('.offcanvas-pane.active').attr('id') + '"]').addClass('active');
  },
  "toggleBackdropState": function toggleBackdropState() {
    // Clear the timer that removes the keyword
    if ($('.offcanvas-pane.active').length > 0 && offCanvas.USE_BACKDROP) {
      offCanvas._addBackdrop();
    } else {
      offCanvas._removeBackdrop();
    }
  },
  "toggleBodyScrolling": function toggleBodyScrolling() {
    var scrollbarWidth, bodyPad;
    clearTimeout(offCanvas.TIMER);
    if ($('.offcanvas-pane.active').length > 0 && offCanvas.USE_BACKDROP) {
      // Add body padding to prevent visual jumping
      scrollbarWidth = this.measureScrollbar();
      bodyPad = parseInt(($('body').css('padding-right') || 0), 10);
      if (scrollbarWidth !== bodyPad) {
        $('body').css('padding-right', bodyPad + scrollbarWidth);
        $('.headerbar').css('padding-right', bodyPad + scrollbarWidth);
      }
    } else {
      offCanvas.TIMER = setTimeout(function setTimeoutOffCanvas() {
        // Remove offcanvas-expanded to enable body scrollbar
        $('body').removeClass('offcanvas-expanded');
        $('body').css('padding-right', '');
        $('.headerbar').removeClass('offcanvas-expanded');
        $('.headerbar').css('padding-right', '');
      }, 330);
    }
  },
  "_addBackdrop": function _addBackdrop() {
    if ($('#base > .backdrop').length === 0 && $('#base').data('backdrop') !== 'hidden') {
      $('<div class="backdrop"></div>').hide().appendTo('#base').fadeIn();
    }
  },
  "_removeBackdrop": function _removeBackdrop() {
    $('#base > .backdrop').fadeOut(function fadeOutRemoveBackdrop() {
      $(this).remove();
    });
  },
  "onCloseCanvas": function onCloseCanvas() {
    offCanvas.closeOffcanvas();
    offCanvas.invalidate();
  },
  "onToggleCanvas": function onToggleCanvas(e) {
    var btn = $(e.currentTarget);
    e.preventDefault();

    // When the button is active, the off-canvas is already open and should be closed
    if (btn.hasClass('active')) {
      offCanvas.closeOffcanvas();
      offCanvas.invalidate();
      return;
    }

    // Set data variables
    offCanvas.USE_BACKDROP = (btn.data('backdrop'));

    // Open off-canvas
    offCanvas.openOffcanvas(btn.data('canvas'));
    offCanvas.invalidate();
  },
  "openOffcanvas": function openOffcanvas(id) {
    var leftOffcanvas, width, translate;
    // First close all offcanvas panes
    offCanvas.closeOffcanvas();

    // Activate selected offcanvas pane
    $(id).addClass('active');

    // Check if the offcanvas is on the left
    leftOffcanvas = ($(id).closest('.offcanvas:first').length > 0);

    // Remove offcanvas-expanded to enable body scrollbar
    if (offCanvas.USE_BACKDROP){
      $('body').addClass('offcanvas-expanded');
    }

    // Define the width
    width = $(id).width();
    if (width > $(document).width()) {
      width = $(document).width() - 8;
      $(id + '.active').css({'width': width});
    }
    width = (leftOffcanvas) ? width : '-' + width;

    // Translate position offcanvas pane
    translate = 'translate(' + width + 'px, 0)';
    $(id + '.active').css({
      '-webkit-transform': translate,
      '-ms-transform': translate,
      '-o-transform': translate,
      'transform': translate
    });
  },
  "closeOffcanvas": function closeOffcanvas() {

    // Remove active on all offcanvas buttons
    $('[data-toggle="offcanvas"]').removeClass('active');

    // Remove active on all offcanvas panes
    $('.offcanvas-pane').removeClass('active');
    $('.offcanvas-pane').css({
      '-webkit-transform': '',
      '-ms-transform': '',
      '-o-transform': '',
      'transform': ''
    });
  },
  "evalScrollbar": function evalScrollbar() {
    var menu, menuScroller, parent, height, scroller;
    if (!$.isFunction($.fn.nanoScroller)) {
      return;
    }

    // Check if there is a menu
    menu = $('.offcanvas-pane.active');
    if (menu.length === 0) {
      return;
    }

    // Get scrollbar elements
    menuScroller = $('.offcanvas-pane.active .offcanvas-body');
    parent = menuScroller.parent();

    // Add the scroller wrapper
    if (parent.hasClass('nano-content') === false) {
      menuScroller.wrap('<div class="nano"><div class="nano-content"></div></div>');
    }

    // Set the correct height
    height = $(window).height() - menu.find('.nano').position().top;
    scroller = menuScroller.closest('.nano');
    scroller.css({"height": height});

    // Add the nanoscroller
    scroller.nanoScroller({"preventPageScrolling": true});
  },
  "measureScrollbar": function measureScrollbar() {
    var scrollDiv = document.createElement('div');
    var scrollbarWidth;
    scrollDiv.className = 'modal-scrollbar-measure';
    $('body').append(scrollDiv);
    scrollbarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth;
    $('body')[0].removeChild(scrollDiv);
    return scrollbarWidth;
  }
};
