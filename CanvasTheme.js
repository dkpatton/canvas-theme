// GET ENV VARIABLE VALUES
function atHome() { // Check if the current page is home page
  'use strict';
  if (ENV.COURSE_HOME) {
    return true;
  } else {
    return false;
  }
}
function canvasUrl() { // Current Canvas URL
  'use strict';
  if (!ENV.DEEP_LINKING_POST_MESSAGE_ORIGIN) {
    if (!ENV.ping_url) {
      return false;
    } else {
      return ENV.ping_url.split('/api/')[0];
    }
  } else {
    return ENV.DEEP_LINKING_POST_MESSAGE_ORIGIN;
  }
}
function userId() { // Current User ID
  'use strict';
  if (!ENV.current_user_id) {
    if (!ENV.current_user.id) {
      return false;
    } else {
      return ENV.current_user.id;
    }
  } else {
    return ENV.current_user_id;
  }
}
function courseId() { // Current Course ID
  'use strict';
  if (!ENV.COURSE_ID) {
    if(!ENV.COURSE.id) {
      return document.querySelector('body').className.split('context-course_')[1].split(' ')[0];
    } else {
      return ENV.COURSE.id;
    }
  } else {
    return ENV.COURSE_ID;
  }
}
function checkAdmin() { // Return admin status
  'use strict';
  var admin = false;
  ENV.current_user_roles.forEach(function (each) {
    if (each == 'admin') {
      admin = true;
    }

  });
  return admin;
}
function currentUserRoles() {
  'use strict';
  if (!ENV.current_user_roles && ENV.current_user_roles.length > 0){
    return false;
  } else {
    return ENV.current_user_roles;
  }
}


// NAVIGATION
function goBack() { // Make browser go back one step
  'use strict';
  window.history.back();
}


// UTILITIES
function rStr() { // Random 6 characters for creating quick IDs
  'use strict';
  return Math.random().toString(36).substring(7);
}
function dateToString(iso_date) { // Convert an ISO 8601 date to a readable string
  'use strict';
  var parsable = iso_date.replace('-', ' ').replace('-', ' ').replace('T', ' ').replace('Z', '');
  var dateObj = Date.parse(parsable);
  return dateObj.toLocaleDateString();
}

function fromDate(days) { // Return an iso date a month out from the current date
  'use strict';
  var date = new Date();
  date.addDays(days);
  return date.toISOString().split('T')[0];
}

function showQtr() { // Return a search string for the current quarter
  'use strict';
  var genericYear = [
    '-01-01:WQ%20',
    '-04-01:SQ%20',
    '-07-01:SUQ%20',
    '-10-01:FQ%20'
  ];
  var thisYearMap = new Map();
  var thisYearObj = {};

  var today = Date.today();
  var yearInt = today.getYear() + 1900;
  var year = yearInt.toString();
  var lastDay = Date.parse(year + '-12-31');

  genericYear.forEach(function (each) {
    var unset = each.split(':');
    thisYearMap.set(Date.parse(year + unset[0]), unset[1]);
    thisYearObj[Date.parse(year + unset[0])] = unset[1];
  });

  var yrKeys = Array.from(thisYearMap.keys());

  if (today >= yrKeys[0] && today < yrKeys[1]) {
    return thisYearObj[yrKeys[0]] + year;
  } else if (today >= yrKeys[1] && today < yrKeys[2]) {
    return thisYearObj[yrKeys[1]] + year;
  } else if (today >= yrKeys[2] && today < yrKeys[3]) {
    return thisYearObj[yrKeys[2]] + year;
  } else if (today >= yrKeys[3] && today < lastDay) {
    return thisYearObj[yrKeys[3]] + year;
  } else {
    return "NRS";
  }
}

// DOM TOOLS
function checkDom(element) { // Return true if element exists
  'use strict';
  if (document.querySelector(element) !== null) {
    return true;
  } else {
    return false;
  }
}
function insertElement(html_str, tag, selector, overwrite = false) { // Create a DOM element from a string of html
  var el = document.createElement(tag);
  var domString = html_str;
  if (tag == 'style') {
    el.type = 'text/css';
    el.innerHTML = domString;
  } else {
    el.innerHTML = domString;
  }
  if (overwrite) {
    document.querySelector(selector).firstChild.remove(document.querySelector(selector).firstChild);
  }
  document.querySelector(selector).appendChild(el);
}
function readElement(selector) { // Returns HTML body for re-use on other pages
  'use strict';
  return document.querySelectorAll(selector);
}
function removeElement(selector) { // Removes the selected element from the DOM
  'use strict';
  document.querySelector(selector).remove();
}


// STYLE TOOLS
function changeCss(selector, property, value) { // Update a CSS property
  'use strict';
  document.querySelector(selector).style[property] = value;
}


// CUSTOMIZATIONS
function removeHomeBreadcrumb() { // Remove breadcrumb from home page
  'use strict';
  changeCss('#breadcrumbs > ul > li:nth-child(3)', 'display', 'none');
}
function oldEmbedCode() { // Adds an orange border around any improperly embedded video
  'use strict';
  document.querySelectorAll('iframe').forEach(function (each) {
    if (each.src.replace('https://', '').split('/')[0] == 'ucdhs.hosted.panopto.com') {
      each.style.border = '2px solid #ffa500';
    }
  });
}


// API REQUESTS
function apiReq(rtype, endpoint) { // Sends an http request to Canvas API and returns a promise
  'use strict';
  var promise = new Promise(function (resolve) {
    var xhr = new XMLHttpRequest();
    xhr.open(rtype, endpoint);
    xhr.send();
    xhr.onload = function () {
      if (xhr.status === 200) {
        var respTxt = xhr.responseText;
        var respCln = respTxt.replace('while(1);', '');
        var respJson = JSON.parse(respCln);
        resolve(respJson);
      }
    };
    return promise;
  });
  return promise;
}


// ADD PORTAL ELEMENTS
function buildDir() { // Add list of courses on SON FSR
  'use strict';
  if (!checkAdmin()) {
    insertElement('<p>You do not have permission to all Canvas courses. Please contact the Curriculum and Technology Manager.</p>', 'div', '#course-directory', true);
    removeElement('.son-admin-only');
    return false;
  }
  var qdir = [];

  readElement('#course-directory div').forEach(function (each) {
    if (each.id !== '') {
      qdir.push(each.id);
    }
  });

  qdir.forEach(function (quarter) {
    var html = '';
    var search_term = quarter.toUpperCase().replace('-', '%20');
    var term_string = ' ' + quarter.toUpperCase().replace('-', ' ');
    var list = apiReq('GET', '/api/v1/accounts/1/courses?per_page=100&search_term=' + search_term + '&hide_enrollmentless_courses=true&enrollment_type[]=student&sort=course_name&order=asc&include[]=total_students');
    var css_str = '';
    var ucd_canvas_url = canvasUrl();
    list.then(function (result) {
      result.forEach(function (course) {
        var curl = ucd_canvas_url + '/courses/' + course.id.toString();
        var avail = '';
        if (course.workflow_state == 'available') {
          avail += '<span style="padding-left: 2px; color: green;" title="Published"><i class="icon-check"></i></span>';
        } else {
          avail += '<span style="padding-left: 2px;" title="Unpublished"><i class="icon-x"></i></span>';
        }
        if (course.name.search('NRS 299') < 0) {
          var rid = rStr();
          var short_course_name = course.name.replace(term_string, '').replace(term_string, '');
          html += '<li><a target="_blank" href="' + curl + '">' + short_course_name + '</a> ';
          css_str += '#jumpto_' + rid + '{display:inline-block;opacity:.5;}';
          css_str += '#jumpto_' + rid + ':hover{opacity:1;}';
          html += '<div id="son-jumpto_' + rid + '">';
          html += '<a title="Jump to Modules" target=_blank href="' + curl + '/modules"> <i class="icon-module"></i></a>';
          html += ' <a title="Jump to Files" target=_blank href="' + curl + '/files"> <i class="icon-folder"></i></a>';
          html += ' <a title="Jump to Settings" target=_blank href="' + curl + '/settings"> <i class="icon-settings"></i></a>';
          html += ' <a title="Jump to People" target=_blank href="' + curl + '/users"> <i class="icon-group"></i></a> ' +
            '<sup style="font-size:.6em;" title="' + course.total_students + ' students enrolled">' + course.total_students + ' </sup>';
          html += avail + '</div></li>';
        }
      });

    }).then(function () {
      insertElement(html, 'span', '#' + quarter, true);
      insertElement(css_str, 'style', 'head', false);
    });
  });
}
function myCourses() { // Add a list of courses into a page
  'use strict';
  var ucd_canvas_url = canvasUrl();
  var html = '';
  var myCourses = new Promise(function (resolve) {
    resolve(apiReq('GET', '/api/v1/accounts/1/courses?' +
      'per_page=20&' +
      'with_enrollments=true&' +
      'enrollment_type[]=student&' +
      'sort=desc&' +
      'search_term=' + showQtr() + '&' +
      'sort=course_name&' +
      'order=asc&' +
      'by_teachers[]=' + userId()));
  });
  myCourses.then(function (result) {
    if (result.length > 0) {
      result.forEach(function (course) {
        html += '<li><a target="_blank" href="' + ucd_canvas_url + '/courses/' +
          course.id.toString() + '">' + course.course_code + '</a></li>';
      });
      insertElement(html, 'span', '#my-courses', true);
    }
  });
}


// NEW HOME PAGE
function displayToolbar() {
  'use strict';
  var roles = currentUserRoles();
  if (roles.includes('admin') | roles.includes('teacher') | roles.includes('root_admin')) {
    document.querySelector('#course_home_content > #wiki_page_show > div.header-bar-outer-container').style.display = 'block';
  }
}
function showUnreadCount() {
  'use strict';
  var unreadCount = apiReq('get', '/api/v1/courses/'+ courseId() + '/discussion_topics?only_announcements=true&filter_by=unread&per_page=11');
  unreadCount.then(function(result){
    if (result.length == 11) {
      document.querySelector('#section-tabs a.announcements').innerHTML += ' <span style="font-size: .6em;">(10+)</span>';
    } else if (result.length > 0){
      document.querySelector('#section-tabs a.announcements').innerHTML += ' <span style="font-size: .7em;">(' + result.length.toString() + ')</span>';
      } 
    });
}
function jumpToLinks() {  
  'use strict';
  document.querySelector('.son-jump-down').setAttribute('onclick', 'document.getElementById("son-home-links").scrollIntoView();');
}

// LOAD ON EVERY PAGE
function onPageLoad() { // Function to run with every page load
  'use strict';
  // On every load of any page do
  if (checkDom('#my-courses')) {
    myCourses();
  }
  if (checkDom('#home-new')) {
    displayToolbar();
    jumpToLinks();
  }
  if (checkDom('#course-directory')) {
    buildDir();
  }
  if (checkDom('iframe')) {
    oldEmbedCode(); 
  }
  showUnreadCount();
}

function ready(){
  'use strict';
  if (courseId() && userId() && canvasUrl() && currentUserRoles() &&  // If environmental variables laoded, and...
      document.readyState == 'complete' &&  // ...document loading completed, and...
      checkDom('#page_view_id')) {  // ...Canvas has entered the page view in the log.
    return true;
  } else {
    return false;
  }
}

function loop(){
  if(!ready()){
    setTimeout(loop, 0);
  } else {
    onPageLoad();
  }
} loop();

