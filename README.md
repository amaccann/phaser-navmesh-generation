# phaser-navmesh-generation

### Warning: this plugin is still heavy Work in Progress (WIP). It's possibly not stable enough for use in a production product - use at your own risk (for now!) 

This Phaser plugin generates Navigation Meshes from supplied `Phaser.TilemapLayer` data and collison indices thereof. Contains configuration options

#### Current version: `0.2.2`

### Getting Started:

#### ES6 / Node

import it as you would any other module & include it as a `ScenePlugin` within your game's configuration object:

```
import NavMeshPlugin from 'phaser-navmesh-generation';

const game = {
  // ...
  // other Game config values ...
  // ...
  plugins: {
    scene: [
      { key: 'NavMeshPlugin', plugin: NavMeshPlugin, mapping: 'navMeshPlugin' }
    ]
  },

```

#### Usage:

1. First, we need to generate a new navigation mesh based on the Tilemap / Tilelayer you want to use to calculate collision data from. Use the `mapping` value provided within your `Scene` to access the freshly injected plugin:


```
var navMesh = this.navMeshPlugin.buildFromTileLayer(tileMap, tileLayer, {
  collisionIndices: [1, 2, 3],
  midPointThreshold: 0,
  useMidPoint: false,
  debug: {
    hulls: false,
    navMesh: false,
    navMeshNodes: false,
    polygonBounds: false,
    aStarPath: false
  }
});
```
Params:
* `collisionIndices`: an `Array` of collision indices that your tilemap uses for collisions **(required)**
* `midPointThreshold`: a `Number` value telling how narrow a navmesh triangle needs to be before it's ignored during pathing (optional; default `0`)
* `timingInfo`: Show in the console how long it took to build the NavMesh - and search for paths (optional; default `false`)
* `useMidPoint`: a `Boolean` value on whether to include all triangle edge mid-points in calculating triangulation (optional; default: `true`)
* `offsetHullsBy`: a `Number` value to offset (expand) each hull cluster by. Useful to use a small value to prevent excessively parallel edges (optional; default: `0.1`)
* `debug`: various optional debug options to Render the stages of NavMesh calculation:
    * `hulls`: Every (recursive) 'chunk' of impassable tiles found on the tilemap
    * `navMesh`: Draw all the actual triangles generated for this navmesh
    * `navMeshNodes`: Draw all connections found between neighbouring triangles
    * `polygonBounds`: Draw the bonding radius between each navmesh triangle
    * `aStarPath`: Draw the aStar path found between points (WIP debug, will remove later) 

2. Then, to find a path between two `Phaser.Geom.Point` instances, call:
```
navMesh.getPath(position, destination, offset);
```
Params:
* `position` is a `Phaser.Geom.Point` of your starting _world_ position **(required)**
* `destination` is a `Phaser.Geom.Point` of the destination / end _world_ position **(required)**
* `offset` is an offset value to keep a distance (optional, default `0`) 

This method returns two useful pieces of data:

`path` an `Array` of Points that is the shortest path to your destination
`offsetPath` an `Array` containing the _offset_ path, relative to the `offset` value given in `getPath`


#### Other methods:
`const sprite = plugin.addSprite(x, y, width, height, refresh);`

Your map may have Sprites that act as impassable areas (houses, trees etc), and you can mark this area of the map using the above method

Params:
* `x` the Tile X location of the sprite **(required)**
* `y` the Tile Y location of the sprite **(required)**
* `width` the Width of the sprite, expressed as tile units **(required)**
* `height` the Height of the sprite, expressed as tile units **(required)**
* `refresh`: If you wish the navMesh to be re-calculated after removing the sprite (optional, default `true`)

Returns:
* The internal instance of the sprite; includes a `uuid` that can be used for later removal

`plugin.removeSprite(uuid, refresh);`

Params:
* `uuid`: the String UUID of the sprite you wish to remove **(required)**
* `refresh`: If you wish the navMesh to be re-calculated after removing the sprite (optional, default `true`)