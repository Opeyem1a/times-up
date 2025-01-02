export const SECONDS_IN_HOUR = 60 * 60;

/**
 * This is the delimiter separating each segment of the config, as
 * provided by a search parameter string.
 * The pattern is <name><delimiter><duration><delimiter> repeated.
 *
 * If the delimiter is ";", then a valid config string could be "name1;100;name2;200"
 */
export const CONFIG_DELIMITER = ';';
