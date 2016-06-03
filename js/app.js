var gameofgraphs = angular.module('gameofgraphs', []);

gameofgraphs.controller('GraphPanelController', function GraphPanelController($scope) {


  var orientDbUrl = "/command/GameOfThrones/";
  var orientDbUser = "reader";
  var orientDbPass = "reader";

  String.prototype.hashCode = function () {
    var hash = 0, i, chr, len;
    if (this.length === 0) return hash;
    for (i = 0, len = this.length; i < len; i++) {
      chr   = this.charCodeAt(i);
      hash  = ((hash << 5) - hash) + chr;
      hash |= 0; 
    }
    return hash;
  };


  function displayInfo(params) {

    $scope.infoPanelHint = "";
    var node = lastResultSet[params["nodes"][0]];
    if(!node){
      node = lastResultSet[params["edges"][0]];
    }

    $("#wiki").attr("src", node.url);
    $scope.currentElement = node;
    loadEdgeTypes(node);
    $scope.$apply();
  }

  function loadEdgeTypes(node){
    $.ajax({
        type: "POST",
        url: orientDbUrl+"sql/-/1",
        dataType: 'json',
        data: JSON.stringify({
          "command": "SELECT outE().@class.asSet() as out, inE().@class.asSet() as in from "+node["@rid"]
        }),
        async: true,
        headers: {
          "Authorization": "Basic " + btoa(orientDbUser+":"+orientDbPass)
        },
        success: function (data){
          $scope.currentElementEdgeTypes = data.result[0];
          $scope.$apply();
        },
        error: function (jqXHR, textStatus, errorThrown){
        }
      });
  }

  $scope.graphWidth = 5;
  $scope.expandCollapsePanels = function(){
    if($scope.graphWidth == 5){
      $scope.graphWidth = 8;
    }else{
      $scope.graphWidth = 5;
    }
  }

  $scope.networkPanelClass = function(){
      return "col-md-"+$scope.graphWidth;
  }

  $scope.wikiPanelClass = function(){
      return "col-md-"+(12 - $scope.graphWidth);
  }

  $scope.stabilizePhysics = function(){
    network.stopSimulation();
    network.setOptions({physics:{enabled:false}});
  }

  $scope.reactivatePhysics = function(){
    network.setOptions({physics:{enabled:true}});
    network.startSimulation();
  }


  $scope.expandEdge = function(direction, type){

    if(!$scope.currentElement){
      return;
    }
    var rid = $scope.currentElement["@rid"];
    if(!rid){
      return;
    }

    var query = "MATCH {class:V, as:a, where:(@rid = "+rid+")}."+direction+"('"+type+"'){as:b} return $elements";
    appendQuery(query, -1);
  }

  $scope.fitGraph = function(){
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

  $scope.submitQuery = function(){
    var limit = $("#querylimit").val();
    var query = $("#query").val();
    executeQuery(query, limit);
    $scope.lastPage = 0;
  }

  $scope.submitAppendQuery = function(){
    $scope.lastPage = 0;
    var limit = $("#querylimit").val();
    var query = $("#query").val();

    var allRids = Object.keys(lastResultSet);
    var vertexRids = [];
    for(var i in allRids){
      var rid = allRids[i];
      if(nodes.get(rid)){
        vertexRids.push(rid);
      }
    }
    var vertexRidsString = "[" + (vertexRids.join(", "))+"]";

    var queryString = "select expand(unionAll($new, $old)) let "+
    "$new = (select from ("+query+") limit "+limit+"), "+
    "$old = (SELECT FROM "+vertexRidsString+")";

    appendQuery(queryString, -1);
  }

  $scope.more = function(){
    $scope.lastPage++;
    var limit = $("#querylimit").val();
    var query = $("#query").val();

    var allRids = Object.keys(lastResultSet);
    var vertexRids = [];
    for(var i in allRids){
      var rid = allRids[i];
      if(nodes.get(rid)){
        vertexRids.push(rid);
      }
    }
    var vertexRidsString = "[" + (vertexRids.join(", "))+"]";

    var queryString = "select expand(unionAll($new, $old)) let "+
    "$new = (select from ("+query+") "+
    ($scope.lastPage > 0 ? " skip " +$scope.lastPage * limit : "") +
    " limit "+limit+"), "+
    "$old = (SELECT FROM "+vertexRidsString+")";

    appendQuery(queryString, -1);
    $scope.lastPage++;
  }


  $scope.submitRemoveQuery = function(){
    var limit = $("#querylimit").val();
    var query = $("#query").val();
    removeQuery(query, limit);
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

  var appendQuery = function(query, limit) {
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
          appendGraph(data)
        },
        error: function (jqXHR, textStatus, errorThrown){
          alert(jqXHR.responseJSON.errors[0].content);
        }
      });
  }

  var removeQuery = function(query, limit) {
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
          $scope.removeElements(data.graph.vertices);
          $scope.removeElements(data.graph.edges);
        },
        error: function (jqXHR, textStatus, errorThrown){
          alert(jqXHR.responseJSON.errors[0].content);
        }
      });
  }


  var nodes, edges;


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

    nodes = new vis.DataSet(nodeElems);

    // create an array with edges
    edges = new vis.DataSet(edgeElems);

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
      // ,
      // edges: {
      //   smooth: {
      //     type:'continuous'
      //   }
      // }
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


  var appendGraph = function(jsonData){
    if(jsonData.graph.vertices.length==0){
      return;
    }
    for(var v in jsonData.graph.vertices){
      var vData = jsonData.graph.vertices[v];
      if(lastResultSet[vData["@rid"]]){
        continue;
      }
      lastResultSet[vData["@rid"]] = vData;
      nodes.add({
        id: vData["@rid"],
        label: vData.name,
        group: vData["@class"]
      });
    }

    for(var e in jsonData.graph.edges){
      var eData = jsonData.graph.edges[e];
      if(lastResultSet[eData["@rid"]]){
        continue;
      }
      lastResultSet[eData["@rid"]] = eData;
      edges.add({
        id: eData["@rid"],
        from: eData["from"],
        to: eData["to"],
        arrows:'to',
        color: getColorFor(eData["@class"])
      });
    }

    $scope.reactivatePhysics();
  }

  $scope.removeElements = function(data){
    if(!data){
      return;
    }
    for(var i in data){
      lastResultSet[data[i]['@rid']] = null;
      nodes.remove({id: data[i]['@rid']});
      edges.remove({id: data[i]['@rid']});
    }
  }

  $scope.removeElement = function(){
    if(!$scope.currentElement['@rid']){
      return;
    }
    lastResultSet[$scope.currentElement['@rid']] = null;
    nodes.remove({id: $scope.currentElement['@rid']});
    edges.remove({id: $scope.currentElement['@rid']});
    $scope.currentElement = {}
  }




  $scope.infoPanelHint = "Click on a graph element (vertex or edge) to display data here";
  $scope.currentElement = {};
  $scope.currentElementEdgeTypes = [];

  $scope.sampleQueries = [
    {
      key: "Some people",
      value: "select from Character\n"+
      "/* \n"+
      "Click '...More' to load more characters \n"+
      "Or change the query and click '+ Add Result' to add other information to the graph \n"+
      "*/\n"
    },
    {
      key: "Some Animals",
      value: "select from Animal"
    },
    {
      key: "All the Lannisters",
      value: "select from Character where name like '%Lannister'"
    },
    {
      key: "Random people, animals and battles together",
      value: "select expand(unionAll($a, $b, $c) )\n"+
      "let \n"+
      "$a = (select * from animal),\n"+
      "$b = (select from Character limit 20),\n"+
      "$c = (select from Battle limit 20)\n"+
      "limit 100"
    },
    {
      key: "People killed by a character",
      value: "MATCH\n"+
      "{as:person} -KilledBy-> {class:Character, as:killer, where:(name = 'Daenerys Targaryen')} \n"+
      "RETURN $elements"
    },
    {
      key: "Shortest path between two people",
      value: "SELECT expand(path) from (\n" +
          "  SELECT shortestPath($a, $b, 'BOTH', 'Has_Family') as path\n" +
          "  let $a = (SELECT FROM Character where name = 'Eddard Stark'),\n" +
          "       $b = (SELECT FROM Character where name = 'Daenerys Targaryen')\n" +
          ")"
    },
    {
      key: "About weapons",
      value: "MATCH \n"+
        "{class:Sword, as:s} -- {as:any}\n"+
        "return $elements"
    }
  ]

  $scope.query = $scope.sampleQueries[0].value;


  $scope.bindQuery = function(value){
    for(var x in $scope.sampleQueries){
      if($scope.sampleQueries[x].key == value){
        $scope.query = $scope.sampleQueries[x].value;
        executeQuery($scope.query, $("#limit").val());
        return;
      }
    }
  }

  $( document ).ready($scope.submitQuery);

});
