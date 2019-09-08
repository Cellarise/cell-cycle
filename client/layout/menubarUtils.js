import R from 'ramda';
import {$} from '../globals';
import {effects} from '../widgets/effects';


export function onMenuToggle(prevMenuToggle, menuToggle) {
  if (!R.isNil(prevMenuToggle) && !R.isNil(menuToggle) && prevMenuToggle === menuToggle) {
    return;
  }
  //default to unpinned and closed
  if (menuToggle === false) {
    if ($('body').hasClass('menubar-pin')) {
      $('body').removeClass('menubar-pin');
    }
    //if ($('#menubar').data('expanded') === true) {
      onMenubarLeave();
    //}
  } else {
    if ($('body').hasClass('menubar-pin')) {
      $('body').removeClass('menubar-pin');
    } else {
      $('body').addClass('menubar-pin');
    }
    if ($('#menubar').data('expanded') !== true) {
      onMenubarOpen();
    } else {
      onMenubarLeave();
    }
  }
}

export function onMenubarOpen() {
  // Add open variables
  $('body').addClass('menubar-visible');
  $('#menubar').data('expanded', true);

  // Add listener to close the menubar
  $('#content').one('mouseover', function onMouseOver() {
    onMenubarLeave();
  });

  //open submenu for current page
  $('#main-menu li.menubarExpanded').each(function eachMenuFolder() {
    onOpenSubMenu($(this), 0);
  });
}

export function onMenubarUpdate(props, nextProps) {
  if (nextProps.secureTokenRoute === true) {
    $('body').addClass('secure-token-route');
  } else {
    $('body').removeClass('secure-token-route');
  }
  if (nextProps.dashboardTokenRoute === true) {
    $('body').addClass('dashboard-token-route');
  } else {
    $('body').removeClass('dashboard-token-route');
  }
  if ($('body').hasClass('menubar-pin') && props.windowDimensions.get('currentBreakpoint') !== 'lg'
    && nextProps.windowDimensions.get('currentBreakpoint') === 'lg') {
    //open menu if moving to lg breakpoint
    onMenubarOpen();
  } else if (props.windowDimensions.get('currentBreakpoint') === 'lg'
    && nextProps.windowDimensions.get('currentBreakpoint') !== 'lg') {
    //close menu if moving from lg breakpoint
    onMenubarLeave();
  } else if ($('body').hasClass('menubar-pin') && props.pagePath !== nextProps.pagePath
    && nextProps.windowDimensions.get('currentBreakpoint') === 'lg') {
    //open menu if lg breakpoint and page changed
    onMenubarOpen();
  } else if ($('#menubar').data('expanded') === true) {
    // Update if the menu is expanded
    onMenubarOpen();
  }
}

export function onMenubarLeave() {
  // Remove open variables
  $('body').removeClass('menubar-visible');
  $('#menubar').data('expanded', false);

  if (!effects.isBreakpoint('lg') || !$('body').hasClass('menubar-pin')) {
    onCloseSubMenu($('#main-menu > li.expanded'));
  }
}

export function onMenuItemClick(event) {
  event.stopPropagation();
  const item = $(event.currentTarget);

  if ($('#menubar').data('expanded') !== true) {
    // Add open variables
    $('body').addClass('menubar-visible');
    $('#menubar').data('expanded', true);

    // Add listener to close the menubar
    $('#content').one('mouseover', function onMouseOver() {
      onMenubarLeave();
    });
  }

  if (item.hasClass('menubarExpanded')) {
    //open submenu for current page
    $('#main-menu li.menubarExpanded').each(function eachMenuFolder() {
      onOpenSubMenu($(this), 0);
    });
  } else {
    //toggle submenu
    onToggleSubMenu(item, 0);
  }
}

function onToggleSubMenu(item, duration) {
  if (item.hasClass('expanded')) {
    onCloseSubMenu(item, duration);
  } else {
    onOpenSubMenu(item, duration);
  }
}

function onOpenSubMenu(item, duration) {
  item.parents('.gui-folder').each(function eachMenuFolder() {
    if (!$(this).hasClass('expanded')) {
      $(this).addClass('expanding');
      $(this).find('> ul').stop().slideDown(R.defaultTo(170, duration), function slideDownSubMenuOpen() {
        $(this).addClass('expanded');
        $(this).removeClass('expanding');
      });
    }
  });
  if (!item.hasClass('expanded')) {
    item.addClass('expanding');
    item.find('> ul').stop().slideDown(R.defaultTo(170, duration), function slideDownSubMenuOpen() {
      item.addClass('expanded');
      item.removeClass('expanding');
      // Manually remove the style, $ sometimes failes to remove it
      $('#main-menu ul').removeAttr('style');
    });
  }
}

function onCloseSubMenu(item, duration) {
  item.find('> ul').stop().slideUp(R.defaultTo(170, duration), function slideUpSubMenuClose() {
    $(this).parent('li').removeClass('expanded');
  });
}

