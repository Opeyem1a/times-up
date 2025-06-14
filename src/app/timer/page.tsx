'use client';

import {
    Dispatch,
    SetStateAction,
    Suspense,
    useEffect,
    useMemo,
    useState,
} from 'react';
import {
    ExpectedSearchParams,
    useSectionDataFromSearchParams,
} from '@/app/hooks/useSectionDataFromSearchParams';
import PauseIcon from '@/../public/pause.svg';
import PlayIcon from '@/../public/play.svg';
import ReplayIcon from '@/../public/replay.svg';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/app/(components)/button';
import { prettyFormatSeconds } from '@/app/util';
import NoSleep from 'nosleep.js';

export default function PlayPage() {
    // fixme: this was annoying, see https://nextjs.org/docs/messages/missing-suspense-with-csr-bailout
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <HomeInSuspense />
        </Suspense>
    );
}

const HomeInSuspense = () => {
    const result = useSectionDataFromSearchParams();
    const searchParams = useSearchParams();

    const parsedParams = decodeURIComponent(searchParams.toString());

    return (
        <main className="max-w-2xl mx-auto min-h-screen px-4">
            <div className="flex flex-col min-h-screen py-4 justify-center">
                {result.success ? (
                    <HomeWithValidData
                        config={result.data.config}
                        warningTimeoutSeconds={
                            result.data.warningTimeoutSeconds
                        }
                    />
                ) : (
                    <div className="flex flex-col gap-4 pt-12">
                        <h4 className="text-lg font-semibold">
                            😬 Uh-oh, we can&apos;t interpret this format
                            properly
                        </h4>
                        <div className="flex flex-col gap-2 text-orange-700 dark:text-orange-400">
                            {result.error.map((error, index) => (
                                <span key={`error-${index}`}>{error}</span>
                            ))}
                        </div>
                        {parsedParams && (
                            <code className="px-2 py-1 bg-foreground/20 text-foreground text-sm rounded-md break-words inline">
                                {parsedParams}
                            </code>
                        )}
                    </div>
                )}
                <div className="min-h-[4rem]" />
            </div>
        </main>
    );
};

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

    const secondsRemainingIncludingEntireCurrentSection = useMemo(() => {
        if (!currentSection) return totalDuration;
        return (
            totalSecondsRemaining -
            secondsToNextSection +
            currentSection.durationInSeconds
        );
    }, [
        totalDuration,
        totalSecondsRemaining,
        secondsToNextSection,
        currentSection,
    ]);

    const noSleep = useMemo(() => {
        return new NoSleep();
    }, []);

    useEffect(
        function disableNoSleepWhenPresentationEnds() {
            if (currentSection !== null) return;
            if (!noSleep.isEnabled) return;
            noSleep.disable();
        },
        [noSleep, currentSection]
    );

    return (
        <div className="flex flex-col gap-12">
            {currentSection === null ? (
                <div className="flex mx-auto px-6 py-4 bg-foreground/10 text-foreground rounded-lg items-center justify-center">
                    <p className="text-lg">All done!</p>
                </div>
            ) : (
                <Countdown
                    currSecondsRemaining={totalSecondsRemaining}
                    currSectionSecondsRemaining={secondsToNextSection}
                    currSectionName={currentSection.name}
                    shouldIndicateWarning={
                        !!warningTimeoutSeconds &&
                        secondsToNextSection <= warningTimeoutSeconds
                    }
                    setTotalSecondsRemaining={setTotalSecondsRemaining}
                    restartSection={() => {
                        setTotalSecondsRemaining(
                            secondsRemainingIncludingEntireCurrentSection
                        );
                    }}
                    isPaused={isPaused}
                />
            )}
            <Controls
                isPaused={isPaused}
                onStart={() => {
                    setIsPaused(false);
                    noSleep.enable();
                }}
                onPause={() => setIsPaused(true)}
                onReset={() => {
                    setTotalSecondsRemaining(totalDuration);
                    setIsPaused(true);
                    noSleep.disable();
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
    restartSection: () => void;
    isPaused: boolean;
}
const Countdown = ({
    currSecondsRemaining,
    currSectionSecondsRemaining,
    currSectionName,
    shouldIndicateWarning,
    setTotalSecondsRemaining,
    restartSection,
    isPaused,
}: CountdownProps) => {
    useEffect(() => {
        let interval: NodeJS.Timeout;

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
        <div className="flex flex-col gap-2 sm:gap-4">
            <div
                className={`p-6 bg-foreground text-background rounded-lg flex flex-col gap-1 justify-center`}
            >
                <p className="text-sm text-gray-500">Current section</p>
                <p className="text-3xl">{currSectionName}</p>
            </div>
            <div className="flex gap-2 sm:gap-4 flex-col sm:flex-row">
                <div
                    className={`${shouldIndicateWarning ? 'motion-safe:animate-pulse bg-orange-400 text-orange-900' : 'bg-green-300 text-green-900'} p-6 rounded-lg flex-[4] flex justify-between gap-2 transition-colors`}
                >
                    <div className="flex flex-col gap-1 justify-start">
                        <span className="text-sm">Next section in</span>
                        <p className="text-5xl">
                            {prettyFormatSeconds(currSectionSecondsRemaining)}
                        </p>
                    </div>
                    <button
                        className="rounded-md mb-auto bg-white/40 text-black/70 p-2 text-sm hover:bg-white/70 transition-colors"
                        onClick={() => restartSection()}
                    >
                        <ReplayIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="px-6 py-4 sm:py-6 bg-blue-300 text-blue-900 rounded-lg flex-[1] flex flex-col sm:gap-1 justify-end">
                    <span className="text-sm ">Time remaining</span>
                    <p className="text-2xl sm:text-4xl">
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
            <Button variant={isPaused ? 'primary' : 'active'} onClick={onStart}>
                <PlayIcon className="w-6 h-6" />
            </Button>
            <Button variant={isPaused ? 'active' : 'primary'} onClick={onPause}>
                <PauseIcon className="w-6 h-6" />
            </Button>
            <Button variant="primary" onClick={onReset}>
                <ReplayIcon className="w-6 h-6" />
            </Button>
            <a
                className="rounded-md bg-foreground text-background px-3 h-9 flex items-center text-sm hover:bg-foreground/90 transition-colors"
                href={'/build'}
            >
                New timer
            </a>
        </div>
    );
};
