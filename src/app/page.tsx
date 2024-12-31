'use client';

import { Dispatch, SetStateAction, useEffect, useMemo, useState } from 'react';
import {
    ExpectedSearchParams,
    useSlideDataFromSearchParams,
} from '@/app/hooks/useSlideDataFromSearchParams';

export default function Home() {
    const result = useSlideDataFromSearchParams();
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
        <main className="max-w-2xl mx-auto min-h-screen my-24 p-4">
            <HomeWithValidData
                config={config}
                warningTimeoutSeconds={warningTimeoutSeconds}
            />
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

    const currentSlide = useMemo(() => {
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

    const secondsToNextSlide = useMemo(() => {
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

    if (currentSlide === null) {
        return (
            <div className="p-6 bg-yellow-200 text-yellow-900 rounded-lg items-center justify-center">
                <p className="text-lg">All done!</p>
            </div>
        );
    }

    return (
        <Countdown
            currSecondsRemaining={totalSecondsRemaining}
            currSlideSecondsRemaining={secondsToNextSlide}
            currSlideName={currentSlide.name}
            shouldIndicateWarning={
                Boolean(warningTimeoutSeconds ?? undefined) &&
                secondsToNextSlide <= warningTimeoutSeconds
            }
            setTotalSecondsRemaining={setTotalSecondsRemaining}
        />
    );
};

type CountdownProps = {
    currSecondsRemaining: number;
    currSlideSecondsRemaining: number;
    currSlideName: string;
    shouldIndicateWarning: boolean;
    setTotalSecondsRemaining: Dispatch<SetStateAction<number>>;
};
const Countdown = ({
    currSecondsRemaining,
    currSlideSecondsRemaining,
    currSlideName,
    shouldIndicateWarning,
    setTotalSecondsRemaining,
}: CountdownProps) => {
    useEffect(() => {
        const interval = setInterval(
            () => setTotalSecondsRemaining((prev) => prev - 1),
            1000
        );

        return () => {
            clearInterval(interval);
        };
    }, [setTotalSecondsRemaining]);

    return (
        <div className="flex flex-col gap-4">
            <div
                className={`p-6 bg-foreground text-background rounded-lg flex flex-col gap-1 justify-center`}
            >
                <p className="text-sm text-gray-500">Current slide:</p>
                <p className="text-3xl">{currSlideName}</p>
            </div>
            <div className="flex gap-4">
                <div
                    className={`${shouldIndicateWarning && 'motion-safe:animate-pulse bg-orange-200'} p-6 bg-green-300 text-green-900 rounded-lg flex-[4] flex flex-col gap-1 justify-center transition-colors`}
                >
                    <span className="text-sm">Time to next slide</span>
                    <p className="text-5xl">
                        {prettyFormatSeconds(currSlideSecondsRemaining)}
                    </p>
                </div>
                <div className="p-6 bg-blue-300 text-blue-900 rounded-lg flex-[1] flex flex-col gap-1 justify-center">
                    <span className="text-sm">Total time remaining</span>
                    <p className="text-xl">
                        {prettyFormatSeconds(currSecondsRemaining)}
                    </p>
                </div>
            </div>
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
