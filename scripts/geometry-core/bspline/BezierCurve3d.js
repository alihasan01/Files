"use strict";
/*---------------------------------------------------------------------------------------------
* Copyright (c) 2018 Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const Point2dVector2d_1 = require("../geometry3d/Point2dVector2d");
const Point3dVector3d_1 = require("../geometry3d/Point3dVector3d");
const Point4d_1 = require("../geometry4d/Point4d");
const Ray3d_1 = require("../geometry3d/Ray3d");
const Plane3dByOriginAndVectors_1 = require("../geometry3d/Plane3dByOriginAndVectors");
const StrokeOptions_1 = require("../curve/StrokeOptions");
const Geometry_1 = require("../Geometry");
const Angle_1 = require("../geometry3d/Angle");
const LineString3d_1 = require("../curve/LineString3d");
const BezierCurveBase_1 = require("./BezierCurveBase");
const BezierPolynomials_1 = require("../numerics/BezierPolynomials");
// ================================================================================================================
// ================================================================================================================
// ================================================================================================================
// ================================================================================================================
/** 3d Bezier curve class.
 * * Use BezierCurve3dH if the curve has weights.
 * * The control points (xyz) are managed as the _packedData buffer in the _polygon member of BezierCurveBase.
 */
class BezierCurve3d extends BezierCurveBase_1.BezierCurveBase {
    isSameGeometryClass(other) { return other instanceof BezierCurve3d; }
    tryTransformInPlace(transform) {
        const data = this._workData0;
        for (let i = 0; i < this._polygon.order; i++) {
            this._polygon.getPolygonPoint(i, data);
            transform.multiplyXYZToFloat64Array(data[0], data[1], data[2], data);
            this._polygon.setPolygonPoint(i, data);
        }
        return true;
    }
    /** Return a specific pole as a full `[x,y,z] Point3d` */
    getPolePoint3d(i, result) {
        const data = this._polygon.getPolygonPoint(i, this._workData0);
        if (data)
            return Point3dVector3d_1.Point3d.create(data[0], data[1], data[2], result);
        return undefined;
    }
    /** Return a specific pole as a full `[w*x,w*y,w*z, w] Point4d` */
    getPolePoint4d(i, result) {
        const data = this._polygon.getPolygonPoint(i, this._workData0);
        if (data)
            return Point4d_1.Point4d.create(data[0], data[1], data[2], 1.0, result);
        return undefined;
    }
    /**
     * Capture a polygon as the data for a new `BezierCurve3d`
     * @param polygon complete packed data and order.
     */
    constructor(polygon) {
        super(3, polygon);
        this._workRay0 = Ray3d_1.Ray3d.createXAxis();
        this._workRay1 = Ray3d_1.Ray3d.createXAxis();
    }
    /** Return poles as a linestring */
    copyPointsAsLineString() {
        const result = LineString3d_1.LineString3d.create();
        for (let i = 0; i < this._polygon.order; i++)
            result.addPoint(this.getPolePoint3d(i));
        return result;
    }
    /** Create a curve with given points.
     * * If input is `Point2d[]`, the points are promoted with `z=0` and `w=1`
     * * If input is `Point3d[]`, the points are promoted with w=1`
     *
     */
    static create(data) {
        if (data.length < 1)
            return undefined;
        const polygon = new Float64Array(data.length * 3);
        if (data[0] instanceof Point3dVector3d_1.Point3d) {
            let i = 0;
            for (const p of data) {
                polygon[i++] = p.x;
                polygon[i++] = p.y;
                polygon[i++] = p.z;
            }
            return new BezierCurve3d(polygon);
        }
        else if (data[0] instanceof Point2dVector2d_1.Point2d) {
            let i = 0;
            for (const p of data) {
                polygon[i++] = p.x;
                polygon[i++] = p.y;
                polygon[i++] = 0.0;
            }
            return new BezierCurve3d(polygon);
        }
        return undefined;
    }
    /** create a bezier curve of specified order, filled with zeros */
    static createOrder(order) {
        const polygonArray = new Float64Array(order * 3); // This is initialized to zeros!!
        return new BezierCurve3d(polygonArray);
    }
    /** Load order * 3 doubles from data[3 * spanIndex] as poles */
    loadSpanPoles(data, spanIndex) {
        this._polygon.loadSpanPoles(data, spanIndex);
    }
    clone() {
        return new BezierCurve3d(this._polygon.clonePolygon());
    }
    clonePartialCurve(f0, f1) {
        const partialCurve = new BezierCurve3d(this._polygon.clonePolygon());
        partialCurve._polygon.subdivideToIntervalInPlace(f0, f1);
        return partialCurve;
    }
    /**
     * Return a curve after transform.
     */
    cloneTransformed(transform) {
        const curve1 = this.clone();
        curve1.tryTransformInPlace(transform);
        return curve1;
    }
    /** Return a (deweighted) point on the curve. If deweight fails, returns 000 */
    fractionToPoint(fraction, result) {
        this._polygon.evaluate(fraction, this._workData0);
        return Point3dVector3d_1.Point3d.create(this._workData0[0], this._workData0[1], this._workData0[2], result);
    }
    /** Return the cartesian point and derivative vector. */
    fractionToPointAndDerivative(fraction, result) {
        this._polygon.evaluate(fraction, this._workData0);
        this._polygon.evaluateDerivative(fraction, this._workData1);
        return Ray3d_1.Ray3d.createXYZUVW(this._workData0[0], this._workData0[1], this._workData0[2], this._workData1[0], this._workData1[1], this._workData1[2], result);
    }
    /** Construct a plane with
     * * origin at the fractional position along the arc
     * * x axis is the first derivative, i.e. tangent along the arc
     * * y axis is the second derivative, i.e. in the plane and on the center side of the tangent.
     * If the arc is circular, the second derivative is directly towards the center
     */
    fractionToPointAnd2Derivatives(fraction, result) {
        const epsilon = 1.0e-8;
        const a = 1.0 / (2.0 * epsilon);
        if (!result)
            result = Plane3dByOriginAndVectors_1.Plane3dByOriginAndVectors.createXYPlane();
        const ray = this.fractionToPointAndDerivative(fraction, this._workRay0);
        result.origin.setFrom(ray.origin);
        result.vectorU.setFrom(ray.direction);
        const ray0 = this.fractionToPointAndDerivative(fraction - epsilon, this._workRay0);
        const ray1 = this.fractionToPointAndDerivative(fraction + epsilon, this._workRay1);
        Point3dVector3d_1.Vector3d.createAdd2Scaled(ray0.direction, -a, ray1.direction, a, result.vectorV);
        return result;
    }
    isAlmostEqual(other) {
        if (other instanceof BezierCurve3d) {
            return this._polygon.isAlmostEqual(other._polygon);
        }
        return false;
    }
    /**
     * Assess legnth and turn to determine a stroke count.
     * @param options stroke options structure.
     */
    strokeCount(options) {
        const data = this._polygon.packedData;
        let dx0 = data[3] - data[0];
        let dy0 = data[4] - data[1];
        let dz0 = data[5] - data[2];
        let dx1, dy1, dz1; // first differences of leading edge
        // let ex, ey, ez; // second differences.
        let sweepRadians = 0.0;
        let sumLength = Geometry_1.Geometry.hypotenuseXYZ(dx0, dy0, dz0);
        const n = data.length;
        for (let i = 6; i + 2 < n; i += 3) {
            dx1 = data[i] - data[i - 3];
            dy1 = data[i + 1] - data[i - 2];
            dz1 = data[i + 2] - data[i - 1];
            //        ex = dx1 - dx0; ey = dy1 - dy0; ez = dz1 - dz0;
            sweepRadians += Angle_1.Angle.radiansBetweenVectorsXYZ(dx0, dy0, dz0, dx1, dy1, dz1);
            sumLength += Geometry_1.Geometry.hypotenuseXYZ(dx1, dy1, dz1);
            dx0 = dx1;
            dy0 = dy1;
            dz0 = dz1;
        }
        const numPerSpan = StrokeOptions_1.StrokeOptions.applyAngleTol(options, StrokeOptions_1.StrokeOptions.applyMaxEdgeLength(options, 1, sumLength), sweepRadians, 0.2);
        return numPerSpan;
    }
    /**
     * convert to bspline curve and dispatch to handler
     * @param handler handelr to receive strongly typed geometry
     */
    dispatchToGeometryHandler(handler) {
        return handler.handleBezierCurve3d(this);
    }
    extendRange(rangeToExtend, transform) {
        const order = this.order;
        if (!transform) {
            this.allocateAndZeroBezierWorkData(order - 1, 0, 0);
            const bezier = this._workBezier;
            this.getPolePoint3d(0, this._workPoint0);
            rangeToExtend.extend(this._workPoint0);
            this.getPolePoint3d(order - 1, this._workPoint0);
            rangeToExtend.extend(this._workPoint0);
            for (let axisIndex = 0; axisIndex < 3; axisIndex++) {
                BezierPolynomials_1.BezierPolynomialAlgebra.componentDifference(bezier.coffs, this._polygon.packedData, 3, order, axisIndex);
                const roots = bezier.roots(0.0, true);
                if (roots) {
                    for (const r of roots) {
                        this.fractionToPoint(r, this._workPoint0);
                        rangeToExtend.extend(this._workPoint0);
                    }
                }
            }
        }
        else {
            this.allocateAndZeroBezierWorkData(order - 1, order, 0);
            const bezier = this._workBezier;
            const componentCoffs = this._workCoffsA; // to hold transformed copy of x,y,z in turn.
            this.getPolePoint3d(0, this._workPoint0);
            rangeToExtend.extendTransformedPoint(transform, this._workPoint0);
            this.getPolePoint3d(order - 1, this._workPoint0);
            rangeToExtend.extendTransformedPoint(transform, this._workPoint0);
            const data = this._polygon.packedData;
            for (let axisIndex = 0; axisIndex < 3; axisIndex++) {
                // apply one row of the transform to get the transformed coff by itself
                for (let i = 0, k = 0; i < order; i++, k += 3)
                    componentCoffs[i] = transform.multiplyComponentXYZ(axisIndex, data[k], data[k + 1], data[k + 2]);
                BezierPolynomials_1.BezierPolynomialAlgebra.univariateDifference(componentCoffs, bezier.coffs);
                const roots = bezier.roots(0.0, true);
                if (roots && roots.length > 0) {
                    for (const r of roots) {
                        this.fractionToPoint(r, this._workPoint0);
                        rangeToExtend.extendTransformedPoint(transform, this._workPoint0);
                    }
                }
            }
        }
    }
}
exports.BezierCurve3d = BezierCurve3d;
//# sourceMappingURL=BezierCurve3d.js.map