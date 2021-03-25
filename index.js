import * as maptalks from 'maptalks'
import rbush from 'geojson-rbush'
import isEqual from 'lodash.isequal'
import differenceWith from 'lodash.differencewith'
import findIndex from 'lodash.findindex'
import includes from 'lodash.includes'
import flattenDeep from 'lodash.flattendeep'

const options = {
    mode: 'auto',
    distance: 10,
    needCtrl: false
}

export class Autoadsorb extends maptalks.Class {
    constructor(options) {
        super(options)
        this.tree = rbush()
        this._layerName = `${maptalks.INTERNAL_LAYER_PREFIX}_Autoadsorb`
        this._isEnable = false
        this._updateModeType()
        this._updateDistance()
        this._updateNeedCtrl()
    }

    setLayer(layer) {
        if (layer instanceof maptalks.VectorLayer) {
            const map = layer.map
            this._addTo(map)
            this.adsorblayer = layer
            this.adsorblayer.on('addgeo', () => this._updateGeosSet(), this)
            this.adsorblayer.on('clear', () => this._resetGeosSet(), this)
            this.bindDrawTool(map._map_tool)
        }
        return this
    }

    bindDrawTool(drawTool) {
        if (drawTool instanceof maptalks.DrawTool) {
            this.drawTool = drawTool
            drawTool.on('enable', (e) => this.enable(), this)
            drawTool.on('disable', (e) => this.disable(), this)
            drawTool.on('remove', (e) => this.remove(), this)
            if (drawTool.isEnabled()) this.enable()
        }
        return this
    }

    setGeometry(geometry) {
        if (geometry instanceof maptalks.Geometry) {
            const layer = geometry._layer
            const map = layer.map
            if (map._map_tool && map._map_tool instanceof maptalks.DrawTool)
                map._map_tool.disable()
            this._addTo(map)
            this.adsorblayer = layer
            this.bindGeometry(geometry)
        }
        return this
    }

    bindGeometry(geometry) {
        if (geometry instanceof maptalks.Geometry) {
            if (this.geometry) return this.setGeometry(geometry)
            this.geometry = geometry
            this.geometryCoords = geometry.getCoordinates()
            geometry.on('editstart', (e) => this.enable(), this)
            geometry.on('editend', (e) => this.disable(), this)
            geometry.on('remove', (e) => this.remove(), this)
            if (geometry.isEditing()) {
                geometry.endEdit()
                this.enable()
                geometry.startEdit()
            } else geometry.startEdit().endEdit()
        }
        return this
    }

    enable() {
        this._isEnable = true
        this._updateGeosSet()
        this._registerMapEvents()
        if (this.drawTool) this._registerDrawToolEvents()
        if (this.geometry) this._registerGeometryEvents()
        if (this._mousemoveLayer) this._mousemoveLayer.show()
        return this
    }

    disable() {
        this._isEnable = false
        this._offMapEvents()
        this._offDrawToolEvents()
        this._offGeometryEvents()
        this._resetGeosSet()

        delete this._mousemove
        delete this._mousedown
        delete this._mouseup
        if (this._mousemoveLayer) this._mousemoveLayer.hide()
        return this
    }

    isEnable() {
        return this._isEnable
    }

    toggleEnable() {
        return this._isEnable ? this.disable() : this.enable()
    }

    remove() {
        this.disable()
        const layer = map.getLayer(this._layerName)
        if (layer) layer.remove()
        delete this.geometry
        delete this.geometryCoords
        delete this._geosSetPoint
        delete this._geosSetLine
        delete this._mousemoveLayer
        delete this._assistLayers
    }

    setMode(mode) {
        this._updateModeType(mode)
        this._updateGeosSet()
        return this
    }

    getMode() {
        return this._mode
    }

    setDistance(distance) {
        this._updateDistance(distance)
        this._updateGeosSet()
        return this
    }

    getDistance() {
        return this._distance
    }

    needCtrl(need) {
        this._updateNeedCtrl(need)
        return this
    }

    setAssistGeosLayer(layerNames) {
        if (layerNames) {
            const map = this._map
            if (!(layerNames instanceof Array)) layerNames = [layerNames]
            const adsorb = this.adsorblayer.getId()
            const arr = layerNames.reduce((target, name) => {
                if (name === adsorb) return target
                const layer = map.getLayer(name)
                if (layer instanceof maptalks.VectorLayer)
                    target = [...target, name]
                return target
            }, [])
            if (arr.length > 0) this._assistLayers = arr
        } else this._assistLayers = undefined
        this._updateGeosSet()
        return this
    }

    _updateModeType(mode) {
        this._mode = mode || this.options['mode'] || options.mode
    }

    _updateDistance(distance) {
        distance = distance || this.options['distance'] || options.distance
        this._distance = Math.max(distance, 1)
    }

    _updateNeedCtrl(need) {
        need = need !== undefined ? need : this.options['needCtrl']
        need = need !== undefined ? need : options.needCtrl
        this._needCtrl = need
    }

    _addTo(map) {
        if (map.getLayer(this._layerName)) this.remove()
        this._mousemoveLayer = new maptalks.VectorLayer(this._layerName)
            .addTo(map)
            .bringToFront()
        this._map = map
        this._resetGeosSet()
        return this
    }

    _updateGeosSet() {
        const geometries = this._getGeosSet()
        const modeAuto = this._mode === 'auto'
        const modeVertux = this._mode === 'vertux'
        const modeBorder = this._mode === 'border'
        let geosPoint = []
        let geosLine = []
        geometries.forEach((geo) => {
            if (modeAuto || modeVertux)
                geosPoint.push(...this._parseToPoints(geo))
            if (modeAuto || modeBorder)
                this._parseToLines(geo).forEach((item) => {
                    if (item.geometry.type === 'Point') geosPoint.push(item)
                    else geosLine.push(item)
                })
        })
        this._geosSetPoint = geosPoint
        this._geosSetLine = geosLine
    }

    _getGeosSet() {
        let geos = this.adsorblayer.getGeometries()
        if (this._assistLayers)
            this._assistLayers.forEach((name) =>
                geos.push(...map.getLayer(name).getGeometries())
            )
        return geos
    }

    _parseToPoints(geo) {
        if (this._skipGeoSelf(geo)) return []
        let geos = []
        let coordinates = geo.getCoordinates()
        if (coordinates[0] instanceof Array)
            coordinates.forEach((coords) =>
                geos.push(...this._createMarkers(coords))
            )
        else {
            if (!(coordinates instanceof Array)) coordinates = [coordinates]
            geos.push(...this._createMarkers(coordinates))
        }
        return geos
    }

    _skipGeoSelf(geo) {
        if (this.geometry) {
            const coordsNow = geo.toGeoJSON().geometry.coordinates
            const coordsThis = this.geometry.toGeoJSON().geometry.coordinates
            return isEqual(coordsNow, coordsThis)
        }
        return false
    }

    _createMarkers(coords) {
        return flattenDeep(coords).map((coord) =>
            new maptalks.Marker(coord, { properties: {} }).toGeoJSON()
        )
    }

    _parseToLines(geo) {
        if (this._skipGeoSelf(geo)) return []
        let geos = []
        if (geo.type === 'Point') geos.push(geo.setProperties({}).toGeoJSON())
        else geos.push(...this._parsePolygonToLine(geo))
        return geos
    }

    _parsePolygonToLine(geo) {
        let coordinates = geo.getCoordinates()
        let geos = []
        if (coordinates instanceof Array) {
            switch (geo.type) {
                case 'MultiPolygon':
                    coordinates.forEach((coords) =>
                        coords.forEach((coordsItem) =>
                            geos.push(...this._createLine(coordsItem, geo))
                        )
                    )
                    break
                case 'Polygon':
                    coordinates.forEach((coords) =>
                        geos.push(...this._createLine(coords, geo))
                    )
                    break
                default:
                    geos.push(...this._createLine(coordinates, geo))
                    break
            }
        } else if (geo.type === 'Polygon') {
            let { options } = geo
            options.numberOfShellPoints = 300
            geo.setOptions(options)
            coordinates = geo.getShell()
            options.numberOfShellPoints = 60
            geo.setOptions(options)
            geos.push(...this._createMarkers(coordinates))
        }
        return geos
    }

    _createLine(coords, geo) {
        let lines = []
        for (let i = 0; i < coords.length - 1; i++) {
            const coordinates = [coords[i], coords[i + 1]]
            const feature = new maptalks.LineString(coordinates, {
                properties: { obj: geo }
            }).toGeoJSON()
            lines.push(feature)
        }
        return lines
    }

    _resetGeosSet() {
        this._geosSetPoint = []
        this._geosSetLine = []
    }

    _registerMapEvents() {
        if (!this._mousemove) {
            const map = this._map
            this._mousemove = (e) => this._mousemoveEvents(e)
            this._mousedown = () => {
                if (this.drawTool) this._needFindGeometry = false
                if (this.geometry) this._needFindGeometry = true
            }
            this._mouseup = () => {
                if (this.drawTool) this._needFindGeometry = true
                if (this.geometry) this._needFindGeometry = false
            }
            map.on('mousemove touchstart', this._mousemove, this)
            map.on('mousedown', this._mousedown, this)
            map.on('mouseup', this._mouseup, this)
        }
    }

    _offMapEvents() {
        const map = this._map
        if (this._mousemove)
            map.off('mousemove touchstart', this._mousemove, this)
        if (this._mousedown) map.off('mousedown', this._mousedown, this)
        if (this._mouseup) map.off('mouseup', this._mouseup, this)
    }

    _mousemoveEvents(e) {
        const { coordinate, domEvent } = e
        this._needDeal = true
        this._mousePoint = coordinate

        if (this._marker) this._marker.setCoordinates(coordinate)
        else
            this._marker = new maptalks.Marker(coordinate, {
                symbol: {}
            }).addTo(this._mousemoveLayer)

        this._updateAdsorbPoint(coordinate)
        if (this._needCtrl !== domEvent.ctrlKey || this._hasAddVertux)
            this.adsorbPoint = null
    }

    _updateAdsorbPoint(coordinate) {
        if (this._needFindGeometry) {
            const availGeos = this._findGeometry(coordinate)

            this.adsorbPoint =
                availGeos && availGeos.features.length > 0
                    ? this._getAdsorbPoint(availGeos)
                    : null

            if (this.adsorbPoint) {
                const { x, y } = this.adsorbPoint
                this._marker.setCoordinates([x, y])
            }
        }
    }

    _findGeometry(coordinate) {
        if (!this._geosSetPoint && !this._geosSetLine) return null
        let features = []
        if (this._geosSetPoint) {
            const geos = this._findAvailGeos(this._geosSetPoint, coordinate)
            features.push(...geos)
        }
        if (this._geosSetLine) {
            const geos = this._findAvailGeos(this._geosSetLine, coordinate)
            features.push(...geos)
        }
        return { type: 'FeatureCollection', features }
    }

    _findAvailGeos(features, coordinate) {
        this.tree.clear()
        this.tree.load({ type: 'FeatureCollection', features })
        const inspectExtent = this._createInspectExtent(coordinate)
        const availGeos = this.tree.search(inspectExtent)
        return availGeos.features
    }

    _createInspectExtent(coordinate) {
        const distance = Math.max(parseInt(this._distance, 0), 1)
        const _radius = this._map.pixelToDistance(0, distance)
        const circleFeature = new maptalks.Circle(coordinate, _radius, {
            properties: {}
        }).toGeoJSON()
        return circleFeature
    }

    _getAdsorbPoint(availGeos) {
        const nearestFeature = this._findNearestFeatures(availGeos.features)
        if (!nearestFeature) return null
        const { geoObject } = nearestFeature
        const { coordinates, type } = geoObject.geometry
        const coords0 = coordinates[0]
        switch (type) {
            case 'Point':
                return { x: coords0, y: coordinates[1] }
            case 'LineString':
                const nearestLine = this._setEquation(geoObject)
                const { A, B } = nearestLine
                const { x, y } = this._mousePoint
                if (A === 0) return { x, y: coords0[1] }
                else if (A === Infinity) return { x: coords0[0], y }
                else {
                    const k = B / A
                    const verticalLine = this._setVertiEquation(k)
                    return this._solveEquation(nearestLine, verticalLine)
                }
            default:
                return null
        }
    }

    _findNearestFeatures(features) {
        const geoObjects = this._setDistance(features)
        if (geoObjects.length === 0) return null
        const compare = (data, key) => (obj1, obj2) => obj2[key] < obj1[key]
        const [nearest] = geoObjects.sort(compare(geoObjects, 'distance'))
        return nearest
    }

    _setDistance(features) {
        const noPoint =
            features.findIndex(
                (feature) => feature.geometry.type === 'Point'
            ) === -1
        return features.reduce((target, geoObject, i) => {
            let distance
            switch (geoObject.geometry.type) {
                case 'Point':
                    distance = this._distToPoint(geoObject)
                    break
                case 'LineString':
                    if (noPoint) distance = this._distToPolyline(geoObject)
                    break
                default:
                    break
            }
            if (distance !== undefined)
                target = [...target, { geoObject, distance }]
            return target
        }, [])
    }

    _distToPoint(feature) {
        const { x, y } = this._mousePoint
        const start = [x, y]
        const end = feature.geometry.coordinates
        return Math.sqrt(
            Math.pow(start[0] - end[0], 2) + Math.pow(start[1] - end[1], 2)
        )
    }

    _distToPolyline(feature) {
        const { x, y } = this._mousePoint
        const { A, B, C } = this._setEquation(feature)
        const distance = Math.abs(
            (A * x + B * y + C) / Math.sqrt(Math.pow(A, 2) + Math.pow(B, 2))
        )
        return distance
    }

    _setEquation(geoObject) {
        const [start, end] = geoObject.geometry.coordinates
        const [startX, startY] = start
        const [endX, endY] = end
        let k = (startY - endY) / (startX - endX)
        k = k === -Infinity ? -k : k
        return {
            A: k,
            B: -1,
            C: startY - k * startX
        }
    }

    _setVertiEquation(k) {
        const { x, y } = this._mousePoint
        return {
            A: k,
            B: -1,
            C: y - k * x
        }
    }

    _solveEquation(equationW, equationU) {
        const A1 = equationW.A
        const B1 = equationW.B
        const C1 = equationW.C
        const A2 = equationU.A
        const B2 = equationU.B
        const C2 = equationU.C
        const x = (B1 * C2 - C1 * B2) / (A1 * B2 - A2 * B1)
        const y = (A1 * C2 - A2 * C1) / (B1 * A2 - B2 * A1)
        return { x, y }
    }

    _registerDrawToolEvents() {
        const drawTool = this.drawTool
        drawTool.on('drawstart', (e) => this._resetCoordsAndPoint(e), this)
        drawTool.on(
            'mousemove',
            (e) => this._resetCoordinates(e.target._geometry || e),
            this
        )
        drawTool.on('drawvertex', (e) => this._resetCoordsAndPoint(e), this)
        drawTool.on(
            'drawend',
            (e) => this._resetCoordinates(e.geometry || e),
            this
        )
    }

    _offDrawToolEvents() {
        if (this.drawTool) {
            const drawTool = this.drawTool
            drawTool.off('drawstart', (e) => this._resetCoordsAndPoint, this)
            drawTool.off('mousemove', (e) => this._resetCoordinates, this)
            drawTool.off('drawvertex', (e) => this._resetCoordsAndPoint, this)
            drawTool.off('drawend', (e) => this._resetCoordinates, this)
        }
    }

    _registerGeometryEvents() {
        const geometry = this.geometry
        geometry.on(
            'shapechange',
            (e) => this._setEditCoordinates(e.target),
            this
        )
        geometry.on(
            'editrecord',
            (e) => this._upGeoCoords(e.target.getCoordinates()),
            this
        )
    }

    _offGeometryEvents() {
        if (this.geometry) {
            const geometry = this.geometry
            geometry.off('shapechange', (e) => this._setEditCoordinates, this)
            geometry.off('editrecord', (e) => this._upGeoCoords, this)
        }
    }

    _resetCoordsAndPoint(e) {
        this._resetCoordinates(e.target._geometry || e)
        this._resetClickPoint(e.target._clickCoords)
    }

    _resetCoordinates(geo) {
        if (this.adsorbPoint) {
            const { x, y } = this.adsorbPoint
            if (geo instanceof maptalks.Geometry) {
                const coords = geo.getCoordinates()
                if (coords instanceof Array) {
                    const { length } = coords
                    if (length) {
                        coords[length - 1].x = x
                        coords[length - 1].y = y
                    }
                    geo.setCoordinates(coords)
                } else {
                    if (geo instanceof maptalks.Circle) {
                        const projection = this._map.getProjection()
                        const radius = projection.measureLength([
                            coords,
                            this.adsorbPoint
                        ])
                        geo.setRadius(radius)
                        geo.setCoordinates(projection.unproject(geo._pcenter))
                    }
                }
            }
        }
    }

    _resetClickPoint(clickCoords) {
        if (this.adsorbPoint) {
            if (
                clickCoords instanceof maptalks.Coordinate ||
                clickCoords instanceof Array
            ) {
                const point = this._map.coordToPoint(this.adsorbPoint)
                const { x, y } = this._map._pointToPrj(point)
                const { length } = clickCoords
                if (length) {
                    clickCoords[length - 1].x = x
                    clickCoords[length - 1].y = y
                } else {
                    clickCoords.x = x
                    clickCoords.y = y
                }
            }
        }
    }

    _setEditCoordinates(geo) {
        if (
            this.adsorbPoint &&
            this._needDeal &&
            this.geometry.type !== 'MultiPolygon'
        ) {
            const { x, y } = this.adsorbPoint
            if (this.geometryCoords instanceof Array) {
                const coordsOld0 = this.geometryCoords[0]
                if (!includes(coordsOld0, this.adsorbPoint)) {
                    const coords = geo.getCoordinates()
                    const coords0 = coords[0]

                    if (coords0 instanceof Array) {
                        const coordsNew = differenceWith(
                            coords0,
                            coordsOld0,
                            isEqual
                        )
                        if (coordsNew.length === 0) this._hasAddVertux = true
                        else {
                            const coordsIndex = findIndex(coords0, coordsNew[0])
                            const { length } = coords0
                            coords[0][coordsIndex].x = x
                            coords[0][coordsIndex].y = y
                            if (coordsIndex === 0) {
                                coords[0][length - 1].x = x
                                coords[0][length - 1].y = y
                            }
                        }
                    } else {
                        const coordsNew = differenceWith(
                            coords,
                            this.geometryCoords,
                            isEqual
                        )[0]
                        const coordsIndex = findIndex(coords, coordsNew)
                        coords[coordsIndex].x = x
                        coords[coordsIndex].y = y
                    }
                    this._needDeal = false
                    if (!this._hasAddVertux) {
                        this._upGeoCoords(coords)
                        geo.setCoordinates(this.geometryCoords)
                    }
                }
            } else {
                if (this.geometry instanceof maptalks.Circle) {
                    this._needDeal = false
                    const center = this.geometryCoords
                    const radius = this._map
                        .getProjection()
                        .measureLength([center, this.adsorbPoint])
                    geo.setRadius(radius)
                }
            }
        }
    }

    _upGeoCoords(coords) {
        this.geometryCoords = coords
        this._hasAddVertux = false
    }
}

Autoadsorb.mergeOptions(options)
