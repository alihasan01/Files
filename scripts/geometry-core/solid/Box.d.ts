/** @module Solid */
import { Point3d, Vector3d } from "../geometry3d/Point3dVector3d";
import { Matrix3d } from "../geometry3d/Matrix3d";
import { Range3d } from "../geometry3d/Range";
import { Transform } from "../geometry3d/Transform";
import { GeometryQuery } from "../curve/GeometryQuery";
import { SolidPrimitive } from "./SolidPrimitive";
import { GeometryHandler } from "../geometry3d/GeometryHandler";
import { CurveCollection } from "../curve/CurveCollection";
import { LineString3d } from "../curve/LineString3d";
/**
 */
export declare class Box extends SolidPrimitive {
    private _localToWorld;
    private _baseX;
    private _baseY;
    private _topX;
    private _topY;
    protected constructor(map: Transform, baseX: number, baseY: number, topX: number, topY: number, capped: boolean);
    clone(): Box;
    /** Return a coordinate frame (right handed unit vectors)
     * * origin lower left of box
     * * x direction on base rectangle x edge
     * * y direction in base rectangle
     * * z direction perpenedicular
     */
    getConstructiveFrame(): Transform | undefined;
    tryTransformInPlace(transform: Transform): boolean;
    cloneTransformed(transform: Transform): Box | undefined;
    /**
     * @param baseOrigin Origin of base rectangle
     * @param vectorX  Direction for base rectangle
     * @param vectorY Direction for base rectangle
     * @param topOrigin origin of top rectangle
     * @param baseX size factor for base rectangle (multiplies vectorX)
     * @param baseY size factor for base rectangle (multiplies vectorY)
     * @param topX size factor for top rectangle (multiplies vectorX)
     * @param topY size factor for top rectangle (multiplies vectorY)
     * @param capped true to define top and bottom closure caps
     */
    static createDgnBox(baseOrigin: Point3d, vectorX: Vector3d, vectorY: Vector3d, topOrigin: Point3d, baseX: number, baseY: number, topX: number, topY: number, capped: boolean): Box | undefined;
    /**
     * @param baseOrigin Origin of base rectangle
     * @param vectorX  Direction for base rectangle
     * @param vectorY Direction for base rectangle
     * @param topOrigin origin of top rectangle
     * @param baseX size factor for base rectangle (multiplies vectorX)
     * @param baseY size factor for base rectangle (multiplies vectorY)
     * @param topX size factor for top rectangle (multiplies vectorX)
     * @param topY size factor for top rectangle (multiplies vectorY)
     * @param capped true to define top and bottom closure caps
     */
    static createDgnBoxWithAxes(baseOrigin: Point3d, axes: Matrix3d, topOrigin: Point3d, baseX: number, baseY: number, topX: number, topY: number, capped: boolean): Box | undefined;
    /**
     * @param range range corners Origin of base rectangle
     * @param capped true to define top and bottom closure caps
     */
    static createRange(range: Range3d, capped: boolean): Box | undefined;
    getBaseX(): number;
    getBaseY(): number;
    getTopX(): number;
    getTopY(): number;
    getBaseOrigin(): Point3d;
    getTopOrigin(): Point3d;
    getVectorX(): Vector3d;
    getVectorY(): Vector3d;
    getVectorZ(): Vector3d;
    isSameGeometryClass(other: any): boolean;
    isAlmostEqual(other: GeometryQuery): boolean;
    dispatchToGeometryHandler(handler: GeometryHandler): any;
    strokeConstantVSection(zFraction: number): LineString3d;
    constantVSection(zFraction: number): CurveCollection;
    extendRange(range: Range3d, transform?: Transform): void;
}
//# sourceMappingURL=Box.d.ts.map