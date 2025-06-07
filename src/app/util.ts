const SECONDS_IN_HOUR = 60 * 60;

/**
 * This is the delimiter separating each segment of the config, as
 * provided by a search parameter string.
 * The pattern is <name><delimiter><duration><delimiter> repeated.
 *
 * If the delimiter is ";", then a valid config string could be "name1;100;name2;200"
 */
const CONFIG_DELIMITER = ';';

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

export { SECONDS_IN_HOUR, CONFIG_DELIMITER, prettyFormatSeconds };
