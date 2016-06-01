var gameofgraphs = angular.module('gameofgraphs', []);

gameofgraphs.controller('GraphPanelController', function GraphPanelController($scope) {

  $scope.sampleQueries = [
    {
      key: "All the Lannisters",
      value: "select from Character where name like '%Lannister'"
    },
    {
      key: "Random people, animals and battles",
      value: "select expand(unionAll($a, $b, $c) )\n"+
      "let $a = (select * from animal),\n"+
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

  $scope.query = $scope.sampleQueries[1].value;


  $scope.bindQuery = function(value){
    for(var x in $scope.sampleQueries){
      if($scope.sampleQueries[x].key == value){
        $scope.query = $scope.sampleQueries[x].value;
        executeQuery($scope.query, $("#limit").val());
        return;
      }
    }
  }
});
