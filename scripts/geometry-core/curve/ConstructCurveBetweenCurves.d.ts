/** @module Curve */
import { GeometryQuery } from "./GeometryQuery";
import { NullGeometryHandler } from "../geometry3d/GeometryHandler";
import { LineSegment3d } from "./LineSegment3d";
import { Arc3d } from "./Arc3d";
import { LineString3d } from "./LineString3d";
/**
 * Context for constructing a curve that is interpolated between two other curves.
 * * The only callable method is the static `InterpolateBetween`.
 * * Other methods are called only by `dispatchToGeometryHandler`
 */
export declare class ConstructCurveBetweenCurves extends NullGeometryHandler {
    private _geometry1;
    private _fraction;
    private constructor();
    /**
     * * To be directly called only by double displatcher
     * * Assumes this.geometry1 was set by calling context.
     * * Construct the interpoalted curve between this.geomtry1 and the supplied segment0.
     */
    handleLineSegment3d(segment0: LineSegment3d): any;
    /**
     * * To be directly called only by double displatcher
     * * Assumes this.geometry1 was set by calling context.
     * * Construct the interpoalted curve between this.geomtry1 and the supplied ls0.
     */
    handleLineString3d(ls0: LineString3d): any;
    /**
     * * To be directly called only by double displatcher
     * * Assumes this.geometry1 was set by calling context.
     * * Construct the interpoalted curve between this.geomtry1 and the supplied arc0.
     */
    handleArc3d(arc0: Arc3d): any;
    /**
     * Construct a geometry item which is fractionally interpolated btween two others.
     * * The construction is only supported between certain types:
     * * * LineSegment3d+LineSegment3d -- endpoints are interpolated
     * * * LineString3d+LineString3d with matching counts.  Each point is interpolated.
     * * * Arc3d+Arc3d -- center, vector0, vector90, and limit angles of the sweep are interpolated.
     * @param geometry0 geometry "at fraction 0"
     * @param fraction  fractional positon
     * @param geometry1 geometry "at fraction 1"
     */
    static InterpolateBetween(geometry0: GeometryQuery, fraction: number, geometry1: GeometryQuery): GeometryQuery | undefined;
}
//# sourceMappingURL=ConstructCurveBetweenCurves.d.ts.map