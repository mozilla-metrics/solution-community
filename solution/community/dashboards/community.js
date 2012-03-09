var community = {};

// Dashboards navigation:
//var community.dashboards = [ [ 0, "Render?solution=community&path=%2Fdashboards&file=contributorMap.wcdf"], [ 1, "Render?solution=community&path=%2Fdashboards&file=contributionTrends.wcdf"] ];
community.dashboards = { 
 0: "Render?solution=community&path=%2Fdashboards&file=contributorMap.wcdf", 
 1: "Render?solution=community&path=%2Fdashboards&file=contributionTrends.wcdf" 
};



community.contributionTablePostFetch =  function(inputData,param){
  var data = $.extend(true,{},inputData);
  var indexStart = 2, firstPatchIdx = 16, lastPatchIdx = 17,patchVsIdx = 15, totalPatchesIdx=14;
  
  // get month number from datasource and map to short month name
  
  var headers = this.chartDefinition.colHeaders;

  var mn = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  if( data.metadata.length > 0){
    var months = data.metadata.slice(indexStart,indexStart + mn.length).map(function(d){return mn[d.colName-1];});
  }else{
    var months = mn;
  }
  months.unshift(months.length); //how many we want to replace
  months.unshift(indexStart); //index where the replace starts

  headers.splice.apply(headers,months);

  var todayYear = param.substr(0,4);
  var todayMonth = param.substr(5,2);

  var rows = inputData.resultset;
  for (i in rows) {
    var firstPatch = rows[i][firstPatchIdx] ,lastPatch = rows[i][lastPatchIdx];
    var patchVs = parseFloat(rows[i][patchVsIdx]), totalPatches = parseFloat(rows[i][totalPatchesIdx]);
    data.resultset[i][patchVsIdx] = (totalPatches - patchVs)*100/totalPatches;
    
    
    
    var y = firstPatch.substr(0,4);
    var m = firstPatch.substr(5,2);
    
    //days since first patch
    var f = new Date(firstPatch);
    var l = new Date(lastPatch);
    var t = new Date(param);
    var oneDay = 24*3600*1000; //millisseconds
    var daysSinceLastPatch = (t.getTime() - l.getTime())/oneDay;
    var daysSinceFirstPatch = (t.getTime() - f.getTime())/oneDay;
    data.resultset[i][firstPatchIdx] = daysSinceFirstPatch;
    data.resultset[i][lastPatchIdx] = daysSinceLastPatch;
    
    
    
    if ( (todayYear == y && todayMonth >= m) || (todayYear == (parseInt(y,10)+1) && todayMonth < m) ) {
      var idx = ( (11 - (todayMonth - m) ) % 12) + indexStart ;
      data.resultset[i][idx] += 'F';
    }
    
  };
  

  return data;

};

/* TODO: add description to this function */

community.drawRightBarText = function (textFormat, className,maximum){
    
    if(typeof className === 'undefined'){
      className = 'lastPatch';
    }
  
    var myself = this;
    
/*    var bars = $("#"+myself.htmlObject + " td."+className+":not(.processed)");*/
	var bars = $("#"+myself.htmlObject + " td."+className);
    if(bars.length > 0){
      //calculate maximum
      var rgabsMax=0;
      if(typeof maximum !== 'undefined'){
        rgabsMax = maximum/24/3600/1000;
      }
      if(typeof(myself.rgabsMax) == 'undefined' || myself.chartDefinition.paginate === false){

        bars.each(function(){
          var v = Math.abs($(this).text());
          if(v>rgabsMax || typeof(rgabsMax)=='undefined'){
            rgabsMax = v;
          }
        });

        myself.rgabsMax = rgabsMax;
      }
      else{
        rgabsMax = myself.rgabsMax;
      }
	  
	  
	  // limits the size of the bars to 15 days
	  if (rgabsMax > 15){
		rgabsMax = 15;
	  }
      
      //loop among the bars
      bars.each(function(){
        var ph = $(this);
        //var wtmp = ph.width();
        //var htmp = ph.height();
		var wtmp = 80;  /* Fixed bar width (80px) */
        var htmp = 16;  /* Fixed bar height (16px) */


        var value,numericalValue = parseFloat(ph.text());
        
        if(typeof textFormat === 'undefined'){
          value = numericalValue+'';          
        }
        else{
          value = sprintf(textFormat,numericalValue);
        }
        
		ph.empty();


        if(!isNaN(numericalValue) && numericalValue>=0){
                      
          var paper = Raphael(this, wtmp, htmp);

          var xx = pv.Scale.linear(0,rgabsMax).range(0,wtmp);
          var leftVal=0, rightVal=numericalValue;
          if(leftVal>rightVal){
            leftVal = numericalValue;
            rightVal = 0;
          }


          var c = paper.rect(xx(leftVal), 0, xx(rightVal) - xx(leftVal), htmp, 0);
          c.attr({
            fill: "#D7D6D6",
            stroke: "none",
            value: value,
            title: value
          });
		  
		  if (value < 15){
			var text = paper.text(0, htmp/2, value );
			text.attr({
				fill: "#283235",
				'font-family': "Trebuchet MS",
				'font-size': 10,
				'font-weight': "normal",
				'text-anchor': "start"
			});
		  }else{
			var text = paper.text(0, htmp/2, value );
			text.attr({
				fill: "#283235",
				'font-family': "Trebuchet MS",
				'font-size': 10,
				'font-weight': "bold",
				'fill':"red",
				'text-anchor': "start"
			});
		  }
        }
      });
      
    }
    bars.addClass('processed');

};


/* Warning ! This function is still very dependent for community metrics at the path level */
community.showPatchDetails = function(email,month,params) {

  params = params?params:["repository","module"];
  
  url = "Render?solution=community&path=dashboards&file=patchDetails.wcdf" +
        "&emailParameter=" + email +
        "&dateMonthParameter=" + month;
  $.each(params,function(i,val){
    url+= "&" + val + "Parameter=" + Dashboards.storage["communityMetrics_" + val + "Parameter" ];
  });      
          
  // some bug on ccc prevents tipsy to be removed. Forcing
  $(".tipsy").remove();

  $.fancybox({
    type: "iframe",
    href: url,
    width: $(window).width(),
    height:$(window).height()
  })

};


community.activateRow = function(event,param, activeclass){
    var myself = this;
    if(typeof activeclass === 'undefined'){
      activeclass = "activeRow";
    }
    var obj = event.target.closest("tr");
    var row = obj.get(0);
    var a = obj.children().children();
	var value = $(a[1]).text();

	var click = event.target.prevObject;
	if (!(click)){
		click = event.target.closest();
	}
	if (click.hasClass ('info')){
		return;
	}else{    
		if( obj.hasClass(activeclass) ){
			obj.removeClass(activeclass);
		}
		else{
			var prev = obj.siblings('.'+activeclass).each(function(i,d){
				var curr = $(d);
				curr.removeClass(activeclass);
			});
			obj.addClass(activeclass);
			Dashboards.fireChange( param, value);
		};
	};
};


community.postFetchLineChart = function(data,param){
  if(typeof param === 'undefined'){
    param = referenceDateParameter;
  }
  var resultset = data.resultset;
  var ref = new Date(param);
  var currYear = parseInt(ref.getFullYear(),10);
  
  //start at the end of the query
  var l = resultset.length;
  for(i = l-1; i>=0; i--){
    var m = parseInt(resultset[i][0],10) -1;        
    resultset[i][0] = currYear + '-' + resultset[i][0] + '-01';
    //subtract one year after january
    if( m == 0){
      currYear-= 1;
    }
    
  }
    
  return data;
}


community.drawTables = function (){
    var ids = {
        'mozilla-central':['render_mozillaCentralTable','mozillaColumn'],
        'comm-central':['render_commCentralTable','commColumn'],
        'tracemonkey':['render_tracemonkeyTable','tracemonkeyColumn']
    };
    //hide all tables
    $.each(ids,function(i,v){
        $('#'+v[1]).hide();
    });
    
    
    var pars = Dashboards.getParameterValue(this.parameter);
    if(pars){
        if(pars.length > 0){
            $.each(pars,function(i,v){
                $.each(ids,function(key,val){
                    if(v.search(key) > -1){
                        $('#'+val[1]).show();
                        Dashboards.update(window[val[0]]);
                        
                    }
                });
            });
        }
    }
    
}

/* Changes the content of a cell by setting the "maxSize" nr of chars. On mouseover, the full value is displayed */
community.drawAutoString = function(maxSize,cssclass){
  
    if(typeof cssclass === 'undefined'){
      cssclass = "communityString";
    }
  
    var  myself = this;

    $("#" + this.htmlObject + " td." + cssclass).each(function(){

    var t = $(this);
    var value = t.text();
    
    var classes = [];
    $(t).each(function() {
        $($(this).attr('class').split(' ')).each(function() { 
            if (this !== '') {
                classes.push(this);
            }    
        });
    });

    if(typeof maxSize === 'undefined' && myself.chartDefinition.colWidths.length > 0){
      var columnIndex = mozilla.getColumnIndex(classes[0]);
      var columnWidth = parseInt(myself.chartDefinition.colWidths[columnIndex].substr(0,myself.chartDefinition.colWidths[columnIndex].length-2));
      
      if($(t).parents("tbody").length !== 0) //check if is the header, needs to be changed
          maxSize = Math.ceil((columnWidth - 25)/5);
      else
          maxSize = Math.ceil((columnWidth - 15)/5);
      
    }
  
    mozilla.setItemText(t, value, maxSize);

  
    //create elements
    var a = $('<a class="info" href="mailto:mozilla@webdetails.pt?subject=Community%20Metrics%20Dashboard%20Data%20Correction&body=I%20think%20that%20the%20information%20is%20not%20accurate%20because%20..."></a>');
    var user = $("<div id=user class=autoString> </div>");

    //build elemets
    user.text(t.text());
    a.attr("title", "Is this information not accurate? Click to let us know.");

    //clear t
    t.empty();
  
    //add to t
    a.appendTo(t);
    user.appendTo(t);
  });
};




/* Draw bubbles */
community.drawBubbles = function(averagePatches,dateParam){
    
    var bubbles = $("#" + this.htmlObject + " td.bubblechart:not(.processed)");
    if (bubbles.length > 0 ){
      // we need to draw it.

      // Getting absolute max
      var absMax=0;
      bubbles.each(function(i,vv){
        var v = Math.abs($(this).text().replace("F",""));
          if(v>absMax){
            absMax = v;
          }
      });

      var maxSizePatches = 4 * averagePatches;
      var w = 20;
      var h = 20;
      var maxRadius = pv.min([w,h]) / 2 ;
      var margin = 2;
      var orangeColor = mozilla.settings.colors.orange;
      var xx = pv.Scale.linear(1, Math.sqrt(maxSizePatches) ).range(1, maxRadius-margin);

      bubbles.each(function(){
        var ph = $(this);

        var value = ph.text().replace("F","");        
        var color = ph.text().indexOf("F") > -1 ? orangeColor : mozilla.settings.colors.gray;
        ph.empty();

        // Min radius = 1
        var paper = Raphael(this, w, h);
        // Creates circle at x = 'w/2', y = 'h/2', with radius 'xx(value)'
        var circle = paper.circle(w/2, h/2, (value == 0 ? 0 : ( value > maxSizePatches ? xx(Math.sqrt(maxSizePatches)) : xx(Math.sqrt(value)) )));

        circle.attr({
          fill: color,
          stroke: (color == orangeColor ? orangeColor : null )
        });

        ph.attr('title', value + (value == 1 ? " patch" : " patches" ) + (color == orangeColor ? ".  First patch." : "" ) );
        
      });

    }
    bubbles.addClass('processed');

};


