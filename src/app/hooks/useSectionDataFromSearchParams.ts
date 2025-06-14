import { useSearchParams } from 'next/navigation';
import { CONFIG_DELIMITER, SECONDS_IN_HOUR } from '@/app/util';

export const useSectionDataFromSearchParams = (): SafeParseResult<
    ExpectedSearchParams,
    string[]
> => {
    const searchParams = useSearchParams();
    const rawSectionConfigString = searchParams.get('config');
    const rawWarningTimeoutString = searchParams.get('warning');

    return safeParseParams({
        rawConfig: rawSectionConfigString,
        rawWarningTimeout: rawWarningTimeoutString,
    });
};

export type ExpectedSearchParams = {
    config: {
        name: string;
        durationInSeconds: number;
    }[];
    warningTimeoutSeconds: number | null;
};

type SafeParseResult<T, E> =
    | { success: true; data: T }
    | { success: false; error: E };
const safeParseParams = ({
    rawConfig,
    rawWarningTimeout,
}: {
    rawConfig: string | null;
    rawWarningTimeout: string | null;
}): SafeParseResult<ExpectedSearchParams, string[]> => {
    if (!rawConfig) {
        return {
            success: false,
            error: ['Config is a required parameter'],
        };
    }

    const split = rawConfig
        .split(CONFIG_DELIMITER)
        .filter((block) => block !== '');
    if (split.length % 2 !== 0) {
        return {
            success: false,
            error: [
                'Config does not meet the expected format (e.g. "Title;100;Second title;200" etc)',
            ],
        };
    }

    const parsedConfigs = (
        split.reduce(
            /**
             * this takes an array like [A, B, C, D] and converts it to [[A, B], [C, D]]
             */
            // @ts-expect-error - typescript is supremely confused about this line
            (acc: [string, string][], curr: string) => {
                const last = acc.at(-1);
                if (!last) return [...acc, [curr]];
                if (acc.length === 0 || last.length === 2)
                    return [...acc, [curr]];
                if (last.length === 1)
                    return [...acc.slice(0, -1), [...last, curr]];
            },
            [] as [string, string][]
            // @unsafe - typescript was being silly
        ) as unknown as [string, string][]
    ).map(([name, durationInSeconds]) => {
        return {
            name: String(decodeURIComponent(name)),
            durationInSeconds: Number(durationInSeconds),
        };
    });

    const errorsFromConfigs = (
        parsedConfigs as { durationInSeconds: number; name: string }[]
    ).reduce((acc, config) => {
        const errors = [];
        if (isNaN(config.durationInSeconds)) {
            errors.push('Section durations must be a valid number of seconds');
        }
        if (config.durationInSeconds > SECONDS_IN_HOUR) {
            errors.push('Section durations cannot exceed 1 hour of time');
        }
        if (config.durationInSeconds <= 0) {
            errors.push('Section durations cannot be negative.');
        }

        return [...acc, ...errors];
    }, [] as string[]);

    if (errorsFromConfigs.length) {
        return {
            success: false,
            error: errorsFromConfigs,
        };
    }

    if (!rawWarningTimeout) {
        return {
            success: true,
            data: {
                config: parsedConfigs,
                warningTimeoutSeconds: null,
            },
        };
    }

    const parsedWarningTimeout = Number(rawWarningTimeout);
    if (isNaN(parsedWarningTimeout)) {
        return {
            success: false,
            error: ['Warning threshold must be a valid number of seconds'],
        };
    }

    if (parsedWarningTimeout <= 0) {
        return {
            success: false,
            error: ['Warning threshold cannot be negative.'],
        };
    }

    /**
     * Note that the warning timeout can exceed the duration of an individual section.
     * This would mean the section would show up already having a warning indication.
     */
    if (parsedWarningTimeout > SECONDS_IN_HOUR) {
        return {
            success: false,
            error: [
                'Warning threshold must be a valid number of seconds that does not exceed 1 hour of time',
            ],
        };
    }

    return {
        success: true,
        data: {
            config: parsedConfigs,
            warningTimeoutSeconds: parsedWarningTimeout,
        },
    };
};
