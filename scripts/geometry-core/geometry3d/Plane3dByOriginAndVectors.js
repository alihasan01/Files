"use strict";
/*---------------------------------------------------------------------------------------------
* Copyright (c) 2018 Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
/** @module CartesianGeometry */
const Point3dVector3d_1 = require("./Point3dVector3d");
const Geometry_1 = require("../Geometry");
/**
 * A Point3dVector3dVector3d is an origin and a pair of vectors.
 * This defines a plane with (possibly skewed) uv coordinates
 */
class Plane3dByOriginAndVectors {
    constructor(origin, vectorU, vectorV) {
        this.origin = origin;
        this.vectorU = vectorU;
        this.vectorV = vectorV;
    }
    static createOriginAndVectors(origin, vectorU, vectorV, result) {
        if (result) {
            result.origin.setFrom(origin);
            result.vectorU.setFrom(vectorU);
            result.vectorV.setFrom(vectorV);
            return result;
        }
        return new Plane3dByOriginAndVectors(origin.clone(), vectorU.clone(), vectorV.clone());
    }
    /**
     * Return a Plane3dByOriginAndVectors, with
     * * irigin is the translation (aka origin) from the Transform
     * * vectorU is the X column of the transform
     * * vectorV is the Y column of the transform.
     * @param transform source trnasform
     * @param xLength optional length to impose on vectorU.
     * @param yLength optional length to impose on vectorV.
     * @param result optional preexisting result
     */
    static createFromTransformColumnsXYAndLengths(transform, xLength, yLength, result) {
        if (result) {
            result.origin.setFrom(transform.getOrigin());
            transform.matrix.columnX(result.vectorU);
            transform.matrix.columnY(result.vectorV);
        }
        else {
            result = new Plane3dByOriginAndVectors(transform.getOrigin(), transform.matrix.columnX(), transform.matrix.columnY());
        }
        if (xLength !== undefined)
            result.vectorU.scaleToLength(xLength, result.vectorU);
        if (yLength !== undefined)
            result.vectorV.scaleToLength(yLength, result.vectorV);
        return result;
    }
    /** Capture origin and directions in a new planed. */
    static createCapture(origin, vectorU, vectorV, result) {
        if (!result)
            return new Plane3dByOriginAndVectors(origin, vectorU, vectorV);
        result.origin = origin;
        result.vectorU = vectorU;
        result.vectorV = vectorV;
        return result;
    }
    setOriginAndVectorsXYZ(x0, y0, z0, ux, uy, uz, vx, vy, vz) {
        this.origin.set(x0, y0, z0);
        this.vectorU.set(ux, uy, uz);
        this.vectorV.set(vx, vy, vz);
        return this;
    }
    setOriginAndVectors(origin, vectorU, vectorV) {
        this.origin.setFrom(origin);
        this.vectorU.setFrom(vectorU);
        this.vectorV.setFrom(vectorV);
        return this;
    }
    static createOriginAndVectorsXYZ(x0, y0, z0, ux, uy, uz, vx, vy, vz, result) {
        if (result)
            return result.setOriginAndVectorsXYZ(x0, y0, z0, ux, uy, uz, vx, vy, vz);
        return new Plane3dByOriginAndVectors(Point3dVector3d_1.Point3d.create(x0, y0, z0), Point3dVector3d_1.Vector3d.create(ux, uy, uz), Point3dVector3d_1.Vector3d.create(vx, vy, vz));
    }
    /** Define a plane by three points in the plane.
     * @param origin origin for the parameterization.
     * @param targetU target point for the vectorU starting at the origin.
     * @param targetV target point for the vectorV originating at the origin.
     * @param result optional result.
     */
    static createOriginAndTargets(origin, targetU, targetV, result) {
        return Plane3dByOriginAndVectors.createOriginAndVectorsXYZ(origin.x, origin.y, origin.z, targetU.x - origin.x, targetU.y - origin.y, targetU.z - origin.z, targetV.x - origin.x, targetV.y - origin.y, targetV.z - origin.z, result);
    }
    /** Create a plane with origin at 000, unit vectorU in x direction, and unit vectorV in the y direction.
     */
    static createXYPlane(result) {
        return Plane3dByOriginAndVectors.createOriginAndVectorsXYZ(0, 0, 0, 1, 0, 0, 0, 1, 0, result);
    }
    /** create a plane from data presented as Float64Arrays.
     * @param origin x,y,z of origin.
     * @param vectorU x,y,z of vectorU
     * @param vectorV x,y,z of vectorV
     */
    static createOriginAndVectorsArrays(origin, vectorU, vectorV, result) {
        return Plane3dByOriginAndVectors.createOriginAndVectorsXYZ(origin[0], origin[1], origin[2], vectorU[0], vectorU[1], vectorU[2], vectorV[0], vectorV[1], vectorV[2], result);
    }
    /** create a plane from data presented as Float64Array with weights
     * @param origin x,y,z,w of origin.
     * @param vectorU x,y,z,w of vectorU
     * @param vectorV x,y,z,w of vectorV
     */
    static createOriginAndVectorsWeightedArrays(originw, vectorUw, vectorVw, result) {
        const w = originw[3];
        result = Plane3dByOriginAndVectors.createXYPlane(result);
        if (Geometry_1.Geometry.isSmallMetricDistance(w))
            return result;
        const dw = 1.0 / w;
        const au = vectorUw[3] * dw * dw;
        const av = vectorVw[3] * dw * dw;
        // for homogeneous function X, with w its weight:
        // (X/w) is the cartesian point.
        // (X/w)' = (X' w - X w')/(w*w)
        //        = X'/w  - (X/w)(w'/w)
        //        = X'/w  - X w'/w^2)
        // The w parts of the formal xyzw sums are identically 0.
        // Here the X' and its w' are taken from each vectorUw and vectorVw
        result.origin.set(originw[0] * dw, originw[1] * dw, originw[2] * dw);
        Point3dVector3d_1.Vector3d.createAdd2ScaledXYZ(vectorUw[0], vectorUw[1], vectorUw[2], dw, originw[0], originw[1], originw[2], -au, result.vectorU);
        Point3dVector3d_1.Vector3d.createAdd2ScaledXYZ(vectorVw[0], vectorVw[1], vectorVw[2], dw, originw[0], originw[1], originw[2], -av, result.vectorV);
        return result;
    }
    /**
     * Evaluate a point a grid coordinates on the plane.
     * * The computed point is `origin + vectorU * u + vectorV * v`
     * @param u coordinate along vectorU
     * @param v coordinate along vectorV
     * @param result optional result destination.
     * @returns Return the computed coordinate.
     */
    fractionToPoint(u, v, result) {
        return this.origin.plus2Scaled(this.vectorU, u, this.vectorV, v, result);
    }
    fractionToVector(u, v, result) {
        return Point3dVector3d_1.Vector3d.createAdd2Scaled(this.vectorU, u, this.vectorV, v, result);
    }
    setFromJSON(json) {
        if (!json || !json.origin || !json.vectorV) {
            this.origin.set(0, 0, 0);
            this.vectorU.set(1, 0, 0);
            this.vectorV.set(0, 1, 0);
        }
        else {
            this.origin.setFromJSON(json.origin);
            this.vectorU.setFromJSON(json.vectorU);
            this.vectorV.setFromJSON(json.vectorV);
        }
    }
    /**
     * Convert an Angle to a JSON object.
     * @return {*} [origin,normal]
     */
    toJSON() {
        return {
            origin: this.origin.toJSON(),
            vectorU: this.vectorU.toJSON(),
            vectorV: this.vectorV.toJSON(),
        };
    }
    static fromJSON(json) {
        const result = Plane3dByOriginAndVectors.createXYPlane();
        result.setFromJSON(json);
        return result;
    }
    isAlmostEqual(other) {
        return this.origin.isAlmostEqual(other.origin)
            && this.vectorU.isAlmostEqual(other.vectorU)
            && this.vectorV.isAlmostEqual(other.vectorV);
    }
}
exports.Plane3dByOriginAndVectors = Plane3dByOriginAndVectors;
//# sourceMappingURL=Plane3dByOriginAndVectors.js.map