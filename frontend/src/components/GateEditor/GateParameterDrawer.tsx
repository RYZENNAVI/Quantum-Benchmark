import * as React from 'react';
import { useState, useEffect } from 'react';
import { GATE_DEFS } from '@/constants/gates';

interface GateParameterDrawerProps {
    gate: any;
    open: boolean;
    onClose: () => void;
    onUpdateParam: (index: number, value: number) => void;
}

export default function GateParameterDrawer({
    gate,
    open,
    onClose,
    onUpdateParam
}: GateParameterDrawerProps) {
    if (!gate || !open) return null;

    const gateDef = GATE_DEFS[gate.type];
    if (!gateDef?.params?.length) return null;

    const handleParamChange = (index: number, value: number) => {
        if (onUpdateParam) {
            onUpdateParam(index, value);
        }
    };

    return (
        <div className="fixed inset-x-0 bottom-0 z-50">
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black/20"
                onClick={onClose}
            />

            {/* Drawer content */}
            <div className="relative bg-gray-900 text-white p-6 rounded-t-xl shadow-xl">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">
                        {gate.type} Parameters
                    </h2>
                </div>

                <div className="space-y-6">
                    {gateDef.params.map((param, index) => {
                        const value = gate.params?.[index] ?? param.default ?? 0;
                        const isInteger = param.type === 'integer';
                        
                        return (
                            <div key={param.key} className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-medium">
                                        {param.label}
                                    </label>
                                    <span className="text-sm text-gray-400">
                                        {isInteger ? Math.round(value) : value.toFixed(2)}
                                    </span>
                                </div>
                                
                                {isInteger ? (
                                    // Integer-Eingabesteuerung
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="number"
                                            min={param.min ?? 1}
                                            max={param.max ?? 10}
                                            step={param.step ?? 1}
                                            value={Math.round(value)}
                                            onChange={(e) => {
                                                const newValue = parseInt(e.target.value);
                                                if (!isNaN(newValue)) {
                                                    handleParamChange(index, newValue);
                                                }
                                            }}
                                            className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm
                                                     focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <button
                                            onClick={() => {
                                                const newValue = Math.max(param.min ?? 1, Math.round(value) - 1);
                                                handleParamChange(index, newValue);
                                            }}
                                            className="bg-gray-600 hover:bg-gray-500 text-white px-3 py-2 rounded text-sm font-bold"
                                        >
                                            -
                                        </button>
                                        <button
                                            onClick={() => {
                                                const newValue = Math.min(param.max ?? 10, Math.round(value) + 1);
                                                handleParamChange(index, newValue);
                                            }}
                                            className="bg-gray-600 hover:bg-gray-500 text-white px-3 py-2 rounded text-sm font-bold"
                                        >
                                            +
                                        </button>
                                    </div>
                                ) : (
                                    // Float-Slider-Steuerung
                                    <input
                                        type="range"
                                        min={param.min ?? 0}
                                        max={param.max ?? Math.PI * 2}
                                        step={param.step ?? 0.01}
                                        value={value}
                                        onChange={(e) => {
                                            const newValue = parseFloat(e.target.value);
                                            if (!isNaN(newValue)) {
                                                handleParamChange(index, newValue);
                                            }
                                        }}
                                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer 
                                                 focus:outline-none focus:ring-2 focus:ring-blue-500
                                                 [&::-webkit-slider-thumb]:appearance-none
                                                 [&::-webkit-slider-thumb]:w-4
                                                 [&::-webkit-slider-thumb]:h-4
                                                 [&::-webkit-slider-thumb]:bg-white
                                                 [&::-webkit-slider-thumb]:rounded-full
                                                 [&::-webkit-slider-thumb]:shadow-lg
                                                 [&::-webkit-slider-thumb]:hover:bg-gray-100
                                                 [&::-moz-range-thumb]:w-4
                                                 [&::-moz-range-thumb]:h-4
                                                 [&::-moz-range-thumb]:bg-white
                                                 [&::-moz-range-thumb]:rounded-full
                                                 [&::-moz-range-thumb]:border-0
                                                 [&::-moz-range-thumb]:shadow-lg
                                                 [&::-moz-range-thumb]:hover:bg-gray-100"
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
