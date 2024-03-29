import combine from '@turf/combine'
import explode from '@turf/explode'
import flatten from '@turf/flatten'
import nearestPoint from '@turf/nearest-point'
import nearestPointOnLine from '@turf/nearest-point-on-line'
import polygonToLine from '@turf/polygon-to-line'
import rbush from 'geojson-rbush'
import difference from 'lodash.difference'
import differenceWith from 'lodash.differencewith'
import findIndex from 'lodash.findindex'
import isEqual from 'lodash.isequal'
import * as maptalks from 'maptalks'
import { shallowDiffCoords } from './utils'

const options = {
  layers: [],
  mode: 'auto',
  distance: 10,
  shellPoints: 60,
  needCtrl: false,
}

const cursorLayerName = `${maptalks.INTERNAL_LAYER_PREFIX}cxiaof_autoadsorb`

export class Autoadsorb extends maptalks.Class {
  constructor(options) {
    super(options)
    this._isEnable = false
    this._treePoints = rbush()
    this._treeLines = rbush()
  }

  setMode(mode) {
    this.options['mode'] = mode
    this._updateGeosSet()
    return this
  }

  getMode() {
    return this.options['mode']
  }

  setDistance(distance) {
    this.options['distance'] = distance
    this._updateGeosSet()
    return this
  }

  getDistance() {
    return this.options['distance']
  }

  refreshTargets() {
    this._updateGeosSet()
    return this
  }

  isEnable() {
    return this._isEnable
  }

  bindDrawTool(drawTool) {
    if (drawTool instanceof maptalks.DrawTool) {
      if (!this._map) this._addTo(drawTool.getMap())
      this._drawTool = drawTool
      drawTool.on('enable', this._enable, this)
      drawTool.on('disable', this._disable, this)
      if (drawTool.isEnabled()) this._enable()
    }
    return this
  }

  bindGeometry(geometry) {
    if (geometry instanceof maptalks.Geometry) {
      if (!this._map) this._addTo(geometry.getMap())
      this._disableMapTool()
      this._geometry = geometry
      this._geometryCoords = geometry.getCoordinates()
      geometry.on('editstart', this._enable, this)
      geometry.on('editend', this._disable, this)
      if (geometry.isEditing()) this._enable()
    }
    return this
  }

  remove() {
    this._disable()
    if (this._cursorLayer) this._cursorLayer.remove()
    delete this._treePoints
    delete this._treeLines
    delete this._geosSetPoint
    delete this._geosSetLine
    delete this._mousePoint
    delete this._adsorbPoint
    delete this._cursor
    delete this._cursorLayer
    delete this._drawTool
    delete this._map
  }

  _addTo(map) {
    this._map = map
    this._newCursorLayer()
  }

  _newCursorLayer() {
    this._cursorLayer = new maptalks.VectorLayer(cursorLayerName, {
      style: { symbol: this._getCursorSymbol() },
    })
    this._cursorLayer.addTo(this._map).bringToFront()
  }

  _getCursorSymbol(symbol) {
    return Object.assign(
      {
        markerType: 'ellipse',
        markerFill: '#fff',
        markerLineColor: '#272822',
        markerLineWidth: 2,
        markerWidth: 10,
        markerHeight: 10,
        opacity: 0.4,
      },
      symbol,
    )
  }

  _enable() {
    this._isEnable = true
    if (this._cursorLayer) this._cursorLayer.show()
    this._updateGeosSet()
    this._registerMapEvents()
    this._geometry
      ? this._registerGeometryEvents()
      : this._registerDrawToolEvents()
  }

  _updateGeosSet() {
    this._geosSetPoint = []
    this._geosSetLine = []
    const geos = this._getAllAssistGeos()
    if (['auto', 'vertux'].includes(this.options['mode'])) {
      this._geosSetPoint = this._parseToPoints(geos)
    }
    if (['auto', 'border'].includes(this.options['mode'])) {
      this._geosSetLine = this._parseToLines(geos)
    }
    this._updateRBushTree()
  }

  _getAllAssistGeos() {
    const assistLayers = this._getAssistLayers()
    let assistGeos = assistLayers.reduce(
      (target, layer) => target.concat(layer.getGeometries()),
      [],
    )
    if (this._geometry) assistGeos = difference(assistGeos, [this._geometry])
    return assistGeos
  }

  _getAssistLayers() {
    return this.options['layers'].reduce((target, layer) => {
      if (typeof layer === 'string') layer = this._map.getLayer(layer)
      if (layer instanceof maptalks.VectorLayer) target.push(layer)
      return target
    }, [])
  }

  _parseToPoints(geos) {
    let points = []
    geos.forEach((geo) => {
      if (geo instanceof maptalks.GeometryCollection) {
        points = points.concat(explode(geo.toGeoJSON()).features)
      } else {
        if (geo instanceof maptalks.Circle || geo instanceof maptalks.Ellipse) {
          geo = geo.copy()
          geo.setOptions(
            Object.assign(geo.options || {}, {
              numberOfShellPoints: this.options['shellPoints'],
            }),
          )
          points.push(this._getCenterFeature(geo))
        }
        points = points.concat(explode(geo.toGeoJSON()).features)
      }
    })
    return points
  }

  _getCenterFeature(geo) {
    return {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: geo.getCenter().toArray() },
      properties: {},
    }
  }

  _parseToLines(geos) {
    let lines = []
    geos = geos.filter(
      (geo) =>
        !(geo instanceof maptalks.Marker || geo instanceof maptalks.MultiPoint),
    )
    geos.forEach((geo) => {
      if (geo instanceof maptalks.LineString) {
        lines.push(geo.toGeoJSON())
      } else if (geo instanceof maptalks.MultiLineString) {
        lines = lines.concat(flatten(geo.toGeoJSON()).features)
      } else {
        if (geo instanceof maptalks.Circle || geo instanceof maptalks.Ellipse) {
          geo = geo.copy()
          geo.setOptions(
            Object.assign(geo.options || {}, {
              numberOfShellPoints: this.options['shellPoints'],
            }),
          )
        }
        lines = lines.concat(this._polygonToLine(geo.toGeoJSON()))
      }
    })
    return this._splitLines(lines)
  }

  _polygonToLine(feature) {
    const result = polygonToLine(feature)
    if (result.type === 'Feature') return flatten(result).features
    return result.features.reduce(
      (prev, cur) => prev.concat(flatten(cur).features),
      [],
    )
  }

  _splitLines(lines) {
    return lines.reduce((target, line) => {
      const coords = line.geometry.coordinates
      for (let i = 0; i < coords.length - 1; i++) {
        const coordinates = [coords[i], coords[i + 1]]
        target.push({
          type: 'Feature',
          geometry: { type: 'LineString', coordinates },
          properties: {},
        })
      }
      return target
    }, [])
  }

  _updateRBushTree() {
    this._treePoints.clear()
    this._treePoints.load({
      type: 'FeatureCollection',
      features: this._geosSetPoint,
    })
    this._treeLines.clear()
    this._treeLines.load({
      type: 'FeatureCollection',
      features: this._geosSetLine,
    })
  }

  _registerMapEvents() {
    this._needFindGeometry = !this._geometry
    this._map.on('mousedown', this._mapMousedown, this)
    this._map.on('mouseup', this._mapMouseup, this)
    this._map.on('mousemove', this._mapMousemove, this)
  }

  _mapMousedown() {
    if (this._geometry) this._needFindGeometry = true
  }

  _mapMouseup() {
    if (this._geometry) this._needFindGeometry = false
  }

  _mapMousemove({ coordinate, domEvent }) {
    this._mousePoint = coordinate

    if (this._cursor) {
      this._cursor.setCoordinates(coordinate)
    } else {
      this._cursor = new maptalks.Marker(coordinate)
      this._cursor.addTo(this._cursorLayer)
    }

    delete this._adsorbPoint
    if (this.options['needCtrl'] === domEvent.ctrlKey) {
      this._updateAdsorbPoint(coordinate)
    } else {
      this._resetCursorSymbol()
    }
  }

  _resetCursorSymbol() {
    this._cursor.setSymbol(this._getCursorSymbol())
  }

  _updateAdsorbPoint(coordinate) {
    if (!this._needFindGeometry) return this._resetCursorSymbol()

    const availGeos = this._findGeometry(coordinate)
    if (availGeos.length > 0) {
      this._adsorbPoint = this._getAdsorbPoint(availGeos)
    }
    if (this._adsorbPoint) {
      const { x, y } = this._adsorbPoint
      this._cursor.setCoordinates([x, y])
    } else {
      this._resetCursorSymbol()
    }
  }

  _findGeometry(coordinate) {
    let features = []
    if (this._geosSetPoint.length > 0) {
      const geos = this._findAvailGeos(this._treePoints, coordinate)
      features = features.concat(geos)
    }
    if (this._geosSetLine.length > 0) {
      const geos = this._findAvailGeos(this._treeLines, coordinate)
      features = features.concat(geos)
    }
    return features
  }

  _findAvailGeos(tree, coordinate) {
    const inspectExtent = this._createInspectExtent(coordinate)
    const availGeos = tree.search(inspectExtent)
    return availGeos.features
  }

  _createInspectExtent(coordinate) {
    const radius = this._map.pixelToDistance(0, this.options['distance'])
    const circle = new maptalks.Circle(coordinate, radius, {
      properties: {},
      numberOfShellPoints: this.options['shellPoints'],
    })
    return circle.toGeoJSON()
  }

  _getAdsorbPoint(features) {
    let nearestFeature
    const mousePoint = [this._mousePoint.x, this._mousePoint.y]
    const points = features.filter(
      (feature) => feature.geometry.type === 'Point',
    )
    if (points.length > 0) {
      nearestFeature = this._getNearestPoint(mousePoint, points)
      this._cursor.setSymbol(
        this._getCursorSymbol({
          markerFill: '#f5871f',
          markerLineColor: '#0078a8',
          opacity: 1,
        }),
      )
    } else {
      const lines = features.filter(
        (feature) => feature.geometry.type === 'LineString',
      )
      nearestFeature = this._getNearestPointOnLine(mousePoint, lines)
      this._cursor.setSymbol(
        this._getCursorSymbol({ markerLineColor: '#0078a8', opacity: 1 }),
      )
    }
    const [x, y] = nearestFeature.geometry.coordinates
    return { x, y }
  }

  _getNearestPoint(mousePoint, features) {
    return nearestPoint(mousePoint, { type: 'FeatureCollection', features })
  }

  _getNearestPointOnLine(mousePoint, features) {
    const multiLines = combine({ type: 'FeatureCollection', features })
    return nearestPointOnLine(multiLines, mousePoint)
  }

  _registerGeometryEvents() {
    this._dragCenterHandle = null
    this._geometry.on('handledragend', this._checkCenter, this)
    this._geometry.on('shapechange', this._setShadowCoordinates, this)
    this._geometry.on('editrecord', this._resetShadowCenter, this)
  }

  _checkCenter() {
    this._dragCenterHandle = !this._shapechange
  }

  _setShadowCoordinates(e) {
    this._shapechange = true
    if (!this._adsorbPoint) return
    const geometry = e.target
    if (geometry instanceof maptalks.Circle) {
      this._setShadowCircle(geometry)
    } else if (geometry instanceof maptalks.Ellipse) {
      this._setShadowEllipse(geometry)
    } else {
      if (this._draggingCenter()) return
      if (geometry instanceof maptalks.LineString) {
        this._setShadowLineString(geometry)
      } else {
        this._setShadowPolygon(geometry)
      }
    }
  }

  _draggingCenter() {
    return !(
      this._dragCenterHandle === null ||
      maptalks.Util.isNil(this._dragCenterHandle)
    )
  }

  _setShadowCircle(geo) {
    const radius = this._calcCircleRadius(geo)
    geo._editor._shadow.setRadius(radius)
  }

  _calcCircleRadius(geo) {
    const coords = geo.getCoordinates()
    return this._map.getProjection().measureLength([coords, this._adsorbPoint])
  }

  _setShadowEllipse(geo) {
    const [width, height] = this._calcEllipseSize(geo)
    geo._editor._shadow.setWidth(width).setHeight(height)
  }

  _calcEllipseSize(geo) {
    const coords = geo.getCoordinates()
    const { x, y } = this._adsorbPoint
    const width = this._map
      .getProjection()
      .measureLength([coords, { x, y: coords.y }])
    const height = this._map
      .getProjection()
      .measureLength([coords, { x: coords.x, y }])
    return [width * 2, height * 2]
  }

  _setShadowLineString(geo) {
    const coords = geo.getCoordinates()
    const coordsOld = this._geometryCoords
    const diffs = differenceWith(coords, coordsOld, shallowDiffCoords)
    if (diffs.length === 0) return
    const coordsIndex = findIndex(coords, diffs[0])
    coords[coordsIndex] = this._adsorbPoint
    geo._editor._shadow.setCoordinates(coords)
  }

  _setShadowPolygon(geo) {
    const coords = geo.getCoordinates()
    const coordsOld = this._geometryCoords
    const shapeIndex = this._getShapeIndex(coords)
    const coordsOldTarget = coordsOld[shapeIndex]
    const coordsTarget = coords[shapeIndex]
    const coordsDiffs = differenceWith(
      coordsTarget,
      coordsOldTarget,
      shallowDiffCoords,
    )
    if (coordsDiffs.length === 0) return
    const coordsIndex = findIndex(coordsTarget, coordsDiffs[0])
    coords[shapeIndex][coordsIndex] = this._adsorbPoint
    if (coordsIndex === 0)
      coords[shapeIndex][coordsTarget.length - 1] = this._adsorbPoint
    geo._editor._shadow.setCoordinates(coords)
  }

  _getShapeIndex(coords) {
    const coordsOld = this._geometryCoords
    const shapeDiffs = differenceWith(coords, coordsOld, isEqual)
    const shapeIndex = findIndex(coords, (item) => isEqual(item, shapeDiffs[0]))
    return shapeIndex
  }

  _resetShadowCenter(e) {
    delete this._shapechange
    const geometry = e.target
    if (this._adsorbPoint) {
      if (geometry instanceof maptalks.Marker) {
        geometry.setCoordinates(this._adsorbPoint)
      } else {
        if (this._dragCenterHandle) {
          const center = geometry.getCenter()
          const point = this._adsorbPoint
          const offset = [point.x - center.x, point.y - center.y]
          geometry.translate(...offset)
          geometry._editor._shadow.translate(...offset)
        }
      }
    }
    this._geometryCoords = geometry.getCoordinates()
    delete this._dragCenterHandle
  }

  _registerDrawToolEvents() {
    this._drawTool.on('drawstart drawvertex', this._resetCoordsAndPoint, this)
    this._drawTool.on('mousemove drawend', this._resetCoordinates, this)
  }

  _resetCoordsAndPoint(e) {
    this._resetCoordinates(e)
    this._resetClickPoint(e)
  }

  _resetCoordinates(e) {
    if (!this._adsorbPoint) return
    const {
      options: { mode },
      _geometry: geometry,
    } = e.target
    switch (mode) {
      case 'Point':
        geometry.setCoordinates(this._adsorbPoint)
        break
      case 'Rectangle':
        this._resetRectangle(geometry, e)
        break
      case 'Circle':
        e.type === 'drawstart'
          ? geometry.setCoordinates(this._adsorbPoint)
          : this._resetCircle(geometry)
        break
      case 'Ellipse':
        e.type === 'drawstart'
          ? geometry.setCoordinates(this._adsorbPoint)
          : this._resetEllipse(geometry)
        break
      default:
        this._resetCommon(geometry)
        break
    }
  }

  _resetRectangle(geo, e) {
    const coords = geo.getCoordinates()
    const { x, y } = this._adsorbPoint
    if (coords[0].length === 0) {
      const point = this._map.coordinateToPoint(this._adsorbPoint)
      e.geometry._firstClick = this._map._pointToPrj(point)
    } else {
      coords[0][1].x = x
      coords[0][2].x = x
      coords[0][2].y = y
      coords[0][3].y = y
      geo.setCoordinates(coords)
    }
  }

  _resetCircle(geo) {
    const radius = this._calcCircleRadius(geo)
    geo.setRadius(radius)
  }

  _resetEllipse(geo) {
    const [width, height] = this._calcEllipseSize(geo)
    geo.setWidth(width).setHeight(height)._updateCache()
  }

  _resetCommon(geo) {
    const coords = geo.getCoordinates()
    coords.pop()
    coords.push(this._adsorbPoint)
    geo.setCoordinates(coords)
  }

  _resetClickPoint(e) {
    if (!this._adsorbPoint) return
    const clickCoords = e.target._clickCoords
    const point = this._map.coordToPoint(this._adsorbPoint)
    clickCoords.pop()
    clickCoords.push(this._map._pointToPrj(point))
  }

  _disable() {
    this._isEnable = false
    if (this._cursorLayer) this._cursorLayer.hide()
    this._offMapEvents()
    this._geometry ? this._offGeometryEvents() : this._offDrawToolEvents()
    this._resetGeosSet()
    delete this._geometry
  }

  _offMapEvents() {
    delete this._needFindGeometry
    this._map.off('mousedown', this._mapMousedown, this)
    this._map.off('mousemove', this._mapMousemove, this)
    this._map.off('mouseup', this._mapMouseup, this)
  }

  _offGeometryEvents() {
    this._geometry.off('handledragend', this._checkCenter, this)
    this._geometry.off('shapechange', this._setShadowCoordinates, this)
    this._geometry.off('editrecord', this._resetShadowCenter, this)
  }

  _offDrawToolEvents() {
    this._drawTool.off('drawstart drawvertex', this._resetCoordsAndPoint, this)
    this._drawTool.off('mousemove drawend', this._resetCoordinates, this)
  }

  _resetGeosSet() {
    this._geosSetPoint = []
    this._geosSetLine = []
    this._updateRBushTree()
  }

  _disableMapTool() {
    if (this._map._map_tool) this._map._map_tool.disable()
  }
}

Autoadsorb.mergeOptions(options)
