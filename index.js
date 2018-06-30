import * as maptalks from 'maptalks'
import rbush from 'geojson-rbush'

export class SnapEndPoint extends maptalks.Class {
    constructor(options) {
        super(options)
        this.tree = rbush()
    }
}
