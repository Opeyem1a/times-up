import { useSearchParams } from 'next/navigation';

export const useSlideDataFromSearchParams = (): ExpectedSearchParams | null => {
    const searchParams = useSearchParams();
    const rawSlideConfigString = searchParams.get('config');

    if (!rawSlideConfigString) {
        return null;
    }

    const split = rawSlideConfigString.split(CONFIG_DELIMITER);

    if (split.length % 2 !== 0) {
        return null;
    }

    // fixme: this might be more trouble than it's worth
    /**
     * this takes an array like [A, B, C, D] and converts it to [[A, B], [C, D]]
     */
    const reduction = split.reduce(
        (acc, curr) => {
            const last = acc.at(-1);
            if (acc.length === 0 || last.length === 2) return [...acc, [curr]];
            if (last.length === 1)
                return [...acc.slice(0, -1), [...last, curr]];
        },
        [] as [string, string][]
    );

    const mapped = reduction.map(([name, durationInSeconds]) => {
        // todo: double check casting here, validate too
        return [String(name), Number(durationInSeconds)];
    });

    const reductionAgain = mapped.reduce(
        (acc, [name, durationInSeconds]) => {
            return [...acc, { name, durationInSeconds }];
        },
        [] as ExpectedSearchParams['config']
    );

    return {
        config: reductionAgain,
        warningTimeoutSeconds: null,
    };
};

export type ExpectedSearchParams = {
    config: {
        name: string;
        durationInSeconds: number;
    }[];
    warningTimeoutSeconds: number | null;
};

/**
 * This is the delimiter separating each segment of the config, as
 * provided by a search parameter string.
 * The pattern is <name><delimiter><duration><delimiter> repeated.
 *
 * If the delimiter is ";", then a valid config string could be "name1;100;name2;200"
 */
const CONFIG_DELIMITER = ';';

/*
Ideas:
[ "qofboqi rfbqoif wef==100" ] -> Requires string processing
[ { name: "qofboqi rfbqoif wef", duration: 100 } ] -> is kinda verbose as a query param tbh (consider 60 slide context)
{ 'qofboqi rfbqoif wef': 100 } -> objects are not intrinsically ordered
['qofboqi rfbqoif wef'; 100; 'something else'; 200] -> feels okay, array processing feels nicer, no special symbols too
 */
