import * as maptalks from 'maptalks'
import rbush from 'geojson-rbush'

const options = {}

export class SnapEndPoint extends maptalks.Class {
    constructor(options) {
        super(options)
        this.tree = rbush()
        this._distance = 10
    }

    setLayer(layer) {
        if (layer instanceof maptalks.VectorLayer) {
            this.snaplayer = layer
            this._addToMap(layer.map)
            this.snaplayer.on('addgeo', () => this._updateGeosSet(), this)
            this.snaplayer.on('clear', () => this._resetGeosSet(), this)
            this._mousemoveLayer.bringToFront()
            this.bindDrawTool(layer.map._map_tool)
        }
        return this
    }

    bindDrawTool(drawTool) {
        if (drawTool instanceof maptalks.DrawTool) {
            this._drawTool = drawTool
            drawTool.on('enable', (e) => this.enable(), this)
            drawTool.on('disable', (e) => this.disable(), this)
            drawTool.on('remove', (e) => this.remove(), this)
            if (drawTool.isEnabled()) this.enable()
        }
    }

    enable() {
        this._updateGeosSet()
        this._registerMapEvents()
        this._registerDrawToolEvents()
        this._mousemoveLayer.show()
        return this
    }

    disable() {
        const map = this._map
        map.off('mousemove touchstart', this._mousemove, this)
        map.off('mousedown', this._mousedown, this)
        map.off('mouseup', this._mouseup, this)

        const drawTool = this._drawTool
        drawTool.off('drawstart', (e) => this._resetCoordsAndPoint(e), this)
        drawTool.off('mousemove', (e) => this._resetCoordinates(e.target._geometry), this)
        drawTool.off('drawvertex', (e) => this._resetCoordsAndPoint(e), this)
        drawTool.off('drawend', (e) => this._resetCoordinates(e.geometry), this)

        delete this._mousemove
        delete this._mousedown
        delete this._mouseup
        this._mousemoveLayer.hide()
        this._resetGeosSet()
        return this
    }

    remove() {
        this.disable()
        this._marker.remove()
        this._mousemoveLayer.remove()
        delete this._marker
        delete this._mousemoveLayer
    }

    _addToMap(map) {
        const layerName = `${maptalks.INTERNAL_LAYER_PREFIX}_snapendpoint`
        this._mousemoveLayer = new maptalks.VectorLayer(layerName).addTo(map)
        this._map = map
        this._resetGeosSet()
        return this
    }

    _updateGeosSet() {
        const geometries = this.snaplayer.getGeometries()
        let geos = []
        geometries.forEach((geo) => geos.push(...this._parserToPoints(geo)))
        this._geosSet = geos
    }

    _parserToPoints(geo) {
        const type = geo.getType()
        let coordinates =
            type === 'Circle' || type === 'Ellipse' ? geo.getShell() : geo.getCoordinates()
        let geos = []
        const isPolygon = coordinates[0] instanceof Array
        if (isPolygon) coordinates.forEach((coords) => geos.push(...this._createMarkers(coords)))
        if (!isPolygon) {
            const isPoint = coordinates instanceof Array
            if (!isPoint) coordinates = [coordinates]
            geos.push(...this._createMarkers(coordinates))
        }
        return geos
    }

    _createMarkers(coords) {
        const markers = []
        coords.forEach((coord) =>
            markers.push(new maptalks.Marker(coord, { properties: {} }).toGeoJSON())
        )
        return markers
    }

    _resetGeosSet() {
        this._geosSet = []
    }

    _registerMapEvents() {
        if (!this._mousemove) {
            const map = this._map
            this._mousemove = (e) => this._mousemoveEvents(e)
            this._mousedown = () => (this._needFindGeometry = false)
            this._mouseup = () => (this._needFindGeometry = true)
            map.on('mousemove touchstart', this._mousemove, this)
            map.on('mousedown', this._mousedown, this)
            map.on('mouseup', this._mouseup, this)
        }
    }

    _mousemoveEvents(event) {
        const { coordinate } = event
        this._mousePoint = coordinate

        const hasMarler = !!this._marker
        if (hasMarler) this._marker.setCoordinates(coordinate)
        if (!hasMarler)
            this._marker = new maptalks.Marker(coordinate, {
                symbol: {}
            }).addTo(this._mousemoveLayer)

        this._updateSnapPoint(coordinate)
    }

    _updateSnapPoint(coordinate) {
        if (this._needFindGeometry) {
            const availGeometries = this._findGeometry(coordinate)

            this.snapPoint =
                availGeometries.features.length > 0 ? this._getSnapPoint(availGeometries) : null

            if (this.snapPoint) {
                const { x, y } = this.snapPoint
                this._marker.setCoordinates([x, y])
            }
        }
    }

    _findGeometry(coordinate) {
        if (this._geosSet) {
            const features = this._geosSet
            this.tree.clear()
            this.tree.load({ type: 'FeatureCollection', features })
            this.inspectExtent = this._createInspectExtent(coordinate)
            const availGeometries = this.tree.search(this.inspectExtent)
            return availGeometries
        }
        return null
    }

    _createInspectExtent(coordinate) {
        const distance = this._distance
        const map = this._map
        const zoom = map.getZoom()
        const { x, y } = map.coordinateToPoint(coordinate, zoom)
        const lefttop = map.pointToCoordinate(
            new maptalks.Point([x - distance, y - distance]),
            zoom
        )
        const righttop = map.pointToCoordinate(
            new maptalks.Point([x + distance, y - distance]),
            zoom
        )
        const leftbottom = map.pointToCoordinate(
            new maptalks.Point([x - distance, y + distance]),
            zoom
        )
        const rightbottom = map.pointToCoordinate(
            new maptalks.Point([x + distance, y + distance]),
            zoom
        )
        return {
            type: 'Feature',
            properties: {},
            geometry: {
                type: 'Polygon',
                coordinates: [
                    [
                        [lefttop.x, lefttop.y],
                        [righttop.x, righttop.y],
                        [rightbottom.x, rightbottom.y],
                        [leftbottom.x, leftbottom.y]
                    ]
                ]
            }
        }
    }

    _getSnapPoint(availGeometries) {
        const { geoObject } = this._findNearestGeometries(availGeometries.features)
        const { coordinates } = geoObject.geometry
        const snapPoint = {
            x: coordinates[0],
            y: coordinates[1]
        }
        return snapPoint
    }

    _findNearestGeometries(features) {
        let geoObjects = this._setDistance(features)
        geoObjects = geoObjects.sort(this._compare(geoObjects, 'distance'))
        return geoObjects[0]
    }

    _setDistance(features) {
        const geoObjects = []
        features.forEach((feature) => {
            const distance = this._distToPoint(feature)
            geoObjects.push({
                geoObject: feature,
                distance
            })
        })
        return geoObjects
    }

    _distToPoint(feature) {
        const { x, y } = this._mousePoint
        const from = [x, y]
        const to = feature.geometry.coordinates
        return Math.sqrt(Math.pow(from[0] - to[0], 2) + Math.pow(from[1] - to[1], 2))
    }

    _compare(data, propertyName) {
        return (object1, object2) => {
            const value1 = object1[propertyName]
            const value2 = object2[propertyName]
            return value2 < value1
        }
    }

    _registerDrawToolEvents() {
        const drawTool = this._drawTool
        drawTool.on('drawstart', (e) => this._resetCoordsAndPoint(e), this)
        drawTool.on('mousemove', (e) => this._resetCoordinates(e.target._geometry), this)
        drawTool.on('drawvertex', (e) => this._resetCoordsAndPoint(e), this)
        drawTool.on('drawend', (e) => this._resetCoordinates(e.geometry), this)
    }

    _resetCoordsAndPoint(e) {
        this._resetCoordinates(e.target._geometry)
        this._resetClickPoint(e.target._clickCoords)
    }

    _resetCoordinates(geometry) {
        if (this.snapPoint) {
            const { x, y } = this.snapPoint
            const coords = geometry.getCoordinates()
            const { length } = coords
            coords[length - 1].x = x
            coords[length - 1].y = y
            geometry.setCoordinates(coords)
            return geometry
        }
    }

    _resetClickPoint(clickCoords) {
        if (this.snapPoint) {
            const { x, y } = this.snapPoint
            const { length } = clickCoords
            clickCoords[length - 1].x = x
            clickCoords[length - 1].y = y
        }
    }
}

SnapEndPoint.mergeOptions(options)
