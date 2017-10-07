# Changelog

## [0.2.1] - 07 Oct 2017

### Added
- Included support for 'sprites' to mark blocked areas of navMesh that isn't an explicit
collision tile. This can be accessed through `addSprite()` method of plugin (use `removeSprite` to remove the sprite by `uuid`
- Tilelayer data is now flattened from 2D Phaser format into 1D array; this makes it faster to iterate across the whole grid. 
- Added `updatedAt` timestamp to generated navMesh
- Added `createdAt` timestamp for generated paths

## [0.1.1] - 29 Sept 2017

### Added
- Added UUID and calculated polygons to the returned Pathing data.
- Included a `CHANGELOG.md`, the file you're reading right now ;-)

## [0.1.0] - 27 Sept 2017

### Added
- Config value to use the `midPoints` of all cluster edges during Delaunay calculation

### Changed

- Fixed issue with NPM package not working properly when imported from other projects