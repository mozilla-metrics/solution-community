/* Init stuff */

$.blockUI.defaults.message = '<div style="padding: 0px;"><img src="getResource?resource=../../common/images/processing.gif" />';

Dashboards.blockUIwithDrag = function() {
  $.blockUI();
  var blockui = $("div.blockUI.blockMsg").attr('title','Click to unblock, drag to move');
  blockui.draggable({
    handle:"div.blockUI.blockMsg"
  });
  blockui.bind('click',function(){
    $.unblockUI();
  });

}

