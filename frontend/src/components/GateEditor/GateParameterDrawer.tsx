import { useState, useEffect } from 'react';
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerFooter,
    DrawerTitle,
    DrawerClose
} from '@/components/ui/drawer';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { GATE_DEFS } from '@/constants/gates';

interface GateParameterDrawerProps {
    gate: any;
    open: boolean;
    onClose: () => void;
    onSave: (updates: any) => void;
}

export default function GateParameterDrawer({
    gate,
    open,
    onClose,
    onSave
}: GateParameterDrawerProps) {
    const [values, setValues] = useState<number[]>([]);

    /* 当切换 gate 时同步初值 */
    useEffect(() => {
        if (!gate) return;
        const def = GATE_DEFS[gate.type];
        const initVals =
            gate.params ??
            def.params.map((p: any) => p.default ?? 0);
        setValues(initVals);
    }, [gate?.id]);

    if (!gate) return null;

    const def = GATE_DEFS[gate.type];

    return (
        <Drawer open={open} onOpenChange={onClose} direction="right">
            <DrawerContent className="fixed right-0 h-full w-[300px] border-l" side="right">
                <DrawerHeader className="border-b">
                    <DrawerTitle className="text-lg">
                        {def.label} 参数设置
                    </DrawerTitle>
                </DrawerHeader>

                {/* ---- 参数输入 ---- */}
                {def.params.length ? (
                    <div className="flex flex-col gap-4 p-4">
                        {def.params.map((p: any, idx: number) => (
                            <div key={p.key} className="flex flex-col gap-1">
                                <Label>{p.label}</Label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="range"
                                        step={p.step ?? 0.01}
                                        min={p.min}
                                        max={p.max}
                                        value={values[idx]}
                                        onChange={e => {
                                            const v = parseFloat(e.target.value);
                                            setValues(vals =>
                                                vals.map((t, i) => (i === idx ? v : t))
                                            );
                                        }}
                                        className="flex-1"
                                    />
                                    <Input
                                        type="number"
                                        step={p.step ?? 0.01}
                                        min={p.min}
                                        max={p.max}
                                        value={values[idx]}
                                        onChange={e => {
                                            const v = parseFloat(e.target.value);
                                            setValues(vals =>
                                                vals.map((t, i) => (i === idx ? v : t))
                                            );
                                        }}
                                        className="w-20"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="p-4 text-sm text-gray-500">
                        此门无可编辑参数。
                    </p>
                )}

                <DrawerFooter className="border-t mt-auto">
                    <div className="flex justify-between w-full">
                        <Button
                            variant="outline"
                            onClick={onClose}
                        >
                            取消
                        </Button>
                        <Button
                            disabled={!def.params.length}
                            onClick={() => {
                                onSave({ params: values });
                                onClose();
                            }}
                        >
                            保存
                        </Button>
                    </div>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    );
}
