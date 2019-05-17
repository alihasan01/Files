"use strict";
/*---------------------------------------------------------------------------------------------
* Copyright (c) 2018 Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
/** @module Topology */
const Graph_1 = require("./Graph");
const Point3dVector3d_1 = require("../geometry3d/Point3dVector3d");
const Geometry_1 = require("../Geometry");
const Range_1 = require("../geometry3d/Range");
class Triangulator {
    /** Given the six nodes that make up two bordering triangles, "pinch" and relocate the nodes to flip them */
    static flipTriangles(a, b, c, d, e, f) {
        // Reassign all of the pointers
        Graph_1.HalfEdge.pinch(a, e);
        Graph_1.HalfEdge.pinch(c, d);
        Graph_1.HalfEdge.pinch(f, c);
        Graph_1.HalfEdge.pinch(e, b);
        // Move alpha and beta into the xy coordinates of their predecessors
        e.x = b.x;
        e.y = b.y;
        e.z = b.z;
        e.i = b.i;
        c.i = f.i;
        c.x = f.x;
        c.y = f.y;
        c.z = f.z;
    }
    /**
     * * nodeA is a given node
     * * nodeA1 is its nodeA.faceSuccessor
     * * nodeA2 is nodeA1.faceSuccessor, i.e. 3rd node of triangle A
     * * nodeB  is nodeA.edgeMate, i.e. a node in the "other" triangle at nodeA's edge
     * * nodeB1 is nodeB.faceSucessor
     * * nodeB2 is nodeB1.faceSuccessor, i.e the 3rd node of triangle B
     * Construct (as simple doubles, to avoid object creation) xy vectors from:
     * * (ux,uy): nodeA to nodeA1, i.e. the shared edge
     * * (vx,vy): nodeA to ndoeA2,
     * * (wx,wy): nodeA to nodeB2
     * * this determinant is positive if nodeA is "in the circle" of nodeB2, nodeA1, nodeA2
     * @param nodeA node on the diagonal edge of candidate for edge flip.
     * @return the determinant (but undefined if the faces are not triangles as expected.)
     */
    static computeInCircleDeterminant(nodeA) {
        const nodeA1 = nodeA.faceSuccessor;
        const nodeA2 = nodeA1.faceSuccessor;
        if (nodeA2.faceSuccessor !== nodeA)
            return undefined;
        const nodeB = nodeA.edgeMate;
        const nodeB1 = nodeB.faceSuccessor;
        const nodeB2 = nodeB1.faceSuccessor;
        if (nodeB2.faceSuccessor !== nodeB)
            return undefined;
        const ux = nodeA1.x - nodeA.x;
        const uy = nodeA1.y - nodeA.y;
        const vx = nodeA2.x - nodeA.x;
        const vy = nodeA2.y - nodeA.y;
        // we assume identical coordinates in pairs (nodeA, nodeB1)  and (nodeA1, nodeB)
        const wx = nodeB2.x - nodeA.x;
        const wy = nodeB2.y - nodeA.y;
        return Geometry_1.Geometry.tripleProduct(wx, wy, wx * wx + wy * wy, vx, vy, vx * vx + vy * vy, ux, uy, ux * ux + uy * uy);
    }
    /**
     *  *  Visit each node of the graph array
     *  *  If a flip would be possible, test the results of flipping using incircle condition
     *  *  If revealed to be an improvement, conduct the flip, mark involved nodes as unvisited, and repeat until all nodes are visited
     */
    static cleanupTriangulation(graph) {
        const nodeArray = graph.allHalfEdges;
        graph.clearMask(8192 /* VISITED */);
        let foundNonVisited = false;
        for (let i = 0; i < nodeArray.length; i++) {
            const node = nodeArray[i];
            // HalfEdge has already been visited or is exterior node
            if (node.isMaskSet(8192 /* VISITED */))
                continue;
            node.setMask(8192 /* VISITED */);
            if (node.edgeMate === undefined || node.isMaskSet(1 /* EXTERIOR */) || node.isMaskSet(512 /* PRIMARY_EDGE */)) // Flip not allowed
                continue;
            foundNonVisited = true;
            const incircle = Triangulator.computeInCircleDeterminant(node);
            if (incircle !== undefined && incircle > 0.0) {
                // Mark all nodes involved in flip as needing to be buffer (other than alpha and beta node we started with)
                node.facePredecessor.clearMask(8192 /* VISITED */);
                node.faceSuccessor.clearMask(8192 /* VISITED */);
                node.edgeMate.facePredecessor.clearMask(8192 /* VISITED */);
                node.edgeMate.faceSuccessor.clearMask(8192 /* VISITED */);
                // Flip the triangles
                Triangulator.flipTriangles(node.edgeMate.faceSuccessor, node.edgeMate.facePredecessor, node.edgeMate, node.faceSuccessor, node, node.facePredecessor);
            }
            // If at the end of the loop, check if we found an unvisited node we tried to flip.. if so, restart loop
            if (i === nodeArray.length - 1 && foundNonVisited) {
                i = -1;
                foundNonVisited = false;
            }
        }
        graph.clearMask(8192 /* VISITED */);
    }
    /**
     *
     * @param strokedLoops an array of loops as GrowableXYZArray.
     * @returns triangulated graph, or undefined if bad data.
     */
    static triangulateStrokedLoops(strokedLoops) {
        if (strokedLoops.length < 1)
            return undefined;
        Triangulator._returnGraph = new Graph_1.HalfEdgeGraph();
        let maxArea = strokedLoops[0].areaXY();
        let largestLoopIndex = 0;
        for (let i = 0; i < strokedLoops.length; i++) {
            const area = Math.abs(strokedLoops[i].areaXY());
            if (area > maxArea) {
                maxArea = area;
                largestLoopIndex = i;
            }
        }
        // NOW WE KNOW ...
        // strokedLoops[largestAreaIndex] is the largest loop.  (Hence outer, but orientation is not guaranteed.)
        const holeLoops = [];
        let startingNode = Triangulator.createFaceLoopFromIndexedXYZCollection(strokedLoops[largestLoopIndex], true, true);
        if (!startingNode)
            return Triangulator._returnGraph;
        for (let i = 0; i < strokedLoops.length; i++) {
            if (i !== largestLoopIndex) {
                const holeLoop = Triangulator.createFaceLoopFromIndexedXYZCollection(strokedLoops[i], false, true);
                if (holeLoop)
                    holeLoops.push(Triangulator.getLeftmost(holeLoop));
            }
        }
        startingNode = Triangulator.spliceLeftMostNodesOfHoles(startingNode, holeLoops, false);
        Triangulator.earcutLinked(startingNode);
        return Triangulator._returnGraph;
    }
    /**
     * Triangulate the polygon made up of by a series of points.
     * * To triangulate a polygon with holes, use earcutFromOuterAndInnerLoops
     * * The loop may be either CCW or CW -- CCW order will be used for triangles.
     */
    static earcutSingleLoop(data) {
        Triangulator._returnGraph = new Graph_1.HalfEdgeGraph();
        const startingNode = Triangulator.createFaceLoopFromXAndYArray(data, true, true);
        if (!startingNode)
            return Triangulator._returnGraph;
        let minX;
        let minY;
        let maxX;
        let maxY;
        let x;
        let y;
        let size;
        // if the shape is not too simple, we'll use z-order curve hash later; calculate polygon bbox
        if (data.length > 80) {
            minX = maxX = data[0].x;
            minY = maxY = data[0].y;
            const n = data.length;
            for (let i = 1; i < n; i++) {
                x = data[i].x;
                y = data[i].y;
                if (x < minX)
                    minX = x;
                if (y < minY)
                    minY = y;
                if (x > maxX)
                    maxX = x;
                if (y > maxY)
                    maxY = y;
            }
            // minX, minY and size are later used to transform coords into integers for z-order calculation
            size = Math.max(maxX - minX, maxY - minY);
        }
        Triangulator.earcutLinked(startingNode, minX, minY, size);
        return Triangulator._returnGraph;
    }
    /**
     * Triangulate the polygon made up of multiple loops.
     * * only xy parts are considered.
     * * First loop is assumed outer -- will be reordered as CCW
     * * Additional loops assumed inner -- will be reordered as CW
     */
    static earcutOuterAndInnerLoops(loops) {
        Triangulator._returnGraph = new Graph_1.HalfEdgeGraph();
        const range = Range_1.Range2d.createNull();
        const numLoops = loops.length;
        // let totalPoints = 0;
        // trim trailing duplicates from each array.
        for (const loop of loops) {
            // totalPoints += n;
            const n = loop.length;
            for (let i = 0; i < n; i++)
                range.extendXY(loop[i].x, loop[i].y);
        }
        let startingNode = Triangulator.createFaceLoopFromXAndYArray(loops[0], true, true);
        if (!startingNode)
            return Triangulator._returnGraph;
        if (numLoops > 1)
            startingNode = Triangulator.constructAndSpliceHoles(loops, startingNode);
        // NEEDS WORK: When 80 or more points, pass range go earcutLinked.  This triggers hashing for performance.
        Triangulator.earcutLinked(startingNode);
        return Triangulator._returnGraph;
    }
    /**
     * cautiously split the edge starting at baseNode.
     * * If baseNode is null, create a trivial loop with the single vertex at xy
     * * if xy is distinct from the coordinates at both baseNode and its successor, insert xy as a new node within that edge.
     * * also include z coordinate if present.
     */
    static interiorEdgeSplit(graph, baseNode, xy) {
        const z = xy.hasOwnProperty("z") ? xy.z : 0.0;
        if (!baseNode)
            return graph.splitEdge(baseNode, xy.x, xy.y, z);
        if (Triangulator.equalXAndY(baseNode, xy))
            return baseNode;
        if (Triangulator.equalXAndY(baseNode.faceSuccessor, xy))
            return baseNode;
        return graph.splitEdge(baseNode, xy.x, xy.y, z);
    }
    static directcreateFaceLoopFromIndexedXYZCollection(graph, data) {
        let i;
        // Add the starting nodes as the boundary, and apply initial masks to the primary edge and exteriors
        let baseNode;
        const xyz = Point3dVector3d_1.Point3d.create();
        for (i = 0; i < data.length; i++) {
            data.atPoint3dIndex(i, xyz);
            baseNode = Triangulator.interiorEdgeSplit(graph, baseNode, xyz);
        }
        return baseNode;
    }
    static directCreateFaceLoopFromXAndYArray(graph, data) {
        // Add the starting nodes as the boundary, and apply initial masks to the primary edge and exteriors
        let baseNode;
        for (const xy of data) {
            baseNode = Triangulator.interiorEdgeSplit(graph, baseNode, xy);
        }
        return baseNode;
    }
    /**
     * @param graph the containing graph
     * @param base The last node of a newly created loop.  (i.e. its `faceSuccessor` has the start xy)
     * @param returnPositiveAreaLoop if true, return the start node on the side with positive area.  otherwise return the left side as given.
     * @param markExterior
     * @return the loop's start node or its vertex sucessor, chosen to be the positive or negative loop per request.
     */
    static assignMasksToNewFaceLoop(_graph, base, returnPositiveAreaLoop, markExterior) {
        // base is the final coordinates
        if (base) {
            base = base.faceSuccessor; // because typical construction process leaves the "live" edge at the end of the loop.
            const area = base.signedFaceArea();
            const mate = base.edgeMate;
            base.setMaskAroundFace(2 /* BOUNDARY */ | 512 /* PRIMARY_EDGE */);
            mate.setMaskAroundFace(2 /* BOUNDARY */ | 512 /* PRIMARY_EDGE */);
            let preferredNode = base;
            if (returnPositiveAreaLoop === (area < 0))
                preferredNode = mate;
            const otherNode = preferredNode.vertexSuccessor;
            if (markExterior)
                otherNode.setMaskAroundFace(1 /* EXTERIOR */);
            return preferredNode;
        }
        return undefined; // caller should not be calling with start <= end
    }
    /**
     * create a circular doubly linked list of internal and external nodes from polygon points in the specified winding order
     * * If start and end are both zero, use the whole array.
     */
    static createFaceLoopFromXAndYArray(data, returnPositiveAreaLoop, markExterior) {
        const graph = Triangulator._returnGraph;
        const base = Triangulator.directCreateFaceLoopFromXAndYArray(graph, data);
        return Triangulator.assignMasksToNewFaceLoop(graph, base, returnPositiveAreaLoop, markExterior);
    }
    /**
     * create a circular doubly linked list of internal and external nodes from polygon points in the specified winding order
     */
    static createFaceLoopFromIndexedXYZCollection(data, returnPositiveAreaLoop, markExterior) {
        const graph = Triangulator._returnGraph;
        const base = Triangulator.directcreateFaceLoopFromIndexedXYZCollection(graph, data);
        return Triangulator.assignMasksToNewFaceLoop(graph, base, returnPositiveAreaLoop, markExterior);
    }
    /** eliminate colinear or duplicate points using starting and ending nodes */
    static filterPoints(start, end) {
        if (!start)
            return start;
        if (!end)
            end = start;
        let p = start;
        let again;
        do {
            again = false;
            if (!p.steiner && (Triangulator.equalXAndY(p, p.faceSuccessor) || Triangulator.signedTriangleArea(p.facePredecessor, p, p.faceSuccessor) === 0)) {
                Triangulator.joinNeighborsOfEar(p);
                p = end = p.facePredecessor;
                if (p === p.faceSuccessor)
                    return undefined;
                again = true;
            }
            else {
                p = p.faceSuccessor;
            }
        } while (again || p !== end);
        return end;
    }
    /** Cut off an ear, forming a new face loop of nodes
     * @param ear the vertex being cut off.
     * *  Form two new nodes, alpha and beta, which have the coordinates one step away from the ear vertex.
     * *  Reassigns the pointers such that beta is left behind with the new face created
     * *  Reassigns the pointers such that alpha becomes the resulting missing node from the remaining polygon
     * * Reassigns prevZ and nextZ pointers
     */
    static joinNeighborsOfEar(ear) {
        const alpha = Triangulator._returnGraph.createEdgeXYZXYZ(ear.facePredecessor.x, ear.facePredecessor.y, ear.facePredecessor.z, ear.facePredecessor.i, ear.faceSuccessor.x, ear.faceSuccessor.y, ear.faceSuccessor.z, ear.faceSuccessor.i);
        const beta = alpha.edgeMate;
        // Take care of z-ordering
        if (ear.prevZ)
            ear.prevZ.nextZ = ear.nextZ;
        if (ear.nextZ)
            ear.nextZ.prevZ = ear.prevZ;
        // Add two nodes alpha and beta and reassign pointers (also mark triangle nodes as part of triangle)
        Graph_1.HalfEdge.pinch(ear.faceSuccessor, beta);
        Graph_1.HalfEdge.pinch(ear.facePredecessor, alpha);
        ear.setMaskAroundFace(16384 /* TRIANGULATED_NODE_MASK */);
    }
    /**
     * main ear slicing loop which triangulates a polygon (given as a linked list)
     * While there still exists ear nodes that have not yet been triangulated...
     *
     * *  Check if the ear is hashed, and can easily be split off. If so, "join" that ear.
     * *  If not hashed, move on to a seperate ear.
     * *  If no ears are currently hashed, attempt to cure self intersections or split the polygon into two before continuing
     */
    static earcutLinked(ear, minX, minY, size, pass) {
        if (!ear)
            return;
        // interlink polygon nodes in z-order
        if (!pass && size)
            Triangulator.indexCurve(ear, minX, minY, size);
        let stop = ear;
        let next;
        // iterate through ears, slicing them one by one
        while (!ear.isMaskSet(16384 /* TRIANGULATED_NODE_MASK */)) {
            next = ear.faceSuccessor;
            if (size ? Triangulator.isEarHashed(ear, minX, minY, size) : Triangulator.isEar(ear)) {
                // skipping the next vertice leads to less sliver triangles
                stop = next.faceSuccessor;
                // If we already have a seperated triangle, do not join
                if (ear.faceSuccessor.faceSuccessor !== ear.facePredecessor) {
                    Triangulator.joinNeighborsOfEar(ear);
                    ear = ear.faceSuccessor.edgeMate.faceSuccessor.faceSuccessor;
                }
                else {
                    ear.setMask(16384 /* TRIANGULATED_NODE_MASK */);
                    ear.faceSuccessor.setMask(16384 /* TRIANGULATED_NODE_MASK */);
                    ear.facePredecessor.setMask(16384 /* TRIANGULATED_NODE_MASK */);
                    ear = next.faceSuccessor;
                }
                continue;
            }
            ear = next;
            // if we looped through the whole remaining polygon and can't find any more ears
            if (ear === stop) {
                // try filtering points and slicing again
                // if (!pass) {
                //  Triangulator.earcutLinked(Triangulator.filterPoints(ear), minX, minY, size, 1);
                // }
                // if this didn't work, try curing all small self-intersections locally
                if (!pass) {
                    ear = Triangulator.cureLocalIntersections(ear);
                    Triangulator.earcutLinked(ear, minX, minY, size, 2);
                    // as a last resort, try splitting the remaining polygon into two
                }
                else if (pass === 2) {
                    Triangulator.splitEarcut(ear, minX, minY, size);
                }
                break;
            }
        }
    }
    /** Check whether a polygon node forms a valid ear with adjacent nodes */
    static isEar(ear) {
        const a = ear.facePredecessor;
        const b = ear;
        const c = ear.faceSuccessor;
        if (Triangulator.signedTriangleArea(a, b, c) >= 0)
            return false; // reflex, can't be an ear
        // now make sure we don't have other points inside the potential ear
        let p = ear.faceSuccessor.faceSuccessor;
        while (p !== ear.facePredecessor) {
            if (Triangulator.pointInTriangle(a.x, a.y, b.x, b.y, c.x, c.y, p.x, p.y) &&
                Triangulator.signedTriangleArea(p.facePredecessor, p, p.faceSuccessor) >= 0)
                return false;
            p = p.faceSuccessor;
        }
        return true;
    }
    /** Check whether a polygon node forms a valid ear with adjacent nodes using bounded boxes of z-ordering of this and adjacent nodes */
    static isEarHashed(ear, minX, minY, size) {
        const a = ear.facePredecessor;
        const b = ear;
        const c = ear.faceSuccessor;
        if (Triangulator.signedTriangleArea(a, b, c) >= 0)
            return false; // reflex, can't be an ear
        // triangle bbox; min & max are calculated like this for speed
        const minTX = a.x < b.x ? (a.x < c.x ? a.x : c.x) : (b.x < c.x ? b.x : c.x);
        const minTY = a.y < b.y ? (a.y < c.y ? a.y : c.y) : (b.y < c.y ? b.y : c.y);
        const maxTX = a.x > b.x ? (a.x > c.x ? a.x : c.x) : (b.x > c.x ? b.x : c.x);
        const maxTY = a.y > b.y ? (a.y > c.y ? a.y : c.y) : (b.y > c.y ? b.y : c.y);
        // z-order range for the current triangle bbox;
        const minZ = Triangulator.zOrder(minTX, minTY, minX, minY, size);
        const maxZ = Triangulator.zOrder(maxTX, maxTY, minX, minY, size);
        // first look for points inside the triangle in increasing z-order
        let p = ear.nextZ;
        while (p && p.zOrder <= maxZ) {
            if (p !== ear.facePredecessor && p !== ear.faceSuccessor &&
                Triangulator.pointInTriangle(a.x, a.y, b.x, b.y, c.x, c.y, p.x, p.y) &&
                Triangulator.signedTriangleArea(p.facePredecessor, p, p.faceSuccessor) >= 0)
                return false;
            p = p.nextZ;
        }
        // then look for points in decreasing z-order
        p = ear.prevZ;
        while (p && p.zOrder >= minZ) {
            if (p !== ear.facePredecessor && p !== ear.faceSuccessor &&
                Triangulator.pointInTriangle(a.x, a.y, b.x, b.y, c.x, c.y, p.x, p.y) &&
                Triangulator.signedTriangleArea(p.facePredecessor, p, p.faceSuccessor) >= 0)
                return false;
            p = p.prevZ;
        }
        return true;
    }
    /** Go through all polygon nodes and cure small local self-intersections */
    static cureLocalIntersections(start) {
        let p = start;
        do {
            const a = p.facePredecessor;
            const b = p.faceSuccessor.faceSuccessor;
            if (!Triangulator.equalXAndY(a, b) && Triangulator.intersects(a, p, p.faceSuccessor, b) &&
                Triangulator.locallyInside(a, b) && Triangulator.locallyInside(b, a)) {
                // remove two nodes involved
                Triangulator.joinNeighborsOfEar(p);
                Triangulator.joinNeighborsOfEar(p.faceSuccessor);
                p = start = b;
            }
            p = p.faceSuccessor;
        } while (p !== start);
        return p;
    }
    /** try splitting polygon into two and triangulate them independently */
    static splitEarcut(start, minX, minY, size) {
        // look for a valid diagonal that divides the polygon into two
        let a = start;
        do {
            let b = a.faceSuccessor.faceSuccessor;
            while (b !== a.facePredecessor) {
                if (a.i !== b.i && Triangulator.isValidDiagonal(a, b)) {
                    // split the polygon in two by the diagonal
                    let c = Triangulator.splitPolygon(a, b);
                    // filter colinear points around the cuts
                    a = Triangulator.filterPoints(a, a.faceSuccessor);
                    c = Triangulator.filterPoints(c, c.faceSuccessor);
                    // run earcut on each half
                    Triangulator.earcutLinked(a, minX, minY, size);
                    Triangulator.earcutLinked(c, minX, minY, size);
                    return;
                }
                b = b.faceSuccessor;
            }
            a = a.faceSuccessor;
        } while (a !== start);
    }
    /** link loops[1], loops[2] etc into the outer loop, producing a single-ring polygon without holes
     *
     */
    static constructAndSpliceHoles(loops, outerNode) {
        const queue = [];
        let list;
        for (let holeIndex = 1; holeIndex < loops.length; holeIndex++) {
            list = Triangulator.createFaceLoopFromXAndYArray(loops[holeIndex], false, true);
            if (list && list === list.faceSuccessor)
                list.steiner = true;
            queue.push(Triangulator.getLeftmost(list));
        }
        outerNode = Triangulator.spliceLeftMostNodesOfHoles(outerNode, queue, true);
        return outerNode;
    }
    /** link holeLoopNodes[1], holeLoopNodes[2] etc into the outer loop, producing a single-ring polygon without holes
     *
     */
    static spliceLeftMostNodesOfHoles(outerNode, leftMostHoleLoopNode, applyFilter = true) {
        leftMostHoleLoopNode.sort(Triangulator.compareX);
        // process holes from left to right
        for (const holeStart of leftMostHoleLoopNode) {
            Triangulator.eliminateHole(holeStart, outerNode, applyFilter);
            if (applyFilter)
                outerNode = Triangulator.filterPoints(outerNode, (outerNode) ? outerNode.faceSuccessor : undefined);
        }
        return outerNode;
    }
    /** For use in sorting -- return (signed) difference (a.x - b.x) */
    static compareX(a, b) {
        return a.x - b.x;
    }
    /** find a bridge between vertices that connects hole with an outer ring and and link it */
    static eliminateHole(hole, outerNode, applyFilter) {
        outerNode = Triangulator.findHoleBridge(hole, outerNode);
        if (outerNode) {
            const b = Triangulator.splitPolygon(outerNode, hole);
            if (applyFilter)
                Triangulator.filterPoints(b, b.faceSuccessor);
        }
    }
    /**
     *  David Eberly's algorithm for finding a bridge between hole and outer polygon:
     *  https://www.geometrictools.com/Documentation/TriangulationByEarClipping.pdf
     */
    static findHoleBridge(hole, outerNode) {
        let p = outerNode;
        if (!p)
            return undefined;
        const hx = hole.x;
        const hy = hole.y;
        let qx = -Infinity;
        let m;
        // find a segment intersected by a ray from the hole's leftmost point to the left;
        // segment's endpoint with lesser x will be potential connection point
        do {
            if (hy <= p.y && hy >= p.faceSuccessor.y && p.faceSuccessor.y !== p.y) {
                const x = p.x + (hy - p.y) * (p.faceSuccessor.x - p.x) / (p.faceSuccessor.y - p.y);
                if (x <= hx && x > qx) {
                    qx = x;
                    if (x === hx) {
                        if (hy === p.y)
                            return p;
                        if (hy === p.faceSuccessor.y)
                            return p.faceSuccessor;
                    }
                    m = p.x < p.faceSuccessor.x ? p : p.faceSuccessor;
                }
            }
            p = p.faceSuccessor;
        } while (p !== outerNode);
        if (!m)
            return undefined;
        if (hx === qx)
            return m.facePredecessor; // hole touches outer segment; pick lower endpoint
        // look for points inside the triangle of hole point, segment intersection and endpoint;
        // if there are no points found, we have a valid connection;
        // otherwise choose the point of the minimum angle with the ray as connection point
        const stop = m;
        const mx = m.x;
        const my = m.y;
        let tanMin = Infinity;
        let tan;
        p = m.faceSuccessor;
        while (p !== stop) {
            if (hx >= p.x && p.x >= mx && hx !== p.x &&
                Triangulator.pointInTriangle(hy < my ? hx : qx, hy, mx, my, hy < my ? qx : hx, hy, p.x, p.y)) {
                tan = Math.abs(hy - p.y) / (hx - p.x); // tangential
                if ((tan < tanMin || (tan === tanMin && p.x > m.x)) && Triangulator.locallyInside(p, hole)) {
                    m = p;
                    tanMin = tan;
                }
            }
            p = p.faceSuccessor;
        }
        return m;
    }
    /** interlink polygon nodes in z-order */
    static indexCurve(start, minX, minY, size) {
        let p = start;
        do {
            if (p.zOrder === undefined)
                p.zOrder = Triangulator.zOrder(p.x, p.y, minX, minY, size);
            p.prevZ = p.facePredecessor;
            p.nextZ = p.faceSuccessor;
            p = p.faceSuccessor;
        } while (p !== start);
        p.prevZ.nextZ = undefined;
        p.prevZ = undefined;
        Triangulator.sortLinked(p);
    }
    /**
     * Simon Tatham's linked list merge sort algorithm
     * http://www.chiark.greenend.org.uk/~sgtatham/algorithms/listsort.html
     */
    static sortLinked(list) {
        let i;
        let p;
        let q;
        let e;
        let tail;
        let numMerges;
        let pSize;
        let qSize;
        let inSize = 1;
        do {
            p = list;
            list = undefined;
            tail = undefined;
            numMerges = 0;
            while (p) {
                numMerges++;
                q = p;
                pSize = 0;
                for (i = 0; i < inSize; i++) {
                    pSize++;
                    q = q.nextZ;
                    if (!q)
                        break;
                }
                qSize = inSize;
                while (pSize > 0 || (qSize > 0 && q)) {
                    if (pSize !== 0 && (qSize === 0 || !q || p.zOrder <= q.zOrder)) {
                        e = p;
                        p = p.nextZ;
                        pSize--;
                    }
                    else {
                        e = q;
                        q = q.nextZ;
                        qSize--;
                    }
                    if (tail)
                        tail.nextZ = e;
                    else
                        list = e;
                    e.prevZ = tail;
                    tail = e;
                }
                p = q;
            }
            tail.nextZ = undefined;
            inSize *= 2;
        } while (numMerges > 1);
        return list;
    }
    /**
     * z-order of a point given coords and size of the data bounding box
     */
    static zOrder(x, y, minX, minY, size) {
        // coords are transformed into non-negative 15-bit integer range
        x = 32767 * (x - minX) / size;
        y = 32767 * (y - minY) / size;
        x = (x | (x << 8)) & 0x00FF00FF;
        x = (x | (x << 4)) & 0x0F0F0F0F;
        x = (x | (x << 2)) & 0x33333333;
        x = (x | (x << 1)) & 0x55555555;
        y = (y | (y << 8)) & 0x00FF00FF;
        y = (y | (y << 4)) & 0x0F0F0F0F;
        y = (y | (y << 2)) & 0x33333333;
        y = (y | (y << 1)) & 0x55555555;
        return x | (y << 1);
    }
    // find the leftmost node of a polygon ring
    static getLeftmost(start) {
        let p = start;
        let leftmost = start;
        do {
            if (p.x < leftmost.x)
                leftmost = p;
            p = p.faceSuccessor;
        } while (p !== start);
        return leftmost;
    }
    /** check if a point lies within a convex triangle */
    static pointInTriangle(ax, ay, bx, by, cx, cy, px, py) {
        return (cx - px) * (ay - py) - (ax - px) * (cy - py) >= 0 &&
            (ax - px) * (by - py) - (bx - px) * (ay - py) >= 0 &&
            (bx - px) * (cy - py) - (cx - px) * (by - py) >= 0;
    }
    /** check if a diagonal between two polygon nodes is valid (lies in polygon interior) */
    static isValidDiagonal(a, b) {
        return a.faceSuccessor.i !== b.i && a.facePredecessor.i !== b.i && !Triangulator.intersectsPolygon(a, b) &&
            Triangulator.locallyInside(a, b) && Triangulator.locallyInside(b, a) && Triangulator.middleInside(a, b);
    }
    /** signed area of a triangle */
    static signedTriangleArea(p, q, r) {
        return 0.5 * ((q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y));
    }
    /** check if two points are equal */
    static equalXAndY(p1, p2) {
        return Geometry_1.Geometry.isSameCoordinate(p1.x, p2.x) && Geometry_1.Geometry.isSameCoordinate(p1.y, p2.y);
    }
    /** check if two segments intersect */
    static intersects(p1, q1, p2, q2) {
        if ((Triangulator.equalXAndY(p1, q1) && Triangulator.equalXAndY(p2, q2)) ||
            (Triangulator.equalXAndY(p1, q2) && Triangulator.equalXAndY(p2, q1)))
            return true;
        return Triangulator.signedTriangleArea(p1, q1, p2) > 0 !== Triangulator.signedTriangleArea(p1, q1, q2) > 0 &&
            Triangulator.signedTriangleArea(p2, q2, p1) > 0 !== Triangulator.signedTriangleArea(p2, q2, q1) > 0;
    }
    /** check if a polygon diagonal intersects any polygon segments */
    static intersectsPolygon(a, b) {
        let p = a;
        do {
            if (p.i !== a.i && p.faceSuccessor.i !== a.i && p.i !== b.i && p.faceSuccessor.i !== b.i &&
                Triangulator.intersects(p, p.faceSuccessor, a, b))
                return true;
            p = p.faceSuccessor;
        } while (p !== a);
        return false;
    }
    /** check if a polygon diagonal is locally inside the polygon */
    static locallyInside(a, b) {
        return Triangulator.signedTriangleArea(a.facePredecessor, a, a.faceSuccessor) < 0 ?
            Triangulator.signedTriangleArea(a, b, a.faceSuccessor) >= 0 && Triangulator.signedTriangleArea(a, a.facePredecessor, b) >= 0 :
            Triangulator.signedTriangleArea(a, b, a.facePredecessor) < 0 || Triangulator.signedTriangleArea(a, a.faceSuccessor, b) < 0;
    }
    /** check if the middle point of a polygon diagonal is inside the polygon */
    static middleInside(a, b) {
        let p = a;
        let inside = false;
        const px = (a.x + b.x) / 2;
        const py = (a.y + b.y) / 2;
        do {
            if (((p.y > py) !== (p.faceSuccessor.y > py)) && p.faceSuccessor.y !== p.y &&
                (px < (p.faceSuccessor.x - p.x) * (py - p.y) / (p.faceSuccessor.y - p.y) + p.x))
                inside = !inside;
            p = p.faceSuccessor;
        } while (p !== a);
        return inside;
    }
    /**
     * link two polygon vertices with a bridge; if the vertices belong to the same ring, it splits polygon into two;
     * if one belongs to the outer ring and another to a hole, it merges it into a single ring
     * * Returns the base of the new edge at the "a" end.
     * * "a" and "b" still represent the same physical pieces of edges
     * @returns Returns the (base of) the new half edge, at the "a" end.
     */
    static splitPolygon(a, b) {
        const a2 = Triangulator._returnGraph.createEdgeXYZXYZ(a.x, a.y, a.z, a.i, b.x, b.y, b.z, b.i);
        const b2 = a2.faceSuccessor;
        Graph_1.HalfEdge.pinch(a, a2);
        Graph_1.HalfEdge.pinch(b, b2);
        return a2;
    }
}
exports.Triangulator = Triangulator;
//# sourceMappingURL=Triangulation.js.map