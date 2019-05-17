"use strict";
/*---------------------------------------------------------------------------------------------
* Copyright (c) 2018 Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
/** @module Polyface */
// import { Geometry, AxisOrder, Angle, AngleSweep, BSIJSONValues } from "./Geometry";
const Polyface_1 = require("./Polyface");
const GrowableFloat64Array_1 = require("../geometry3d/GrowableFloat64Array");
const Point2dVector2d_1 = require("../geometry3d/Point2dVector2d");
const Point3dVector3d_1 = require("../geometry3d/Point3dVector3d");
const Transform_1 = require("../geometry3d/Transform");
const Matrix3d_1 = require("../geometry3d/Matrix3d");
const BoxTopology_1 = require("./BoxTopology");
const StrokeOptions_1 = require("../curve/StrokeOptions");
const CurveCollection_1 = require("../curve/CurveCollection");
const Geometry_1 = require("../Geometry");
const LineString3d_1 = require("../curve/LineString3d");
const Graph_1 = require("../topology/Graph");
const GeometryHandler_1 = require("../geometry3d/GeometryHandler");
/**
 *
 * * Simple construction for strongly typed GeometryQuery objects:
 *
 * ** Create a builder with `builder = PolyfaceBuilder.create()`
 * ** Add GeemotryQuery objects:
 *
 * *** `builder.addGeometryQuery(g: GeometryQuery)`
 * *** `builder.addCone(cone: Cone)`
 * *** `builder.addTorusPipe(surface: TorusPipe)`
 * *** `builder.addLinearSweepLineStrings(surface: LinearSweep)`
 * *** `builder.addRotationalSweep(surface: RotatationalSweep)`
 * *** `builder.addLinearSweep(surface: LinearSweep)`
 * *** `builder.addRuledSweep(surface: RuledSweep)`
 * *** `builder.addSphere(sphere: Sphere)`
 * *** `builder.addBox(box: Box)`
 * *** `buidler.addIndexedPolyface(polyface)`
 * **  Extract with `builder.claimPolyface (true)`
 *
 * * Simple construction for ephemeral constructive data:
 *
 * ** Create a builder with `builder = PolyfaceBuilder.create()`
 * ** Add from fragmentary data:
 *
 * *** `builder.addBetweenLineStrings (linestringA, linestringB, addClosure)`
 * *** `builder.addBetweenTransformedLineStrings (curves, transformA, transformB, addClosure)`
 * *** `builder.addBetweenStroked (curveA, curveB)`
 * *** `builder.addLinearSweepLineStrigns (contour, vector)`
 * *** `builder.addPolygon (points, numPointsToUse)`
 * *** `builder.addTransformedUnitBox (transform)`
 * *** `builder.addTriangleFan (conePoint, linestring, toggleOrientation)`
 * *** `builder.addTrianglesInUnchedkedPolygon (linestring, toggle)`
 * *** `builder.addUVGrid(surface,numU, numV, createFanInCaps)`
 * *** `builder.addGraph(Graph, acceptFaceFunction)`
 * **  Extract with `builder.claimPolyface(true)`
 *
 * * Low-level detail construction -- direct use of indices
 *
 * ** Create a builder with `builder = PolyfaceBuilder.create()`
 * ** Add GeometryQuery objects
 *
 * *** `builder.findOrAddPoint(point)`
 * *** `builder.findOrAddPointInLineString (linestring, index)`
 * *** `builder.findorAddTransformedPointInLineString(linestring, index, transform)`
 * *** `builder.findOrAddPointXYZ(x,y,z)`
 * *** `builder.addTriangleFanFromIndex0(indexArray, toggle)`
 * *** `builder.addTriangle (point0, point1, point2)`
 * *** `builder.addQuad (point0, point1, point2, point3)`
 * *** `builder.addOneBasedPointIndex (index)`
 */
class PolyfaceBuilder extends GeometryHandler_1.NullGeometryHandler {
    constructor(options) {
        super();
        this._options = options ? options : StrokeOptions_1.StrokeOptions.createForFacets();
        this._polyface = Polyface_1.IndexedPolyface.create(this._options.needNormals, this._options.needParams, this._options.needColors);
        this._reversed = false;
    }
    get options() { return this._options; }
    /** extract the polyface. */
    claimPolyface(compress = true) {
        if (compress)
            this._polyface.data.compress();
        return this._polyface;
    }
    toggleReversedFacetFlag() { this._reversed = !this._reversed; }
    static create(options) {
        return new PolyfaceBuilder(options);
    }
    /** add facets for a transformed unit box. */
    addTransformedUnitBox(transform) {
        const pointIndex0 = this._polyface.data.pointCount;
        // these will have sequential indices starting at pointIndex0 . . .
        for (const p of BoxTopology_1.BoxTopology.points)
            this._polyface.addPoint(transform.multiplyPoint3d(p));
        for (const facet of BoxTopology_1.BoxTopology.cornerIndexCCW) {
            for (const pointIndex of facet)
                this._polyface.addPointIndex(pointIndex0 + pointIndex);
            this._polyface.terminateFacet();
        }
    }
    /** Add triangles from points[0] to each far edge.
     * @param ls linestring with point coordinates
     * @param reverse if true, wrap the triangle creation in toggleReversedFacetFlag.
     */
    addTriangleFan(conePoint, ls, toggle) {
        const n = ls.numPoints();
        if (n > 2) {
            if (toggle)
                this.toggleReversedFacetFlag();
            const index0 = this.findOrAddPoint(conePoint);
            let index1 = this.findOrAddPointInLineString(ls, 0);
            let index2 = 0;
            for (let i = 1; i < n; i++) {
                index2 = this.findOrAddPointInLineString(ls, i);
                this.addIndexedTrianglePointIndexes(index0, index1, index2);
                index1 = index2;
            }
            if (toggle)
                this.toggleReversedFacetFlag();
        }
    }
    /** Add triangles from points[0] to each far edge.
     * @param ls linestring with point coordinates
     * @param reverse if true, wrap the triangle creation in toggleReversedFacetFlag.
     */
    addTrianglesInUncheckedPolygon(ls, toggle) {
        const n = ls.numPoints();
        if (n > 2) {
            if (toggle)
                this.toggleReversedFacetFlag();
            const index0 = this.findOrAddPointInLineString(ls, 0);
            let index1 = this.findOrAddPointInLineString(ls, 1);
            let index2 = 0;
            for (let i = 2; i < n; i++) {
                index2 = this.findOrAddPointInLineString(ls, i);
                this.addIndexedTrianglePointIndexes(index0, index1, index2);
                index1 = index2;
            }
            if (toggle)
                this.toggleReversedFacetFlag();
        }
    }
    /** Add triangles from points[0] to each far edge.
     * @param ls linestring with point coordinates
     * @param reverse if true, wrap the triangle creation in toggleReversedFacetFlag.
     */
    addTriangleFanFromIndex0(index, toggle, needNormals = false, needParams = false) {
        const n = index.length;
        if (n > 2) {
            if (toggle)
                this.toggleReversedFacetFlag();
            const index0 = index.at(0);
            let index1 = index.at(1);
            let index2 = 0;
            for (let i = 2; i < n; i++) {
                index2 = index.at(i);
                this.addIndexedTrianglePointIndexes(index0, index1, index2);
                if (needNormals)
                    this.addIndexedTriangleNormalIndexes(index0, index1, index2);
                if (needParams)
                    this.addIndexedTriangleParamIndexes(index0, index1, index2);
                index1 = index2;
            }
            if (toggle)
                this.toggleReversedFacetFlag();
        }
    }
    /**
     * Announce point coordinates.  The implemetation is free to either create a new point or (if known) return indxex of a prior point with the same coordinates.
     */
    findOrAddPoint(xyz) {
        return this._polyface.addPoint(xyz);
    }
    /**
     * Announce point coordinates.  The implemetation is free to either create a new param or (if known) return indxex of a prior param with the same coordinates.
     */
    findOrAddParamXY(x, y) {
        return this._polyface.addParamXY(x, y);
    }
    /**
     * Announce point coordinates.  The implemetation is free to either create a new point or (if knonw) return indxex of a prior point with the same coordinates.
     * @returns Returns the point index in the Polyface.
     * @param index Index of the point in the linestring.
     */
    findOrAddPointInLineString(ls, index, transform) {
        const q = ls.pointAt(index, PolyfaceBuilder._workPointFindOrAdd);
        if (q) {
            if (transform)
                transform.multiplyPoint3d(q, q);
            return this._polyface.addPoint(q);
        }
        return undefined;
    }
    /**
     * Announce point coordinates.  The implemetation is free to either create a new point or (if known) return index of a prior point with the same coordinates.
     */
    findOrAddPointXYZ(x, y, z) {
        return this._polyface.addPointXYZ(x, y, z);
    }
    /** Returns a transform who can be applied to points on a triangular facet in order to obtain UV parameters. */
    getUVTransformForTriangleFacet(pointA, pointB, pointC) {
        const vectorAB = pointA.vectorTo(pointB);
        const vectorAC = pointA.vectorTo(pointC);
        const unitAxes = Matrix3d_1.Matrix3d.createRigidFromColumns(vectorAB, vectorAC, 0 /* XYZ */);
        const localToWorld = Transform_1.Transform.createOriginAndMatrix(pointA, unitAxes);
        return localToWorld.inverse();
    }
    /** Returns the normal to a triangular facet. */
    getNormalForTriangularFacet(pointA, pointB, pointC) {
        const vectorAB = pointA.vectorTo(pointB);
        const vectorAC = pointA.vectorTo(pointC);
        let normal = vectorAB.crossProduct(vectorAC).normalize();
        normal = normal ? normal : Point3dVector3d_1.Vector3d.create();
        return normal;
    }
    // ###: Consider case where normals will be reversed and point through the other end of the facet
    /**
     * Add a quad to the polyface given its points in order around the edges.
     * Optionally provide params and the plane normal, otherwise they will be calculated without reference data.
     * Optionally mark this quad as the last piece of a face in this polyface.
     */
    addQuadFacet(points, params, normals) {
        // If params and/or normals are needed, calculate them first
        const needParams = this.options.needParams;
        const needNormals = this.options.needNormals;
        let param0, param1, param2, param3;
        let normal0, normal1, normal2, normal3;
        if (needParams) {
            if (params !== undefined && params.length > 3) {
                param0 = params[0];
                param1 = params[1];
                param2 = params[2];
                param3 = params[3];
            }
            else {
                const paramTransform = this.getUVTransformForTriangleFacet(points[0], points[1], points[2]);
                if (paramTransform === undefined) {
                    param0 = param1 = param2 = param3 = Point2dVector2d_1.Point2d.createZero();
                }
                else {
                    param0 = Point2dVector2d_1.Point2d.createFrom(paramTransform.multiplyPoint3d(points[0]));
                    param1 = Point2dVector2d_1.Point2d.createFrom(paramTransform.multiplyPoint3d(points[1]));
                    param2 = Point2dVector2d_1.Point2d.createFrom(paramTransform.multiplyPoint3d(points[2]));
                    param3 = Point2dVector2d_1.Point2d.createFrom(paramTransform.multiplyPoint3d(points[3]));
                }
            }
        }
        if (needNormals) {
            if (normals !== undefined && normals.length > 3) {
                normal0 = normals[0];
                normal1 = normals[1];
                normal2 = normals[2];
                normal3 = normals[3];
            }
            else {
                normal0 = this.getNormalForTriangularFacet(points[0], points[1], points[2]);
                normal1 = this.getNormalForTriangularFacet(points[0], points[1], points[2]);
                normal2 = this.getNormalForTriangularFacet(points[0], points[1], points[2]);
                normal3 = this.getNormalForTriangularFacet(points[0], points[1], points[2]);
            }
        }
        if (this._options.shouldTriangulate) {
            // Add as two triangles, with a diagonal along the shortest distance
            const vectorAC = points[0].vectorTo(points[2]);
            const vectorBD = points[1].vectorTo(points[3]);
            // Note: We pass along any values for normals or params that we calculated
            if (vectorAC.magnitude() >= vectorBD.magnitude()) {
                this.addTriangleFacet([points[0], points[1], points[2]], needParams ? [param0, param1, param2] : undefined, needNormals ? [normal0, normal1, normal2] : undefined);
                this.addTriangleFacet([points[0], points[2], points[3]], needParams ? [param0, param2, param3] : undefined, needNormals ? [normal0, normal2, normal3] : undefined);
            }
            else {
                this.addTriangleFacet([points[0], points[1], points[3]], needParams ? [param0, param1, param3] : undefined, needNormals ? [normal0, normal1, normal3] : undefined);
                this.addTriangleFacet([points[1], points[2], points[3]], needParams ? [param1, param2, param3] : undefined, needNormals ? [normal1, normal2, normal3] : undefined);
            }
            return;
        }
        let idx0, idx1, idx2, idx3;
        // Add params if needed
        if (needParams) {
            idx0 = this._polyface.addParam(param0);
            idx1 = this._polyface.addParam(param1);
            idx2 = this._polyface.addParam(param2);
            idx3 = this._polyface.addParam(param3);
            this.addIndexedQuadParamIndexes(idx0, idx1, idx3, idx2);
        }
        // Add normals if needed
        if (needNormals) {
            idx0 = this._polyface.addNormal(normal0);
            idx1 = this._polyface.addNormal(normal1);
            idx2 = this._polyface.addNormal(normal2);
            idx3 = this._polyface.addNormal(normal3);
            this.addIndexedQuadNormalIndexes(idx0, idx1, idx3, idx2);
        }
        // Add point and point indexes last (terminates the facet)
        idx0 = this.findOrAddPoint(points[0]);
        idx1 = this.findOrAddPoint(points[1]);
        idx2 = this.findOrAddPoint(points[2]);
        idx3 = this.findOrAddPoint(points[3]);
        this.addIndexedQuadPointIndexes(idx0, idx1, idx3, idx2);
    }
    /** Announce a single quad facet's point indexes.
     *
     * * The actual quad may be reversed or trianglulated based on builder setup.
     * *  indexA0 and indexA1 are in the forward order at the "A" end of the quad
     * *  indexB0 and indexB1 are in the forward order at the "B" end of the quad.
     */
    addIndexedQuadPointIndexes(indexA0, indexA1, indexB0, indexB1) {
        if (this._reversed) {
            this._polyface.addPointIndex(indexA0);
            this._polyface.addPointIndex(indexB0);
            this._polyface.addPointIndex(indexB1);
            this._polyface.addPointIndex(indexA1);
            this._polyface.terminateFacet();
        }
        else {
            this._polyface.addPointIndex(indexA0);
            this._polyface.addPointIndex(indexA1);
            this._polyface.addPointIndex(indexB1);
            this._polyface.addPointIndex(indexB0);
            this._polyface.terminateFacet();
        }
    }
    /** For a single quad facet, add the indexes of the corresponding param points. */
    addIndexedQuadParamIndexes(indexA0, indexA1, indexB0, indexB1) {
        if (this._reversed) {
            this._polyface.addParamIndex(indexA0);
            this._polyface.addParamIndex(indexB0);
            this._polyface.addParamIndex(indexB1);
            this._polyface.addParamIndex(indexA1);
        }
        else {
            this._polyface.addParamIndex(indexA0);
            this._polyface.addParamIndex(indexA1);
            this._polyface.addParamIndex(indexB1);
            this._polyface.addParamIndex(indexB0);
        }
    }
    /** For a single quad facet, add the indexes of the corresponding normal vectors. */
    addIndexedQuadNormalIndexes(indexA0, indexA1, indexB0, indexB1) {
        if (this._reversed) {
            this._polyface.addNormalIndex(indexA0);
            this._polyface.addNormalIndex(indexB0);
            this._polyface.addNormalIndex(indexB1);
            this._polyface.addNormalIndex(indexA1);
        }
        else {
            this._polyface.addNormalIndex(indexA0);
            this._polyface.addNormalIndex(indexA1);
            this._polyface.addNormalIndex(indexB1);
            this._polyface.addNormalIndex(indexB0);
        }
    }
    // ### TODO: Consider case where normals will be reversed and point through the other end of the facet
    /**
     * Add a triangle to the polyface given its points in order around the edges.
     * * Optionally provide params and triangle normals, otherwise they will be calculated without reference data.
     */
    addTriangleFacet(points, params, normals) {
        let idx0;
        let idx1;
        let idx2;
        // Add params if needed
        if (this._options.needParams) {
            if (params && params.length >= 3) { // Params were given
                idx0 = this._polyface.addParam(params[0]);
                idx1 = this._polyface.addParam(params[1]);
                idx2 = this._polyface.addParam(params[2]);
            }
            else { // Compute params
                const paramTransform = this.getUVTransformForTriangleFacet(points[0], points[1], points[2]);
                idx0 = this._polyface.addParam(Point2dVector2d_1.Point2d.createFrom(paramTransform ? paramTransform.multiplyPoint3d(points[0]) : undefined));
                idx1 = this._polyface.addParam(Point2dVector2d_1.Point2d.createFrom(paramTransform ? paramTransform.multiplyPoint3d(points[1]) : undefined));
                idx2 = this._polyface.addParam(Point2dVector2d_1.Point2d.createFrom(paramTransform ? paramTransform.multiplyPoint3d(points[2]) : undefined));
            }
            this.addIndexedTriangleParamIndexes(idx0, idx1, idx2);
        }
        // Add normals if needed
        if (this._options.needNormals) {
            if (normals !== undefined && normals.length > 2) { // Normals were given
                idx0 = this._polyface.addNormal(normals[0]);
                idx1 = this._polyface.addNormal(normals[1]);
                idx2 = this._polyface.addNormal(normals[2]);
            }
            else { // Compute normals
                const normal = this.getNormalForTriangularFacet(points[0], points[1], points[2]);
                idx0 = this._polyface.addNormal(normal);
                idx1 = this._polyface.addNormal(normal);
                idx2 = this._polyface.addNormal(normal);
            }
            this.addIndexedTriangleNormalIndexes(idx0, idx1, idx2);
        }
        // Add point and point indexes last (terminates the facet)
        idx0 = this.findOrAddPoint(points[0]);
        idx1 = this.findOrAddPoint(points[1]);
        idx2 = this.findOrAddPoint(points[2]);
        this.addIndexedTrianglePointIndexes(idx0, idx1, idx2);
    }
    /** Announce a single triangle facet's point indexes.
     *
     * * The actual quad may be reversed or trianglulated based on builder setup.
     * *  indexA0 and indexA1 are in the forward order at the "A" end of the quad
     * *  indexB0 and indexB1 are in the forward order at the "B" end of hte quad.
     */
    addIndexedTrianglePointIndexes(indexA, indexB, indexC) {
        if (indexA === indexB || indexB === indexC || indexC === indexA)
            return;
        if (!this._reversed) {
            this._polyface.addPointIndex(indexA);
            this._polyface.addPointIndex(indexB);
            this._polyface.addPointIndex(indexC);
            this._polyface.terminateFacet();
        }
        else {
            this._polyface.addPointIndex(indexA);
            this._polyface.addPointIndex(indexC);
            this._polyface.addPointIndex(indexB);
            this._polyface.terminateFacet();
        }
    }
    /** For a single triangle facet, add the indexes of the corresponding params. */
    addIndexedTriangleParamIndexes(indexA, indexB, indexC) {
        if (indexA === indexB || indexB === indexC || indexC === indexA)
            return;
        if (!this._reversed) {
            this._polyface.addParamIndex(indexA);
            this._polyface.addParamIndex(indexB);
            this._polyface.addParamIndex(indexC);
        }
        else {
            this._polyface.addParamIndex(indexA);
            this._polyface.addParamIndex(indexC);
            this._polyface.addParamIndex(indexB);
        }
    }
    /** For a single triangle facet, add the indexes of the corresponding params. */
    addIndexedTriangleNormalIndexes(indexA, indexB, indexC) {
        if (indexA === indexB || indexB === indexC || indexC === indexA)
            return;
        if (!this._reversed) {
            this._polyface.addNormalIndex(indexA);
            this._polyface.addNormalIndex(indexB);
            this._polyface.addNormalIndex(indexC);
        }
        else {
            this._polyface.addNormalIndex(indexA);
            this._polyface.addNormalIndex(indexC);
            this._polyface.addNormalIndex(indexB);
        }
    }
    /** Add facets betwee lineStrings with matched point counts.
     *
     * * Facets are announced to addIndexedQuad.
     * * addIndexedQuad is free to apply reversal or triangulation options.
     */
    addBetweenLineStrings(lineStringA, lineStringB, addClosure = false) {
        const pointA = lineStringA.points;
        const pointB = lineStringB.points;
        const numPoints = pointA.length;
        if (numPoints < 2 || numPoints !== pointB.length)
            return;
        let indexA0 = this.findOrAddPoint(pointA[0]);
        let indexB0 = this.findOrAddPoint(pointB[0]);
        const indexA00 = indexA0;
        const indexB00 = indexB0;
        let indexA1 = 0;
        let indexB1 = 0;
        for (let i = 1; i < numPoints; i++) {
            indexA1 = this.findOrAddPoint(pointA[i]);
            indexB1 = this.findOrAddPoint(pointB[i]);
            this.addIndexedQuadPointIndexes(indexA0, indexA1, indexB0, indexB1);
            indexA0 = indexA1;
            indexB0 = indexB1;
        }
        if (addClosure)
            this.addIndexedQuadPointIndexes(indexA0, indexA00, indexB0, indexB00);
    }
    /** Add facets betwee lineStrings with matched point counts.
     *
     * * Facets are announced to addIndexedQuad.
     * * addIndexedQuad is free to apply reversal or triangulation options.
     */
    addBetweenTransformedLineStrings(curves, transformA, transformB, addClosure = false) {
        if (curves instanceof LineString3d_1.LineString3d) {
            const pointA = curves.points;
            const numPoints = pointA.length;
            let indexA0 = this.findOrAddPointInLineString(curves, 0, transformA);
            let indexB0 = this.findOrAddPointInLineString(curves, 0, transformB);
            const indexA00 = indexA0;
            const indexB00 = indexB0;
            let indexA1 = 0;
            let indexB1 = 0;
            for (let i = 1; i < numPoints; i++) {
                indexA1 = this.findOrAddPointInLineString(curves, i, transformA);
                indexB1 = this.findOrAddPointInLineString(curves, i, transformB);
                this.addIndexedQuadPointIndexes(indexA0, indexA1, indexB0, indexB1);
                indexA0 = indexA1;
                indexB0 = indexB1;
            }
            if (addClosure)
                this.addIndexedQuadPointIndexes(indexA0, indexA00, indexB0, indexB00);
        }
        else {
            const children = curves.children;
            // just send the children individually -- final compres will fix things??
            if (children)
                for (const c of children) {
                    this.addBetweenTransformedLineStrings(c, transformA, transformB);
                }
        }
    }
    addBetweenStroked(dataA, dataB) {
        if (dataA instanceof LineString3d_1.LineString3d && dataB instanceof LineString3d_1.LineString3d) {
            this.addBetweenLineStrings(dataA, dataB, false);
        }
        else if (dataA instanceof CurveCollection_1.CurveChain && dataB instanceof CurveCollection_1.CurveChain) {
            const chainA = dataA.children;
            const chainB = dataB.children;
            if (chainA.length === chainB.length) {
                for (let i = 0; i < chainA.length; i++) {
                    const cpA = chainA[i];
                    const cpB = chainB[i];
                    if (cpA instanceof LineString3d_1.LineString3d && cpB instanceof LineString3d_1.LineString3d) {
                        this.addBetweenLineStrings(cpA, cpB);
                    }
                }
            }
        }
    }
    /**
     *
     * @param cone cone to facet
     * @param strokeCount number of strokes around the cone.  If omitted, use the strokeOptions previously supplied to the builder.
     */
    addCone(cone, strokeCount) {
        // assume cone strokes consistently at both ends ....
        const lineStringA = cone.strokeConstantVSection(0.0, strokeCount ? strokeCount : this._options);
        const lineStringB = cone.strokeConstantVSection(1.0, strokeCount ? strokeCount : this._options);
        this.addBetweenLineStrings(lineStringA, lineStringB, false);
        if (cone.capped) {
            this.addTrianglesInUncheckedPolygon(lineStringA, true); // lower triangles flip
            this.addTrianglesInUncheckedPolygon(lineStringB, false); // upper triangles to not flip.
        }
    }
    /**
     *
     * @param surface TorusPipe to facet
     * @param strokeCount number of strokes around the cone.  If omitted, use the strokeOptions previously supplied to the builder.
     */
    addTorusPipe(surface, phiStrokeCount, thetaStrokeCount) {
        this.toggleReversedFacetFlag();
        this.addUVGrid(surface, phiStrokeCount ? phiStrokeCount : 8, thetaStrokeCount ? thetaStrokeCount : Math.ceil(16 * surface.getThetaFraction()), surface.capped);
        this.toggleReversedFacetFlag();
    }
    /**
     *
     * @param vector sweep vector
     * @param contour contour which contains only linestrings
     */
    addLinearSweepLineStrings(contour, vector) {
        if (contour instanceof LineString3d_1.LineString3d) {
            const ls = contour;
            let pointA = Point3dVector3d_1.Point3d.create();
            let pointB = Point3dVector3d_1.Point3d.create();
            let indexA0 = 0;
            let indexA1 = 0;
            let indexB0 = 0;
            let indexB1 = 0;
            const n = ls.numPoints();
            for (let i = 0; i < n; i++) {
                pointA = ls.pointAt(i, pointA);
                pointB = pointA.plus(vector, pointB);
                indexA1 = this.findOrAddPoint(pointA);
                indexB1 = this.findOrAddPoint(pointB);
                if (i > 0) {
                    this.addIndexedQuadPointIndexes(indexA0, indexA1, indexB0, indexB1);
                }
                indexA0 = indexA1;
                indexB0 = indexB1;
            }
        }
        else if (contour instanceof CurveCollection_1.CurveChain) {
            for (const ls of contour.children) {
                this.addLinearSweepLineStrings(ls, vector);
            }
        }
    }
    addRotationalSweep(surface) {
        const strokes = surface.getCurves().cloneStroked();
        const numStep = StrokeOptions_1.StrokeOptions.applyAngleTol(this._options, 1, surface.getSweep().radians, undefined);
        const transformA = Transform_1.Transform.createIdentity();
        const transformB = Transform_1.Transform.createIdentity();
        for (let i = 1; i <= numStep; i++) {
            surface.getFractionalRotationTransform(i / numStep, transformB);
            this.addBetweenTransformedLineStrings(strokes, transformA, transformB);
            transformA.setFrom(transformB);
        }
        if (surface.capped) {
            const contour = surface.getSweepContourRef();
            contour.emitFacets(this, true, undefined);
            contour.emitFacets(this, false, transformB);
        }
    }
    /**
     *
     * @param cone cone to facet
     */
    addLinearSweep(surface) {
        const baseStrokes = surface.getCurvesRef().cloneStroked();
        this.addLinearSweepLineStrings(baseStrokes, surface.cloneSweepVector());
        if (surface.capped) {
            const contour = surface.getSweepContourRef();
            contour.emitFacets(this, true, undefined);
            contour.emitFacets(this, false, Transform_1.Transform.createTranslation(surface.cloneSweepVector()));
        }
    }
    /**
     *
     * @param cone cone to facet
     */
    addRuledSweep(surface) {
        const contours = surface.sweepContoursRef();
        let stroke0;
        let stroke1;
        for (let i = 0; i < contours.length; i++) {
            stroke1 = contours[i].curves.cloneStroked();
            if (i > 0 && stroke0 && stroke1)
                this.addBetweenStroked(stroke0, stroke1);
            stroke0 = stroke1;
        }
        contours[0].emitFacets(this, true, undefined);
        contours[contours.length - 1].emitFacets(this, false, undefined);
    }
    addSphere(sphere, strokeCount) {
        const numLongitudeStroke = strokeCount ? strokeCount : this._options.defaultCircleStrokes;
        const numLatitudeStroke = Geometry_1.Geometry.clampToStartEnd(numLongitudeStroke * 0.5, 4, 32);
        let lineStringA = sphere.strokeConstantVSection(0.0, numLongitudeStroke);
        if (sphere.capped && !Geometry_1.Geometry.isSmallMetricDistance(lineStringA.quickLength()))
            this.addTrianglesInUncheckedPolygon(lineStringA, true); // lower triangles flip
        for (let i = 1; i <= numLatitudeStroke; i++) {
            const lineStringB = sphere.strokeConstantVSection(i / numLatitudeStroke, numLongitudeStroke);
            this.addBetweenLineStrings(lineStringA, lineStringB);
            lineStringA = lineStringB;
        }
        if (sphere.capped && !Geometry_1.Geometry.isSmallMetricDistance(lineStringA.quickLength()))
            this.addTrianglesInUncheckedPolygon(lineStringA, true); // upper triangles do not flip
    }
    addBox(box) {
        const lineStringA = box.strokeConstantVSection(0.0);
        const lineStringB = box.strokeConstantVSection(1.0);
        this.addBetweenLineStrings(lineStringA, lineStringB);
        if (box.capped) {
            this.addTrianglesInUncheckedPolygon(lineStringA, true); // lower triangles flip
            this.addTrianglesInUncheckedPolygon(lineStringB, false); // upper triangles to not flip.
        }
    }
    /** Add a polygon to the evolving facets.
     *
     * * Add points to the polyface
     * * indices are added (in reverse order if indicated by the builder state)
     * @param points array of points.  This may contain extra points not to be used in the polygon
     * @param numPointsToUse number of points to use.
     */
    addPolygon(points, numPointsToUse) {
        // don't use trailing points that match start point.
        if (numPointsToUse === undefined)
            numPointsToUse = points.length;
        while (numPointsToUse > 1 && points[numPointsToUse - 1].isAlmostEqual(points[0]))
            numPointsToUse--;
        let index = 0;
        if (!this._reversed) {
            for (let i = 0; i < numPointsToUse; i++) {
                index = this.findOrAddPoint(points[i]);
                this._polyface.addPointIndex(index);
            }
        }
        else {
            for (let i = numPointsToUse; --i >= 0;) {
                index = this.findOrAddPoint(points[i]);
                this._polyface.addPointIndex(index);
            }
        }
        this._polyface.terminateFacet();
    }
    /** Add a polyface, with optional reverse and transform. */
    addIndexedPolyface(source, reversed, transform) {
        this._polyface.addIndexedPolyface(source, reversed, transform);
    }
    /**
     * Produce a new FacetFaceData for all terminated facets since construction of the previous face.
     * Each facet number/index is mapped to the FacetFaceData through the faceToFaceData array.
     * Returns true if successful, and false otherwise.
     */
    endFace() {
        return this._polyface.setNewFaceData();
    }
    // -------------------- double dispatch methods ---------------------------
    handleCone(g) { return this.addCone(g); }
    handleTorusPipe(g) { return this.addTorusPipe(g); }
    handleSphere(g) { return this.addSphere(g); }
    handleBox(g) { return this.addBox(g); }
    handleLinearSweep(g) { return this.addLinearSweep(g); }
    handleRotationalSweep(g) { return this.addRotationalSweep(g); }
    handleRuledSweep(g) { return this.addRuledSweep(g); }
    addGeometryQuery(g) { g.dispatchToGeometryHandler(this); }
    /**
     *
     * * Visit all faces
     * * Test each face with f(node) for any node on the face.
     * * For each face that passes, pass its coordinates to the builder.
     * * Rely on the builder's compress step to find common vertex coordinates
     */
    addGraph(graph, needParams, acceptFaceFunction = Graph_1.HalfEdge.testNodeMaskNotExterior) {
        let index = 0;
        graph.announceFaceLoops((_graph, seed) => {
            if (acceptFaceFunction(seed)) {
                let node = seed;
                do {
                    index = this.findOrAddPointXYZ(node.x, node.y, node.z);
                    this._polyface.addPointIndex(index);
                    if (needParams) {
                        index = this.findOrAddParamXY(node.x, node.y);
                        this._polyface.addParamIndex(index);
                    }
                    node = node.faceSuccessor;
                } while (node !== seed);
                this._polyface.terminateFacet();
            }
            return true;
        });
    }
    static graphToPolyface(graph, options, acceptFaceFunction = Graph_1.HalfEdge.testNodeMaskNotExterior) {
        const builder = PolyfaceBuilder.create(options);
        builder.addGraph(graph, builder.options.needParams, acceptFaceFunction);
        builder.endFace();
        return builder.claimPolyface();
    }
    /**
     * Given a 2-dimensional grid of points and optional corresponding params and normals, add the grid to the polyface as a series of quads.
     * Each facet in the grid should either be made up of 3 or 4 edges. Optionally specify that this quad is the last piece of a face.
     */
    addGrid(pointArray, paramArray, normalArray, endFace = false) {
        for (let i = 0; i < pointArray.length; i++) {
            const params = paramArray ? paramArray[i] : undefined;
            const normals = normalArray ? normalArray[i] : undefined;
            if (pointArray[i].length === 3)
                this.addTriangleFacet(pointArray[i], params, normals);
            else if (pointArray[i].length === 4)
                this.addQuadFacet(pointArray[i], params, normals);
        }
        if (endFace)
            this.endFace();
    }
    addUVGrid(surface, numU, numV, createFanInCaps) {
        let index0 = PolyfaceBuilder._index0;
        let index1 = PolyfaceBuilder._index1;
        let indexSwap;
        index0.ensureCapacity(numU);
        index1.ensureCapacity(numU);
        const xyz = Point3dVector3d_1.Point3d.create();
        const du = 1.0 / numU;
        const dv = 1.0 / numV;
        for (let v = 0; v <= numV; v++) {
            // evaluate new points ....
            index1.clear();
            for (let u = 0; u <= numU; u++) {
                const uFrac = u * du;
                const vFrac = v * dv;
                if (this._options.needParams) {
                    const plane = surface.UVFractionToPointAndTangents(uFrac, vFrac);
                    this._polyface.addNormal(plane.vectorU.crossProduct(plane.vectorV));
                    index1.push(this.findOrAddPoint(plane.origin.clone()));
                }
                else {
                    surface.UVFractionToPoint(uFrac, vFrac, xyz);
                    index1.push(this.findOrAddPoint(xyz));
                }
                if (this._options.needParams) {
                    this._polyface.addParam(new Point2dVector2d_1.Point2d(uFrac, vFrac));
                }
            }
            if (createFanInCaps && (v === 0 || v === numV)) {
                this.addTriangleFanFromIndex0(index1, v === 0, true, true);
            }
            if (v > 0) {
                for (let u = 0; u < numU; u++) {
                    this.addIndexedQuadPointIndexes(index0.at(u), index0.at(u + 1), index1.at(u), index1.at(u + 1));
                    if (this._options.needParams)
                        this.addIndexedQuadNormalIndexes(index0.at(u), index0.at(u + 1), index1.at(u), index1.at(u + 1));
                    if (this._options.needParams)
                        this.addIndexedQuadParamIndexes(index0.at(u), index0.at(u + 1), index1.at(u), index1.at(u + 1));
                }
            }
            indexSwap = index1;
            index1 = index0;
            index0 = indexSwap;
        }
        index0.clear();
        index1.clear();
    }
}
PolyfaceBuilder._workPointFindOrAdd = Point3dVector3d_1.Point3d.create();
PolyfaceBuilder._index0 = new GrowableFloat64Array_1.GrowableFloat64Array();
PolyfaceBuilder._index1 = new GrowableFloat64Array_1.GrowableFloat64Array();
exports.PolyfaceBuilder = PolyfaceBuilder;
//# sourceMappingURL=PolyfaceBuilder.js.map