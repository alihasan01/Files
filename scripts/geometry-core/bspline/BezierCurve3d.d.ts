import { Point2d } from "../geometry3d/Point2dVector2d";
import { Point3d } from "../geometry3d/Point3dVector3d";
import { Point4d } from "../geometry4d/Point4d";
import { Transform } from "../geometry3d/Transform";
import { Ray3d } from "../geometry3d/Ray3d";
import { Plane3dByOriginAndVectors } from "../geometry3d/Plane3dByOriginAndVectors";
import { StrokeOptions } from "../curve/StrokeOptions";
import { GeometryHandler } from "../geometry3d/GeometryHandler";
import { LineString3d } from "../curve/LineString3d";
import { BezierCurveBase } from "./BezierCurveBase";
import { Range3d } from "../geometry3d/Range";
/** 3d Bezier curve class.
 * * Use BezierCurve3dH if the curve has weights.
 * * The control points (xyz) are managed as the _packedData buffer in the _polygon member of BezierCurveBase.
 */
export declare class BezierCurve3d extends BezierCurveBase {
    isSameGeometryClass(other: any): boolean;
    tryTransformInPlace(transform: Transform): boolean;
    private _workRay0;
    private _workRay1;
    /** Return a specific pole as a full `[x,y,z] Point3d` */
    getPolePoint3d(i: number, result?: Point3d): Point3d | undefined;
    /** Return a specific pole as a full `[w*x,w*y,w*z, w] Point4d` */
    getPolePoint4d(i: number, result?: Point4d): Point4d | undefined;
    /**
     * Capture a polygon as the data for a new `BezierCurve3d`
     * @param polygon complete packed data and order.
     */
    private constructor();
    /** Return poles as a linestring */
    copyPointsAsLineString(): LineString3d;
    /** Create a curve with given points.
     * * If input is `Point2d[]`, the points are promoted with `z=0` and `w=1`
     * * If input is `Point3d[]`, the points are promoted with w=1`
     *
     */
    static create(data: Point3d[] | Point2d[]): BezierCurve3d | undefined;
    /** create a bezier curve of specified order, filled with zeros */
    static createOrder(order: number): BezierCurve3d;
    /** Load order * 3 doubles from data[3 * spanIndex] as poles */
    loadSpanPoles(data: Float64Array, spanIndex: number): void;
    clone(): BezierCurve3d;
    clonePartialCurve(f0: number, f1: number): BezierCurve3d | undefined;
    /**
     * Return a curve after transform.
     */
    cloneTransformed(transform: Transform): BezierCurve3d;
    /** Return a (deweighted) point on the curve. If deweight fails, returns 000 */
    fractionToPoint(fraction: number, result?: Point3d): Point3d;
    /** Return the cartesian point and derivative vector. */
    fractionToPointAndDerivative(fraction: number, result?: Ray3d): Ray3d;
    /** Construct a plane with
     * * origin at the fractional position along the arc
     * * x axis is the first derivative, i.e. tangent along the arc
     * * y axis is the second derivative, i.e. in the plane and on the center side of the tangent.
     * If the arc is circular, the second derivative is directly towards the center
     */
    fractionToPointAnd2Derivatives(fraction: number, result?: Plane3dByOriginAndVectors): Plane3dByOriginAndVectors;
    isAlmostEqual(other: any): boolean;
    /**
     * Assess legnth and turn to determine a stroke count.
     * @param options stroke options structure.
     */
    strokeCount(options?: StrokeOptions): number;
    /**
     * convert to bspline curve and dispatch to handler
     * @param handler handelr to receive strongly typed geometry
     */
    dispatchToGeometryHandler(handler: GeometryHandler): any;
    extendRange(rangeToExtend: Range3d, transform?: Transform): void;
}
//# sourceMappingURL=BezierCurve3d.d.ts.map