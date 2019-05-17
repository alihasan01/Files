"use strict";
/*---------------------------------------------------------------------------------------------
* Copyright (c) 2018 Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
// Search services for HalfEdgeGraph
class HalfEdgeGraphSearch {
    /**
     * * for each node of face, set the mask push to allNodesStack
     * * push the faceSeed on onePerFaceStack[]
     */
    static pushAndMaskAllNodesInFace(faceSeed, mask, allNodeStack, onePerFaceStack) {
        onePerFaceStack.push(faceSeed);
        faceSeed.collectAroundFace((node) => {
            node.setMask(mask);
            allNodeStack.push(node);
        });
    }
    /**
     * Search an array of faceSeed nodes for the face with the most negative area.
     */
    static findMinimumAreaFace(nodes) {
        let mostNegativeAreaNode = nodes[0];
        let mostNegArea = Number.MAX_VALUE;
        for (const node of nodes) {
            const area = node.signedFaceArea();
            if (area < 0 && area < mostNegArea) {
                mostNegArea = area;
                mostNegativeAreaNode = node;
            }
        }
        return mostNegativeAreaNode;
    }
    /**
     *
     * @param seedEdge first edge to search.
     * @param visitMask mask applied to all faces as visited.
     * @param parityMask mask to apply (a) to first face, (b) to faces with alternating parity during the search.
     */
    static parityFloodFromSeed(seedEdge, visitMask, parityMask) {
        const faces = [];
        if (seedEdge.isMaskSet(visitMask))
            return faces; // empty
        const allMasks = parityMask | visitMask;
        const stack = [];
        // arbitrarily call the seed face exterior ... others will alternate as visited.
        HalfEdgeGraphSearch.pushAndMaskAllNodesInFace(seedEdge, allMasks, stack, faces); // Start with exterior as mask
        while (stack.length > 0) {
            const p = stack.pop();
            const mate = p.edgeMate;
            if (!mate)
                continue;
            if (!mate.isMaskSet(visitMask)) {
                const mateState = !p.isMaskSet(parityMask);
                HalfEdgeGraphSearch.pushAndMaskAllNodesInFace(mate, mateState ? allMasks : visitMask, stack, faces);
            }
        }
        return faces;
    }
    /**
     * * Search the given faces for the one with the minimum area.
     * * If the mask in that face is OFF, toggle it on (all half edges of) all the faces.
     * * In a properly merged planar subdivision there should be only one true negative area face per compnent.
     * @param graph parent graph
     * @param parityMask mask which was previously set with alternating parity, but with an arbitrary start face.
     * @param faces array of faces to search.
     */
    static correctParityInSingleComponent(_graph, mask, faces) {
        const exteriorHalfEdge = HalfEdgeGraphSearch.findMinimumAreaFace(faces);
        if (exteriorHalfEdge.isMaskSet(mask)) {
            // all should be well .. nothing to do.
        }
        else {
            // TOGGLE around the face (assuming all are consistent with the seed)
            for (const faceSeed of faces) {
                if (faceSeed.isMaskSet(mask)) {
                    faceSeed.clearMaskAroundFace(mask);
                }
                else {
                    faceSeed.setMaskAroundFace(mask);
                }
            }
        }
    }
    /** Apply correctParityInSingleComponent to each array in components. (Quick exit if mask in NULL_MASK) */
    static correctParityInComponentArrays(graph, mask, components) {
        if (mask === 0)
            return;
        for (const facesInComponent of components)
            HalfEdgeGraphSearch.correctParityInSingleComponent(graph, mask, facesInComponent);
    }
    /**
     * Collect arrays gathering faces by connected component.
     * @param graph graph to inspect
     * @param parityMask (optional) mask to apply indicating parity.  If this is Mask.NULL_MASK, there is no record of parity.
     */
    static collectConnectedComponents(graph, parityMask = 0 /* NULL_MASK */) {
        const components = [];
        const visitMask = 8192 /* VISITED */;
        const allMasks = parityMask | visitMask;
        graph.clearMask(allMasks);
        for (const faceSeed of graph.allHalfEdges) {
            if (!faceSeed.isMaskSet(8192 /* VISITED */)) {
                const newFaces = HalfEdgeGraphSearch.parityFloodFromSeed(faceSeed, visitMask, parityMask);
                components.push(newFaces);
            }
        }
        HalfEdgeGraphSearch.correctParityInComponentArrays(graph, parityMask, components);
        return components;
    }
}
exports.HalfEdgeGraphSearch = HalfEdgeGraphSearch;
//# sourceMappingURL=HalfEdgeGraphSearch.js.map