'use client';

import React, {
    InputHTMLAttributes,
    useEffect,
    useMemo,
    useReducer,
    useState,
} from 'react';
import { v4 as uuidV4 } from 'uuid';
import CloseIcon from '@/../public/close.svg';
import {
    CONFIG_DELIMITER,
    prettyFormatSeconds,
    SECONDS_IN_HOUR,
} from '@/app/util';
import dynamic from 'next/dynamic';
import { Button } from '@/app/(components)/button';

const BuildPage = () => {
    const [state, dispatch] = useReducer(reducer, {
        config: [],
        warningTimeout: { value: '', errors: [] },
    });

    const formHasErrors = useMemo(() => {
        return formStateHasErrors(state);
    }, [state]);

    useEffect(() => {
        dispatch({ type: 'init_config' });
    }, []);

    const [message, setMessage] = useState('');
    useEffect(() => {
        // clear message after 2.5 seconds whenever it is set to anything except empty string
        if (message !== '') {
            setTimeout(() => setMessage(''), 2500);
        }
    }, [message]);

    const totalDurationSeconds = state.config.reduce((acc, curr) => {
        return acc + Number(curr.value.durationInSeconds);
    }, 0);

    return (
        <main className="max-w-2xl mx-auto px-4">
            <div className="flex flex-col gap-4 min-h-screen pt-24 pb-4">
                <div className="flex flex-col gap-2">
                    <h4 className="font-semibold text-2xl">Configuration</h4>
                    <p className="text-sm">
                        This is a handy tool to help you generate the link
                        you&apos;ll need to use our tool. Heads up, the warning
                        threshold determines how close to the end of a section
                        you wish to be warned.
                    </p>
                    <p className="text-sm">
                        Once you&apos;re done, copy the link and open it up when
                        you need to present! The link will work forever 💖.
                    </p>
                </div>
                <div className="flex flex-col gap-6 justify-center">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-foreground/80">
                            Warning threshold (s)
                        </label>
                        <Input
                            type="text"
                            placeholder="30"
                            min={0}
                            max={3600}
                            inputMode="numeric"
                            pattern="\d*"
                            value={state.warningTimeout.value}
                            onChange={(event) => {
                                dispatch({
                                    type: 'edit_warning',
                                    value: event.target.value,
                                });
                            }}
                        />
                        {!!state.warningTimeout.errors.length && (
                            <div className="flex flex-col gap-1 text-sm pl-3 text-red-500">
                                {state.warningTimeout.errors.map(
                                    (error, index) => (
                                        <span key={`error-${index}`}>
                                            *{error}
                                        </span>
                                    )
                                )}
                            </div>
                        )}
                    </div>
                    <div className="min-h-[1px] bg-foreground" />
                    <div className="flex flex-col gap-4">
                        {state.config.map((section) => {
                            return (
                                <div
                                    key={section.value.uuid}
                                    className="flex flex-col gap-2"
                                >
                                    <div className="flex gap-2 items-end">
                                        <div className="flex flex-col gap-1 w-full flex-[2]">
                                            <label className="text-xs font-semibold text-foreground/80">
                                                Section name
                                            </label>
                                            <Input
                                                type="text"
                                                placeholder="Opening remarks"
                                                value={section.value.name}
                                                onChange={(event) => {
                                                    dispatch({
                                                        type: 'edit_section',
                                                        uuid: section.value
                                                            .uuid,
                                                        update: {
                                                            name: event.target
                                                                .value,
                                                        },
                                                    });
                                                }}
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1 w-full flex-[1]">
                                            <label className="text-xs font-semibold text-foreground/80">
                                                Duration (s)
                                            </label>
                                            <Input
                                                type="text"
                                                placeholder="120"
                                                min={0}
                                                max={3600}
                                                inputMode="numeric"
                                                pattern="\d*"
                                                value={
                                                    section.value
                                                        .durationInSeconds
                                                }
                                                onChange={(event) => {
                                                    dispatch({
                                                        type: 'edit_section',
                                                        uuid: section.value
                                                            .uuid,
                                                        update: {
                                                            durationInSeconds:
                                                                event.target
                                                                    .value,
                                                        },
                                                    });
                                                }}
                                            />
                                        </div>
                                        <button
                                            className={`
                                                w-6 h-6 mb-2 flex justify-center items-center rounded-md text-sm transition-colors text-red-600 
                                                sm:w-8 sm:h-8 sm:mb-1
                                                hover:text-white hover:bg-red-600/90 
                                                disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-red-600/50
                                            `}
                                            onClick={() => {
                                                dispatch({
                                                    type: 'remove_section',
                                                    uuid: section.value.uuid,
                                                });
                                            }}
                                        >
                                            <CloseIcon className="w-4 h-4 md:w-6 md:h-6" />
                                        </button>
                                    </div>
                                    {!!section.errors.length && (
                                        <div className="flex flex-col gap-1 text-sm pl-3 text-red-500">
                                            {section.errors.map(
                                                (error, index) => (
                                                    <span
                                                        key={`error-${index}`}
                                                    >
                                                        *{error}
                                                    </span>
                                                )
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    <Button
                        variant="primary"
                        onClick={() => dispatch({ type: 'add_section' })}
                    >
                        Add section
                    </Button>
                    <div className="flex flex-col gap-2">
                        <Button
                            variant="success"
                            onClick={() => {
                                if (formHasErrors) {
                                    setMessage('Please fix the errors first');
                                    return;
                                }
                                navigator.clipboard
                                    .writeText(formStateToUrl(state))
                                    .then(() => {
                                        setMessage('Copied link to clipboard!');
                                    });
                            }}
                            disabled={formHasErrors}
                        >
                            Copy link
                        </Button>
                        <code
                            className={`
                                px-2 py-1 text-foreground text-xs rounded-sm break-words inline
                                ${formHasErrors ? 'bg-red-600/30' : 'bg-green-300/20'}
                            `}
                        >
                            <span className="italic">
                                Presentation duration is{' '}
                                {prettyFormatSeconds(totalDurationSeconds)} and
                                contains {state.config.length} section(s)
                            </span>
                            <br />
                            {formStateToUrl(state)}
                        </code>
                    </div>

                    {message && (
                        <span className="mx-auto text-sm animate-bounce">
                            {message}
                        </span>
                    )}
                    <div className="flex flex-col gap-2"></div>
                </div>
            </div>
        </main>
    );
};

// fixme: this was annoying, see https://nextjs.org/docs/messages/prerender-error
export default dynamic(() => Promise.resolve(BuildPage), {
    ssr: false,
});

type Action =
    | {
          type: 'init_config';
      }
    | {
          type: 'add_section';
      }
    | {
          type: 'edit_section';
          uuid: string;
          update: Partial<FormState['config'][number]['value']>;
      }
    | {
          type: 'remove_section';
          uuid: string;
      }
    | {
          type: 'edit_warning';
          value: string;
      };
function reducer(state: FormState, action: Action): FormState {
    if (action.type === 'init_config') {
        if (state.config.length > 0) {
            return state;
        }
        return {
            ...state,
            config: [
                ...state.config,
                { value: formConfigFactory(), errors: [] },
            ],
        };
    }

    if (action.type === 'remove_section') {
        return {
            ...state,
            config: state.config.filter(
                (section) => section.value.uuid !== action.uuid
            ),
        };
    }

    if (action.type === 'add_section') {
        return {
            ...state,
            config: [
                ...state.config,
                { value: formConfigFactory(), errors: [] },
            ],
        };
    }

    if (action.type === 'edit_section') {
        return {
            ...state,
            config: state.config.map((section) => {
                if (section.value.uuid !== action.uuid) return section;

                const newSectionValue = {
                    ...section.value,
                    ...action.update,
                };

                const errors = errorsForSection(newSectionValue);

                return {
                    ...section,
                    value: newSectionValue,
                    errors,
                };
            }),
        };
    }

    if (action.type === 'edit_warning') {
        return {
            ...state,
            warningTimeout: {
                value: action.value,
                errors: errorsForTimeout(action.value),
            },
        };
    }

    return state;
}

const formConfigFactory = (): FormState['config'][number]['value'] => {
    return {
        uuid: uuidV4(),
        name: '',
        durationInSeconds: '',
    };
};

const formStateHasErrors = (state: FormState): boolean => {
    return (
        state.config.some((section) => !!section.errors.length) ||
        !!state.warningTimeout.errors.length
    );
};

const formStateToUrl = (state: FormState): string => {
    const searchParams = new URLSearchParams({
        config: state.config.reduce((acc, curr) => {
            return `${acc}${encodeURIComponent(curr.value.name)}${CONFIG_DELIMITER}${curr.value.durationInSeconds}${CONFIG_DELIMITER}`;
        }, ''),
        warning: state.warningTimeout.value,
    });
    return `${window.origin}/timer?${searchParams.toString()}`;
};

const errorsForSection = (
    sectionValue: FormState['config'][number]['value']
): string[] => {
    const errors = [];
    if (!sectionValue.name) {
        errors.push('Name is required');
    }

    if (!sectionValue.durationInSeconds.length) {
        errors.push('Duration is required');
        return errors;
    }

    const duration = Number(sectionValue.durationInSeconds);
    if (isNaN(duration)) {
        errors.push('Duration must be a valid number of seconds');
        return errors;
    }
    if (duration <= 0) {
        errors.push('Duration cannot be negative');
    }
    if (duration > SECONDS_IN_HOUR) {
        errors.push('Duration cannot exceed 1 hour of time');
    }

    return errors;
};

const errorsForTimeout = (
    _warningTimeoutValue: FormState['warningTimeout']['value']
): string[] => {
    const errors: string[] = [];
    if (!_warningTimeoutValue) {
        return errors;
    }

    const warningTimeoutValue = Number(_warningTimeoutValue);
    if (isNaN(warningTimeoutValue)) {
        errors.push('Warning threshold must be a valid number of seconds');
        return errors;
    }
    if (warningTimeoutValue <= 0) {
        errors.push('Warning threshold cannot be negative');
    }
    if (warningTimeoutValue > SECONDS_IN_HOUR) {
        errors.push('Warning threshold cannot exceed 1 hour of time');
    }

    return errors;
};

type Field<
    T extends
        | string
        | number
        | boolean
        | Record<string, string | number | boolean>,
> = {
    value: T;
    errors: string[];
};

interface FormState {
    config: Field<{ uuid: string; name: string; durationInSeconds: string }>[];
    warningTimeout: Field<string>;
}

const Input = ({
    className,
    ...props
}: InputHTMLAttributes<HTMLInputElement>) => {
    return (
        <input
            className={`
                flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background 
                file:border-0 file:bg-transparent file:text-sm file:font-medium 
                placeholder:text-muted-foreground 
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 
                disabled:cursor-not-allowed disabled:opacity-50 
                ${className}
            `}
            {...props}
        />
    );
};
