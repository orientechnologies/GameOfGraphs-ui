var orientDbUrl ="http://localhost:2480/command/GameOfThrones/"
var orientDbUser = "admin"
var orientDbPass = "admin"

String.prototype.hashCode = function() {
  var hash = 0, i, chr, len;
  if (this.length === 0) return hash;
  for (i = 0, len = this.length; i < len; i++) {
    chr   = this.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};


function displayInfo(params) {
    params.event = "[original event]";
    var node = lastResultSet[params["nodes"][0]];
    if(!node){
      node = lastResultSet[params["edges"][0]];
    }
    // console.log(JSON.stringify(params, null, 4));
    $("#wiki").attr("src", node.url);
    console.log(node);
    var infoHtml = "<ul>";
    Object.keys(node).forEach(function(elem){
      infoHtml += "<li>"+elem+": "+node[elem]+"</li>";
    });

    infoHtml += "</ul>";
    $("#infotab").html(infoHtml);
}

function fitGraph(){
  var options = {
    offset: {x:0,y:0},
    duration: 1000,
    easingFunction: "easeOutQuint"
  };
  network.fit({animation:options});
}

function getColorFor(className){
  var hash = className.hashCode();
  hash = hash%(256*256*256)
  if(hash<0){
    hash = -hash;
  }
  return "#"+hash.toString(16)
}




var network = null;
var lastResultSet = {};


$( document ).ready(submitQuery);


function submitQuery(){
  var limit = $("#querylimit").val();
  var query = $("#query").val();
  executeQuery(query, limit);
}

var executeQuery = function(query, limit) {
  if(!limit){
    limit = 100;
  }
  $.ajax({
      type: "POST",
      url: orientDbUrl+"sql/-/"+limit,
      dataType: 'json',
      data: JSON.stringify({
        "command": query,
        "mode": "graph"
      }),
      async: true,
      headers: {
        "Authorization": "Basic " + btoa(orientDbUser+":"+orientDbPass)
      },
      success: function (data){
        buildGraph(data)
      },
      error: function (jqXHR, textStatus, errorThrown){
        alert(jqXHR.responseJSON.errors[0].content);
      }
    });
}




var buildGraph = function(jsonData){
  var nodeElems = [];
  var edgeElems = [];

  lastResultSet = {};


  if(jsonData.graph.vertices.length==0){
    alert("No results for this query");
    return;
  }
  for(var v in jsonData.graph.vertices){
    var vData = jsonData.graph.vertices[v];
    lastResultSet[vData["@rid"]] = vData;
    nodeElems.push({
      id: vData["@rid"],
      label: vData.name,
      group: vData["@class"]
    })
  }

  for(var e in jsonData.graph.edges){
    var eData = jsonData.graph.edges[e];
    lastResultSet[eData["@rid"]] = eData;
    edgeElems.push({
      id: eData["@rid"],
      from: eData["from"],
      to: eData["to"],
      arrows:'to',
      color: getColorFor(eData["@class"])
    });
  }

  var nodes = new vis.DataSet(nodeElems);

  // create an array with edges
  var edges = new vis.DataSet(edgeElems);

  // create a network
  var container = document.getElementById('mynetwork');
  var data = {
    nodes: nodes,
    edges: edges
  };


  var options = {
    interaction:{hover:true},
    nodes: {
      shape: 'dot'
    },
    groups: getGraphIcons()
  };

  network = new vis.Network(container, data, options);

  network.on("click", displayInfo);

  network.on("hoverEdge", function (params) {
    var edge = lastResultSet[params.edge];
    $("#contextInfo").text("Edge type: " + edge["@class"]);
  });

  network.on("blurEdge", function (params) {
    $("#contextInfo").text("");
  });

  network.on("hoverNode", function (params) {
    var vertex = lastResultSet[params.node];
    $("#contextInfo").text("Vettex type: " + vertex["@class"]);
  });

  network.on("blurNode", function (params) {
    $("#contextInfo").text("");
  });

}
