# phaser-navmesh-generation

### Warning: this plugin is still heavy Work in Progress (WIP). It's possibly not stable enough for use in a production product - use at your own risk (for now!) 

This Phaser plugin generates Navigation Meshes from supplied `Phaser.TilemapLayer` data and collison indices thereof. Contains configuration options

### Getting Started:

#### ES6 / NPM etc.

import it as you would any other project:

```
import NavMeshPlugin from '';
```

Then in your game:

```
  preload() {
    const { game } = this;
    this.plugin = game.plugins.add(NavMeshPlugin);
  }

```

#### Usage:

1. First, generate a new navigation mesh using the following method (options will be explained later)


```
this.navMesh = this.plugin.buildFromTileLayer(tileMap, tileLayer, {
  collisionIndices: [1, 2, 3],
  midPointThreshold: 0,
  debug: {
    hulls: false,
    hullBounds: false,
    navMesh: false,
    navMeshNodes: false,
    polygonBounds: false,
    aStarPath: false
  }
});
```
Params:
* `collisionIndices` an `Array` of collision indices that your tilemap uses for collisions **(required)**
* `midPointThreshold` a `Number` value telling how narrow a navmesh triangle needs to be before it's ignored during pathing (optional)
* `debug` various debug options to Render the stages of NavMesh calculation:
    * `hulls`: Every (recursive) 'chunk' of impassable tiles found on the tilemap
    * `hullBounds`: The bounding-box generated for each of these hull clusters
    * `navMesh`: Draw all the actual triangles generated for this navmesh
    * `navMeshNodes`: Draw all connections found between neighbouring triangles
    * `polygonBounds`: Draw the bonding radius between each navmesh triangle
    * `aStarPath`: Draw the aStar path found between points (WIP debug, will remove later) 

2. Then, to find a path between two `Phaser.Point` instances, call:
```
navMesh.getPath(position, destination, size);
```
Params:
* `position` is a `Phaser.Point` of your starting _world_ position **(required)**
* `destination` is a `Phaser.Point` of the destination / end _world_ position **(required)**
* `size` is an offset value to keep a distance (optional, default `0`) 
