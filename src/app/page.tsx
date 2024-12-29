'use client';

import { Dispatch, SetStateAction, useEffect, useMemo, useState } from 'react';
import {
    ExpectedSearchParams,
    useSlideDataFromSearchParams,
} from '@/app/hooks/useSlideDataFromSearchParams';

export default function Home() {
    const result = useSlideDataFromSearchParams();
    if (result === null) return null;

    const { config, warningTimeoutSeconds } = result;

    return (
        <HomeWithValidData
            config={config}
            warningTimeoutSeconds={warningTimeoutSeconds}
        />
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
    }, [config, totalSecondsRemaining]);

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
        return <div>COMPLETE</div>;
    }

    return (
        <Countdown
            currSecondsRemaining={totalSecondsRemaining}
            currSlideSecondsRemaining={secondsToNextSlide}
            currSlideName={currentSlide.name}
            setTotalSecondsRemaining={setTotalSecondsRemaining}
        />
    );
};

type CountdownProps = {
    currSecondsRemaining: number;
    currSlideSecondsRemaining: number;
    currSlideName: string;
    setTotalSecondsRemaining: Dispatch<SetStateAction<number>>;
};
const Countdown = ({
    currSecondsRemaining,
    currSlideSecondsRemaining,
    currSlideName,
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
    }, []);

    return (
        <div className="max-w-[]">
            <h4>{currSlideName}</h4>
            <p>
                Time to next slide:{' '}
                {prettyFormatSeconds(currSlideSecondsRemaining)}
            </p>
            <p>
                Total time remaining:{' '}
                {prettyFormatSeconds(currSecondsRemaining)}
            </p>
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
