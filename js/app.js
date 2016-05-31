var gameofgraphs = angular.module('gameofgraphs', []);

gameofgraphs.controller('GraphPanelController', function GraphPanelController($scope) {
  $scope.query = "select expand(unionAll($a, $b, $c) )\n"+
  "let $a = (select * from animal),\n"+
  "$b = (select from Character limit 10),\n"+
  "$c = (select from Battle limit 10)\n"+
  "limit 100";


  $scope.sampleQueries = [
    {
      key: "Random people, animals and battles",
      value: "select expand(unionAll($a, $b, $c) )\n"+
      "let $a = (select * from animal),\n"+
      "$b = (select from Character limit 10),\n"+
      "$c = (select from Battle limit 10)\n"+
      "limit 100"
    },
    {
      key: "People killed by a character",
      value: "MATCH\n"+
      "{class:Character, as:killer, where:(name = 'Daenerys Targaryen')} <-KilledBy- {as:person}\n"+
      "RETURN $elements"
    }
  ]

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
