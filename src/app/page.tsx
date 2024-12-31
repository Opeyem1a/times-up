'use client';

import { Dispatch, SetStateAction, useEffect, useMemo, useState } from 'react';
import {
    ExpectedSearchParams,
    useSectionDataFromSearchParams,
} from '@/app/hooks/useSectionDataFromSearchParams';
import PauseIcon from '@/../public/pause.svg';
import PlayIcon from '@/../public/play.svg';
import ReplayIcon from '@/../public/replay.svg';

export default function Home() {
    const result = useSectionDataFromSearchParams();
    if (!result.success) {
        // todo: make the error component look nice
        return (
            <div>
                {result.error.map((error, index) => (
                    <span key={`error-${index}`}>{error}</span>
                ))}
            </div>
        );
    }

    const { config, warningTimeoutSeconds } = result.data;

    return (
        <main className="max-w-2xl mx-auto min-h-screen p-4">
            <div className="flex flex-col min-h-screen justify-center">
                <HomeWithValidData
                    config={config}
                    warningTimeoutSeconds={warningTimeoutSeconds}
                />
            </div>
        </main>
    );
}

const HomeWithValidData = ({
    config,
    warningTimeoutSeconds,
}: ExpectedSearchParams) => {
    const totalDuration = config.reduce(
        (acc, curr) => acc + curr.durationInSeconds,
        0
    );
    const [totalSecondsRemaining, setTotalSecondsRemaining] =
        useState(totalDuration);
    const [isPaused, setIsPaused] = useState(true);

    const currentSection = useMemo(() => {
        let potentialDurationAccumulated = 0;
        for (const entry of config) {
            potentialDurationAccumulated += entry.durationInSeconds;
            if (
                totalSecondsRemaining >
                totalDuration - potentialDurationAccumulated
            ) {
                return entry;
            }
        }

        return null;
    }, [config, totalDuration, totalSecondsRemaining]);

    const secondsToNextSection = useMemo(() => {
        const reversedConfig = [...config].reverse();

        let counter = 0;
        for (const entry of reversedConfig) {
            counter += entry.durationInSeconds;
            if (totalSecondsRemaining <= counter) {
                return (
                    totalSecondsRemaining - (counter - entry.durationInSeconds)
                );
            }
        }

        return 0;
    }, [config, totalSecondsRemaining]);

    return (
        <div className="flex flex-col gap-12">
            {currentSection === null ? (
                <div className="p-6 bg-yellow-200 text-yellow-900 rounded-lg items-center justify-center">
                    <p className="text-lg">All done!</p>
                </div>
            ) : (
                <Countdown
                    currSecondsRemaining={totalSecondsRemaining}
                    currSectionSecondsRemaining={secondsToNextSection}
                    currSectionName={currentSection.name}
                    shouldIndicateWarning={
                        Boolean(warningTimeoutSeconds ?? undefined) &&
                        secondsToNextSection <= warningTimeoutSeconds
                    }
                    setTotalSecondsRemaining={setTotalSecondsRemaining}
                    isPaused={isPaused}
                />
            )}
            <Controls
                isPaused={isPaused}
                onStart={() => setIsPaused(false)}
                onPause={() => setIsPaused(true)}
                onReset={() => {
                    setTotalSecondsRemaining(totalDuration);
                    setIsPaused(true);
                }}
            />
        </div>
    );
};

interface CountdownProps {
    currSecondsRemaining: number;
    currSectionSecondsRemaining: number;
    currSectionName: string;
    shouldIndicateWarning: boolean;
    setTotalSecondsRemaining: Dispatch<SetStateAction<number>>;
    isPaused: boolean;
}
const Countdown = ({
    currSecondsRemaining,
    currSectionSecondsRemaining,
    currSectionName,
    shouldIndicateWarning,
    setTotalSecondsRemaining,
    isPaused,
}: CountdownProps) => {
    useEffect(() => {
        let interval;

        if (!isPaused) {
            interval = setInterval(
                () => setTotalSecondsRemaining((prev) => prev - 1),
                1000
            );
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isPaused, setTotalSecondsRemaining]);

    return (
        <div className="flex flex-col gap-4">
            <div
                className={`p-6 bg-foreground text-background rounded-lg flex flex-col gap-1 justify-center`}
            >
                <p className="text-sm text-gray-500">Current section</p>
                <p className="text-3xl">{currSectionName}</p>
            </div>
            <div className="flex gap-4">
                <div
                    className={`${shouldIndicateWarning ? 'motion-safe:animate-pulse bg-orange-400 text-orange-900' : 'bg-green-300 text-green-900'} p-6 rounded-lg flex-[4] flex flex-col gap-1 justify-start transition-colors`}
                >
                    <span className="text-sm">Next section in</span>
                    <p className="text-5xl">
                        {prettyFormatSeconds(currSectionSecondsRemaining)}
                    </p>
                </div>
                <div className="p-6 bg-blue-300 text-blue-900 rounded-lg flex-[1] flex flex-col gap-1 justify-start">
                    <span className="text-sm">Time remaining</span>
                    <p className="text-4xl">
                        {prettyFormatSeconds(currSecondsRemaining)}
                    </p>
                </div>
            </div>
        </div>
    );
};

interface ControlsProps {
    isPaused: boolean;
    onStart: () => void;
    onPause: () => void;
    onReset: () => void;
}
const Controls = ({ isPaused, onStart, onPause, onReset }: ControlsProps) => {
    return (
        <div className="flex gap-2 p-2 rounded-lg items-center bg-foreground/20 mx-auto">
            <button
                className="rounded-md bg-foreground text-background px-3 h-9 text-sm hover:bg-foreground/90 data-[is-active=true]:bg-background/70 data-[is-active=true]:text-foreground transition-colors"
                onClick={onStart}
                data-is-active={!isPaused}
            >
                <PlayIcon className="w-6 h-6" />
            </button>
            <button
                className="rounded-md bg-foreground text-background px-3 h-9 text-sm hover:bg-foreground/90 data-[is-active=true]:bg-background/70 data-[is-active=true]:text-foreground transition-colors"
                onClick={onPause}
                data-is-active={isPaused}
            >
                <PauseIcon className="w-6 h-6" />
            </button>
            <button
                className="rounded-md bg-foreground text-background px-3 h-9 text-sm hover:bg-foreground/90 transition-colors"
                onClick={onReset}
            >
                <ReplayIcon className="w-6 h-6" />
            </button>
        </div>
    );
};

/**
 * Formats time in an MM:SS format
 * If the number of seconds is beyond an hour, formats in HH:MM:SS instead
 */
const prettyFormatSeconds = (seconds: number): string => {
    if (seconds > 60 * 60) {
        // include hour timer
        return new Date(seconds * 1000).toISOString().substring(11, 19);
    }
    return new Date(seconds * 1000).toISOString().substring(14, 19);
};
