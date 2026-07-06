import React from 'react';
import Tree from 'react-d3-tree';
import { MindMapNode } from '../types';

export function MindMapView({ data }: { data: MindMapNode }) {
  // react-d3-tree expects { name, attributes, children }
  return (
    <div className="w-full h-80 bg-slate-50 border border-slate-200 rounded-lg mt-4 overflow-hidden relative">
      <Tree 
        data={data as any} 
        orientation="horizontal"
        pathFunc="step"
        translate={{ x: 50, y: 150 }}
        nodeSize={{ x: 250, y: 50 }}
        renderCustomNodeElement={(rd3tProps) => {
          return (
            <g>
              <rect width="200" height="40" x="-10" y="-20" rx="5" fill="#fff" stroke="#6366f1" strokeWidth="2" />
              <text x="90" y="4" textAnchor="middle" fill="#1e293b" fontSize="12" fontWeight="bold" style={{ textShadow: "none" }}>
                {rd3tProps.nodeDatum.name}
              </text>
            </g>
          );
        }}
      />
    </div>
  );
}
