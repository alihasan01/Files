"use strict";
/*---------------------------------------------------------------------------------------------
* Copyright (c) 2018 Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
/** @module CartesianGeometry */
const Point3dVector3d_1 = require("../geometry3d/Point3dVector3d");
const Range_1 = require("../geometry3d/Range");
const Angle_1 = require("../geometry3d/Angle");
const ClipPlane_1 = require("./ClipPlane");
const ConvexClipPlaneSet_1 = require("./ConvexClipPlaneSet");
const PointHelpers_1 = require("../geometry3d/PointHelpers");
const CurvePrimitive_1 = require("../curve/CurvePrimitive");
const CurveLocationDetail_1 = require("../curve/CurveLocationDetail");
const CurveCollection_1 = require("../curve/CurveCollection");
const LineSegment3d_1 = require("../curve/LineSegment3d");
const Arc3d_1 = require("../curve/Arc3d");
const LineString3d_1 = require("../curve/LineString3d");
const BSplineCurve_1 = require("../bspline/BSplineCurve");
const Range1dArray_1 = require("../numerics/Range1dArray");
/**
 * An AlternatingConvexClipTreeNode is a node in a tree structure in which
 *   <ul>
 *   <li>Each node contains a ConvexClipPlaneSet
 *   <li>Each node contains an array of children which are also AlternativingConvexClipTreeNode.
 *   <li>The rule for an in/out decision is that a point is IN the subtree under a node if
 *   <ul>
 *   <li>It is IN the node's ConvexClipPlaneSet.
 *   <li>It is NOT IN any of the children.
 *   </ul>
 *   <li>Applying "NOT IN any of the children" locally to children at each level means that the ConvexClipPlaneSet
 *       at adjacent levels flip between being positive areas and holes.
 *   <li>Use an AlternatingConvexClipTreeNodeBuilder to construct the tree from a polygon.
 *   <li>It is possible for the root clip plane set to be empty.  An empty clip plane set returns "true"
 *         for all point tests, so the meaning is just that holes are to be subtracted from the rest
 *         of space.
 *   <li>Althogh the interpretation of in/out alternates with tree levels, the ConvexClipPlaneSets
 *         at each level are all "enclosing" planes in the usual way.
 *   </ul>
 */
class AlternatingCCTreeNode {
    constructor() {
        this.points = [];
        this.planes = ConvexClipPlaneSet_1.ConvexClipPlaneSet.createEmpty();
        this.children = [];
        this.startIdx = -1; // Start index into the master array (not the local points array)
        this.numPoints = -1; // Number of points used in the master array
    }
    /** Initialize this node with index data referencing the parent polygon. */
    static createWithIndices(index0, numPoints, result) {
        result = result ? result : new AlternatingCCTreeNode();
        result.startIdx = index0;
        result.numPoints = numPoints;
        result.children.length = 0;
        return result;
    }
    /**
     * <ul>
     * <li>Build the tree for a polygon.
     * <li>Caller creates the root node with empty constructor AlternatingConvexClipTreeNode.
     * </ul>
     */
    static createTreeForPolygon(points, result) {
        result = result ? result : new AlternatingCCTreeNode();
        result.empty();
        const builder = AlternatingCCTreeBuilder.createPointsRef(points);
        builder.buildHullTree(result); // <-- Currently ALWAYS returns true
        return result;
    }
    /** Resets this AlternatingConvexClipTreeNode to a newly-created state */
    empty() {
        this.points.length = 0;
        this.planes.planes.length = 0;
        this.children.length = 0;
        this.startIdx = -1;
        this.numPoints = -1;
    }
    /** Creates a deep copy of this node (expensive - copies Geometry, and is recursive for children array). */
    clone(result) {
        result = result ? result : new AlternatingCCTreeNode();
        for (const point of this.points)
            result.points.push(point.clone());
        result.planes = ConvexClipPlaneSet_1.ConvexClipPlaneSet.createEmpty();
        for (const plane of this.planes.planes)
            result.planes.planes.push(plane.clone());
        for (const node of this.children)
            result.children.push(node.clone());
        result.startIdx = this.startIdx;
        result.numPoints = this.numPoints;
        return result;
    }
    /** Add a new child that has an empty plane set and given indices. */
    addEmptyChild(index0, numPoints) {
        const newNode = AlternatingCCTreeNode.createWithIndices(index0, numPoints);
        this.children.push(newNode);
    }
    /** Add a plane to the ConvexClipPlaneSet */
    addPlane(plane) {
        this.planes.addPlaneToConvexSet(plane);
    }
    /** Search with alternating in and out semantics. */
    isPointOnOrInside(point) {
        const inRoot = this.planes.isPointOnOrInside(point, 0.0);
        if (!inRoot)
            return false;
        for (const child of this.children) {
            if (child.isPointOnOrInside(point))
                return false;
        }
        return true;
    }
    /** Add an AlternatingConvexClipTreeNode as a child of this one -- i.e. a hole.
     * * The child pointer is pushed directly to the tree -- not cloned.
     */
    captureConvexClipPlaneSetAsVoid(child) {
        this.children.push(child);
    }
    /** Append start-end positions for curve intervals classified as inside or outside. */
    appendCurvePrimitiveClipIntervals(curve, insideIntervals, outsideIntervals) {
        const clipper = new AlternatingCCTreeNodeCurveClipper();
        clipper.appendSingleClipPrimitive(this, curve, insideIntervals, outsideIntervals);
    }
    /** Append start-end positions for curve intervals classified as inside or outside. */
    appendCurveCollectionClipIntervals(curves, insideIntervals, outsideIntervals) {
        const clipper = new AlternatingCCTreeNodeCurveClipper();
        clipper.appendCurveCollectionClip(this, curves, insideIntervals, outsideIntervals);
    }
}
exports.AlternatingCCTreeNode = AlternatingCCTreeNode;
/**
 *  Context structure for building an AlternatingConvexClipTreeNode from a polygon.
 *  <ul>
 *  <li> The polygon is copied to the local m_points structure.
 *  <li> During construction, m_stack contains indices of a sequence of points with uniform concavity.
 *  </ul>
 */
class AlternatingCCTreeBuilder {
    constructor() {
        this._points = [];
        this._stack = [];
    }
    static createPointsRef(points, result) {
        result = result ? result : new AlternatingCCTreeBuilder();
        result._points = points;
        if (PointHelpers_1.PolygonOps.areaXY(points) < 0.0)
            result._points.reverse();
        return result;
    }
    get period() { return this._points.length; }
    indexAfter(i) { return (i + 1) % this._points.length; }
    indexBefore(i) { return (i + this._points.length - 1) % this._points.length; }
    pushIndex(primaryPointIndex) {
        this._stack.push(primaryPointIndex);
    }
    static cross(pointA, pointB, pointC) {
        return pointA.crossProductToPointsXY(pointB, pointC);
    }
    /*
      public isInsideTurn(pointA: Point3d, pointB: Point3d, pointC: Point3d, sign: number) {
        return sign * AlternatingCCTreeBuilder.cross(pointA, pointB, pointC) > 0;
      }
    */
    cyclicStackPoint(cyclicIndex) {
        let stackIndex;
        const stack = this._stack;
        if (cyclicIndex > 0)
            stackIndex = cyclicIndex;
        else
            stackIndex = cyclicIndex + 10 * stack.length;
        stackIndex = stackIndex % stack.length;
        return this._points[stack[stackIndex]];
    }
    signFromStackTip(pointIndex, sign) {
        const pointA = this.cyclicStackPoint(-2);
        const pointB = this.cyclicStackPoint(-1);
        const pointC = this._points[pointIndex];
        return sign * AlternatingCCTreeBuilder.cross(pointA, pointB, pointC) >= 0.0 ? 1 : -1;
    }
    /*
     * Test of xyz is in the convex region bounded by stack points:
     * <ul>
     *   <li>polygon[i0]..polygon[i1]
     *   <li>polygon[j0]..polygon[j1]
     *   <li>polygon[i0]..polygon[i1]
     * </ul>
     * with "inside" controlled by sign multiplier.
    public isConvexContinuation(point: Point3d, i0: number, i1: number, j0: number, j1: number, sign: number): boolean {
      const points = this.points;
      const stack = this.stack;
      return this.isInsideTurn(points[stack[i0]], points[stack[i1]], point, sign)
          && this.isInsideTurn(points[stack[i0]], points[stack[j0]], point, sign)
          && this.isInsideTurn(points[stack[j1]], points[stack[i1]], point, sign);
    }
     */
    get indexOfMaxX() {
        let k = 0;
        const points = this._points;
        const nPoints = this._points.length;
        for (let i = 1; i < nPoints; i++) {
            if (points[i].x > points[k].x)
                k = i;
        }
        return k;
    }
    /** Pop from the stack until the sign condition is satisfied */
    extendHullChain(k, sign, pushAfterPops) {
        while (this._stack.length > 1 && this.signFromStackTip(k, sign) < 0.0)
            this._stack.pop();
        if (pushAfterPops)
            this.pushIndex(k);
    }
    collectHullChain(kStart, numK, sign) {
        this._stack.length = 0;
        if (numK > 2) {
            let k = kStart;
            for (let i = 0; i < numK; i++) {
                this.extendHullChain(k, sign, true);
                k = this.indexAfter(k);
            }
        }
    }
    buildHullTreeGo(root, isPositiveArea) {
        this.collectHullChain(root.startIdx, root.numPoints, isPositiveArea ? 1.0 : -1.0);
        root.points.length = 0;
        const stack = this._stack;
        const points = this._points;
        const stackLen = stack.length;
        for (let i = 0; i < stackLen; i++) {
            const k0 = stack[i];
            root.points.push(points[k0]);
            if (i + 1 < stackLen) {
                let k1 = stack[i + 1];
                if (k1 === this.indexAfter(k0)) {
                    // two original points in sequence -- need a clip plane right here!!!
                    const plane = ClipPlane_1.ClipPlane.createEdgeAndUpVector(points[k0], points[k1], Point3dVector3d_1.Vector3d.create(0, 0, 1), Angle_1.Angle.createRadians(0));
                    if (plane !== undefined) {
                        if (isPositiveArea)
                            plane.negateInPlace();
                        root.addPlane(plane);
                    }
                }
                else {
                    if (k1 < k0)
                        k1 += this.period;
                    root.addEmptyChild(k0, k1 - k0 + 1);
                }
            }
        }
        for (const child of root.children)
            this.buildHullTreeGo(child, !isPositiveArea);
        return true; // Are there failure modes? What happens with crossing data?..
    }
    /**
     * <ul>
     * <li> Input a ClipTreeRoot that has start and count data
     * <li> Build the hull for that data range
     * <li> Store the hull points in the root
     * <li> Add children with start and count data
     * <li> Recursivly move to children
     * </ul>
     */
    buildHullTree(root) {
        AlternatingCCTreeNode.createWithIndices(this.indexOfMaxX, this.period + 1, root);
        return this.buildHullTreeGo(root, true);
    }
}
exports.AlternatingCCTreeBuilder = AlternatingCCTreeBuilder;
class AlternatingCCTreeNodeCurveClipper {
    constructor() {
        this._stackDepth = 0;
        this._intervalStack = [];
    }
    setCurveRef(curve) { this._curve = curve; }
    popSegmentFrame() {
        if (this._stackDepth > 0) {
            this._topOfStack.length = 0; // formality.
            this._stackDepth -= 1;
        }
    }
    clearSegmentStack() {
        while (this._stackDepth > 0)
            this.popSegmentFrame(); // and that will reduce stack depth
    }
    pushEmptySegmentFrame() {
        this._stackDepth += 1;
        while (this._intervalStack.length < this._stackDepth)
            this._intervalStack.push([]);
        this._topOfStack.length = 0;
    }
    get _topOfStack() { return this._intervalStack[this._stackDepth - 1]; }
    // set the top of the stack (as defined by stackDepth -- not array length)
    set _topOfStack(value) {
        const n = this._stackDepth;
        if (n > 0)
            this._intervalStack[n - 1] = value;
    }
    /** Access entry [topOfStack() - numSkip] */
    stackEntry(numSkip) {
        if (numSkip <= this._stackDepth)
            return this._intervalStack[this._stackDepth - 1 - numSkip];
        else
            return [];
    }
    isTopOfStackEmpty() {
        return this._topOfStack.length === 0;
    }
    appendSingleClipToStack(planes, insideSegments) {
        const fractionIntervals = AlternatingCCTreeNodeCurveClipper._fractionIntervals;
        if (this._curve instanceof LineSegment3d_1.LineSegment3d) {
            const segment = this._curve;
            let f0;
            let f1;
            if (segment.announceClipIntervals(planes, (a0, a1, _cp) => { f0 = a0; f1 = a1; })) {
                insideSegments.push(Range_1.Range1d.createXX(f0, f1));
            }
            return true;
        }
        else if (this._curve instanceof Arc3d_1.Arc3d) {
            const arc = this._curve;
            fractionIntervals.length = 0;
            arc.announceClipIntervals(planes, (a0, a1, _cp) => {
                fractionIntervals.push(a0);
                fractionIntervals.push(a1);
            });
            for (let i = 0; i < fractionIntervals.length; i += 2)
                insideSegments.push(Range_1.Range1d.createXX(fractionIntervals[i], fractionIntervals[i + 1]));
            return true;
        }
        else if (this._curve instanceof LineString3d_1.LineString3d && this._curve.points.length > 1) {
            const linestring = this._curve;
            let f0;
            let f1;
            const nPoints = linestring.points.length;
            const df = 1.0 / (nPoints - 1);
            for (let i = 0; i < nPoints - 1; i++) {
                const segment = LineSegment3d_1.LineSegment3d.create(linestring.points[i], linestring.points[i + 1]);
                if (segment.announceClipIntervals(planes, (a0, a1, _cp) => { f0 = a0; f1 = a1; })) {
                    insideSegments.push(Range_1.Range1d.createXX((i + f0) * df, (i + f1) * df));
                }
            }
            return true;
        }
        else if (this._curve instanceof BSplineCurve_1.BSplineCurve3d) {
            const bcurve = this._curve;
            fractionIntervals.length = 0;
            bcurve.announceClipIntervals(planes, (a0, a1, _cp) => {
                fractionIntervals.push(a0);
                fractionIntervals.push(a1);
            });
            for (let i = 0; i < fractionIntervals.length; i += 2)
                insideSegments.push(Range_1.Range1d.createXX(fractionIntervals[i], fractionIntervals[i + 1]));
            return true;
        }
        return false;
    }
    /**
     * Run one level of recursion. On return, the stack is one level deeper than at entry and the new top of the stack has clip for this node
     * (expensive -- must clone items of arrays during "swaps")
     */
    recurse(node) {
        this.pushEmptySegmentFrame();
        this.appendSingleClipToStack(node.planes, this._topOfStack);
        Range1dArray_1.Range1dArray.sort(this._topOfStack);
        if (this.isTopOfStackEmpty())
            return;
        for (const child of node.children) {
            this.recurse(child);
            if (!this.isTopOfStackEmpty()) {
                const ranges = Range1dArray_1.Range1dArray.differenceSorted(this.stackEntry(1), this.stackEntry(0));
                this.popSegmentFrame();
                this._topOfStack = ranges;
            }
            else {
                this.popSegmentFrame();
            }
            if (this.isTopOfStackEmpty())
                break;
        }
    }
    /**
     * Modifies the insideIntervvals array given in place.
     * Note: curve given is passed by reference and stored.
     */
    appendSingleClipPrimitive(root, curve, insideIntervals, _outsideIntervals) {
        this.setCurveRef(curve);
        this.clearSegmentStack();
        this.recurse(root);
        if (this._stackDepth !== 1)
            return;
        const intervals = this._topOfStack;
        for (const interval of intervals) {
            const f0 = interval.low;
            const f1 = interval.high;
            const xyz0 = curve.fractionToPoint(f0);
            const xyz1 = curve.fractionToPoint(f1);
            insideIntervals.push(CurveLocationDetail_1.CurveLocationDetailPair.createDetailRef(CurveLocationDetail_1.CurveLocationDetail.createCurveFractionPoint(curve, f0, xyz0), CurveLocationDetail_1.CurveLocationDetail.createCurveFractionPoint(curve, f1, xyz1)));
        }
        this.popSegmentFrame();
    }
    /**
     * Modifies the insideIntervvals array given in place.
     * Note: curve given is passed by reference and stored.
     */
    appendCurveCollectionClip(root, curve, insideIntervals, outsideIntervals) {
        for (const cp of curve.children) {
            if (cp instanceof CurvePrimitive_1.CurvePrimitive)
                this.appendSingleClipPrimitive(root, cp, insideIntervals, outsideIntervals);
            else if (cp instanceof CurveCollection_1.CurveCollection)
                this.appendCurveCollectionClip(root, cp, insideIntervals, outsideIntervals);
        }
    }
}
// Is re-used by method calls
AlternatingCCTreeNodeCurveClipper._fractionIntervals = [];
exports.AlternatingCCTreeNodeCurveClipper = AlternatingCCTreeNodeCurveClipper;
//# sourceMappingURL=AlternatingConvexClipTree.js.map