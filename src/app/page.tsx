'use client';

export default function Home() {
    return (
        <main className="max-w-2xl mx-auto min-h-screen px-4">
            <div className="flex flex-col min-h-screen py-4 justify-center">
                <div className="flex flex-col gap-12">
                    <div className="flex flex-col gap-4">
                        <h1 className="text-2xl font-semibold">Times up</h1>
                        <p className="text-foreground">
                            Times up is a staggered timer for your live
                            presentation needs. It&apos;s also pretty. Times up
                            will display countdowns for the total duration of
                            your presentation as well as a countdown for the
                            current section of your presentation.
                        </p>
                        <p className="text-foreground">
                            The data to configure a timer is all stored in the
                            link that leads you there, so you&apos;ll only need
                            to set things up once per unique presentation.
                            Enjoy!
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <a
                            className="rounded-md bg-foreground text-background px-3 h-9 flex items-center text-sm hover:bg-foreground/90 transition-colors"
                            href={'/build'}
                        >
                            Get started
                        </a>
                        <a
                            className="rounded-md text-foreground px-3 h-9 flex items-center text-sm border border-input hover:bg-background/90 transition-colors"
                            href={EXAMPLE_TIMER_ROUTE}
                        >
                            See an example timer in action
                        </a>
                    </div>
                    <div className="min-h-[6rem]" />
                </div>
            </div>
        </main>
    );
}

const EXAMPLE_TIMER_ROUTE = `/timer?config=Opening remarks, press play to start!;10;Based on the config, it shows a warning when only 5 seconds are left in each section.;9;This presentation went by fast, hey?;7&warning=5`;
