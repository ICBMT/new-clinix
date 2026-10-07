import { CustomSwitch } from '@/components/ui/custom-switch';
import { useState } from 'react';

// Example component showing different CustomSwitch variations
export function SwitchExamples() {
    const [basicSwitch, setBasicSwitch] = useState(false);
    const [smallSwitch, setSmallSwitch] = useState(true);
    const [largeSwitch, setLargeSwitch] = useState(false);
    const [noIconsSwitch, setNoIconsSwitch] = useState(true);

    return (
        <div className="space-y-6 p-6">
            <h2 className="text-xl font-semibold">Custom Switch Examples</h2>
            
            {/* Basic Switch */}
            <div className="flex items-center gap-4">
                <CustomSwitch
                    checked={basicSwitch}
                    onCheckedChange={setBasicSwitch}
                />
                <span>Basic Switch</span>
            </div>

            {/* Small Switch */}
            <div className="flex items-center gap-4">
                <CustomSwitch
                    checked={smallSwitch}
                    onCheckedChange={setSmallSwitch}
                    size="sm"
                />
                <span>Small Switch</span>
            </div>

            {/* Large Switch */}
            <div className="flex items-center gap-4">
                <CustomSwitch
                    checked={largeSwitch}
                    onCheckedChange={setLargeSwitch}
                    size="lg"
                />
                <span>Large Switch</span>
            </div>

            {/* Switch without Icons */}
            <div className="flex items-center gap-4">
                <CustomSwitch
                    checked={noIconsSwitch}
                    onCheckedChange={setNoIconsSwitch}
                    showIcons={false}
                />
                <span>No Icons Switch</span>
            </div>

            {/* Switch with Label */}
            <CustomSwitch
                checked={basicSwitch}
                onCheckedChange={setBasicSwitch}
                label="Switch with Label"
                labelPosition="right"
            />

            {/* Disabled Switch */}
            <div className="flex items-center gap-4">
                <CustomSwitch
                    checked={true}
                    onCheckedChange={() => {}}
                    disabled={true}
                />
                <span>Disabled Switch</span>
            </div>
        </div>
    );
}
